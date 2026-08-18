# Changelog

## 3.1.0-beta.8

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

## 3.1.0-beta.7

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

## 3.1.0-beta.6

### Patch Changes

- [`8853f3a`](https://github.com/wireweave/wireweave/commit/8853f3ae77cc348c8527c2ccff032a7997cc1ce7) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - fix: check component parameter references wherever substitution reaches them

  A component body may reference a parameter anywhere a string value sits, and
  link-time substitution replaces all of them — it walks arrays and nested objects
  and skips only `loc`. Both reference checks, in `linkApp` and in `validate`,
  looked instead at a node's own top-level string properties. Substitution was
  deep while validation was shallow, and the asymmetry was the defect.

  A reference nested inside an interaction effect fell through the gap:

  ```
  component c(to: string) {
    button "x" on={event=click, effects=[{kind=navigate, target="$too"}]}
  }
  ```

  `$too` is not a declared parameter, but neither check inspected `effects[0]`, so
  no diagnostic was raised and the misspelling rendered as the literal string
  `"$too"` — a dead navigation target with nothing in the output to say so.

  Both call sites now share one traversal and one reference pattern, so
  substitution and validation cannot disagree about what a reference is or where
  one can appear. Undeclared references in nested objects and in arrays are
  reported with the same message and code as before; correct references and
  partial matches such as `"go to $to"` are unaffected.

## 3.1.0-beta.5

### Minor Changes

- [#40](https://github.com/wireweave/wireweave/pull/40) [`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: expose the shared anchor navigation intent and classify URL-shaped `navigate` targets as external transitions.

  fix: align the legacy `module` entrypoint with the published ESM file declared by `exports.import`.

- [#41](https://github.com/wireweave/wireweave/pull/41) [`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - Add reusable application components, deterministic multi-screen compilation, and typed prototype interactions.

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: publish the DSL specification as a `./spec` export subpath

  `ATTRIBUTE_SPECS`, `COMPONENT_SPECS`, `GRAMMAR_ELEMENTS`, `BOX_ATTRIBUTES`,
  `INTERACTIVE_ATTRIBUTES` and the lookup helpers around them were already the
  single source the grammar derives from, but they were only reachable through
  the package root — a consumer that wanted the specification had to pull in the
  parser and renderer to get it.

  `@wireweave/core/spec` now serves that surface on its own, built as a separate
  entry so an editor-integration package pays for the spec and nothing else.
  `@wireweave/language-data` is the first consumer: it derives its element and
  attribute vocabulary from this subpath rather than restating it, which is what
  lets a new grammar element fail that package's build until its editor metadata
  exists.

  Additive — the same names remain exported from the root, and no existing entry
  point changed.

- [#39](https://github.com/wireweave/wireweave/pull/39) [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: publish the verified named layout, slot, page-uses, and site-render contract for Wireweave beta.

  Component definition/invocation reuse remains out of scope until the full end-to-end contract is implemented and verified.

### Patch Changes

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - fix: stop accepting `visibleWhen` / `enabledWhen` on `page`

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

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - fix: correct the legacy entry fields both packages publish

  `main` is the CommonJS fallback for resolvers that do not read `exports`, and
  `module` is the bundler convention for the ESM build. Both packages pointed
  `main` at the ESM `dist/index.js` while shipping a perfectly good
  `dist/index.cjs`, so a consumer old enough to fall back to `main` got ESM
  syntax it could not parse. `@wireweave/core` additionally set
  `module: dist/index.mjs`, a file tsup has never emitted — webpack, rollup, and
  any vite config that honours `module` resolved core to nothing.

  Both now match the rest of the workspace: `main: dist/index.cjs`,
  `module: dist/index.js`. Modern resolution is unaffected — the `exports` maps
  were already correct and take precedence.

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - fix: serve CommonJS consumers CommonJS type declarations

  Each of these packages ships both an ESM and a CJS build but declared a single
  `exports` `"types"` entry pointing at the ESM `.d.ts`. TypeScript resolves types
  through the same condition it resolves code, so a consumer doing
  `require('@wireweave/core')` under `moduleResolution: node16`/`bundler` was
  handed declarations that only typecheck when the package is dynamically
  imported — the types said "ESM" while the code said "CJS".

  The maps now split `import` and `require`, each with its own `types`, matching
  the shape `@wireweave/agent-prompts` already used. Every subpath is covered, and
  the `.d.cts` files they point at were already being emitted. No entry point was added or
  removed and every path resolves to the same code as before.

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - chore: declare `sideEffects: false` on the packages that have none

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

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - chore: serve core's source to the workspace and its dist to npm

  `packages/core` now points `main` / `module` at `src/index.ts` and adds a
  `development` condition to every `exports` entry, so TypeScript,
  typescript-eslint and Vite/Vitest read core's source instead of its build
  output. This removes the ordering dependency that made `lint`, `typecheck` and
  `test` observe a half-written `dist/` when run alongside `build` — a race that
  produced failures naming files the author never touched, and that vanished on
  re-run, which taught readers that red meant nothing.

  What npm receives is unchanged. A `publishConfig` block carries the dist-based
  `main` / `module` / `types` / `exports` map, and pnpm substitutes it at pack
  time; the packaging gate's `publint --strict` run asserts every substituted
  field resolves, and the tarball gate asserts the published archive contains
  exactly what those fields point at and nothing from `src/`.

## 3.1.0-beta.4

### Minor Changes

- [#41](https://github.com/wireweave/wireweave/pull/41) [`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - Add reusable application components, deterministic multi-screen compilation, and typed prototype interactions.

## 3.1.0-beta.3

### Minor Changes

- [#40](https://github.com/wireweave/wireweave/pull/40) [`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: expose the shared anchor navigation intent and classify URL-shaped `navigate` targets as external transitions.

  fix: align the legacy `module` entrypoint with the published ESM file declared by `exports.import`.

## 3.1.0-beta.2

### Minor Changes

- [#39](https://github.com/wireweave/wireweave/pull/39) [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: publish the verified named layout, slot, page-uses, and site-render contract for Wireweave beta.

  Component definition/invocation reuse remains out of scope until the full end-to-end contract is implemented and verified.

## 3.1.0-beta.1

### Minor Changes

- [`506993d`](https://github.com/wireweave/wireweave/commit/506993dc040aa5702a5113d8bb5979ddb5f32c4f) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: button accessible-name attributes + shared unknown-icon placeholder + lucide overflow alias remap
  - `button` now accepts `aria` / `aria-label` (rendered as `aria-label`) and `title`
    (tooltip + fallback name), giving icon-only buttons a real accessible name
    (WCAG 4.1.2): `button "" icon="x" aria="Close"`. Only emitted when authored —
    buttons with visible text render unchanged.
  - Unknown icon names now render one canonical placeholder everywhere (icon node,
    button icon, input icon) via the new `renderUnknownIconSvg` export — a dashed
    circle with a `?` glyph plus a `title="Unknown icon: <name>"` hover — instead of
    leaking the raw DSL name as literal `[name]` text in button/input.
  - The overflow/kebab-menu aliases now target the real Lucide keys after the
    upstream rename: `more-horizontal` / `dots` → `ellipsis`, `more-vertical` /
    `dots-vertical` → `ellipsis-vertical` — none of the legacy names dead-end into
    the placeholder anymore.

### Patch Changes

- [`e1142b0`](https://github.com/wireweave/wireweave/commit/e1142b0e385a8919799cf9c1a1364c224ca52a7c) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - fix(renderer): keep multi-page canvas from shrinking and scope drawers to their board

  Two rendering fixes for the multi-page canvas, both instances of the fixed-layout
  invariant (see `no-responsive.md`):
  - `renderToHtml` wraps its output in a flex `<body>`. The multi-page `.wf-canvas`
    was a flex item without `flex-shrink: 0`, so it collapsed below its intrinsic
    width when the viewport was narrower than the canvas and the boards reflowed —
    the same defect the single-page `.wf-page` already guards against. The standalone
    wrapper now emits `.wf-canvas { flex-shrink: 0 }` (prefix-aware).
  - `.wf-drawer` used `position: fixed`, so a drawer inside a page escaped to the
    viewport top-left and overlapped other boards in canvas mode. It is now
    `position: absolute`, scoping it to its nearest positioned ancestor
    (`.wf-page` / `.wf-canvas-board`) — the same board-scoping the modal backdrop
    already uses.

## 3.1.0-beta.0

### Minor Changes

- [`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: opt-in source anchors (`data-wf-path` / `data-wf-loc`) + DOM↔AST↔source mapping APIs

  Add a `sourceAnchors` render option (default `false`, output byte-identical when off) that stamps each rendered component element with `data-wf-path` (page-relative index path) and `data-wf-loc` (source offset range). New extract APIs invert the mapping: `buildAnchorIndex` / `resolveAnchor` (path ↔ AST node), `getPageSource` / `getNodeSource` (path → DSL source slice), and `buildDomTree` (panel-ready DOM tree). Renderer injection and the index share a single path scheme, so the emitted anchors and the index can never diverge. Additive — existing class/`data-*` contracts are unchanged.

- [`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: deterministic extraction APIs — `extractScreenFields` (SSOT Screen field derivation) and `extractScreenTransitions` (multi-screen transition graph, including nav/dropdown/breadcrumb menu-item navigate/opens/toggles/action triggers)

- [`13f22ee`](https://github.com/wireweave/wireweave/commit/13f22ee7239d72cd4e31cb7b22802b4457e3b8a0) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: canonical `.wf` printer — `printWireframe` (AST → deterministic canonical DSL text) and `formatWireframeCode` (parse + reprint). Single canonical form (fixed indentation, attribute ordering, quoting, blank-line policy) with tested round-trip laws: `parse(print(ast))` is structurally lossless, printing is an idempotent fixpoint, and canonical text reprints byte-identical.

## [3.0.0](https://github.com/wireweave/core/compare/v3.0.0-beta.0...v3.0.0) (2026-05-08)

## [3.0.0-beta.0](https://github.com/wireweave/core/compare/v2.8.0...v3.0.0-beta.0) (2026-05-08)

### ⚠ BREAKING CHANGES

- **renderer:** renderCanvas no longer emits chrome / grid / labels.
  The renderer now produces a single bounded `<div class="wf-canvas">` of the
  exact layout extent containing absolutely-positioned `<div class="wf-canvas-board">`
  wrappers. Hosts (dashboard infinite-canvas viewer, markdown-plugin, vscode-extension,
  SVG export) are responsible for chrome, grid, pan-zoom, and labels.

Removed:

- `CanvasChrome` type and `chrome` / `canvasBackground` options on `CanvasOptions`
- chrome routing in `render()` / `renderToSvg()`

Added:

- `page "X" at(x, y) { ... }` grammar — canvas coordinates resolved into
  `Page.x` / `Page.y` for explicit placement; pages without `at(...)` auto-flow
  horizontally with configurable gap (default 64px)
- `renderPage(page)` — pure single-page export primitive
- `renderCanvas(doc, opts?)` — multi-page composition (gap-only options)
- `layoutCanvas(pages, gap?)` — pure utility that returns `{ placed, width, height }`
  so hosts can compose their own DOM
- `PlacedPage` public type
- `data-page-x` / `data-page-y` / `data-page-w` / `data-page-h` /
  `data-page-title` attributes on each board for host-DOM communication

Migration:

- `renderCanvas(doc, { chrome: 'editor' })` → `renderCanvas(doc)` and let the host
  apply its own chrome (Figma-style grid is the dashboard editor's responsibility)
- `chrome: 'preview'` consumers (markdown-plugin, vscode-extension preview)
  already work — they don't pass `chrome` and now receive bare bounded layout

### Features

- **renderer:** multi-page canvas with bounded layout output ([a93548f](https://github.com/wireweave/core/commit/a93548fd484505da098d8e463da9d3df080572a1))

## [2.8.0](https://github.com/wireweave/core/compare/v2.7.1...v2.8.0) (2026-05-08)

### Features

- **renderer:** default vertical gap on main, tighter sidebar, visible breadcrumb separator ([27668b7](https://github.com/wireweave/core/commit/27668b778e4db6f0c0d93393a014cbd88085d3a9))

## [2.7.1](https://github.com/wireweave/core/compare/v2.7.1-beta.0...v2.7.1) (2026-03-23)

## [2.7.1-beta.0](https://github.com/wireweave/core/compare/v2.7.0...v2.7.1-beta.0) (2026-03-21)

### Bug Fixes

- **renderer:** prevent page shrinking in flex containers ([9d23737](https://github.com/wireweave/core/commit/9d2373786c57215bbfcfa67533ee47fe9d8298ff))

### Documentation

- **rules:** add fixed layout rendering philosophy ([96a503f](https://github.com/wireweave/core/commit/96a503f3154a7fcf68c1eefda2849bb6b0a534fa))

## [2.7.0](https://github.com/wireweave/core/compare/v2.7.0-beta.0...v2.7.0) (2026-03-17)

## [2.7.0-beta.0](https://github.com/wireweave/core/compare/v2.6.2...v2.7.0-beta.0) (2026-03-17)

### Features

- **storybook:** add storybook setup and component stories ([f40360c](https://github.com/wireweave/core/commit/f40360cb7d39717609d388017ca3c82504e6f1ad))

### Documentation

- **claude:** simplify core package documentation ([62db518](https://github.com/wireweave/core/commit/62db518280ebd7ee87606ecc461d99d32da75174))

## [2.6.2](https://github.com/wireweave/core/compare/v2.6.2-beta.0...v2.6.2) (2026-03-09)

## [2.6.2-beta.0](https://github.com/wireweave/core/compare/v2.6.1...v2.6.2-beta.0) (2026-03-09)

### Bug Fixes

- **renderer:** move annotations outside viewport overflow ([c593cfc](https://github.com/wireweave/core/commit/c593cfc1f7cadebb3a728d4465327623a21b60db))

## [2.6.1](https://github.com/wireweave/core/compare/v2.6.1-beta.2...v2.6.1) (2026-03-09)

## [2.6.1-beta.2](https://github.com/wireweave/core/compare/v2.6.1-beta.1...v2.6.1-beta.2) (2026-03-09)

## [2.6.1-beta.1](https://github.com/wireweave/core/compare/v2.6.1-beta.0...v2.6.1-beta.1) (2026-03-08)

## [2.6.1-beta.0](https://github.com/wireweave/core/compare/v2.6.0...v2.6.1-beta.0) (2026-03-07)

### Documentation

- **core:** update dependency table with deployment info ([a44cc6f](https://github.com/wireweave/core/commit/a44cc6fd300d3fb3a38c8e3e1b03b4f0cf95fe0b))

## [2.6.0](https://github.com/wireweave/core/compare/v2.6.0-beta.0...v2.6.0) (2026-03-07)

## [2.6.0-beta.0](https://github.com/wireweave/core/compare/v2.5.1...v2.6.0-beta.0) (2026-03-07)

### Features

- **divider:** add vertical divider support ([6353e6e](https://github.com/wireweave/core/commit/6353e6e15e26e51b6d8b8020551df02d8131b921))
- **styles:** add border utility class ([d13cc0e](https://github.com/wireweave/core/commit/d13cc0e600951ff5dbee3a0e01aee4b4b7ee5dc6))

### Documentation

- **deps:** remove obsolete package dependencies ([1f2808a](https://github.com/wireweave/core/commit/1f2808a3e0c7264810c8da35462e6527c503a98b))

## [2.5.1](https://github.com/wireweave/core/compare/v2.5.0...v2.5.1) (2026-03-04)

## [2.5.0](https://github.com/wireweave/core/compare/v2.4.0...v2.5.0) (2026-03-04)

### Features

- **annotation:** add marker and annotations panel components ([7493df8](https://github.com/wireweave/core/commit/7493df8469ba18348191d028a0d14b10e3b75868))

## [2.4.0](https://github.com/wireweave/core/compare/v2.3.1...v2.4.0) (2026-03-04)

### Features

- **export:** support Stack and Relative in Figma export ([6f72101](https://github.com/wireweave/core/commit/6f721018c1a13a18bd1d2ad2839aff1afadb317b))
- **layout:** add Stack and Relative layout components ([8de68a4](https://github.com/wireweave/core/commit/8de68a42026ba3be8dc78be730ada6126b3ff902))

## [2.3.1](https://github.com/wireweave/core/compare/v2.3.0...v2.3.1) (2026-02-27)

## [2.3.0-beta.0](https://github.com/wireweave/core/compare/v2.3.0...v2.3.1) (2026-02-27)

## [2.3.0](https://github.com/wireweave/core/compare/v2.2.0...v2.3.0) (2026-02-27)

### Features

- **renderer:** add background color appearance props ([d2cafc7](https://github.com/wireweave/core/commit/d2cafc7e4d2eab50d8d7314327bdb4e7b0c0d19e))

## [2.2.0](https://github.com/wireweave/core/compare/v2.2.0-beta.0...v2.2.0) (2026-02-25)

## [2.2.0-beta.0](https://github.com/wireweave/core/compare/v2.1.0...v2.2.0-beta.0) (2026-02-25)

### Features

- **renderer:** support custom size units for components ([93cd776](https://github.com/wireweave/core/commit/93cd776f54a3d95416ba65b1cc96fec5dfa47668))

## [2.1.0](https://github.com/wireweave/core/compare/v2.1.0-beta.0...v2.1.0) (2026-02-23)

## [2.1.0-beta.0](https://github.com/wireweave/core/compare/v2.0.2...v2.1.0-beta.0) (2026-02-23)

### Features

- **grid:** add scroll support to col component ([d88db60](https://github.com/wireweave/core/commit/d88db609a873460834a7f9521112e292edb2724b))

## [2.0.2](https://github.com/wireweave/core/compare/v2.0.2-beta.0...v2.0.2) (2026-02-09)

## [2.0.2-beta.0](https://github.com/wireweave/core/compare/v2.0.1...v2.0.2-beta.0) (2026-02-09)

### Bug Fixes

- **input:** handle input type attribute and select placeholder selection ([237e279](https://github.com/wireweave/core/commit/237e279fe645345b301680c10b0f1149963a80e3))
- **layout:** prevent header/footer from shrinking in flex layout ([e764a70](https://github.com/wireweave/core/commit/e764a70778f4bf3c85ed6fd2289e9abb1ded697b))
- **spec:** add missing name attribute to icon component ([632cfa2](https://github.com/wireweave/core/commit/632cfa22918334f7268b40b9c1ea94adefa6b093))

## [2.0.1](https://github.com/wireweave/core/compare/v2.0.1-beta.2...v2.0.1) (2026-01-24)

## [2.0.1-beta.2](https://github.com/wireweave/core/compare/v2.0.1-beta.1...v2.0.1-beta.2) (2026-01-24)

### Documentation

- **readme:** update logo path to docs site ([0396f21](https://github.com/wireweave/core/commit/0396f21889620d168635aa3251f3eddf6fad3b43))

## [2.0.1-beta.1](https://github.com/wireweave/core/compare/v2.0.1-beta.0...v2.0.1-beta.1) (2026-01-17)

### Documentation

- **changelog:** fix typo in breaking change description ([2c9158a](https://github.com/wireweave/core/commit/2c9158a0cecf318a43c5273a9afa440120b54573))

## [2.0.1-beta.0](https://github.com/wireweave/core/compare/v2.0.0...v2.0.1-beta.0) (2026-01-17)

### Bug Fixes

- **styles:** add flex display to card for gap support ([3483f2a](https://github.com/wireweave/core/commit/3483f2a5e07b6bae6549f2368309558cf4e7f7ab))

## [2.0.0](https://github.com/wireweave/core/compare/v2.0.0-beta.0...v2.0.0) (2026-01-17)

## [2.0.0-beta.0](https://github.com/wireweave/core/compare/v1.5.0...v2.0.0-beta.0) (2026-01-17)

### ⚠ BREAKING CHANGES

- **parser:** 'type=' attribute no longer auto-converts to 'inputType='

* Use 'inputType=email' instead of 'inputType=email' for input fields
* 'type=' now correctly fails validation as it conflicts with internal node type
* Consistent behavior across all components and validation layers

### Bug Fixes

- **parser:** remove type to inputType conversion ([a8fd619](https://github.com/wireweave/core/commit/a8fd619236feff6c262757431a7dc606d22dfa49))

## [1.5.0](https://github.com/wireweave/core/compare/v1.5.0-beta.0...v1.5.0) (2026-01-17)

## [1.5.0-beta.0](https://github.com/wireweave/core/compare/v1.4.1...v1.5.0-beta.0) (2026-01-17)

### Features

- add interactive attributes support (navigate, opens, toggles, action) ([f0523b9](https://github.com/wireweave/core/commit/f0523b9952f58ddead37d055e5705bbcde320de2))

## [1.4.1](https://github.com/wireweave/core/compare/v1.4.1-beta.2...v1.4.1) (2026-01-17)

## [1.4.1-beta.2](https://github.com/wireweave/core/compare/v1.4.1-beta.1...v1.4.1-beta.2) (2026-01-17)

### Bug Fixes

- simplify width/height type check in renderToSvg ([0ab4910](https://github.com/wireweave/core/commit/0ab491058c38ee478bea284a1d489e8ad6dc355a))

## [1.4.1-beta.1](https://github.com/wireweave/core/compare/v1.4.1-beta.0...v1.4.1-beta.1) (2026-01-17)

### Bug Fixes

- support page width/height attributes in renderToSvg ([110c227](https://github.com/wireweave/core/commit/110c2275e9d6778c064a1816c8fa42eb722f32e0))

## [1.4.1-beta.0](https://github.com/wireweave/core/compare/v1.4.0...v1.4.1-beta.0) (2026-01-17)

### Bug Fixes

- use XML-compatible boolean attribute format for SVG foreignObject ([7e11028](https://github.com/wireweave/core/commit/7e110286fa5c0dff211e4505ba11ee8246a4a70b))

## [1.4.0](https://github.com/wireweave/core/compare/v1.4.0-beta.2...v1.4.0) (2026-01-17)

## [1.4.0-beta.2](https://github.com/wireweave/core/compare/v1.4.0-beta.1...v1.4.0-beta.2) (2026-01-17)

### Bug Fixes

- use theme background color for badge text instead of hardcoded white ([f847845](https://github.com/wireweave/core/commit/f8478457496df8d4a9361f6a1cc8cbd5ff9d16ca))

## [1.4.0-beta.1](https://github.com/wireweave/core/compare/v1.4.0-beta.0...v1.4.0-beta.1) (2026-01-17)

### Bug Fixes

- apply background option only to page element, not theme colors ([7312799](https://github.com/wireweave/core/commit/731279946e033a19d7c91f07f030160a91afce47))

## [1.4.0-beta.0](https://github.com/wireweave/core/compare/v1.3.0...v1.4.0-beta.0) (2026-01-17)

### Features

- **renderer:** add background option to RenderOptions ([626e71b](https://github.com/wireweave/core/commit/626e71b11fdd7ae08d10285a46e13badbda73465))

## [1.3.0](https://github.com/wireweave/core/compare/v1.3.0-beta.0...v1.3.0) (2026-01-17)

## [1.3.0-beta.0](https://github.com/wireweave/core/compare/v1.2.0-beta.3...v1.3.0-beta.0) (2026-01-17)

## [1.2.0-beta.3](https://github.com/wireweave/core/compare/v1.2.0...v1.2.0-beta.3) (2026-01-17)

### Features

- **renderer:** add theme support to SVG rendering ([3e0967b](https://github.com/wireweave/core/commit/3e0967ba2b1e481412d7f2de6c56cddd967a2b47))

### Refactoring

- remove UX validation engine and rules ([8f33508](https://github.com/wireweave/core/commit/8f33508a2f0e2ca31cddd724f32a9414b9ec42bd))

### Documentation

- add core package documentation ([0b4d81f](https://github.com/wireweave/core/commit/0b4d81f4f07f263797fb894e2a56e11361b3d249))

## [1.2.0](https://github.com/wireweave/core/compare/v1.2.0-beta.2...v1.2.0) (2026-01-14)

## [1.2.0-beta.2](https://github.com/wireweave/core/compare/v1.2.0-beta.1...v1.2.0-beta.2) (2026-01-14)

### Documentation

- update README with new API documentation ([1a11246](https://github.com/wireweave/core/commit/1a112460420f96d36b260c85c067828b0d6ae2db))

## [1.2.0-beta.1](https://github.com/wireweave/core/compare/v1.2.0-beta.0...v1.2.0-beta.1) (2026-01-14)

## [1.2.0-beta.0](https://github.com/wireweave/core/compare/v1.1.0-beta.0...v1.2.0-beta.0) (2026-01-14)

### Features

- **grammar:** add simplified syntax for table and dropdown components ([3186c06](https://github.com/wireweave/core/commit/3186c06a8ef185f0e7a208acbed746fed34c7eb5))
- introduce analyze, diff, export, and ux-rules modules ([b704e2a](https://github.com/wireweave/core/commit/b704e2a3884b6bbbb9fe8568ee120efe049f1e04))

### Bug Fixes

- remove console.warn to fix DTS build error ([3152399](https://github.com/wireweave/core/commit/31523993552a37aada4bdd396889d4caca20bb6a))

### Refactoring

- **analyze:** restructure analysis module and metrics ([73ffabf](https://github.com/wireweave/core/commit/73ffabf4bbe10d48afb7387ee16f0f168e0c4acb))
- **diff:** modularize document comparison logic ([10390d5](https://github.com/wireweave/core/commit/10390d5116fb6624094d96851d8552b388f7894e))
- **export:** modularize Figma and JSON export functionality ([b7271f5](https://github.com/wireweave/core/commit/b7271f5c7aa8184bd5533644a09eda797756c633))
- **renderer:** modularize HTML rendering and remove legacy SVG renderer ([5688d98](https://github.com/wireweave/core/commit/5688d981a99fc10949490239b1f819444fe2ae58))

## 1.1.0-beta.0 (2026-01-10)

### Features

- add DSL spec and validation to core ([5bc446b](https://github.com/wireweave/core/commit/5bc446bbb9ee5c67b9230120c196ba36f1e3f29a))
- improve SVG renderer layout calculations ([79f03f5](https://github.com/wireweave/core/commit/79f03f5761ac2f9546c362f10a2a5882f4457951))

### Bug Fixes

- allow release-it to run on develop branch ([00ef735](https://github.com/wireweave/core/commit/00ef73546b404f2d2d721b3340ffed7db923be41))
- use npm latest version for beta versioning ([3467b78](https://github.com/wireweave/core/commit/3467b78b057fd78a76863c09a330bb4153fb4c67))

### Refactoring

- use release-it preRelease for beta versioning ([0c2ed10](https://github.com/wireweave/core/commit/0c2ed105fc6ee705a26b60eeaf895dfd3ae67ab7))

## 1.1.0 (2026-01-07)

### Features

- add npm publish workflow with release-it ([cfde2cd](https://github.com/wireweave/core/commit/cfde2cd6d9bff50b60c2e741395f13a5d890cc1a))
- switch to OIDC trusted publishing ([81f1a99](https://github.com/wireweave/core/commit/81f1a99748b66024bbac052865ec9a8339019286))

### Bug Fixes

- add provenance flag for release-it npm publish ([25669ba](https://github.com/wireweave/core/commit/25669ba107250b50bd29ec55b866623523907b37))
- add repository field for npm trusted publishing ([0953696](https://github.com/wireweave/core/commit/09536962d993f0a16e00746e1d3c5dbf6a616553))
- inline tsconfig base for standalone build ([f823d45](https://github.com/wireweave/core/commit/f823d4583d7f2437cf471fcf696f5581b1126ac0))
- remove registry-url for OIDC trusted publishing ([b56a01f](https://github.com/wireweave/core/commit/b56a01f6bf02a83e9b924f185cbe96d6d3c7b24b))
- remove src from npm package files ([2eebd43](https://github.com/wireweave/core/commit/2eebd432b30a5e3eb5158bad09e1c54c072705d1))
- restore registry-url for OIDC ([caf569e](https://github.com/wireweave/core/commit/caf569ef322c2e16dd5480d0ae1b625121a8fcaa))
- skip npm auth check for OIDC trusted publishing ([4cd26da](https://github.com/wireweave/core/commit/4cd26dacf8b4236c074b8d0d6dcc296aa9ca3113))
- update npm to latest for trusted publishing ([36bd5bf](https://github.com/wireweave/core/commit/36bd5bf2a9d33968e3833c3ffdc10883452fc4cf))
- use GitHub raw URL for logo in README ([1893d13](https://github.com/wireweave/core/commit/1893d1366f6bb72575c764323a220d40efbad885))

### Performance

- disable sourcemap to reduce package size ([14d788f](https://github.com/wireweave/core/commit/14d788f3202d1c0fb6b4c9c6a8757b77b3029c75))
