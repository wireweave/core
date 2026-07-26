#!/usr/bin/env node
// generate-constants.mjs — derive src/generated/constants.ts from src/schema/ssot-v1.schema.json.
//
// The schema is the single source of truth for kinds, id prefixes, edge relations, edge types,
// tag namespaces, and the per-kind required facets/sections. This script reads the schema's
// enum + x-* blocks and emits committed TypeScript constants with `as const` + derived union
// types. There is no hand-maintained duplicate to keep in sync (scenario A1-SCHEMA).
//
// Zero dependencies (node stdlib only). Output is prettier-conformant so re-running is idempotent.
//   pnpm build:schema   # regenerate
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const SCHEMA_PATH = join(HERE, '..', 'src', 'schema', 'ssot-v1.schema.json')
const OUT_PATH = join(HERE, '..', 'src', 'generated', 'constants.ts')

const PRINT_WIDTH = 100

export function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'))
}

function stripComment(obj) {
  const { _comment, ...rest } = obj
  void _comment
  return rest
}

/** Extract the derived data (also used by the sync test as the schema-side oracle). */
export function deriveConstants(schema) {
  const ref = schema['x-id-reference-fields']
  return {
    kinds: schema.properties.kind.enum,
    idPrefixToKind: stripComment(schema['x-id-prefix-to-kind']),
    edgeRels: [...ref.idList, ...ref.objectList],
    edgeTypes: Object.keys(stripComment(schema['x-edge-types'])),
    edgeTypeNormalization: stripComment(schema['x-edge-type-normalization']),
    tagNamespaces: Object.keys(schema['x-tags'].namespaces),
    requiredFacetsByKind: stripComment(schema['x-required-facets-by-kind']),
    requiredSectionsByKind: stripComment(schema['x-required-sections-by-kind']),
  }
}

// ── prettier-conformant emitters ─────────────────────────────────
const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

// Prettier measures line length by display width: East Asian wide characters
// (Hangul, CJK, kana, fullwidth) count as 2 columns. Match that so the
// single-line/multiline break decision is byte-identical to prettier.
function isWide(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    (cp >= 0x2e80 && cp <= 0x303e) || // CJK radicals / Kangxi
    (cp >= 0x3041 && cp <= 0x33ff) || // Hiragana, Katakana, CJK symbols
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Ext A
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified
    (cp >= 0xa960 && cp <= 0xa97f) || // Hangul Jamo Ext A
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul Syllables
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility
    (cp >= 0xfe30 && cp <= 0xfe4f) || // CJK Compatibility Forms
    (cp >= 0xff00 && cp <= 0xff60) || // Fullwidth Forms
    (cp >= 0xffe0 && cp <= 0xffe6)
  )
}

function displayWidth(str) {
  let w = 0
  for (const ch of str) {
    const cp = ch.codePointAt(0)
    w += isWide(cp) ? 2 : 1
  }
  return w
}

function quote(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function key(k) {
  return IDENT_RE.test(k) ? k : quote(k)
}

/**
 * Render a string array, single line if `prefixWidth + array + suffixWidth` fits `PRINT_WIDTH`,
 * else one item per line with a trailing comma. Widths are display columns (CJK-aware).
 */
function stringArray(items, prefixWidth, suffixWidth, indent) {
  const inline = `[${items.map(quote).join(', ')}]`
  if (prefixWidth + displayWidth(inline) + suffixWidth <= PRINT_WIDTH) return inline
  const pad = ' '.repeat(indent + 2)
  const body = items.map((it) => `${pad}${quote(it)},`).join('\n')
  return `[\n${body}\n${' '.repeat(indent)}]`
}

function emitStringArrayConst(name, items) {
  const prefix = `export const ${name} = `
  const suffix = ' as const'
  const value = stringArray(items, prefix.length, suffix.length, 0)
  return `${prefix}${value}${suffix}\n`
}

// Maps are emitted with an explicit type annotation (not `as const`) so consumers can index
// them by an arbitrary string key (e.g. ID_PREFIX_TO_KIND[prefix]) under the repo's strict
// tsconfig (noUncheckedIndexedAccess then yields `T | undefined`, which callers guard).

/** Emit `export const NAME: TYPE = { key: 'value', ... }`. */
function emitStringMapConst(name, obj, typeAnnotation) {
  const lines = [`export const ${name}: ${typeAnnotation} = {`]
  for (const [k, v] of Object.entries(obj)) {
    lines.push(`  ${key(k)}: ${quote(v)},`)
  }
  lines.push('}')
  return lines.join('\n') + '\n'
}

/** Emit `export const NAME: TYPE = { Kind: [...], ... }` with array values. */
function emitArrayMapConst(name, obj, typeAnnotation) {
  const lines = [`export const ${name}: ${typeAnnotation} = {`]
  for (const [k, arr] of Object.entries(obj)) {
    const keyStr = `  ${key(k)}: `
    const value = stringArray(arr, keyStr.length, 1, 2)
    lines.push(`${keyStr}${value},`)
  }
  lines.push('}')
  return lines.join('\n') + '\n'
}

export function generateConstants(schema) {
  const d = deriveConstants(schema)
  const out = []
  out.push('// ─────────────────────────────────────────────────────────────────────')
  out.push('// GENERATED — do not edit. Source: src/schema/ssot-v1.schema.json')
  out.push('// Regenerate with `pnpm build:schema` (scripts/generate-constants.mjs).')
  out.push('// The schema is the single source of truth for all values below.')
  out.push('// ─────────────────────────────────────────────────────────────────────')
  out.push('')
  out.push('/** SSOT node kinds (frontmatter `kind` enum). */')
  out.push(emitStringArrayConst('SSOT_KINDS', d.kinds).trimEnd())
  out.push('export type SsotKind = (typeof SSOT_KINDS)[number]')
  out.push('')
  out.push('/** id prefix (lowercase) → kind. Derived from the schema id pattern + kind enum. */')
  out.push(
    emitStringMapConst('ID_PREFIX_TO_KIND', d.idPrefixToKind, 'Record<string, SsotKind>').trimEnd(),
  )
  out.push('')
  out.push('/** Normalized edge relations (id-reference fields ∪ object-list fields). */')
  out.push(emitStringArrayConst('EDGE_RELS', d.edgeRels).trimEnd())
  out.push('export type EdgeRel = (typeof EDGE_RELS)[number]')
  out.push('')
  out.push('/** Controlled vocabulary of standard relatesTo[].type edge types. */')
  out.push(emitStringArrayConst('EDGE_TYPES', d.edgeTypes).trimEnd())
  out.push('export type EdgeType = (typeof EDGE_TYPES)[number]')
  out.push('')
  out.push('/** Alias → standard edge type normalization map. */')
  out.push(
    emitStringMapConst(
      'EDGE_TYPE_NORMALIZATION',
      d.edgeTypeNormalization,
      'Record<string, string>',
    ).trimEnd(),
  )
  out.push('')
  out.push('/** Allowed tag namespaces ("namespace:value"). */')
  out.push(emitStringArrayConst('TAG_NAMESPACES', d.tagNamespaces).trimEnd())
  out.push('export type TagNamespace = (typeof TAG_NAMESPACES)[number]')
  out.push('')
  out.push('/** Fields that must be filled per kind for facet completeness. */')
  out.push(
    emitArrayMapConst(
      'REQUIRED_FACETS_BY_KIND',
      d.requiredFacetsByKind,
      'Record<SsotKind, readonly string[]>',
    ).trimEnd(),
  )
  out.push('')
  out.push('/** Standard body (## heading) sections per kind. */')
  out.push(
    emitArrayMapConst(
      'REQUIRED_SECTIONS_BY_KIND',
      d.requiredSectionsByKind,
      'Partial<Record<SsotKind, readonly string[]>>',
    ).trimEnd(),
  )
  out.push('')
  return out.join('\n')
}

function main() {
  const schema = loadSchema()
  const content = generateConstants(schema)
  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, content)
  console.error(`generated ${OUT_PATH} (${content.split('\n').length} lines)`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
