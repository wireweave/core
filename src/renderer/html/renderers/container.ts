/**
 * Container Renderers (Card, Modal, Drawer, Accordion)
 */

import type { CardNode, ModalNode, DrawerNode, AccordionNode } from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Build interactive data attributes
 */
function buildInteractiveAttrs(node: { navigate?: string; opens?: string; toggles?: string; action?: string }): Record<string, string | undefined> {
  return {
    'data-navigate': node.navigate,
    'data-opens': node.opens,
    'data-toggles': node.toggles,
    'data-action': node.action,
  };
}

/**
 * Render Card node
 */
export function renderCard(node: CardNode, ctx: RenderContext): string {
  // Add -flex class only if card has no explicit width (so it expands in flex container)
  const hasExplicitWidth = node.w !== undefined;
  const classes = ctx.buildClassString([
    `${ctx.prefix}-card`,
    !hasExplicitWidth ? `${ctx.prefix}-card-flex` : undefined,
    node.shadow ? `${ctx.prefix}-card-shadow-${node.shadow}` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const interactiveAttrs = buildInteractiveAttrs(node);
  const interactiveAttrStr = ctx.buildAttrsString(interactiveAttrs);

  const title = node.title
    ? `<h3 class="${ctx.prefix}-title">${ctx.escapeHtml(node.title)}</h3>\n`
    : '';
  const children = ctx.renderChildren(node.children);
  return `<div class="${classes}"${styleAttr}${interactiveAttrStr}>\n${title}${children}\n</div>`;
}

/**
 * Render Modal node
 */
export function renderModal(node: ModalNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-modal`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';
  const idAttr = node.id ? ` id="${ctx.escapeHtml(node.id)}"` : '';

  const title = node.title
    ? `<h2 class="${ctx.prefix}-title">${ctx.escapeHtml(node.title)}</h2>\n`
    : '';
  const children = ctx.renderChildren(node.children);
  return `<div class="${ctx.prefix}-modal-backdrop"${idAttr}>
  <div class="${classes}"${styleAttr} role="dialog" aria-modal="true">
${title}${children}
  </div>
</div>`;
}

/**
 * Render Drawer node
 */
export function renderDrawer(node: DrawerNode, ctx: RenderContext): string {
  const position = node.position || 'left';
  const classes = ctx.buildClassString([
    `${ctx.prefix}-drawer`,
    `${ctx.prefix}-drawer-${position}`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';
  const idAttr = node.id ? ` id="${ctx.escapeHtml(node.id)}"` : '';

  const title = node.title
    ? `<h2 class="${ctx.prefix}-title">${ctx.escapeHtml(node.title)}</h2>\n`
    : '';
  const children = ctx.renderChildren(node.children);
  return `<aside class="${classes}"${styleAttr}${idAttr}>\n${title}${children}\n</aside>`;
}

/**
 * Render Accordion node
 */
export function renderAccordion(node: AccordionNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-accordion`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const title = node.title
    ? `<button class="${ctx.prefix}-accordion-header">${ctx.escapeHtml(node.title)}</button>\n`
    : '';
  const children = ctx.renderChildren(node.children);
  return `<div class="${classes}"${styleAttr}>\n${title}<div class="${ctx.prefix}-accordion-content">\n${children}\n</div>\n</div>`;
}
