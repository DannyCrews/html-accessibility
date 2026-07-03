# ARIA patterns and anti-patterns

For Mode B (authoring custom widgets) and for judging whether a page's ARIA is
appropriate. Tool-agnostic. Canonical source: the W3C ARIA Authoring Practices
Guide (APG, https://www.w3.org/WAI/ARIA/apg/) — link to the specific pattern
rather than improvising.

## First: the five rules of ARIA

1. **If a native element does the job, use it** (`<button>`, `<a href>`,
   `<select>`, `<input type=checkbox>`) instead of re-creating it with ARIA.
2. **Don't change native semantics.** Not `<h2 role="tab">` — wrap:
   `<div role="tab"><h2>…</h2></div>`.
3. **Every interactive ARIA widget must be keyboard operable** (the roles below
   each imply a keyboard contract).
4. **Don't put `role="presentation"`/`aria-hidden="true"` on a focusable
   element** — you'll hide it from screen readers while it's still tabbable (the
   `aria-hidden-focus` finding). 
5. **Every interactive element needs an accessible name.**

ARIA changes only how assistive tech *interprets* an element — it adds no
behavior, focus, or keyboard handling. You supply those with JS.

## Patterns you'll reach for most

Each: the roles/states, the keyboard contract, and the gotcha.

**Disclosure (show/hide).** A `<button aria-expanded="true|false">` controlling a
region (optionally `aria-controls="id"`). Keyboard: Enter/Space toggles (free
with a real `<button>`). Gotcha: toggle `aria-expanded` in sync with the visual
state.

**Accordion.** A set of disclosures; each header is a `<button>` inside a heading
of the right level. Don't wrap the whole thing in one giant button.

**Tabs.** `role="tablist"` > `role="tab"` (`aria-selected`, `aria-controls`) with
`role="tabpanel"` (`aria-labelledby`). Keyboard: arrow keys move between tabs,
only the active tab is in the tab order (roving `tabindex`). Gotcha: without the
arrow-key handling it's not a real tabs widget — use links/sections instead.

**Modal dialog.** `role="dialog"` (or `alertdialog`) with `aria-modal="true"` and
`aria-labelledby`/`aria-label`. Keyboard: move focus into the dialog on open,
**trap** focus while open, Esc closes, and return focus to the trigger on close.
Gotcha: content behind the modal should be inert.

**Menu button.** `<button aria-haspopup="menu" aria-expanded>` opening
`role="menu"` with `role="menuitem"` children. Keyboard: arrows move, Esc closes,
Enter activates. Gotcha: a site nav of plain links is **not** a `menu` — don't
add `role="menu"` to it (that triggers `aria-allowed-attr`/menu semantics that
mislead). Reserve `menu` for application-style menus.

**Combobox / autocomplete.** Follow the APG combobox pattern exactly
(`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`);
it's easy to get subtly wrong — prefer a vetted component.

**Switch / toggle.** `role="switch"` with `aria-checked`, or just
`<input type="checkbox">`. Give it a name.

**Live regions.** For async updates: `aria-live="polite"` (or `role="status"`)
for non-urgent, `role="alert"` (assertive) for errors. The container must exist
in the DOM *before* you write into it. Gotcha: don't wrap large/changing regions
in `aria-live` — it spams the screen reader.

## Anti-patterns (seen in the wild, including on BU pages)

- **`aria-role="note"`** — there is no `aria-role` attribute. It's `role="note"`.
  (Fires `aria-valid-attr`.)
- **ARIA attribute not allowed on the role** — e.g. menu/`aria-*` combinations on
  plain list items or links. (Fires `aria-allowed-attr`.) Match attributes to the
  element's actual role.
- **`aria-hidden="true"` on something focusable** — hides it from AT while it
  stays tabbable, stranding screen-reader users on an "invisible" control. (Fires
  `aria-hidden-focus`.)
- **Redundant roles** — `<button role="button">`, `<nav role="navigation">`. Not
  harmful but noise; drop them.
- **`title` as the accessible name** — unreliable and not shown on touch/keyboard.
  Use a real label / `aria-label` / visible text.
- **`<div onclick>` as a button** — no role, no keyboard, no focus. Use
  `<button>`.
- **Positive `tabindex`** (`tabindex="3"`) — fights the natural order. Use `0`
  (focusable in order) or `-1` (programmatically focusable only).
- **`role` without the keyboard contract** — declaring `role="tab"`/`"menu"` but
  not implementing arrow keys/Esc. The role promises behavior AT users expect;
  deliver it or don't claim it.
