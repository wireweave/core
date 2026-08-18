/**
 * `when=` — the build-time variant scope of an element.
 *
 * `variants` on a page says how many boards it draws; `when` on an element says
 * which of them draw it. The two halves are tested apart because they break
 * apart: expansion can be correct while filtering keeps everything, and the
 * suite would still be green on every assertion about board count.
 *
 * Three properties carry the feature, and each has a group below.
 *
 * - **Disjunction.** `when=[a, b]` draws the element on both boards. This is the
 *   reason the attribute exists: a `visibleWhen` guard has only `equals`, so a
 *   block shared by two states had to be authored twice, and two copies drift.
 *   Asserted as presence on every named board *and* absence from the unnamed
 *   ones, because "renders somewhere" is satisfied by an implementation that
 *   ignores the list entirely.
 *
 * - **Orthogonality with `visibleWhen`.** The two look alike and are not alike:
 *   `when` decides whether the element is in a board's markup, `visibleWhen`
 *   decides whether the runtime shows the element that is already there. One
 *   element carries both, and both survive — the regression this guards is the
 *   plausible refactor that folds `when` into `GuardedOutcomeProps` and lets one
 *   overwrite the other.
 *
 * - **Backwards compatibility.** A document with no `when` anywhere must render
 *   byte-for-byte as it did, and is asserted by object identity rather than by
 *   comparing output, because identity is the property the renderer relies on.
 */

import { describe, expect, it } from 'vitest'
import { parse } from '../src/parser'
import { printWireframe } from '../src/printer'
import { render, renderSite } from '../src/renderer'
import { validate } from '../src/validation'
import { expandVariants, expandRepeats } from '../src/ast'
import type { PageNode, WireframeDocument } from '../src/ast'

/** The pages of a document, after whatever transformation the test is about. */
function pages(doc: WireframeDocument): PageNode[] {
  return doc.children.filter((child): child is PageNode => child.type === 'Page')
}

/** The board of a given variant, which must exist for the assertion to mean anything. */
function board(doc: WireframeDocument, variant: string): PageNode {
  const found = pages(doc).find((page) => page.variant === variant)
  if (found === undefined) throw new Error(`no board for variant "${variant}"`)
  return found
}

/** Titles of a board's direct children — what that board draws, in order. */
function titles(page: PageNode): (string | undefined)[] {
  return page.children.map((child) => (child as { title?: string }).title)
}

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

describe('when — parsing', () => {
  it('parses the scalar form as a bare identifier', () => {
    const doc = parse('page "P" variants=[loading] {\n  section "S" when=loading { text "x" }\n}')
    const section = pages(doc)[0].children[0] as { when?: unknown }
    expect(section.when).toBe('loading')
  })

  it('parses the list form as an array of bare identifiers', () => {
    const doc = parse(
      'page "P" variants=[loading, ready] {\n  section "S" when=[loading, ready] { text "x" }\n}',
    )
    const section = pages(doc)[0].children[0] as { when?: unknown }
    expect(section.when).toEqual(['loading', 'ready'])
  })

  it('round-trips both spellings through the printer', () => {
    // The corpus harness pins `parse(print(parse(src)))`; this is the same law
    // stated for the two productions `when` can be written in, so a printer that
    // learned only one of them fails here rather than in an unrelated snapshot.
    const source =
      'page "P" variants=[loading, ready] {\n' +
      '  section "A" when=loading { text "a" }\n' +
      '  section "B" when=[loading, ready] { text "b" }\n' +
      '}'
    const once = printWireframe(parse(source))
    const twice = printWireframe(parse(once))
    expect(twice).toBe(once)
    const reparsed = pages(parse(once))[0].children as { when?: unknown }[]
    expect(reparsed.map((child) => child.when)).toEqual(['loading', ['loading', 'ready']])
  })
})

// ---------------------------------------------------------------------------
// filtering, and the disjunction it implements
// ---------------------------------------------------------------------------

describe('when — filtering', () => {
  const SOURCE =
    'page "D" id=d variants=[loading, empty, ready] {\n' +
    '  section "Common" when=[loading, empty, ready] { text "shared" }\n' +
    '  section "OnlyLoading" when=loading { text "skeleton" }\n' +
    '  section "OnlyEmpty" when=empty { text "nothing" }\n' +
    '  section "Both" when=[loading, ready] { text "or-block" }\n' +
    '  section "Always" { text "unscoped" }\n' +
    '}'

  it('draws a scalar scope on its board and nowhere else', () => {
    const doc = expandVariants(parse(SOURCE))
    expect(titles(board(doc, 'loading'))).toContain('OnlyLoading')
    expect(titles(board(doc, 'empty'))).not.toContain('OnlyLoading')
    expect(titles(board(doc, 'ready'))).not.toContain('OnlyLoading')
  })

  it('draws a list scope on every board it names — the disjunction', () => {
    // The whole point of the attribute. Both halves are asserted: presence on
    // each named board, and absence from the board it does not name — without
    // the second, an implementation that ignores `when` passes.
    const doc = expandVariants(parse(SOURCE))
    expect(titles(board(doc, 'loading'))).toContain('Both')
    expect(titles(board(doc, 'ready'))).toContain('Both')
    expect(titles(board(doc, 'empty'))).not.toContain('Both')
  })

  it('draws a block scoped to every variant once per board, authored once', () => {
    const doc = expandVariants(parse(SOURCE))
    for (const variant of ['loading', 'empty', 'ready']) {
      expect(titles(board(doc, variant))).toContain('Common')
    }
  })

  it('draws an unscoped element on every board', () => {
    const doc = expandVariants(parse(SOURCE))
    for (const variant of ['loading', 'empty', 'ready']) {
      expect(titles(board(doc, variant))).toContain('Always')
    }
  })

  it('produces exactly the boards the author described', () => {
    const doc = expandVariants(parse(SOURCE))
    expect(titles(board(doc, 'loading'))).toEqual(['Common', 'OnlyLoading', 'Both', 'Always'])
    expect(titles(board(doc, 'empty'))).toEqual(['Common', 'OnlyEmpty', 'Always'])
    expect(titles(board(doc, 'ready'))).toEqual(['Common', 'Both', 'Always'])
  })

  it('consumes `when`, leaving no scope on the boards it produced', () => {
    // A board is the variant it names, so an element on it no longer has a
    // scope to be filtered by. A leftover `when` would print back out as a
    // scope on a board that is already that board, and re-filter on a second
    // expansion.
    const doc = expandVariants(parse(SOURCE))
    for (const page of pages(doc)) {
      for (const child of page.children) {
        expect((child as { when?: unknown }).when).toBeUndefined()
      }
    }
  })

  it('filters nested elements, not only a page’s direct children', () => {
    const doc = expandVariants(
      parse(
        'page "P" variants=[loading, ready] {\n' +
          '  section "Outer" {\n' +
          '    text "keep"\n' +
          '    card "Inner" when=ready { text "deep" }\n' +
          '  }\n' +
          '}',
      ),
    )
    const outerOf = (variant: string) => board(doc, variant).children[0] as { children: unknown[] }
    expect(outerOf('ready').children).toHaveLength(2)
    expect(outerOf('loading').children).toHaveLength(1)
  })

  it('removes a filtered element from rendered output, not merely from the tree', () => {
    // Filtering the AST and rendering it are two steps, and the render surfaces
    // run expansion themselves. Asserting on markup is what ties the pass to
    // what a reader of the artifact actually sees.
    const html = renderSite(parse(SOURCE))
    expect(html).toContain('skeleton')
    expect((html.match(/or-block/g) ?? []).length).toBe(2) // loading + ready
    expect((html.match(/shared/g) ?? []).length).toBe(3) // all three boards
  })
})

// ---------------------------------------------------------------------------
// orthogonality — the constraint this feature is most likely to lose
// ---------------------------------------------------------------------------

describe('when — orthogonality with visibleWhen', () => {
  const SOURCE =
    'page "D" id=d states=[{ name=open, valueType=boolean, initial=false }] variants=[loading, ready] {\n' +
    '  section "Guarded" when=ready visibleWhen={ state=open, equals=true } { text "both" }\n' +
    '}'

  it('keeps both properties on one element', () => {
    // The regression guarded against is a refactor that folds `when` into
    // `GuardedOutcomeProps` and lets one property overwrite the other. Both are
    // read off the surviving node rather than inferred from output, so the test
    // fails at the AST if they ever collapse into one field.
    const doc = expandVariants(parse(SOURCE))
    const kept = board(doc, 'ready').children[0] as {
      when?: unknown
      visibleWhen?: { state: string; equals: unknown }
    }
    expect(kept.when).toBeUndefined() // consumed at build time
    expect(kept.visibleWhen).toEqual({ state: 'open', equals: true }) // survives to runtime
  })

  it('applies the build-time scope and the runtime guard independently', () => {
    const doc = expandVariants(parse(SOURCE))
    // `when` removed it from the loading board entirely — the runtime cannot
    // bring back an element that is not in the markup.
    expect(board(doc, 'loading').children).toHaveLength(0)
    expect(board(doc, 'ready').children).toHaveLength(1)
  })

  it('still emits the runtime guard attribute on the board that draws it', () => {
    // Counted on the emitted element rather than on the whole document: the
    // site runtime script names `data-wf-visible-when` twice more as a selector
    // and an attribute read, so a bare occurrence count would be measuring the
    // runtime rather than the markup and would stay green if the attribute
    // stopped being emitted at all.
    const html = renderSite(parse(SOURCE))
    expect((html.match(/<section data-wf-visible-when=/g) ?? []).length).toBe(1)
    expect((html.match(/>both</g) ?? []).length).toBe(1)
  })

  it('leaves a guard untouched on an element with no scope', () => {
    const doc = expandVariants(
      parse(
        'page "P" states=[{ name=open, valueType=boolean, initial=false }] {\n' +
          '  card "C" visibleWhen={ state=open, equals=true } { text "x" }\n' +
          '}',
      ),
    )
    const card = pages(doc)[0].children[0] as { visibleWhen?: unknown }
    expect(card.visibleWhen).toEqual({ state: 'open', equals: true })
  })
})

// ---------------------------------------------------------------------------
// backwards compatibility
// ---------------------------------------------------------------------------

describe('when — backwards compatibility', () => {
  it('returns a document with no scope anywhere unchanged, by identity', () => {
    // Identity rather than deep equality: the renderer builds an anchor map
    // keyed by node object identity, so "equal but rebuilt" is a different
    // outcome from "untouched" and only the second is safe.
    const doc = parse('page "P" id=p {\n  section "S" { text "x" }\n}')
    expect(expandVariants(doc)).toBe(doc)
  })

  it('leaves a variants-only document identical to before the attribute existed', () => {
    const source = 'page "P" variants=[a, b] {\n  section "S" { text "x" }\n}'
    const doc = expandVariants(parse(source))
    expect(pages(doc)).toHaveLength(2)
    for (const page of pages(doc)) {
      expect(titles(page)).toEqual(['S'])
    }
  })

  it('renders an unscoped document byte-for-byte through both surfaces', () => {
    const source = 'page "P" id=p {\n  section "S" { text "x" }\n}\n'
    const first = render(parse(source))
    const second = render(parse(source))
    expect(first.html).toBe(second.html)
    expect(renderSite(parse(source))).toBe(renderSite(parse(source)))
  })
})

// ---------------------------------------------------------------------------
// composition with the other expansion pass
// ---------------------------------------------------------------------------

describe('when — composition with repeat', () => {
  it('does not accept a scope on `repeat` itself, which declares no attributes', () => {
    // `repeat`'s count is positional syntax and it takes no `name=value` pair at
    // all, so `when` on it is a parse error rather than a filtered fold. Pinned
    // because the alternative reading — that a scoped `repeat` silently folds
    // and then vanishes — would be indistinguishable from a working feature
    // until someone counted the boards. Scoping the element *around* it is the
    // supported spelling, and the next test covers it.
    expect(() =>
      parse('page "P" variants=[loading] {\n  repeat 3 when=loading { card "S" { text "s" } }\n}'),
    ).toThrow()
  })

  it('filters a `repeat` through the element that wraps it', () => {
    const doc = expandRepeats(
      expandVariants(
        parse(
          'page "P" variants=[loading, ready] {\n' +
            '  section "Skel" when=loading { repeat 3 { card "S" { text "s" } } }\n' +
            '}',
        ),
      ),
    )
    // The whole fold lands on the board that draws its wrapper, and nothing of
    // it on the board that does not.
    const outer = board(doc, 'loading').children[0] as { children: unknown[] }
    expect(outer.children).toHaveLength(3)
    expect(board(doc, 'ready').children).toHaveLength(0)
  })

  it('scopes an element inside a repeat body on every copy', () => {
    const doc = expandRepeats(
      expandVariants(
        parse(
          'page "P" variants=[loading, ready] {\n' +
            '  repeat 2 { card "C" { text "keep"\n' +
            '    section "S" when=ready { text "deep" } } }\n' +
            '}',
        ),
      ),
    )
    const deepCount = (variant: string) =>
      (JSON.stringify(board(doc, variant).children).match(/"deep"/g) ?? []).length
    // Both copies keep it on the ready board, neither on the loading one — the
    // filter runs before the fold, so it is applied once and copied, not
    // applied per copy.
    expect(deepCount('ready')).toBe(2)
    expect(deepCount('loading')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// diagnostics
// ---------------------------------------------------------------------------

describe('when — validation', () => {
  const messages = (source: string) => validate(parse(source)).errors.map((error) => error.message)

  it('accepts a scope naming a declared variant', () => {
    expect(
      messages('page "P" variants=[loading, ready] {\n  section "S" when=loading { text "x" }\n}'),
    ).toEqual([])
  })

  it('reports a scope naming a variant the page does not declare', () => {
    // Without this the only symptom of a typo is a board missing a section,
    // which reads as a renderer bug rather than as a misspelling — and `when`
    // deletes rather than styles, so the cost is the whole subtree.
    const found = messages(
      'page "P" variants=[loading, ready] {\n  section "S" when=redy { text "x" }\n}',
    )
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('"redy"')
    expect(found[0]).toContain('loading, ready')
  })

  it('reports a scope on a page that declares no variants', () => {
    const found = messages('page "P" {\n  section "S" when=loading { text "x" }\n}')
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('declares no variants=')
  })

  it('reports a child scoped outside its parent — a contradiction', () => {
    const found = messages(
      'page "P" variants=[loading, ready] {\n' +
        '  section "Outer" when=loading {\n' +
        '    section "Inner" when=ready { text "x" }\n' +
        '  }\n' +
        '}',
    )
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('Contradictory')
  })

  it('accepts a child that narrows its parent rather than contradicting it', () => {
    expect(
      messages(
        'page "P" variants=[loading, ready] {\n' +
          '  section "Outer" when=[loading, ready] {\n' +
          '    section "Inner" when=ready { text "x" }\n' +
          '  }\n' +
          '}',
      ),
    ).toEqual([])
  })

  it('reports a name undeclared at any depth', () => {
    const found = messages(
      'page "P" variants=[loading] {\n' +
        '  section "Outer" {\n' +
        '    card "Inner" when=nope { text "x" }\n' +
        '  }\n' +
        '}',
    )
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('"nope"')
  })

  it('reports nothing for a document that uses no scope at all', () => {
    expect(messages('page "P" id=p {\n  section "S" { text "x" }\n}')).toEqual([])
  })
})
