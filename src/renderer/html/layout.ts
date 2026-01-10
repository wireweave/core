/**
 * Layout Renderer for wireweave
 *
 * Dedicated renderers for layout and grid components:
 * - Row/Col grid system with responsive breakpoints
 * - Semantic layout elements (header, main, footer, sidebar, section)
 * - Flexbox utilities
 */

import type {
  AnyNode,
  RowNode,
  ColNode,
  HeaderNode,
  MainNode,
  FooterNode,
  SidebarNode,
  SectionNode,
  CommonProps,
  WidthValue,
  HeightValue,
  ValueWithUnit,
} from '../../ast/types';
import type { RenderContext, ThemeConfig } from '../types';

// ===========================================
// Position Utilities (Absolute Positioning Support)
// ===========================================

/**
 * Check if a node has absolute position (x or y specified)
 */
function hasAbsolutePosition(node: CommonProps): boolean {
  return node.x !== undefined || node.y !== undefined;
}

/**
 * Resolve position value to CSS pixels
 */
function resolvePositionValue(value: number | ValueWithUnit | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'object' && 'value' in value && 'unit' in value) {
    return `${value.value}${value.unit}`;
  }
  return undefined;
}

/**
 * Build absolute position styles
 * Returns styles for position: absolute with left/top when x/y are specified
 */
function buildPositionStyles(node: CommonProps): string[] {
  const styles: string[] = [];

  if (hasAbsolutePosition(node)) {
    styles.push('position: absolute');

    const left = resolvePositionValue(node.x);
    const top = resolvePositionValue(node.y);

    if (left !== undefined) styles.push(`left: ${left}`);
    if (top !== undefined) styles.push(`top: ${top}`);
  }

  return styles;
}

/**
 * Type for node renderer callback
 */
export type NodeRenderer = (node: AnyNode) => string;

/**
 * Type for children renderer callback
 */
export type ChildrenRenderer = (children: AnyNode[]) => string;

/**
 * Layout node types
 */
export type LayoutNodeType = 'Row' | 'Col' | 'Header' | 'Main' | 'Footer' | 'Sidebar' | 'Section';

/**
 * Check if a node type is a layout node
 */
export function isLayoutNodeType(type: string): type is LayoutNodeType {
  return ['Row', 'Col', 'Header', 'Main', 'Footer', 'Sidebar', 'Section'].includes(type);
}

/**
 * Render a layout node
 */
export function renderLayoutNode(
  node: AnyNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer,
  escapeHtml: (text: string) => string
): string {
  switch (node.type) {
    case 'Row':
      return renderRow(node as RowNode, context, renderChildren);
    case 'Col':
      return renderCol(node as ColNode, context, renderChildren);
    case 'Header':
      return renderHeader(node as HeaderNode, context, renderChildren);
    case 'Main':
      return renderMain(node as MainNode, context, renderChildren);
    case 'Footer':
      return renderFooter(node as FooterNode, context, renderChildren);
    case 'Sidebar':
      return renderSidebar(node as SidebarNode, context, renderChildren);
    case 'Section':
      return renderSection(node as SectionNode, context, renderChildren, escapeHtml);
    default:
      return '';
  }
}

// ===========================================
// Row Renderer
// ===========================================

function renderRow(
  node: RowNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildRowClasses(node, prefix);
  const styles = buildRowStyles(node, context.theme);
  const children = renderChildren(node.children);

  const styleAttr = styles ? ` style="${styles}"` : '';
  return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
}

function buildRowClasses(node: RowNode, prefix: string): string {
  const classes: string[] = [`${prefix}-row`];

  // Flex properties
  if (node.flex === true) classes.push(`${prefix}-flex`);
  if (typeof node.flex === 'number') classes.push(`${prefix}-flex-${node.flex}`);
  if (node.direction === 'row') classes.push(`${prefix}-flex-row`);
  if (node.direction === 'column') classes.push(`${prefix}-flex-col`);
  if (node.direction === 'row-reverse') classes.push(`${prefix}-flex-row-reverse`);
  if (node.direction === 'column-reverse') classes.push(`${prefix}-flex-col-reverse`);
  if (node.justify) classes.push(`${prefix}-justify-${node.justify}`);
  if (node.align) classes.push(`${prefix}-align-${node.align}`);
  if (node.wrap === true) classes.push(`${prefix}-flex-wrap`);
  if (node.wrap === 'nowrap') classes.push(`${prefix}-flex-nowrap`);
  if (node.gap !== undefined) classes.push(`${prefix}-gap-${node.gap}`);

  // Spacing classes
  addSpacingClasses(classes, node, prefix);

  return classes.join(' ');
}

function buildRowStyles(node: RowNode, _theme: ThemeConfig): string {
  const styles: string[] = [];

  // Position styles (absolute positioning)
  styles.push(...buildPositionStyles(node));

  // Width/Height when using absolute positioning
  if (typeof node.w === 'number') {
    styles.push(`width: ${node.w}px`);
  } else if (node.w && typeof node.w === 'object' && 'value' in node.w) {
    styles.push(`width: ${node.w.value}${node.w.unit}`);
  }

  if (typeof node.h === 'number') {
    styles.push(`height: ${node.h}px`);
  } else if (node.h && typeof node.h === 'object' && 'value' in node.h) {
    styles.push(`height: ${node.h.value}${node.h.unit}`);
  }

  // Gap as inline style for ValueWithUnit
  if (node.gap && typeof node.gap === 'object' && 'value' in node.gap) {
    styles.push(`gap: ${node.gap.value}${node.gap.unit}`);
  }

  return styles.join('; ');
}

// ===========================================
// Col Renderer
// ===========================================

function renderCol(
  node: ColNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildColClasses(node, prefix);
  const styles = buildColStyles(node, context.theme);
  const children = renderChildren(node.children);

  const styleAttr = styles ? ` style="${styles}"` : '';
  return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
}

function buildColClasses(node: ColNode, prefix: string): string {
  const classes: string[] = [`${prefix}-col`];

  // Grid span classes
  if (node.span !== undefined) classes.push(`${prefix}-col-${node.span}`);

  // Responsive breakpoint classes
  if (node.sm !== undefined) classes.push(`${prefix}-col-sm-${node.sm}`);
  if (node.md !== undefined) classes.push(`${prefix}-col-md-${node.md}`);
  if (node.lg !== undefined) classes.push(`${prefix}-col-lg-${node.lg}`);
  if (node.xl !== undefined) classes.push(`${prefix}-col-xl-${node.xl}`);

  // Flex properties
  if (node.flex === true) classes.push(`${prefix}-flex`);
  if (typeof node.flex === 'number') classes.push(`${prefix}-flex-${node.flex}`);
  if (node.direction === 'row') classes.push(`${prefix}-flex-row`);
  if (node.direction === 'column') classes.push(`${prefix}-flex-col`);
  if (node.justify) classes.push(`${prefix}-justify-${node.justify}`);
  if (node.align) classes.push(`${prefix}-align-${node.align}`);

  // Size classes (for predefined values)
  if (node.w === 'full') classes.push(`${prefix}-w-full`);
  if (node.w === 'auto') classes.push(`${prefix}-w-auto`);
  if (node.w === 'fit') classes.push(`${prefix}-w-fit`);
  if (node.h === 'full') classes.push(`${prefix}-h-full`);
  if (node.h === 'auto') classes.push(`${prefix}-h-auto`);
  if (node.h === 'screen') classes.push(`${prefix}-h-screen`);

  // Spacing classes
  addSpacingClasses(classes, node, prefix);

  return classes.join(' ');
}

function buildColStyles(node: ColNode, _theme: ThemeConfig): string {
  const styles: string[] = [];

  // Position styles (absolute positioning)
  styles.push(...buildPositionStyles(node));

  // Width (numeric values as inline style)
  if (typeof node.w === 'number') {
    styles.push(`width: ${node.w}px`);
  } else if (node.w && typeof node.w === 'object' && 'value' in node.w) {
    styles.push(`width: ${node.w.value}${node.w.unit}`);
  } else if (typeof node.w === 'string' && !['full', 'auto', 'fit', 'screen'].includes(node.w)) {
    styles.push(`width: ${resolveSizeValue(node.w)}`);
  }

  // Height (numeric values as inline style)
  if (typeof node.h === 'number') {
    styles.push(`height: ${node.h}px`);
  } else if (node.h && typeof node.h === 'object' && 'value' in node.h) {
    styles.push(`height: ${node.h.value}${node.h.unit}`);
  } else if (typeof node.h === 'string' && !['full', 'auto', 'screen'].includes(node.h)) {
    styles.push(`height: ${resolveSizeValue(node.h)}`);
  }

  // Gap as inline style for ValueWithUnit
  if (node.gap && typeof node.gap === 'object' && 'value' in node.gap) {
    styles.push(`gap: ${node.gap.value}${node.gap.unit}`);
  }

  // Order
  if (node.order !== undefined) {
    styles.push(`order: ${node.order}`);
  }

  return styles.join('; ');
}

// ===========================================
// Semantic Layout Renderers
// ===========================================

function renderHeader(
  node: HeaderNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildSemanticClasses('header', node, prefix);
  const styles = buildSemanticStyles(node, context.theme);
  const children = renderChildren(node.children);

  // Add no-border class if border is false
  const borderClass = node.border === false ? ` ${prefix}-no-border` : '';
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<header class="${classes}${borderClass}"${styleAttr}>\n${children}\n</header>`;
}

function renderMain(
  node: MainNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildSemanticClasses('main', node, prefix);
  const styles = buildSemanticStyles(node, context.theme);
  const children = renderChildren(node.children);

  const styleAttr = styles ? ` style="${styles}"` : '';
  return `<main class="${classes}"${styleAttr}>\n${children}\n</main>`;
}

function renderFooter(
  node: FooterNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes = buildSemanticClasses('footer', node, prefix);
  const styles = buildSemanticStyles(node, context.theme);
  const children = renderChildren(node.children);

  // Add no-border class if border is false
  const borderClass = node.border === false ? ` ${prefix}-no-border` : '';
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<footer class="${classes}${borderClass}"${styleAttr}>\n${children}\n</footer>`;
}

function renderSidebar(
  node: SidebarNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer
): string {
  const prefix = context.options.classPrefix;
  const classes: string[] = [`${prefix}-sidebar`];

  // Position class
  if (node.position === 'right') {
    classes.push(`${prefix}-sidebar-right`);
  }

  // Span width (using col classes for width)
  if (node.span !== undefined) {
    classes.push(`${prefix}-col-${node.span}`);
  }

  // Flex properties
  if (node.flex === true) classes.push(`${prefix}-flex`);
  if (typeof node.flex === 'number') classes.push(`${prefix}-flex-${node.flex}`);
  if (node.direction) classes.push(`${prefix}-flex-${node.direction}`);
  if (node.justify) classes.push(`${prefix}-justify-${node.justify}`);
  if (node.align) classes.push(`${prefix}-align-${node.align}`);

  // Spacing classes
  addSpacingClasses(classes, node, prefix);

  const styles = buildSemanticStyles(node, context.theme);
  const children = renderChildren(node.children);
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<aside class="${classes.join(' ')}"${styleAttr}>\n${children}\n</aside>`;
}

function renderSection(
  node: SectionNode,
  context: RenderContext,
  renderChildren: ChildrenRenderer,
  escapeHtml: (text: string) => string
): string {
  const prefix = context.options.classPrefix;
  const classes = buildSemanticClasses('section', node, prefix);
  const styles = buildSemanticStyles(node, context.theme);
  const children = renderChildren(node.children);

  const title = node.title
    ? `<h2 class="${prefix}-title">${escapeHtml(node.title)}</h2>\n`
    : '';
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<section class="${classes}"${styleAttr}>\n${title}${children}\n</section>`;
}

// ===========================================
// Utility Functions
// ===========================================

function buildSemanticClasses(tag: string, node: CommonProps, prefix: string): string {
  const classes: string[] = [`${prefix}-${tag}`];

  // Flex properties
  if (node.flex === true) classes.push(`${prefix}-flex`);
  if (typeof node.flex === 'number') classes.push(`${prefix}-flex-${node.flex}`);
  if (node.direction === 'row') classes.push(`${prefix}-flex-row`);
  if (node.direction === 'column') classes.push(`${prefix}-flex-col`);
  if (node.justify) classes.push(`${prefix}-justify-${node.justify}`);
  if (node.align) classes.push(`${prefix}-align-${node.align}`);
  if (node.gap !== undefined) classes.push(`${prefix}-gap-${node.gap}`);

  // Spacing classes
  addSpacingClasses(classes, node, prefix);

  return classes.join(' ');
}

function buildSemanticStyles(node: CommonProps, _theme: ThemeConfig): string {
  const styles: string[] = [];

  // Position styles (absolute positioning)
  styles.push(...buildPositionStyles(node));

  // Width
  if (typeof node.w === 'number') {
    styles.push(`width: ${node.w}px`);
  } else if (node.w && typeof node.w === 'object' && 'value' in node.w) {
    styles.push(`width: ${node.w.value}${node.w.unit}`);
  }

  // Height
  if (typeof node.h === 'number') {
    styles.push(`height: ${node.h}px`);
  } else if (node.h && typeof node.h === 'object' && 'value' in node.h) {
    styles.push(`height: ${node.h.value}${node.h.unit}`);
  }

  // Gap as inline style for ValueWithUnit
  if (node.gap && typeof node.gap === 'object' && 'value' in node.gap) {
    styles.push(`gap: ${node.gap.value}${node.gap.unit}`);
  }

  return styles.join('; ');
}

function addSpacingClasses(classes: string[], node: CommonProps, prefix: string): void {
  // Padding
  if (node.p !== undefined) classes.push(`${prefix}-p-${node.p}`);
  if (node.px !== undefined) classes.push(`${prefix}-px-${node.px}`);
  if (node.py !== undefined) classes.push(`${prefix}-py-${node.py}`);
  if (node.pt !== undefined) classes.push(`${prefix}-pt-${node.pt}`);
  if (node.pr !== undefined) classes.push(`${prefix}-pr-${node.pr}`);
  if (node.pb !== undefined) classes.push(`${prefix}-pb-${node.pb}`);
  if (node.pl !== undefined) classes.push(`${prefix}-pl-${node.pl}`);

  // Margin
  if (node.m !== undefined) classes.push(`${prefix}-m-${node.m}`);
  if (node.mx !== undefined) classes.push(`${prefix}-mx-${node.mx}`);
  if (node.my !== undefined) classes.push(`${prefix}-my-${node.my}`);
  if (node.mt !== undefined) classes.push(`${prefix}-mt-${node.mt}`);
  if (node.mr !== undefined) classes.push(`${prefix}-mr-${node.mr}`);
  if (node.mb !== undefined) classes.push(`${prefix}-mb-${node.mb}`);
  if (node.ml !== undefined) classes.push(`${prefix}-ml-${node.ml}`);
}

/**
 * Resolve size value to CSS
 */
function resolveSizeValue(value: WidthValue | HeightValue): string {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  // ValueWithUnit object: direct CSS value
  if (typeof value === 'object' && 'value' in value && 'unit' in value) {
    return `${value.value}${value.unit}`;
  }

  switch (value) {
    case 'full':
      return '100%';
    case 'auto':
      return 'auto';
    case 'screen':
      return '100vh';
    case 'fit':
      return 'fit-content';
    default:
      // Exhaustive check - this should never be reached
      return value as string;
  }
}
