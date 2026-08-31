---
'@wireweave/core': patch
---

fix: keep layout state scoped per rendered document and normalize generated parser output

Core now preserves layout state per rendered document instead of allowing one
document's runtime state to affect another. Its generated parser and grammar
metadata are also normalized deterministically so source and generated
artifacts remain stable across builds.
