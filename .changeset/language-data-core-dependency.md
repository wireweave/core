---
'@wireweave/language-data': minor
---

feat: derive the editor vocabulary from `@wireweave/core/spec`

The element set, attribute names, value domains and descriptions this package
offers to Monaco and CodeMirror were maintained as a parallel transcription of
the DSL specification. A parallel copy drifts silently: an attribute added to
the grammar simply never reached autocomplete, and nothing failed.

They are now read from `@wireweave/core/spec`, which derives them from the
grammar itself. Only genuinely editor-side concerns remain declared here —
example snippets, parent/child hints, and the two documented gap categories in
`core-spec-gaps.ts` (source spellings the grammar desugars, which correctly
have no attribute spec, and a shrinking list of attributes core has yet to
declare). Sync tests assert those lists stay disjoint from core, so the moment
core adopts an entry the build fails until it is deleted here.

This adds `@wireweave/core` as a runtime dependency of
`@wireweave/language-data`; it was previously a peer of the editor integrations
only. Consumers already installing both are unaffected.
