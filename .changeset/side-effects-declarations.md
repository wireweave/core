---
'@wireweave/core': patch
'@wireweave/language-data': patch
'@wireweave/markdown-plugin': patch
'@wireweave/sdk': patch
'@wireweave/ux-rules': patch
---

chore: declare `sideEffects: false` on the packages that have none

Bundlers use this field to decide whether a module may be dropped entirely when
none of its exports are used. Five packages qualified and none said so, which
cost consumers dead code in every build that imported one of them for a single
symbol.

The claim is verified rather than asserted. `pnpm sideeffects:check` imports
every `exports` entry of every package making the claim, each in its own
process, and compares globals, builtin prototypes and `process.env` across the
import while capturing stdout/stderr from outside and enforcing filesystem,
process and worker access through Node's permission model. A package is covered
the moment it adds the field, and the gate fails rather than passing vacuously
if the set making the claim is ever empty.
