---
'@wireweave/core': minor
'@wireweave/language-data': minor
'@wireweave/agent-prompts': minor
---

feat: `when=` — scope an element to the variant boards that draw it

`variants=[loading, empty, ready]` says how many boards a page draws. It had no
way to say which of them draws a given element, so every board drew everything
and a screen's states could only differ by what a `visibleWhen` guard hid at
runtime — which is a different thing, and visible in the artifact as controls the
product does not have.

`when=loading` scopes an element to one board; `when=[loading, empty]` scopes it
to several. The list is a disjunction, and that is the reason the attribute
exists: a guard offers only `equals`, so a block belonging to two conditions had
to be authored twice, and two copies drift apart while a reviewer cannot tell
whether the difference is deliberate. A header shared by three states is now one
header. An element with no `when` is drawn on every board, so the common chrome
of a screen stays written once and every document that predates the attribute
renders unchanged.

Orthogonal to `visibleWhen`, deliberately and testably. A guard is a runtime
fact — the element is in every board's markup, carries `data-wf-visible-when`,
and the site runtime shows and hides it as state changes. `when` is a build-time
fact: the element is _absent_ from the markup of every board it does not name, so
nothing can toggle it back. One element may carry both — `when=ready
visibleWhen={…}` means "only on the ready board, and there only while the guard
passes" — and the two are kept in separate interfaces (`VariantScopedProps`,
`GuardedOutcomeProps`) so a later refactor cannot quietly collapse them into one
mechanism.

Filtering happens inside `expandVariants`, at the moment each board is cloned,
because that is the only point where the board's name is in hand: before
expansion there is no board to ask about, and after it a separate pass would have
to rediscover the association by walking the document again. The rule is one
sentence — an element is drawn on a board iff its `when` set contains that
board's variant — and the remaining cases fall out of it rather than being
special-cased. A page declaring no `variants=` is an unnamed board, which no
scope contains, so a `when` there draws the element nowhere; `validate()` reports
that, along with a name absent from the page's own list and a child whose scope
is disjoint from an ancestor's, because `when` deletes rather than styles and a
silent misspelling costs the whole subtree.

Every element accepts it, via `BOX_ATTRIBUTES` — which states a screen's piece
belongs to is a property of the piece, not of what kind of piece it is. `page` is
the one exception: a page _is_ a board, so scoping one would be a board naming
which board it is drawn on.

spec-surface-baseline: GREW — every element gained `when` (new writable syntax;
no document stops validating).
