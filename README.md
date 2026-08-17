# Wireweave

> AI와 함께 와이어프레임을 작성하기 위한 DSL.

Wireweave는 와이어프레임을 코드로 작성하는 텍스트 기반 DSL입니다. `.wf` 파일(멀티페이지 캔버스 지원)에 화면을 기술하면 파싱·렌더링·검증·내보내기를 수행할 수 있고, LLM이 이 DSL을 생성·수정하도록 돕는 도구를 제공합니다.

- npm scope: [`@wireweave`](https://www.npmjs.com/org/wireweave)
- 도메인: [wireweave.org](https://wireweave.org) (문서: [docs.wireweave.org](https://docs.wireweave.org))

이 저장소는 Wireweave의 **공개 표면**(언어 + 도구 + 클라이언트)을 담은 pnpm 모노레포입니다. 10개 패키지 + 문서 사이트로 구성됩니다. 호스티드 AI 에이전트, API 서버, 제품(대시보드·관리자)은 별도의 비공개 저장소에서 관리됩니다.

## 패키지

| 패키지                                                   | 역할                                                                                            | 배포                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------- |
| [`@wireweave/core`](packages/core)                       | DSL 파서/렌더러 (Peggy grammar). parse · render(HTML·SVG) · analyze · diff · export(figma·json) | npm                    |
| [`@wireweave/language-data`](packages/language-data)     | 컴포넌트 어휘/속성 데이터 (에디터 자동완성·검증용). Monaco·CodeMirror 서브패스 제공             | npm                    |
| [`@wireweave/ux-rules`](packages/ux-rules)               | UX 검증 규칙 + 0~100 점수 (`validateUX`)                                                        | npm                    |
| [`@wireweave/agent-prompts`](packages/agent-prompts)     | LLM이 DSL을 생성하도록 돕는 문법 가이드 프롬프트 (`buildGrammarPrompt`)                         | npm                    |
| [`@wireweave/markdown-plugin`](packages/markdown-plugin) | 마크다운 코드블록(`.wf`) 렌더링 (markdown-it · marked · remarkable)                             | npm                    |
| [`wireweave-vscode`](packages/vscode-extension)          | VS Code / Cursor 확장 (구문 강조 · 자동완성 · 프리뷰)                                           | Marketplace + Open VSX |
| [`@wireweave/sdk`](packages/sdk)                         | 플랫폼 클라이언트. `dispatch()`로 로컬 도구(무료·무키)와 원격(API 서버, 키) 라우팅 + auth       | npm                    |
| [`@wireweave/cli`](packages/cli)                         | SDK 위의 터미널 CLI (`wireweave` 바이너리)                                                      | npm                    |
| [`@wireweave/mcp-server`](packages/mcp-server)           | MCP 서버 (SDK 래핑, `WIREWEAVE_API_KEY` 필요)                                                   | npm                    |
| [`@wireweave/docs`](docs)                                | VitePress 문서 사이트                                                                           | Vercel (비발행)        |

### 무료/유료 경계

기본 도구 — `parse` · `validate` · `render` · `analyze` · `diff` · `export` · `validate_ux` — 는 **로컬에서 무료로, API 키 없이** 동작합니다. 호스티드 AI 에이전트 생성은 별도 유료 기능으로 API 키가 필요합니다.

- `@wireweave/cli`, `@wireweave/sdk` 로컬 도구: 키 불필요
- `@wireweave/mcp-server`: `WIREWEAVE_API_KEY` 필수

## 빠른 시작

요구 사항: Node.js ≥ 22.13, pnpm ≥ 11.

```bash
pnpm install

pnpm build        # 전 패키지 빌드 (pnpm -r --filter "./packages/**")
pnpm typecheck    # 전 패키지 tsc --noEmit
pnpm lint         # 전 패키지 ESLint
pnpm test         # 전 패키지 테스트
pnpm format       # Prettier
```

개별 패키지에서 작업하려면 해당 디렉터리에서 스크립트를 실행합니다.

```bash
pnpm --filter @wireweave/core build
pnpm --filter @wireweave/docs dev
```

## 발행

[Changesets](https://github.com/changesets/changesets) **independent 모드**로 각 패키지를 독립 버전 관리하며, npm **OIDC trusted publishing**으로 게시합니다.

- `develop` 브랜치 → 베타 태그(`X.Y.Z-beta.N`)
- `main` 브랜치 → 정식(`latest`) 릴리스
- `@wireweave/docs`(Vercel)와 `wireweave-vscode`(vsce / ovsx)는 changesets npm 발행 대상에서 제외되며 별도 파이프라인으로 배포됩니다.

```bash
pnpm changeset            # 변경 의도 기록
pnpm version-packages     # 버전 bump + CHANGELOG
```

## 기여 / 라이선스

- 기여 가이드 및 문서: [docs.wireweave.org](https://docs.wireweave.org)
- 이슈 / 토론: [github.com/wireweave/wireweave](https://github.com/wireweave/wireweave)
- 라이선스: [MIT](LICENSE)
