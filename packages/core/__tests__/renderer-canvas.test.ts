/**
 * Multi-page canvas + page-renderer scenarios
 */

import { describe, it, expect } from 'vitest'
import { documentPages, parse } from '../src'
import {
  render,
  renderPage,
  renderCanvas,
  layoutCanvas,
  renderToSvg,
  resolvePageDimensions,
} from '../src/renderer'
import type { PageNode, WireframeDocument } from '../src/ast/types'

const sampleDoc = (src: string): WireframeDocument => parse(src)

/** The document's pages — `children` also holds reuse definitions. */
const samplePages = (src: string): PageNode[] => documentPages(parse(src))

describe('grammar: page at(x, y)', () => {
  it('parses at(x, y) into Page.x / Page.y', () => {
    const doc = sampleDoc(`
      page "Login" at(0, 0) viewport="1280x800" { text "hi" }
      page "Dashboard" at(1344, 0) viewport="1280x800" { text "db" }
    `)
    expect(doc.children).toHaveLength(2)
    expect(doc.children[0].x).toBe(0)
    expect(doc.children[0].y).toBe(0)
    expect(doc.children[1].x).toBe(1344)
    expect(doc.children[1].y).toBe(0)
  })

  it('omits x / y when at() is absent (auto-grid candidate)', () => {
    const doc = sampleDoc(`page "P" { text "x" }`)
    expect(doc.children[0].x).toBeUndefined()
    expect(doc.children[0].y).toBeUndefined()
  })

  it('parses negative coordinates', () => {
    const doc = sampleDoc(`page "P" at(-200, -100) { text "x" }`)
    expect(doc.children[0].x).toBe(-200)
    expect(doc.children[0].y).toBe(-100)
  })

  it('accepts multiple top-level pages separated by whitespace', () => {
    const doc = sampleDoc(`
      page "A" { text "1" }

      page "B" { text "2" }


      page "C" { text "3" }
    `)
    expect(documentPages(doc).map((p) => p.title)).toEqual(['A', 'B', 'C'])
  })
})

describe('renderPage(): pure single-page primitive', () => {
  it('produces identical HTML regardless of sibling pages in the source', () => {
    const onlyPage = samplePages(`page "Solo" viewport="1280x800" { text "x" }`)[0]
    const sibling = samplePages(`
      page "Other" viewport="1280x800" { text "y" }
      page "Solo" viewport="1280x800" { text "x" }
    `)[1]

    const a = renderPage(onlyPage)
    const b = renderPage(sibling)
    expect(a.html).toBe(b.html)
    expect(a.css).toBe(b.css)
    expect(a.width).toBe(b.width)
    expect(a.height).toBe(b.height)
  })

  it('returns resolved pixel dimensions from viewport string', () => {
    const page = samplePages(`page "P" viewport="1280x800" { }`)[0]
    const r = renderPage(page)
    expect(r.width).toBe(1280)
    expect(r.height).toBe(800)
  })

  it('prefers explicit numeric w/h over viewport', () => {
    const page = samplePages(`page "P" w=900 h=600 viewport="1280x800" { }`)[0]
    const r = renderPage(page)
    expect(r.width).toBe(900)
    expect(r.height).toBe(600)
  })
})

describe('layoutCanvas(): coordinate resolution', () => {
  it('respects explicit at() coordinates', () => {
    const doc = sampleDoc(`
      page "A" at(0, 0) viewport="1280x800" { }
      page "B" at(1344, 0) viewport="1280x800" { }
    `)
    const { placed, width, height } = layoutCanvas(documentPages(doc))
    expect(placed.map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [1344, 0],
    ])
    expect(width).toBe(1344 + 1280)
    expect(height).toBe(800)
  })

  it('auto-flows pages without coordinates in a row', () => {
    const doc = sampleDoc(`
      page "A" viewport="1280x800" { }
      page "B" viewport="1280x800" { }
      page "C" viewport="375x812" { }
    `)
    const { placed, width, height } = layoutCanvas(documentPages(doc), 64)
    // A: x=0, B: x=1280+64=1344, C: x=1344+1280+64=2688
    expect(placed[0].x).toBe(0)
    expect(placed[1].x).toBe(1344)
    expect(placed[2].x).toBe(2688)
    expect(width).toBe(2688 + 375)
    // tallest page is 812 (C) — but C starts at y=0, so canvas height = max(800, 812) = 812
    expect(height).toBe(812)
  })

  it('uses the requested gap', () => {
    const doc = sampleDoc(`
      page "A" viewport="1280x800" { }
      page "B" viewport="1280x800" { }
    `)
    const a = layoutCanvas(documentPages(doc), 0)
    expect(a.placed[1].x).toBe(1280)
    const b = layoutCanvas(documentPages(doc), 100)
    expect(b.placed[1].x).toBe(1380)
  })
})

describe('renderCanvas(): bounded layout output', () => {
  const doc = () =>
    sampleDoc(`
      page "Login" at(0, 0) viewport="1280x800" { text "x" }
      page "Dashboard" at(1344, 0) viewport="1280x800" { text "y" }
    `)

  it('places boards at exact coordinates with no decoration', () => {
    const r = renderCanvas(doc())
    expect(r.width).toBe(1344 + 1280)
    expect(r.height).toBe(800)
    expect(r.html).toContain('wf-canvas')
    expect(r.html).toContain('wf-canvas-board')
    expect(r.html).toContain(`width: ${1344 + 1280}px`)
    expect(r.html).toContain('height: 800px')
  })

  it('emits absolute-positioned boards at the layoutCanvas coordinates', () => {
    const r = renderCanvas(doc())
    expect(r.html).toContain('left: 0px')
    expect(r.html).toContain('left: 1344px')
    expect(r.html).toContain('width: 1280px')
  })

  it('exposes page metadata via data-* attributes for hosts', () => {
    const r = renderCanvas(doc())
    expect(r.html).toContain('data-page-count="2"')
    expect(r.html).toContain('data-page-x="0"')
    expect(r.html).toContain('data-page-x="1344"')
    expect(r.html).toContain('data-page-w="1280"')
    expect(r.html).toContain('data-page-h="800"')
    expect(r.html).toContain('data-page-title="Login"')
    expect(r.html).toContain('data-page-title="Dashboard"')
  })

  it('emits no chrome / decoration / grid markup', () => {
    const r = renderCanvas(doc())
    expect(r.html).not.toContain('wf-canvas-board-frame')
    expect(r.html).not.toContain('wf-canvas-board-label')
    expect(r.html).not.toContain('linear-gradient')
    expect(r.html).not.toContain('data-chrome')
  })

  it('returns an empty bounded canvas for a doc with no pages', () => {
    const empty: WireframeDocument = { type: 'Document', children: [] }
    const r = renderCanvas(empty)
    expect(r.width).toBe(0)
    expect(r.height).toBe(0)
    expect(r.html).toContain('data-empty="true"')
    expect(r.html).not.toContain('wf-canvas-board')
  })

  it('handles mixed viewports (desktop + mobile) on one canvas', () => {
    const mixed = sampleDoc(`
      page "Desk" at(0, 0) viewport="1280x800" { }
      page "Mob" at(0, 832) viewport="375x812" { }
    `)
    const r = renderCanvas(mixed)
    expect(r.width).toBe(1280)
    expect(r.height).toBe(832 + 812)
  })

  it('omits styles when includeStyles=false', () => {
    const r = renderCanvas(doc(), { includeStyles: false })
    expect(r.css).toBe('')
    expect(r.html).toContain('wf-canvas')
  })

  // Board-scoping regression: a drawer inside page N must stay within its own
  // board, not escape to the canvas/viewport top-left. The board is a
  // positioned ancestor (position:absolute), so the drawer's position:absolute
  // scopes it to the board — same mechanism the modal backdrop uses.
  it('keeps a drawer scoped to its board (absolute, not viewport-fixed)', () => {
    const withDrawer = sampleDoc(`
      page "Login" at(0, 0) viewport="1280x800" { text "x" }
      page "Dashboard" at(1344, 0) viewport="1280x800" {
        drawer "Menu" position="left" { text "item" }
      }
    `)
    const r = renderCanvas(withDrawer)
    // Drawer is nested inside a board wrapper, not a sibling of the canvas root.
    expect(r.html).toContain('wf-canvas-board')
    expect(r.html).toContain('wf-drawer')
    // CSS scopes the drawer to its nearest positioned ancestor (the board).
    expect(r.css).toContain(`.wf-drawer {
  position: absolute;`)
    expect(r.css).not.toContain('position: fixed')
  })
})

describe('render(): page-count routing', () => {
  it('single page → legacy mode (no canvas wrapper)', () => {
    const doc = sampleDoc(`page "Solo" viewport="1280x800" { text "x" }`)
    const r = render(doc)
    expect(r.html).not.toContain('wf-canvas')
    expect(r.html).toContain('wf-page')
  })

  it('multi-page → canvas wrapper with bounded layout', () => {
    const doc = sampleDoc(`
      page "A" viewport="1280x800" { }
      page "B" viewport="1280x800" { }
    `)
    const r = render(doc)
    expect(r.html).toContain('wf-canvas')
    expect(r.html).toContain('wf-canvas-board')
    expect(r.html).not.toContain('data-chrome')
  })
})

describe('renderToSvg(): multi-page sizing', () => {
  it('single page → uses page dimensions for viewBox', () => {
    const doc = sampleDoc(`page "A" viewport="1280x800" { }`)
    const r = renderToSvg(doc)
    expect(r.width).toBe(1280)
    expect(r.height).toBe(800)
  })

  it('multi-page → uses canvas bounding box for viewBox', () => {
    const doc = sampleDoc(`
      page "A" at(0, 0) viewport="1280x800" { }
      page "B" at(1344, 0) viewport="1280x800" { }
    `)
    const r = renderToSvg(doc)
    expect(r.width).toBe(1344 + 1280)
    expect(r.height).toBe(800)
    // wraps the canvas div, not a single page
    expect(r.svg).toContain('wf-canvas')
  })
})

describe('resolvePageDimensions()', () => {
  it('falls back to viewport when w/h not numeric', () => {
    const page = samplePages(`page "P" viewport="1440x900" { }`)[0]
    expect(resolvePageDimensions(page)).toEqual({ width: 1440, height: 900 })
  })
})
