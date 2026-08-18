/**
 * `page … variants=[a, b, c]` — parsing, expansion, addressing, and composition.
 *
 * The feature turns one authored page into several boards, which means the
 * things that can break are the things that were previously one-per-page:
 * screen indices, id scopes, the name map, and a shared shell. Each is a group
 * below.
 *
 * The load-bearing case throughout is the *negative* one — a document with no
 * `variants` must render exactly as it did before this attribute existed. That
 * is asserted directly (identity-preserving expansion, unchanged screen count)
 * rather than left to the rest of the suite, because every wireframe already
 * written is that case.
 */

import { describe, expect, it } from 'vitest'
import { parse } from '../src/parser'
import { printWireframe } from '../src/printer'
import { render, renderSite } from '../src/renderer'
import { buildSiteModel } from '../src/renderer/site/model'
import { collectInteractions } from '../src/interaction/model'
import { validate } from '../src/validation'
import { expandVariants } from '../src/ast'
import { buildAnchorPathMap } from '../src/ast/anchor-path'
import type { PageNode, WireframeDocument } from '../src/ast'

/** The pages of a document, after whatever transformation the test is about. */
function pages(doc: WireframeDocument): PageNode[] {
  return doc.children.filter((child): child is PageNode => child.type === 'Page')
}

/** Every value of a `data-` attribute in render output, in document order. */
function marks(html: string, attribute: string): string[] {
  return [...html.matchAll(new RegExp(`${attribute}="([^"]*)"`, 'g'))].map((m) => m[1])
}

const SHELL = `
layout shell {
  header { text "chrome" }
  slot
}
`

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

describe('variants — parsing', () => {
  it('parses a bracketed list of bare identifiers onto the page', () => {
    const doc = parse('page "Dash" variants=[loading, empty, ready] {\n  text "x"\n}')
    expect(pages(doc)[0].variants).toEqual(['loading', 'empty', 'ready'])
  })

  it('validates — the attribute is declared on page', () => {
    const result = validate(parse('page "Dash" variants=[loading, ready] {\n  text "x"\n}'))
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('round-trips through the printer as the list, not as the boards', () => {
    const source = 'page "Dash" id=dash variants=[loading, ready] {\n  text "x"\n}'
    const printed = printWireframe(parse(source))
    expect(printed).toContain('variants=["loading", "ready"]')
    expect(pages(parse(printed))[0].variants).toEqual(['loading', 'ready'])
  })
})

// ---------------------------------------------------------------------------
// expansion
// ---------------------------------------------------------------------------

describe('variants — expansion', () => {
  it('turns one page into one page per variant', () => {
    const doc = expandVariants(
      parse('page "Dash" variants=[loading, empty, ready] {\n  text "x"\n}'),
    )
    expect(pages(doc).map((page) => page.variant)).toEqual(['loading', 'empty', 'ready'])
  })

  it('clears `variants` on each board, so expansion is idempotent', () => {
    const once = expandVariants(parse('page "P" variants=[a, b] {\n  text "x"\n}'))
    expect(pages(once).every((page) => page.variants === undefined)).toBe(true)
    expect(expandVariants(once)).toBe(once)
  })

  it('returns a document with no variants unchanged, identity included', () => {
    const doc = parse('page "P" {\n  text "x"\n}')
    expect(expandVariants(doc)).toBe(doc)
  })

  it('gives every board a distinct node identity, so the anchor index sees them all', () => {
    // The reason expansion deep-clones: `buildAnchorPathMap` is keyed by node
    // object identity, so boards sharing a child tree would leave every board
    // but the first without a `data-wf-path`.
    const doc = expandVariants(parse('page "P" variants=[a, b] {\n  text "x"\n}'))
    const [first, second] = pages(doc)
    expect(first).not.toBe(second)
    expect(first.children[0]).not.toBe(second.children[0])
    expect(buildAnchorPathMap(doc).size).toBe(new Set(buildAnchorPathMap(doc).values()).size)
  })

  it('drops blank and duplicate names rather than drawing unreachable twins', () => {
    const doc = expandVariants(parse('page "P" variants=[a, a, "", b] {\n  text "x"\n}'))
    expect(pages(doc).map((page) => page.variant)).toEqual(['a', 'b'])
  })

  it('leaves a page whose list is empty as one board with no variant', () => {
    const doc = expandVariants(parse('page "P" variants=[] {\n  text "x"\n}'))
    expect(pages(doc)).toHaveLength(1)
    expect(pages(doc)[0].variant).toBeUndefined()
  })

  it('contributes a page’s `states` once, not once per board', () => {
    // `states` is document-scoped and a page *contributes* to it, so copying it
    // onto every board would declare the same state N times and report N-1
    // duplicates about a document the author wrote once.
    const source =
      'page "P" states=[{ name=busy, valueType=boolean, initial=false }] variants=[a, b] {\n  text "x"\n}'
    const model = collectInteractions(expandVariants(parse(source)))
    expect(model.diagnostics).toEqual([])
    expect(model.states.map((state) => state.name)).toEqual(['busy'])
  })
})

// ---------------------------------------------------------------------------
// screens
// ---------------------------------------------------------------------------

describe('variants — screens', () => {
  it('renders one screen per variant', () => {
    const site = renderSite(parse('page "Dash" variants=[loading, empty, ready] {\n  text "x"\n}'))
    expect(marks(site, 'data-screen-count')).toEqual(['3'])
    expect(marks(site, 'data-wf-variant')).toEqual(['loading', 'empty', 'ready'])
  })

  it('leaves a document with no variants at one screen per page', () => {
    const site = renderSite(parse('page "A" {\n  text "x"\n}\npage "B" {\n  text "y"\n}'))
    expect(marks(site, 'data-screen-count')).toEqual(['2'])
    expect(marks(site, 'data-wf-variant')).toEqual([])
  })

  it('gives every board its own id scope', () => {
    const site = renderSite(
      parse('page "Dash" variants=[loading, empty, ready] {\n  input "q" id=field\n}'),
    )
    const scopes = marks(site, 'data-id-scope')
    expect(scopes).toEqual(['s0-', 's1-', 's2-'])
    expect(new Set(scopes).size).toBe(scopes.length)
  })

  it('numbers screens over the boards, so indices stay unique across pages', () => {
    const model = buildSiteModel(
      expandVariants(parse('page "A" variants=[x, y] {\n  text "a"\n}\npage "B" {\n  text "b"\n}')),
    )
    expect(model.screens.map((screen) => screen.index)).toEqual([0, 1, 2])
  })

  it('draws each board on the canvas too, so `render` and `renderSite` agree', () => {
    const html = render(parse('page "Dash" variants=[loading, ready] {\n  text "x"\n}')).html
    expect(marks(html, 'data-wf-variant')).toEqual(['loading', 'ready'])
    expect(marks(html, 'data-page-count')).toEqual(['2'])
  })
})

// ---------------------------------------------------------------------------
// addressing
// ---------------------------------------------------------------------------

describe('variants — addressing', () => {
  const doc = () =>
    expandVariants(parse('page "Dash" id=dash variants=[loading, empty, ready] {\n  text "x"\n}'))

  it('gives the bare name to the first board, so `navigate=dash` still resolves', () => {
    expect(buildSiteModel(doc()).names.get('dash')).toBe(0)
    expect(buildSiteModel(doc()).names.get('Dash')).toBe(0)
  })

  it('addresses every board by `name#variant`', () => {
    const names = buildSiteModel(doc()).names
    expect(names.get('dash#loading')).toBe(0)
    expect(names.get('dash#empty')).toBe(1)
    expect(names.get('dash#ready')).toBe(2)
  })

  it('qualifies the title namespace as well as the id namespace', () => {
    const names = buildSiteModel(doc()).names
    expect(names.get('Dash#empty')).toBe(1)
  })

  it('lets a later board own its qualified name rather than a name that navigates elsewhere', () => {
    const screens = buildSiteModel(doc()).screens
    expect(screens.map((screen) => screen.name)).toEqual([
      'dash#loading',
      'dash#empty',
      'dash#ready',
    ])
  })

  it('resolves a `navigate` to a specific board', () => {
    const site = renderSite(
      parse(
        `page "Dash" id=dash variants=[loading, ready] {\n  text "x"\n}\n` +
          `page "Home" id=home {\n  button "go" navigate="dash#ready"\n}`,
      ),
    )
    expect(site).toContain('dash#ready')
  })

  it('publishes no qualified name for a page whose bare name an earlier page took', () => {
    // The duplicate `id` loses the name to the first declarer, so publishing
    // `dup#a` here would hand out an address into a page that never declared
    // that variant.
    const names = buildSiteModel(
      expandVariants(
        parse(
          'page "First" id=dup {\n  text "x"\n}\npage "Second" id=dup variants=[a] {\n  text "y"\n}',
        ),
      ),
    ).names
    expect(names.get('dup')).toBe(0)
    expect(names.has('dup#a')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// composition with a shell
// ---------------------------------------------------------------------------

describe('variants — shells', () => {
  const site = () =>
    renderSite(
      parse(
        `${SHELL}page "Dash" id=dash uses=shell variants=[loading, empty, ready] {\n  text "x"\n}`,
      ),
    )

  it('emits the shared shell once, however many boards use it', () => {
    expect(marks(site(), 'data-shell-count')).toEqual(['1'])
    expect(site().match(/wf-page wf-shell/g)).toHaveLength(1)
  })

  it('hosts every board inside that one shell', () => {
    const model = buildSiteModel(
      expandVariants(parse(`${SHELL}page "D" uses=shell variants=[a, b, c] {\n  text "x"\n}`)),
    )
    expect(model.shells).toHaveLength(1)
    expect(model.shells[0].screens.map((screen) => screen.variant)).toEqual(['a', 'b', 'c'])
  })

  it('keeps the shell scope distinct from every board scope', () => {
    const scopes = marks(site(), 'data-id-scope')
    expect(scopes[0]).toBe('l0-')
    expect(new Set(scopes).size).toBe(scopes.length)
  })
})
