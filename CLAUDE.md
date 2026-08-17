# Wireweave (public monorepo)

AI와 함께 `.wf` 와이어프레임 DSL을 만드는 **언어 + 툴 + 클라이언트**의 공개 표면.
pnpm-workspace 모노레포 (`wireweave-monorepo`, private, MIT, `wireweave/wireweave`).

이 repo는 와이어프레임 DSL의 **공개 표면**만 담는다 — 언어 정의, 로컬 툴, 클라이언트.
호스티드 서비스 / 제품 / 디자인시스템은 전부 별도 repo (아래 "이 repo 밖" 참조).

## 구성 (`packages/*` + `docs`)

| 패키지           | npm 이름                     | 설명                                                                                   | 발행             |
| ---------------- | ---------------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| core             | `@wireweave/core`            | DSL 파서/렌더러 (Peggy grammar)                                                        | npm              |
| language-data    | `@wireweave/language-data`   | 에디터용 컴포넌트 어휘/언어 정의                                                       | npm              |
| ux-rules         | `@wireweave/ux-rules`        | UX 검증 규칙/점수 (→ core)                                                             | npm              |
| agent-prompts    | `@wireweave/agent-prompts`   | LLM 에이전트용 문법 가이드 프롬프트                                                    | npm              |
| markdown-plugin  | `@wireweave/markdown-plugin` | `.wf` 마크다운 코드블록 렌더 (→ core)                                                  | npm              |
| sdk              | `@wireweave/sdk`             | 플랫폼 클라이언트 — 로컬/원격 `dispatch`, auth, local-tools (api-server contract 소유) | npm              |
| cli              | `@wireweave/cli`             | `wireweave` 바이너리 (→ sdk)                                                           | npm              |
| mcp-server       | `@wireweave/mcp-server`      | `wireweave-mcp` MCP 서버 — API 서버 thin client (→ sdk)                                | npm              |
| vscode-extension | `wireweave-vscode`           | VS Code / Cursor 확장 (→ core, language-data)                                          | vsce/ovsx (별도) |
| docs             | `@wireweave/docs`            | VitePress 문서 (private, 비발행 — Vercel)                                              | —                |

의존 위상: core ← {ux-rules, markdown-plugin, language-data} ← sdk ← {cli, mcp-server}.

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
- npm 발행 대상 = core · language-data · ux-rules · agent-prompts · markdown-plugin · sdk · cli · mcp-server.

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

## core 해석 규약 — 워크스페이스는 소스, npm 은 dist

`@wireweave/core` 는 워크스페이스 안에서 **소스로** 해석된다. `packages/core/package.json` 의 `exports` 가 `types`·`development` 조건으로 `src/*.ts` 를 가리키므로 TypeScript·typescript-eslint·Vite/Vitest 가 전부 소스를 읽는다. 따라서 `pnpm build` 와 `pnpm lint`·`typecheck`·`test` 를 동시에 돌려도 된다 — 게이트가 빌드 중인 `dist` 를 관측하지 않는다.

발행되는 형상은 `publishConfig` 가 소유한다. pnpm 이 pack 시점에 `main`·`module`·`types`·`exports` 를 dist 기반 맵으로 치환하므로 npm 소비자가 받는 것은 종전과 같다. 치환된 필드가 실재 파일로 해석되는지는 packaging 게이트의 `publint --strict` 가, **tarball 에 실제로 무엇이 담겼는지**는 `pnpm tarball:check` 가 지킨다 (아래).

예외는 `build:syntax` 제너레이터 둘(`docs`, `vscode-extension`)이다. 평범한 node 로 실행되는데 core 소스의 상대 import 에 확장자가 없어 node 가 못 읽는다. 그래서 조건을 통과해 `import`/`require` → dist 로 떨어진다. **이 둘만 빌드 순서에 의존한다.**

그래서 이 둘의 `build:syntax` 는 생성 **전에** `dist-freshness-gate.mjs --require-deps` 로 자기가 읽을 dist 의 신선도를 단언한다. 검사 대상은 그 패키지 매니페스트의 `workspace:*` 의존성에서 파생되므로(현재 core + language-data) 새 의존성이 생기면 아무것도 안 적어도 범위에 들어온다. 낡은 dist 로 만든 TextMate 산출물은 **자기 `--check` 를 통과한다** — 제너레이터가 낡은 입력을 충실히 재현하고, 그 검사는 산출물을 자기 자신과 비교하기 때문이다. 그 층은 이 단언이 아니면 잡히지 않는다. 여기서는 dist 부재도 skip 이 아니라 실패다(곧 읽을 참이므로).

core 소스에 타입 오류가 있으면 이제 소비자 7개의 `typecheck` 에 그대로 나타난다. `skipLibCheck` 가 dist `.d.ts` 뒤에 숨겨 주던 것이 사라진 것이므로 정상 동작이다 — core 를 먼저 고친다.

### dist 신선도 — `pnpm dist:check`

`development` 조건은 Vite/Vitest 계열만 구한다. 평범한 node 에는 그 조건이 없어서 `.mjs` 게이트·CLI·손으로 친 `require('./dist/index.cjs')` 는 여전히 dist 를 읽고, **낡은 dist 는 실패하지 않고 자신 있는 오답을 돌려준다.** 같은 코퍼스가 dist 경유 138 오류, 소스 경유 74 오류로 갈린 적이 있다.

`scripts/dist-freshness-gate.mjs` 가 이것을 막는다. 각 패키지의 `build` 는 `postbuild` 로 `.build-fingerprint.json`(gitignore, `files` 밖이라 tarball 에 안 들어감)에 빌드 입력의 **내용 해시**를 남기고, `pnpm dist:check` 가 다시 해싱해 비교한다. mtime 이 아니라 내용인 이유는 `git checkout`·`git stash`·rsync·컨테이너 복사가 mtime 을 통째로 다시 쓰기 때문이다 — 그 경우 mtime 은 낡은 dist 를 fresh 로 통과시킨다.

범위는 손 명단이 아니라 각 매니페스트의 해석 필드(`main`·`module`·`types`·`exports`·`publishConfig`)가 가리키는 출력 디렉토리에서 파생된다. 새 서브패스나 새 패키지는 존재하는 것만으로 범위에 들어온다. `build` 는 있는데 `postbuild` 훅이 없는 패키지는 커버리지 단언에서 실패한다.

**이 게이트의 이빨은 로컬에 있다.** CI 는 매 실행 빈 체크아웃에서 빌드하므로 낡은 dist 를 가질 수 없고, 거기서는 "0 verified, 11 skipped" 로 아무것도 관측하지 않았음을 그대로 보고한다. dist 가 세션·에이전트 사이에 살아남는 것은 로컬이다.

### 발행 tarball 내용물 — `pnpm tarball:check`

`publint` 는 해석 필드를 **작업 디렉토리**에 대고 검증한다. `packages/core/src/index.ts` 가 거기 실재하므로 통과하고, "패커가 tarball 에 무엇을 넣었나" 는 아무도 묻지 않는다. 이 빈자리는 이론이 아니다 — 같은 core 를 `pnpm pack` 은 21 엔트리(`package/src/*` 0건), `npm pack` 은 22 엔트리(`package/src/index.ts` 포함)로 만든다. npm 은 `publishConfig` 필드 치환을 적용하지 않고, npm-packlist 가 `main` 이 지목한 파일을 `files` 와 무관하게 강제 포함하기 때문이다. 그렇게 발행되면 `main`·`types` 가 12줄짜리 배럴을 가리키는데 그 배럴이 re-export 하는 12개 디렉토리는 tarball 에 없다 — 761 B 짜리 무해한 잉여가 아니라 깨진 진입점이다.

`node scripts/packaging-gate.mjs --check-tarballs` 가 발행 대상 전량을 실제로 pack 해서 세 축을 단언한다.

- **CONTAINMENT** — 모든 엔트리는 해석 필드가 가리키는 디렉토리 아래이거나 패커가 항상 넣는 메타(`package.json`·`README*`·`LICENSE*` 등)다.
- **RESOLVABILITY** — packed 매니페스트가 해석하는 모든 경로가 그 tarball 안에 실재한다.
- **SUBSTANCE** — 그 경로들이 내용을 갖는다. 실재와 완성은 다른 질문이다. 빌드가 중간에 끊기면 0바이트 `dist/index.d.ts` 가 남고, 파일이 거기 있으므로 `publint --strict` 는 통과한다(실측 EXIT=0). 소비자는 타입이 통째로 없는 패키지를 조용히 받는다.

`SUBSTANCE` 의 판정은 **공백 여부뿐**이고, 더 날카로운 규칙("`.d.ts` 는 무언가를 declare/export 해야 한다")은 작성했다가 **철회**했다. `@wireweave/mcp-server` 의 `dist/index.d.ts` 는 tsup 이 export 0개짜리 진입점에서 복사한 20바이트 shebang 인데, 그건 옳은 출력이다 — 그 모듈은 실제로 아무것도 export 하지 않는다. "빌드가 깨져서 빈 것"과 "선언할 게 없어서 빈 것"의 구분은 tarball 이 아니라 소스의 export 표면을 봐야 하므로 이 축에 속하지 않는다. 내용 중간이 잘린 파일도 통과한다 — 두 잔여는 침묵이 아니라 명시로 남긴다.

허용 목록을 `files` 에서 파생하면 **안 된다**. `files` 는 패커가 무엇을 넣을지 정하는 바로 그 필드라, 거기서 기대치를 뽑으면 `files` 를 넓힐 때 담기는 집합과 허용 집합이 같이 넓어져 둘이 영원히 불일치할 수 없다 — 검사가 아니라 항진명제가 된다. 그래서 기대치는 의도를 독립적으로 진술하는 해석 필드에서 파생하고, `src` 는 명시적으로 제외한다.

발행이 pnpm 경로에 머무는지도 같이 단언한다(워크플로우와 각 프로젝트 스크립트에서 직접 `npm publish` 호출 탐지, 주석 제외). 위 divergence 가 무해한 것은 changesets 가 `pnpm publish` 를 띄우기 때문일 뿐이고, 그 전제가 바뀌면 red 가 된다.

### sideEffects 선언 — `pnpm sideeffects:check`

`sideEffects: false` 는 이 레포의 매니페스트 주장 중 **읽는 쪽이 남의 번들러**인 유일한 항목이다. 번들러는 이 선언을 보고 "이 패키지의 export 를 아무도 안 쓰면 모듈을 평가하지 않고 지워도 된다"고 판단한다. `agent-prompts` 가 이 약속을 하고 있고, 지금까지 아무도 검증하지 않았다. 깨져도 여기서 red 가 나지 않는다 — 소비자의 webpack 빌드에서 polyfill 이나 등록 코드가 사라지는 형태로, 원인에서 레포 몇 개 떨어진 자리에 나타난다. `publint` 는 이 항목을 검사하지 않고 구조적으로 할 수도 없다. 주장의 내용이 "이 모듈을 평가하면 무슨 일이 일어나는가" 라서, 평가해 보는 것 말고는 답할 방법이 없기 때문이다.

`node scripts/packaging-gate.mjs --check-side-effects` 가 선언한 패키지의 **모든 exports 진입점을 각각 별도 프로세스에서 실제로 import** 하고 다음을 관측한다. 모듈은 프로세스당 한 번만 평가되므로 진입점마다 프로세스를 새로 띄운다 — 한 프로세스에서 열 개를 돌리면 아홉 개는 캐시된 no-op 을 측정하게 된다.

- **STATE** — import 전후로 globals, 빌트인 프로토타입(`Array`/`Object`/`String`/`Number`/`Promise`/`Function`), `process.env` 를 비교한다. 프로토타입을 따로 보는 이유는 `sideEffects: false` 가 틀리는 교과서적 사례가 polyfill 인데, polyfill 은 global 을 추가하지 않고 `Array.prototype` 을 제자리에서 고치기 때문이다.
- **출력** — 자식 프로세스의 stdout/stderr 를 부모가 잡는다. 모듈이 조작할 수 있는 realm 바깥에서 관측되므로 `console` 을 어떻게 우회하든 걸린다.
- **파일시스템 / 프로세스 / 워커** — Node 의 권한 모델(`--permission`, Node 22 에서는 `--experimental-permission`)로 **Node 가 직접 차단**한다. 읽기는 열어 두고 쓰기는 리포트 파일 하나로 좁힌다.

권한 모델이 장식이 아닌 이유는 실측으로 갈렸다. import 시점에 `import { writeFileSync } from 'node:fs'` 로 쓰는 fixture 는 **메서드 패칭만 있을 때 게이트를 green 으로 통과했다** — 빌트인의 ESM named export 는 이 스크립트가 프로퍼티를 교체하기 전에 바인딩되기 때문이다. 권한 모델을 붙이자 같은 fixture 가 `ERR_ACCESS_DENIED` 로 red 가 됐다. 그래서 메서드 패칭은 "걸리면 호출 지점을 이름으로 알려주는" 보조로 남기고, 판정의 근거는 우회 불가능한 층에 둔다.

검사 대상은 **약속한 집합에서 파생**한다 — `sideEffects: false` 를 선언한 발행 패키지 전부, 그 안의 exports 진입점 전부. 필드를 추가하는 순간 검사 대상이 되고, export 경로를 늘리는 순간 그 경로도 대상이 된다. 선언하지 않은 패키지는 **일부러 검사하지 않는다**: 선언 부재는 "부작용이 있다고 가정하라" 는 안전한 해석이고, 아무도 하지 않은 약속을 검증하는 것은 게이트가 정책을 발명하는 짓이다. 선언한 패키지가 0 이 되면 green 이 아니라 **red** 다 — 검증할 게 없어진 게이트가 영원히 성공을 보고하는 것이 이 레포가 반복해 밟은 바로 그 함정이다.

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
