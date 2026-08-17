---
'@wireweave/core': minor
---

feat: publish the DSL specification as a `./spec` export subpath

`ATTRIBUTE_SPECS`, `COMPONENT_SPECS`, `GRAMMAR_ELEMENTS`, `BOX_ATTRIBUTES`,
`INTERACTIVE_ATTRIBUTES` and the lookup helpers around them were already the
single source the grammar derives from, but they were only reachable through
the package root — a consumer that wanted the specification had to pull in the
parser and renderer to get it.

`@wireweave/core/spec` now serves that surface on its own, built as a separate
entry so an editor-integration package pays for the spec and nothing else.
`@wireweave/language-data` is the first consumer: it derives its element and
attribute vocabulary from this subpath rather than restating it, which is what
lets a new grammar element fail that package's build until its editor metadata
exists.

Additive — the same names remain exported from the root, and no existing entry
point changed.
