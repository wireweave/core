/**
 * `repeat N { … }` — parsing, expansion, printing, and the boundaries.
 *
 * The feature is one idea in three places, and each place can break without the
 * others noticing: the parser has to keep the count (or the printer cannot write
 * it back), the expansion has to produce distinct objects (or the anchor index
 * silently loses copies), and the printer has to emit the fold rather than the
 * folded-out tree (or the round-trip law fails). The tests are grouped that way.
 */

import { describe, expect, it } from 'vitest'
import { parse } from '../src/parser'
import { printWireframe } from '../src/printer'
import { render } from '../src/renderer'
import { validate } from '../src/validation'
import { expandRepeats, REPEAT_EXPANSION_BUDGET, RepeatBudgetError } from '../src/ast'
import { buildAnchorPathMap } from '../src/ast/anchor-path'
import type { AnyNode, RepeatNode, WireframeDocument } from '../src/ast'

/** The page's children, after whatever transformation the test is about. */
function pageChildren(doc: WireframeDocument): AnyNode[] {
  const page = doc.children.find((child) => child.type === 'Page')
  if (page === undefined) throw new Error('no page in document')
  return (page as { children: AnyNode[] }).children
}

/** Every node in a document, pre-order, excluding the document itself. */
function allNodes(doc: WireframeDocument): AnyNode[] {
  const out: AnyNode[] = []
  const visit = (node: AnyNode): void => {
    out.push(node)
    const children = (node as { children?: unknown }).children
    if (Array.isArray(children)) for (const child of children as AnyNode[]) visit(child)
  }
  for (const child of doc.children) visit(child)
  return out
}

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

describe('repeat — parsing', () => {
  it('parses a count and a body, keeping the fold in the AST', () => {
    const doc = parse('page "P" {\n  row { repeat 6 { text "card" } }\n}')
    const row = pageChildren(doc)[0] as { type: string; children: AnyNode[] }
    expect(row.type).toBe('Row')
    expect(row.children).toHaveLength(1)

    const repeat = row.children[0] as RepeatNode
    expect(repeat.type).toBe('Repeat')
    expect(repeat.count).toBe(6)
    // The body is stored once, not six times — that is the whole point.
    expect(repeat.children).toHaveLength(1)
    expect(repeat.children[0].type).toBe('Text')
  })

  it('carries a source location like any other node', () => {
    const doc = parse('page "P" {\n  repeat 2 { text "x" }\n}')
    const repeat = pageChildren(doc)[0] as RepeatNode
    expect(repeat.loc?.start.offset).toBeGreaterThan(0)
    expect(repeat.loc?.end.offset).toBeGreaterThan(repeat.loc?.start.offset ?? 0)
  })

  it('is a child keyword, so `repeat` is not read as an attribute name', () => {
    // Were "repeat" missing from ChildKeyword, this would parse as an attribute
    // named `repeat` on the row and the body would be a syntax error.
    const doc = parse('page "P" {\n  row { repeat 3 { text "x" } }\n}')
    const row = pageChildren(doc)[0] as unknown as Record<string, unknown>
    expect(row.repeat).toBeUndefined()
  })

  it('validates clean — `count` is positional, not an unknown attribute', () => {
    const doc = parse('page "P" {\n  repeat 3 { text "x" }\n}')
    const result = validate(doc)
    expect(result.errors.filter((issue) => /count/i.test(issue.message))).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('rejects a negative count at the grammar level', () => {
    expect(() => parse('page "P" {\n  repeat -1 { text "x" }\n}')).toThrow()
  })

  it('rejects a fractional count at the grammar level', () => {
    expect(() => parse('page "P" {\n  repeat 2.5 { text "x" }\n}')).toThrow()
  })

  it('rejects a missing count', () => {
    expect(() => parse('page "P" {\n  repeat { text "x" }\n}')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// expansion
// ---------------------------------------------------------------------------

describe('repeat — expansion', () => {
  it('produces one copy of the body per count', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 6 { text "card" } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(row.children).toHaveLength(6)
    expect(row.children.every((child) => child.type === 'Text')).toBe(true)
  })

  it('leaves no Repeat node behind', () => {
    const doc = expandRepeats(parse('page "P" {\n  repeat 4 { text "x" }\n}'))
    expect(allNodes(doc).filter((node) => node.type === 'Repeat')).toEqual([])
  })

  it('expands a multi-node body as a unit, in order', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 3 { text "a" button "b" } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(row.children.map((child) => child.type)).toEqual([
      'Text',
      'Button',
      'Text',
      'Button',
      'Text',
      'Button',
    ])
  })

  it('gives every copy a distinct object identity', () => {
    // The anchor map is keyed by identity, so shared references would collapse
    // six copies into one entry and five would render without a path.
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 6 { text "card" } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(new Set(row.children).size).toBe(6)
  })

  it('does not mutate the document it is given', () => {
    const original = parse('page "P" {\n  row { repeat 5 { text "x" } }\n}')
    expandRepeats(original)
    const row = pageChildren(original)[0] as { children: AnyNode[] }
    expect(row.children).toHaveLength(1)
    expect(row.children[0].type).toBe('Repeat')
  })

  it('returns a document with no repeat unchanged, identity included', () => {
    const doc = parse('page "P" {\n  text "x"\n}')
    expect(expandRepeats(doc)).toBe(doc)
  })

  it('is idempotent', () => {
    const once = expandRepeats(parse('page "P" {\n  repeat 3 { text "x" }\n}'))
    expect(expandRepeats(once)).toBe(once)
  })

  it('shares every copy the loc of the body they came from', () => {
    // Six copies really do come from one span of source; pointing all six back
    // at it is accurate, and uniqueness comes from the anchor path instead.
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 3 { text "card" } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    const offsets = row.children.map((child) => child.loc?.start.offset)
    expect(new Set(offsets).size).toBe(1)
    expect(offsets[0]).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// boundaries
// ---------------------------------------------------------------------------

describe('repeat — boundaries', () => {
  it('repeat 0 draws nothing', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 0 { text "x" } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(row.children).toEqual([])
  })

  it('repeat 0 parses and validates rather than erroring', () => {
    const doc = parse('page "P" {\n  repeat 0 { text "x" }\n}')
    expect((pageChildren(doc)[0] as RepeatNode).count).toBe(0)
    expect(validate(doc).errors).toEqual([])
  })

  it('repeat 1 is simply one copy', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 1 { text "x" } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(row.children).toHaveLength(1)
    expect(row.children[0].type).toBe('Text')
  })

  it('accepts an empty body', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 3 {} }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(row.children).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// nesting
// ---------------------------------------------------------------------------

describe('repeat — nesting', () => {
  it('multiplies', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 3 { repeat 4 { text "x" } } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(row.children).toHaveLength(12)
    expect(row.children.every((child) => child.type === 'Text')).toBe(true)
  })

  it('keeps every copy distinct through nesting', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 3 { repeat 4 { text "x" } } }\n}'))
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    expect(new Set(row.children).size).toBe(12)
  })

  it('expands a repeat nested inside an ordinary container', () => {
    const doc = expandRepeats(
      parse('page "P" {\n  repeat 2 { card "C" { repeat 3 { text "x" } } }\n}'),
    )
    const cards = pageChildren(doc)
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      expect(card.type).toBe('Card')
      expect((card as { children: AnyNode[] }).children).toHaveLength(3)
    }
    // The two cards are separate objects, not one card referenced twice.
    expect(cards[0]).not.toBe(cards[1])
    expect((cards[0] as { children: AnyNode[] }).children[0]).not.toBe(
      (cards[1] as { children: AnyNode[] }).children[0],
    )
  })
})

// ---------------------------------------------------------------------------
// budget
// ---------------------------------------------------------------------------

describe('repeat — expansion budget', () => {
  it('refuses an expansion past the budget', () => {
    // Nesting multiplies, so the outermost count says nothing about the total.
    const source = `page "P" {\n  repeat 40 { repeat 40 { text "x" } }\n}`
    expect(() => expandRepeats(parse(source))).toThrow(RepeatBudgetError)
  })

  it('names the budget in the message so the cause is actionable', () => {
    const source = `page "P" {\n  repeat 40 { repeat 40 { text "x" } }\n}`
    expect(() => expandRepeats(parse(source))).toThrow(String(REPEAT_EXPANSION_BUDGET))
  })

  it('allows an expansion inside the budget', () => {
    const source = `page "P" {\n  row { repeat 100 { text "x" } }\n}`
    const row = pageChildren(expandRepeats(parse(source)))[0] as { children: AnyNode[] }
    expect(row.children).toHaveLength(100)
  })
})

// ---------------------------------------------------------------------------
// printing / round-trip
// ---------------------------------------------------------------------------

describe('repeat — printing', () => {
  it('prints the fold, not the expansion', () => {
    const printed = printWireframe(parse('page "P" {\n  row { repeat 6 { text "card" } }\n}'))
    expect(printed).toContain('repeat 6 {')
    // Six bodies in the output would mean the fold was lost.
    expect(printed.match(/text "card"/g)).toHaveLength(1)
  })

  it('round-trips: parse(print(parse(src))) equals parse(src)', () => {
    const source = 'page "P" {\n  row gap=4 {\n    repeat 6 {\n      text "card"\n    }\n  }\n}\n'
    const once = parse(source)
    const twice = parse(printWireframe(once))
    expect(JSON.stringify(twice, (key, value) => (key === 'loc' ? undefined : value))).toBe(
      JSON.stringify(once, (key, value) => (key === 'loc' ? undefined : value)),
    )
  })

  it('round-trips a nested repeat', () => {
    const once = parse('page "P" {\n  repeat 2 { card "C" { repeat 3 { text "x" } } }\n}')
    const twice = parse(printWireframe(once))
    expect(JSON.stringify(twice, (key, value) => (key === 'loc' ? undefined : value))).toBe(
      JSON.stringify(once, (key, value) => (key === 'loc' ? undefined : value)),
    )
  })

  it('round-trips repeat 0 and repeat 1', () => {
    for (const count of [0, 1]) {
      const once = parse(`page "P" {\n  repeat ${count} { text "x" }\n}`)
      const printed = printWireframe(once)
      expect(printed).toContain(`repeat ${count} `)
      expect(JSON.stringify(parse(printed), (k, v) => (k === 'loc' ? undefined : v))).toBe(
        JSON.stringify(once, (k, v) => (k === 'loc' ? undefined : v)),
      )
    }
  })
})

// ---------------------------------------------------------------------------
// rendering and anchors
// ---------------------------------------------------------------------------

describe('repeat — rendering', () => {
  it('renders one copy per count through the ordinary render path', () => {
    const { html } = render(parse('page "P" {\n  row { repeat 6 { text "card" } }\n}'))
    expect(html.match(/card/g)).toHaveLength(6)
  })

  it('renders nothing for repeat 0', () => {
    const { html } = render(parse('page "P" {\n  row { repeat 0 { text "card" } }\n}'))
    expect(html).not.toContain('card')
  })

  it('emits no markup for the repeat node itself', () => {
    const { html } = render(parse('page "P" {\n  repeat 2 { text "x" }\n}'))
    expect(html).not.toContain('wf-repeat')
    expect(html).not.toContain('Unknown node type')
  })

  it('gives every copy its own anchor path', () => {
    const doc = expandRepeats(parse('page "P" {\n  row { repeat 6 { text "card" } }\n}'))
    const map = buildAnchorPathMap(doc)
    const row = pageChildren(doc)[0] as { children: AnyNode[] }
    const paths = row.children.map((child) => map.get(child))
    expect(paths).toHaveLength(6)
    expect(paths.every((path) => path !== undefined)).toBe(true)
    // Distinct positions — this is what makes the copies addressable apart.
    expect(new Set(paths).size).toBe(6)
  })

  it('anchors every copy in the rendered HTML', () => {
    const { html } = render(parse('page "P" {\n  row { repeat 6 { text "card" } }\n}'), {
      sourceAnchors: true,
    })
    const anchored = html.match(/data-wf-path="[^"]*"/g) ?? []
    const unique = new Set(anchored)
    // Every anchor emitted is unique; a collapsed identity would repeat one.
    expect(unique.size).toBe(anchored.length)
    expect(html.match(/card/g)).toHaveLength(6)
  })
})
