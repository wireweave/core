---
'@wireweave/core': minor
---

feat: button accessible-name attributes + shared unknown-icon placeholder + lucide overflow alias remap

- `button` now accepts `aria` / `aria-label` (rendered as `aria-label`) and `title`
  (tooltip + fallback name), giving icon-only buttons a real accessible name
  (WCAG 4.1.2): `button "" icon="x" aria="Close"`. Only emitted when authored —
  buttons with visible text render unchanged.
- Unknown icon names now render one canonical placeholder everywhere (icon node,
  button icon, input icon) via the new `renderUnknownIconSvg` export — a dashed
  circle with a `?` glyph plus a `title="Unknown icon: <name>"` hover — instead of
  leaking the raw DSL name as literal `[name]` text in button/input.
- The overflow/kebab-menu aliases now target the real Lucide keys after the
  upstream rename: `more-horizontal` / `dots` → `ellipsis`, `more-vertical` /
  `dots-vertical` → `ellipsis-vertical` — none of the legacy names dead-end into
  the placeholder anymore.
