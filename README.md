# Web Accessibility — a Claude skill

A skill that turns Claude into a web accessibility auditor, remediation adviser,
and accessible-by-default author, using [axe-core](https://github.com/dequelabs/axe-core)
(the open engine behind Lighthouse and most commercial checkers) driven in a
**real browser over MCP**. It audits pages and components against WCAG 2.1 AA,
triages what matters, grounds visual judgments by looking at the rendered page,
and — because HTML has no pixel-identity proof like PDF does — proposes fixes as
*advisory* source edits rather than claiming conformance.

Accessible markup, names, contrast, and structure are what assistive-technology
users rely on to use a web page. For institutions that publish on the web,
producing and maintaining them is increasingly a legal and compliance
expectation (WCAG, ADA, Section 508).

It follows the [Agent Skills](https://agentskills.io) open standard. Because
auditing drives an external browser, it works wherever Claude can reach a browser
runtime over MCP — Claude Cowork (desktop app) and Claude Code today (see
Installing). The authoring guidance works anywhere, even without a runtime.

License: **GPL-3.0-or-later**.

## The idea

A common approach in accessibility tooling is to read a page's HTML and offer an
opinion. But a page's accessibility lives in the *rendered* DOM — computed
contrast, focus behavior, resolved ARIA roles, dynamic states — which source
inspection cannot see.

This skill is built on one rule (shared with its sibling `pdf-accessibility`):

> **Deterministic code for detection; LLM judgment only where semantic meaning enters.**

axe-core establishes the facts — violations, and the crucial `incomplete` set of
checks it cannot decide automatically. Claude's judgment is used only where
meaning genuinely enters: writing alt text from the actual image, deciding
whether a flagged contrast pair really fails, judging whether an ARIA pattern is
appropriate, and explaining findings in plain language. Every visual judgment is
grounded by rendering the element (screenshot → look). The model never *detects*
defects itself.

## Two runtimes (both validated)

Auditing needs a browser reachable over MCP. The skill supports two and produces
identical axe output on both:

- **Playwright MCP — preferred.** Repeatable, headless-capable, screenshots any
  element by selector, `bypassCSP`. Blocks `file://` by default.
- **AppleScript "Control Chrome" — fallback.** For authenticated / behind-login
  pages and specific interaction states. Needs the Apple-Events toggle and uses
  an isolated-world eval.

Setup and gotchas: [`references/runtime-setup.md`](references/runtime-setup.md).

## Who it's for

- **Communicators, faculty, and staff** who publish web pages and need to know
  what's wrong and how to fix it, in plain language.
- **Web teams** triaging accessibility across a site or CMS theme (many findings
  live in a shared template — one fix cascades).
- **Developers** who want accessible-by-default markup while generating UI.

## What's in the repo

| Path | What it is |
|---|---|
| `SKILL.md` | The skill itself — the operating instructions Claude loads. |
| `scripts/axe-run.js` | The detection payload: loads axe, runs it, returns the four buckets plus a `needsLook` judgment queue. **Always the first step.** |
| `references/audit-interpretation.md` | axe buckets → severity → triage → the plain-language report template. |
| `references/runtime-setup.md` | Playwright MCP + AppleScript Chrome setup and gotchas. |
| `references/authoring-checklist.md` | Accessible-by-default rules (authoring mode; also the lightweight/shared core). |
| `references/aria-patterns.md` | APG patterns and common anti-patterns. |
| `evals/evals.json` | Behavioral evaluation prompts. |
| `evals/fixtures/` | A deterministic broken fixture + `expected.json` golden rule-id set. |

## Requirements

A browser runtime over MCP (see above). No local install beyond that — axe-core
is fetched at runtime and pinned in `scripts/axe-run.js`.

## Workflow

1. **Confirm the runtime**, then load the page/component (render components first).
2. **Audit** — run `scripts/axe-run.js`. Never opine on accessibility from source
   without running axe on a rendered DOM.
3. **Triage** — rank by impact × reach. Treat `incomplete` as a judgment queue,
   not passes; label best-practice rules honestly (they carry no WCAG criterion).
4. **Render-and-look** — screenshot flagged elements (and open flagged images by
   their `src`) to write alt text and confirm contrast; an annotated full-page
   screenshot shows a reviewer every problem location at once.
5. **Report** — what's wrong → WCAG criterion → who's affected → concrete fix, in
   plain language, with visual cues.
6. **Remediate (advisory)** — propose source edits, re-run axe, show the delta.
   HTML has no pixel-identity proof, so never claim conformance; recommend a human
   keyboard + screen-reader pass as acceptance.

See `SKILL.md` for the full methodology.

## Installing

Auditing needs a browser runtime; the authoring guidance does not.

### Claude Cowork (desktop app)

Zip the contents of this skill folder (the directory containing `SKILL.md`) and
upload via **Customize → Skills → + → Create skill** — or use the bundled
`../package-skill.sh` to build a `.skill` file and install it directly. Configure
a Playwright MCP (or the AppleScript Chrome extension) so Claude can run audits;
see `references/runtime-setup.md`.

### Claude Code

Drop this folder into a skills directory so Claude discovers it in place:

- Personal: `~/.claude/skills/html-accessibility/`
- Project: `.claude/skills/html-accessibility/`

Invoke directly with `/html-accessibility`, or let Claude use it automatically.

### Organization-wide (Claude Team / Enterprise admins)

From **Organization settings → Plugins**: either upload the packaged plugin ZIP,
or mirror it into a **private/internal** GitHub-synced marketplace (public repos
aren't permitted for org marketplaces). This public repo is the open-source
upstream. Eventually this ships alongside `pdf-accessibility` in one
`accessibility` plugin sharing a WCAG core.

## Validated on real pages

- **Deterministic fixture** (`evals/fixtures/`): a 10-violation golden set,
  identical across the Playwright and Chrome runtimes (axe-core 4.12.1).
- **Live capstone**: a full audit of a BU department homepage surfaced real,
  concrete bugs (invalid `aria-role`, low-contrast themed buttons, un-named
  slideshow links) and demonstrated the render-and-look loop end to end,
  including drafting alt text from a slideshow image opened by its source URL.

## What it cannot do

- Automated detection catches ~57% of issues by volume (Deque); keyboard flows,
  screen-reader experience, cognitive load, and dynamic journeys need human
  assistive-technology testing. The skill recommends it, never replaces it.
- The `incomplete` set requires judgment — the skill reasons over it rather than
  passing it silently.
- Remediation is **advisory**: unlike the PDF skill, HTML has no pixel-identity
  proof, so no fix is claimed as conformance.
- axe is a strong **subset** of — not a substitute for — a certified / enterprise
  validator when a formal, site-wide conformance claim is required.

## License

GPL-3.0-or-later. See [`LICENSE`](LICENSE).
