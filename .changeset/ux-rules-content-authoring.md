---
'@wireweave/ux-rules': minor
---

feat: three authoring-correctness content rules + icon-button a11y recalibration

- `content-unknown-icon` (warning): icon names on `button` / `input` / `icon` must
  resolve to a real Lucide glyph — resolution is delegated to core's `getIconData`
  (exact name, alias map, camelCase→kebab) so the rule never drifts from the renderer.
- `content-control-value-range` (warning): a `slider` / `progress` `value` must lie
  within its declared `[min, max]` — an out-of-range value paints a pinned thumb/bar
  while announcing an impossible number. Range defaults mirror the renderer
  (slider `0..100`, progress `0..max||100`).
- `content-duplicate-control-label` (warning): a `slider` / `input` label must not be
  repeated verbatim by an adjacent sibling `text` node (the "Temperature appears
  twice" defect). Adjacency-scoped (`index ± 1`, same parent) so legitimate repeats
  elsewhere are not flagged.
- `a11y-icon-button-label` recalibrated for wireframes: an icon-only button with an
  `aria` / `aria-label` / `title` accessible name now passes, and a missing name is a
  `warning` instead of an `error` — a low-fidelity sketch should not hard-fail the
  document's `valid` gate over a placeholder's accessible name.
