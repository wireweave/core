# @wireweave/core

DSL 파서 및 렌더러 핵심 라이브러리.

## 목적

Wireweave DSL 코드를 파싱하여 AST로 변환하고, HTML/SVG로 렌더링하는 핵심 기능 제공.

## 배포

- **공개 여부**: 오픈소스
- **배포처**: npm (`@wireweave/core`)
- **레포지토리**: github.com/wireweave/core

## 패키지 구조

```
src/
├── grammar/        # Peggy 문법 정의 (.peggy)
├── parser/         # 파서 (generated-parser.js 생성됨)
├── ast/            # AST 노드 타입 정의
├── renderer/       # HTML/SVG 렌더러
├── analyze/        # 와이어프레임 분석 기능
├── diff/           # 와이어프레임 비교 기능
├── export/         # 내보내기 (JSON, Figma 등)
├── validation/     # 문법 검증
├── viewport/       # 뷰포트 처리
├── spec/           # 스펙 정의
├── icons/          # 아이콘 데이터
├── types/          # 타입 정의
└── index.ts        # 진입점
```

## 기술 스택

- **파서 생성기**: Peggy (PEG parser generator)
- **빌더**: tsup
- **테스트**: Vitest

## 빌드 순서

```bash
# 1. 문법 파일로부터 파서 생성
pnpm build:grammar

# 2. TypeScript 빌드
pnpm build:ts

# 또는 전체
pnpm build
```

## 주요 Export

```typescript
// 파서
import { parse } from '@wireweave/core/parser'

// 렌더러
import { renderToHTML, renderToSVG } from '@wireweave/core/renderer'

// 전체
import { parse, renderToHTML, renderToSVG, validate, analyze, diff } from '@wireweave/core'
```

## 의존 패키지

없음 (독립적)

## 의존받는 패키지

- `@wireweave/api-server` - 렌더링/분석 서비스
- `@wireweave/vscode-extension` - 미리보기
- `@wireweave/markdown-plugin` - 마크다운 렌더링
- `mcp-dashboard` - 에디터 미리보기

<!-- TODO: 주요 함수별 상세 설명 추가 -->
<!-- TODO: 문법 변경 시 주의사항 문서화 -->
<!-- TODO: 버전별 변경 이력 관리 방안 -->
