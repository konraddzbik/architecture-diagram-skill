# Changelog

All notable changes to the **architecture-diagram** skill are documented here.
The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
and the project follows [Semantic Versioning](https://semver.org/).

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

[1.4.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.4.0
[1.3.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.3.0
[1.2.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.2.0
