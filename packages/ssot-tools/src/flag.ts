// Flag — the library port of ssot-studio's flag.mjs body/label construction.
//
// Builds a gh-issue title/body/labels + the `gh issue create` command text for an SSOT flag
// (problem found while reading) or a JIT capture (competency-gap / rationale-fragment). Never
// executes anything — the consumer runs the returned command.

import { ghIssueCmd } from './governance.js'

export type FlagType =
  | 'dangling'
  | 'contradiction'
  | 'missing'
  | 'other'
  | 'competency-gap'
  | 'rationale-fragment'

export interface FlagInput {
  type?: string
  title: string
  detail?: string
  nodes?: string[]
  question?: string
  asker?: string
  confidence?: string
  repo?: string
}

export interface FlagIssue {
  family: 'flag' | 'capture'
  type: FlagType
  title: string
  body: string
  labels: string[]
  ghCommand: string
}

const TYPE_LABEL: Record<FlagType, string> = {
  dangling: 'ssot-dangling',
  contradiction: 'ssot-contradiction',
  missing: 'ssot-missing',
  other: 'ssot-flag',
  'competency-gap': 'ssot-competency-gap',
  'rationale-fragment': 'ssot-rationale',
}

const TYPE_DESC: Record<FlagType, string> = {
  dangling: '끊긴 엣지 — 존재하지 않는 노드를 가리킴(연결 완전성 결함).',
  contradiction: '모순 — 두 노드/불변식/결정이 서로 충돌.',
  missing: '누락 — 코드/사실은 있으나 SSOT 항목이 없음.',
  other: '조회 중 발견한 SSOT 문제.',
  'competency-gap': '미답 질문 — 조회로 답하지 못한 competency question. 빠진 슬롯 신호.',
  'rationale-fragment': '근거 조각 — 질문자가 자발적으로 제시한 의견/근거. 검증 전 후보(inferred).',
}

const CAPTURE_TYPES = new Set<FlagType>(['competency-gap', 'rationale-fragment'])
const DEFAULT_CONFIDENCE: Record<string, string> = {
  'competency-gap': 'unverified',
  'rationale-fragment': 'inferred',
}

function normalizeType(t: string | undefined): FlagType {
  return t && t in TYPE_LABEL ? (t as FlagType) : 'other'
}

/** Build the gh-issue artifacts for a flag/capture. No side effects. */
export function buildFlagIssue(input: FlagInput): FlagIssue {
  if (!input.title) throw new Error('flag: title required')
  const type = normalizeType(input.type)
  const nodes = Array.isArray(input.nodes) ? input.nodes : []
  const family = CAPTURE_TYPES.has(type) ? 'capture' : 'flag'
  const repo = input.repo ?? ''

  const dedupeLabels = (labels: string[]): string[] => [...new Set(labels)]

  let body: string
  let labels: string[]
  if (family === 'capture') {
    const question = (input.question ?? '').trim() || '(미지정)'
    const asker = (input.asker ?? '').trim() || '(미지정)'
    const confidence = (input.confidence ?? '').trim() || DEFAULT_CONFIDENCE[type] || 'unverified'
    body = [
      `## SSOT capture: ${type}`,
      '',
      `- 종류: **${type}** — ${TYPE_DESC[type]}`,
      `- 원본 질문: ${question}`,
      `- 질문자(추정 owner 후보): ${asker}`,
      nodes.length
        ? `- 관련/대상 노드: ${nodes.map((n) => `\`${n}\``).join(', ')}`
        : '- 관련/대상 노드: (미지정 — 신규 슬롯 후보)',
      `- confidence: **${confidence}** (owner 검증 전까지 진실 아님)`,
      '',
      '### 상세',
      '',
      input.detail || '- [ ] OPEN: 상세 서술 필요.',
      '',
      '---',
      '_JIT 캡처(읽기전용). 별도 큐레이션 에이전트가 dedup·구조화 후 propose로 승격한다. owner 검증 전엔 inferred/unverified._',
    ].join('\n')
    labels = dedupeLabels(['ssot-capture', TYPE_LABEL[type]])
  } else {
    body = [
      `## SSOT flag: ${type}`,
      '',
      `- 종류: **${type}** — ${TYPE_DESC[type]}`,
      nodes.length
        ? `- 관련 노드: ${nodes.map((n) => `\`${n}\``).join(', ')}`
        : '- 관련 노드: (미지정)',
      '',
      '### 상세',
      '',
      input.detail || '- [ ] OPEN: 상세 서술 필요.',
      '',
      '---',
      '_조회 중 발견(읽기전용). 데이터는 직접 수정하지 않고 이슈로 등록 — 사람이 판단._',
    ].join('\n')
    labels = dedupeLabels(['ssot-flag', TYPE_LABEL[type]])
  }

  const titlePrefix = family === 'capture' ? '[ssot:capture] ' : '[ssot:flag] '
  const title = `${titlePrefix}${input.title}`
  const ghCommand = ghIssueCmd({ title, body, labels, repo })

  return { family, type, title, body, labels, ghCommand }
}
