/**
 * @wireweave/markdown-plugin
 *
 * Markdown plugins for wireweave
 */

import {
  documentPages,
  parse,
  render,
  renderToSvg,
  resolveViewport,
  wrapInPreviewContainer,
} from '@wireweave/core'

export interface WireframePluginOptions {
  /**
   * Output format
   * - 'html': HTML/CSS rendering (inline styles)
   * - 'html-preview': HTML with preview container (supports scaling)
   * - 'svg': SVG image
   * - 'svg-img': base64 encoded img tag
   */
  format?: 'html' | 'html-preview' | 'svg' | 'svg-img'

  /**
   * Theme for rendering
   * - 'light': Light theme
   * - 'dark': Dark theme
   */
  theme?: 'light' | 'dark'

  /**
   * Container class for wrapping SVG/HTML
   */
  containerClass?: string

  /**
   * Error handling mode
   * - 'code': Show original code
   * - 'error': Show error message
   * - 'both': Show both
   */
  errorHandling?: 'code' | 'error' | 'both'

  /**
   * Container width for preview scaling (in pixels)
   * When set, the wireframe will be scaled to fit this width
   */
  containerWidth?: number

  /**
   * Maximum scale factor (default: 1)
   * Prevents the preview from being scaled up beyond this value
   */
  maxScale?: number
}

const defaultOptions: Required<WireframePluginOptions> = {
  format: 'svg-img',
  theme: 'light',
  containerClass: 'wireframe-container',
  errorHandling: 'both',
  containerWidth: 0, // 0 means no scaling
  maxScale: 1,
}

/**
 * Render wireframe code to output format
 */
export function renderWireframe(code: string, options: WireframePluginOptions = {}): string {
  const opts = { ...defaultOptions, ...options }

  try {
    const doc = parse(code)

    switch (opts.format) {
      case 'html': {
        const { html, css } = render(doc, { theme: opts.theme })
        return `
          <div class="${opts.containerClass}">
            <style>${css}</style>
            ${html}
          </div>
        `.trim()
      }

      case 'html-preview': {
        const { html, css } = render(doc, { theme: opts.theme })
        // Document children include `layout` / `component` definitions; the
        // preview viewport comes from the first *page*.
        const firstPage = documentPages(doc)[0]
        const viewport = resolveViewport(firstPage?.viewport, firstPage?.device)

        const previewHtml = wrapInPreviewContainer(html, viewport, {
          darkMode: opts.theme === 'dark',
          containerWidth: opts.containerWidth > 0 ? opts.containerWidth : undefined,
        })

        return `
          <div class="${opts.containerClass}">
            <style>${css}</style>
            ${previewHtml}
          </div>
        `.trim()
      }

      case 'svg': {
        const { svg } = renderToSvg(doc)
        return `<div class="${opts.containerClass}">${svg}</div>`
      }

      case 'svg-img':
      default: {
        const { svg } = renderToSvg(doc)
        // Use btoa for browser compatibility, Buffer for Node.js
        const base64 =
          typeof Buffer !== 'undefined' ? Buffer.from(svg).toString('base64') : btoa(svg)
        return `
          <div class="${opts.containerClass}">
            <img src="data:image/svg+xml;base64,${base64}" alt="Wireframe" />
          </div>
        `.trim()
      }
    }
  } catch (error) {
    return renderError(code, error as Error, opts)
  }
}

function renderError(
  code: string,
  error: Error,
  options: Required<WireframePluginOptions>,
): string {
  const errorHtml = `<pre class="wireframe-error">${escapeHtml(error.message)}</pre>`
  const codeHtml = `<pre class="wireframe-source"><code>${escapeHtml(code)}</code></pre>`

  switch (options.errorHandling) {
    case 'code':
      return codeHtml
    case 'error':
      return errorHtml
    case 'both':
    default:
      return `<div class="${options.containerClass} wireframe-error-container">${errorHtml}${codeHtml}</div>`
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export { markdownItWireframe } from './markdown-it'
export { markedWireframe } from './marked'
export { remarkableWireframe } from './remarkable'
