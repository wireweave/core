/**
 * Renderer module for wireweave
 *
 * Provides render functions to convert AST to HTML/CSS and SVG
 */

import type { WireframeDocument } from '../ast/types'
import { documentPages } from '../ast/utils'
import { createHtmlRenderer } from './html'
import type {
  RenderOptions,
  RenderResult,
  SvgRenderOptions,
  SvgRenderResult,
  CanvasOptions,
} from './types'
import { renderCanvas } from './canvas-renderer'
import { resolvePageDimensions } from './page-renderer'

// Re-export types
export * from './types'
export { HtmlRenderer, createHtmlRenderer } from './html'
export { generateStyles } from './styles'
export { generateComponentStyles } from './styles-components'

// Multi-page primitives — see canvas-renderer.ts / page-renderer.ts for the
// architecture rationale. `renderPage` is the export-side single source of
// truth; `renderCanvas` is the display-side composition.
export { renderPage, resolvePageDimensions } from './page-renderer'
export { renderCanvas, layoutCanvas } from './canvas-renderer'
export type { PlacedPage } from './canvas-renderer'
export { renderSite, buildSiteModel } from './site'
export type { SiteOptions, SiteModel, SiteScreen, SiteShell, ShellMiss } from './site'

// Re-export icons (ensures they're bundled with renderer)
export {
  getIconData,
  renderIconSvg,
  renderUnknownIconSvg,
  lucideIcons,
} from '../icons/lucide-icons'
export type { IconData, IconElement } from '../icons/lucide-icons'

/**
 * Render AST to HTML and CSS.
 *
 * Two modes, decided automatically by page count:
 *   1. Multiple pages → canvas mode (bounded layout, absolutely-positioned
 *      boards). Hosts wrap this in their own viewport / grid / pan-zoom layer.
 *   2. Single page → legacy mode (page only, no canvas wrapper) for
 *      backward compatibility with single-page consumers (markdown-plugin,
 *      dashboard previews, vscode-extension).
 *
 * Use `renderPage(page)` for explicit single-page export, or
 * `renderCanvas(doc)` for explicit multi-page composition.
 */
export function render(
  document: WireframeDocument,
  options: RenderOptions | CanvasOptions = {},
): RenderResult {
  const isMultiPage = documentPages(document).length > 1

  if (isMultiPage) {
    const result = renderCanvas(document, options)
    return { html: result.html, css: result.css }
  }

  const renderer = createHtmlRenderer(options)
  return renderer.render(document)
}

/**
 * Render AST to standalone HTML with embedded CSS
 *
 * @param document - Parsed wireframe document
 * @param options - Render options
 * @returns Complete HTML document string
 */
export function renderToHtml(document: WireframeDocument, options: RenderOptions = {}): string {
  const { html, css } = render(document, options)
  const prefix = options.classPrefix ?? 'wf'

  // Viewport framing depends on page count:
  //   Single page → center in the viewport (looks nice for one small board).
  //   Multi-page  → the canvas is a bounded layout usually wider/taller than the
  //     viewport; anchor it top-left so every screen stays reachable by scrolling.
  //     Centering an oversized canvas pushes its left/top edge into a negative,
  //     unreachable scroll offset — only the middle screen shows, which looks
  //     like multi-page rendering being broken.
  const isMultiPage = documentPages(document).length > 1
  const bodyAlign = isMultiPage
    ? 'justify-content: flex-start;\n  align-items: flex-start;'
    : 'justify-content: center;\n  align-items: center;'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe</title>
  <style>
/* Viewport framing: center a single page, anchor a multi-page canvas top-left */
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f4f4f5;
}
body {
  display: flex;
  ${bodyAlign}
  padding: 24px;
  box-sizing: border-box;
}
/* Fixed-layout invariant: the multi-page canvas is a flex item of <body> and
   must keep its intrinsic size when the viewport is narrower than the canvas.
   Without flex-shrink:0 the flex item shrinks and the boards reflow — the same
   defect class as .wf-page (see no-responsive.md). Single pages already carry
   flex-shrink:0 via generateStyles; the canvas wrapper needs it here. */
.${prefix}-canvas {
  flex-shrink: 0;
}
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`
}

/**
 * Render AST to SVG using foreignObject with HTML+CSS
 *
 * This approach embeds HTML+CSS inside SVG using foreignObject,
 * which allows CSS flexbox/grid layouts to work properly.
 *
 * Multi-page documents are auto-rendered as a bounded canvas, with the
 * SVG viewBox sized to the canvas bounding box. Single-page documents
 * keep their legacy single-page sizing.
 *
 * @param document - Parsed wireframe document
 * @param options - SVG render options
 * @returns Object containing SVG string and dimensions
 */
export function renderToSvg(
  document: WireframeDocument,
  options: SvgRenderOptions = {},
): SvgRenderResult {
  const isMultiPage = documentPages(document).length > 1
  let width = options.width ?? 800
  let height = options.height ?? 600
  let html: string
  let css: string

  if (isMultiPage) {
    const canvas = renderCanvas(document, {
      theme: options.theme ?? 'light',
    })
    if (options.width === undefined && options.height === undefined) {
      width = canvas.width
      height = canvas.height
    }
    html = canvas.html
    css = canvas.css
  } else {
    const firstPage = documentPages(document)[0]
    if (firstPage && options.width === undefined && options.height === undefined) {
      const dims = resolvePageDimensions(firstPage)
      width = dims.width
      height = dims.height
    }
    const result = render(document, { theme: options.theme ?? 'light' })
    html = result.html
    css = result.css
  }

  const background = options.background ?? '#ffffff'

  // Build SVG with foreignObject containing HTML+CSS
  // Use same wrapper styles as renderToHtml for consistency
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${background}"/>
  <foreignObject x="0" y="0" width="${width}" height="${height}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    ">
      <style type="text/css">
${css}
      </style>
      ${html}
    </div>
  </foreignObject>
</svg>`

  return { svg, width, height }
}
