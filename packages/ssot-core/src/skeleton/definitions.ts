// The 12 structured skeleton definitions — transcribed from the ssot-studio reference skeletons.
// Korean hints/prompts are kept verbatim: they ARE the interview question hints. The axis marker
// [축N] is factored out into FieldSlot.axis (rendered back when producing markdown).

import type { SsotKind } from '../types.js'
import type { FieldSlot, SectionSlot, SkeletonAxis, SkeletonDef } from './types.js'

export const OPEN_HEADING = '미확정 (OPEN)'

// ── field-slot factories (keep the data terse and consistent) ─────
const scalar = (field: string, axis: SkeletonAxis, hint: string, defaultValue = ''): FieldSlot => ({
  field,
  axis,
  hint,
  valueKind: 'scalar',
  defaultValue,
})

const idList = (
  field: string,
  axis: SkeletonAxis,
  hint: string,
  refKindHint?: string,
): FieldSlot =>
  refKindHint !== undefined
    ? { field, axis, hint, valueKind: 'id-list', refKindHint, defaultValue: [] }
    : { field, axis, hint, valueKind: 'id-list', defaultValue: [] }

const relatesList = (hint: string): FieldSlot => ({
  field: 'relatesTo',
  axis: 2,
  hint,
  valueKind: 'relates-list',
  defaultValue: [],
})

const pathList = (field: string, axis: SkeletonAxis, hint: string): FieldSlot => ({
  field,
  axis,
  hint,
  valueKind: 'path-list',
  defaultValue: [],
})

const owner: FieldSlot = scalar('owner', 4, '', 'TBD')
const confidence = (hint = '', defaultValue = 'unverified'): FieldSlot =>
  scalar('confidence', 4, hint, defaultValue)
const lifecycle = (hint = '', defaultValue = 'active'): FieldSlot =>
  scalar('lifecycle', 4, hint, defaultValue)
const lastVerified = (hint = ''): FieldSlot => scalar('lastVerified', 4, hint, '')

const sec = (heading: string, prompt: string): SectionSlot => ({ heading, prompt })
const openSection = sec(OPEN_HEADING, '')

export const SKELETONS: Record<SsotKind, SkeletonDef> = {
  Platform: {
    kind: 'Platform',
    idPrefix: 'platform',
    fields: [
      scalar('purpose', 1, '이 제품이 존재하는 목적 — 모르면 비우지 말고 아래 OPEN으로'),
      idList('servesPersona', 1, '→ persona.* id', 'persona'),
      scalar('value', 1, '핵심 가치 명제'),
      owner,
      lifecycle('planned | active | deprecated'),
      confidence('high | inferred | unverified'),
      lastVerified('YYYY-MM-DD'),
    ],
    sections: [
      sec('무엇인가', '이 플랫폼이 무엇인지 1~3문장'),
      sec('누구를 위한 것인가', 'servesPersona가 가리키는 사용자들과, 그들이 왜 이걸 쓰는지'),
      sec('서비스 영역', '제품이 다루는 서비스/모듈 목록(예: admin / studio / chat)과 각자의 책임'),
      sec(
        '접근 매트릭스 (역할 → 서비스)',
        '역할(Persona/role)이 어느 서비스 영역에 접근하는지 매트릭스. governs/scopes 엣지로 정렬',
      ),
      sec(
        '기술 스택 (제품 맥락)',
        '제품 이해에 필요한 수준의 핵심 스택(프런트/백/인프라). 상세 버전 규약은 레포 룰에 위임',
      ),
      openSection,
    ],
    openSeeds: ['OPEN: purpose 확정 필요', 'OPEN: 핵심 value 명제 확정 필요'],
  },

  Persona: {
    kind: 'Persona',
    idPrefix: 'persona',
    fields: [
      scalar('purpose', 1, '이 사용자 유형이 제품에서 이루려는 것'),
      scalar('definition', 2, '이 페르소나는 누구인가 (역할/맥락)'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('누구인가', '역할, 조직상 위치, 기술 수준 등'),
      sec('무엇을 하려고 제품을 쓰나', '주요 목표(job-to-be-done)'),
      openSection,
    ],
    openSeeds: ['OPEN: definition 확정 필요'],
  },

  Domain: {
    kind: 'Domain',
    idPrefix: 'domain',
    fields: [
      scalar('purpose', 1, '이 도메인이 책임지는 비즈니스 영역'),
      scalar('definition', 2, '도메인 경계 (무엇이 포함/제외)'),
      idList('servesPersona', 1, '→ persona.*', 'persona'),
      relatesList('[{ to: <id>, type: <관계>, note?: <설명> }]'),
      idList('governedBy', 2, '→ invariant.*', 'invariant'),
      idList('realizedBy', 3, '→ component.*', 'component'),
      idList('impacts', 3, '개념적 파급 → 임의 id'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('목적', '이 도메인이 책임지는 것'),
      sec('경계와 핵심 개념', '포함되는 Concept(belongs-to/contains), 제외되는 것'),
      sec('기능', '이 도메인이 제공하는 capability 목록. realizedBy 가 가리키는 component 와 정렬'),
      sec(
        '시스템 흐름',
        '주요 동작의 흐름(요청→처리→저장). leads-to/feeds 엣지로 추적되는 시퀀스를 서술',
      ),
      sec('다른 도메인과의 관계', 'relatesTo 서술 — type 은 x-edge-types 표준 어휘 사용'),
      openSection,
    ],
    openSeeds: ['OPEN: definition(경계) 확정 필요'],
  },

  Concept: {
    kind: 'Concept',
    idPrefix: 'concept',
    fields: [
      scalar('definition', 2, '이 개념이 무엇인지 + 동의어'),
      relatesList(
        '[{ to: <id>, type: <관계>, note?: <설명> }] — type 은 x-edge-types 표준 어휘 사용',
      ),
      idList('governedBy', 2, '→ invariant.*', 'invariant'),
      pathList('implementedIn', 3, '이 개념이 실체화된 코드/DB 위치(provenance)'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec(
        '정의',
        '이 도메인 용어의 의미 + 동의어(코드/DB에서의 다른 이름). relatesTo 로 거는 이웃 개념(포함/소유/참조)도 여기서 서술',
      ),
      sec(
        '엔티티 (DB)',
        '이 개념을 실체화하는 테이블/컬럼/FK/제약 전체. 본문이 원본이 되도록 자기완결적으로 (§1b)',
      ),
      sec(
        'API 표면',
        '이 개념을 읽고/바꾸는 endpoint. relatesTo:reads/mutates 로 거는 endpoint.* 와 정렬',
      ),
      sec('불변식', '이 개념에 걸린 깨면 안 되는 제약. governedBy 가 가리키는 invariant.* 서술'),
      sec(
        '구현 위치 (provenance)',
        'implementedIn 경로 설명. 코드/DB가 사라져도 위 본문만으로 재현 가능해야 한다',
      ),
      openSection,
    ],
    openSeeds: ['OPEN: definition 확정 필요'],
  },

  Capability: {
    kind: 'Capability',
    idPrefix: 'capability',
    fields: [
      scalar('purpose', 1, '사용자가 이걸로 이루려는 것'),
      idList('servesPersona', 1, '→ persona.*', 'persona'),
      idList('realizedBy', 3, '→ component.*', 'component'),
      pathList('implementedIn', 3, '코드/문서 경로 (라우트, 화면 컴포넌트 등)'),
      relatesList('관련 개념 [{ to, type, note? }] — type 은 x-edge-types 표준 어휘 사용'),
      idList('impacts', 3, '개념적 파급'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('사용자가 할 수 있는 일', '이 기능이 제공하는 가치와 그 의도 (사용자 관점)'),
      sec(
        '행위',
        '구체적 액션 목록(읽기/생성/수정/삭제 등). 호출하는 endpoint 를 calls/reads/mutates 엣지로 정렬',
      ),
      sec(
        '시스템 흐름',
        '이 기능 수행 시 화면→API→처리의 흐름. leads-to/realizes 엣지로 추적되는 시퀀스',
      ),
      sec('어디에 구현되어 있나', 'implementedIn 경로 설명 (화면/라우트/컴포넌트)'),
      openSection,
    ],
    openSeeds: ['OPEN: implementedIn 경로 확인 필요'],
  },

  SystemComponent: {
    kind: 'SystemComponent',
    idPrefix: 'component',
    fields: [
      scalar('purpose', 1, '이 시스템 단위의 책임'),
      idList('realizedBy', 3, '이 컴포넌트가 실현하는 capability/domain id (역참조 보조)'),
      pathList('implementedIn', 3, '레포/디렉토리 경로'),
      idList('dependsOn', 3, '→ component.* (의존 대상)', 'component'),
      idList('consumesApi', 3, '호출하는 API 엔트리 (경로 또는 정합성 문서 링크)'),
      idList('providesApi', 3, '제공하는 API 엔트리'),
      idList('integratesWith', 3, '→ integration.*', 'integration'),
      idList('impacts', 3, '개념적 파급'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('책임', '이 컴포넌트(FE 앱/BE 서비스/외부 시스템)가 맡는 것'),
      sec('경계와 의존', 'dependsOn / consumesApi / providesApi 설명. 어느 레포·런타임인지'),
      sec(
        '통신 패턴',
        '외부와 어떻게 통신하나(REST/MF/이벤트/배치 등). integratesWith/exposes/feeds 엣지로 정렬',
      ),
      sec(
        '하위 서브패키지 (책임 단위)',
        '이 컴포넌트를 구성하는 하위 모듈/패키지와 각자의 책임. contains 엣지로 정렬',
      ),
      openSection,
    ],
    openSeeds: ['OPEN: 의존/호출 관계 확인 필요'],
  },

  Integration: {
    kind: 'Integration',
    idPrefix: 'integration',
    fields: [
      scalar('purpose', 1, '이 외부 연동이 필요한 이유'),
      scalar('definition', 2, '무엇과 연동하나 (외부 시스템/프로토콜)'),
      idList('integratesWith', 3, '→ component.* (이 연동을 사용하는 내부 컴포넌트)', 'component'),
      pathList('implementedIn', 3, '이 연동이 구현된 코드 위치(provenance)'),
      idList('impacts', 3, '이 연동 도입/변경이 파급하는 대상 id (개념/불변식/화면)'),
      relatesList('관련 개념 [{ to, type, note? }] — type 은 x-edge-types 표준 어휘 사용'),
      idList('governedBy', 2, '→ invariant.* (연동에 걸린 제약)', 'invariant'),
      owner,
      lifecycle('신규 연동 검토 시 planned로 시작', 'planned'),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('무엇과 연동하나', '외부 시스템, 인증 방식, 프로토콜'),
      sec(
        '구현 위치 (provenance)',
        'implementedIn 경로 설명 + integratesWith(사용하는 내부 컴포넌트). 코드가 사라져도 본문만으로 재현 가능해야 한다',
      ),
      sec(
        '불변식',
        '이 연동에 걸린 깨면 안 되는 제약(인증/만료/레이트리밋 등). governedBy 가 가리키는 invariant.*',
      ),
      sec('영향 범위', 'impacts: 이 연동이 닿는 개념·권한·화면·불변식. 영향분석의 출발점'),
      openSection,
    ],
    openSeeds: ['OPEN: 영향 대상(impacts) 확정 필요'],
  },

  Invariant: {
    kind: 'Invariant',
    idPrefix: 'invariant',
    fields: [
      scalar('definition', 2, '깨면 안 되는 제약을 한 문장으로'),
      idList('governs', 2, '이 불변식이 적용되는 대상 id (concept/domain/capability/component)'),
      pathList('implementedIn', 3, '이 제약이 코드에서 강제되는 위치'),
      idList('decidedBy', 4, '→ decision.* (이 불변식이 왜 생겼나)', 'decision'),
      scalar('crossesBoundary', 3, '이 제약이 FE↔BE 등 시스템 경계를 가로지르는가', 'false'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('제약', '무엇이 항상 참이어야 하는가'),
      sec('깨지면 무슨 일이 일어나나', '위반 시 실패 시나리오'),
      sec('코드에서 어떻게 강제되나', 'implementedIn 위치 설명. 강제 안 되면 그 사실을 적는다'),
      openSection,
    ],
    openSeeds: ['OPEN: decidedBy(근거 결정) 연결 필요'],
  },

  Decision: {
    kind: 'Decision',
    idPrefix: 'decision',
    fields: [
      scalar('purpose', 1, '이 결정이 답한 질문'),
      scalar('definition', 2, '무엇을 결정했나 (한 문장)'),
      relatesList(
        '이 결정이 만든/바꾼 대상 [{ to, type, note? }] — type 은 x-edge-types 표준 어휘 사용',
      ),
      idList(
        'supersedes',
        4,
        '이 결정이 대체하는 이전 decision.* id (append-only 체인)',
        'decision',
      ),
      owner,
      lifecycle('active | deprecated(=superseded)'),
      confidence('결정은 기록 시점에 확정이므로 보통 high', 'high'),
      lastVerified('YYYY-MM-DD (결정일)'),
    ],
    sections: [
      sec('맥락 (Context)', '어떤 상황/문제에서 이 결정이 필요했나'),
      sec('결정 (Decision)', '무엇을 택했나'),
      sec('근거와 결과 (Consequences)', '왜 이 선택인가, 그로 인해 무엇이 따라오나(=영향 후보)'),
    ],
    openSeeds: [],
  },

  Screen: {
    kind: 'Screen',
    idPrefix: 'screen',
    fields: [
      scalar('purpose', 1, '이 화면에서 사용자가 이루는 것'),
      idList('servesPersona', 1, '→ persona.*', 'persona'),
      idList('realizedBy', 3, '→ component.* (이 화면을 렌더하는 FE 앱)', 'component'),
      pathList('implementedIn', 3, '라우트/컴포넌트 파일 경로(provenance)'),
      idList('consumesApi', 3, '이 화면이 호출하는 endpoint (→ endpoint.* 또는 경로)', 'endpoint'),
      relatesList(
        '관련 capability/concept [{ to, type, note? }] — type 은 x-edge-types 표준 어휘(calls/leads-to 등)',
      ),
      idList('impacts', 3, '개념적 파급'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('화면 목적', '이 화면(라우트)에서 누가 무엇을 하나(자연어)'),
      sec(
        'UI 요소 / 입력 필드',
        '사용자가 보고/입력하는 것을 의미로: 무슨 정보를 입력·선택·필터하나. 컴포넌트명 나열이 아니라 역할로.',
      ),
      sec(
        '표시 데이터 / 호출 API',
        '어떤 정보를 보여주나(의미) + 어떤 기능(endpoint)을 호출하나(FE↔BE 연결, consumesApi)',
      ),
      sec('상태 / 엣지케이스', '로딩/빈/에러 상태, 권한에 따른 분기, 예외 흐름'),
      openSection,
    ],
    openSeeds: [
      'OPEN: 라우트 코드 정독해 행위·표시/입력 데이터·적용 규칙·호출 endpoint 를 자연어로 채울 것',
    ],
  },

  Endpoint: {
    kind: 'Endpoint',
    idPrefix: 'endpoint',
    fields: [
      scalar('definition', 2, 'METHOD PATH + 한 줄 용도'),
      idList('realizedBy', 3, '→ component.* (이 endpoint 를 제공하는 BE)', 'component'),
      pathList('implementedIn', 3, '컨트롤러/라우터 파일 경로(provenance)'),
      relatesList(
        '관련 concept [{ to, type, note? }] — type 은 x-edge-types 표준 어휘(reads/mutates/backed-by 등)',
      ),
      idList('governedBy', 2, '→ invariant.* (권한 등)', 'invariant'),
      idList('impacts', 3, '개념적 파급'),
      idList('consumedBy', 3, '이 endpoint 를 호출하는 screen/component'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('정의', '무슨 기능인가 + 누가/언제 쓰나(자연어). METHOD PATH 는 한 줄 식별용으로만.'),
      sec(
        '요청 / 응답',
        '주고받는 데이터를 *자연어 의미*로: 무슨 정보를 보내고 무슨 정보를 돌려주나. DTO 통째 복사·필드명/타입 나열 금지(구현 형태는 개발 시점 결정). 대표 항목의 의미만.',
      ),
      sec(
        '권한 / 제약',
        '누가 호출할 수 있나(권한), 어떤 조건·기본값·예외·제약이 적용되나. 불변식은 governedBy 가 가리키는 invariant.*',
      ),
      sec(
        'provenance',
        'implementedIn 컨트롤러/라우터 경로 + realizedBy(제공 BE 컴포넌트). 코드가 사라져도 위 본문(정책·데이터 의미)만으로 재기획·재구현 가능해야 한다(코드 구조 복사가 아니라 의미 보존)',
      ),
      openSection,
    ],
    openSeeds: [
      'OPEN: 컨트롤러/서비스/매퍼를 정독해 기능·권한·주고받는 데이터의 의미를 자연어로 채울 것 (코드 옮겨적기 아님). 코드가 분기마다 다르거나 의도 불명이면 "확인 필요"로 남기고 판정은 owner 에게.',
    ],
  },

  Flow: {
    kind: 'Flow',
    idPrefix: 'flow',
    fields: [
      scalar('purpose', 1, '이 여정으로 사용자가 달성하는 것'),
      idList('servesPersona', 1, '→ persona.*', 'persona'),
      relatesList(
        '거치는 screen/capability [{ to, type, note? }] — 순서는 leads-to/preceded-by 표준 어휘 사용',
      ),
      idList('impacts', 3, '개념적 파급'),
      owner,
      lifecycle(),
      confidence(),
      lastVerified(),
    ],
    sections: [
      sec('여정 목적', '어떤 비즈니스 시나리오인가'),
      sec(
        '단계 (화면 시퀀스)',
        '1. 화면 A → 2. 화면 B(분기: 조건) → 3. 화면 C. relatesTo 의 screen 들을 순서로',
      ),
      sec('분기 / 예외', '조건 분기, 실패·취소 경로'),
      openSection,
    ],
    openSeeds: ['OPEN: 기획 인터뷰로 단계·분기 확정(tacit — 코드만으로 불완전)'],
  },
}

/** The structured skeleton for a kind. */
export function getSkeleton(kind: SsotKind): SkeletonDef {
  return SKELETONS[kind]
}
