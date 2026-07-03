---
name: html-accessibility
description: >-
  Audit and remediate web pages and HTML/JSX components for accessibility
  (WCAG 2.1 AA, ARIA) using axe-core in a real browser, and produce
  accessible-by-default markup when authoring UI. Use whenever the user wants to
  check or fix a page, component, or site for accessibility, asks why a page
  fails an accessibility checker, wants alt text, color contrast, or ARIA
  reviewed, mentions screen readers and web content, or is generating HTML/JSX/UI
  that should be accessible. For PDF files, use the pdf-accessibility skill
  instead.
---

# Web Accessibility Audit, Remediation, and Authoring

This skill turns Claude into a web accessibility auditor, remediation adviser,
and accessible-by-default author, using axe-core (the open engine behind
Lighthouse and most commercial checkers) driven in a real browser over MCP.

## The one rule that governs everything (shared with pdf-accessibility)

**Deterministic code for detection; LLM judgment only where meaning enters.**

You cannot assess a page's accessibility by reading its HTML source — contrast,
focus behavior, computed roles, and dynamic states only exist in a *rendered*
DOM. Never offer an opinion on a page's accessibility without running axe first.
People make compliance decisions from these reports; a hallucinated "looks
fine" is worse than no answer.

Where your judgment IS the tool: writing alt text from the rendered image,
deciding whether a flagged contrast pair actually fails, judging whether an ARIA
pattern is appropriate, whether focus/reading order makes sense, and explaining
findings to a non-technical author. Ground every such judgment by rendering the
element (screenshot → look), exactly as the PDF skill renders figures.

## Runtime (required for auditing — this is the big difference from PDF)

Unlike the PDF skill, nothing here runs self-contained in the sandbox: a browser
cannot be installed there. Auditing **orchestrates an external browser over
MCP.** Two runtimes are supported (both validated — identical axe output):

- **Playwright MCP — preferred.** Repeatable, headless-capable, main-world eval,
  supports `bypassCSP`, and can screenshot any element by selector. Blocks
  `file://` by default (serve fixtures over http or allowlist).
- **AppleScript "Control Chrome" — fallback.** Use for authenticated /
  behind-login pages and specific interaction states Playwright can't reach.
  Costs: the "Allow JavaScript from Apple Events" toggle, isolated-world eval,
  synchronous calls (kick + poll), and no native element screenshots.

**Detect which runtime is present before auditing** and say which you used. If
neither is available, you can still give authoring guidance (Mode B) but must
say that checking and fixing are unavailable. Setup and gotchas:
`references/runtime-setup.md`.

## Mode A — audit & remediate an existing page

### 1. Confirm the runtime, then load the target
Playwright: `browser_navigate`. Chrome: `open_url`. For components, render them
first (Storybook/preview URL) — axe needs a mounted DOM.

### 2. Audit (always first)
Run `scripts/axe-run.js` in the page. It loads axe, runs the full ruleset, and
returns `violations / incomplete / passes / inapplicable` plus a `needsLook`
queue (selectors that need the render-and-look loop). Invocation per runtime is
documented at the top of that file (Playwright: one `browser_evaluate`; Chrome:
kick + poll).

### 3. Triage — `incomplete` is not noise
Rank by impact × who's-affected. **Treat `incomplete` as the judgment queue, not
as passes** — on real pages it is often the *largest* bucket (mostly contrast
over images/gradients axe can't compute). Interpretation table and the report
template: `references/audit-interpretation.md`.

### 4. Render-and-look (the judgment layer — where the value is)
For each `needsLook` entry, screenshot that exact element and view it:
- Playwright: `browser_take_screenshot` with `target` = the selector, save under
  a renders folder, then Read the PNG.
- Chrome: no native element capture — fall back to a viewport screenshot or note
  the limitation.

Then write alt text / decide contrast / judge the ARIA pattern from what you
actually see, plus nearby text.

Two techniques that make this sharper:

- **Annotated overview (a visual cue for the reviewer).** Inject a colored
  outline onto every flagged element (color by `impact`: critical/serious/
  moderate), then take a **full-page** screenshot. One image shows a human
  reviewer exactly where every problem sits. Embed it near the top of the report.
- **Images by source, not by element.** For `image-alt`/`link-name` where a link
  or slide wraps an image, the on-page element may be hidden (an inactive carousel
  slide has no rendered size and won't screenshot). Read the image's `src` from
  the DOM and open that URL directly to view the picture, then draft alt from its
  actual content. When the image is the link's only content, the alt should name
  the link's **destination/function** (e.g. `alt="Student laptop loans"`), not
  describe the picture literally.

### 5. Report
Structure every finding as: **what's wrong → which WCAG criterion → who is
affected and how → the concrete fix**, in plain language for a non-developer.
axe supplies most of this per finding (`help`, `helpUrl`, WCAG tags, the CSS
selector, and a `failureSummary` of fixes) — use it. Cite criteria
parenthetically, not as the headline.

**Route findings by who owns the fix.** Separate recurring theme/template issues
(one fix cascades across every page — owned by the site/theme team) from per-page
content issues (alt text, in-content headings/links/tables — owned by the content
author). Watch for a third case — **generated content**: markup inside the content
region but produced by a form/plugin/CMS template (e.g. submission forms that emit
heading-styled entries and un-alt'd image uploads). Location says "content," but
the fix is in code, so it routes to the developer, not the editor; don't hand an
editor hundreds of items they didn't author. For a content-author-facing report
(e.g. a site-launch review), *suppress* the theme issues so the author sees only
their handful of fixable items, not thousands of template occurrences they can't
touch. Routing heuristics (frequency
oracle + single-page location/issue-class) and the audience-scoped report shapes:
`references/audit-interpretation.md`.

### 6. Remediation — advisory only, and honest about it
HTML has **no analogue to the PDF verifier's pixel-identity proof**: structure
and presentation are entangled through CSS/JS, so you cannot prove a fix changed
only structure. Therefore:

1. **Fix at the source.** HTML/JSX almost always has living source someone owns;
   propose edits there, not to rendered output (editing rendered output is the
   web version of hand-editing a delivered PDF — avoid it).
2. **Re-run axe and show the before/after delta** — but state plainly this is a
   regression check against the same tool, not a proof.
3. **Never claim conformance.** Recommend a human assistive-technology pass
   (keyboard + screen reader) as the real acceptance test, and list residuals
   honestly.

## Mode B — authoring-time (accessible by default)

When generating HTML/JSX/UI, apply the accessible-by-default rules **before**
being asked to audit: semantic elements before ARIA ("no ARIA beats bad ARIA"),
accessible names/labels, keyboard operability with visible focus, logical
heading and landmark structure, form-error association, and alt text for
meaningful images. Full checklist: `references/authoring-checklist.md` (this is
also the shared/lightweight core). Self-check when the markup is renderable
standalone: run `scripts/axe-run.js` against it and report residuals.

## What this skill cannot do (state it when relevant)

- Automated detection catches ~57% of issues by volume (Deque); keyboard flows,
  screen-reader experience, cognitive load, and dynamic user journeys still need
  human AT testing. Recommend it; never claim to replace it.
- `incomplete` findings need judgment — reason over them, don't silently pass.
- Remediation is advisory: no pixel-identity proof exists for HTML.
- Auditing needs a reachable browser runtime; without one, only authoring
  guidance is available.
- **Coverage is WCAG 2.1-centric.** axe 4.12.1 is a 2.0/2.1 engine. `axe-run.js`
  additionally enables `target-size` (SC 2.5.8), the one net-new 2.2 rule axe
  ships (disabled by default), but the other net-new 2.2 AA criteria — 2.4.11
  Focus Not Obscured, 2.5.7 Dragging, 3.2.6 Consistent Help, 3.3.7 Redundant
  Entry, 3.3.8 Accessible Authentication — have no axe rule and are not checked.
  Never imply 2.2 conformance.

## Files

- `scripts/axe-run.js` — the detection payload (the `a11y_check` analogue).
- `references/runtime-setup.md` — Playwright MCP + AppleScript Chrome setup and gotchas.
- `references/audit-interpretation.md` — axe buckets → triage → report template (incl. the WCAG mapping).
- `references/aria-patterns.md` — when/how to use ARIA; anti-patterns.
- `references/authoring-checklist.md` — accessible-by-default rules (Mode B / lightweight).
