---
'@wireweave/core': patch
---

fix: check component parameter references wherever substitution reaches them

A component body may reference a parameter anywhere a string value sits, and
link-time substitution replaces all of them — it walks arrays and nested objects
and skips only `loc`. Both reference checks, in `linkApp` and in `validate`,
looked instead at a node's own top-level string properties. Substitution was
deep while validation was shallow, and the asymmetry was the defect.

A reference nested inside an interaction effect fell through the gap:

```
component c(to: string) {
  button "x" on={event=click, effects=[{kind=navigate, target="$too"}]}
}
```

`$too` is not a declared parameter, but neither check inspected `effects[0]`, so
no diagnostic was raised and the misspelling rendered as the literal string
`"$too"` — a dead navigation target with nothing in the output to say so.

Both call sites now share one traversal and one reference pattern, so
substitution and validation cannot disagree about what a reference is or where
one can appear. Undeclared references in nested objects and in arrays are
reported with the same message and code as before; correct references and
partial matches such as `"go to $to"` are unaffected.
