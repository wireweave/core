/**
 * Button Renderer
 */

import type { ButtonNode } from '../../../ast/types'
import type { RenderContext } from './types'
import { getIconData, renderIconSvg, renderUnknownIconSvg } from '../../../icons/lucide-icons'
import { resolveSizeValue } from '../components'

/**
 * Render Button node
 */
export function renderButton(node: ButtonNode, ctx: RenderContext): string {
  // Icon-only button: has icon but no text content (or default "Button" text)
  const isIconOnly = node.icon && (!node.content.trim() || node.content === 'Button')

  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number/ValueWithUnit
  const sizeResolved = resolveSizeValue(node.size, 'button', ctx.prefix)

  const classes = ctx.buildClassString([
    `${ctx.prefix}-button`,
    node.primary ? `${ctx.prefix}-button-primary` : undefined,
    node.secondary ? `${ctx.prefix}-button-secondary` : undefined,
    node.outline ? `${ctx.prefix}-button-outline` : undefined,
    node.ghost ? `${ctx.prefix}-button-ghost` : undefined,
    node.danger ? `${ctx.prefix}-button-danger` : undefined,
    sizeResolved.className,
    node.disabled ? `${ctx.prefix}-button-disabled` : undefined,
    node.loading ? `${ctx.prefix}-button-loading` : undefined,
    isIconOnly ? `${ctx.prefix}-button-icon-only` : undefined,
    ...ctx.getCommonClasses(node),
  ])

  const baseStyles = ctx.buildCommonStyles(node)
  const sizeStyle = sizeResolved.style || ''
  const combinedStyles =
    baseStyles && sizeStyle ? `${baseStyles}; ${sizeStyle}` : baseStyles || sizeStyle
  const styleAttr = combinedStyles ? ` style="${combinedStyles}"` : ''

  // Accessible name (WCAG 4.1.2): an explicit `aria` / `aria-label` attribute
  // becomes `aria-label`; `title` becomes the tooltip and a fallback name.
  // Only emitted when authored — buttons with visible text stay unchanged.
  const accessibleName = node.aria ?? node['aria-label']

  const attrs: Record<string, string | boolean | undefined> = {
    class: classes,
    disabled: node.disabled,
    'aria-label': accessibleName,
    title: node.title,
    // Interactive attributes
    'data-navigate': node.navigate,
    'data-opens': node.opens,
    'data-toggles': node.toggles,
    'data-action': node.action,
  }

  let icon = ''
  if (node.icon) {
    const iconData = getIconData(node.icon)
    if (iconData) {
      icon = renderIconSvg(iconData, 16, 2, `${ctx.prefix}-icon`)
    } else {
      // Unknown icon: render the shared placeholder (never leak the raw name)
      icon = `<span class="${ctx.prefix}-icon" title="Unknown icon: ${ctx.escapeHtml(node.icon)}">${renderUnknownIconSvg(`${ctx.prefix}-icon`, 16)}</span>`
    }
  }
  const loading = node.loading
    ? `<span class="${ctx.prefix}-spinner ${ctx.prefix}-spinner-sm"></span>`
    : ''
  // Don't show text for icon-only buttons
  const content = isIconOnly ? '' : ctx.escapeHtml(node.content)

  return `<button${ctx.buildAttrsString(attrs)}${styleAttr}>${loading}${icon}${content}</button>`
}
