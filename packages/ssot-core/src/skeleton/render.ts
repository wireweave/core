// Render a structured SkeletonDef back to the markdown skeleton shape (frontmatter with axis
// comments, sections with HTML-comment prompts, OPEN seed checkboxes). Rendered output round-trips
// through parseNode (comments are stripped on parse; the field set and section headings survive).

import type { SsotKind } from '../types.js'
import { getSkeleton, OPEN_HEADING } from './definitions.js'
import type { FieldSlot } from './types.js'

export interface RenderSkeletonParams {
  id: string
  title: string
}

const PREAMBLE =
  '<!-- 작성 고도(methodology §0): 비개발자도 읽는 자연어로 — 무엇을·왜·누가·어떤 규칙·무슨 데이터. 코드(테이블·필드·경로·SQL) 옮겨적기 금지(식별자는 provenance/근거에만). 코드 분기/의도 불명은 판정 말고 OPEN. -->'

function renderDefault(slot: FieldSlot): string {
  if (slot.valueKind === 'scalar') {
    const d = slot.defaultValue as string
    return d === '' ? '""' : d
  }
  return '[]'
}

function renderComment(slot: FieldSlot): string {
  return slot.hint === '' ? `# [축${slot.axis}]` : `# [축${slot.axis}] ${slot.hint}`
}

/** Render the markdown skeleton for a kind, filling id/title. */
export function renderSkeletonMarkdown(kind: SsotKind, params: RenderSkeletonParams): string {
  const def = getSkeleton(kind)
  const lines: string[] = ['---', `id: ${params.id}`, `kind: ${kind}`, `title: ${params.title}`]
  for (const slot of def.fields) {
    lines.push(`${slot.field}: ${renderDefault(slot)}  ${renderComment(slot)}`)
  }
  lines.push('---', '', PREAMBLE, '')

  for (const section of def.sections) {
    lines.push(`## ${section.heading}`)
    if (section.heading === OPEN_HEADING) {
      for (const seed of def.openSeeds) lines.push(`- [ ] ${seed}`)
    } else if (section.prompt !== '') {
      lines.push(`<!-- ${section.prompt} -->`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
