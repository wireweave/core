---
'@wireweave/core': minor
---

feat: canonical `.wf` printer — `printWireframe` (AST → deterministic canonical DSL text) and `formatWireframeCode` (parse + reprint). Single canonical form (fixed indentation, attribute ordering, quoting, blank-line policy) with tested round-trip laws: `parse(print(ast))` is structurally lossless, printing is an idempotent fixpoint, and canonical text reprints byte-identical.
