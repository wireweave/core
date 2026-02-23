/**
 * Grid Renderers (Row, Col)
 */

import type { RowNode, ColNode } from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Extended context for Col renderer
 */
export interface GridRenderContext extends RenderContext {
  buildColStyles: (node: ColNode) => string;
}

/**
 * Render Row node
 */
export function renderRow(node: RowNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-row`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
}

/**
 * Render Col node
 */
export function renderCol(node: ColNode, ctx: GridRenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-col`,
    node.span ? `${ctx.prefix}-col-${node.span}` : undefined,
    // Responsive breakpoint classes
    node.sm ? `${ctx.prefix}-col-sm-${node.sm}` : undefined,
    node.md ? `${ctx.prefix}-col-md-${node.md}` : undefined,
    node.lg ? `${ctx.prefix}-col-lg-${node.lg}` : undefined,
    node.xl ? `${ctx.prefix}-col-xl-${node.xl}` : undefined,
    // Scroll support
    node.scroll ? `${ctx.prefix}-scroll` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  // Build inline styles for numeric width/height and order
  const styles = ctx.buildColStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
}
