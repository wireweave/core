/**
 * Source-anchor tests — E2 (DOM ↔ AST ↔ source mapping).
 *
 * Covers the opt-in `sourceAnchors` render option (data-wf-path / data-wf-loc)
 * and the extract-side mapping APIs (buildAnchorIndex / resolveAnchor /
 * getPageSource / getNodeSource / buildDomTree), including the invariant that
 * the anchors the renderer emits and the index the extractor builds share one
 * path scheme and can never diverge.
 */

import { describe, it, expect } from 'vitest'
import {
  parse,
  render,
  renderCanvas,
  buildAnchorIndex,
  resolveAnchor,
  getPageSource,
  getNodeSource,
  buildDomTree,
  documentPages,
} from '../src'

const SRC = `page "Login" {
  card {
    input "Email" required
    button "Sign in" navigate="Dashboard"
  }
}
page "Dashboard" {
  text "Welcome"
}`

const SINGLE = `page "Home" {
  card {
    text "Hi"
  }
}`

const anchorPaths = (html: string): string[] =>
  [...html.matchAll(/data-wf-path="([^"]+)"/g)].map((m) => m[1])

describe('sourceAnchors render option', () => {
  it('emits no anchor attributes by default (regression guard)', () => {
    const single = render(parse(SINGLE)).html
    expect(single).not.toContain('data-wf-path')
    expect(single).not.toContain('data-wf-loc')

    const multi = render(parse(SRC)).html // multi-page → canvas mode
    expect(multi).not.toContain('data-wf-path')
    expect(multi).not.toContain('data-wf-loc')

    expect(renderCanvas(parse(SRC)).html).not.toContain('data-wf-path')
  })

  it('is purely additive — stripping anchors yields byte-identical default output', () => {
    for (const source of [SINGLE, SRC]) {
      const doc = parse(source)
      const plain = render(doc).html
      const anchored = render(doc, { sourceAnchors: true }).html
      const stripped = anchored
        .replace(/ data-wf-path="[^"]*"/g, '')
        .replace(/ data-wf-loc="[^"]*"/g, '')
      expect(stripped).toBe(plain)
    }
  })

  it('anchors every component element and stays in lock step with the index', () => {
    const doc = parse(SRC)
    const { html } = render(doc, { sourceAnchors: true })
    const paths = anchorPaths(html)
    const index = buildAnchorIndex(doc)

    // One anchor per indexed node, no duplicates, all resolvable.
    expect(paths.length).toBe(index.size)
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) {
      expect(index.has(path)).toBe(true)
      expect(resolveAnchor(doc, path)).toBeDefined()
    }
  })

  it('data-wf-loc matches the node source offsets', () => {
    const doc = parse(SRC)
    const { html } = render(doc, { sourceAnchors: true })
    const input = resolveAnchor(doc, '0.0.0')
    expect(input?.type).toBe('Input')
    const loc = input?.loc
    expect(loc).toBeDefined()
    expect(html).toContain(
      `data-wf-path="0.0.0" data-wf-loc="${loc?.start.offset}-${loc?.end.offset}"`,
    )
  })

  it('carries page-index paths on canvas boards (multi-page)', () => {
    const doc = parse(SRC)
    const { html } = renderCanvas(doc, { sourceAnchors: true })
    // Page 0 and page 1 each anchored with their true document index.
    expect(html).toContain('data-wf-path="0"')
    expect(html).toContain('data-wf-path="1"')
    // Descendant of the second page keeps the `1.` prefix, not `0.`.
    expect(html).toContain('data-wf-path="1.0"')

    const paths = anchorPaths(html)
    expect(paths.length).toBe(buildAnchorIndex(doc).size)
    for (const path of paths) expect(resolveAnchor(doc, path)).toBeDefined()
  })
})

describe('resolveAnchor / buildAnchorIndex', () => {
  it('resolves paths to the exact AST node', () => {
    const doc = parse(SRC)
    expect(resolveAnchor(doc, '0')?.type).toBe('Page')
    expect(resolveAnchor(doc, '0.0')?.type).toBe('Card')
    expect(resolveAnchor(doc, '0.0.0')?.type).toBe('Input')
    expect(resolveAnchor(doc, '0.0.1')?.type).toBe('Button')
    expect(resolveAnchor(doc, '1')?.type).toBe('Page')
    expect(resolveAnchor(doc, '1.0')?.type).toBe('Text')

    // Anchor index entries carry the same node and its location.
    const index = buildAnchorIndex(doc)
    const entry = index.get('0.0.0')
    expect(entry?.node).toBe(resolveAnchor(doc, '0.0.0'))
    expect(entry?.loc).toEqual(resolveAnchor(doc, '0.0.0')?.loc)
  })

  it('returns undefined for malformed or out-of-range paths', () => {
    const doc = parse(SRC)
    expect(resolveAnchor(doc, '')).toBeUndefined()
    expect(resolveAnchor(doc, 'bad')).toBeUndefined()
    expect(resolveAnchor(doc, '9')).toBeUndefined()
    expect(resolveAnchor(doc, '0.9')).toBeUndefined()
    expect(resolveAnchor(doc, '0.0.0.0')).toBeUndefined()
  })
})

describe('getPageSource / getNodeSource', () => {
  it('slices a page and re-parses to an equivalent single-page document', () => {
    const doc = parse(SRC)
    const slice = getPageSource(SRC, doc, 1)
    expect(slice).toBeDefined()
    expect(slice?.text).toBe(SRC.slice(slice!.loc.start.offset, slice!.loc.end.offset))

    const reparsed = parse(slice!.trimmed)
    expect(reparsed.children).toHaveLength(1)
    expect(reparsed.children[0]?.type).toBe('Page')
    expect(documentPages(reparsed)[0]?.title).toBe('Dashboard')
    // Structurally equivalent to the original page (child node types match).
    expect(reparsed.children[0]?.children.map((c) => c.type)).toEqual(
      doc.children[1]?.children.map((c) => c.type),
    )
  })

  it('returns undefined for an out-of-range page index', () => {
    const doc = parse(SRC)
    expect(getPageSource(SRC, doc, 5)).toBeUndefined()
  })

  it('slices any node by its anchor path', () => {
    const doc = parse(SRC)
    expect(getNodeSource(SRC, doc, '0.0')?.trimmed.startsWith('card')).toBe(true)
    expect(getNodeSource(SRC, doc, '0.0.1')?.trimmed).toContain('Sign in')
    expect(getNodeSource(SRC, doc, '9')).toBeUndefined()
  })
})

describe('buildDomTree', () => {
  it('mirrors the anchored render tree as a panel-ready structure', () => {
    const doc = parse(SRC)
    const tree = buildDomTree(doc)

    expect(tree).toHaveLength(2)
    expect(tree[0]).toMatchObject({ path: '0', nodeType: 'Page' })

    const card = tree[0].children[0]
    expect(card).toMatchObject({ path: '0.0', nodeType: 'Card' })
    expect(typeof card.category).toBe('string')
    expect(card.children.map((c) => c.nodeType)).toEqual(['Input', 'Button'])
    expect(card.children[0]).toMatchObject({ path: '0.0.0', nodeType: 'Input', label: 'Email' })

    expect(tree[1]).toMatchObject({ path: '1', nodeType: 'Page' })
    expect(tree[1].children.map((c) => c.nodeType)).toEqual(['Text'])
  })
})
