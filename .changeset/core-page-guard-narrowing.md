---
'@wireweave/core': patch
---

fix: stop accepting `visibleWhen` / `enabledWhen` on `page`

Both attributes reached `page` through the shared box-attribute list, so
`validate()` accepted them — while no renderer emitted anything for them and no
runtime toggled anything, making the rendered output byte-identical with and
without the guard. An author could write one, see no diagnostic, and get
nothing.

A guarded outcome is emitted by the component render path and read by the site
runtime. A page is the board that path renders _into_, so there is no element
for the guard to land on. The declaration is removed rather than the render path
added: hiding a whole board on state has no meaning in the site shell, where the
screen a viewer sees is chosen by navigation.

Every other element that spreads the box list keeps both attributes; only
`page`'s own surface narrows.
