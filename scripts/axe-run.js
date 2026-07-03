/**
 * axe-run.js — the a11y_check detection payload for the html-accessibility skill.
 *
 * WHAT IT IS: deterministic accessibility detection. Loads axe-core into the
 * current page, runs the full ruleset, and returns a compact, report-ready
 * summary. This is the HTML analogue of pdf-accessibility's pdf_a11y_check.py —
 * facts only, no judgment. The judgment layer (render-and-look over the returned
 * `needsLook` selectors) happens AFTER this, in the model.
 *
 * ONE FUNCTION, BOTH RUNTIMES. `a11yAudit()` loads axe with fetch+eval, which
 * works in Playwright's main world AND the AppleScript extension's isolated
 * world. (A page <script> tag would load axe into the main world only, invisible
 * to the isolated world — see ../../spike/SPIKE-REPORT.md.) axe is pinned to
 * 4.12.1. Contrast is covered by axe; no separate tool is needed.
 *
 * HOW TO INVOKE
 *   Playwright MCP (preferred): pass a wrapper to browser_evaluate that inlines
 *   these declarations and awaits the audit — browser_evaluate awaits the
 *   promise, so you get the summary in a single call:
 *       async () => { <declarations from this file> ; return await a11yAudit(); }
 *
 *   AppleScript "Control Chrome": execute_javascript is synchronous and will not
 *   await a promise, so kick + poll:
 *       call 1: <declarations> ; a11yAudit().then(r => window.__a11y = r); 'STARTED'
 *       call N: JSON.stringify(window.__a11y || 'PENDING')
 *
 * CAVEAT: fetch() of axe can be blocked by a strict connect-src CSP. Playwright
 * can be launched with bypassCSP to avoid this; on the Chrome path a hardened
 * site may require pre-bundling axe.
 */

const AXE_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4.12.1/axe.min.js';

// Rule ids whose findings essentially always need the render-and-look loop
// (look at the pixels before writing/deciding). Everything in `incomplete` needs
// eyes by definition and is queued regardless of this list.
const LOOK_RULES = new Set([
  'image-alt', 'input-image-alt', 'area-alt', 'object-alt',
  'color-contrast', 'link-name', 'button-name', 'label'
]);

// Ensure axe is available in the CURRENT JS world. fetch+eval works in both the
// main world (Playwright) and an isolated world (extension). Returns the version.
async function ensureAxe() {
  if (typeof axe !== 'undefined') return axe.version;
  const src = await fetch(AXE_URL).then(r => r.text());
  (0, eval)(src); // indirect eval → defines `axe` on the current world's global
  return (typeof axe !== 'undefined') ? axe.version : null;
}

// Pure: shape raw axe results into a compact, report-ready structure.
function summarizeAxe(results, opts) {
  opts = opts || {};
  const maxNodes = opts.maxNodes || 10;
  const wcagOf = v => (v.tags || []).filter(t => /^wcag\d/.test(t));
  const shapeNode = n => ({
    target: n.target,
    html: (n.html || '').slice(0, 200),
    fix: n.failureSummary || null
  });
  const shape = v => ({
    id: v.id, impact: v.impact, wcag: wcagOf(v),
    help: v.help, helpUrl: v.helpUrl,
    nodeCount: v.nodes.length,
    nodes: v.nodes.slice(0, maxNodes).map(shapeNode)
  });

  // The judgment queue: selectors to screenshot and look at. All `incomplete`
  // nodes, plus violations of rules that need visual confirmation.
  const needsLook = [];
  const addLook = (v, reason) => v.nodes.forEach(n => needsLook.push({
    rule: v.id, reason, wcag: wcagOf(v),
    target: Array.isArray(n.target) ? n.target[0] : n.target
  }));
  results.violations.forEach(v => { if (LOOK_RULES.has(v.id)) addLook(v, 'violation'); });
  results.incomplete.forEach(v => addLook(v, 'incomplete'));

  return {
    url: (typeof location !== 'undefined') ? location.href : null,
    axeVersion: (typeof axe !== 'undefined') ? axe.version : null,
    counts: {
      violations: results.violations.length,
      incomplete: results.incomplete.length,
      passes: results.passes.length,
      inapplicable: results.inapplicable.length
    },
    violations: results.violations.map(shape),
    incomplete: results.incomplete.map(shape),
    needsLook
  };
}

// Load axe (if needed), run the full ruleset against the document, and shape it.
async function a11yAudit(opts) {
  await ensureAxe();
  const results = await axe.run(document, {
    resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable']
  });
  return summarizeAxe(results, opts);
}

// Node/testing export (ignored in the browser).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AXE_URL, LOOK_RULES, ensureAxe, summarizeAxe, a11yAudit };
}
