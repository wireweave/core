---
'@wireweave/core': minor
---

feat: opt-in source anchors (`data-wf-path` / `data-wf-loc`) + DOM↔AST↔source mapping APIs

Add a `sourceAnchors` render option (default `false`, output byte-identical when off) that stamps each rendered component element with `data-wf-path` (page-relative index path) and `data-wf-loc` (source offset range). New extract APIs invert the mapping: `buildAnchorIndex` / `resolveAnchor` (path ↔ AST node), `getPageSource` / `getNodeSource` (path → DSL source slice), and `buildDomTree` (panel-ready DOM tree). Renderer injection and the index share a single path scheme, so the emitted anchors and the index can never diverge. Additive — existing class/`data-*` contracts are unchanged.
