/**
 * Layout Renderers (Header, Main, Footer, Sidebar, Section)
 */

import type { HeaderNode, MainNode, FooterNode, SidebarNode, SectionNode } from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Render Header node
 */
export function renderHeader(node: HeaderNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-header`,
    node.border === false ? `${ctx.prefix}-no-border` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<header class="${classes}"${styleAttr}>\n${children}\n</header>`;
}

/**
 * Render Main node
 */
export function renderMain(node: MainNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-main`,
    node.scroll ? `${ctx.prefix}-scroll` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<main class="${classes}"${styleAttr}>\n${children}\n</main>`;
}

/**
 * Render Footer node
 */
export function renderFooter(node: FooterNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-footer`,
    node.border === false ? `${ctx.prefix}-no-border` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<footer class="${classes}"${styleAttr}>\n${children}\n</footer>`;
}

/**
 * Render Sidebar node
 */
export function renderSidebar(node: SidebarNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-sidebar`,
    node.position === 'right' ? `${ctx.prefix}-sidebar-right` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const children = ctx.renderChildren(node.children);
  return `<aside class="${classes}"${styleAttr}>\n${children}\n</aside>`;
}

/**
 * Render Section node
 */
export function renderSection(node: SectionNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-section`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const title = node.title
    ? `<h2 class="${ctx.prefix}-title">${ctx.escapeHtml(node.title)}</h2>\n`
    : '';
  const children = ctx.renderChildren(node.children);
  return `<section class="${classes}"${styleAttr}>\n${title}${children}\n</section>`;
}
