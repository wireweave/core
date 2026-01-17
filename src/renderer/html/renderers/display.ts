/**
 * Display Renderers (Image, Placeholder, Avatar, Badge, Icon)
 */

import type {
  ImageNode,
  PlaceholderNode,
  AvatarNode,
  BadgeNode,
  IconNode,
} from '../../../ast/types';
import type { RenderContext } from './types';
import { resolveSizeValue, buildClassString as _buildClassString } from '../components';
import { getIconData, renderIconSvg } from '../../../icons/lucide-icons';

/**
 * Build interactive data attributes string
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
 * Render Image node
 */
export function renderImage(node: ImageNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-image`,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  // If src is provided, render as actual img tag
  if (node.src) {
    const attrs: Record<string, string | boolean | undefined> = {
      class: classes,
      src: node.src,
      alt: node.alt || 'Image',
      ...buildInteractiveAttrs(node),
    };
    // Add style attribute for img tag
    const imgStyleAttr = styles ? `; ${styles}` : '';
    return `<img${ctx.buildAttrsString(attrs)}${imgStyleAttr ? ` style="${imgStyleAttr.slice(2)}"` : ''} />`;
  }

  // Otherwise render as placeholder with image icon
  const label = node.alt || 'Image';
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  const interactiveAttrs = buildInteractiveAttrs(node);
  const interactiveAttrStr = ctx.buildAttrsString(interactiveAttrs);
  return `<div class="${classes}"${styleAttr}${interactiveAttrStr} role="img" aria-label="${ctx.escapeHtml(label)}">${icon}<span>${ctx.escapeHtml(label)}</span></div>`;
}

/**
 * Render Placeholder node
 */
export function renderPlaceholder(node: PlaceholderNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-placeholder`,
    node.children && node.children.length > 0 ? `${ctx.prefix}-placeholder-with-children` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const label = node.label ? ctx.escapeHtml(node.label) : 'Placeholder';

  // If there are children, render them as overlay
  if (node.children && node.children.length > 0) {
    const childrenHtml = ctx.renderChildren(node.children);
    return `<div class="${classes}"${styleAttr}>
  <span class="${ctx.prefix}-placeholder-label">${label}</span>
  <div class="${ctx.prefix}-placeholder-overlay">${childrenHtml}</div>
</div>`;
  }

  return `<div class="${classes}"${styleAttr}>${label}</div>`;
}

/**
 * Render Avatar node
 */
export function renderAvatar(node: AvatarNode, ctx: RenderContext): string {
  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
  const sizeResolved = resolveSizeValue(node.size, 'avatar', ctx.prefix);

  const classes = ctx.buildClassString([
    `${ctx.prefix}-avatar`,
    sizeResolved.className,
    ...ctx.getCommonClasses(node),
  ]);

  const baseStyles = ctx.buildCommonStyles(node);
  const sizeStyle = sizeResolved.style || '';
  const combinedStyles = baseStyles && sizeStyle
    ? `${baseStyles}; ${sizeStyle}`
    : baseStyles || sizeStyle;
  const styleAttr = combinedStyles ? ` style="${combinedStyles}"` : '';

  const initials = node.name
    ? node.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const interactiveAttrs = buildInteractiveAttrs(node);
  const interactiveAttrStr = ctx.buildAttrsString(interactiveAttrs);
  return `<div class="${classes}"${styleAttr}${interactiveAttrStr} role="img" aria-label="${ctx.escapeHtml(node.name || 'Avatar')}">${initials}</div>`;
}

/**
 * Render Badge node
 */
export function renderBadge(node: BadgeNode, ctx: RenderContext): string {
  const interactiveAttrs = buildInteractiveAttrs(node);
  const interactiveAttrStr = ctx.buildAttrsString(interactiveAttrs);

  // If icon is provided, render as icon badge (circular background with icon)
  if (node.icon) {
    const iconData = getIconData(node.icon);
    const classes = ctx.buildClassString([
      `${ctx.prefix}-badge-icon`,
      node.size ? `${ctx.prefix}-badge-icon-${node.size}` : undefined,
      node.variant ? `${ctx.prefix}-badge-icon-${node.variant}` : undefined,
      ...ctx.getCommonClasses(node),
    ]);

    const styles = ctx.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    if (iconData) {
      const svg = renderIconSvg(iconData, 24, 2, `${ctx.prefix}-icon`);
      return `<span class="${classes}"${styleAttr}${interactiveAttrStr} aria-label="${ctx.escapeHtml(node.icon)}">${svg}</span>`;
    }

    // Fallback for unknown icon
    return `<span class="${classes}"${styleAttr}${interactiveAttrStr} aria-label="unknown icon">?</span>`;
  }

  // Default text badge (empty content = dot indicator)
  const isDot = !node.content || node.content.trim() === '';
  const classes = ctx.buildClassString([
    `${ctx.prefix}-badge`,
    isDot ? `${ctx.prefix}-badge-dot` : undefined,
    node.variant ? `${ctx.prefix}-badge-${node.variant}` : undefined,
    node.pill ? `${ctx.prefix}-badge-pill` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<span class="${classes}"${styleAttr}${interactiveAttrStr}>${ctx.escapeHtml(node.content)}</span>`;
}

/**
 * Render Icon node
 */
export function renderIcon(node: IconNode, ctx: RenderContext): string {
  const iconData = getIconData(node.name);
  const interactiveAttrs = buildInteractiveAttrs(node);
  const interactiveAttrStr = ctx.buildAttrsString(interactiveAttrs);

  // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
  const sizeResolved = resolveSizeValue(node.size, 'icon', ctx.prefix);

  const wrapperClasses = ctx.buildClassString([
    `${ctx.prefix}-icon-wrapper`,
    node.muted ? `${ctx.prefix}-text-muted` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const baseStyles = ctx.buildCommonStyles(node);

  if (iconData) {
    // Build icon class with optional size class
    const iconClasses = _buildClassString([
      `${ctx.prefix}-icon`,
      sizeResolved.className,
    ]);
    const svgStyleAttr = sizeResolved.style ? ` style="${sizeResolved.style}"` : '';
    const svg = renderIconSvg(iconData, 24, 2, iconClasses, svgStyleAttr);
    const wrapperStyleAttr = baseStyles ? ` style="${baseStyles}"` : '';
    return `<span class="${wrapperClasses}"${wrapperStyleAttr}${interactiveAttrStr} aria-hidden="true">${svg}</span>`;
  }

  // Fallback for unknown icons - render a placeholder circle
  const size = sizeResolved.style?.match(/(\d+)px/)?.[1] || '24';
  const sizeNum = parseInt(size, 10);
  const placeholderSvg = `<svg class="${ctx.prefix}-icon ${sizeResolved.className || ''}" width="${sizeNum}" height="${sizeNum}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" fill="none" opacity="0.5"/>
      <text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">?</text>
    </svg>`;
  const wrapperStyleAttr = baseStyles ? ` style="${baseStyles}"` : '';
  return `<span class="${wrapperClasses}"${wrapperStyleAttr}${interactiveAttrStr} aria-hidden="true" title="Unknown icon: ${ctx.escapeHtml(node.name)}">${placeholderSvg}</span>`;
}
