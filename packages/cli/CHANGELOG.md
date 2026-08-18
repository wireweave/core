# @wireweave/cli

## 0.1.1-beta.9

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.9

## 0.1.1-beta.8

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.8

## 0.1.1-beta.7

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.7

## 0.1.1-beta.6

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.6

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

- Updated dependencies [[`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9), [`2f7cc70`](https://github.com/wireweave/wireweave/commit/2f7cc7042da1170bef2f103f7ac25c7d0db3f4c9)]:
  - @wireweave/sdk@0.1.1-beta.5

## 0.1.1-beta.4

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.4

## 0.1.1-beta.3

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.3

## 0.1.1-beta.2

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.2

## 0.1.1-beta.1

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.1

## 0.1.1-beta.0

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.0

## 0.1.0

### Minor Changes

- [#36](https://github.com/wireweave/wireweave/pull/36) [`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - Initial stable release: promote the Wireweave SDK and CLI from the 0.1.0-beta line to a stable 0.1.0.

### Patch Changes

- Updated dependencies [[`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58)]:
  - @wireweave/sdk@0.1.0

## 0.1.0-beta.1

### Minor Changes

- [`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58) Thanks [@Seungwoo321](https://github.com/Seungwoo321)! - Initial stable release: promote the Wireweave SDK and CLI from the 0.1.0-beta line to a stable 0.1.0.

### Patch Changes

- Updated dependencies [[`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58)]:
  - @wireweave/sdk@0.1.0-beta.1
