/**
 * The prompt is prose, but the element names in it are still a copy of the DSL
 * element set — and an LLM cannot generate an element the prompt never mentions.
 *
 * This test pins the prompt to `@wireweave/core/spec` (extracted from the
 * grammar): add an element to the grammar and this fails until the prompt
 * documents it. The prose itself stays hand-written; only its coverage is
 * enforced.
 *
 * "Documents it" is the load-bearing word. Asking only whether the name occurs
 * somewhere in the prompt is a gate that cannot fail for any element whose name
 * is also an ordinary English word: `list` matches "the message list", `item`
 * matches "peer items", `layout` matches "semantic layout". Those are prose
 * coincidences, and an element covered only by one is an element the prompt
 * never taught. So coverage is measured against the prompt's *catalogue entries*
 * — the positions where it is defining an element rather than talking around one
 * — and an element counts as documented only when it heads one of them.
 */

import { describe, expect, it } from 'vitest'
import { COMPONENT_SPECS } from '@wireweave/core/spec'
import { buildCompactGrammarPrompt, buildGrammarPrompt } from '../src/index.js'

/**
 * Split on the separators that end a catalogue entry, ignoring the ones nested
 * inside a syntax sketch: `badge(variant, size)` is one entry, not three.
 */
function splitTopLevel(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if ((c === ',' || c === ';') && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

/**
 * Every position in the prompt where an element definition may begin.
 *
 * Both prompts catalogue elements, in two shapes:
 *   - the full prompt gives each one its own line — `badge: Label tag. Attrs: …`
 *     — optionally as a list bullet under a `# CATEGORY` heading;
 *   - the compact prompt packs a category onto one line — `# VISUAL: icon(…),
 *     avatar(size), badge(variant), image, …`.
 * Both reduce to the same thing: a list of entries, each of which starts with
 * the name of what it defines.
 */
function catalogueEntries(prompt: string): string[] {
  const entries: string[] = []
  for (const line of prompt.split('\n')) {
    const category = /^#\s+[A-Z][A-Z/ ]*:\s*(.+)$/.exec(line)
    if (category) entries.push(...splitTopLevel(category[1]))
    else entries.push(line.replace(/^\s*[-*]\s*/, ''))
  }
  return entries.map((entry) => entry.trim()).filter(Boolean)
}

/**
 * True when some entry is *about* `name` — it opens with the bare keyword, so
 * what follows is that element's definition. `header/footer:` counts for both.
 * A sentence that merely uses the word later on does not count, which is the
 * whole point of the entry split above.
 */
function documents(prompt: string, name: string): boolean {
  const head = new RegExp(`^${name}(?:/[a-z]+)*(?![a-zA-Z-])`)
  return catalogueEntries(prompt).some((entry) => head.test(entry))
}

/** The predicate this gate used to apply: the name anywhere in the prose. */
function mentions(prompt: string, name: string): boolean {
  return new RegExp(`(^|[^a-zA-Z-])${name}([^a-zA-Z-]|$)`, 'm').test(prompt)
}

describe('DSL element coverage', () => {
  const prompt = buildGrammarPrompt()
  const compact = buildCompactGrammarPrompt()

  it('documents every element the grammar defines', () => {
    const missing = COMPONENT_SPECS.map((spec) => spec.name).filter(
      (name) => !documents(prompt, name),
    )
    expect(missing).toEqual([])
  })

  it('lists every element in the compact prompt as well', () => {
    const missing = COMPONENT_SPECS.map((spec) => spec.name).filter(
      (name) => !documents(compact, name),
    )
    expect(missing).toEqual([])
  })
})

/**
 * A gate is only worth its runtime if it can fail. These pin the gap between
 * the two predicates: on a prompt that talks about an element without ever
 * defining it, `mentions` is satisfied and `documents` is not — so the version
 * of this file that asked `mentions` was passing vacuously, and deleting an
 * element's catalogue entry would not have been caught.
 */
describe('coverage gate rejects prose coincidence', () => {
  const decoy = `You are a Wireweave DSL code generator.

# LAYOUT COMPONENTS
page: Root container. Attrs: title, viewport.

# LAYOUT GUIDANCE
- Use semantic layout so the message list and every peer item line up.
`

  it.each(['layout', 'list', 'item'])('does not accept a prose-only "%s"', (name) => {
    expect(mentions(decoy, name)).toBe(true)
    expect(documents(decoy, name)).toBe(false)
  })

  it('still accepts the element the decoy actually catalogues', () => {
    expect(documents(decoy, 'page')).toBe(true)
  })

  it('fails when a real catalogue entry is deleted but the prose survives', () => {
    const withoutList = buildGrammarPrompt()
      .split('\n')
      .filter((line) => !/^list:/.test(line))
      .join('\n')

    // The old predicate cannot tell: "the message list" is still in the prose.
    expect(mentions(withoutList, 'list')).toBe(true)
    expect(documents(withoutList, 'list')).toBe(false)
  })
})
