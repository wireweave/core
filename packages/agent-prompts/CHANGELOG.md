# Changelog

## 0.2.0-beta.6

### Minor Changes

- [`af53020`](https://github.com/wireweave/wireweave/commit/af5302012ce5654f9d5b225adaeaefa57af3854c) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: `when=` — scope an element to the variant boards that draw it

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

## 0.2.0-beta.5

### Minor Changes

- [`2b9cea0`](https://github.com/wireweave/wireweave/commit/2b9cea0bbeb322ac70c29686cd56c8e504defa0e) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: `page … variants=[…]` — draw a screen's states as separate boards

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

## 0.2.0-beta.4

### Minor Changes

- [`ef8f7c3`](https://github.com/wireweave/wireweave/commit/ef8f7c3032c9291c26ff941c954ad6513150e6ff) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: `repeat N { … }` — fold repeated siblings instead of pasting them

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

## 0.2.0-beta.3

### Minor Changes

- [`8853f3a`](https://github.com/wireweave/wireweave/commit/8853f3ae77cc348c8527c2ccff032a7997cc1ce7) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: document component parameters and the `$` reference quoting rule in both grammar prompts

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

## 0.2.0-beta.2

### Minor Changes

- [#39](https://github.com/wireweave/wireweave/pull/39) [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: publish the verified named layout, slot, page-uses, and site-render contract for Wireweave beta.

  Component definition/invocation reuse remains out of scope until the full end-to-end contract is implemented and verified.

### Patch Changes

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - chore: declare the supported Node version on every published package

  Six of the eight packages declared no `engines` at all, so npm installed them
  onto any Node version without a word. The two that did — `@wireweave/cli`
  (`>=18`) and `@wireweave/sdk` (`>=20`) — claimed support for runtimes nothing
  in this repository has ever built or tested against, and were unsatisfiable
  besides: both depend transitively on `@wireweave/core`, so their real floor was
  whatever core's is.

  All eight now declare `node: >=22.13.0`, the version `.nvmrc` pins and the only
  one CI runs. This narrows the advertised range for `cli` and `sdk`; it does not
  narrow what actually worked, it stops advertising support that was never there.

## 0.2.0-beta.1

### Minor Changes

- [#39](https://github.com/wireweave/wireweave/pull/39) [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: publish the verified named layout, slot, page-uses, and site-render contract for Wireweave beta.

  Component definition/invocation reuse remains out of scope until the full end-to-end contract is implemented and verified.

## 0.2.0-beta.0

### Minor Changes

- [`23b0b5b`](https://github.com/wireweave/wireweave/commit/23b0b5beec314911c21695f39eafaab1826a8b90) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: document interaction wiring in both grammar prompts — `navigate` / `opens` / `toggles` / `action` on every clickable component entry (button, link, card, icon, avatar, badge, image, nav/dropdown item), `id` on modal/drawer as the opens/toggles target anchor, a dedicated INTERACTION WIRING section with one compact example per pattern, and a constraints rule that every clickable element declares exactly one interaction. Closes the gap where LLMs generating Wireweave DSL never saw the wiring syntax and produced screens with no first-class navigation.
