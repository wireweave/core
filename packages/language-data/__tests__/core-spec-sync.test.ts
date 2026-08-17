/**
 * Editor data must never drift from the DSL spec.
 *
 * `@wireweave/core/spec` derives the element set from the grammar; this package
 * only layers editor metadata on it. These tests fail if a component list here
 * ever stops matching core — the failure mode this consolidation removes.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'
import { ATTRIBUTE_SPECS, COMPONENT_SPECS, GRAMMAR_ELEMENTS } from '@wireweave/core/spec'
import { ALL_COMPONENTS, COMPONENT_MAP } from '../src/components.js'
import { ATTRIBUTES, ATTRIBUTE_MAP, VALID_ATTRIBUTE_NAMES } from '../src/attributes.js'
import { EDITOR_ONLY_ATTRIBUTES, PENDING_CORE_ATTRIBUTES } from '../src/core-spec-gaps.js'
import { VALUE_KEYWORDS } from '../src/keywords.js'
import { createTokenizer } from '../src/codemirror/language.js'
import { getComponentNames } from '../src/utils.js'

describe('core spec sync', () => {
  it('exposes exactly the grammar element set', () => {
    expect(ALL_COMPONENTS.map((comp) => comp.name).sort()).toEqual(
      Object.keys(GRAMMAR_ELEMENTS).sort(),
    )
  })

  it('autocomplete names match the grammar element set', () => {
    expect(getComponentNames().sort()).toEqual(Object.keys(GRAMMAR_ELEMENTS).sort())
  })

  it('reuses the core spec metadata verbatim', () => {
    for (const spec of COMPONENT_SPECS) {
      const comp = COMPONENT_MAP.get(spec.name)
      expect(comp).toBeDefined()
      expect(comp!.nodeType).toBe(spec.nodeType)
      expect(comp!.category).toBe(spec.category)
      expect(comp!.hasChildren).toBe(spec.hasChildren)
      expect(comp!.description).toBe(spec.description)
      // Editor attributes are the spec's, plus editor-only extras (e.g. `at`).
      expect(comp!.attributes).toEqual(expect.arrayContaining([...spec.attributes]))
    }
  })

  it('adds editor-only metadata on top of the spec', () => {
    for (const comp of ALL_COMPONENTS) {
      expect(comp.example).toBeTruthy()
    }
  })
})

/**
 * A minimal `StringStream` stand-in: the CodeMirror tokenizer only calls these
 * four methods, and the real class lives behind an optional peer dependency.
 */
class FakeStream {
  private pos = 0
  constructor(private readonly line: string) {}
  eatSpace(): boolean {
    const start = this.pos
    while (/\s/.test(this.line[this.pos] ?? '')) this.pos++
    return this.pos > start
  }
  match(pattern: string | RegExp): boolean | RegExpMatchArray | null {
    if (typeof pattern === 'string') {
      if (!this.line.startsWith(pattern, this.pos)) return false
      this.pos += pattern.length
      return true
    }
    const found = pattern.exec(this.line.slice(this.pos))
    if (!found || found.index !== 0) return null
    this.pos += found[0].length
    return found
  }
  skipToEnd(): void {
    this.pos = this.line.length
  }
  next(): string | void {
    return this.line[this.pos++]
  }
}

function firstToken(text: string): string | null {
  const { token } = createTokenizer()
  return token(new FakeStream(text) as unknown as Parameters<typeof token>[0])
}

/**
 * Source spellings the grammar rewrites into a different AST key, as
 * `[what the author writes, what the node carries]`.
 *
 * Each pair is one attribute wearing two names, so core declares the AST key and
 * `EDITOR_ONLY_ATTRIBUTES` declares the source spelling. Their value spaces are
 * the same space; the entry reads it out of core instead of repeating it, and
 * this list is what lets the test check the read still resolves.
 */
const DESUGARED_SPELLINGS: readonly (readonly [source: string, astKey: string])[] = [
  ['type', 'inputType'],
]

describe('attribute spec sync', () => {
  it('reuses the core attribute registry verbatim', () => {
    for (const spec of ATTRIBUTE_SPECS) {
      const attr = ATTRIBUTE_MAP.get(spec.name)
      expect(attr, `attribute "${spec.name}" is missing from the editor vocabulary`).toBeDefined()
      expect(attr!.type).toBe(spec.type)
      expect(attr!.description).toBe(spec.description)
      expect(attr!.values).toEqual(spec.values ? [...spec.values] : undefined)
    }
  })

  it('offers nothing beyond the spec and the documented gaps', () => {
    const allowed = new Set([
      ...ATTRIBUTE_SPECS.map((spec) => spec.name),
      ...EDITOR_ONLY_ATTRIBUTES.map((attr) => attr.name),
      ...PENDING_CORE_ATTRIBUTES.map((attr) => attr.name),
    ])
    expect(ATTRIBUTES.filter((attr) => !allowed.has(attr.name))).toEqual([])
  })

  it('keeps the gap lists disjoint from the spec, so they can only shrink', () => {
    const specNames = new Set(ATTRIBUTE_SPECS.map((spec) => spec.name))
    const adopted = [...PENDING_CORE_ATTRIBUTES, ...EDITOR_ONLY_ATTRIBUTES]
      .map((attr) => attr.name)
      .filter((name) => specNames.has(name))
    expect(
      adopted,
      'the core spec now declares these — delete them from core-spec-gaps.ts',
    ).toEqual([])
  })

  it('covers every attribute the component specs reference', () => {
    const referenced = [...new Set(COMPONENT_SPECS.flatMap((spec) => [...spec.attributes]))]
    expect(referenced.filter((name) => !VALID_ATTRIBUTE_NAMES.has(name))).toEqual([])
  })

  it('gives every attribute a distinct name', () => {
    const names = ATTRIBUTES.map((attr) => attr.name)
    expect(names.filter((name, i) => names.indexOf(name) !== i)).toEqual([])
  })

  it('derives value keywords from what attributes actually accept', () => {
    // `VALUE_KEYWORDS` is built from the core registry; this expectation is
    // built from what the editors actually offer. A value reachable in an
    // editor but absent here would go unhighlighted, which is what makes the
    // comparison worth running — the two sides must stay separate expressions.
    const expected = new Set(['true', 'false', ...ATTRIBUTES.flatMap((attr) => attr.values ?? [])])
    expect([...VALUE_KEYWORDS].sort()).toEqual([...expected].sort())
  })

  it('gives a desugared spelling the same value space as the key it becomes', () => {
    for (const [source, astKey] of DESUGARED_SPELLINGS) {
      const spelling = EDITOR_ONLY_ATTRIBUTES.find((attr) => attr.name === source)
      expect(spelling, `"${source}" is no longer an editor-only attribute`).toBeDefined()

      const spec = ATTRIBUTE_SPECS.find((candidate) => candidate.name === astKey)
      expect(
        spec,
        `core no longer declares "${astKey}"; "${source}" reads its values from it and now offers none`,
      ).toBeDefined()

      expect(
        spelling!.values,
        `"${source}" and "${astKey}" are one attribute under two spellings, so they must offer one value space`,
      ).toEqual(spec!.values ? [...spec!.values] : undefined)
      expect(
        spelling!.values?.length ?? 0,
        `"${astKey}" declares no values, so "${source}" completes nothing`,
      ).toBeGreaterThan(0)
    }
  })

  it('tokenizes value keywords through the shared list, not a local copy', () => {
    // `baseline` and `blue` exist only in the derived list; a stale local copy
    // in the tokenizer would leave them unhighlighted.
    expect(firstToken('baseline')).toBe('atom')
    expect(firstToken('blue')).toBe('atom')
    // `extrabold` is not a value of any attribute — no source can produce it.
    expect(firstToken('extrabold')).toBeNull()
  })
})

/**
 * Which element accepts which attribute, checked against the AST types.
 *
 * `ComponentSpec.attributes` is the spec's answer to "may this element carry
 * this attribute". `validate()` reads exactly that set, and this package turns
 * it into per-element autocomplete, so a wrong answer is wrong in three places
 * at once.
 *
 * For the interaction attributes the AST types are the authority: a node either
 * extends `InteractiveProps` or it does not, and the renderer emits `data-*`
 * only for those that do. When the spec disagrees, an author can write the
 * attribute, pass validation, and have the value silently dropped at render —
 * so the two must be asserted equal rather than maintained in parallel.
 *
 * Read from source because TypeScript `extends` clauses are erased at runtime;
 * there is no value to import. Making that set machine-readable in core would
 * let this test drop the parsing.
 */
const AST_TYPES_SOURCE = readFileSync(
  fileURLToPath(new URL('../../core/src/ast/types.ts', import.meta.url)),
  'utf8',
)

/** Field names declared on `InteractiveProps` — the interaction attributes. */
function interactionAttributeNames(): string[] {
  // The `extends` clause is optional in the pattern on purpose: `InteractiveProps`
  // gained `extends GuardedOutcomeProps`, and a pattern that only matched the
  // bare form silently read zero fields — the vacuous-gate shape this file's own
  // `toBeGreaterThan(0)` assertion exists to catch.
  const body = /export interface InteractiveProps\b[^{]*\{([\s\S]*?)\n\}/.exec(
    AST_TYPES_SOURCE,
  )?.[1]
  if (body === undefined) return []
  return [...body.matchAll(/^\s*(\w+)\?:/gm)].map((match) => match[1])
}

/** Element names whose AST node extends `InteractiveProps`. */
function interactiveElementNames(): string[] {
  const names: string[] = []
  for (const match of AST_TYPES_SOURCE.matchAll(/export interface (\w+)\s+extends\s+([^{]+)\{/g)) {
    if (!/\bInteractiveProps\b/.test(match[2])) continue
    const nodeType = match[1].replace(/Node$/, '')
    // Sub-item interfaces (`NavItem`, `BreadcrumbItem`, …) are not standalone
    // elements and have no ComponentSpec, so they carry no per-element answer.
    const spec = COMPONENT_SPECS.find(
      (candidate) => candidate.nodeType.toLowerCase() === nodeType.toLowerCase(),
    )
    if (spec) names.push(spec.name)
  }
  return names
}

describe('element x attribute applicability', () => {
  const interactionAttributes = interactionAttributeNames()
  const interactiveElements = interactiveElementNames()

  it('reads both sides of the AST oracle', () => {
    // Guards the two extractions above: a regex that silently stops matching
    // would make every assertion below vacuously true.
    expect(interactionAttributes.length, 'no fields parsed from InteractiveProps').toBeGreaterThan(
      0,
    )
    expect(
      interactiveElements.length,
      'no elements found extending InteractiveProps',
    ).toBeGreaterThan(0)
  })

  it('lets every interactive element carry the interaction attributes', () => {
    const missing: string[] = []
    for (const name of interactiveElements) {
      const spec = COMPONENT_SPECS.find((candidate) => candidate.name === name)!
      for (const attr of interactionAttributes) {
        if (!spec.attributes.includes(attr)) missing.push(`${name}.${attr}`)
      }
    }
    expect(
      missing,
      'these elements extend InteractiveProps, so the renderer emits the attribute, ' +
        'but the spec omits it — validate() rejects DSL that actually works',
    ).toEqual([])
  })

  it('keeps the interaction attributes off every non-interactive element', () => {
    const interactive = new Set(interactiveElements)
    const leaked: string[] = []
    for (const spec of COMPONENT_SPECS) {
      if (interactive.has(spec.name)) continue
      for (const attr of interactionAttributes) {
        if (spec.attributes.includes(attr)) leaked.push(`${spec.name}.${attr}`)
      }
    }
    expect(
      leaked,
      'the spec accepts these, but the node does not extend InteractiveProps, ' +
        'so the value is silently dropped at render',
    ).toEqual([])
  })
})
