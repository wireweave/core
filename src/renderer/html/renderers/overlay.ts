/**
 * Overlay Renderers (Tooltip, Popover, Dropdown)
 */

import type {
  TooltipNode,
  PopoverNode,
  DropdownNode,
} from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Render Tooltip node
 */
export function renderTooltip(node: TooltipNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-tooltip-wrapper`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const position = node.position || 'top';
  const children = ctx.renderChildren(node.children);

  return `<div class="${classes}"${styleAttr}>
${children}
<div class="${ctx.prefix}-tooltip ${ctx.prefix}-tooltip-${position}" role="tooltip">${ctx.escapeHtml(node.content)}</div>
</div>`;
}

/**
 * Render Popover node
 */
export function renderPopover(node: PopoverNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-popover`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const title = node.title
    ? `<div class="${ctx.prefix}-popover-header">${ctx.escapeHtml(node.title)}</div>\n`
    : '';
  const children = ctx.renderChildren(node.children);

  return `<div class="${classes}"${styleAttr}>\n${title}<div class="${ctx.prefix}-popover-body">\n${children}\n</div>\n</div>`;
}

/**
 * Render Dropdown node
 */
export function renderDropdown(node: DropdownNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-dropdown`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const items = node.items
    .map((item) => {
      if ('type' in item && item.type === 'divider') {
        return `<hr class="${ctx.prefix}-divider" />`;
      }
      // TypeScript narrowing: item is DropdownItemNode after the divider check
      const dropdownItem = item as { label: string; danger?: boolean; disabled?: boolean };
      const itemClasses = ctx.buildClassString([
        `${ctx.prefix}-dropdown-item`,
        dropdownItem.danger ? `${ctx.prefix}-dropdown-item-danger` : undefined,
        dropdownItem.disabled ? `${ctx.prefix}-dropdown-item-disabled` : undefined,
      ]);
      return `<button class="${itemClasses}"${dropdownItem.disabled ? ' disabled="disabled"' : ''}>${ctx.escapeHtml(dropdownItem.label)}</button>`;
    })
    .join('\n');

  return `<div class="${classes}"${styleAttr}>\n${items}\n</div>`;
}
