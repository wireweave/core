/**
 * The DSL element set has exactly one source: the Peggy grammar.
 *
 * These tests are the drift guard for that claim. Every layer that needs to
 * know "what elements exist" derives from `grammar-elements.generated.ts`, and
 * that module is generated from `src/grammar/wireframe.peggy`. If someone edits
 * the grammar without regenerating, or hand-edits the generated module, or lets
 * the spec registry fall out of step with the grammar, one of these fails.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

import {
  GRAMMAR_ELEMENTS,
  GRAMMAR_CHILD_KEYWORDS,
  type GrammarNodeType,
} from '../src/spec/grammar-elements.generated.js'
import { COMPONENT_SPECS, COMPONENT_NAMES, NODE_TYPE_MAP } from '../src/spec/components.js'
import { extractNodeConstructions } from '../scripts/extract-grammar-elements.mjs'
import { assertAttributeName } from '../src/printer/values.js'
import type { NodeType } from '../src/ast/types.js'

/**
 * Compile-time drift guard: the AST's `NodeType` union is exactly the node types
 * the grammar emits, plus the parse root. `tsc --noEmit` fails here when an
 * element is added to the grammar without an AST node type (or vice versa) —
 * the runtime assertions below cannot see a type-level list.
 */
type Equals<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false
type Assert<T extends true> = T
export type NodeTypeMatchesGrammar = Assert<Equals<Exclude<NodeType, 'Document'>, GrammarNodeType>>

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const extractScript = fileURLToPath(
  new URL('../scripts/extract-grammar-elements.mjs', import.meta.url),
)
const grammarSource = readFileSync(
  fileURLToPath(new URL('../src/grammar/wireframe.peggy', import.meta.url)),
  'utf8',
)

/**
 * Element keywords the grammar deliberately keeps out of `ChildKeyword` so they
 * stay usable as attribute names (`title "…"`, `placeholder "…"`, `icon "…"`).
 */
const CONTEXT_SENSITIVE_ELEMENTS = ['title', 'placeholder', 'icon']

/**
 * `ChildKeyword` entries that open a block inside another element rather than
 * being elements of their own (`table > columns`, `tabs > tab`, `nav > group`,
 * `use > fill`).
 */
const BLOCK_ONLY_KEYWORDS = ['columns', 'tab', 'group', 'fill']

describe('grammar element SSoT', () => {
  it('the committed generated module is up to date with the grammar', () => {
    // Throws (non-zero exit) when `pnpm build:spec` has not been re-run.
    expect(() =>
      execFileSync('node', [extractScript, '--check'], { cwd: packageRoot, stdio: 'pipe' }),
    ).not.toThrow()
  })

  it('every generated element has a matching grammar rule', () => {
    for (const [keyword, nodeType] of Object.entries(GRAMMAR_ELEMENTS)) {
      expect(grammarSource).toContain(`"${keyword}"`)
      expect(grammarSource).toContain(`createNode('${nodeType}'`)
    }
  })

  it('the spec registry covers exactly the grammar element set', () => {
    expect([...COMPONENT_NAMES].sort()).toEqual(Object.keys(GRAMMAR_ELEMENTS).sort())
  })

  it('every spec entry carries the node type its grammar rule emits', () => {
    for (const spec of COMPONENT_SPECS) {
      expect(spec.nodeType).toBe(GRAMMAR_ELEMENTS[spec.name as keyof typeof GRAMMAR_ELEMENTS])
    }
  })

  it('every spec entry has metadata a consumer can render', () => {
    for (const spec of COMPONENT_SPECS) {
      expect(spec.category).toBeTruthy()
      expect(spec.description).toBeTruthy()
      expect(typeof spec.hasChildren).toBe('boolean')
      expect(Array.isArray(spec.attributes)).toBe(true)
    }
  })

  it('child keywords are element keywords, minus the documented exceptions', () => {
    const elements = new Set(Object.keys(GRAMMAR_ELEMENTS))
    const childKeywords = new Set<string>(GRAMMAR_CHILD_KEYWORDS)

    const childOnly = [...childKeywords].filter((keyword) => !elements.has(keyword))
    expect(childOnly.sort()).toEqual([...BLOCK_ONLY_KEYWORDS].sort())

    const elementOnly = [...elements].filter((keyword) => !childKeywords.has(keyword))
    expect(elementOnly.sort()).toEqual([...CONTEXT_SENSITIVE_ELEMENTS].sort())
  })

  it('the printer rejects every child keyword as an attribute name', () => {
    for (const keyword of GRAMMAR_CHILD_KEYWORDS) {
      expect(() => {
        assertAttributeName(keyword, 'ssot-test')
      }).toThrow(/child keyword/)
    }
  })

  it('the printer still accepts the context-sensitive element keywords', () => {
    for (const keyword of CONTEXT_SENSITIVE_ELEMENTS) {
      expect(() => {
        assertAttributeName(keyword, 'ssot-test')
      }).not.toThrow()
    }
  })
})

/**
 * Totality of the node-type namespace.
 *
 * Every layer downstream of the parser dispatches on `node.type`: `validate()`
 * looks it up in `NODE_TYPE_MAP`, the printer and the renderers branch on it.
 * Each of those has a fallback for "type I do not know", so a node type nobody
 * registered does not crash — it is silently dropped or reported as an unknown
 * component, and the wireframe loses whatever the author wrote. Nothing asserted
 * that the set of types the parser can emit is the set the registries hold, so
 * that gap could open without a single test turning red.
 *
 * These two assertions close it together, and neither is sufficient alone:
 *
 *   1. `createNode` is the grammar's *only* node constructor. This is what makes
 *      reading `createNode` calls a complete inventory rather than a sample.
 *   2. Every type those calls emit resolves in `NODE_TYPE_MAP`.
 *
 * The inventory is read out of `wireframe.peggy` rather than listed here on
 * purpose: a hand-written list omits the next node type in exactly the same
 * silence this gate exists to break.
 */
describe('parser node-type totality', () => {
  const constructions = extractNodeConstructions(grammarSource)

  /** The parse root has no keyword and no spec; `validate()` starts below it. */
  const NON_ELEMENT_NODE_TYPES = ['Document']

  it('constructs every AST node through createNode', () => {
    const offenders = constructions.bare.map(({ rule, type }) => `${rule} → { type: '${type}' }`)
    expect(
      offenders,
      'these rules build a node without createNode, so it carries no `loc` and ' +
        'no derivation can see its type — move them onto createNode, or, if the ' +
        'value never reaches the AST, key it on something other than `type`',
    ).toEqual([])
  })

  it('emits only node types the spec registry resolves', () => {
    const unresolved = [...constructions.viaCreateNode, ...constructions.viaCreateBlockNode]
      .filter((type) => !NON_ELEMENT_NODE_TYPES.includes(type))
      .filter((type) => !NODE_TYPE_MAP.has(type))
    expect(
      unresolved.sort(),
      'the grammar emits these node types and no ComponentSpec claims them, so ' +
        'validate() reports them as unknown components',
    ).toEqual([])
  })

  /**
   * The untyped counterpart of the first assertion. A rule that returns an
   * object it built itself produces a value with no `type`, which the two
   * assertions above cannot see at all: nothing resolves it, nothing validates
   * it, and it carries no `loc`. Most entries here are legitimate — attribute
   * pairs and parse intermediates that never reach the AST — so the gate is a
   * ratchet rather than a ban: the set is pinned, and equality means a new
   * bare-object rule fails just as loudly as a fixed one, which forces the list
   * down instead of letting it drift.
   */
  const BARE_OBJECT_RULES: Readonly<Record<string, string>> = {
    Attribute: 'an attribute name/value pair, flattened by attrsToObject',
    ObjectProperty: 'an attribute pair inside an array-literal object item',
    ValueWithUnit: 'a dimension, consumed as an attribute value',
    TableContent: 'the columns/rows pair a Table rule spreads into its own node',
    TableRow: 'a `kind`-tagged intermediate TableContent consumes and discards',
    TabItem:
      'a tab panel. Typing it puts it in reach of validate(), which recurses ' +
      'into `children` — a change in validator coverage, not in casing, so it ' +
      'is measured on its own with the deferred Tabs items/children rework',
  }

  it('adds no new rule that returns an untyped object', () => {
    expect(constructions.bareObjectRules.sort()).toEqual(Object.keys(BARE_OBJECT_RULES).sort())
  })
})
