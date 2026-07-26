import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  SSOT_KINDS,
  ID_PREFIX_TO_KIND,
  EDGE_RELS,
  EDGE_TYPES,
  EDGE_TYPE_NORMALIZATION,
  TAG_NAMESPACES,
  REQUIRED_FACETS_BY_KIND,
  REQUIRED_SECTIONS_BY_KIND,
} from '../src/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCHEMA_PATH = join(HERE, '..', 'src', 'schema', 'ssot-v1.schema.json')
const CONSTANTS_PATH = join(HERE, '..', 'src', 'generated', 'constants.ts')

// Independent oracle: re-derive the values straight from the schema JSON (segregation of duties —
// this test is not the generator). If the schema changes and constants are not regenerated, the
// exported constants diverge from this oracle and the test fails — proving there is no hand-sync
// point between schema and constants (scenario A1-SCHEMA).
const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'))

function omitComment(obj: Record<string, unknown>): Record<string, unknown> {
  const { _comment, ...rest } = obj
  void _comment
  return rest
}

describe('generated constants ⇄ schema (A1-SCHEMA)', () => {
  it('SSOT_KINDS equals the schema kind enum (12 kinds, no EngineeringRule)', () => {
    expect(SSOT_KINDS).toEqual(schema.properties.kind.enum)
    expect(SSOT_KINDS).toHaveLength(12)
    expect(SSOT_KINDS).not.toContain('EngineeringRule')
  })

  it('ID_PREFIX_TO_KIND equals x-id-prefix-to-kind (no rule prefix)', () => {
    expect(ID_PREFIX_TO_KIND).toEqual(omitComment(schema['x-id-prefix-to-kind']))
    expect(ID_PREFIX_TO_KIND).not.toHaveProperty('rule')
  })

  it('EDGE_RELS equals idList ∪ objectList from x-id-reference-fields', () => {
    const ref = schema['x-id-reference-fields']
    expect(EDGE_RELS).toEqual([...ref.idList, ...ref.objectList])
  })

  it('EDGE_TYPES equals the keys of x-edge-types', () => {
    expect(EDGE_TYPES).toEqual(Object.keys(omitComment(schema['x-edge-types'])))
  })

  it('EDGE_TYPE_NORMALIZATION equals x-edge-type-normalization', () => {
    expect(EDGE_TYPE_NORMALIZATION).toEqual(omitComment(schema['x-edge-type-normalization']))
  })

  it('TAG_NAMESPACES equals the keys of x-tags.namespaces', () => {
    expect(TAG_NAMESPACES).toEqual(Object.keys(schema['x-tags'].namespaces))
  })

  it('REQUIRED_FACETS_BY_KIND equals x-required-facets-by-kind (no EngineeringRule)', () => {
    expect(REQUIRED_FACETS_BY_KIND).toEqual(omitComment(schema['x-required-facets-by-kind']))
    expect(REQUIRED_FACETS_BY_KIND).not.toHaveProperty('EngineeringRule')
  })

  it('REQUIRED_SECTIONS_BY_KIND equals x-required-sections-by-kind', () => {
    expect(REQUIRED_SECTIONS_BY_KIND).toEqual(omitComment(schema['x-required-sections-by-kind']))
  })

  it('the generated file carries the do-not-edit banner', () => {
    const content = readFileSync(CONSTANTS_PATH, 'utf8')
    expect(content).toContain('GENERATED — do not edit')
    expect(content).toContain('src/schema/ssot-v1.schema.json')
  })
})
