/**
 * Extract the DSL element-name set from the Peggy grammar.
 *
 * The grammar (`src/grammar/wireframe.peggy`) is the single source of truth for
 * what an element *is*: a rule that matches a leading keyword literal and emits
 * an AST node via `createNode('<NodeType>')`. This script reads that grammar and
 * emits `src/spec/grammar-elements.generated.ts`, which every other layer
 * (spec registry, printer, editor tooling) derives its element set from.
 *
 * Usage: node scripts/extract-grammar-elements.mjs [--check]
 *   --check  exit non-zero if the committed module is stale (no write)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const GRAMMAR_PATH = join(PACKAGE_ROOT, 'src/grammar/wireframe.peggy')
export const OUTPUT_PATH = join(PACKAGE_ROOT, 'src/spec/grammar-elements.generated.ts')

/**
 * AST node types produced by `createNode` that are not DSL elements.
 * `Document` is the parse root: it has no keyword of its own.
 */
const NON_ELEMENT_NODE_TYPES = new Set(['Document'])

/** A rule head: `RuleName` or `RuleName "human label"`, alone on a column-0 line. */
const RULE_HEAD_RE = /^([A-Za-z_][A-Za-z0-9_]*)(?:[ \t]+"(?:[^"\\]|\\.)*")?[ \t]*$/
/** A top-level alternative of a rule body: two spaces, then `=` or `/`. */
const ALTERNATIVE_RE = /^ {2}[=/][ \t]+/
/** The keyword literal a rule alternative starts with. */
const LEADING_LITERAL_RE = /^ {2}[=/][ \t]+"((?:[^"\\]|\\.)*)"/
const CREATE_NODE_RE = /(?<![A-Za-z])createNode\(\s*'([A-Za-z_][A-Za-z0-9_]*)'/
const CREATE_NODE_RE_G = /(?<![A-Za-z])createNode\(\s*'([A-Za-z_][A-Za-z0-9_]*)'/g
const CREATE_BLOCK_NODE_RE_G = /createBlockNode\(\s*'([A-Za-z_][A-Za-z0-9_]*)'/g
const STRING_LITERAL_RE = /"((?:[^"\\]|\\.)*)"/g
/**
 * An object literal in a rule action that sets `type` to a string — i.e. builds
 * an AST node without going through `createNode`. `createNode` never writes a
 * `type:` key of its own (it takes the type as its first argument and spreads
 * the rest), so every match here is a node the helper did not construct.
 */
const BARE_NODE_TYPE_RE = /(?<![.\w])type:\s*'([^']*)'/g

/**
 * A rule action returning an object literal it built itself rather than through
 * `createNode`/`createBlockNode`. Such a value carries no `type`, so no registry
 * can reach it and `validate()` walks straight past it — the untyped twin of the
 * `BARE_NODE_TYPE_RE` case. Most matches are legitimate (attribute pairs, parse
 * intermediates); the point is that the set is enumerable and may only shrink.
 */
const BARE_OBJECT_RETURN_RE = /return\s+\{/g

/**
 * @typedef {object} Rule
 * @property {string} name
 * @property {string[]} lines
 */

/**
 * Split a grammar source into `{ name, lines }` rule chunks.
 *
 * A rule starts at a column-0 head line whose next meaningful line opens the
 * rule body with `=`. The leading initializer block (`{ ... }` before the first
 * rule) is skipped: its only column-0 lines are the braces themselves.
 *
 * @param {string} source
 * @returns {Rule[]}
 */
function splitRules(source) {
  const lines = source.split('\n')
  /** @type {Rule[]} */
  const rules = []
  /** @type {Rule | null} */
  let current = null

  /**
   * @param {number} index
   * @returns {boolean}
   */
  const opensBody = (index) => {
    for (let i = index + 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() === '' || line.trim().startsWith('//')) continue
      return line.trimStart().startsWith('=')
    }
    return false
  }

  for (const [index, line] of lines.entries()) {
    const head = RULE_HEAD_RE.exec(line)
    if (head && opensBody(index)) {
      current = { name: head[1], lines: [] }
      rules.push(current)
      continue
    }
    if (current) current.lines.push(line)
  }

  return rules
}

/**
 * Split a rule body into its top-level alternatives.
 *
 * @param {string[]} ruleLines
 * @returns {string[]}
 */
function splitAlternatives(ruleLines) {
  /** @type {string[][]} */
  const alternatives = []
  /** @type {string[] | null} */
  let current = null

  for (const line of ruleLines) {
    if (ALTERNATIVE_RE.test(line)) {
      current = [line]
      alternatives.push(current)
      continue
    }
    if (current) current.push(line)
  }

  return alternatives.map((lines) => lines.join('\n'))
}

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  throw new Error(`[extract-grammar-elements] ${message}`)
}

/**
 * @typedef {object} Extraction
 * @property {[string, string][]} elements
 * @property {string[]} blockNodeTypes
 * @property {string[]} childKeywords
 */

/**
 * Extract `{ elements, blockNodeTypes, childKeywords }` from Peggy grammar source.
 *
 * - `elements`: `[keyword, nodeType]` pairs, in grammar order.
 * - `blockNodeTypes`: node types built by `createBlockNode` that are not already
 *   element node types — the shapes that exist only inside another element's
 *   block and so have no keyword of their own to be addressed by.
 * - `childKeywords`: the `ChildKeyword` rule's closed set — keywords that start
 *   a child and therefore cannot be parsed as attribute names.
 *
 * @param {string} source
 * @returns {Extraction}
 */
export function extractGrammarElements(source) {
  const rules = splitRules(source)
  /** @type {Map<string, string>} */
  const elements = new Map()
  /** @type {Map<string, string>} */
  const nodeTypeToKeyword = new Map()

  for (const rule of rules) {
    for (const alternative of splitAlternatives(rule.lines)) {
      const created = CREATE_NODE_RE.exec(alternative)
      if (!created) continue
      const nodeType = created[1]
      if (NON_ELEMENT_NODE_TYPES.has(nodeType)) continue

      const literal = LEADING_LITERAL_RE.exec(alternative)
      if (!literal) {
        fail(
          `rule ${rule.name} emits node type ${nodeType} from an alternative with no leading keyword literal — ` +
            `either give the alternative a keyword or add ${nodeType} to NON_ELEMENT_NODE_TYPES`,
        )
      }
      const keyword = literal[1]

      const knownNodeType = elements.get(keyword)
      if (knownNodeType !== undefined && knownNodeType !== nodeType) {
        fail(`keyword "${keyword}" maps to both ${knownNodeType} and ${nodeType}`)
      }
      const knownKeyword = nodeTypeToKeyword.get(nodeType)
      if (knownKeyword !== undefined && knownKeyword !== keyword) {
        fail(`node type ${nodeType} maps to both "${knownKeyword}" and "${keyword}"`)
      }

      elements.set(keyword, nodeType)
      nodeTypeToKeyword.set(nodeType, keyword)
    }
  }

  if (elements.size === 0) fail('no element rules found in the grammar')

  const childKeywordRule = rules.find((rule) => rule.name === 'ChildKeyword')
  if (!childKeywordRule) fail('no ChildKeyword rule found in the grammar')
  const childKeywords = [...childKeywordRule.lines.join('\n').matchAll(STRING_LITERAL_RE)].map(
    (match) => match[1],
  )
  if (childKeywords.length === 0) fail('the ChildKeyword rule lists no keywords')
  const duplicated = childKeywords.filter((kw, i) => childKeywords.indexOf(kw) !== i)
  if (duplicated.length > 0) fail(`ChildKeyword lists duplicates: ${duplicated.join(', ')}`)

  const elementNodeTypes = new Set(elements.values())
  const blockNodeTypes = extractNodeConstructions(source).viaCreateBlockNode.filter(
    (nodeType) => !elementNodeTypes.has(nodeType),
  )

  return { elements: [...elements], blockNodeTypes, childKeywords }
}

/**
 * @typedef {object} BareNodeType
 * @property {string} rule   grammar rule whose action builds it
 * @property {string} type   the literal written to the `type` key
 */

/**
 * @typedef {object} NodeConstruction
 * @property {string[]} viaCreateNode       node types passed to `createNode`, deduped
 * @property {string[]} viaCreateBlockNode  node types passed to `createBlockNode`, deduped
 * @property {BareNodeType[]} bare          node types written through neither helper
 * @property {string[]} bareObjectRules     rules returning a self-built object literal
 */

/**
 * Every way the grammar can put a `type` on a value it returns.
 *
 * The parser is the only producer of AST nodes, so "which node types exist" is
 * answerable from this file alone — but only if the answer is complete. Reading
 * `createNode` calls gives a complete answer exactly when `createNode` is the
 * grammar's only node constructor, so both halves are reported and the caller
 * asserts the second is empty. Without that, an object literal carrying a `type`
 * is a node type no downstream registry has any way to learn about.
 *
 * @param {string} source
 * @returns {NodeConstruction}
 */
export function extractNodeConstructions(source) {
  /** @type {Set<string>} */
  const viaCreateNode = new Set()
  /** @type {Set<string>} */
  const viaCreateBlockNode = new Set()
  /** @type {BareNodeType[]} */
  const bare = []
  /** @type {Set<string>} */
  const bareObjectRules = new Set()

  for (const rule of splitRules(source)) {
    const body = rule.lines.join('\n')
    for (const match of body.matchAll(CREATE_NODE_RE_G)) viaCreateNode.add(match[1])
    for (const match of body.matchAll(CREATE_BLOCK_NODE_RE_G)) viaCreateBlockNode.add(match[1])
    for (const match of body.matchAll(BARE_NODE_TYPE_RE)) {
      bare.push({ rule: rule.name, type: match[1] })
    }
    if (BARE_OBJECT_RETURN_RE.test(body)) bareObjectRules.add(rule.name)
    BARE_OBJECT_RETURN_RE.lastIndex = 0
  }

  return {
    viaCreateNode: [...viaCreateNode],
    viaCreateBlockNode: [...viaCreateBlockNode],
    bare,
    bareObjectRules: [...bareObjectRules],
  }
}

/**
 * Render the generated TypeScript module for an extraction result.
 *
 * @param {Extraction} extraction
 * @returns {string}
 */
export function renderModule({ elements, blockNodeTypes, childKeywords }) {
  const grammarRef = relative(PACKAGE_ROOT, GRAMMAR_PATH)
  const scriptRef = 'scripts/extract-grammar-elements.mjs'

  return `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Derived from \`${grammarRef}\` by \`${scriptRef}\`
 * (\`pnpm build:spec\`). The grammar is the single source of truth for the DSL
 * element set; edit the grammar and regenerate, never this file.
 */

/** Every DSL element keyword, mapped to the AST node type its rule emits. */
export const GRAMMAR_ELEMENTS = {
${elements.map(([keyword, nodeType]) => `  ${keyword}: '${nodeType}',`).join('\n')}
} as const

/** Union of every DSL element keyword. */
export type GrammarElementName = keyof typeof GRAMMAR_ELEMENTS

/** Union of every AST node type an element rule emits. */
export type GrammarNodeType = (typeof GRAMMAR_ELEMENTS)[GrammarElementName]

/**
 * Node types that exist only inside another element's block.
 *
 * \`nav { item … }\` and \`nav { group { … } }\` produce real nodes — they carry
 * attributes, hold interaction intents and need a source location — but their
 * keywords are not elements: \`item\` means something different in \`nav\`,
 * \`list\`, \`dropdown\` and \`annotations\`, so it cannot map to one node type the
 * way {@link GRAMMAR_ELEMENTS} entries do. They are addressed by node type
 * instead, and the spec registry gives them their metadata that way.
 */
export const GRAMMAR_BLOCK_NODE_TYPES = [
${blockNodeTypes.map((nodeType) => `  '${nodeType}',`).join('\n')}
] as const

/** Union of every block-scoped node type. */
export type GrammarBlockNodeType = (typeof GRAMMAR_BLOCK_NODE_TYPES)[number]

/**
 * The grammar's \`ChildKeyword\` set: keywords that start a child element and so
 * cannot be parsed back as attribute names (\`AttributeName = !ChildKeyword Identifier\`).
 * It also covers block-scoped keywords (\`columns\`, \`tab\`, \`group\`) that are not
 * elements of their own, and omits element keywords that are deliberately
 * context-sensitive (\`title\`, \`placeholder\`, \`icon\` double as attribute names).
 */
export const GRAMMAR_CHILD_KEYWORDS = [
${childKeywords.map((keyword) => `  '${keyword}',`).join('\n')}
] as const
`
}

function main() {
  const check = process.argv.includes('--check')
  const generated = renderModule(extractGrammarElements(readFileSync(GRAMMAR_PATH, 'utf8')))

  if (check) {
    const committed = readFileSync(OUTPUT_PATH, 'utf8')
    if (committed !== generated) {
      console.error(
        `[extract-grammar-elements] ${relative(PACKAGE_ROOT, OUTPUT_PATH)} is stale — run \`pnpm build:spec\``,
      )
      process.exit(1)
    }
    return
  }

  writeFileSync(OUTPUT_PATH, generated)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
