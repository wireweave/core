// Node round-trip: parse a node markdown into frontmatter + body, and serialize it back.
//
// This is the semantic inverse of the frontmatter subset the parser supports (scalars, quoted
// strings, flow sequences, block mappings for relatesTo objects). Inline comments are not required
// to survive; field order is preserved from the frontmatter record. Round-tripping preserves all
// frontmatter fields, body sections, and OPEN items with no data loss (scenario A2-ROUNDTRIP).

import { parseNodeBody } from './body.js'
import type { MarkdownSection, OpenItem } from './types.js'

export interface ParsedNode {
  /** Frontmatter as a record (all fields preserved, including additionalProperties). */
  frontmatter: Record<string, unknown>
  /** The markdown body (everything after the frontmatter block), verbatim. */
  body: string
  /** Heading-scoped body sections. */
  sections: MarkdownSection[]
  /** '- [ ] OPEN:' / '- [x]' checkbox items. */
  openItems: OpenItem[]
}

/** Parse a node markdown document into its frontmatter record + body + derived views. */
export function parseNode(markdown: string): ParsedNode {
  const parsed = parseNodeBody(markdown)
  return {
    frontmatter: parsed.frontmatter,
    body: parsed.markdown,
    sections: parsed.sections,
    openItems: parsed.openItems,
  }
}

export interface SerializableNode {
  frontmatter: Record<string, unknown>
  body: string
}

/** Serialize a node back to markdown: `--- <frontmatter> ---` + the body verbatim. */
export function serializeNode(node: SerializableNode): string {
  return `---\n${serializeFrontmatter(node.frontmatter)}---\n${node.body}`
}

// ── frontmatter serialization ────────────────────────────────────

function serializeFrontmatter(fm: Record<string, unknown>): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(fm)) {
    serializeEntry(key, value, lines)
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : ''
}

function serializeEntry(key: string, value: unknown, lines: string[]): void {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${key}: []`)
      return
    }
    if (value.every(isPlainObject)) {
      // Block sequence of block mappings (e.g. relatesTo).
      lines.push(`${key}:`)
      for (const item of value) {
        serializeObjectItem(item, lines)
      }
      return
    }
    // Flow sequence of scalars.
    lines.push(`${key}: [${value.map(toFlow).join(', ')}]`)
    return
  }
  if (isPlainObject(value)) {
    // Nested block mapping (rare at the frontmatter top level).
    lines.push(`${key}:`)
    for (const [k, v] of Object.entries(value)) {
      lines.push(`  ${k}: ${toFlow(v)}`)
    }
    return
  }
  lines.push(`${key}: ${serializeScalar(value, 'block')}`)
}

function serializeObjectItem(obj: Record<string, unknown>, lines: string[]): void {
  const entries = Object.entries(obj)
  if (entries.length === 0) {
    lines.push('  - {}')
    return
  }
  entries.forEach(([k, v], idx) => {
    const prefix = idx === 0 ? '  - ' : '    '
    lines.push(`${prefix}${k}: ${toFlow(v)}`)
  })
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ── scalar quoting (mirrors the parser's accepted forms) ─────────

function serializeScalar(v: unknown, ctx: 'block' | 'flow'): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
  if (typeof v === 'string') {
    const needsQuote = ctx === 'flow' ? flowNeedsQuote(v) : blockNeedsQuote(v)
    return needsQuote ? quoteStr(v) : v
  }
  // Non-scalar values are handled by toFlow before reaching here; be defensive regardless.
  return quoteStr(JSON.stringify(v) ?? '')
}

/** Recursive flow rendering for arrays/objects/scalars (used inside flow sequences). */
function toFlow(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(toFlow).join(', ')}]`
  if (isPlainObject(v)) {
    const inner = Object.entries(v)
      .map(([k, val]) => `${k}: ${toFlow(val)}`)
      .join(', ')
    return `{ ${inner} }`
  }
  return serializeScalar(v, 'flow')
}

const RESERVED = new Set(['true', 'false', 'null', '~'])
const NUMERIC_RE = /^-?\d+$/
const FLOAT_RE = /^-?\d+\.\d+$/
// A leading char that YAML would treat specially if unquoted.
const SPECIAL_START_RE = /^[[\]{}"'>|*&!%@`#,?:-]/

function blockNeedsQuote(s: string): boolean {
  if (s === '') return true
  if (/\s/.test(s)) return true // any whitespace → quote (conventional + avoids ' #' comment cut)
  if (RESERVED.has(s)) return true
  if (NUMERIC_RE.test(s) || FLOAT_RE.test(s)) return true
  if (SPECIAL_START_RE.test(s)) return true
  return false
}

function flowNeedsQuote(s: string): boolean {
  return blockNeedsQuote(s) || /[,[\]{}]/.test(s)
}

function quoteStr(s: string): string {
  // The parser has no escape handling: pick the quote char that is not present in the string.
  if (s.includes('"') && !s.includes("'")) return `'${s}'`
  return `"${s}"`
}
