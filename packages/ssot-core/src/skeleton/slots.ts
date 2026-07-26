// Interview slots — the structured questions a skeleton implies, and which of them a given node
// still leaves unfilled. Fully deterministic: no question-sentence generation (that is the LLM's
// job downstream); this only decides which slots are empty.

import { parseNode } from '../node-io.js'
import { ID_PREFIX_TO_KIND, SSOT_KINDS } from '../types.js'
import type { ParsedNode } from '../node-io.js'
import type { SsotKind } from '../types.js'
import { getSkeleton } from './definitions.js'
import type { FieldSlot, InterviewSlot } from './types.js'

/** All interview slots for a kind: every field, every section, and the OPEN seeds. */
export function getInterviewSlots(kind: SsotKind): InterviewSlot[] {
  const def = getSkeleton(kind)
  const slots: InterviewSlot[] = []
  for (const f of def.fields) slots.push({ slotType: 'field', ...f })
  for (const s of def.sections) slots.push({ slotType: 'section', ...s })
  for (const seed of def.openSeeds) slots.push({ slotType: 'open', text: seed })
  return slots
}

// Scalar defaults that mark a field as "still a placeholder" (vs. a real chosen value like
// lifecycle:active or a Decision's confidence:high).
const PLACEHOLDER_SCALARS = new Set(['', 'TBD', 'unverified'])

function isFieldUnfilled(value: unknown, slot: FieldSlot): boolean {
  if (slot.valueKind === 'scalar') {
    if (value === undefined || value === null || value === '') return true
    const def = slot.defaultValue as string
    return typeof value === 'string' && PLACEHOLDER_SCALARS.has(def) && value === def
  }
  return !Array.isArray(value) || value.length === 0
}

const HTML_COMMENT = /<!--[\s\S]*?-->/g

function isSectionEmpty(content: string): boolean {
  return content.replace(HTML_COMMENT, '').trim() === ''
}

function resolveKind(parsed: ParsedNode): SsotKind {
  const raw = parsed.frontmatter.kind
  if (typeof raw === 'string' && (SSOT_KINDS as readonly string[]).includes(raw)) {
    return raw as SsotKind
  }
  const id = parsed.frontmatter.id
  if (typeof id === 'string') {
    const prefix = id.split('.', 1)[0] ?? ''
    const fromPrefix = ID_PREFIX_TO_KIND[prefix]
    if (fromPrefix) return fromPrefix
  }
  throw new Error('getOpenSlots: cannot determine node kind from frontmatter kind or id prefix')
}

/**
 * The still-unfilled interview slots of a node: fields at their skeleton default, sections missing
 * or empty (after stripping HTML comments), and unchecked OPEN checkbox items.
 */
export function getOpenSlots(input: string | ParsedNode): InterviewSlot[] {
  const parsed = typeof input === 'string' ? parseNode(input) : input
  const kind = resolveKind(parsed)
  const def = getSkeleton(kind)
  const slots: InterviewSlot[] = []

  for (const f of def.fields) {
    if (isFieldUnfilled(parsed.frontmatter[f.field], f)) slots.push({ slotType: 'field', ...f })
  }

  const byHeading = new Map(parsed.sections.map((s) => [s.heading, s]))
  for (const s of def.sections) {
    const section = byHeading.get(s.heading)
    if (!section || isSectionEmpty(section.content)) {
      slots.push({ slotType: 'section', ...s })
    }
  }

  for (const item of parsed.openItems) {
    if (!item.checked) slots.push({ slotType: 'open', text: item.text })
  }

  return slots
}
