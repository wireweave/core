/**
 * Generate the Shiki grammar used to highlight `.wf` samples in the docs.
 *
 * Every keyword is derived, from the same two sources the VS Code grammar uses:
 *
 * - **Elements** from `@wireweave/core/spec` (extracted from `wireframe.peggy`),
 *   so the docs highlight exactly the language the parser accepts.
 * - **Attributes and value keywords** from `@wireweave/language-data`, which is
 *   that spec plus the two things it cannot state — surface syntax the grammar
 *   desugars (`at`, `type`) and value keywords core carries only in prose.
 *
 * The attribute and modifier lists used to be hand-maintained here, which made
 * this the fourth copy of a vocabulary the DSL already declares once. It had
 * drifted the way a fourth copy does: it listed sixteen modifiers no attribute
 * accepts (`selected`, `readonly`, `large`, …) and knew 20 of the 99 attribute
 * names. Deriving costs nothing here — `language-data` exists for editor
 * vocabulary and its gate reads this file, so a name cannot enter the language
 * without reaching these samples.
 *
 * Scope names stay as the docs theme expects them (`entity.other.attribute-name`
 * / `support.type`); only where the names come from changed.
 *
 * Usage: node .vitepress/generate-tmlanguage.mjs [--check]
 *   --check  exit non-zero if the committed grammar is stale (no write)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COMPONENT_SPECS, GRAMMAR_CHILD_KEYWORDS } from '@wireweave/core/spec'
import { ATTRIBUTES, VALUE_KEYWORDS } from '@wireweave/language-data'

const DOCS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_PATH = join(DOCS_ROOT, '.vitepress/wireframe.tmLanguage.generated.json')

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
 *
 * @param {string} name TextMate scope for the matched keywords.
 * @param {readonly string[]} keywords
 * @returns {{ name: string, match: string }}
 */
function keywordPattern(name, keywords) {
  return { name, match: `\\b(${keywords.join('|')})\\b(?!-)` }
}

/**
 * Element keywords, in spec order.
 *
 * @returns {string[]}
 */
function elementKeywords() {
  return COMPONENT_SPECS.map((spec) => spec.name)
}

/**
 * `ChildKeyword` entries that open a block inside an element, not elements.
 *
 * @returns {string[]}
 */
function blockKeywords() {
  const elements = new Set(elementKeywords())
  return GRAMMAR_CHILD_KEYWORDS.filter((keyword) => !elements.has(keyword))
}

/**
 * Every attribute an author can write, source spelling.
 *
 * This absorbs what a hand-written `CONFIG_KEYWORDS` list used to carry:
 * `device` and `viewport` are declared attributes, so they arrive here and take
 * the attribute scope — which is what they are. `theme` was the third entry and
 * is not part of the DSL at all; it is a `render()` option, and it appears in
 * the docs only inside JavaScript samples (`theme: 'light'`), never in a `.wf`
 * one. Highlighting it as a wireframe keyword painted a name the parser has
 * never accepted.
 *
 * @returns {string[]}
 */
function attributeNames() {
  return ATTRIBUTES.map((attr) => attr.name).sort()
}

/**
 * Every declared value keyword, minus the ones another pattern already owns.
 *
 * `true` / `false` go to `#booleans`, element-shaped values (`row` from
 * `direction=`, `text` from `bg=`) to `#elements`, and names that are also
 * attributes (`primary`, `muted`, `xl`, …) to `#attributes`. Overlap is
 * resolved toward one scope rather than duplicated, so the partition holds
 * whatever order the patterns are tried in.
 *
 * @returns {string[]}
 */
function valueKeywords() {
  const claimed = new Set([
    'true',
    'false',
    ...elementKeywords(),
    ...GRAMMAR_CHILD_KEYWORDS,
    ...attributeNames(),
  ])
  return VALUE_KEYWORDS.filter((keyword) => !claimed.has(keyword)).sort()
}

function buildGrammar() {
  return {
    $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    information_for_contributors: [
      'GENERATED FILE — DO NOT EDIT.',
      'Element keywords are derived from @wireweave/core/spec (itself extracted from wireframe.peggy).',
      'Attribute and value keywords are derived from @wireweave/language-data.',
      'Run `pnpm build:syntax` in docs/ after changing the grammar.',
    ],
    name: 'wireframe',
    displayName: 'Wireframe',
    scopeName: 'source.wireframe',
    aliases: ['wf'],
    patterns: [
      { include: '#comments' },
      { include: '#strings' },
      { include: '#numbers' },
      { include: '#booleans' },
      { include: '#keywords' },
      { include: '#elements' },
      { include: '#modifiers' },
      { include: '#attributes' },
      { include: '#braces' },
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
      keywords: {
        patterns: [keywordPattern('keyword.control.wireframe', blockKeywords())],
      },
      elements: {
        patterns: [keywordPattern('entity.name.tag.wireframe', elementKeywords())],
      },
      modifiers: {
        patterns: [keywordPattern('support.type.wireframe', valueKeywords())],
      },
      attributes: {
        patterns: [
          keywordPattern('entity.other.attribute-name.wireframe', attributeNames()),
          { name: 'keyword.operator.wireframe', match: '=' },
        ],
      },
      braces: {
        patterns: [{ name: 'punctuation.definition.block.wireframe', match: '[{}]' }],
      },
    },
  }
}

function main() {
  const generated = `${JSON.stringify(buildGrammar(), null, 2)}\n`

  if (process.argv.includes('--check')) {
    if (readFileSync(OUTPUT_PATH, 'utf8') !== generated) {
      console.error(
        `[generate-tmlanguage] ${relative(DOCS_ROOT, OUTPUT_PATH)} is stale — run \`pnpm build:syntax\``,
      )
      process.exit(1)
    }
    return
  }

  writeFileSync(OUTPUT_PATH, generated)
}

main()
