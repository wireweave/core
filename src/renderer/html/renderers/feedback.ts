/**
 * Feedback Renderers (Alert, Toast, Progress, Spinner)
 */

import type { AlertNode, ToastNode, ProgressNode, SpinnerNode } from '../../../ast/types';
import type { RenderContext } from './types';
import { resolveSizeValue } from '../components';

/**
 * Render Alert node
 */
export function renderAlert(node: AlertNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-alert`,
    node.variant ? `${ctx.prefix}-alert-${node.variant}` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const dismissBtn = node.dismissible
    ? ` <button class="${ctx.prefix}-alert-close" aria-label="Close">&times;</button>`
    : '';

  return `<div class="${classes}"${styleAttr} role="alert">${ctx.escapeHtml(node.content)}${dismissBtn}</div>`;
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
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<div class="${classes}"${styleAttr} role="status">${ctx.escapeHtml(node.content)}</div>`;
}

/**
 * Render Progress node
 */
export function renderProgress(node: ProgressNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-progress`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const value = node.value || 0;
  const max = node.max || 100;
  const percentage = Math.round((value / max) * 100);

  const label = node.label ? `<span class="${ctx.prefix}-progress-label">${ctx.escapeHtml(node.label)}</span>` : '';

  if (node.indeterminate) {
    return `<div class="${classes} ${ctx.prefix}-progress-indeterminate"${styleAttr} role="progressbar">${label}</div>`;
  }

  return `<div class="${classes}"${styleAttr} role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}">
  ${label}
  <div class="${ctx.prefix}-progress-bar" style="width: ${percentage}%"></div>
</div>`;
}

/**
 * Render Spinner node
 */
export function renderSpinner(node: SpinnerNode, ctx: RenderContext): string {
  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
  const sizeResolved = resolveSizeValue(node.size, 'spinner', ctx.prefix);

  const classes = ctx.buildClassString([
    `${ctx.prefix}-spinner`,
    sizeResolved.className,
    ...ctx.getCommonClasses(node),
  ]);

  const baseStyles = ctx.buildCommonStyles(node);
  const sizeStyle = sizeResolved.style || '';
  const combinedStyles = baseStyles && sizeStyle
    ? `${baseStyles}; ${sizeStyle}`
    : baseStyles || sizeStyle;
  const styleAttr = combinedStyles ? ` style="${combinedStyles}"` : '';

  const label = node.label || 'Loading...';
  return `<span class="${classes}"${styleAttr} role="status" aria-label="${ctx.escapeHtml(label)}"></span>`;
}
