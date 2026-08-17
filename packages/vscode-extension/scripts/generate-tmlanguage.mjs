/**
 * Generate the TextMate grammar from the DSL spec.
 *
 * Syntax highlighting needs the same vocabulary as the parser, the printer and
 * the editor tooling, so every keyword here is derived:
 *
 * - **Elements** from `COMPONENT_SPECS` (`@wireweave/core/spec`, itself extracted
 *   from `wireframe.peggy`), scoped by the spec's own `category`.
 * - **Attributes and value keywords** from `@wireweave/language-data`, which is
 *   the core spec plus the two things the spec cannot state — surface syntax the
 *   grammar desugars (`at`, `type`) and value keywords core carries only in prose.
 *   That package already exists for editor vocabulary and is already a dependency,
 *   so deriving from it adds no registry; hand-listing here would have been a
 *   third copy of the same list.
 *
 * Scope granularity is deliberately flat. The attribute keywords used to be
 * hand-partitioned into seven `variable.parameter.<group>.wireframe` scopes, but
 * this extension contributes no theme and nothing in or out of this repo selects
 * those sub-scopes, so all seven rendered identically — the partition cost a
 * 73-name hand list and bought no pixel. What does change rendering is the split
 * this file does make: a name is either an attribute (`variable.parameter`) or a
 * value (`constant.language`), which the old list conflated by scoping `success`
 * and `primary` as parameters.
 *
 * Usage: node scripts/generate-tmlanguage.mjs [--check]
 *   --check  exit non-zero if the committed grammar is stale (no write)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COMPONENT_SPECS, GRAMMAR_CHILD_KEYWORDS } from '@wireweave/core/spec'
import { ATTRIBUTES, VALUE_KEYWORDS } from '@wireweave/language-data'

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_PATH = join(PACKAGE_ROOT, 'syntaxes/wireframe.tmLanguage.generated.json')

/**
 * TextMate scope per spec category. Keyed by category, not by element, so a new
 * element inherits its highlighting with no edit here.
 */
const CATEGORY_SCOPES = {
  // Reuse definitions (`layout` / `component` / `slot`) declare structure rather
  // than draw it, so they take the control-keyword scope, not a component one.
  structure: 'keyword.control.structure.wireframe',
  layout: 'keyword.control.layout.wireframe',
  grid: 'keyword.control.layout.wireframe',
  container: 'support.class.component.container.wireframe',
  text: 'support.class.component.text.wireframe',
  input: 'support.class.component.input.wireframe',
  display: 'support.class.component.display.wireframe',
  data: 'support.class.component.data.wireframe',
  feedback: 'support.class.component.feedback.wireframe',
  overlay: 'support.class.component.overlay.wireframe',
  navigation: 'support.class.component.nav.wireframe',
  annotation: 'support.class.component.annotation.wireframe',
}

/**
 * `\b(a|b|c)\b(?!-)` over the given keywords.
 *
 * The trailing `(?!-)` is what makes hyphenated names reachable. `\b` holds
 * between `m` and `-`, so a plain `\b(bottom|bottom-left)\b` matches `bottom`
 * inside `bottom-left` and stops — the alternation is leftmost-first, and the
 * shorter branch wins before the longer one is ever tried. Refusing a hyphen
 * makes that branch fail and the engine backtrack into the longer one. It also
 * fixes the case ordering alone cannot, where the two names live in different
 * patterns: `row` is an element and `row-reverse` a value, and `#elements` runs
 * first, so `direction=row-reverse` used to paint `row` as a tag.
 *
 * Scale, so this does not read as a fix worth eleven names. It rescues 11
 * declared names per grammar today, but `icon=` narrows to `lucideIcons`, and
 * that is 1,667 names — 1,150 hyphenated, and 862 of those carry another icon
 * name as a prefix (`alarm-clock-check` behind `alarm-clock`, `archive-restore`
 * behind `archive`). Deleting this lookahead clips all 862 the day that value
 * space reaches the derivation layer, and each one stays listed, `--check`
 * green, and unreachable. Counted from `lucideIcons` in core.
 */
function keywordPattern(name, keywords) {
  return { name, match: `\\b(${keywords.join('|')})\\b(?!-)` }
}

/** One pattern per scope, in the order the categories are declared above. */
function elementPatterns() {
  const byScope = new Map(Object.values(CATEGORY_SCOPES).map((scope) => [scope, []]))

  for (const spec of COMPONENT_SPECS) {
    const scope = CATEGORY_SCOPES[spec.category]
    if (!scope) {
      throw new Error(
        `[generate-tmlanguage] no TextMate scope for category "${spec.category}" (element "${spec.name}") — add it to CATEGORY_SCOPES`,
      )
    }
    byScope.get(scope).push(spec.name)
  }

  return [...byScope]
    .filter(([, keywords]) => keywords.length > 0)
    .map(([scope, keywords]) => keywordPattern(scope, keywords))
}

/**
 * `ChildKeyword` entries that are not elements of their own: they open a block
 * inside an element (`table > columns`, `tabs > tab`, `nav > group`).
 */
function blockKeywords() {
  const elements = new Set(COMPONENT_SPECS.map((spec) => spec.name))
  return GRAMMAR_CHILD_KEYWORDS.filter((keyword) => !elements.has(keyword))
}

/** Every attribute an author can write, source spelling. */
function attributeNames() {
  return ATTRIBUTES.map((attr) => attr.name).sort()
}

/**
 * Every declared value keyword, minus the ones another pattern already owns.
 *
 * `true` / `false` are matched by `#booleans` and element-shaped values (`row`
 * from `direction=`, `text` from `bg=`) by `#elements`, both of which precede
 * this pattern. Emitting them again would be dead alternation that reads as if
 * it did something.
 */
function valueKeywords() {
  const claimed = new Set([
    'true',
    'false',
    ...COMPONENT_SPECS.map((spec) => spec.name),
    ...GRAMMAR_CHILD_KEYWORDS,
  ])
  const attributes = new Set(attributeNames())
  return VALUE_KEYWORDS.filter(
    (keyword) => !claimed.has(keyword) && !attributes.has(keyword),
  ).sort()
}

function buildGrammar() {
  return {
    $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    information_for_contributors: [
      'GENERATED FILE — DO NOT EDIT.',
      'Element keywords are derived from @wireweave/core/spec (itself extracted from wireframe.peggy).',
      'Attribute and value keywords are derived from @wireweave/language-data.',
      'Run `pnpm build:syntax` in packages/vscode-extension after changing the grammar.',
    ],
    name: 'Wireframe',
    scopeName: 'source.wireframe',
    patterns: [
      { include: '#comments' },
      { include: '#strings' },
      { include: '#numbers' },
      { include: '#booleans' },
      { include: '#elements' },
      { include: '#block-keywords' },
      { include: '#attributes' },
      { include: '#value-keywords' },
      { include: '#brackets' },
    ],
    repository: {
      comments: {
        patterns: [
          { name: 'comment.line.double-slash.wireframe', match: '//.*$' },
          { name: 'comment.block.wireframe', begin: '/\\*', end: '\\*/' },
        ],
      },
      strings: {
        patterns: [
          {
            name: 'string.quoted.double.wireframe',
            begin: '"',
            end: '"',
            patterns: [{ name: 'constant.character.escape.wireframe', match: '\\\\.' }],
          },
          {
            name: 'string.quoted.single.wireframe',
            begin: "'",
            end: "'",
            patterns: [{ name: 'constant.character.escape.wireframe', match: '\\\\.' }],
          },
        ],
      },
      numbers: {
        patterns: [{ name: 'constant.numeric.wireframe', match: '\\b\\d+(\\.\\d+)?\\b' }],
      },
      booleans: {
        patterns: [{ name: 'constant.language.boolean.wireframe', match: '\\b(true|false)\\b' }],
      },
      elements: { patterns: elementPatterns() },
      'block-keywords': {
        patterns: [keywordPattern('keyword.control.block.wireframe', blockKeywords())],
      },
      attributes: {
        patterns: [keywordPattern('variable.parameter.wireframe', attributeNames())],
      },
      'value-keywords': {
        patterns: [keywordPattern('constant.language.wireframe', valueKeywords())],
      },
      brackets: {
        patterns: [
          { name: 'punctuation.definition.block.wireframe', match: '[{}]' },
          { name: 'punctuation.definition.array.wireframe', match: '[\\[\\]]' },
          { name: 'punctuation.definition.parameters.wireframe', match: '[()]' },
          { name: 'punctuation.separator.wireframe', match: '[,:]' },
          { name: 'keyword.operator.assignment.wireframe', match: '=' },
        ],
      },
    },
  }
}

function main() {
  const generated = `${JSON.stringify(buildGrammar(), null, 2)}\n`

  if (process.argv.includes('--check')) {
    if (readFileSync(OUTPUT_PATH, 'utf8') !== generated) {
      console.error(
        `[generate-tmlanguage] ${relative(PACKAGE_ROOT, OUTPUT_PATH)} is stale — run \`pnpm build:syntax\``,
      )
      process.exit(1)
    }
    return
  }

  writeFileSync(OUTPUT_PATH, generated)
}

main()
