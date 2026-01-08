/**
 * HTML Renderer for wireweave
 *
 * Converts AST nodes to HTML output
 */

import type {
  AnyNode,
  PageNode,
  HeaderNode,
  MainNode,
  FooterNode,
  SidebarNode,
  SectionNode,
  RowNode,
  ColNode,
  CardNode,
  ModalNode,
  DrawerNode,
  AccordionNode,
  TextNode,
  TitleNode,
  LinkNode,
  InputNode,
  TextareaNode,
  SelectNode,
  CheckboxNode,
  RadioNode,
  SwitchNode,
  SliderNode,
  ButtonNode,
  ImageNode,
  PlaceholderNode,
  AvatarNode,
  BadgeNode,
  IconNode,
  TableNode,
  ListNode,
  AlertNode,
  ToastNode,
  ProgressNode,
  SpinnerNode,
  TooltipNode,
  PopoverNode,
  DropdownNode,
  NavNode,
  TabsNode,
  BreadcrumbNode,
  DividerComponentNode,
  CommonProps,
  ValueWithUnit,
  SpacingValue,
} from '../../ast/types';
// hasChildren guard available from ast/guards if needed
import { BaseRenderer } from './base';
import type { RenderOptions } from '../types';
import { resolveViewport } from '../../viewport';
import { getIconData, renderIconSvg } from '../../icons/lucide-icons';

// Re-export layout and component utilities
export * from './layout';
export * from './components';

// Import size resolution helper for use in HTMLRenderer
import { resolveSizeValue, buildClassString as _buildClassString } from './components';

// Spacing token table: number -> CSS value
// Token values (0-20) map to px values
const SPACING_TOKENS: Record<number, string> = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
};

/**
 * Resolve a spacing value to CSS string
 * - number: spacing token (e.g., 4 → '16px')
 * - ValueWithUnit: direct CSS value (e.g., { value: 16, unit: 'px' } → '16px')
 */
function resolveSpacingValue(value: SpacingValue | undefined): string | undefined {
  if (value === undefined) return undefined;

  // ValueWithUnit object: direct CSS value
  if (typeof value === 'object' && 'value' in value && 'unit' in value) {
    return `${value.value}${value.unit}`;
  }

  // Number: spacing token
  if (typeof value === 'number') {
    // Look up token value, fallback to direct px if not in token table
    return SPACING_TOKENS[value] ?? `${value}px`;
  }

  return undefined;
}

/**
 * Type guard to check if a value is a ValueWithUnit object
 */
function isValueWithUnit(value: unknown): value is ValueWithUnit {
  return typeof value === 'object' && value !== null && 'value' in value && 'unit' in value;
}

/**
 * Resolve a size value (width/height) to CSS string
 * - number: direct px value (dimensions are not tokenized)
 * - ValueWithUnit: direct CSS value with unit
 */
function resolveSizeValueToCss(value: number | ValueWithUnit | undefined): string | undefined {
  if (value === undefined) return undefined;

  // ValueWithUnit object: direct CSS value
  if (isValueWithUnit(value)) {
    return `${value.value}${value.unit}`;
  }

  // Number: direct px value (for width/height)
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return undefined;
}

/**
 * HTML Renderer class
 *
 * Renders wireframe AST to semantic HTML with utility classes
 */
export class HtmlRenderer extends BaseRenderer {
  constructor(options: RenderOptions = {}) {
    super(options);
  }

  /**
   * Render a page node
   */
  protected renderPage(node: PageNode): string {
    // Resolve viewport size - use explicit w/h if provided, otherwise use viewport/device
    let viewport = resolveViewport(node.viewport, node.device);

    // Override with explicit width/height if provided (for playground-style sizing)
    // Support both short form (w/h) and long form (width/height)
    const nodeAny = node as PageNode & { width?: number; height?: number };
    const explicitW = node.w ?? nodeAny.width;
    const explicitH = node.h ?? nodeAny.height;

    if (explicitW !== undefined || explicitH !== undefined) {
      const explicitWidth = typeof explicitW === 'number' ? explicitW :
                           (typeof explicitW === 'string' && /^\d+$/.test(explicitW) ? parseInt(explicitW) : viewport.width);
      const explicitHeight = typeof explicitH === 'number' ? explicitH :
                            (typeof explicitH === 'string' && /^\d+$/.test(explicitH) ? parseInt(explicitH) : viewport.height);
      viewport = {
        width: explicitWidth,
        height: explicitHeight,
        label: `${explicitWidth}x${explicitHeight}`,
        category: explicitWidth <= 430 ? 'mobile' : explicitWidth <= 1024 ? 'tablet' : 'desktop',
      };
    }

    const classes = this.buildClassString([
      `${this.prefix}-page`,
      node.centered ? `${this.prefix}-page-centered` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const children = this.renderChildren(node.children);
    const title = node.title ? `<title>${this.escapeHtml(node.title)}</title>\n` : '';

    // Build common styles (padding, margin, etc.) and combine with viewport dimensions
    const commonStyles = this.buildCommonStyles(node);
    const viewportStyle = `width: ${viewport.width}px; height: ${viewport.height}px`;
    const combinedStyle = commonStyles ? `${viewportStyle}; ${commonStyles}` : viewportStyle;

    // Add data attributes for viewport info
    const dataAttrs = `data-viewport-width="${viewport.width}" data-viewport-height="${viewport.height}" data-viewport-label="${viewport.label}"`;

    return `<div class="${classes}" style="${combinedStyle}" ${dataAttrs}>\n${title}${children}\n</div>`;
  }

  /**
   * Render any AST node
   */
  protected renderNode(node: AnyNode): string {
    switch (node.type) {
      // Layout nodes
      case 'Page':
        return this.renderPage(node as PageNode);
      case 'Header':
        return this.renderHeader(node as HeaderNode);
      case 'Main':
        return this.renderMain(node as MainNode);
      case 'Footer':
        return this.renderFooter(node as FooterNode);
      case 'Sidebar':
        return this.renderSidebar(node as SidebarNode);
      case 'Section':
        return this.renderSection(node as SectionNode);

      // Grid nodes
      case 'Row':
        return this.renderRow(node as RowNode);
      case 'Col':
        return this.renderCol(node as ColNode);

      // Container nodes
      case 'Card':
        return this.renderCard(node as CardNode);
      case 'Modal':
        return this.renderModal(node as ModalNode);
      case 'Drawer':
        return this.renderDrawer(node as DrawerNode);
      case 'Accordion':
        return this.renderAccordion(node as AccordionNode);

      // Text nodes
      case 'Text':
        return this.renderText(node as TextNode);
      case 'Title':
        return this.renderTitle(node as TitleNode);
      case 'Link':
        return this.renderLink(node as LinkNode);

      // Input nodes
      case 'Input':
        return this.renderInput(node as InputNode);
      case 'Textarea':
        return this.renderTextarea(node as TextareaNode);
      case 'Select':
        return this.renderSelect(node as SelectNode);
      case 'Checkbox':
        return this.renderCheckbox(node as CheckboxNode);
      case 'Radio':
        return this.renderRadio(node as RadioNode);
      case 'Switch':
        return this.renderSwitch(node as SwitchNode);
      case 'Slider':
        return this.renderSlider(node as SliderNode);

      // Button
      case 'Button':
        return this.renderButton(node as ButtonNode);

      // Display nodes
      case 'Image':
        return this.renderImage(node as ImageNode);
      case 'Placeholder':
        return this.renderPlaceholder(node as PlaceholderNode);
      case 'Avatar':
        return this.renderAvatar(node as AvatarNode);
      case 'Badge':
        return this.renderBadge(node as BadgeNode);
      case 'Icon':
        return this.renderIcon(node as IconNode);

      // Data nodes
      case 'Table':
        return this.renderTable(node as TableNode);
      case 'List':
        return this.renderList(node as ListNode);

      // Feedback nodes
      case 'Alert':
        return this.renderAlert(node as AlertNode);
      case 'Toast':
        return this.renderToast(node as ToastNode);
      case 'Progress':
        return this.renderProgress(node as ProgressNode);
      case 'Spinner':
        return this.renderSpinner(node as SpinnerNode);

      // Overlay nodes
      case 'Tooltip':
        return this.renderTooltip(node as TooltipNode);
      case 'Popover':
        return this.renderPopover(node as PopoverNode);
      case 'Dropdown':
        return this.renderDropdown(node as DropdownNode);

      // Navigation nodes
      case 'Nav':
        return this.renderNav(node as NavNode);
      case 'Tabs':
        return this.renderTabs(node as TabsNode);
      case 'Breadcrumb':
        return this.renderBreadcrumb(node as BreadcrumbNode);

      // Other
      case 'Divider':
        return this.renderDivider(node as DividerComponentNode);

      default:
        return `<!-- Unknown node type: ${(node as AnyNode).type} -->`;
    }
  }

  /**
   * Render children nodes
   */
  protected renderChildren(children: AnyNode[]): string {
    return this.withDepth(() => {
      return children
        .map((child) => this.indent(this.renderNode(child)))
        .join('\n');
    });
  }

  /**
   * Get common CSS classes from props
   * Uses Omit to exclude 'align' since TextNode/TitleNode have incompatible align types
   *
   * All numeric values are handled by buildCommonStyles as inline px values.
   * CSS classes are only used for keyword values (full, auto, screen, fit, etc.)
   */
  private getCommonClasses(props: Omit<Partial<CommonProps>, 'align'> & { align?: string }): string[] {
    const classes: string[] = [];
    const p = this.prefix;

    // Spacing - only 'auto' uses class, all numbers use inline px styles
    if (props.mx === 'auto') classes.push(`${p}-mx-auto`);

    // Size - only keyword values use classes
    if (props.w === 'full') classes.push(`${p}-w-full`);
    if (props.w === 'auto') classes.push(`${p}-w-auto`);
    if (props.w === 'fit') classes.push(`${p}-w-fit`);
    if (props.h === 'full') classes.push(`${p}-h-full`);
    if (props.h === 'auto') classes.push(`${p}-h-auto`);
    if (props.h === 'screen') classes.push(`${p}-h-screen`);

    // Flex
    if (props.flex === true) classes.push(`${p}-flex`);
    if (typeof props.flex === 'number') classes.push(`${p}-flex-${props.flex}`);
    if (props.direction === 'row') classes.push(`${p}-flex-row`);
    if (props.direction === 'column') classes.push(`${p}-flex-col`);
    if (props.direction === 'row-reverse') classes.push(`${p}-flex-row-reverse`);
    if (props.direction === 'column-reverse') classes.push(`${p}-flex-col-reverse`);
    if (props.justify) classes.push(`${p}-justify-${props.justify}`);
    if (props.align) classes.push(`${p}-align-${props.align}`);
    if (props.wrap === true) classes.push(`${p}-flex-wrap`);
    if (props.wrap === 'nowrap') classes.push(`${p}-flex-nowrap`);
    // gap is handled by inline styles for numeric values

    return classes;
  }

  // ===========================================
  // Layout Node Renderers
  // ===========================================

  private renderHeader(node: HeaderNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-header`,
      node.border === false ? `${this.prefix}-no-border` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const children = this.renderChildren(node.children);
    return `<header class="${classes}"${styleAttr}>\n${children}\n</header>`;
  }

  private renderMain(node: MainNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-main`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const children = this.renderChildren(node.children);
    return `<main class="${classes}"${styleAttr}>\n${children}\n</main>`;
  }

  private renderFooter(node: FooterNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-footer`,
      node.border === false ? `${this.prefix}-no-border` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const children = this.renderChildren(node.children);
    return `<footer class="${classes}"${styleAttr}>\n${children}\n</footer>`;
  }

  private renderSidebar(node: SidebarNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-sidebar`,
      node.position === 'right' ? `${this.prefix}-sidebar-right` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const children = this.renderChildren(node.children);
    return `<aside class="${classes}"${styleAttr}>\n${children}\n</aside>`;
  }

  private renderSection(node: SectionNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-section`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const title = node.title
      ? `<h2 class="${this.prefix}-title">${this.escapeHtml(node.title)}</h2>\n`
      : '';
    const children = this.renderChildren(node.children);
    return `<section class="${classes}"${styleAttr}>\n${title}${children}\n</section>`;
  }

  // ===========================================
  // Grid Node Renderers
  // ===========================================

  private renderRow(node: RowNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-row`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const children = this.renderChildren(node.children);
    return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
  }

  private renderCol(node: ColNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-col`,
      node.span ? `${this.prefix}-col-${node.span}` : undefined,
      // Responsive breakpoint classes
      node.sm ? `${this.prefix}-col-sm-${node.sm}` : undefined,
      node.md ? `${this.prefix}-col-md-${node.md}` : undefined,
      node.lg ? `${this.prefix}-col-lg-${node.lg}` : undefined,
      node.xl ? `${this.prefix}-col-xl-${node.xl}` : undefined,
      ...this.getCommonClasses(node),
    ]);

    // Build inline styles for numeric width/height and order
    const styles = this.buildColStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const children = this.renderChildren(node.children);
    return `<div class="${classes}"${styleAttr}>\n${children}\n</div>`;
  }

  /**
   * Build common inline styles for all values
   *
   * Spacing values (p, m, gap) use token system:
   * - number: spacing token (e.g., p=4 → padding: 16px from token table)
   * - ValueWithUnit: direct CSS value (e.g., p=16px → padding: 16px)
   *
   * Size values (w, h, minW, maxW, minH, maxH) use direct px:
   * - number: direct px value (e.g., w=400 → width: 400px)
   * - ValueWithUnit: direct CSS value (e.g., w=50% → width: 50%)
   *
   * Token table: 0=0px, 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px, 8=32px, etc.
   *
   * Uses Omit to exclude 'align' since TextNode/TitleNode have incompatible align types
   */
  private buildCommonStyles(props: Omit<Partial<CommonProps>, 'align'> & { align?: string }): string {
    const styles: string[] = [];

    // Width (direct px or ValueWithUnit)
    const wValue = resolveSizeValueToCss(props.w as number | ValueWithUnit | undefined);
    if (wValue) {
      styles.push(`width: ${wValue}`);
    }

    // Height (direct px or ValueWithUnit)
    // Also set min-height to override CSS defaults (e.g., placeholder min-height: 100px)
    const hValue = resolveSizeValueToCss(props.h as number | ValueWithUnit | undefined);
    if (hValue) {
      styles.push(`height: ${hValue}`);
      styles.push(`min-height: ${hValue}`);
    }

    // Min/Max Width
    const minWValue = resolveSizeValueToCss(props.minW);
    if (minWValue) {
      styles.push(`min-width: ${minWValue}`);
    }
    const maxWValue = resolveSizeValueToCss(props.maxW);
    if (maxWValue) {
      styles.push(`max-width: ${maxWValue}`);
    }

    // Min/Max Height
    const minHValue = resolveSizeValueToCss(props.minH);
    if (minHValue) {
      styles.push(`min-height: ${minHValue}`);
    }
    const maxHValue = resolveSizeValueToCss(props.maxH);
    if (maxHValue) {
      styles.push(`max-height: ${maxHValue}`);
    }

    // Padding - uses spacing tokens
    const pValue = resolveSpacingValue(props.p);
    if (pValue) {
      styles.push(`padding: ${pValue}`);
    }
    const pxValue = resolveSpacingValue(props.px);
    if (pxValue) {
      styles.push(`padding-left: ${pxValue}`);
      styles.push(`padding-right: ${pxValue}`);
    }
    const pyValue = resolveSpacingValue(props.py);
    if (pyValue) {
      styles.push(`padding-top: ${pyValue}`);
      styles.push(`padding-bottom: ${pyValue}`);
    }
    const ptValue = resolveSpacingValue(props.pt);
    if (ptValue) {
      styles.push(`padding-top: ${ptValue}`);
    }
    const prValue = resolveSpacingValue(props.pr);
    if (prValue) {
      styles.push(`padding-right: ${prValue}`);
    }
    const pbValue = resolveSpacingValue(props.pb);
    if (pbValue) {
      styles.push(`padding-bottom: ${pbValue}`);
    }
    const plValue = resolveSpacingValue(props.pl);
    if (plValue) {
      styles.push(`padding-left: ${plValue}`);
    }

    // Margin - uses spacing tokens
    const mValue = resolveSpacingValue(props.m);
    if (mValue) {
      styles.push(`margin: ${mValue}`);
    }
    const mxValue = props.mx !== 'auto' ? resolveSpacingValue(props.mx as SpacingValue | undefined) : undefined;
    if (mxValue) {
      styles.push(`margin-left: ${mxValue}`);
      styles.push(`margin-right: ${mxValue}`);
    }
    const myValue = resolveSpacingValue(props.my);
    if (myValue) {
      styles.push(`margin-top: ${myValue}`);
      styles.push(`margin-bottom: ${myValue}`);
    }
    const mtValue = resolveSpacingValue(props.mt);
    if (mtValue) {
      styles.push(`margin-top: ${mtValue}`);
    }
    const mrValue = resolveSpacingValue(props.mr);
    if (mrValue) {
      styles.push(`margin-right: ${mrValue}`);
    }
    const mbValue = resolveSpacingValue(props.mb);
    if (mbValue) {
      styles.push(`margin-bottom: ${mbValue}`);
    }
    const mlValue = resolveSpacingValue(props.ml);
    if (mlValue) {
      styles.push(`margin-left: ${mlValue}`);
    }

    // Gap - uses spacing tokens
    const gapValue = resolveSpacingValue(props.gap);
    if (gapValue) {
      styles.push(`gap: ${gapValue}`);
    }

    return styles.join('; ');
  }

  /**
   * Build inline styles for Col node (extends common styles with order)
   */
  private buildColStyles(node: ColNode): string {
    const styles: string[] = [];

    // Get common styles first
    const commonStyles = this.buildCommonStyles(node);
    if (commonStyles) {
      styles.push(commonStyles);
    }

    // Order (Col-specific)
    if (node.order !== undefined) {
      styles.push(`order: ${node.order}`);
    }

    return styles.join('; ');
  }

  // ===========================================
  // Container Node Renderers
  // ===========================================

  private renderCard(node: CardNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-card`,
      node.shadow ? `${this.prefix}-card-shadow-${node.shadow}` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const title = node.title
      ? `<h3 class="${this.prefix}-title">${this.escapeHtml(node.title)}</h3>\n`
      : '';
    const children = this.renderChildren(node.children);
    return `<div class="${classes}"${styleAttr}>\n${title}${children}\n</div>`;
  }

  private renderModal(node: ModalNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-modal`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const title = node.title
      ? `<h2 class="${this.prefix}-title">${this.escapeHtml(node.title)}</h2>\n`
      : '';
    const children = this.renderChildren(node.children);
    return `<div class="${this.prefix}-modal-backdrop">
  <div class="${classes}"${styleAttr} role="dialog" aria-modal="true">
${title}${children}
  </div>
</div>`;
  }

  private renderDrawer(node: DrawerNode): string {
    const position = node.position || 'left';
    const classes = this.buildClassString([
      `${this.prefix}-drawer`,
      `${this.prefix}-drawer-${position}`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const title = node.title
      ? `<h2 class="${this.prefix}-title">${this.escapeHtml(node.title)}</h2>\n`
      : '';
    const children = this.renderChildren(node.children);
    return `<aside class="${classes}"${styleAttr}>\n${title}${children}\n</aside>`;
  }

  private renderAccordion(node: AccordionNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-accordion`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const title = node.title
      ? `<button class="${this.prefix}-accordion-header">${this.escapeHtml(node.title)}</button>\n`
      : '';
    const children = this.renderChildren(node.children);
    return `<div class="${classes}"${styleAttr}>\n${title}<div class="${this.prefix}-accordion-content">\n${children}\n</div>\n</div>`;
  }

  // ===========================================
  // Text Node Renderers
  // ===========================================

  private renderText(node: TextNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-text`,
      node.size ? `${this.prefix}-text-${node.size}` : undefined,
      node.weight ? `${this.prefix}-text-${node.weight}` : undefined,
      node.align ? `${this.prefix}-text-${node.align}` : undefined,
      node.muted ? `${this.prefix}-text-muted` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    return `<p class="${classes}"${styleAttr}>${this.escapeHtml(node.content)}</p>`;
  }

  private renderTitle(node: TitleNode): string {
    const level = node.level || 1;
    const tag = `h${level}`;
    const classes = this.buildClassString([
      `${this.prefix}-title`,
      node.size ? `${this.prefix}-text-${node.size}` : undefined,
      node.align ? `${this.prefix}-text-${node.align}` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    return `<${tag} class="${classes}"${styleAttr}>${this.escapeHtml(node.content)}</${tag}>`;
  }

  private renderLink(node: LinkNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-link`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      class: classes,
      href: node.href || '#',
    };

    if (node.external) {
      attrs.target = '_blank';
      attrs.rel = 'noopener noreferrer';
    }

    return `<a${this.buildAttrsString(attrs)}${styleAttr}>${this.escapeHtml(node.content)}</a>`;
  }

  // ===========================================
  // Input Node Renderers
  // ===========================================

  private renderInput(node: InputNode): string {
    const inputClasses = this.buildClassString([
      `${this.prefix}-input`,
      node.icon ? `${this.prefix}-input-with-icon` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      class: inputClasses,
      type: node.inputType || 'text',
      placeholder: node.placeholder,
      value: node.value,
      disabled: node.disabled,
      required: node.required,
      readonly: node.readonly,
    };

    const inputElement = `<input${this.buildAttrsString(attrs)} />`;

    // Wrap with icon if specified
    if (node.icon) {
      const iconData = getIconData(node.icon);
      let iconHtml: string;
      if (iconData) {
        iconHtml = renderIconSvg(iconData, 16, 2, `${this.prefix}-input-icon`);
      } else {
        iconHtml = `<span class="${this.prefix}-input-icon">[${this.escapeHtml(node.icon)}]</span>`;
      }

      const wrapperClasses = this.buildClassString([`${this.prefix}-input-wrapper`]);
      const wrapper = `<div class="${wrapperClasses}"${styleAttr}>${iconHtml}${inputElement}</div>`;

      if (node.label) {
        return `<label class="${this.prefix}-input-label">${this.escapeHtml(node.label)}</label>\n${wrapper}`;
      }
      return wrapper;
    }

    const input = `<input${this.buildAttrsString(attrs)}${styleAttr} />`;

    if (node.label) {
      return `<label class="${this.prefix}-input-label">${this.escapeHtml(node.label)}</label>\n${input}`;
    }

    return input;
  }

  private renderTextarea(node: TextareaNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-input`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      class: classes,
      placeholder: node.placeholder,
      disabled: node.disabled,
      required: node.required,
      rows: node.rows?.toString(),
    };

    const textarea = `<textarea${this.buildAttrsString(attrs)}${styleAttr}>${this.escapeHtml(node.value || '')}</textarea>`;

    if (node.label) {
      return `<label class="${this.prefix}-input-label">${this.escapeHtml(node.label)}</label>\n${textarea}`;
    }

    return textarea;
  }

  private renderSelect(node: SelectNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-input`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      class: classes,
      disabled: node.disabled,
      required: node.required,
    };

    const options = node.options
      .map((opt) => {
        if (typeof opt === 'string') {
          const selected = opt === node.value ? ' selected' : '';
          return `<option value="${this.escapeHtml(opt)}"${selected}>${this.escapeHtml(opt)}</option>`;
        }
        const selected = opt.value === node.value ? ' selected' : '';
        return `<option value="${this.escapeHtml(opt.value)}"${selected}>${this.escapeHtml(opt.label)}</option>`;
      })
      .join('\n');

    const placeholder = node.placeholder
      ? `<option value="" disabled selected>${this.escapeHtml(node.placeholder)}</option>\n`
      : '';

    const select = `<select${this.buildAttrsString(attrs)}${styleAttr}>\n${placeholder}${options}\n</select>`;

    if (node.label) {
      return `<label class="${this.prefix}-input-label">${this.escapeHtml(node.label)}</label>\n${select}`;
    }

    return select;
  }

  private renderCheckbox(node: CheckboxNode): string {
    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      type: 'checkbox',
      checked: node.checked,
      disabled: node.disabled,
    };

    const checkbox = `<input${this.buildAttrsString(attrs)} />`;

    if (node.label) {
      return `<label class="${this.prefix}-checkbox"${styleAttr}>${checkbox}<span>${this.escapeHtml(node.label)}</span></label>`;
    }

    return checkbox;
  }

  private renderRadio(node: RadioNode): string {
    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      type: 'radio',
      name: node.name,
      checked: node.checked,
      disabled: node.disabled,
    };

    const radio = `<input${this.buildAttrsString(attrs)} />`;

    if (node.label) {
      return `<label class="${this.prefix}-radio"${styleAttr}>${radio}<span>${this.escapeHtml(node.label)}</span></label>`;
    }

    return radio;
  }

  private renderSwitch(node: SwitchNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-switch`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      type: 'checkbox',
      role: 'switch',
      checked: node.checked,
      disabled: node.disabled,
    };

    const switchEl = `<input${this.buildAttrsString(attrs)} />`;

    if (node.label) {
      return `<label class="${classes}"${styleAttr}>${switchEl} ${this.escapeHtml(node.label)}</label>`;
    }

    // Always wrap in label with .wf-switch class for proper styling
    return `<label class="${classes}"${styleAttr}>${switchEl}</label>`;
  }

  private renderSlider(node: SliderNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-slider`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      class: classes,
      type: 'range',
      min: node.min?.toString(),
      max: node.max?.toString(),
      step: node.step?.toString(),
      value: node.value?.toString(),
      disabled: node.disabled,
    };

    const slider = `<input${this.buildAttrsString(attrs)}${styleAttr} />`;

    if (node.label) {
      return `<label class="${this.prefix}-input-label">${this.escapeHtml(node.label)}</label>\n${slider}`;
    }

    return slider;
  }

  // ===========================================
  // Button Renderer
  // ===========================================

  private renderButton(node: ButtonNode): string {
    // Icon-only button: has icon but no text content
    const isIconOnly = node.icon && !node.content.trim();
    const classes = this.buildClassString([
      `${this.prefix}-button`,
      node.primary ? `${this.prefix}-button-primary` : undefined,
      node.secondary ? `${this.prefix}-button-secondary` : undefined,
      node.outline ? `${this.prefix}-button-outline` : undefined,
      node.ghost ? `${this.prefix}-button-ghost` : undefined,
      node.danger ? `${this.prefix}-button-danger` : undefined,
      node.size ? `${this.prefix}-button-${node.size}` : undefined,
      node.disabled ? `${this.prefix}-button-disabled` : undefined,
      node.loading ? `${this.prefix}-button-loading` : undefined,
      isIconOnly ? `${this.prefix}-button-icon-only` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const attrs: Record<string, string | boolean | undefined> = {
      class: classes,
      disabled: node.disabled,
    };

    let icon = '';
    if (node.icon) {
      const iconData = getIconData(node.icon);
      if (iconData) {
        icon = renderIconSvg(iconData, 16, 2, `${this.prefix}-icon`);
      } else {
        icon = `<span class="${this.prefix}-icon">[${this.escapeHtml(node.icon)}]</span>`;
      }
    }
    const loading = node.loading ? `<span class="${this.prefix}-spinner ${this.prefix}-spinner-sm"></span>` : '';
    const content = this.escapeHtml(node.content);

    return `<button${this.buildAttrsString(attrs)}${styleAttr}>${loading}${icon}${content}</button>`;
  }

  // ===========================================
  // Display Node Renderers
  // ===========================================

  private renderImage(node: ImageNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-image`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    // If src is provided, render as actual img tag
    if (node.src) {
      const attrs: Record<string, string | boolean | undefined> = {
        class: classes,
        src: node.src,
        alt: node.alt || 'Image',
      };
      // Add style attribute for img tag
      const imgStyleAttr = styles ? `; ${styles}` : '';
      return `<img${this.buildAttrsString(attrs)}${imgStyleAttr ? ` style="${imgStyleAttr.slice(2)}"` : ''} />`;
    }

    // Otherwise render as placeholder with image icon
    const label = node.alt || 'Image';
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    return `<div class="${classes}"${styleAttr} role="img" aria-label="${this.escapeHtml(label)}">${icon}<span>${this.escapeHtml(label)}</span></div>`;
  }

  private renderPlaceholder(node: PlaceholderNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-placeholder`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const label = node.label ? this.escapeHtml(node.label) : 'Placeholder';
    return `<div class="${classes}"${styleAttr}>${label}</div>`;
  }

  private renderAvatar(node: AvatarNode): string {
    // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
    const sizeResolved = resolveSizeValue(node.size, 'avatar', this.prefix);

    const classes = this.buildClassString([
      `${this.prefix}-avatar`,
      sizeResolved.className,
      ...this.getCommonClasses(node),
    ]);

    const baseStyles = this.buildCommonStyles(node);
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

    return `<div class="${classes}"${styleAttr} role="img" aria-label="${this.escapeHtml(node.name || 'Avatar')}">${initials}</div>`;
  }

  private renderBadge(node: BadgeNode): string {
    // If icon is provided, render as icon badge (circular background with icon)
    if (node.icon) {
      const iconData = getIconData(node.icon);
      const classes = this.buildClassString([
        `${this.prefix}-badge-icon`,
        node.size ? `${this.prefix}-badge-icon-${node.size}` : undefined,
        node.variant ? `${this.prefix}-badge-icon-${node.variant}` : undefined,
        ...this.getCommonClasses(node),
      ]);

      const styles = this.buildCommonStyles(node);
      const styleAttr = styles ? ` style="${styles}"` : '';

      if (iconData) {
        const svg = renderIconSvg(iconData, 24, 2, `${this.prefix}-icon`);
        return `<span class="${classes}"${styleAttr} aria-label="${this.escapeHtml(node.icon)}">${svg}</span>`;
      }

      // Fallback for unknown icon
      return `<span class="${classes}"${styleAttr} aria-label="unknown icon">?</span>`;
    }

    // Default text badge (empty content = dot indicator)
    const isDot = !node.content || node.content.trim() === '';
    const classes = this.buildClassString([
      `${this.prefix}-badge`,
      isDot ? `${this.prefix}-badge-dot` : undefined,
      node.variant ? `${this.prefix}-badge-${node.variant}` : undefined,
      node.pill ? `${this.prefix}-badge-pill` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    return `<span class="${classes}"${styleAttr}>${this.escapeHtml(node.content)}</span>`;
  }

  private renderIcon(node: IconNode): string {
    const iconData = getIconData(node.name);

    // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
    const sizeResolved = resolveSizeValue(node.size, 'icon', this.prefix);

    const wrapperClasses = this.buildClassString([
      `${this.prefix}-icon-wrapper`,
      node.muted ? `${this.prefix}-text-muted` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const baseStyles = this.buildCommonStyles(node);

    if (iconData) {
      // Build icon class with optional size class
      const iconClasses = _buildClassString([
        `${this.prefix}-icon`,
        sizeResolved.className,
      ]);
      const svgStyleAttr = sizeResolved.style ? ` style="${sizeResolved.style}"` : '';
      const svg = renderIconSvg(iconData, 24, 2, iconClasses, svgStyleAttr);
      const wrapperStyleAttr = baseStyles ? ` style="${baseStyles}"` : '';
      return `<span class="${wrapperClasses}"${wrapperStyleAttr} aria-hidden="true">${svg}</span>`;
    }

    // Fallback for unknown icons - render a placeholder circle
    const size = sizeResolved.style?.match(/(\d+)px/)?.[1] || '24';
    const sizeNum = parseInt(size, 10);
    const placeholderSvg = `<svg class="${this.prefix}-icon ${sizeResolved.className || ''}" width="${sizeNum}" height="${sizeNum}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" fill="none" opacity="0.5"/>
      <text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">?</text>
    </svg>`;
    const wrapperStyleAttr = baseStyles ? ` style="${baseStyles}"` : '';
    return `<span class="${wrapperClasses}"${wrapperStyleAttr} aria-hidden="true" title="Unknown icon: ${this.escapeHtml(node.name)}">${placeholderSvg}</span>`;
  }

  // ===========================================
  // Data Node Renderers
  // ===========================================

  private renderTable(node: TableNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-table`,
      node.striped ? `${this.prefix}-table-striped` : undefined,
      node.bordered ? `${this.prefix}-table-bordered` : undefined,
      node.hover ? `${this.prefix}-table-hover` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const thead = `<thead><tr>${node.columns
      .map((col) => `<th>${this.escapeHtml(col)}</th>`)
      .join('')}</tr></thead>`;

    const tbody = `<tbody>${node.rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => {
              if (typeof cell === 'string') {
                // Support semantic markers and newlines in table cells
                return `<td>${this.renderTableCellContent(cell)}</td>`;
              }
              return `<td>${this.renderNode(cell)}</td>`;
            })
            .join('')}</tr>`
      )
      .join('')}</tbody>`;

    return `<table class="${classes}"${styleAttr}>\n${thead}\n${tbody}\n</table>`;
  }

  private renderList(node: ListNode): string {
    const tag = node.ordered ? 'ol' : 'ul';
    const classes = this.buildClassString([
      `${this.prefix}-list`,
      node.ordered ? `${this.prefix}-list-ordered` : undefined,
      node.none ? `${this.prefix}-list-none` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const items = node.items
      .map((item) => {
        if (typeof item === 'string') {
          return `<li class="${this.prefix}-list-item">${this.escapeHtml(item)}</li>`;
        }
        return `<li class="${this.prefix}-list-item">${this.escapeHtml(item.content)}</li>`;
      })
      .join('\n');

    return `<${tag} class="${classes}"${styleAttr}>\n${items}\n</${tag}>`;
  }

  // ===========================================
  // Feedback Node Renderers
  // ===========================================

  private renderAlert(node: AlertNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-alert`,
      node.variant ? `${this.prefix}-alert-${node.variant}` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const dismissBtn = node.dismissible
      ? ` <button class="${this.prefix}-alert-close" aria-label="Close">&times;</button>`
      : '';

    return `<div class="${classes}"${styleAttr} role="alert">${this.escapeHtml(node.content)}${dismissBtn}</div>`;
  }

  private renderToast(node: ToastNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-toast`,
      node.position ? `${this.prefix}-toast-${node.position}` : undefined,
      node.variant ? `${this.prefix}-toast-${node.variant}` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    return `<div class="${classes}"${styleAttr} role="status">${this.escapeHtml(node.content)}</div>`;
  }

  private renderProgress(node: ProgressNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-progress`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const value = node.value || 0;
    const max = node.max || 100;
    const percentage = Math.round((value / max) * 100);

    const label = node.label ? `<span class="${this.prefix}-progress-label">${this.escapeHtml(node.label)}</span>` : '';

    if (node.indeterminate) {
      return `<div class="${classes} ${this.prefix}-progress-indeterminate"${styleAttr} role="progressbar">${label}</div>`;
    }

    return `<div class="${classes}"${styleAttr} role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}">
  ${label}
  <div class="${this.prefix}-progress-bar" style="width: ${percentage}%"></div>
</div>`;
  }

  private renderSpinner(node: SpinnerNode): string {
    // Resolve size: token string (xs, sm, md, lg, xl) or custom px number
    const sizeResolved = resolveSizeValue(node.size, 'spinner', this.prefix);

    const classes = this.buildClassString([
      `${this.prefix}-spinner`,
      sizeResolved.className,
      ...this.getCommonClasses(node),
    ]);

    const baseStyles = this.buildCommonStyles(node);
    const sizeStyle = sizeResolved.style || '';
    const combinedStyles = baseStyles && sizeStyle
      ? `${baseStyles}; ${sizeStyle}`
      : baseStyles || sizeStyle;
    const styleAttr = combinedStyles ? ` style="${combinedStyles}"` : '';

    const label = node.label || 'Loading...';
    return `<span class="${classes}"${styleAttr} role="status" aria-label="${this.escapeHtml(label)}"></span>`;
  }

  // ===========================================
  // Overlay Node Renderers
  // ===========================================

  private renderTooltip(node: TooltipNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-tooltip-wrapper`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const position = node.position || 'top';
    const children = this.renderChildren(node.children);

    return `<div class="${classes}"${styleAttr}>
${children}
<div class="${this.prefix}-tooltip ${this.prefix}-tooltip-${position}" role="tooltip">${this.escapeHtml(node.content)}</div>
</div>`;
  }

  private renderPopover(node: PopoverNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-popover`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const title = node.title
      ? `<div class="${this.prefix}-popover-header">${this.escapeHtml(node.title)}</div>\n`
      : '';
    const children = this.renderChildren(node.children);

    return `<div class="${classes}"${styleAttr}>\n${title}<div class="${this.prefix}-popover-body">\n${children}\n</div>\n</div>`;
  }

  private renderDropdown(node: DropdownNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-dropdown`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const items = node.items
      .map((item) => {
        if ('type' in item && item.type === 'divider') {
          return `<hr class="${this.prefix}-divider" />`;
        }
        // TypeScript narrowing: item is DropdownItemNode after the divider check
        const dropdownItem = item as { label: string; danger?: boolean; disabled?: boolean };
        const itemClasses = this.buildClassString([
          `${this.prefix}-dropdown-item`,
          dropdownItem.danger ? `${this.prefix}-dropdown-item-danger` : undefined,
          dropdownItem.disabled ? `${this.prefix}-dropdown-item-disabled` : undefined,
        ]);
        return `<button class="${itemClasses}"${dropdownItem.disabled ? ' disabled' : ''}>${this.escapeHtml(dropdownItem.label)}</button>`;
      })
      .join('\n');

    return `<div class="${classes}"${styleAttr}>\n${items}\n</div>`;
  }

  // ===========================================
  // Navigation Node Renderers
  // ===========================================

  private renderNav(node: NavNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-nav`,
      node.vertical ? `${this.prefix}-nav-vertical` : undefined,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    // If block syntax (children), render children
    if (node.children && node.children.length > 0) {
      const content = this.renderNavChildren(node.children);
      return `<nav class="${classes}"${styleAttr}>\n${content}\n</nav>`;
    }

    // Array syntax (items)
    const items = node.items
      .map((item) => {
        if (typeof item === 'string') {
          return `<a class="${this.prefix}-nav-link" href="#">${this.escapeHtml(item)}</a>`;
        }
        const linkClasses = this.buildClassString([
          `${this.prefix}-nav-link`,
          item.active ? `${this.prefix}-nav-link-active` : undefined,
          item.disabled ? `${this.prefix}-nav-link-disabled` : undefined,
        ]);
        const iconHtml = item.icon ? this.renderIconHtml(item.icon) + ' ' : '';
        return `<a class="${linkClasses}" href="${item.href || '#'}">${iconHtml}${this.escapeHtml(item.label)}</a>`;
      })
      .join('\n');

    return `<nav class="${classes}"${styleAttr}>\n${items}\n</nav>`;
  }

  private renderNavChildren(children: import('../../ast/types').NavChild[]): string {
    return children
      .map((child) => {
        if (child.type === 'divider') {
          return `<hr class="${this.prefix}-nav-divider" />`;
        }
        if (child.type === 'group') {
          const groupItems = child.items
            .map((item) => {
              if (item.type === 'divider') {
                return `<hr class="${this.prefix}-nav-divider" />`;
              }
              return this.renderNavItem(item);
            })
            .join('\n');
          return `<div class="${this.prefix}-nav-group">
  <div class="${this.prefix}-nav-group-label">${this.escapeHtml(child.label)}</div>
${groupItems}
</div>`;
        }
        if (child.type === 'item') {
          return this.renderNavItem(child);
        }
        return '';
      })
      .join('\n');
  }

  private renderNavItem(item: import('../../ast/types').NavBlockItem): string {
    const linkClasses = this.buildClassString([
      `${this.prefix}-nav-link`,
      item.active ? `${this.prefix}-nav-link-active` : undefined,
      item.disabled ? `${this.prefix}-nav-link-disabled` : undefined,
    ]);
    const iconHtml = item.icon ? this.renderIconHtml(item.icon) + ' ' : '';
    return `<a class="${linkClasses}" href="${item.href || '#'}">${iconHtml}${this.escapeHtml(item.label)}</a>`;
  }

  private renderIconHtml(iconName: string): string {
    return `<span class="${this.prefix}-icon" data-icon="${iconName}"></span>`;
  }

  private renderTabs(node: TabsNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-tabs`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const tabList = node.items
      .map((label, idx) => {
        const isActive = idx === (node.active || 0);
        const tabClasses = `${this.prefix}-tab${isActive ? ` ${this.prefix}-tab-active` : ''}`;
        return `<button class="${tabClasses}" role="tab" aria-selected="${isActive}">${this.escapeHtml(label)}</button>`;
      })
      .join('\n');

    return `<div class="${classes}"${styleAttr}>
  <div class="${this.prefix}-tab-list" role="tablist">
${tabList}
  </div>
</div>`;
  }

  private renderBreadcrumb(node: BreadcrumbNode): string {
    const classes = this.buildClassString([
      `${this.prefix}-breadcrumb`,
      ...this.getCommonClasses(node),
    ]);

    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    const items = node.items
      .map((item, idx) => {
        const isLast = idx === node.items.length - 1;
        if (typeof item === 'string') {
          return isLast
            ? `<span class="${this.prefix}-breadcrumb-item" aria-current="page">${this.escapeHtml(item)}</span>`
            : `<a class="${this.prefix}-breadcrumb-item" href="#">${this.escapeHtml(item)}</a>`;
        }
        return isLast
          ? `<span class="${this.prefix}-breadcrumb-item" aria-current="page">${this.escapeHtml(item.label)}</span>`
          : `<a class="${this.prefix}-breadcrumb-item" href="${item.href || '#'}">${this.escapeHtml(item.label)}</a>`;
      })
      .join(' / ');

    return `<nav class="${classes}"${styleAttr} aria-label="Breadcrumb">${items}</nav>`;
  }

  // ===========================================
  // Divider Renderer
  // ===========================================

  private renderDivider(node: DividerComponentNode): string {
    const styles = this.buildCommonStyles(node);
    const styleAttr = styles ? ` style="${styles}"` : '';

    return `<hr class="${this.prefix}-divider"${styleAttr} />`;
  }

  // ===========================================
  // Semantic Marker Rendering
  // ===========================================

  /**
   * Parse and render semantic markers in text content
   *
   * Semantic markers use the syntax [component:variant] to indicate
   * what a visual element represents. This helps LLMs understand
   * the meaning of placeholder content.
   *
   * Supported markers:
   * - [avatar] or [avatar:size] - User avatar (renders as circle placeholder)
   * - [badge:variant] TEXT - Status badge (TEXT is displayed inside the badge)
   * - [dot:variant] - Status dot (renders as small circle before text)
   * - [icon:name] - Icon placeholder
   *
   * Examples:
   * - "[avatar] John Doe" → renders avatar circle + "John Doe"
   * - "[badge:primary] PRO" → renders badge containing "PRO"
   * - "[dot:success] Active" → renders green dot + "Active"
   */
  private renderSemanticMarkers(text: string): string {
    // Pattern: [component] or [component:variant] with optional following text for badge
    const markerPattern = /\[([a-z]+)(?::([a-z0-9-]+))?\](\s*)/gi;

    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = markerPattern.exec(text)) !== null) {
      // Add text before the marker
      if (match.index > lastIndex) {
        result += this.escapeHtml(text.substring(lastIndex, match.index));
      }

      const [fullMatch, component, variant] = match;
      const comp = component.toLowerCase();
      const varnt = variant?.toLowerCase();

      // For badge, consume the following word as the badge content
      if (comp === 'badge') {
        const afterMarker = text.substring(match.index + fullMatch.length);
        // Match until newline, next marker, or end
        const contentMatch = afterMarker.match(/^([^\n\[]+?)(?=\n|\[|$)/);
        const badgeContent = contentMatch ? contentMatch[1].trim() : '';

        result += this.renderSemanticMarkerWithContent(comp, varnt, badgeContent);
        lastIndex = match.index + fullMatch.length + (contentMatch ? contentMatch[0].length : 0);
        markerPattern.lastIndex = lastIndex; // Update regex position
      } else {
        result += this.renderSemanticMarker(comp, varnt);
        lastIndex = match.index + fullMatch.length;
      }
    }

    // Add remaining text after last marker
    if (lastIndex < text.length) {
      result += this.escapeHtml(text.substring(lastIndex));
    }

    // If no markers found, just escape and return
    if (lastIndex === 0) {
      return this.escapeHtml(text);
    }

    return result;
  }

  /**
   * Render a single semantic marker to HTML (without content)
   */
  private renderSemanticMarker(component: string, variant?: string): string {
    const prefix = this.prefix;

    switch (component) {
      case 'avatar':
        // Render as small circle placeholder
        const avatarSize = variant || 'sm';
        return `<span class="${prefix}-semantic-avatar ${prefix}-semantic-avatar-${avatarSize}" data-semantic="avatar" data-variant="${avatarSize}" aria-hidden="true"></span>`;

      case 'dot':
        // Render as status dot
        const dotVariant = variant || 'default';
        return `<span class="${prefix}-semantic-dot ${prefix}-semantic-dot-${dotVariant}" data-semantic="dot" data-variant="${dotVariant}" aria-hidden="true"></span>`;

      case 'icon':
        // Render as icon placeholder
        const iconName = variant || 'default';
        return `<span class="${prefix}-semantic-icon" data-semantic="icon" data-variant="${iconName}" aria-hidden="true">[${iconName}]</span>`;

      default:
        // Unknown marker - render as data attribute only
        return `<span class="${prefix}-semantic-unknown" data-semantic="${component}" data-variant="${variant || ''}">[${component}${variant ? ':' + variant : ''}]</span>`;
    }
  }

  /**
   * Render a semantic marker with text content (for badge)
   */
  private renderSemanticMarkerWithContent(component: string, variant: string | undefined, content: string): string {
    const prefix = this.prefix;

    switch (component) {
      case 'badge':
        // Render as inline badge with content inside
        const badgeVariant = variant || 'default';
        const escapedContent = this.escapeHtml(content);
        return `<span class="${prefix}-semantic-badge ${prefix}-semantic-badge-${badgeVariant}" data-semantic="badge" data-variant="${badgeVariant}">${escapedContent}</span>`;

      default:
        // Fallback: render marker then content
        return this.renderSemanticMarker(component, variant) + this.escapeHtml(content);
    }
  }

  /**
   * Process table cell content with semantic markers and newlines
   *
   * Special handling for avatar + text layout:
   * When content starts with [avatar], wraps in flex container
   * so avatar and text align horizontally, with text stacking vertically
   */
  private renderTableCellContent(content: string): string {
    // Check if content starts with [avatar] marker
    const avatarMatch = content.match(/^\[avatar(?::([a-z0-9-]+))?\]\s*/i);

    if (avatarMatch) {
      // Avatar + text layout: flex container with avatar and text block
      const avatarVariant = avatarMatch[1]?.toLowerCase();
      const avatarHtml = this.renderSemanticMarker('avatar', avatarVariant);
      const restContent = content.slice(avatarMatch[0].length);

      // Process remaining content for other markers
      const restHtml = this.renderSemanticMarkers(restContent);
      // Convert newlines to flex items for vertical stacking
      const lines = restHtml.split('\n');
      const textHtml =
        lines.length > 1
          ? lines.map((line) => `<span>${line}</span>`).join('')
          : restHtml;

      return `<div class="${this.prefix}-cell-avatar-layout">${avatarHtml}<div class="${this.prefix}-cell-avatar-text">${textHtml}</div></div>`;
    }

    // Normal rendering: semantic markers then newlines to <br>
    const withMarkers = this.renderSemanticMarkers(content);
    return withMarkers.replace(/\n/g, '<br>');
  }
}

/**
 * Create a new HTML renderer instance
 */
export function createHtmlRenderer(options?: RenderOptions): HtmlRenderer {
  return new HtmlRenderer(options);
}
