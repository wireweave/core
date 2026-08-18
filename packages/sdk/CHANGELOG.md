# @wireweave/sdk

## 0.1.1-beta.6

### Patch Changes

- Updated dependencies [[`8853f3a`](https://github.com/wireweave/wireweave/commit/8853f3ae77cc348c8527c2ccff032a7997cc1ce7)]:
  - @wireweave/core@3.1.0-beta.6
  - @wireweave/language-data@1.6.0-beta.1
  - @wireweave/ux-rules@1.5.0-beta.6

## 0.1.1-beta.5

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

- Updated dependencies [[`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c), [`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9)]:
  - @wireweave/core@3.1.0-beta.5
  - @wireweave/language-data@1.6.0-beta.0
  - @wireweave/ux-rules@1.5.0-beta.5

## 0.1.1-beta.4

### Patch Changes

- Updated dependencies [[`8d7c014`](https://github.com/wireweave/wireweave/commit/8d7c014915c76aa299c42bf75935ddba9a992e66)]:
  - @wireweave/core@3.1.0-beta.4
  - @wireweave/ux-rules@1.5.0-beta.4

## 0.1.1-beta.3

### Patch Changes

- Updated dependencies [[`83c2329`](https://github.com/wireweave/wireweave/commit/83c2329840e027c92e86d9f523c8e782a944160c)]:
  - @wireweave/core@3.1.0-beta.3
  - @wireweave/ux-rules@1.5.0-beta.3

## 0.1.1-beta.2

### Patch Changes

- Updated dependencies [[`f4a7b36`](https://github.com/wireweave/wireweave/commit/f4a7b36061f8310ffcb9a933dd457c6d3b0d89cc)]:
  - @wireweave/core@3.1.0-beta.2
  - @wireweave/ux-rules@1.5.0-beta.2

## 0.1.1-beta.1

### Patch Changes

- Updated dependencies [[`506993d`](https://github.com/wireweave/wireweave/commit/506993dc040aa5702a5113d8bb5979ddb5f32c4f), [`e1142b0`](https://github.com/wireweave/wireweave/commit/e1142b0e385a8919799cf9c1a1364c224ca52a7c), [`ab1ef5b`](https://github.com/wireweave/wireweave/commit/ab1ef5b45efaea1490901f719191949e8b09c9bf)]:
  - @wireweave/core@3.1.0-beta.1
  - @wireweave/ux-rules@1.5.0-beta.1

## 0.1.1-beta.0

### Patch Changes

- Updated dependencies [[`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918), [`2aebfc2`](https://github.com/wireweave/wireweave/commit/2aebfc22072764cb5bfc6d5579ef4e2855cf9918), [`13f22ee`](https://github.com/wireweave/wireweave/commit/13f22ee7239d72cd4e31cb7b22802b4457e3b8a0)]:
  - @wireweave/core@3.1.0-beta.0
  - @wireweave/ux-rules@1.4.1-beta.0

## 0.1.0

### Minor Changes

- [#36](https://github.com/wireweave/wireweave/pull/36) [`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - Initial stable release: promote the Wireweave SDK and CLI from the 0.1.0-beta line to a stable 0.1.0.

### Patch Changes

- Updated dependencies []:
  - @wireweave/ux-rules@1.4.0

## 0.1.0-beta.1

### Minor Changes

- [`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - Initial stable release: promote the Wireweave SDK and CLI from the 0.1.0-beta line to a stable 0.1.0.
