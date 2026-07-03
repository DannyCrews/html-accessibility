# Accessible-by-default authoring checklist

Apply these when generating or editing HTML/JSX/UI, *before* anyone audits. They
are ordered by leverage. This file is deliberately tool-agnostic: it is the
Mode B guidance in the full skill, and it is the entire knowledge core of the
lightweight (no-tools) build. Where the full skill can verify (`scripts/axe-run.js`
against the rendered output), the lightweight build cannot — there, apply these by
construction and tell the author to run a checker plus a keyboard/screen-reader
pass.

Target: WCAG 2.1 AA. Canonical patterns: the W3C ARIA Authoring Practices Guide
(APG, https://www.w3.org/WAI/ARIA/apg/).

## 0. Semantic HTML first; ARIA only to fill real gaps

Native elements come with roles, states, focus, and keyboard behavior for free.
Reach for `<button>`, `<a href>`, `<label>`, `<nav>`, `<main>`, `<h1>`–`<h6>`,
`<ul>`, `<table>` before any ARIA. **No ARIA is better than bad ARIA** — invalid
or wrong ARIA actively misleads screen readers, which is worse than none.

```html
<!-- Wrong (real bug found on a BU site): aria-role is not an attribute -->
<li aria-role="note">…</li>
<!-- Right -->
<li role="note">…</li>          <!-- and only if a plain <li> truly won't do -->
```

If you do use ARIA: use a real APG pattern, supply its required states/props, and
keep them in sync with the UI. Don't put ARIA attributes on elements whose role
doesn't allow them.

## 1. Every interactive control has an accessible name

A button, link, or field with no name is announced as "button"/"link"/"edit" —
useless. Names come from visible text, `<label>`, `aria-label`, `aria-labelledby`,
or (for images) `alt`.

```html
<!-- Icon-only button: give it a name -->
<button aria-label="Search"><svg aria-hidden="true">…</svg></button>

<!-- Link with real destination text, not "click here" -->
<a href="/aid">Financial aid options</a>

<!-- Wrong (real bug): a slideshow link wrapping an image with no text/alt -->
<a href="/story"><img src="hero.jpg"></a>
<!-- Right -->
<a href="/story"><img src="hero.jpg" alt="Students on the BU Beach"></a>
```

Link vs button: a link **navigates** (has `href`); a button **acts**. Don't fake
one with a `<div>` + click handler.

## 2. Keyboard operable, with visible focus

Everything usable by mouse must work by keyboard, and focus must be visible.

- Prefer native controls (keyboard support is built in).
- Never remove the focus outline without replacing it: not `outline: none` alone.
- Tab order follows DOM order — order the source logically; avoid positive
  `tabindex`.
- No keyboard traps: a user who tabs in must be able to tab out.
- Custom widgets (menus, tabs, dialogs, comboboxes) need the APG keyboard
  interactions (arrow keys, Esc, Enter/Space) — if you're not implementing those,
  use a native element or a vetted component.

## 3. Structure: landmarks, one `<main>`, one `<h1>`, no level skips

Screen-reader users navigate by structure. (Real bugs found: no `<main>`, no
`<h1>`, content outside landmarks.)

- Exactly one `<main>`; wrap regions in `<header> <nav> <main> <footer>`.
- One `<h1>` per page (the page's subject); don't skip levels (`h1 → h4`).
- Headings describe sections; don't pick a level for its visual size — style with
  CSS instead.

## 4. Images: informative vs decorative vs complex

- **Informative** → `alt` that conveys the *meaning*, not a literal pixel
  description. Don't start with "image of".
- **Decorative** (adds nothing) → `alt=""` (empty, but present) so it's skipped.
- **Complex** (charts, infographics) → short `alt` plus the real data/insight in
  nearby text or a longer description. Data that exists only in a picture is
  invisible to non-visual users.
- Text baked into an image is not resizable or selectable — use real text.

## 5. Color and contrast

- Body text ≥ 4.5:1; large text (≥24px, or ≥19px bold) ≥ 3:1; UI components and
  meaningful graphics ≥ 3:1 (WCAG 1.4.3 / 1.4.11).
- **Never use color as the only cue.** (Real bug: in-text links distinguished by
  color alone — `link-in-text-block`.) Underline links in body copy; pair error
  red with an icon/text; pair status color with a label.
- Don't hard-code text over images/gradients without checking the actual
  contrast where the text sits.

## 6. Forms

- Every field has a programmatically associated `<label>` (`for`/`id`, or wrap).
  A placeholder is **not** a label (it vanishes on input and often fails
  contrast).
- Group related controls with `<fieldset>` + `<legend>` (radios, checkboxes).
- Associate error and hint text with the field via `aria-describedby`; mark
  invalid fields `aria-invalid="true"`.
- Indicate required fields in text ("(required)"), not by color alone; don't rely
  solely on `required` styling.

```html
<label for="email">Email (required)</label>
<input id="email" type="email" required aria-describedby="email-err" aria-invalid="true">
<p id="email-err">Enter a valid email address.</p>
```

## 7. Data tables

Use real `<table>` for tabular data (never for layout). Give header cells
`<th scope="col|row">`, add a `<caption>`, and keep one logical row/column
structure so header–cell associations are unambiguous.

## 8. Language and title

- `<html lang="en">` (and mark inline language changes with `lang`).
- A unique, descriptive `<title>` per page ("Financial Aid | Boston University",
  not "Home").

## 9. Dynamic content and motion

- Announce async updates (search results, toasts, validation) with a live region
  (`aria-live="polite"`, or `role="status"`/`role="alert"`).
- On route change or modal open, move focus deliberately (to the new heading or
  dialog) and return it on close; trap focus inside an open modal only.
- Respect `prefers-reduced-motion`; don't auto-play motion that can't be paused;
  nothing should flash more than 3×/second.

## Self-check

- **Full skill:** render the output and run `scripts/axe-run.js`; resolve
  `violations` and look at every `incomplete`.
- **Lightweight build:** you can't verify automatically — apply the above by
  construction, and recommend the author run an automated checker *and* a manual
  keyboard + screen-reader pass. Automated tools catch ~57% of issues by volume;
  they never confirm the experience is actually good.

*(Forward-looking: WCAG 2.2 adds authoring-relevant criteria — minimum target
size ~24px, focus not obscured, and non-dragging alternatives. Out of current
2.1 AA scope, but cheap to honor while authoring.)*
