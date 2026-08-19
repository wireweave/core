---
'@wireweave/core': patch
---

fix: stop the site gutter narrowing boards, and mark component invocations with `data-` instead of a class

Two render defects, both found by rendering a real 14-board document and
measuring the result rather than reading the markup.

**The horizontal gutter came out of the board's own width.** `body` is a block
box, so its `width: auto` resolves to the viewport minus its own horizontal
padding: `padding: 24px` made the containing block 1440 - 24*2 = 1392px, while a
board authored for the 1440px desktop viewport is a 1440px `.wf-page` that must
not shrink (`flex-shrink: 0`, the fixed-layout invariant). Every desktop
document therefore overhung its parent by 24px on each side and scrolled
sideways. `box-sizing` cannot correct it — that reinterprets an *explicit\* width
and there is none here. The gutter now applies only on the vertical axis, where
a document scrolls by nature and the leading costs nothing; horizontally the
board fills the viewport exactly as authored, and a board wider than the window
still keeps its width and scrolls by its own overflow.

**A component invocation carried a class no stylesheet defined.**
`renderComponentUse` emitted `wf-component-instance`, which no rule in the
generated CSS defined and nothing read. The wrapper declares `display: contents`
so that it has no box and its children lay out as though it were not there;
any rule giving it a box would defeat that, so there is no style the class could
ever legitimately carry. The identity exists to be queried, not painted, and now
lives only in the `data-wf-component` / `data-wf-instance` attributes that
already carried it.

The dead-CSS test previously checked one direction — a styled class must reach
the markup. It now checks both, so a class the markup wears while the stylesheet
leaves it undefined fails too. The documented boundary that component
interactions require the linked path (`linkAndCompileApp`), because a handler in
a definition targets an unbound parameter until the linker binds the
invocation's inputs, is pinned by tests as well.
