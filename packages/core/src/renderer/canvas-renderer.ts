/**
 * Canvas renderer — multi-page composition.
 *
 * `renderCanvas` lays out one or more pages on a single bounded canvas. The
 * DSL stays page-centric — coordinates come from each page's optional
 * `at(x, y)` attribute (resolved into `Page.x` / `Page.y` by the parser).
 * Pages without coordinates auto-flow horizontally with `gap` between them.
 *
 * Output is intentionally minimal: a bounded `<div class="wf-canvas">` of the
 * exact layout extent, containing absolutely-positioned `<div class="wf-canvas-board">`
 * wrappers around each page's HTML. No chrome, no decoration, no grid, no
 * labels. Hosts (dashboard editor, markdown plugin, VSCode preview) wrap this
 * output in their own viewport / grid / pan-zoom layers.
 *
 * `layoutCanvas` is exposed as a pure utility so hosts that want to compose
 * the canvas DOM themselves can reuse the placement math.
 */

import type { WireframeDocument, PageNode } from '../ast/types'
import { documentPages } from '../ast/utils'
import type { CanvasOptions, CanvasRenderResult } from './types'
import { HtmlRenderer } from './html'
import { resolvePageDimensions } from './page-renderer'
import { generateStyles } from './styles'
import { defaultTheme, darkTheme } from './types'

const DEFAULT_GAP = 64
const DEFAULT_PREFIX = 'wf'

export interface PlacedPage {
  page: PageNode
  x: number
  y: number
  w: number
  h: number
}

/**
 * Compute each page's position on the canvas and the bounding canvas size.
 *
 * Per-page mode:
 * - `Page.x` / `Page.y` set → placed at exactly those coordinates.
 * - Either missing → auto-flow: continues from the running cursor in a
 *   single horizontal row, advancing by `width + gap` after each
 *   auto-placed page. The cursor is unaffected by explicitly-placed pages.
 *
 * Mixed documents are allowed (ux-rules will warn) but explicit pages may
 * overlap auto pages — that is the author's responsibility.
 */
export function layoutCanvas(
  pages: PageNode[],
  gap: number = DEFAULT_GAP,
): { placed: PlacedPage[]; width: number; height: number } {
  const placed: PlacedPage[] = []
  let cursorX = 0
  let maxRight = 0
  let maxBottom = 0

  for (const page of pages) {
    const { width, height } = resolvePageDimensions(page)
    const explicitX = typeof page.x === 'number' ? page.x : undefined
    const explicitY = typeof page.y === 'number' ? page.y : undefined

    const x = explicitX ?? cursorX
    const y = explicitY ?? 0

    placed.push({ page, x, y, w: width, h: height })

    if (explicitX === undefined) {
      cursorX = x + width + gap
    }

    maxRight = Math.max(maxRight, x + width)
    maxBottom = Math.max(maxBottom, y + height)
  }

  return { placed, width: maxRight, height: maxBottom }
}

/**
 * Render a multi-page document to a single bounded canvas of HTML + CSS.
 *
 * Output: `<div class="wf-canvas" style="width:Wpx; height:Hpx; position:relative">`
 * containing one `<div class="wf-canvas-board">` per page, absolutely
 * positioned at the layout coordinates.
 */
export function renderCanvas(
  doc: WireframeDocument,
  options: CanvasOptions = {},
): CanvasRenderResult {
  const gap = options.gap ?? DEFAULT_GAP
  const prefix = options.classPrefix ?? DEFAULT_PREFIX
  const includeStyles = options.includeStyles !== false

  const theme = options.theme === 'dark' ? darkTheme : defaultTheme
  const css = includeStyles ? generateStyles(theme, prefix) : ''
  const pages = documentPages(doc)

  if (pages.length === 0) {
    return {
      html: `<div class="${prefix}-canvas" data-empty="true"></div>`,
      css,
      width: 0,
      height: 0,
    }
  }

  const { placed, width, height } = layoutCanvas(pages, gap)

  // Each page is rendered in isolation, so its anchor page-index is seeded with
  // the page's true position in the document (pageIndexBase) to keep paths like
  // `2.1.0` consistent with a whole-document render.
  const boards = placed
    .map((p, pageIndex) => {
      const pageRenderer = new HtmlRenderer({ ...options, includeStyles: false }, pageIndex)
      const { html: pageHtml } = pageRenderer.render({
        type: 'Document',
        children: [p.page],
      })
      return wrapBoard(pageHtml, p, prefix)
    })
    .join('\n')

  const canvasStyle = `position: relative; width: ${width}px; height: ${height}px;`
  const html = `<div class="${prefix}-canvas" style="${canvasStyle}" data-page-count="${placed.length}">\n${boards}\n</div>`

  return { html, css, width, height }
}

function wrapBoard(pageHtml: string, placed: PlacedPage, prefix: string): string {
  const { x, y, w, h, page } = placed
  const positionStyle = `position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px;`
  const titleAttr = page.title ? ` data-page-title="${escapeAttr(page.title)}"` : ''
  const dataAttrs = ` data-page-x="${x}" data-page-y="${y}" data-page-w="${w}" data-page-h="${h}"${titleAttr}`

  return `<div class="${prefix}-canvas-board" style="${positionStyle}"${dataAttrs}>\n${pageHtml}\n</div>`
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
