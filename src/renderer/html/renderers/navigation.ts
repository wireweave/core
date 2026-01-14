/**
 * Navigation Renderers (Nav, Tabs, Breadcrumb)
 */

import type {
  NavNode,
  TabsNode,
  BreadcrumbNode,
  NavChild,
  NavBlockItem,
} from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Render helper icon HTML
 */
function renderIconHtml(iconName: string, prefix: string): string {
  return `<span class="${prefix}-icon" data-icon="${iconName}"></span>`;
}

/**
 * Render a single nav item
 */
function renderNavItem(item: NavBlockItem, ctx: RenderContext): string {
  const linkClasses = ctx.buildClassString([
    `${ctx.prefix}-nav-link`,
    item.active ? `${ctx.prefix}-nav-link-active` : undefined,
    item.disabled ? `${ctx.prefix}-nav-link-disabled` : undefined,
  ]);
  const iconHtml = item.icon ? renderIconHtml(item.icon, ctx.prefix) + ' ' : '';
  return `<a class="${linkClasses}" href="${item.href || '#'}">${iconHtml}${ctx.escapeHtml(item.label)}</a>`;
}

/**
 * Render nav children (groups, items, dividers)
 */
function renderNavChildren(children: NavChild[], ctx: RenderContext): string {
  return children
    .map((child) => {
      if (child.type === 'divider') {
        return `<hr class="${ctx.prefix}-nav-divider" />`;
      }
      if (child.type === 'group') {
        const groupItems = child.items
          .map((item) => {
            if (item.type === 'divider') {
              return `<hr class="${ctx.prefix}-nav-divider" />`;
            }
            return renderNavItem(item, ctx);
          })
          .join('\n');
        return `<div class="${ctx.prefix}-nav-group">
  <div class="${ctx.prefix}-nav-group-label">${ctx.escapeHtml(child.label)}</div>
${groupItems}
</div>`;
      }
      if (child.type === 'item') {
        return renderNavItem(child, ctx);
      }
      return '';
    })
    .join('\n');
}

/**
 * Render Nav node
 */
export function renderNav(node: NavNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-nav`,
    node.vertical ? `${ctx.prefix}-nav-vertical` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  // If block syntax (children), render children
  if (node.children && node.children.length > 0) {
    const content = renderNavChildren(node.children, ctx);
    return `<nav class="${classes}"${styleAttr}>\n${content}\n</nav>`;
  }

  // Array syntax (items)
  const items = node.items
    .map((item) => {
      if (typeof item === 'string') {
        return `<a class="${ctx.prefix}-nav-link" href="#">${ctx.escapeHtml(item)}</a>`;
      }
      const linkClasses = ctx.buildClassString([
        `${ctx.prefix}-nav-link`,
        item.active ? `${ctx.prefix}-nav-link-active` : undefined,
        item.disabled ? `${ctx.prefix}-nav-link-disabled` : undefined,
      ]);
      const iconHtml = item.icon ? renderIconHtml(item.icon, ctx.prefix) + ' ' : '';
      return `<a class="${linkClasses}" href="${item.href || '#'}">${iconHtml}${ctx.escapeHtml(item.label)}</a>`;
    })
    .join('\n');

  return `<nav class="${classes}"${styleAttr}>\n${items}\n</nav>`;
}

/**
 * Render Tabs node
 */
export function renderTabs(node: TabsNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-tabs`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const tabList = node.items
    .map((label, idx) => {
      const isActive = idx === (node.active || 0);
      const tabClasses = `${ctx.prefix}-tab${isActive ? ` ${ctx.prefix}-tab-active` : ''}`;
      return `<button class="${tabClasses}" role="tab" aria-selected="${isActive}">${ctx.escapeHtml(label)}</button>`;
    })
    .join('\n');

  return `<div class="${classes}"${styleAttr}>
  <div class="${ctx.prefix}-tab-list" role="tablist">
${tabList}
  </div>
</div>`;
}

/**
 * Render Breadcrumb node
 */
export function renderBreadcrumb(node: BreadcrumbNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-breadcrumb`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const items = node.items
    .map((item, idx) => {
      const isLast = idx === node.items.length - 1;
      if (typeof item === 'string') {
        return isLast
          ? `<span class="${ctx.prefix}-breadcrumb-item" aria-current="page">${ctx.escapeHtml(item)}</span>`
          : `<a class="${ctx.prefix}-breadcrumb-item" href="#">${ctx.escapeHtml(item)}</a>`;
      }
      return isLast
        ? `<span class="${ctx.prefix}-breadcrumb-item" aria-current="page">${ctx.escapeHtml(item.label)}</span>`
        : `<a class="${ctx.prefix}-breadcrumb-item" href="${item.href || '#'}">${ctx.escapeHtml(item.label)}</a>`;
    })
    .join(' / ');

  return `<nav class="${classes}"${styleAttr} aria-label="Breadcrumb">${items}</nav>`;
}
