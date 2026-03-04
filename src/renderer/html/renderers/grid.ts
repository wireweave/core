/**
 * Grid Renderers (Row, Col, Stack, Relative)
 */

import type { RowNode, ColNode, StackNode, RelativeNode } from '../../../ast/types';
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

/**
 * Render Stack node
 *
 * Stack is a vertical content grouping container that only takes up
 * the space needed by its content (flex: 0 0 auto), unlike Col which
 * fills available space (flex: 1).
 */
export function renderStack(node: StackNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-stack`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
}

/**
 * Render Relative node
 *
 * Relative is a container for positioning children with absolute positioning.
 * First child is the base element, subsequent children are overlaid on top.
 * Child elements can use `anchor` attribute to specify position.
 */
export function renderRelative(node: RelativeNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-relative`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
}
