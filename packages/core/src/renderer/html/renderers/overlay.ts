/**
 * Overlay Renderers (Tooltip, Popover, Dropdown)
 */

import type { TooltipNode, PopoverNode, DropdownNode } from '../../../ast/types'
import type { RenderContext } from './types'
import { anchorIntent, interactiveAttrs } from '../interactive'

/**
 * Render Tooltip node
 */
export function renderTooltip(node: TooltipNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-tooltip-wrapper`,
    ...ctx.getCommonClasses(node),
  ])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const position = node.position || 'top'
  const children = ctx.renderChildren(node.children)

  return `<div class="${classes}"${styleAttr}>
${children}
<div class="${ctx.prefix}-tooltip ${ctx.prefix}-tooltip-${position}" role="tooltip">${ctx.escapeHtml(node.content)}</div>
</div>`
}

/**
 * Render Popover node
 */
export function renderPopover(node: PopoverNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([`${ctx.prefix}-popover`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const title = node.title
    ? `<div class="${ctx.prefix}-popover-header">${ctx.escapeHtml(node.title)}</div>\n`
    : ''
  const children = ctx.renderChildren(node.children)

  return `<div class="${classes}"${styleAttr}>\n${title}<div class="${ctx.prefix}-popover-body">\n${children}\n</div>\n</div>`
}

/**
 * Render Dropdown node
 */
export function renderDropdown(node: DropdownNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([`${ctx.prefix}-dropdown`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const items = node.items
    .map((item) => {
      if (item.type === 'Divider') {
        return `<hr class="${ctx.prefix}-divider" />`
      }
      const dropdownItem = item
      const itemClasses = ctx.buildClassString([
        `${ctx.prefix}-dropdown-item`,
        dropdownItem.danger ? `${ctx.prefix}-dropdown-item-danger` : undefined,
        dropdownItem.disabled ? `${ctx.prefix}-dropdown-item-disabled` : undefined,
      ])

      const disabledAttr = dropdownItem.disabled ? ' disabled="disabled"' : ''

      // An item that links or names a destination is an <a>; one that only acts
      // is a <button>. `anchorIntent` owns which channel the destination travels
      // in — the same split nav and breadcrumb items use.
      if (dropdownItem.href || dropdownItem.navigate) {
        const { href, attrs } = anchorIntent(dropdownItem)
        const anchorAttrStr = ctx.buildAttrsString(attrs)
        return `<a class="${itemClasses}" href="${ctx.escapeHtml(href)}"${anchorAttrStr}>${ctx.escapeHtml(dropdownItem.label)}</a>`
      }
      const interactiveAttrStr = ctx.buildAttrsString(interactiveAttrs(dropdownItem))
      return `<button class="${itemClasses}"${disabledAttr}${interactiveAttrStr}>${ctx.escapeHtml(dropdownItem.label)}</button>`
    })
    .join('\n')

  return `<div class="${classes}"${styleAttr}>\n${items}\n</div>`
}
