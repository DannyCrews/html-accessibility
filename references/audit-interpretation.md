# Interpreting axe Results, Triage, and Reporting

How to turn `scripts/axe-run.js` output into an honest, actionable report.
Examples below are real (from an audit of a BU department site).

## The four buckets

axe returns four result sets. Read them in this order:

- **`violations`** — axe is confident the check fails. These are your findings.
- **`incomplete`** — axe could not decide; **this is the judgment queue, not a
  pass.** It is frequently the *largest* bucket by node count (one real page:
  11 contrast violations vs **37** contrast incompletes). Never report these as
  clean. Resolve each with the render-and-look loop.
- **`passes` / `inapplicable`** — context, not action. Useful only to show scope
  ("45 checks passed") and to avoid claiming a check ran that didn't apply.

## Severity: impact × reach

Rank by axe `impact` (critical > serious > moderate > minor) × node count ×
how trafficked/important the page is. The ordering principle matches the PDF
skill: things that make content **unreachable or semantically broken** outrank
things that make it **harder**, which outrank **polish**.

Common rules, in plain language:

| Rule | Impact | What it means | Who it affects | WCAG |
|---|---|---|---|---|
| `image-alt` | critical | Meaningful image has no text alternative | Non-visual users get nothing | 1.1.1 |
| `aria-valid-attr` | critical | Invalid ARIA attribute (e.g. `aria-role="note"` instead of `role="note"`) | Screen readers ignore/mis-handle the semantics | 4.1.2 |
| `aria-allowed-attr` | critical | ARIA attribute not allowed on that element's role | Screen-reader confusion | 4.1.2 |
| `label` | critical | Form control has no associated label | SR/voice users can't identify the field | 4.1.2 / 1.3.1 |
| `button-name` / `link-name` | serious | Control/link has no discernible text | Users can't tell what it does or where it goes | 4.1.2 / 2.4.4 |
| `color-contrast` | serious | Text contrast below the AA threshold | Low-vision, aging eyes, sunlight/screen glare | 1.4.3 |
| `link-in-text-block` | serious | In-text link distinguished by color only | Colorblind users can't find the link | 1.4.1 |
| `heading-order` | moderate | Heading levels skip (h1→h4) | Screen-reader navigation is misleading | *best practice* |
| `region` / `landmark-one-main` / `page-has-heading-one` | moderate | Content outside landmarks / no `<main>` / no h1 | Harder structural navigation | *best practice* |

## Best-practice rules have no WCAG criterion — say so

Some axe rules are tagged `best-practice` rather than a numbered success
criterion; their `wcag` array comes back **empty** (`region`,
`landmark-one-main`, `page-has-heading-one`, `heading-order`, `landmark-unique`).
Report these as *"best practice — not a WCAG 2.1 AA failure."* They are real and
worth fixing, but do **not** invent a criterion for them and do **not** let them
sink a conformance statement. `axe-run.js` exposes this: a finding with an empty
`wcag` array is best-practice.

## WCAG version coverage — state it honestly

axe 4.12.1 is a WCAG **2.0/2.1** engine. `axe-run.js` enables `target-size`
(SC 2.5.8) — the one net-new 2.2 rule axe ships, disabled by default — and routes
it through the judgment queue. No other net-new 2.2 AA criterion has an axe rule,
so the audit does **not** cover 2.4.11 Focus Not Obscured, 2.5.7 Dragging, 3.2.6
Consistent Help, 3.3.7 Redundant Entry, or 3.3.8 Accessible Authentication. When a
Siteimprove scan (which tests 2.2) is the point of comparison, expect it to report
whole categories axe cannot — that gap is structural, not a bug. Never imply 2.2
conformance.

## `incomplete` is where the model earns its keep

Every `incomplete` node needs a human/model call. The two you'll see most:

- **`color-contrast` (incomplete)** — text over an image, gradient, or
  semi-transparent background axe can't sample. Screenshot the element
  (`needsLook` gives the selector), look, and judge whether it's readable.
- **`link-in-text-block`** — decide whether the link has a non-color cue
  (underline, weight) on inspection.

Resolve each into either a reported failure (with what you saw) or a pass (with a
one-line justification). Silently dropping them is the most common way an
automated report lies.

## Triage decision guide (first match wins)

1. **Critical semantic breakers** — `aria-valid-attr`, `aria-allowed-attr`,
   `*-name`, `label`, `image-alt`. Fix first; they remove or corrupt meaning.
2. **Contrast violations** — a CSS/design fix, usually systemic.
3. **`incomplete`** — triage by looking; convert to fix or justified pass.
4. **Best-practice structure** — landmarks, single `<main>`, one `h1`,
   heading order. Usually a template fix.

Then route by ownership (below) — the single highest-leverage lens.

## Route by ownership: theme/template vs content

The most useful question about any finding is **who can fix it**, because that
sets both leverage and audience:

- **Theme/template issues** recur on (nearly) every page: skip-link missing, no
  `<main>`/landmarks, no `h1`, invalid roles in global nav, chrome contrast. One
  fix in the theme or a shared block cascades site-wide. Owner: the site/theme
  team (at BU, the department team + MarCom). This is the web version of the PDF
  skill's "fix at the source" instinct.
- **Content issues** are per-page and authored: alt text, in-content heading
  order, link text, table headers, form labels, body-copy contrast. Owner: the
  content author/editor.

**How to classify:**

- **With a Siteimprove "Issues" export (best signal):** the per-issue *page
  count* is a ready-made oracle — an issue on ~all pages of a site is
  theme-level; an issue on a handful of pages is content-level. (On a BU site
  audited 2026-07, a cluster hit ~3,158/3,158 pages — obviously the theme —
  while "image missing alt" hit 189 pages — content.)
- **On a single page (no cross-page signal):** classify by *location* and
  *issue class*. Inside `<header>/<nav>/<footer>` or global chrome → likely
  theme; inside `<main>`/the content region → likely content. Skip-link,
  landmark structure, and nav roles lean theme; alt text, in-content headings,
  link text, table headers, and form labels lean content.

It's a heuristic, not proof — say so, and when unsure, ask the owner which
surface the element lives on.

## Two audiences, two reports

Filter the report to its reader; don't just label findings.

- **Content-author report (e.g. a site-launch review).** *Suppress* theme issues
  (or list them once under "we're handling these — not your action"). The author
  should see only their handful of fixable, content-owned items, in plain
  language, each with the concrete edit. Handing an editor thousands of template
  occurrences they can't touch buries the real work. This report replaces the
  labor of a reviewer hand-writing "what the content editors did wrong" — the
  reviewer keeps sign-off; the skill removes the transcription.
- **Theme/team report.** The recurring template findings, grouped by the shared
  construct responsible, framed as fix-once-cascades-everywhere. Proposing an
  actual theme PR from source is a separate, heavier mode (see the plan): theme
  changes touch every page, so they need the axe delta + a human AT pass + ideally
  visual-regression before merge.

## Report template

```
# Accessibility Audit: <url>
**Date / Tool:** <date>, axe-core <version> via <Playwright | Chrome> (automated subset)
**Verdict:** <one sentence: overall state + the single most important fix>

## What this means for visitors
<2-3 sentences, plain language: who is blocked or hindered, and how.>

## Findings (most to least severe)
### <N>. <Plain-language problem statement>
- **Affects:** <who and how, concretely>
- **Standard:** <WCAG x.x.x, or "best practice — not a WCAG AA failure">
- **Where:** <how many instances; representative selector(s)>
- **Fix:** <concrete change, in template vs content terms>

## Needs human review (not auto-decided)
<Each `incomplete` item you couldn't resolve by looking, and why.>

## What was and wasn't checked
<Automated tools catch ~57% of issues by volume. Not covered: keyboard flows,
screen-reader experience, cognitive load, dynamic states. Coverage is WCAG
2.1-centric — of 2.2 we check only target size (2.5.8); other net-new 2.2
criteria are not tested. Recommend a human assistive-technology pass (keyboard +
screen reader) as acceptance. axe is a strong subset of — not a substitute for —
a certified/enterprise validator.>
```

**Add visual cues.** Reports land better with pictures of *where* the problems
are: embed an annotated full-page screenshot near the top (every flagged element
outlined, colored by severity), and include element screenshots for key findings
(the low-contrast button, the image needing alt). For flagged images, open them
by `src` and show what you saw alongside the recommended alt text.

Keep fixes concrete and audience-appropriate: the reader is usually a
communications staffer or site editor, not a developer. "The 'Apply Now' button's
light-grey text is too faint to read (WCAG 1.4.3)" lands; "fails 1.4.3" does not.
