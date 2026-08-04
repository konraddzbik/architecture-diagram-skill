# Changelog

All notable changes to the **architecture-diagram** skill are documented here.
The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
and the project follows [Semantic Versioning](https://semver.org/).

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

[1.3.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.3.0
[1.2.0]: https://github.com/konraddzbik/architecture-diagram-skill/releases/tag/v1.2.0
