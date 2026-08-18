---
'@wireweave/core': minor
'@wireweave/language-data': minor
'@wireweave/agent-prompts': minor
---

feat: `repeat N { … }` — fold repeated siblings instead of pasting them

Six identical skeleton cards had to be written out six times, so the duplication
a wireframe language exists to avoid was being maintained by hand. `repeat 6 {
use skeletonCard() }` states the count once.

It is deliberately a count and nothing else. There is no index variable: an
index is what lets copies differ, and copies that differ are data binding rather
than a wireframe. The feature narrows what has to be typed, not what can be
expressed.

`repeat` expands on the way to a rendered tree, in `expandRepeats`, and not in
the parser. The AST keeps the node so the printer can write `repeat 6` back out
and the round-trip law holds; expanding at parse time would return six bodies
where the source had one. It is not expanded in the linker either, because
`linkApp` runs only under `compileApp` while the CLI, SDK, MCP server, markdown
plugin, editor extension and UX rules all reach the tree through `parse` and
`render` — expansion there would leave the syntax inert everywhere else.

Expansion runs over the whole document before the renderer builds its anchor
index, because that index is keyed by node object identity: copies created
afterwards would carry no `data-wf-path` and the anchor count would stop
matching the index. Every copy is therefore a distinct clone. Copies keep the
`loc` of the body they came from, which is accurate — all of them do originate
at one span of source — and stay individually addressable through their anchor
paths, which are child indices and so differ by position.

`repeat 0` draws nothing and `repeat 1` draws the body once; both parse and
validate. Negative and fractional counts are rejected by the grammar, which
accepts only a non-negative integer. Nesting works and multiplies, so the guard
is a budget on the expanded total rather than a cap on any single count:
expansion past 500 nodes is refused, ten times the `MAX_PAGE_ELEMENTS` ceiling
`ux-rules` already warns at, leaving an order of magnitude in which a document
is complained about but still drawn.
