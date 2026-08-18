# Changelog

## 1.5.0-beta.7

### Patch Changes

- Updated dependencies [[`ef8f7c3`](https://github.com/wireweave/wireweave/commit/ef8f7c3032c9291c26ff941c954ad6513150e6ff)]:
  - @wireweave/core@3.1.0-beta.7

## 1.5.0-beta.6

### Patch Changes

- Updated dependencies [[`8853f3a`](https://github.com/wireweave/wireweave/commit/8853f3ae77cc348c8527c2ccff032a7997cc1ce7)]:
  - @wireweave/core@3.1.0-beta.6

## 1.5.0-beta.5

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

- Updated dependencies [[`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c), [`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9)]:
  - @wireweave/core@3.1.0-beta.5

## 1.5.0-beta.4

### Patch Changes

- Updated dependencies [[`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66)]:
  - @wireweave/core@3.1.0-beta.4

## 1.5.0-beta.3

### Patch Changes

- Updated dependencies [[`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c)]:
  - @wireweave/core@3.1.0-beta.3

## 1.5.0-beta.2

### Patch Changes

- Updated dependencies [[`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc)]:
  - @wireweave/core@3.1.0-beta.2

## 1.5.0-beta.1

### Minor Changes

- [`ab1ef5b`](https://github.com/wireweave/wireweave/commit/ab1ef5b45efaea1490901f719191949e8b09c9bf) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: three authoring-correctness content rules + icon-button a11y recalibration
  - `content-unknown-icon` (warning): icon names on `button` / `input` / `icon` must
    resolve to a real Lucide glyph — resolution is delegated to core's `getIconData`
    (exact name, alias map, camelCase→kebab) so the rule never drifts from the renderer.
  - `content-control-value-range` (warning): a `slider` / `progress` `value` must lie
    within its declared `[min, max]` — an out-of-range value paints a pinned thumb/bar
    while announcing an impossible number. Range defaults mirror the renderer
    (slider `0..100`, progress `0..max||100`).
  - `content-duplicate-control-label` (warning): a `slider` / `input` label must not be
    repeated verbatim by an adjacent sibling `text` node (the "Temperature appears
    twice" defect). Adjacency-scoped (`index ± 1`, same parent) so legitimate repeats
    elsewhere are not flagged.
  - `a11y-icon-button-label` recalibrated for wireframes: an icon-only button with an
    `aria` / `aria-label` / `title` accessible name now passes, and a missing name is a
    `warning` instead of an `error` — a low-fidelity sketch should not hard-fail the
    document's `valid` gate over a placeholder's accessible name.

### Patch Changes

- Updated dependencies [[`506993d`](https://github.com/wireweave/wireweave/commit/506993dc040aa5702a5113d8bb5979ddb5f32c4f), [`e1142b0`](https://github.com/wireweave/wireweave/commit/e1142b0e385a8919799cf9c1a1364c224ca52a7c)]:
  - @wireweave/core@3.1.0-beta.1

## 1.4.1-beta.0

### Patch Changes

- Updated dependencies [[`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918), [`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918), [`13f22ee`](https://github.com/wireweave/wireweave/commit/13f22ee7239d72cd4e31cb7b22802b4457e3b8a0)]:
  - @wireweave/core@3.1.0-beta.0

## 1.4.0

## [1.4.0-beta.0](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-05-29)

## [1.3.0-beta.0](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-05-27)

### Features

- **usability:** detect overlapping pages on canvas ([cf54cbc](https://github.com/wireweave/ux-rules/commit/cf54cbc03cf47cea704ef83793818b863348804e))
- **validation:** normalize UX scores by complexity ([f509842](https://github.com/wireweave/ux-rules/commit/f50984207acef42c2ea46511ba59255fa6b9ed97))

### Refactoring

- **scoring:** extract complexity reference constant ([d197ffa](https://github.com/wireweave/ux-rules/commit/d197ffa15bce6d0aa1c311ff8688275aaf4aa8cf))

### Documentation

- **rules:** add rule severity and design guides ([3fdd934](https://github.com/wireweave/ux-rules/commit/3fdd9349ee42e2ecd96e5b88dbcefcaad4da174a))

## [1.2.3-beta.0](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-03-17)

## [1.2.2-beta.0](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-03-09)

## [1.2.1-beta.3](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-03-09)

## [1.2.1-beta.2](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-03-08)

## [1.2.1-beta.1](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-03-07)

## [1.2.1-beta.0](https://github.com/wireweave/ux-rules/compare/v1.3.0-beta.0...v1.4.0-beta.0) (2026-03-07)

## [1.3.0](https://github.com/wireweave/ux-rules/compare/v1.2.2...v1.3.0) (2026-05-27)

## [1.3.0-beta.0](https://github.com/wireweave/ux-rules/compare/v1.2.3-beta.0...v1.3.0-beta.0) (2026-05-27)

### Features

- **usability:** detect overlapping pages on canvas ([cf54cbc](https://github.com/wireweave/ux-rules/commit/cf54cbc03cf47cea704ef83793818b863348804e))
- **validation:** normalize UX scores by complexity ([f509842](https://github.com/wireweave/ux-rules/commit/f50984207acef42c2ea46511ba59255fa6b9ed97))

### Refactoring

- **scoring:** extract complexity reference constant ([d197ffa](https://github.com/wireweave/ux-rules/commit/d197ffa15bce6d0aa1c311ff8688275aaf4aa8cf))

### Documentation

- **rules:** add rule severity and design guides ([3fdd934](https://github.com/wireweave/ux-rules/commit/3fdd9349ee42e2ecd96e5b88dbcefcaad4da174a))

## [1.2.3-beta.0](https://github.com/wireweave/ux-rules/compare/v1.2.2-beta.0...v1.2.3-beta.0) (2026-03-17)

## [1.2.2-beta.0](https://github.com/wireweave/ux-rules/compare/v1.2.2-beta.0...v1.2.3-beta.0) (2026-03-09)

## [1.2.1-beta.3](https://github.com/wireweave/ux-rules/compare/v1.2.2-beta.0...v1.2.3-beta.0) (2026-03-09)

## [1.2.1-beta.2](https://github.com/wireweave/ux-rules/compare/v1.2.2-beta.0...v1.2.3-beta.0) (2026-03-08)

## [1.2.1-beta.1](https://github.com/wireweave/ux-rules/compare/v1.2.2-beta.0...v1.2.3-beta.0) (2026-03-07)

## [1.2.1-beta.0](https://github.com/wireweave/ux-rules/compare/v1.2.2-beta.0...v1.2.3-beta.0) (2026-03-07)

## [1.2.2](https://github.com/wireweave/ux-rules/compare/v1.2.2-beta.0...v1.2.3-beta.0) (2026-03-09)

## [1.2.2](https://github.com/wireweave/ux-rules/compare/v1.2.1...v1.2.2) (2026-03-09)

## [1.2.2-beta.0](https://github.com/wireweave/ux-rules/compare/v1.2.1-beta.3...v1.2.2-beta.0) (2026-03-09)

## [1.2.1-beta.3](https://github.com/wireweave/ux-rules/compare/v1.2.1-beta.2...v1.2.1-beta.3) (2026-03-09)

## [1.2.1-beta.2](https://github.com/wireweave/ux-rules/compare/v1.2.1-beta.1...v1.2.1-beta.2) (2026-03-08)

## [1.2.1-beta.1](https://github.com/wireweave/ux-rules/compare/v1.2.1-beta.0...v1.2.1-beta.1) (2026-03-07)

## [1.2.1](https://github.com/wireweave/ux-rules/compare/v1.2.0...v1.2.1) (2026-03-07)

## [1.2.1-beta.0](https://github.com/wireweave/ux-rules/compare/v1.2.0...v1.2.1-beta.0) (2026-03-07)

## [1.2.0](https://github.com/wireweave/ux-rules/compare/v1.2.0-beta.3...v1.2.0) (2026-03-04)

## [1.2.0-beta.3](https://github.com/wireweave/ux-rules/compare/v1.2.0-beta.2...v1.2.0-beta.3) (2026-03-04)

## [1.2.0-beta.2](https://github.com/wireweave/ux-rules/compare/v1.2.0-beta.1...v1.2.0-beta.2) (2026-02-25)

## [1.2.0-beta.1](https://github.com/wireweave/ux-rules/compare/v1.2.0-beta.0...v1.2.0-beta.1) (2026-02-23)

## [1.2.0-beta.0](https://github.com/wireweave/ux-rules/compare/v1.1.0...v1.2.0-beta.0) (2026-01-17)

### Features

- add content, data-display, and feedback rule categories ([2acab84](https://github.com/wireweave/ux-rules/commit/2acab84020947b202b0d741f6b6698598a4e01ca))
- setup npm public publishing with release-it ([a8738ef](https://github.com/wireweave/ux-rules/commit/a8738ef553e7abe9aa5d140a78de9c5e625d22af))

### Refactoring

- centralize utils and constants, add interaction rules ([7e77fd9](https://github.com/wireweave/ux-rules/commit/7e77fd920f509cd2394260e975f7950ce2287bc3))

### Documentation

- update README for npm public package ([241d588](https://github.com/wireweave/ux-rules/commit/241d58853ccf4fe27c127662f02b7c5aebf6d72e))

## [1.1.0](https://github.com/wireweave/ux-rules/compare/v1.0.0...v1.1.0) (2026-01-17)

### Features

- add 18 new UX rules in 3 categories ([#2](https://github.com/wireweave/ux-rules/issues/2)) ([2d9cbd5](https://github.com/wireweave/ux-rules/commit/2d9cbd5ad870e7a6aad31b6ba7e1a2deb5d91f30))
- setup npm public publishing with release-it ([#1](https://github.com/wireweave/ux-rules/issues/1)) ([138bcc1](https://github.com/wireweave/ux-rules/commit/138bcc15b67409a959a246c422f1cc04dd9a0a44))
