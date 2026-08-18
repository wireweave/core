---
'@wireweave/agent-prompts': minor
---

feat: document component parameters and the `$` reference quoting rule in both grammar prompts

Neither prompt mentioned typed component parameters or `"$name"` references, so
a generating agent had no way to learn either the declaration syntax or the one
trap in it: a reference must be quoted. `target="$to"` is accepted anywhere a
value goes, including nested places such as an interaction effect target, while
bare `target=$to` fails to parse outright, because an identifier cannot begin
with `$`. An agent left to guess reaches for the bare form and the file does not
parse.

Both prompts now cover `component NAME(param: string) { … }`, a worked example
that parses and validates, the always-quote rule with the bare-form failure
called out, that a reference substitutes only as a whole value, and that every
`"$name"` must match a declared parameter.
