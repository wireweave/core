/**
 * Text Renderers (Text, Title, Link)
 */

import type { TextNode, TitleNode, LinkNode } from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Render Text node
 */
export function renderText(node: TextNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-text`,
    node.size ? `${ctx.prefix}-text-${node.size}` : undefined,
    node.weight ? `${ctx.prefix}-text-${node.weight}` : undefined,
    node.align ? `${ctx.prefix}-text-${node.align}` : undefined,
    node.muted ? `${ctx.prefix}-text-muted` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<p class="${classes}"${styleAttr}>${ctx.escapeHtml(node.content)}</p>`;
}

/**
 * Render Title node
 */
export function renderTitle(node: TitleNode, ctx: RenderContext): string {
  const level = node.level || 1;
  const tag = `h${level}`;
  const classes = ctx.buildClassString([
    `${ctx.prefix}-title`,
    node.size ? `${ctx.prefix}-text-${node.size}` : undefined,
    node.align ? `${ctx.prefix}-text-${node.align}` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<${tag} class="${classes}"${styleAttr}>${ctx.escapeHtml(node.content)}</${tag}>`;
}

/**
 * Render Link node
 */
export function renderLink(node: LinkNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-link`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    href: node.href || '#',
  };

  if (node.external) {
    attrs.target = '_blank';
    attrs.rel = 'noopener noreferrer';
  }

  return `<a${ctx.buildAttrsString(attrs)}${styleAttr}>${ctx.escapeHtml(node.content)}</a>`;
}
