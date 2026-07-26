import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parseNode, serializeNode } from '../src/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string): string =>
  readFileSync(join(HERE, 'fixtures', `${name}.md.txt`), 'utf8')

// A2-ROUNDTRIP: parseNode → serializeNode → parseNode preserves frontmatter fields,
// body sections, and OPEN items with no semantic data loss.
describe('node-io round-trip (A2-ROUNDTRIP)', () => {
  const cases = ['screen', 'decision', 'platform', 'release-2-0']

  for (const name of cases) {
    it(`${name}: parse → serialize → parse is semantically identical`, () => {
      const md = fixture(name)
      const first = parseNode(md)
      const serialized = serializeNode({ frontmatter: first.frontmatter, body: first.body })
      const second = parseNode(serialized)

      // Frontmatter fields preserved (deep, order-independent).
      expect(second.frontmatter).toEqual(first.frontmatter)
      // Body preserved verbatim → sections + OPEN items preserved.
      expect(second.body).toBe(first.body)
      expect(second.sections).toEqual(first.sections)
      expect(second.openItems).toEqual(first.openItems)
    })
  }

  it('preserves the real node’s relatesTo objects, tags, quoted scalars, and OPEN items', () => {
    const md = fixture('release-2-0')
    const first = parseNode(md)
    const second = parseNode(serializeNode({ frontmatter: first.frontmatter, body: first.body }))

    // relatesTo is a block-mapping sequence of 6 {to,type,note} objects.
    const relatesTo = second.frontmatter.relatesTo as Array<Record<string, unknown>>
    expect(relatesTo).toHaveLength(6)
    expect(relatesTo[0]).toEqual({
      to: 'platform.wireweave',
      type: 'relates-to',
      note: '이 결정이 정의하는 제품의 차기 정식 버전',
    })
    // A note containing an arrow and spaces survives.
    expect((relatesTo[1] as Record<string, unknown>).note).toContain('→')

    // Flow-sequence tags survive.
    expect(second.frontmatter.tags).toEqual(['status:active', 'type:decision'])

    // Quoted scalars (with an inner single quote in definition) survive.
    expect(second.frontmatter.definition).toBe(first.frontmatter.definition)
    expect(second.frontmatter.definition).toContain("'AI 에이전트")

    // Empty flow sequence stays an empty array (not null).
    expect(second.frontmatter.supersedes).toEqual([])

    // All 4 OPEN items preserved.
    const openTexts = second.openItems.map((o) => o.text)
    expect(second.openItems).toHaveLength(4)
    expect(openTexts.some((t) => t.startsWith('OPEN: 가격 수치'))).toBe(true)

    // Body sections include the 3 required Decision sections.
    const headings = second.sections.map((s) => s.heading)
    expect(headings).toContain('맥락 (Context)')
    expect(headings).toContain('결정 (Decision)')
    expect(headings).toContain('근거와 결과 (Consequences)')
  })

  it('handles skeleton empty-string and empty-array fields', () => {
    const first = parseNode(fixture('screen'))
    const second = parseNode(serializeNode({ frontmatter: first.frontmatter, body: first.body }))
    expect(second.frontmatter.purpose).toBe('')
    expect(second.frontmatter.servesPersona).toEqual([])
    expect(second.frontmatter.lastVerified).toBe('')
    expect(second.frontmatter).toEqual(first.frontmatter)
  })
})
