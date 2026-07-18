---
paths:
  - 'src/index.ts'
  - 'src/parser.ts'
  - 'src/renderer.ts'
---

# 공개 API 계약

`@wireweave/core` 는 7개 패키지가 의존하는 핵심 라이브러리. public export 는 implicit contract.

## entry 구조

`package.json` exports:

| Subpath      | 용도                       | 안정성 |
| ------------ | -------------------------- | ------ |
| `.`          | 메인 (parse + render 통합) | stable |
| `./parser`   | 파서만                     | stable |
| `./renderer` | 렌더러만                   | stable |

## stable export

다음 export 는 BREAKING 없이는 변경하지 않는다.

### 함수

- `parse(source: string): WireframeDocument`
- `parseToCanvas(source: string): CanvasDocument`
- `printWireframe(doc: WireframeDocument): string` — canonical `.wf` 프린터 (AST → 결정적 DSL 텍스트)
- `formatWireframeCode(source: string): string` — parse + canonical 재인쇄
- `render(doc: WireframeDocument, options?: RenderOptions): { html, css }`
- `renderToSvg(doc: WireframeDocument, options?: RenderOptions): string`
- `renderCanvas(doc: CanvasDocument, options?: CanvasOptions): { html, css, pages: PlacedPage[] }`
- `layoutCanvas(doc: CanvasDocument, options?: LayoutOptions): PlacedPage[]`

### 타입

- `WireframeDocument`, `Page`, `Component`, `CanvasDocument`, `PlacedPage`
- `RenderOptions`, `CanvasOptions`, `LayoutOptions`

### 클래스 / enum

- 현재 없음. 추가 시 BREAKING 으로 간주.

## unstable / internal

다음은 직접 import 하지 말 것 — 의존하면 미리 알리지 않고 변경됨:

- `src/parser/generated-parser.js` (직접 import 금지, `parse` 경유)
- `src/ast/validators` (parser 가 사용)
- `src/renderer/html/renderers/*` (renderer 가 사용)
- `src/renderer/canvas-layout` (layoutCanvas 의 implementation detail)

## 새 export 추가 절차

1. `src/index.ts` (또는 sub-entry) 에 export 추가
2. JSDoc 으로 의도 명시 (`@public`, `@example`)
3. 타입 d.ts 에 정확히 표현되는지 확인 (`pnpm build` 후 `dist/index.d.ts` 검토)
4. CHANGELOG: `feat:` (minor 를 트리거)
5. README 또는 `wireweave/docs/` 에 사용 예제 추가

## 제거 절차 (BREAKING)

1. deprecation 1 minor 사이클 동안 표시 (`@deprecated` JSDoc + console.warn)
2. 의존 패키지 7종 코드 검토 — 모두 deprecation 처리 PR
3. major bump 시 실제 제거
4. CHANGELOG: `BREAKING CHANGE:` 로 명시
5. `.claude/rules/breaking-change.md` 절차 준수

## 타입만 변경하는 patch

타입 정의 정확화 (예: `string | undefined` → `string | null` corner case 명시) 도 의존자가 깨질 수 있으면 minor / major.

`pnpm dlx publint` 로 dist 의 d.ts 외형 검증 — 새로운 unstable 심볼이 외부에 노출되지 않았는지 확인.

## API 디자인 원칙

- pure function 우선 (입력 → 출력, 부수효과 없음)
- options object 는 default 값 명시 + 옵셔널 필드는 모두 옵셔널
- callback / event emitter 패턴 지양 — 필요하면 사용자가 주변에서 처리
- 비동기 함수 도입은 신중하게 — 현재 모든 public API 가 sync. async 추가 = BREAKING 후보

## 의존 패키지 갱신

core 변경 → 의존 패키지 7종 동기화:

```bash
# wireweave 폴더의 부모 디렉토리에서
./scripts/update-core-deps.sh 3.0.0
```

대상: api-server, markdown-plugin, ux-rules, vscode-extension, dashboard, admin, examples.
core 의존 없는 패키지: language-data, mcp-server, docs.
