# Changelog

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
