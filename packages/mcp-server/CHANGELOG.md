# Changelog

## 1.8.2-beta.5

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

## 1.8.2-beta.4

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.4

## 1.8.2-beta.3

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.3

## 1.8.2-beta.2

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.2

## 1.8.2-beta.1

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.1

## 1.8.2-beta.0

### Patch Changes

- Updated dependencies []:
  - @wireweave/sdk@0.1.1-beta.0

## 1.8.1

### Patch Changes

- Updated dependencies [[`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58)]:
  - @wireweave/sdk@0.1.0

## 1.8.1-beta.0

### Patch Changes

- Updated dependencies [[`db348e9`](https://github.com/wireweave/wireweave/commit/db348e91f972c58fce2b3b60b711ea2e764f4c58)]:
  - @wireweave/sdk@0.1.0-beta.1

## [Unreleased]

### Refactoring

- **deps:** migrate to `@wireweave/sdk` for HTTP client and local-tool dispatch. mcp-server now becomes a thin dispatcher that delegates `CallTool` to SDK `dispatch(name, args, { apiConfig, endpoints })`; the SDK auto-routes between in-process local execution (`@wireweave/core`, `@wireweave/ux-rules`) and HTTP calls to api-server.
- **proxy:** ListTools merges generated server tool definitions (`src/tools.ts`) with SDK `localToolDefinitions` (no behavior change for hosts — local-only tools were previously routed through the same MCP surface).

### Removed

- `src/api.ts` — HTTP client moved into `@wireweave/sdk` (`callApi`).
- `src/local-tools.ts` — local tool handlers moved into `@wireweave/sdk` (`localDispatch`).

### Internal

- proxy-discipline 강화: 도구 분류 (`local` / `server`) 의 single source of truth 는 `api-server/src/tool-definitions.ts` 의 `dispatch` 필드. mcp-server 는 분류 결정 / 결과 가공 / 캐시를 일절 하지 않는다. 자세한 책임 경계는 `.claude/rules/proxy-discipline.md`.

### Migration notes

호스트 (Claude Desktop / Cursor / 기타 MCP 클라이언트) 영향: **없음**. `wireweave-mcp` 바이너리 인터페이스 / 환경변수 (`WIREWEAVE_API_KEY`, `WIREWEAVE_API_URL`) / 노출 도구 목록은 동일하다. 내부 의존 구조만 변경 — `@wireweave/sdk` 가 신규 runtime 의존으로 추가됨 (트랜지티브 `@wireweave/core`, `@wireweave/ux-rules`).

## [1.8.0](https://github.com/wireweave/mcp-server/compare/v1.8.0-beta.0...v1.8.0) (2026-05-08)

## [1.8.0-beta.0](https://github.com/wireweave/mcp-server/compare/v1.7.1-beta.0...v1.8.0-beta.0) (2026-05-08)

### Features

- **tools:** regenerate from updated api-server tool catalog ([ef6b0b6](https://github.com/wireweave/mcp-server/commit/ef6b0b6925fa6da74b1b61060d867d834887da43))

## [1.7.1-beta.0](https://github.com/wireweave/mcp-server/compare/v1.7.0...v1.7.1-beta.0) (2026-03-23)

### Documentation

- **rules:** add auto-generated file warning rule ([7d09ae2](https://github.com/wireweave/mcp-server/commit/7d09ae2114c028c8285693e5465dd2ca0ae48c3f))

## [1.7.0](https://github.com/wireweave/mcp-server/compare/v1.7.0-beta.0...v1.7.0) (2026-03-15)

## [1.7.0-beta.0](https://github.com/wireweave/mcp-server/compare/v1.6.2...v1.7.0-beta.0) (2026-03-15)

### Features

- **server:** add HTTP transport mode support ([0af8830](https://github.com/wireweave/mcp-server/commit/0af883090ed42c5d8ff2b6c80d7db575b2ce3544))

## [1.6.2](https://github.com/wireweave/mcp-server/compare/v1.6.2-beta.2...v1.6.2) (2026-03-09)

## [1.6.2-beta.2](https://github.com/wireweave/mcp-server/compare/v1.6.2-beta.1...v1.6.2-beta.2) (2026-03-09)

## [1.6.2-beta.1](https://github.com/wireweave/mcp-server/compare/v1.6.2-beta.0...v1.6.2-beta.1) (2026-03-08)

## [1.6.2-beta.0](https://github.com/wireweave/mcp-server/compare/v1.6.1...v1.6.2-beta.0) (2026-03-07)

## [1.6.1](https://github.com/wireweave/mcp-server/compare/v1.6.1-beta.0...v1.6.1) (2026-03-05)

## [1.6.1-beta.0](https://github.com/wireweave/mcp-server/compare/v1.6.0...v1.6.1-beta.0) (2026-03-05)

### Refactoring

- **tools:** remove wireweave_render_html alias ([5eab1b6](https://github.com/wireweave/mcp-server/commit/5eab1b69b55702cae51518eb7128c47e9ee1f85f))

## [1.6.0](https://github.com/wireweave/mcp-server/compare/v1.6.0-beta.0...v1.6.0) (2026-03-04)

## [1.6.0-beta.0](https://github.com/wireweave/mcp-server/compare/v1.5.1...v1.6.0-beta.0) (2026-03-04)

### Features

- **tools:** add local HTML file rendering tool ([40d46e1](https://github.com/wireweave/mcp-server/commit/40d46e10d619bea4834c4dcb6dacf9dd0b9cd949))

## [1.5.1](https://github.com/wireweave/mcp-server/compare/v1.5.1-beta.0...v1.5.1) (2026-02-17)

## [1.5.1-beta.0](https://github.com/wireweave/mcp-server/compare/v1.5.0...v1.5.1-beta.0) (2026-02-17)

### Documentation

- **urls:** update dashboard URL to wireweave.org ([6dae7cc](https://github.com/wireweave/mcp-server/commit/6dae7cc441a76c412a5a8961620fa47bfbc88b0e))

## [1.5.0](https://github.com/wireweave/mcp-server/compare/v1.5.0-beta.0...v1.5.0) (2026-02-13)

## [1.5.0-beta.0](https://github.com/wireweave/mcp-server/compare/v1.4.0...v1.5.0-beta.0) (2026-02-13)

### Features

- **mcp:** add prompts and resources support ([8e07417](https://github.com/wireweave/mcp-server/commit/8e07417ef43f4489137f61a0f3c9381818fb148e))

### Documentation

- **readme:** add marketplace badges ([ab50244](https://github.com/wireweave/mcp-server/commit/ab502445255bd69e812e07fd98f37bdec3267728))

## [1.4.0](https://github.com/wireweave/mcp-server/compare/v1.4.0-beta.0...v1.4.0) (2026-01-31)

## [1.4.0-beta.0](https://github.com/wireweave/mcp-server/compare/v1.3.1...v1.4.0-beta.0) (2026-01-30)

### Features

- **api:** add actionable error messages for 404 and 400 ([38b5863](https://github.com/wireweave/mcp-server/commit/38b586369b41b5376fa591cb505e30e468af3f87))
- **tools:** improve cloud workflow guidance and remove delete_project ([f891c72](https://github.com/wireweave/mcp-server/commit/f891c725ede96367637973c3caa47e79e040f301))

## [1.3.1](https://github.com/wireweave/mcp-server/compare/v1.3.1-beta.0...v1.3.1) (2026-01-28)

## [1.3.1-beta.0](https://github.com/wireweave/mcp-server/compare/v1.3.0...v1.3.1-beta.0) (2026-01-28)

## [1.3.0](https://github.com/wireweave/mcp-server/compare/v1.3.0-beta.1...v1.3.0) (2026-01-24)

## [1.3.0-beta.1](https://github.com/wireweave/mcp-server/compare/v1.3.0-beta.0...v1.3.0-beta.1) (2026-01-24)

### Documentation

- **readme:** update tool count and feature details ([ef66266](https://github.com/wireweave/mcp-server/commit/ef662665d76ec4dccc4e84edaa259c17d2d85815))

## [1.3.0-beta.0](https://github.com/wireweave/mcp-server/compare/v1.2.0...v1.3.0-beta.0) (2026-01-21)

### Features

- **tools:** add strict mode to validate and enhance UX rules ([6505a32](https://github.com/wireweave/mcp-server/commit/6505a327ad1553340ff8309c35ad7725d1ac21eb))

## [1.2.0](https://github.com/wireweave/mcp-server/compare/v1.2.0-beta.0...v1.2.0) (2026-01-20)

## [1.2.0-beta.0](https://github.com/wireweave/mcp-server/compare/v1.1.3...v1.2.0-beta.0) (2026-01-20)

### Features

- **tools:** add cloud diff versions tool ([735e33c](https://github.com/wireweave/mcp-server/commit/735e33c552d5288bb097e33fa5c018597d6c33fc))

## [1.1.3](https://github.com/wireweave/mcp-server/compare/v1.1.3-beta.0...v1.1.3) (2026-01-20)

## [1.1.3-beta.0](https://github.com/wireweave/mcp-server/compare/v1.1.2...v1.1.3-beta.0) (2026-01-20)

### Refactoring

- **mcp:** improve tool registration and logging ([a43a3df](https://github.com/wireweave/mcp-server/commit/a43a3dfafb6a1a7eb68936dfabdfce599dae18cb))

## [1.1.2](https://github.com/wireweave/mcp-server/compare/v1.1.2-beta.0...v1.1.2) (2026-01-19)

## [1.1.2-beta.0](https://github.com/wireweave/mcp-server/compare/v1.1.1...v1.1.2-beta.0) (2026-01-19)

## [1.1.1](https://github.com/wireweave/mcp-server/compare/v1.1.1-beta.0...v1.1.1) (2026-01-18)

## [1.1.1-beta.0](https://github.com/wireweave/mcp-server/compare/v1.1.0...v1.1.1-beta.0) (2026-01-18)

### Bug Fixes

- **docs:** update logo image path ([ee2d1d1](https://github.com/wireweave/mcp-server/commit/ee2d1d15882a5e8c5cda8fbff1d0da4faaf1332c))

## [1.1.0](https://github.com/wireweave/mcp-server/compare/v1.1.0-beta.0...v1.1.0) (2026-01-18)

## 1.1.0-beta.0 (2026-01-18)

### Features

- apply sanitized logging policy ([c3b224e](https://github.com/wireweave/mcp-server/commit/c3b224ef9056f998c4660ca5ab5c43492b64d642))
- **tools:** implement comprehensive tool suite ([97a123f](https://github.com/wireweave/mcp-server/commit/97a123fad75caa59805be8038a6fece965a8b841))

### Refactoring

- **mcp:** extract API and tools logic from index ([4741b23](https://github.com/wireweave/mcp-server/commit/4741b2392f690e309f826049705cc27ce32e0fbb))

### Documentation

- **readme:** enhance documentation with comprehensive tool listing ([1259b6c](https://github.com/wireweave/mcp-server/commit/1259b6c7d2d95dcb6a9a8d12f6839998a8216dc8))
- **readme:** update logo path to remote URL ([27c67d2](https://github.com/wireweave/mcp-server/commit/27c67d24c6aeda72084b4b1289a0fd9caa7a1a2f))
- **repo:** update repository URLs to standalone repo ([e2c3b42](https://github.com/wireweave/mcp-server/commit/e2c3b42fe4e059f0a7f14288dbf628ebf2391915))
