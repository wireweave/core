# Changelog

## 1.2.12-beta.7

### Patch Changes

- Updated dependencies [[`ef8f7c3`](https://github.com/wireweave/wireweave/commit/ef8f7c3032c9291c26ff941c954ad6513150e6ff)]:
  - @wireweave/core@3.1.0-beta.7

## 1.2.12-beta.6

### Patch Changes

- Updated dependencies [[`8853f3a`](https://github.com/wireweave/wireweave/commit/8853f3ae77cc348c8527c2ccff032a7997cc1ce7)]:
  - @wireweave/core@3.1.0-beta.6

## 1.2.12-beta.5

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

- [#39](https://github.com/wireweave/wireweave/pull/39) [`1bf1ccb`](https://github.com/wireweave/wireweave/commit/1bf1ccb4b59270bfe70fd7ae42d4a3a1258385cf) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - fix: ignore top-level layout definitions when rendering markdown previews.

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

## 1.2.12-beta.4

### Patch Changes

- Updated dependencies [[`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66)]:
  - @wireweave/core@3.1.0-beta.4

## 1.2.12-beta.3

### Patch Changes

- Updated dependencies [[`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c)]:
  - @wireweave/core@3.1.0-beta.3

## 1.2.12-beta.2

### Patch Changes

- [#39](https://github.com/wireweave/wireweave/pull/39) [`1bf1ccb`](https://github.com/wireweave/wireweave/commit/1bf1ccb4b59270bfe70fd7ae42d4a3a1258385cf) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - fix: ignore top-level layout definitions when rendering markdown previews.

- Updated dependencies [[`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc)]:
  - @wireweave/core@3.1.0-beta.2

## 1.2.12-beta.1

### Patch Changes

- Updated dependencies [[`506993d`](https://github.com/wireweave/wireweave/commit/506993dc040aa5702a5113d8bb5979ddb5f32c4f), [`e1142b0`](https://github.com/wireweave/wireweave/commit/e1142b0e385a8919799cf9c1a1364c224ca52a7c)]:
  - @wireweave/core@3.1.0-beta.1

## 1.2.12-beta.0

### Patch Changes

- Updated dependencies [[`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918), [`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918), [`13f22ee`](https://github.com/wireweave/wireweave/commit/13f22ee7239d72cd4e31cb7b22802b4457e3b8a0)]:
  - @wireweave/core@3.1.0-beta.0

## [1.2.11](https://github.com/wireweave/markdown-plugin/compare/v1.2.11-beta.0...v1.2.11) (2026-05-08)

## [1.2.11-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.10...v1.2.11-beta.0) (2026-05-08)

## [1.2.10](https://github.com/wireweave/markdown-plugin/compare/v1.2.10-beta.0...v1.2.10) (2026-03-17)

## [1.2.10-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.9...v1.2.10-beta.0) (2026-03-17)

## [1.2.9](https://github.com/wireweave/markdown-plugin/compare/v1.2.8...v1.2.9) (2026-03-15)

## [1.2.8](https://github.com/wireweave/markdown-plugin/compare/v1.2.8-beta.2...v1.2.8) (2026-03-09)

## [1.2.8-beta.2](https://github.com/wireweave/markdown-plugin/compare/v1.2.8-beta.1...v1.2.8-beta.2) (2026-03-09)

## [1.2.8-beta.1](https://github.com/wireweave/markdown-plugin/compare/v1.2.8-beta.0...v1.2.8-beta.1) (2026-03-08)

## [1.2.8-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.7...v1.2.8-beta.0) (2026-03-07)

## [1.2.7](https://github.com/wireweave/markdown-plugin/compare/v1.2.7-beta.0...v1.2.7) (2026-03-07)

## [1.2.7-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.6...v1.2.7-beta.0) (2026-03-07)

## [1.2.6](https://github.com/wireweave/markdown-plugin/compare/v1.2.6-beta.0...v1.2.6) (2026-03-04)

## [1.2.6-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.5-beta.1...v1.2.6-beta.0) (2026-03-04)

## [1.2.5-beta.1](https://github.com/wireweave/markdown-plugin/compare/v1.2.5...v1.2.5-beta.1) (2026-03-04)

## [1.2.5](https://github.com/wireweave/markdown-plugin/compare/v1.2.5-beta.0...v1.2.5) (2026-02-25)

## [1.2.5-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.4...v1.2.5-beta.0) (2026-02-25)

## [1.2.4](https://github.com/wireweave/markdown-plugin/compare/v1.2.4-beta.0...v1.2.4) (2026-02-23)

## [1.2.4-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.3...v1.2.4-beta.0) (2026-02-23)

## [1.2.3](https://github.com/wireweave/markdown-plugin/compare/v1.2.3-beta.0...v1.2.3) (2026-01-24)

## [1.2.3-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.2...v1.2.3-beta.0) (2026-01-24)

### Documentation

- update logo to use CDN URL ([06a4868](https://github.com/wireweave/markdown-plugin/commit/06a48680fb90fe387c92680cb7044b3b7f5cc81f))

## [1.2.2](https://github.com/wireweave/markdown-plugin/compare/v1.2.2-beta.0...v1.2.2) (2026-01-20)

## [1.2.2-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.2.1...v1.2.2-beta.0) (2026-01-17)

## [1.2.1](https://github.com/wireweave/markdown-plugin/compare/v1.2.1-beta.1...v1.2.1) (2026-01-17)

## [1.2.1-beta.1](https://github.com/wireweave/markdown-plugin/compare/v1.2.1-beta.0...v1.2.1-beta.1) (2026-01-17)

### Documentation

- update README with missing options ([16ea022](https://github.com/wireweave/markdown-plugin/commit/16ea022e14625559e5a1f3e75d5a08fc6598685f))

## [1.2.1-beta.0](https://github.com/wireweave/markdown-plugin/compare/v1.1.0-beta.3...v1.2.1-beta.0) (2026-01-10)

## [1.1.0](https://github.com/wireweave/markdown-plugin/compare/v1.1.0-beta.0...v1.1.0) (2026-01-10)

### Bug Fixes

- include README.md in npm package ([8378900](https://github.com/wireweave/markdown-plugin/commit/8378900bc5cd47989a512ce7bf3f361927855e14))
- remove src from npm package files ([b5fac8e](https://github.com/wireweave/markdown-plugin/commit/b5fac8ea1da248e95f123747810e59678d6afdaa))

## 1.1.0-beta.0 (2026-01-10)

### Features

- add release-it workflow for beta publishing ([b5bd745](https://github.com/wireweave/markdown-plugin/commit/b5bd74574971e06d7381bcc6beab6685e683a038))

### Bug Fixes

- add @types/node for Buffer type support ([80c5eb2](https://github.com/wireweave/markdown-plugin/commit/80c5eb2a42f3646bd6ad733a29aa1cd6ebf62d41))
- make tsconfig.json standalone (remove extends) ([859340d](https://github.com/wireweave/markdown-plugin/commit/859340d98a69143a5572dfb2d01063cca2a3845d))
