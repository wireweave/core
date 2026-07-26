// Structured skeleton model — the single source from which BOTH the markdown skeleton and the
// structured interview slots derive (the ssot-studio originals kept the .md files as source and
// re-parsed them; here the TS definition is authoritative and the markdown is rendered from it).

import type { SsotKind } from '../types.js'

export type SkeletonAxis = 1 | 2 | 3 | 4

/**
 * How a frontmatter field is shaped:
 * - scalar: a single value (purpose, definition, owner, lifecycle, …)
 * - id-list: a flow sequence of node ids (servesPersona, realizedBy, …)
 * - relates-list: the relatesTo object list ([{ to, type, note? }])
 * - path-list: implementedIn provenance paths
 */
export type FieldValueKind = 'scalar' | 'id-list' | 'relates-list' | 'path-list'

/** A frontmatter field slot — an interview question hint bound to one axis. */
export interface FieldSlot {
  field: string
  axis: SkeletonAxis
  /** Verbatim Korean hint (the interview question hint). */
  hint: string
  valueKind: FieldValueKind
  /** Target node-kind prefix hint for id references (e.g. 'persona' for servesPersona). */
  refKindHint?: string
  /** The skeleton placeholder default ('' / 'TBD' / 'unverified' / [] / …). */
  defaultValue: string | readonly string[]
}

/** A body section slot — a heading with its HTML-comment authoring prompt. */
export interface SectionSlot {
  heading: string
  prompt: string
}

/** The full structured skeleton for one kind. */
export interface SkeletonDef {
  kind: SsotKind
  /** id prefix (lowercase) — e.g. 'component' for SystemComponent. */
  idPrefix: string
  fields: FieldSlot[]
  sections: SectionSlot[]
  /** Seed '- [ ] OPEN: …' checkbox texts (the text after '- [ ] '). */
  openSeeds: string[]
}

/** A unified interview slot — the shape consumers iterate for structured interviews. */
export type InterviewSlot =
  | (FieldSlot & { slotType: 'field' })
  | (SectionSlot & { slotType: 'section' })
  | { slotType: 'open'; text: string }
