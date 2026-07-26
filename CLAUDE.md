# Wireweave (public monorepo)

AI와 함께 `.wf` 와이어프레임 DSL을 만드는 **언어 + 툴 + 클라이언트**의 공개 표면.
pnpm-workspace 모노레포 (`wireweave-monorepo`, private, MIT, `wireweave/wireweave`).

이 repo는 와이어프레임 DSL의 **공개 표면**만 담는다 — 언어 정의, 로컬 툴, 클라이언트.
호스티드 서비스 / 제품 / 디자인시스템은 전부 별도 repo (아래 "이 repo 밖" 참조).

## 구성 (`packages/*` + `docs`)

| 패키지           | npm 이름                     | 설명                                                                                                                                                               | 발행             |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| core             | `@wireweave/core`            | DSL 파서/렌더러 (Peggy grammar)                                                                                                                                    | npm              |
| language-data    | `@wireweave/language-data`   | 에디터용 컴포넌트 어휘/언어 정의                                                                                                                                   | npm              |
| ux-rules         | `@wireweave/ux-rules`        | UX 검증 규칙/점수 (→ core)                                                                                                                                         | npm              |
| agent-prompts    | `@wireweave/agent-prompts`   | LLM 에이전트용 문법 가이드 프롬프트                                                                                                                                | npm              |
| markdown-plugin  | `@wireweave/markdown-plugin` | `.wf` 마크다운 코드블록 렌더 (→ core)                                                                                                                              | npm              |
| sdk              | `@wireweave/sdk`             | 플랫폼 클라이언트 — 로컬/원격 `dispatch`, auth, local-tools (api-server contract 소유)                                                                             | npm              |
| cli              | `@wireweave/cli`             | `wireweave` 바이너리 (→ sdk)                                                                                                                                       | npm              |
| mcp-server       | `@wireweave/mcp-server`      | `wireweave-mcp` MCP 서버 — API 서버 thin client (→ sdk)                                                                                                            | npm              |
| ssot-core        | `@wireweave/ssot-core`       | SSOT 코어 — frontmatter/body 파싱, 정규화 그래프, traversal·impact, 12-kind 스키마 파생 상수·interview slots·graph-view 파생 (무런타임 의존, isomorphic)           | npm              |
| ssot-tools       | `@wireweave/ssot-tools`      | SSOT 파일시스템·오케스트레이션 — catalog build·scaffold·verify runner·mirror/lifecycle sync·auto-tag·fill-version·governance/propose/flag (→ ssot-core, Node 전용) | npm              |
| vscode-extension | `wireweave-vscode`           | VS Code / Cursor 확장 (→ core, language-data)                                                                                                                      | vsce/ovsx (별도) |
| docs             | `@wireweave/docs`            | VitePress 문서 (private, 비발행 — Vercel)                                                                                                                          | —                |

의존 위상: core ← {ux-rules, markdown-plugin, language-data} ← sdk ← {cli, mcp-server}. ssot-core ← ssot-tools (SSOT 서브시스템, DSL 체인과 독립).

## 워크스페이스 규약

- 내부 의존은 `workspace:*`.
- 빌드: `pnpm -r --filter "./packages/**" run build` (topo 순서). core는 `build:grammar` (Peggy) → `build:ts` 순으로 grammar를 먼저 생성.
- 엔진: node ≥ 22.13.0, pnpm ≥ 11.0.0 (`packageManager: pnpm@11.1.1`).
- 패키지 추가 위치: `pnpm-workspace.yaml` = `packages/*` + `docs`.

## 툴링 (루트 통합)

- **ESLint**: 루트 `eslint.config.mjs` base + 패키지별 `eslint.config.mjs`. 전체 검사 `pnpm lint` (= `pnpm -r run lint`). eslint `^10`.
- **Prettier**: 루트 `.prettierrc.json` (`semi: false`). `pnpm format` / `pnpm format:check`.
- **TypeScript**: 패키지 tsconfig가 루트 `tsconfig.base.json` 상속 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`). 타입체크 `pnpm typecheck`.
- **husky 3-hook**: pre-commit = lint-staged · prepare-commit-msg = 브랜치명 → `Clawket-Ref` 삽입 · commit-msg = commitlint (Conventional Commits).
- 패키지별 `eslint.config.mjs` / `tsconfig.json` / `tsup.config.ts` / `knip.json`은 각 패키지가 유지.

## 발행 (changesets + OIDC)

- **changesets independent 모드** (`access: public`, `baseBranch: main`). 버전은 패키지별 독립.
- **OIDC trusted publishing** — `NPM_TOKEN` 없음, provenance (`NPM_CONFIG_PROVENANCE: true`).
- 브랜치 전략: `develop` = beta (changesets **pre 모드**, `X.Y.Z-beta.N`) / `main` = stable. stable 릴리스 후 **main → develop 역동기화** 머지. 모든 자동 버전/릴리스/싱크 커밋에 `[skip ci]`.
- changesets **ignore**: `@wireweave/docs` (Vercel 배포), `wireweave-vscode` (vsce/ovsx 별도 파이프라인).
- npm 발행 대상 = core · language-data · ux-rules · agent-prompts · markdown-plugin · sdk · cli · mcp-server · ssot-core · ssot-tools.

## 개발 명령

```bash
pnpm install
pnpm build       # packages/** topo 빌드 (core grammar 먼저)
pnpm typecheck
pnpm lint
pnpm format
pnpm test
pnpm changeset   # 변경 기록 추가
```

## 커밋

- Claude는 명시적 지시 없이 commit/push 하지 않는다 (사용자가 직접 수행).
- Conventional Commits. 브랜치명 `<type>/<ticket>-<slug>` (예: `feat/WW-123-multi-page`).

## 무료 / 유료 경계

- 기본 로컬 도구 (parse / validate / render / analyze / diff / export / validate_ux): 로컬 실행, 무료, 무키.
- cli · sdk 로컬 dispatch = 무키. mcp-server = API 키 필수.
- 호스티드 에이전트 / cloud = 유료 (키).

## 이 repo 밖 (전부 개별 repo)

| 대상                   | repo                  |
| ---------------------- | --------------------- |
| 호스티드 AI 에이전트   | `agent-harness`       |
| API 서버 (Vercel)      | `api-server`          |
| 제품 (대시보드/관리자) | `dashboard` / `admin` |
| 디자인시스템           | `ui`                  |
| Claude Code 플러그인   | `wireweave-plugin`    |

## 패키지별 세부

각 `packages/<name>/CLAUDE.md` + `.claude/rules/` 참조.
