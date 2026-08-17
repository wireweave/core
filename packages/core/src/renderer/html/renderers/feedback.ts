/**
 * Feedback Renderers (Alert, Toast, Progress, Spinner)
 */

import type { AlertNode, ToastNode, ProgressNode, SpinnerNode } from '../../../ast/types'
import type { RenderContext } from './types'
import { resolveSizeValue } from '../components'
import { getIconData, renderIconSvg, renderUnknownIconSvg } from '../../../icons/lucide-icons'

/**
 * Render the alert's leading icon.
 *
 * Same contract as the input icon: a known name becomes its lucide glyph, an
 * unknown one becomes the shared placeholder rather than leaking the raw name
 * into the wireframe.
 */
function renderAlertIcon(name: string, ctx: RenderContext): string {
  // `wf-icon` is the SIZING contract — `renderIconSvg` drops its size argument
  // and emits no width/height, so the glyph is sized only by the class it is
  // given. `wf-alert-icon` carries placement (`flex-shrink`, `margin-top`), not
  // size; alone it leaves a viewBox-only SVG to fill its flex parent, which with
  // `flex-shrink: 0` it then refuses to give back.
  const className = `${ctx.prefix}-icon ${ctx.prefix}-alert-icon`
  const iconData = getIconData(name)
  if (iconData) return renderIconSvg(iconData, 16, 2, className)
  return `<span class="${className}" title="Unknown icon: ${ctx.escapeHtml(name)}">${renderUnknownIconSvg(className, 16)}</span>`
}

/**
 * Render Alert node
 */
export function renderAlert(node: AlertNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-alert`,
    node.variant ? `${ctx.prefix}-alert-${node.variant}` : undefined,
    ...ctx.getCommonClasses(node),
  ])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const dismissBtn = node.dismissible
    ? ` <button class="${ctx.prefix}-alert-close" aria-label="Close">&times;</button>`
    : ''

  const icon = node.icon ? renderAlertIcon(node.icon, ctx) : ''

  return `<div class="${classes}"${styleAttr} role="alert">${icon}${ctx.escapeHtml(node.content)}${dismissBtn}</div>`
}

/**
 * Render Toast node
 */
export function renderToast(node: ToastNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-toast`,
    node.position ? `${ctx.prefix}-toast-${node.position}` : undefined,
    node.variant ? `${ctx.prefix}-toast-${node.variant}` : undefined,
    ...ctx.getCommonClasses(node),
  ])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  return `<div class="${classes}"${styleAttr} role="status">${ctx.escapeHtml(node.content)}</div>`
}

/**
 * Render Progress node
 */
export function renderProgress(node: ProgressNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([`${ctx.prefix}-progress`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const value = node.value || 0
  const max = node.max || 100
  const percentage = Math.round((value / max) * 100)

  const label = node.label
    ? `<span class="${ctx.prefix}-progress-label">${ctx.escapeHtml(node.label)}</span>`
    : ''

  if (node.indeterminate) {
    return `${label}<div class="${ctx.prefix}-progress-wrapper"${styleAttr}><div class="${classes} ${ctx.prefix}-progress-indeterminate" role="progressbar"><div class="${ctx.prefix}-progress-bar"></div></div></div>`
  }

  return `${label}<div class="${ctx.prefix}-progress-wrapper"${styleAttr}><div class="${classes}" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}"><div class="${ctx.prefix}-progress-bar" style="width: ${percentage}%"></div></div><span class="${ctx.prefix}-progress-value">${percentage}%</span></div>`
}

/**
 * Render Spinner node
 */
export function renderSpinner(node: SpinnerNode, ctx: RenderContext): string {
  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
  const sizeResolved = resolveSizeValue(node.size, 'spinner', ctx.prefix)

  const classes = ctx.buildClassString([
    `${ctx.prefix}-spinner`,
    sizeResolved.className,
    ...ctx.getCommonClasses(node),
  ])

  const baseStyles = ctx.buildCommonStyles(node)
  const sizeStyle = sizeResolved.style || ''
  const combinedStyles =
    baseStyles && sizeStyle ? `${baseStyles}; ${sizeStyle}` : baseStyles || sizeStyle
  const styleAttr = combinedStyles ? ` style="${combinedStyles}"` : ''

  const label = node.label || 'Loading...'
  return `<span class="${classes}"${styleAttr} role="status" aria-label="${ctx.escapeHtml(label)}"></span>`
}
