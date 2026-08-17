---
'@wireweave/agent-prompts': patch
'@wireweave/cli': patch
'@wireweave/core': patch
'@wireweave/language-data': patch
'@wireweave/markdown-plugin': patch
'@wireweave/mcp-server': patch
'@wireweave/sdk': patch
'@wireweave/ux-rules': patch
---

chore: declare the supported Node version on every published package

Six of the eight packages declared no `engines` at all, so npm installed them
onto any Node version without a word. The two that did — `@wireweave/cli`
(`>=18`) and `@wireweave/sdk` (`>=20`) — claimed support for runtimes nothing
in this repository has ever built or tested against, and were unsatisfiable
besides: both depend transitively on `@wireweave/core`, so their real floor was
whatever core's is.

All eight now declare `node: >=22.13.0`, the version `.nvmrc` pins and the only
one CI runs. This narrows the advertised range for `cli` and `sdk`; it does not
narrow what actually worked, it stops advertising support that was never there.
