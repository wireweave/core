---
'@wireweave/core': patch
---

fix(renderer): keep multi-page canvas from shrinking and scope drawers to their board

Two rendering fixes for the multi-page canvas, both instances of the fixed-layout
invariant (see `no-responsive.md`):

- `renderToHtml` wraps its output in a flex `<body>`. The multi-page `.wf-canvas`
  was a flex item without `flex-shrink: 0`, so it collapsed below its intrinsic
  width when the viewport was narrower than the canvas and the boards reflowed —
  the same defect the single-page `.wf-page` already guards against. The standalone
  wrapper now emits `.wf-canvas { flex-shrink: 0 }` (prefix-aware).
- `.wf-drawer` used `position: fixed`, so a drawer inside a page escaped to the
  viewport top-left and overlapped other boards in canvas mode. It is now
  `position: absolute`, scoping it to its nearest positioned ancestor
  (`.wf-page` / `.wf-canvas-board`) — the same board-scoping the modal backdrop
  already uses.
