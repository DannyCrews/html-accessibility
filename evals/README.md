# Evals

Two layers, mirroring the pdf-accessibility skill: a fast deterministic check of
the detection layer, and behavioral prompts that exercise the whole skill.

## 1. Deterministic fixture check (fast regression)

`fixtures/fixture-broken.html` has known planted issues; `fixtures/expected.json`
lists the rule ids that must fire. To run:

1. **Load the fixture in a runtime.** Playwright blocks `file://`, so either
   build a `data:` URL from the fixture markup or serve it over http; the
   AppleScript Chrome runtime can open the `file://` path directly.
2. **Run `scripts/axe-run.js`** in the page (inject + run).
3. **Assert:** every id in `mustFire.violations` and `mustFire.bestPractice` is
   present in the run's `violations`, and `incomplete` equals `expectedIncomplete`.

Validated against axe-core 4.12.1 — Playwright MCP and AppleScript Chrome produce
identical results (10 violations). When you bump the pinned axe version in
`scripts/axe-run.js`, re-run and update `expected.json`.

## 2. Behavioral evals (skill-creator style)

`evals.json` holds prompts that exercise the full workflow — audit a live URL,
review a generated component, author accessible markup, and the deterministic
check. `expected_output` describes expected *skill behavior* (runs the tool,
reports honestly, treats `incomplete` as judgment, recommends a manual AT pass),
not just axe output. Run them per the skill-creator eval loop.
