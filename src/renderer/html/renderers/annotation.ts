/**
 * Annotation Renderers
 *
 * Renders marker, annotations panel, and annotation items
 * for screen specification documentation.
 */

import type { MarkerNode, AnnotationsNode, AnnotationItemNode, AnyNode } from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Marker colors mapping
 */
const MARKER_COLORS: Record<string, { bg: string; border: string }> = {
  blue: { bg: '#3b82f6', border: '#2563eb' },
  red: { bg: '#ef4444', border: '#dc2626' },
  green: { bg: '#22c55e', border: '#16a34a' },
  yellow: { bg: '#eab308', border: '#ca8a04' },
  purple: { bg: '#a855f7', border: '#9333ea' },
  orange: { bg: '#f97316', border: '#ea580c' },
};

/**
 * Get anchor position styles
 */
function getAnchorStyles(anchor: string | undefined): string {
  if (!anchor) return '';

  const styles: string[] = ['position: absolute'];

  switch (anchor) {
    case 'top-left':
      styles.push('top: -8px', 'left: -8px');
      break;
    case 'top-center':
      styles.push('top: -8px', 'left: 50%', 'transform: translateX(-50%)');
      break;
    case 'top-right':
      styles.push('top: -8px', 'right: -8px');
      break;
    case 'center-left':
      styles.push('top: 50%', 'left: -8px', 'transform: translateY(-50%)');
      break;
    case 'center':
      styles.push('top: 50%', 'left: 50%', 'transform: translate(-50%, -50%)');
      break;
    case 'center-right':
      styles.push('top: 50%', 'right: -8px', 'transform: translateY(-50%)');
      break;
    case 'bottom-left':
      styles.push('bottom: -8px', 'left: -8px');
      break;
    case 'bottom-center':
      styles.push('bottom: -8px', 'left: 50%', 'transform: translateX(-50%)');
      break;
    case 'bottom-right':
      styles.push('bottom: -8px', 'right: -8px');
      break;
  }

  return styles.join('; ');
}

/**
 * Render Marker node
 *
 * Creates a numbered circle marker for referencing in annotations.
 */
export function renderMarker(node: MarkerNode, ctx: RenderContext): string {
  const color = node.color || 'blue';
  const colorConfig = MARKER_COLORS[color] || MARKER_COLORS.blue;

  const baseStyles = [
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'width: 20px',
    'height: 20px',
    'border-radius: 50%',
    `background: ${colorConfig.bg}`,
    `border: 2px solid ${colorConfig.border}`,
    'color: white',
    'font-size: 11px',
    'font-weight: 600',
    'line-height: 1',
    'z-index: 10',
  ];

  const anchorStyles = getAnchorStyles(node.anchor);
  const commonStyles = ctx.buildCommonStyles(node);

  const allStyles = [
    ...baseStyles,
    ...(anchorStyles ? [anchorStyles] : []),
    ...(commonStyles ? [commonStyles] : []),
  ].join('; ');

  return `<span class="${ctx.prefix}-marker" style="${allStyles}" aria-label="Marker ${node.number}">${node.number}</span>`;
}

/**
 * Render Annotations panel node
 *
 * Creates a documentation panel that is visually distinct from the wireframe UI.
 * Uses data-role="documentation" for LLM recognition.
 */
export function renderAnnotations(node: AnnotationsNode, ctx: RenderContext): string {
  const title = node.title || '화면 설명';
  const commonStyles = ctx.buildCommonStyles(node);
  const styleAttr = commonStyles ? ` style="${commonStyles}"` : '';

  const items = (node.children || [])
    .map((child) => renderAnnotationItem(child as AnnotationItemNode, ctx))
    .join('\n');

  return `<aside class="${ctx.prefix}-annotations" data-role="documentation" aria-label="${ctx.escapeHtml(title)}"${styleAttr}>
  <header class="${ctx.prefix}-annotations-header">
    <span class="${ctx.prefix}-annotations-icon" aria-hidden="true">&#128203;</span>
    <span>${ctx.escapeHtml(title)}</span>
  </header>
  <div class="${ctx.prefix}-annotations-content">
    ${items}
  </div>
</aside>`;
}

/**
 * Render AnnotationItem node
 *
 * Creates an individual annotation entry with marker number and description.
 */
export function renderAnnotationItem(node: AnnotationItemNode, ctx: RenderContext): string {
  const color = MARKER_COLORS.blue;

  const markerStyle = [
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'width: 18px',
    'height: 18px',
    'border-radius: 50%',
    `background: ${color.bg}`,
    'color: white',
    'font-size: 10px',
    'font-weight: 600',
    'flex-shrink: 0',
  ].join('; ');

  const children = (node.children || []) as AnyNode[];
  const content = children.length > 0 ? ctx.renderChildren(children) : '';

  return `<div class="${ctx.prefix}-annotation-item">
  <div class="${ctx.prefix}-annotation-item-header">
    <span class="${ctx.prefix}-annotation-marker" style="${markerStyle}">${node.number}</span>
    <span class="${ctx.prefix}-annotation-item-title">${ctx.escapeHtml(node.title)}</span>
  </div>
  ${content ? `<div class="${ctx.prefix}-annotation-item-content">${content}</div>` : ''}
</div>`;
}
