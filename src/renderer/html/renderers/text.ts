/**
 * Text Renderers (Text, Title, Link)
 */

import type { TextNode, TitleNode, LinkNode, ValueWithUnit, TextSize } from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Type guard to check if a value is a ValueWithUnit object (custom pixel value)
 */
function isValueWithUnit(value: unknown): value is ValueWithUnit {
  return typeof value === 'object' && value !== null && 'value' in value && 'unit' in value;
}

/**
 * Check if value is a custom size (number or ValueWithUnit, not a token string)
 */
function isCustomSize(size: TextSize | undefined): boolean {
  if (size === undefined) return false;
  // Number or ValueWithUnit = custom size
  return typeof size === 'number' || isValueWithUnit(size);
}

/**
 * Resolve TextSize to CSS font-size value (for custom sizes)
 * Returns undefined for token sizes (those use CSS classes)
 *
 * Supports:
 * - ValueWithUnit: { value: 28, unit: 'px' } → '28px'
 * - number: 28 → '28px' (assumes px)
 */
function resolveCustomFontSize(size: TextSize | undefined): string | undefined {
  if (size === undefined) return undefined;

  // ValueWithUnit object: direct CSS value (e.g., { value: 28, unit: 'px' })
  if (isValueWithUnit(size)) {
    return `${size.value}${size.unit}`;
  }

  // Number: assume px unit (e.g., 28 → '28px')
  if (typeof size === 'number') {
    return `${size}px`;
  }

  // Token string: use CSS class, not inline style
  return undefined;
}

/**
 * Get size class name (only for token sizes, not custom values)
 */
function getSizeClassName(size: TextSize | undefined, prefix: string): string | undefined {
  if (size === undefined) return undefined;

  // Custom size (number or ValueWithUnit): use inline style, not class
  if (isCustomSize(size)) {
    return undefined;
  }

  // Token string: return class name
  return `${prefix}-text-${size}`;
}

/**
 * Render Text node
 */
export function renderText(node: TextNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-text`,
    getSizeClassName(node.size, ctx.prefix),
    node.weight ? `${ctx.prefix}-text-${node.weight}` : undefined,
    node.align ? `${ctx.prefix}-text-${node.align}` : undefined,
    node.muted ? `${ctx.prefix}-text-muted` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  // Build styles including custom font-size if specified
  const stylesParts: string[] = [];
  const commonStyles = ctx.buildCommonStyles(node);
  if (commonStyles) stylesParts.push(commonStyles);

  const customFontSize = resolveCustomFontSize(node.size);
  if (customFontSize) stylesParts.push(`font-size: ${customFontSize}`);

  const styles = stylesParts.join('; ');
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
    getSizeClassName(node.size, ctx.prefix),
    node.align ? `${ctx.prefix}-text-${node.align}` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  // Build styles including custom font-size if specified
  const stylesParts: string[] = [];
  const commonStyles = ctx.buildCommonStyles(node);
  if (commonStyles) stylesParts.push(commonStyles);

  const customFontSize = resolveCustomFontSize(node.size);
  if (customFontSize) stylesParts.push(`font-size: ${customFontSize}`);

  const styles = stylesParts.join('; ');
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
    href: node.href || node.navigate || '#',
    // Interactive attributes
    'data-navigate': node.navigate,
    'data-opens': node.opens,
    'data-toggles': node.toggles,
    'data-action': node.action,
  };

  if (node.external) {
    attrs.target = '_blank';
    attrs.rel = 'noopener noreferrer';
  }

  return `<a${ctx.buildAttrsString(attrs)}${styleAttr}>${ctx.escapeHtml(node.content)}</a>`;
}
