# Changelog

## 1.6.0-beta.0

### Minor Changes

- [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - feat: derive the editor vocabulary from `@wireweave/core/spec`

  The element set, attribute names, value domains and descriptions this package
  offers to Monaco and CodeMirror were maintained as a parallel transcription of
  the DSL specification. A parallel copy drifts silently: an attribute added to
  the grammar simply never reached autocomplete, and nothing failed.

  They are now read from `@wireweave/core/spec`, which derives them from the
  grammar itself. Only genuinely editor-side concerns remain declared here —
  example snippets, parent/child hints, and the two documented gap categories in
  `core-spec-gaps.ts` (source spellings the grammar desugars, which correctly
  have no attribute spec, and a shrinking list of attributes core has yet to
  declare). Sync tests assert those lists stay disjoint from core, so the moment
  core adopts an entry the build fails until it is deleted here.

  This adds `@wireweave/core` as a runtime dependency of
  `@wireweave/language-data`; it was previously a peer of the editor integrations
  only. Consumers already installing both are unaffected.

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

- Updated dependencies [[`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c), [`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9)]:
  - @wireweave/core@3.1.0-beta.5

## [1.5.2](https://github.com/wireweave/language-data/compare/v1.5.2-beta.0...v1.5.2) (2026-03-15)

## [1.5.2-beta.0](https://github.com/wireweave/language-data/compare/v1.5.1...v1.5.2-beta.0) (2026-03-15)

### Documentation

- **readme:** fix project reference name ([21d435f](https://github.com/wireweave/language-data/commit/21d435fc07263beafdcbd64692bcc17891352c14))

## [1.5.1](https://github.com/wireweave/language-data/compare/v1.5.1-beta.2...v1.5.1) (2026-03-09)

## [1.5.1-beta.2](https://github.com/wireweave/language-data/compare/v1.5.1-beta.1...v1.5.1-beta.2) (2026-03-09)

## [1.5.1-beta.1](https://github.com/wireweave/language-data/compare/v1.5.1-beta.0...v1.5.1-beta.1) (2026-03-08)

## [1.5.1-beta.0](https://github.com/wireweave/language-data/compare/v1.5.0...v1.5.1-beta.0) (2026-03-07)

## [1.5.0](https://github.com/wireweave/language-data/compare/v1.5.0-beta.1...v1.5.0) (2026-03-07)

## [1.5.0-beta.1](https://github.com/wireweave/language-data/compare/v1.5.0-beta.0...v1.5.0-beta.1) (2026-03-07)

## [1.5.0-beta.0](https://github.com/wireweave/language-data/compare/v1.4.7-beta.0...v1.5.0-beta.0) (2026-03-07)

### Features

- **language-data:** add comprehensive DSL definitions for editor integration ([cb23ef7](https://github.com/wireweave/language-data/commit/cb23ef7ead85188bc599ad750f064eb34ff9c860))

## [1.4.7-beta.0](https://github.com/wireweave/language-data/compare/v1.4.6...v1.4.7-beta.0) (2026-02-18)

### Documentation

- fix dashboard URL reference ([95b3d89](https://github.com/wireweave/language-data/commit/95b3d896984976bc3f567562b568cf15404f343d))

## [1.4.6](https://github.com/wireweave/language-data/compare/v1.4.6-beta.0...v1.4.6) (2026-01-24)

## [1.4.6-beta.0](https://github.com/wireweave/language-data/compare/v1.4.5...v1.4.6-beta.0) (2026-01-24)

### Documentation

- **readme:** update logo URL to docs site ([1d43308](https://github.com/wireweave/language-data/commit/1d433088f31e3c0c18b1f7e01e4c0040944ca92a))

## [1.4.5](https://github.com/wireweave/language-data/compare/v1.4.5-beta.0...v1.4.5) (2026-01-17)

## [1.4.5-beta.0](https://github.com/wireweave/language-data/compare/v1.4.4...v1.4.5-beta.0) (2026-01-17)

## [1.4.4](https://github.com/wireweave/language-data/compare/v1.4.3...v1.4.4) (2026-01-17)

## [1.4.4-beta.0](https://github.com/wireweave/language-data/compare/v1.4.3...v1.4.4-beta.0) (2026-01-17)

## [1.4.3](https://github.com/wireweave/language-data/compare/v1.4.2-beta.0...v1.4.3) (2026-01-17)

## [1.4.2](https://github.com/wireweave/language-data/compare/v1.4.2-beta.0...v1.4.3) (2026-01-17)

## [1.4.2](https://github.com/wireweave/language-data/compare/v1.4.0...v1.4.2) (2026-01-17)

## [1.4.2-beta.0](https://github.com/wireweave/language-data/compare/v1.4.0...v1.4.2-beta.0) (2026-01-17)

## [1.4.0](https://github.com/wireweave/language-data/compare/v1.3.0-beta.0...v1.4.0) (2026-01-17)

### Features

- add interactive attributes (navigate, opens, toggles, action) ([c924b06](https://github.com/wireweave/language-data/commit/c924b06dadaec32347a32f6c86b7dbbd517c9e28))

## [1.2.1-beta.0](https://github.com/wireweave/language-data/compare/v1.3.0-beta.0...v1.4.0) (2026-01-17)

## [1.2.0-beta.0](https://github.com/wireweave/language-data/compare/v1.3.0-beta.0...v1.4.0) (2026-01-17)

### Features

- add Monaco and CodeMirror editor integrations ([3750d79](https://github.com/wireweave/language-data/commit/3750d79a695db725f9c1cdeb49827de20e298587))

### Bug Fixes

- replace require with ESM imports in monaco/index.ts ([2f75307](https://github.com/wireweave/language-data/commit/2f75307b90caace870d71ac2670b6ad7e5728f81))

## [1.0.2-beta.0](https://github.com/wireweave/language-data/compare/v1.3.0-beta.0...v1.4.0) (2026-01-10)

### Bug Fixes

- use exact version for @wireweave/core beta ([e59a9f0](https://github.com/wireweave/language-data/commit/e59a9f000808e3ebe467e44347babf9b72406da0))
- use npm version for @wireweave/core dependency ([2b16a9b](https://github.com/wireweave/language-data/commit/2b16a9b3db3111bbdf61fb939a2b89dc70a205b6))

### Refactoring

- use release-it preRelease for beta versioning ([b4ceb6a](https://github.com/wireweave/language-data/commit/b4ceb6af2ff4245ed24c0a624347b4214c818109))

### Documentation

- remove broken links from Used By section ([ab3b479](https://github.com/wireweave/language-data/commit/ab3b4795ed3fd568567f51bd2ea1deeb05b41fac))

## [1.3.0](https://github.com/wireweave/language-data/compare/v1.3.0-beta.0...v1.4.0) (2026-01-17)

### Features

- add interactive attributes support ([#4](https://github.com/wireweave/language-data/issues/4)) ([7577574](https://github.com/wireweave/language-data/commit/7577574939316a77f4146650f71908e70b287deb))

## [1.3.0](https://github.com/wireweave/language-data/compare/v1.2.0...v1.3.0) (2026-01-17)

### Features

- add interactive attributes support ([#4](https://github.com/wireweave/language-data/issues/4)) ([7577574](https://github.com/wireweave/language-data/commit/7577574939316a77f4146650f71908e70b287deb))

## [1.3.0-beta.0](https://github.com/wireweave/language-data/compare/v1.2.1-beta.0...v1.3.0-beta.0) (2026-01-17)

### Features

- add interactive attributes (navigate, opens, toggles, action) ([c924b06](https://github.com/wireweave/language-data/commit/c924b06dadaec32347a32f6c86b7dbbd517c9e28))

## [1.2.1-beta.0](https://github.com/wireweave/language-data/compare/v1.2.0-beta.0...v1.2.1-beta.0) (2026-01-17)

## [1.2.0](https://github.com/wireweave/language-data/compare/v1.1.0...v1.2.0) (2026-01-17)

## [1.2.0-beta.0](https://github.com/wireweave/language-data/compare/v1.0.2-beta.0...v1.2.0-beta.0) (2026-01-17)

### Features

- add Monaco and CodeMirror editor integrations ([3750d79](https://github.com/wireweave/language-data/commit/3750d79a695db725f9c1cdeb49827de20e298587))

### Bug Fixes

- replace require with ESM imports in monaco/index.ts ([2f75307](https://github.com/wireweave/language-data/commit/2f75307b90caace870d71ac2670b6ad7e5728f81))

## [1.1.0](https://github.com/wireweave/language-data/compare/v1.0.2...v1.1.0) (2026-01-17)

### Refactoring

- use release-it preRelease for beta versioning ([#1](https://github.com/wireweave/language-data/issues/1)) ([1adb5b6](https://github.com/wireweave/language-data/commit/1adb5b64375c45ca16e684d14c2887150cc4e2ca))

## [1.1.0-beta.0](https://github.com/wireweave/language-data/compare/v1.0.2-beta.0...v1.1.0-beta.0) (2026-01-17)

### Features

- add Monaco and CodeMirror editor integrations ([3750d79](https://github.com/wireweave/language-data/commit/3750d79a695db725f9c1cdeb49827de20e298587))

### Bug Fixes

- replace require with ESM imports in monaco/index.ts ([2f75307](https://github.com/wireweave/language-data/commit/2f75307b90caace870d71ac2670b6ad7e5728f81))

## [1.0.2-beta.0](https://github.com/wireweave/language-data/compare/v1.0.1...v1.0.2-beta.0) (2026-01-10)

### Bug Fixes

- use exact version for @wireweave/core beta ([e59a9f0](https://github.com/wireweave/language-data/commit/e59a9f000808e3ebe467e44347babf9b72406da0))
- use npm version for @wireweave/core dependency ([2b16a9b](https://github.com/wireweave/language-data/commit/2b16a9b3db3111bbdf61fb939a2b89dc70a205b6))

### Refactoring

- use release-it preRelease for beta versioning ([b4ceb6a](https://github.com/wireweave/language-data/commit/b4ceb6af2ff4245ed24c0a624347b4214c818109))

### Documentation

- add logo to README ([ce259e1](https://github.com/wireweave/language-data/commit/ce259e1d550a7c3980e2101a702228331346b287))
- remove broken links from Used By section ([ab3b479](https://github.com/wireweave/language-data/commit/ab3b4795ed3fd568567f51bd2ea1deeb05b41fac))

## 1.0.1 (2026-01-08)
