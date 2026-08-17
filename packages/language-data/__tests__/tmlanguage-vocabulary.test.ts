/**
 * Every TextMate grammar in the repo highlights exactly this package's vocabulary.
 *
 * There are two: the VS Code extension's and the docs site's. Each has its own
 * generator with its own `--check`, and each `--check` proves the committed JSON
 * matches whatever that script currently produces. That is a weaker claim than
 * it looks: re-introducing a hand-written keyword array and regenerating
 * satisfies `--check` forever, because the script is then faithfully reproducing
 * the hand list. The drift this package exists to prevent would be back, and
 * green. The docs grammar is the proof — its `--check` passed every day it
 * listed sixteen modifiers no attribute accepts and knew 20 of 99 attributes.
 *
 * So the gate here asserts the vocabulary itself rather than the files'
 * freshness — the two questions are different, and only this one notices a name
 * that the editors know and a highlighter does not.
 *
 * It reads the committed artifacts by path rather than importing the generators.
 * Importing would ask a generator whether it agrees with itself; reading what
 * ships in the `.vsix` and what VitePress loads asks whether the shipped
 * grammars agree with the source of truth. Producer and verifier stay separate.
 *
 * The two grammars use different scope vocabularies and different repository
 * keys for the same partition, so each entry below names its own keys. What is
 * asserted is the partition, not the naming.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

import { ATTRIBUTES, VALUE_KEYWORDS } from '../src/index.js'

interface TmPattern {
  name?: string
  match?: string
  patterns?: TmPattern[]
}
interface TmGrammar {
  /** Top-level includes, in the order the highlighter tries them. */
  patterns: { include: string }[]
  repository: Record<string, { patterns: TmPattern[] }>
}

interface GrammarUnderTest {
  /** Which artifact a failure is talking about. */
  label: string
  path: string
  /** Repository entry holding the attribute-name alternation. */
  attributesKey: string
  /** Repository entry holding the value keywords no other pattern claims. */
  valuesKey: string
}

const GRAMMARS: readonly GrammarUnderTest[] = [
  {
    label: 'vscode-extension',
    path: '../../vscode-extension/syntaxes/wireframe.tmLanguage.generated.json',
    attributesKey: 'attributes',
    valuesKey: 'value-keywords',
  },
  {
    label: 'docs',
    path: '../../../docs/.vitepress/wireframe.tmLanguage.generated.json',
    attributesKey: 'attributes',
    valuesKey: 'modifiers',
  },
]

function loadGrammar(relativePath: string): TmGrammar {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf8')) as TmGrammar
}

/**
 * The keywords of a `\b(a|b|c)\b` alternation, in the order the file lists them.
 *
 * A trailing lookahead is stripped before parsing. The generators end their
 * alternations with `(?!-)` so a hyphenated name is not cut short at its first
 * segment, and that suffix is a matching concern, not a vocabulary one.
 */
function keywordsOf(grammar: TmGrammar, repositoryKey: string): string[] {
  const entry = grammar.repository[repositoryKey]
  if (!entry) {
    throw new Error(
      `grammar has no repository entry "${repositoryKey}" — it has: ${Object.keys(grammar.repository).join(', ')}`,
    )
  }
  return entry.patterns.flatMap((pattern) => {
    const body = (pattern.match ?? '').replace(/\(\?![^)]*\)$/, '')
    const alternation = /^\\b\((.*)\)\\b$/.exec(body)
    return alternation ? alternation[1].split('|') : []
  })
}

/**
 * The scope a bare token gets, and how much of it is painted.
 *
 * TextMate takes the leftmost match, and among patterns matching at the same
 * position the first one listed — so this walks `grammar.patterns` in order and
 * keeps the first hit at index 0, exactly as the highlighter would. The
 * patterns involved are plain alternations and character classes, so JavaScript
 * and Oniguruma agree on them; anything with `begin`/`end` cannot match a bare
 * identifier and is skipped.
 */
function paintOf(grammar: TmGrammar, token: string): { scope: string; text: string } | undefined {
  for (const key of grammar.patterns.map((entry) => entry.include.slice(1))) {
    for (const pattern of grammar.repository[key].patterns) {
      if (!pattern.match) continue
      const hit = new RegExp(pattern.match).exec(token)
      if (hit && hit.index === 0) return { scope: pattern.name ?? key, text: hit[0] }
    }
  }
  return undefined
}

/** Every keyword the grammar highlights, under any scope. */
function allHighlighted(grammar: TmGrammar): Set<string> {
  return new Set(Object.keys(grammar.repository).flatMap((key) => keywordsOf(grammar, key)))
}

describe.each(GRAMMARS)('tmLanguage vocabulary ($label)', (target) => {
  const grammar = loadGrammar(target.path)

  it('highlights every attribute this package declares, and nothing else', () => {
    // Set equality both ways. One direction catches a name the editors gained
    // and the highlighter did not; the other catches a keyword with no
    // declaration behind it — a typo, or a hand-added name — which is how the
    // stale entries this gate replaced went unnoticed in both grammars.
    const declared = ATTRIBUTES.map((attr) => attr.name)
    const highlighted = keywordsOf(grammar, target.attributesKey)

    expect(highlighted.filter((name) => !declared.includes(name))).toEqual([])
    expect(declared.filter((name) => !highlighted.includes(name))).toEqual([])
  })

  it('highlights every declared value keyword under some scope', () => {
    // Deliberately not asserted against the value entry alone. Values that
    // collide with an element (`row`), an attribute (`primary`) or a boolean
    // (`true`) are highlighted by another pattern and excluded from that entry
    // on purpose, so pinning them to one scope would restate the generator's
    // partition here — a second copy of the rule, in the file whose job is to
    // prevent second copies.
    const highlighted = allHighlighted(grammar)
    expect(VALUE_KEYWORDS.filter((keyword) => !highlighted.has(keyword))).toEqual([])
  })

  it('highlights no value keyword this package does not declare', () => {
    // The other direction of the same question, and the one the docs grammar
    // needed: its hand list carried sixteen names no attribute accepts
    // (`selected`, `readonly`, `large`, …), so samples were painted as if the
    // DSL had values it does not. The forward assertion above cannot see that —
    // an extra keyword breaks nothing it checks. Only the attribute axis had
    // both directions until now.
    const declared = new Set<string>(VALUE_KEYWORDS)
    const highlighted = keywordsOf(grammar, target.valuesKey)
    expect(highlighted.filter((keyword) => !declared.has(keyword))).toEqual([])
  })

  it('paints every declared name in full, not just its first segment', () => {
    // Presence in an alternation is not the same as being matched. Alternation
    // is leftmost-first and `\b` holds before a hyphen, so `bottom` used to win
    // inside `bottom-left` and the rest went unpainted — eleven names, in both
    // grammars, every one of them listed and none of them reachable. A set
    // assertion cannot see this; only running the patterns can.
    //
    // Eleven is today's count, not the stake: once `icon=` narrows to the icon
    // set, prefix collisions run into the hundreds. `keywordPattern` in either
    // generator carries the measurement and the reason its lookahead stays.
    const declared = [...new Set([...ATTRIBUTES.map((attr) => attr.name), ...VALUE_KEYWORDS])]
    const clipped = declared
      .map((token) => ({ token, paint: paintOf(grammar, token) }))
      .filter(({ token, paint }) => paint?.text !== token)
      .map(({ token, paint }) =>
        paint ? `${token} → painted "${paint.text}" as ${paint.scope}` : `${token} → unpainted`,
      )

    expect(clipped).toEqual([])
  })

  it('keeps attribute names and value keywords in distinct scopes', () => {
    // The list this gate replaced scoped `success` and `primary` alike, so a
    // value read as if it were an attribute name. Overlap is resolved toward
    // the attribute scope, never duplicated.
    const attributes = new Set(keywordsOf(grammar, target.attributesKey))
    const values = keywordsOf(grammar, target.valuesKey)
    expect(values.filter((keyword) => attributes.has(keyword))).toEqual([])
  })
})
