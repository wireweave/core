/**
 * Renderer module for wireweave
 *
 * Provides render functions to convert AST to HTML/CSS and SVG
 */

import type { WireframeDocument } from '../ast/types';
import { createHtmlRenderer } from './html';
import type { RenderOptions, RenderResult, SvgRenderOptions, SvgRenderResult } from './types';
import { resolveViewport } from '../viewport';

// Re-export types
export * from './types';
export { HtmlRenderer, createHtmlRenderer } from './html';
export { generateStyles } from './styles';
export { generateComponentStyles } from './styles-components';

// Re-export icons (ensures they're bundled with renderer)
export { getIconData, renderIconSvg, lucideIcons } from '../icons/lucide-icons';
export type { IconData, IconElement } from '../icons/lucide-icons';

/**
 * Render AST to HTML and CSS
 *
 * @param document - Parsed wireframe document
 * @param options - Render options
 * @returns Object containing HTML and CSS strings
 */
export function render(document: WireframeDocument, options: RenderOptions = {}): RenderResult {
  const renderer = createHtmlRenderer(options);
  return renderer.render(document);
}

/**
 * Render AST to standalone HTML with embedded CSS
 *
 * @param document - Parsed wireframe document
 * @param options - Render options
 * @returns Complete HTML document string
 */
export function renderToHtml(document: WireframeDocument, options: RenderOptions = {}): string {
  const { html, css } = render(document, options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe</title>
  <style>
/* Browser centering styles */
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f4f4f5;
}
body {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
}
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Render AST to SVG using foreignObject with HTML+CSS
 *
 * This approach embeds HTML+CSS inside SVG using foreignObject,
 * which allows CSS flexbox/grid layouts to work properly.
 *
 * @param document - Parsed wireframe document
 * @param options - SVG render options
 * @returns Object containing SVG string and dimensions
 */
export function renderToSvg(
  document: WireframeDocument,
  options: SvgRenderOptions = {}
): SvgRenderResult {
  // Check for viewport settings in the first page
  const firstPage = document.children[0];
  let width = options.width ?? 800;
  let height = options.height ?? 600;

  // Use page viewport/device if set and no explicit options provided
  if (firstPage && options.width === undefined && options.height === undefined) {
    if (firstPage.viewport !== undefined || firstPage.device !== undefined) {
      const viewport = resolveViewport(firstPage.viewport, firstPage.device);
      width = viewport.width;
      height = viewport.height;
    }
  }

  const background = options.background ?? '#ffffff';

  // Use HTML renderer to generate content
  const { html, css } = render(document, { theme: options.theme ?? 'light' });

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
</svg>`;

  return { svg, width, height };
}
