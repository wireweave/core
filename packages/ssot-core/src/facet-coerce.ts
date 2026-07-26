// Facet value coercion helpers — shared by catalog normalization and body frontmatter merge.

import type { Confidence, Lifecycle, ParseError, RelatesEdge } from './types.js'

export function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string')
  }
  if (typeof v === 'string' && v.trim() !== '') return [v]
  return []
}

export function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined
}

const CONFIDENCES: readonly Confidence[] = ['high', 'inferred', 'unverified']
const LIFECYCLES: readonly Lifecycle[] = ['planned', 'active', 'deprecated']

export function asConfidence(v: unknown): Confidence {
  return CONFIDENCES.includes(v as Confidence) ? (v as Confidence) : 'unverified'
}

export function asLifecycle(v: unknown): Lifecycle {
  // Legacy alias: pre-schema nodes used 'proposed' where the schema now says 'planned'.
  if (v === 'proposed') return 'planned'
  return LIFECYCLES.includes(v as Lifecycle) ? (v as Lifecycle) : 'active'
}

/** lastVerified: only 'YYYY-MM-DD' is valid; '0000-00-00'/empty/malformed → null. */
export function asLastVerified(v: unknown): string | null {
  if (typeof v !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  if (v === '0000-00-00') return null
  return v
}

// ── relatesTo string restoration ─────────────────────────────────

const RELATES_TO_KEY = /(?:^|,)\s*to\s*:/
const RELATES_TYPE_KEY = /,\s*type\s*:/
const RELATES_NOTE_KEY = /,\s*note\s*:/

/**
 * Restore a lossy catalog relatesTo string into a RelatesEdge.
 * Shape: '{ to: concept.agent, type: builds, note: free text (may contain commas/slashes) }'
 *
 * The note may contain commas, so a naive comma split fails — we cut on key positions instead.
 * Returns null if to/type is missing (the caller records a parseError).
 */
export function parseRelatesString(input: string): RelatesEdge | null {
  let s = input.trim()
  if (s.startsWith('{')) s = s.slice(1)
  if (s.endsWith('}')) s = s.slice(0, -1)
  s = s.trim()

  const toMatch = s.match(RELATES_TO_KEY)
  if (!toMatch || toMatch.index === undefined) return null
  const afterTo = s.slice(toMatch.index + toMatch[0].length)

  const typeRel = afterTo.search(RELATES_TYPE_KEY)
  if (typeRel === -1) return null
  const toVal = afterTo.slice(0, typeRel).trim()

  const afterType = afterTo.slice(typeRel).replace(RELATES_TYPE_KEY, '')
  const noteRel = afterType.search(RELATES_NOTE_KEY)
  const typeVal = (noteRel === -1 ? afterType : afterType.slice(0, noteRel)).trim()
  if (toVal === '' || typeVal === '') return null

  const edge: RelatesEdge = { to: toVal, type: typeVal }
  if (noteRel !== -1) {
    const noteVal = afterType.slice(noteRel).replace(RELATES_NOTE_KEY, '').trim()
    if (noteVal !== '') edge.note = noteVal
  }
  return edge
}

/** Restore a relatesTo value (array of mixed strings/objects) into RelatesEdge[]. */
export function normalizeRelatesToValue(
  v: unknown,
  nodeId: string,
  errors: ParseError[],
): RelatesEdge[] {
  if (!Array.isArray(v)) return []
  const out: RelatesEdge[] = []
  for (const item of v) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const rec = item as Record<string, unknown>
      const to = asString(rec.to)
      const type = asString(rec.type)
      if (to && type) {
        const edge: RelatesEdge = { to, type }
        const note = asString(rec.note)
        if (note) edge.note = note
        out.push(edge)
      } else {
        errors.push({
          kind: 'invalidRelatesTo',
          nodeId,
          message: 'relatesTo object is missing to/type',
          raw: JSON.stringify(item),
        })
      }
    } else if (typeof item === 'string') {
      const parsed = parseRelatesString(item)
      if (parsed) out.push(parsed)
      else {
        errors.push({
          kind: 'invalidRelatesTo',
          nodeId,
          message: 'failed to parse relatesTo string',
          raw: item,
        })
      }
    }
  }
  return out
}
