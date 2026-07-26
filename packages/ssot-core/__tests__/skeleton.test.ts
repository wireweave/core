import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  SSOT_KINDS,
  REQUIRED_FACETS_BY_KIND,
  REQUIRED_SECTIONS_BY_KIND,
  getSkeleton,
  renderSkeletonMarkdown,
  getInterviewSlots,
  getOpenSlots,
  parseNode,
  serializeNode,
  type SsotKind,
} from '../src/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string): string =>
  readFileSync(join(HERE, 'fixtures', `${name}.md.txt`), 'utf8')

const namedHeadings = (md: string): string[] =>
  parseNode(md)
    .sections.map((s) => s.heading)
    .filter((h) => h !== '')

describe('skeleton consistency with generated constants (A5-SLOTS)', () => {
  it.each(SSOT_KINDS)('%s: required facets ⊆ skeleton fields', (kind) => {
    const fields = new Set(getSkeleton(kind).fields.map((f) => f.field))
    for (const req of REQUIRED_FACETS_BY_KIND[kind]) {
      expect(fields.has(req)).toBe(true)
    }
  })

  it.each(SSOT_KINDS)('%s: required sections ⊆ skeleton sections', (kind) => {
    const headings = new Set(getSkeleton(kind).sections.map((s) => s.heading))
    for (const req of REQUIRED_SECTIONS_BY_KIND[kind] ?? []) {
      expect(headings.has(req)).toBe(true)
    }
  })
})

describe('renderSkeletonMarkdown round-trips through parseNode (A5-SLOTS)', () => {
  it.each(SSOT_KINDS)('%s: parse → serialize → parse is stable', (kind) => {
    const def = getSkeleton(kind)
    const md = renderSkeletonMarkdown(kind, { id: `${def.idPrefix}.example`, title: 'Example' })
    const first = parseNode(md)
    const second = parseNode(serializeNode({ frontmatter: first.frontmatter, body: first.body }))
    expect(second.frontmatter).toEqual(first.frontmatter)
    expect(second.sections).toEqual(first.sections)
    expect(second.openItems).toEqual(first.openItems)
  })

  it.each(SSOT_KINDS)('%s: rendered field set matches required facets ∪ meta', (kind) => {
    const def = getSkeleton(kind)
    const md = renderSkeletonMarkdown(kind, { id: `${def.idPrefix}.x`, title: 'X' })
    const keys = new Set(Object.keys(parseNode(md).frontmatter))
    expect(keys.has('id')).toBe(true)
    expect(keys.has('kind')).toBe(true)
    expect(keys.has('title')).toBe(true)
    for (const req of REQUIRED_FACETS_BY_KIND[kind]) expect(keys.has(req)).toBe(true)
  })
})

describe('rendered markdown ≡ original skeleton files (A5-SLOTS)', () => {
  const cases: { kind: SsotKind; fixtureName: string }[] = [
    { kind: 'Screen', fixtureName: 'skeleton-Screen' },
    { kind: 'Decision', fixtureName: 'skeleton-Decision' },
    { kind: 'Persona', fixtureName: 'skeleton-Persona' },
    { kind: 'Platform', fixtureName: 'skeleton-Platform' },
  ]

  it.each(cases)(
    '$kind: same frontmatter field set and section headings',
    ({ kind, fixtureName }) => {
      const original = fixture(fixtureName)
      const originalFm = parseNode(original).frontmatter
      const def = getSkeleton(kind)
      const rendered = renderSkeletonMarkdown(kind, {
        id: originalFm.id as string,
        title: originalFm.title as string,
      })
      const renderedFm = parseNode(rendered).frontmatter

      expect(new Set(Object.keys(renderedFm))).toEqual(new Set(Object.keys(originalFm)))
      expect(namedHeadings(rendered)).toEqual(namedHeadings(original))
      expect(def.idPrefix).toBe((originalFm.id as string).split('.')[0])
    },
  )
})

describe('interview slots (A5-SLOTS)', () => {
  it('getInterviewSlots returns every field, section, and open seed', () => {
    const def = getSkeleton('Persona')
    const slots = getInterviewSlots('Persona')
    expect(slots.filter((s) => s.slotType === 'field')).toHaveLength(def.fields.length)
    expect(slots.filter((s) => s.slotType === 'section')).toHaveLength(def.sections.length)
    expect(slots.filter((s) => s.slotType === 'open')).toHaveLength(def.openSeeds.length)
  })

  it('a freshly rendered skeleton leaves every placeholder slot open', () => {
    const md = renderSkeletonMarkdown('Persona', { id: 'persona.x', title: 'X' })
    const open = getOpenSlots(md)
    const fields = open.filter((s) => s.slotType === 'field')
    const sections = open.filter((s) => s.slotType === 'section')
    const opens = open.filter((s) => s.slotType === 'open')
    // lifecycle:active is a real value (not a placeholder) → the 5 placeholder fields remain.
    expect(fields.map((f) => (f.slotType === 'field' ? f.field : ''))).toEqual([
      'purpose',
      'definition',
      'owner',
      'confidence',
      'lastVerified',
    ])
    // The OPEN section has an (unchecked) checkbox so it is not empty; its item is an open slot.
    expect(sections).toHaveLength(2)
    expect(opens).toHaveLength(1)
  })

  it('a partially-filled node returns only its still-empty slots', () => {
    const partial = [
      '---',
      'id: persona.admin',
      'kind: Persona',
      'title: Admin',
      'purpose: manage the platform',
      'definition: an operator',
      'owner: team-x',
      'lifecycle: active',
      'confidence: inferred',
      'lastVerified: 2026-01-01',
      '---',
      '',
      '## 누구인가',
      '관리자입니다.',
      '',
      '## 무엇을 하려고 제품을 쓰나',
      '<!-- 주요 목표(job-to-be-done) -->',
      '',
      '## 미확정 (OPEN)',
      '- [x] OPEN: definition 확정 필요',
      '',
    ].join('\n')

    const open = getOpenSlots(partial)
    expect(open).toHaveLength(1)
    const only = open[0]
    expect(only?.slotType).toBe('section')
    expect(only?.slotType === 'section' ? only.heading : '').toBe('무엇을 하려고 제품을 쓰나')
  })

  it('resolves kind from the id prefix when frontmatter kind is absent', () => {
    const md = ['---', 'id: flow.checkout', 'title: Checkout', '---', '', '## 여정 목적', ''].join(
      '\n',
    )
    const open = getOpenSlots(md)
    // Flow required-ish fields still empty → purpose/servesPersona/relatesTo/impacts show up.
    expect(open.some((s) => s.slotType === 'field' && s.field === 'purpose')).toBe(true)
  })
})
