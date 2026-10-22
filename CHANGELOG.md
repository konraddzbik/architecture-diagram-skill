# Changelog

All notable changes to the **architecture-diagram** skill are documented here.
The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
and the project follows [Semantic Versioning](https://semver.org/).

## [1.5.0] — 2026-10-22

Usability and polish release: a second full review (runtime, visual UI, UX/a11y,
agent usability, docs, security) with every finding reproduced in headless
Chrome and independently re-verified after the fix. Plus the project's first
**evals** and a committed **UI regression suite**. Regenerate a diagram from
the updated `template.html` to pick everything up.

### Fixed — layout & rendering
- **Phones no longer scroll sideways.** A long payload line widened the
  single-column grid past the viewport, pushing the canvas, player and side
  panel off-screen (`grid-template-columns: minmax(0,1fr)`).
- **No more overlapping or clipped nodes at laptop widths (1180–1366px) and on
  tablets.** The stage keeps a 680px floor and scrolls inside the canvas when
  narrower; phones use slightly slimmer tiles. At ≥1440px nothing changes.
- **Stray packet dot gone.** After every load, resize, fullscreen toggle, drag
  or layout reset the active packet sat glowing in the stage's top-left corner,
  and the first step's flight was cut short at boot. The packet now rests on
  its wire's target end, and size-neutral ResizeObserver callbacks are ignored.
- Self-step loops on a top-row node were clipped by the SVG; they now flip below
  the node when there is no room above.
- Wire number labels between close nodes no longer sit on the arrowheads, and
  are drawn above the packet.
- Long unbroken tokens (topics, ARNs, image tags) wrap inside the tile instead of
  spilling into the neighbour.
- **Fullscreen below ~1280px**: the top bar stays one row (theme/exit always
  visible), flow tabs no longer wrap over the canvas; below ~1140px the side
  panel and legend give way to the one-line step summary.
- Theme / reset / fullscreen buttons stay together at the right end of the
  controls bar instead of being flung to opposite edges when it wraps.

### Fixed — runtime
- **Saved layouts no longer override the author.** Only the nodes a viewer
  actually moved are stored, each with the position it was moved from; if the
  author has moved that node since, the author wins. *One-time effect:* layouts
  saved by v1.4.0 and earlier (a full snapshot of every node) are discarded.
- Mode-specific node text was path-dependent with 3+ modes and partial
  `data-label-*` overrides; a mode without an override now shows the authored text.
- **Mode colors follow button order**, not the literal keys `offline`/`online`,
  so dev/prod, v1/v2, staging/prod get the same two-tone pill and panel badge.
- Drag no longer gets stuck after a chorded mouse release (node following the
  cursor with no button held); capture loss ends the drag.
- Shift+Arrow nudges no longer drift upward; nudging back onto the authored spot
  clears the saved position. Drag snapping now lines up with the visible grid.
- A node that appears only in mode-hidden steps is dimmed (it used to look
  clickable, then shake). The progress bar reaches 100% on the last *playable*
  step. Saved positions can no longer park a tile mostly off-canvas.
- Flow-tab number badges are rendered from tab order, so authors never renumber them.

### Accessibility
- Step announcements keep working in fullscreen on narrow screens (the live
  region moved out of the side panel) and now include the flow name and mode
  switches; re-renders (resize, drag) no longer repeat them.
- AA contrast: participant node text, light-theme ports, active wire numbers,
  step badges, focus rings, inactive tab/mode chips.
- Focus is no longer dropped to `<body>` when Next/Prev becomes disabled at the
  end/start of a flow.
- Nodes activate through a real `click`, so `element.click()`, voice control and
  other assistive tech work; dimmed nodes no longer claim "jump to its step";
  the current step's node carries `aria-current="step"`.
- Play / fullscreen / shortcuts toggles keep a constant name with `aria-pressed`
  (no more contradictory "Pause, pressed").
- The payload panel is focusable and Left/Right scroll it instead of changing step.
- Controls and shortcut note sit in labelled landmarks; on touch devices the
  keyboard-shortcut paragraph is replaced with a one-line tap hint.

### Security / robustness
- The `desc` sanitizer drops SVG/MathML subtrees whole (their children were
  being unwrapped into the panel).
- The self-lint now also catches: undefined step color variables, roles without
  a color rule, duplicate flow tabs, leftover per-mode keys from renamed modes
  (`payloadOnline` in a dev/prod diagram), steps that can never play, and a raw
  `<!--` in the script (which, followed by `<script`, silently kills the page).

### Skill & docs
- **New `ext` role** (slate, "External") for third-party / SaaS systems —
  Stripe, Twilio, hosted IdPs no longer have to borrow `seed` or `compute`. The
  `orch` legend label is now "API / Service" and covers ordinary services.
- Step 1 no longer forces clarifying questions when the request or a design doc
  already specifies the system — the agent proceeds and lists its assumptions.
- New `references/validation.md`: a static check that needs only `node`, the
  screenshot run, and a browser-console fallback.
- Pitfalls rewritten around the three strings that kill a diagram: `</script>`,
  `<!--` + `<script`, and **`${…}` in backtick payloads** (e.g. GitHub Actions
  `${{ secrets.X }}` ran as JavaScript and blanked the page — write `\${`).
- Layout guidance replaced with a grid that is proven not to overlap at 1280px;
  component snippets no longer place nodes off the bottom of the stage.
- Examples: roles aligned with the role table, `event-driven.json` reworked so
  every mode's outline maps onto the template, stale wire-curving and
  `onlyMode` descriptions corrected, fullscreen panel behavior documented.
- Searching a filled diagram for `{{[A-Z]` now finds only real leftovers (the
  template's own comments and lint messages no longer contain placeholder text).

### Tooling
- **`references/screenshot.js`** resolves `puppeteer-core` from the current
  directory first (the documented workflow used to fail when run from the
  installed skill), builds proper `file://` URLs (paths with `#`, `?`, `%`),
  takes full-page captures (plus a scrolled phone capture), and has explicit
  exit codes. **Changed:** `1` = page error or the script never ran, `2` = lint
  warnings (was: `2` on a page error, `0` on warnings).
- **Evals** (`evals/`, run with `claude plugin eval`): 8 cases — core
  dev/prod request, grounding from a SOLUTION.md (no invented infrastructure),
  Polish trigger, self-steps + `${{ }}` escaping, mode-exclusive flow,
  `</script>` in a payload, and two negative triggers.
- **UI regression suite** (`tests/ui.test.js`, 19 headless-Chrome tests) now
  runs in CI next to `scripts/check.js`.
- `scripts/check.js` additionally checks roles, duplicate ids, `->` typos and
  undefined color variables in the examples, raw `<!--` in the template script,
  and that `assets/css-tokens.css` matches the template's tokens.
- The marketplace entry now points at the repo root, so `plugin.json`
  (version, license, homepage) ships with the plugin.

## [1.4.0] — 2026-10-10

Full system review (security, architecture, data integrity, UI/UX, a11y).
Every finding was reproduced in headless Chrome before being fixed, and the
fixes are covered by the same harness. No breaking changes — regenerate your
diagram from the updated `template.html` to pick everything up.

### Fixed — rendering
- **Request/response wires no longer overlap.** The curve-side math cancelled
  out for an A→B step followed by B→A, so both wires and their number labels
  were painted on top of each other (visible in the template's own flows).
  Wires now bend to the right of their direction of travel; repeated
  same-direction wires between one pair get progressively wider lanes.
- **Self-steps (`from === to`, e.g. "CI → CI: lint, test, build") render as a
  loop** above the node instead of a zero-length wire.
- **Wire number labels sit on the curve** (its midpoint) instead of floating at
  the Bézier control point.
- **Fullscreen actually works.** The fixed canvas was trapped under the page
  header by `main`'s stacking context, the side panel was hidden, and the exit
  button was unreachable (a trap on touch devices). Fullscreen now hides only
  the header, pins the controls bar to the top and the flow tabs to the bottom,
  keeps the side panel as an overlay, locks body scroll, uses the native
  Fullscreen API when allowed, and restores focus on exit.
- **Phone widths no longer clip the right-most node** or overlap the first two:
  the stage keeps a 640px minimum and scrolls sideways inside the canvas. The
  mode picker wraps; the side panel loses its desktop min-height.
- The drag style was being overridden by `:hover`; dragging now shows the lift.
- Dragging / nudging clamps to the node's own size so tiles can't be parked
  half outside the stage.

### Fixed — runtime correctness
- **A wrong `state.flow` / `state.mode` key no longer throws at boot** and
  blanks the diagram; the runtime falls back to the first tab/button and logs a
  warning. All code paths go through a safe `currentFlow()`.
- **Payload and chips use the same precedence rule** — the mode-specific key
  (`payloadOnline`, `chipsOnline`) wins over the generic one. Previously
  payload and chips had opposite rules.
- A step without `desc` rendered the literal text "undefined". Missing fields
  now render empty; an object payload is pretty-printed as JSON.
- **Play at the last step restarts the flow** instead of flipping the icon.
- **Dead steps** (an endpoint hidden in the current mode) are handled
  everywhere: tab/mode switches land on the first playable step, Prev/Next are
  disabled by "is there a playable step in that direction", and a step that is
  unavailable in the current mode says so instead of half-lighting one node.
- Pointer handling: `pointerup` is gated on button 0 and on the pointer that
  started the drag, so middle-click, a stray release, or a second finger can
  no longer trigger a jump; a second pointer during a drag is ignored.
- The packet animation no longer restarts on resize, drag end, or fullscreen
  toggle (only when the step actually changes).
- Wires redraw on any stage size change (ResizeObserver), not just window resize.

### Security / data integrity
- **Content Security Policy** meta tag: nothing loads from the network except
  Google Fonts; no fetch/frames/forms. Defense in depth for hosted copies.
- **`desc` is sanitized at render time** to inline formatting (`em`, `strong`,
  `code`, `kbd`, `br`, `a[href=https|mailto|#]`, …). Block tags unwrap,
  `script`/`style`/`iframe` are dropped, attributes are stripped.
- **Step `color` is validated** as a CSS custom-property name before being
  interpolated into styles; anything else falls back to the brand accent.
- **Saved layouts are validated** when read back from localStorage (plain
  percentages inside the stage only), so a bad value can't move nodes off-canvas.
- **Built-in integrity lint** at boot (`window.archValidate()`): duplicate or
  missing node ids, steps referencing unknown nodes, flow tabs without flows
  and vice versa, unknown `onlyMode`/`data-modes`, missing `title`/`color`,
  and leftover `{{PLACEHOLDERS}}`. Warnings go to the console and are printed
  by `references/screenshot.js`.

### Accessibility
- Live region announces step changes (and "not part of this flow" on a
  dimmed-node click, which previously only shook — invisible under reduced
  motion).
- Theme and fullscreen buttons expose `aria-pressed`; hidden nodes get
  `aria-hidden`; node labels include the tech line; the panel title is an `h2`.
- **Keyboard alternative to dragging:** focus a node and press Shift+Arrows to
  move it one grid cell (WCAG 2.5.7).
- **Touch:** nodes are tap-to-jump; swiping over a node scrolls the page again
  (`touch-action` was blocking it). Drag stays on mouse/pen.
- **Single-key shortcuts can be switched off** (link in the shortcut note,
  remembered per browser) — WCAG 2.1.4.
- Contrast: `--dim` raised to ≥ 4.5:1 in both themes; the light-theme "online"
  pill (`#d9a6ff`, 1.8:1) and mint-as-text usages (play icon, arrows, focus
  rings, h1 gradient, payload tokens) now use dedicated `--accent-fg` /
  `--mode-*-fg` tokens that pass AA. `color-scheme` is declared so native
  scrollbars match the theme.
- Theme honours `prefers-color-scheme` when nothing is saved and the author
  didn't set a default.

### Changed
- Keyboard digit order and the `O` mode cycle are derived from the
  `.flowtabs` / `.modepick` buttons — the old `CONFIG.keyboardFlowOrder` and
  `CONFIG.toggleModes` are gone, and three or more modes cycle correctly.
- The mode badge in the panel shows the mode button's label instead of the
  raw key.
- On stacked (single-column) layouts the canvas echoes the current step title
  under the progress bar, since the side panel is below the fold.
- An empty payload no longer renders an empty box; `<noscript>` message added.
- `references/screenshot.js`: finds Chrome on macOS/Windows/Linux (or
  `PUPPETEER_EXECUTABLE_PATH`), prints integrity warnings and page errors,
  exits non-zero on JavaScript errors, adds a phone-width capture, closes the
  browser on failure, and only passes `--no-sandbox` when running as root or
  explicitly asked.
- Examples: `auth-oauth2.json` step count matched its outline; `event-driven.json`
  gained the Stripe node its billing flow referenced; model names updated.
- `plugin.json` carries `homepage`, `repository`, `license`, `keywords`.

### Added
- `scripts/check.js` (no dependencies) + GitHub Actions CI: validates example
  JSON specs (mode keys, node references, step counts), SKILL.md frontmatter
  limits, template script syntax, and version consistency across manifests.

## [1.3.0] — 2026-08-04

Full code & architecture review pass. No breaking changes — regenerate your
diagram from the updated `template.html` to pick up the fixes.

### Fixed
- **Keyboard shortcuts no longer hijack browser/OS combos.** `Cmd/Ctrl/Alt`
  chords are ignored, so `Cmd+R` (reload), `Cmd+T` (new tab), and `Alt+←/→`
  (history) work normally instead of resetting the layout or toggling the theme.
- **Space on a focused node/button no longer double-fires.** Node `keydown`
  stops propagation and the global handler defers to focused controls, so a
  single Space does one thing.
- **Empty or missing flows no longer blank the whole diagram.** `applyStep`
  guards against a missing flow key or an empty `steps[]` and clamps the step
  index — a hand-edit mistake degrades gracefully instead of throwing at boot.
- **Stepping/autoplay skips "dead" steps** whose endpoints are hidden in the
  current mode (or reference a nonexistent node), so you never land on a frame
  with nothing lit.
- **Switching flow or mode stops autoplay,** preventing a stale timer from
  resuming playback on the new selection.
- **`note` / `onlineNote` flow fields now actually render** (a flow-level line
  under the player). They were documented but previously dead.
- **Consistent HTML escaping** for step `route` and `chips` (previously raw).

### Changed
- Theme toggle no longer rebuilds the SVG — wire/packet colors resolve from live
  CSS variables, so switching themes is cheaper and doesn't restart animations.
- Removed a dead layout read in `startDrag`.

### Added
- **`prefers-reduced-motion` support** — the flying packet is hidden and
  transitions collapse for users who ask for reduced motion.
- **Node button semantics** — nodes expose `role="button"` + a per-mode
  `aria-label`, and clicking a node now focuses it for keyboard follow-up.
- This `CHANGELOG.md`.

### Docs
- Fixed the Claude Code / OpenCode **manual-clone** install commands: they cloned
  the whole repo into the skills dir, nesting `SKILL.md` one level too deep so it
  was never discovered. They now clone to a temp dir and copy the skill folder.

## [1.2.0] — 2025

- Drag performance, correctness fixes, slimmer docs, consistency pass.

[1.5.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.5.0
[1.4.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.4.0
[1.3.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.3.0
[1.2.0]: https://github.com/konraddzbik/architecture-diagram-skill/commit/5ae0f77
