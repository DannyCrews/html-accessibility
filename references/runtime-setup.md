# Runtime Setup

Auditing needs a real browser driven over MCP (a browser can't run in the
sandbox — see `../../spike/SPIKE-REPORT.md`). Two runtimes are supported and
produce identical axe output. Prefer Playwright; fall back to Chrome.

## Detect which runtime is available first

Before auditing, check which browser tools exist in the session:

- Playwright present → tools named `browser_navigate`, `browser_evaluate`,
  `browser_take_screenshot`, etc.
- AppleScript Chrome present → tools named `open_url`, `execute_javascript`,
  `list_tabs`, `get_current_tab`.
- Neither → you can still give authoring guidance (Mode B), but say plainly that
  checking and fixing are unavailable.

State which runtime you used in the report.

## Runtime A — Playwright MCP (preferred)

Repeatable, headless-capable, main-world eval, element screenshots by selector,
and `bypassCSP`. Add to `claude_desktop_config.json` and restart Claude Desktop:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "/opt/homebrew/bin/npx",
      "args": ["-y", "@playwright/mcp@latest", "--browser", "chrome"]
    }
  }
}
```

Notes and gotchas:

- **Absolute path to `npx`.** GUI-launched apps don't inherit your shell PATH, so
  bare `npx` often isn't found. Use `which npx` (e.g. `/opt/homebrew/bin/npx` or
  an nvm path). A failing-to-start server is almost always this.
- **`--browser chrome`** reuses installed Chrome and skips the Chromium download.
  Add **`--headless`** for unattended runs (start headed to confirm it works).
- **`file://` is blocked by default.** Serve local fixtures over http (e.g.
  `python3 -m http.server`) or allowlist the origin in a `--config` file.
- **Output paths:** the MCP strips absolute paths and writes relative to its
  working directory (the project folder, in practice). Use relative filenames or
  set `--output-dir` to control where screenshots/snapshots land.
- **CSP:** `fetch()` of axe can be blocked by a strict `connect-src`. Launch with
  `bypassCSP` (via a `--config` file) if you hit it on a hardened site.

### Running the audit (Playwright)

`browser_evaluate` runs a function in the page's main world and awaits its
promise, so one call does inject+run. Pass a wrapper that inlines the
declarations from `scripts/axe-run.js` and returns `await a11yAudit()`.

### Render-and-look (Playwright)

`browser_take_screenshot` with `target` set to a `needsLook` selector captures
just that element (Playwright scrolls it into view). Save under a renders folder,
then Read the PNG to judge alt text / contrast.

## Runtime B — AppleScript "Control Chrome" (fallback)

Use for authenticated / behind-login pages and specific interaction states
Playwright can't easily reach. It drives your real Chrome.

Gotchas (all confirmed in the spike):

- **Enable JavaScript over Apple Events.** Chrome → View → Developer → *Allow
  JavaScript from Apple Events*. Until then `execute_javascript` fails with a
  misleading "Google Chrome is not running" error even though it is.
- **Isolated world.** `execute_javascript` shares the DOM but not the page's
  main-world globals, so a `<script>` tag won't expose `axe`. `axe-run.js` uses
  `fetch()` + indirect `eval`, which defines axe in the isolated world — no
  change needed.
- **Synchronous — kick + poll.** AppleScript won't await a promise. Call
  `a11yAudit().then(r => window.__a11y = r); 'STARTED'`, then poll
  `JSON.stringify(window.__a11y || 'PENDING')`.
- **No native element screenshots.** There's no element-capture command; fall
  back to a viewport screenshot (and crop) or note the limitation. This is a
  reason Playwright is preferred whenever the page doesn't require a logged-in
  session.

## Quick reference

| Concern | Playwright MCP | AppleScript Chrome |
|---|---|---|
| JS world | main | isolated |
| axe load | fetch+eval (or script tag) | fetch+eval (required) |
| async | awaited (one call) | kick + poll |
| element screenshot | yes (by selector) | no (viewport + crop) |
| `file://` | blocked by default | works |
| CSP fetch | `bypassCSP` available | may block on hardened sites |
| logged-in pages | separate profile needed | uses your real session |
| best for | repeatable/unattended audits | authenticated / interaction states |
