---
'@wireweave/core': minor
'@wireweave/language-data': minor
'@wireweave/agent-prompts': minor
---

feat: `page … variants=[…]` — draw a screen's states as separate boards

A screen usually has to be shown loading, empty, populated and failed. Until now
the only way to say that was `states=` plus `visibleWhen` guards plus a control
that flips the state, and all three costs land in the artifact: the wireframe
carries state-switching buttons the product does not have, so a reviewer cannot
tell them from real UI; only one condition is visible at a time; and any block
two conditions share is written twice, because a guard has no disjunction.

`variants=[loading, empty, ready]` moves the same information from a toggle
inside the screen to an axis of the document. The page is drawn once per name, as
that many independent boards, and none of them contains a way to switch — there
is nothing to switch to, because the other states are already on the page beside
it. The shared blocks stay shared, because it is still one authored body.

This is orthogonal to `states`, which keeps its meaning unchanged. A state is a
runtime value the site runtime flips and guards read; a variant is a property of
the artifact. A page may declare both, and a page that does contributes its
`states` once rather than once per board.

Expansion happens in `expandVariants`, over the document, on the way to a
rendered tree — the same place and for the same reasons as `repeat`. Not the
parser, so the AST keeps the list, the printer writes it back out, and the corpus
round-trip law holds. Before the renderer builds its anchor index, because that
index is keyed by node object identity: boards sharing a child tree would leave
every board but the first without a `data-wf-path`. Every board is therefore a
distinct clone that keeps the `loc` of the page it came from, which is accurate —
all of them originate at one span of source.

Both render surfaces run the pass, so `render` counts the boards on its canvas
and `renderSite` builds a screen for each, rather than each deciding separately
what a variant is. Boards composed into a shell share that one shell, which is
still emitted once, and each board gets its own id scope.

Addressing keeps one resolution rule. The bare name still resolves — to the first
variant, which is the one the author wrote first — so `navigate=orders` behaves
as it always did, and each board is additionally addressable as `orders#loading`.
The separator is `#` because a screen address is already a URL fragment, and
because it cannot appear in a bare identifier, so a variant target must be
written quoted and is visibly deliberate.

Documents that declare no variants are unaffected: expansion returns them
unchanged, identity included, and their screen model, canvas and site output are
byte-for-byte what they were.
