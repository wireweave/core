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

// Re-export component utilities
export * from './components';

// Import separated renderer functions
import type { RenderContext, GridRenderContext } from './renderers';
import {
  renderHeader as renderHeaderFn,
  renderMain as renderMainFn,
  renderFooter as renderFooterFn,
  renderSidebar as renderSidebarFn,
  renderSection as renderSectionFn,
  renderRow as renderRowFn,
  renderCol as renderColFn,
  renderCard as renderCardFn,
  renderModal as renderModalFn,
  renderDrawer as renderDrawerFn,
  renderAccordion as renderAccordionFn,
  renderText as renderTextFn,
  renderTitle as renderTitleFn,
  renderLink as renderLinkFn,
  renderButton as renderButtonFn,
  renderAlert as renderAlertFn,
  renderToast as renderToastFn,
  renderProgress as renderProgressFn,
  renderSpinner as renderSpinnerFn,
  renderInput as renderInputFn,
  renderTextarea as renderTextareaFn,
  renderSelect as renderSelectFn,
  renderCheckbox as renderCheckboxFn,
  renderRadio as renderRadioFn,
  renderSwitch as renderSwitchFn,
  renderSlider as renderSliderFn,
  renderImage as renderImageFn,
  renderPlaceholder as renderPlaceholderFn,
  renderAvatar as renderAvatarFn,
  renderBadge as renderBadgeFn,
  renderIcon as renderIconFn,
  renderTooltip as renderTooltipFn,
  renderPopover as renderPopoverFn,
  renderDropdown as renderDropdownFn,
  renderNav as renderNavFn,
  renderTabs as renderTabsFn,
  renderBreadcrumb as renderBreadcrumbFn,
  renderTable as renderTableFn,
  renderList as renderListFn,
  renderDivider as renderDividerFn,
} from './renderers';

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
  /**
   * Node type to renderer method mapping
   */
  private readonly nodeRenderers: Record<string, (node: AnyNode) => string>;

  constructor(options: RenderOptions = {}) {
    super(options);
    this.nodeRenderers = this.createNodeRenderers();
  }

  /**
   * Get render context for external renderer functions
   */
  private getRenderContext(): RenderContext {
    return {
      prefix: this.prefix,
      escapeHtml: this.escapeHtml.bind(this),
      buildClassString: this.buildClassString.bind(this),
      buildAttrsString: this.buildAttrsString.bind(this),
      buildCommonStyles: this.buildCommonStyles.bind(this),
      getCommonClasses: this.getCommonClasses.bind(this),
      renderChildren: this.renderChildren.bind(this),
      renderNode: this.renderNode.bind(this),
    };
  }

  /**
   * Get grid render context (extends RenderContext with buildColStyles)
   */
  private getGridRenderContext(): GridRenderContext {
    return {
      ...this.getRenderContext(),
      buildColStyles: this.buildColStyles.bind(this),
    };
  }

  /**
   * Create the node renderer mapping
   */
  private createNodeRenderers(): Record<string, (node: AnyNode) => string> {
    return {
      // Layout nodes
      Page: (node) => this.renderPage(node as PageNode),
      Header: (node) => this.renderHeader(node as HeaderNode),
      Main: (node) => this.renderMain(node as MainNode),
      Footer: (node) => this.renderFooter(node as FooterNode),
      Sidebar: (node) => this.renderSidebar(node as SidebarNode),
      Section: (node) => this.renderSection(node as SectionNode),
      // Grid nodes
      Row: (node) => this.renderRow(node as RowNode),
      Col: (node) => this.renderCol(node as ColNode),
      // Container nodes
      Card: (node) => this.renderCard(node as CardNode),
      Modal: (node) => this.renderModal(node as ModalNode),
      Drawer: (node) => this.renderDrawer(node as DrawerNode),
      Accordion: (node) => this.renderAccordion(node as AccordionNode),
      // Text nodes
      Text: (node) => this.renderText(node as TextNode),
      Title: (node) => this.renderTitle(node as TitleNode),
      Link: (node) => this.renderLink(node as LinkNode),
      // Input nodes
      Input: (node) => this.renderInput(node as InputNode),
      Textarea: (node) => this.renderTextarea(node as TextareaNode),
      Select: (node) => this.renderSelect(node as SelectNode),
      Checkbox: (node) => this.renderCheckbox(node as CheckboxNode),
      Radio: (node) => this.renderRadio(node as RadioNode),
      Switch: (node) => this.renderSwitch(node as SwitchNode),
      Slider: (node) => this.renderSlider(node as SliderNode),
      // Button
      Button: (node) => this.renderButton(node as ButtonNode),
      // Display nodes
      Image: (node) => this.renderImage(node as ImageNode),
      Placeholder: (node) => this.renderPlaceholder(node as PlaceholderNode),
      Avatar: (node) => this.renderAvatar(node as AvatarNode),
      Badge: (node) => this.renderBadge(node as BadgeNode),
      Icon: (node) => this.renderIcon(node as IconNode),
      // Data nodes
      Table: (node) => this.renderTable(node as TableNode),
      List: (node) => this.renderList(node as ListNode),
      // Feedback nodes
      Alert: (node) => this.renderAlert(node as AlertNode),
      Toast: (node) => this.renderToast(node as ToastNode),
      Progress: (node) => this.renderProgress(node as ProgressNode),
      Spinner: (node) => this.renderSpinner(node as SpinnerNode),
      // Overlay nodes
      Tooltip: (node) => this.renderTooltip(node as TooltipNode),
      Popover: (node) => this.renderPopover(node as PopoverNode),
      Dropdown: (node) => this.renderDropdown(node as DropdownNode),
      // Navigation nodes
      Nav: (node) => this.renderNav(node as NavNode),
      Tabs: (node) => this.renderTabs(node as TabsNode),
      Breadcrumb: (node) => this.renderBreadcrumb(node as BreadcrumbNode),
      // Other
      Divider: (node) => this.renderDivider(node as DividerComponentNode),
    };
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
    // Add position: relative to serve as containing block for absolute positioned children
    const commonStyles = this.buildCommonStyles(node);
    let viewportStyle = `position: relative; width: ${viewport.width}px; height: ${viewport.height}px; overflow: hidden`;

    // Apply background option as inline style (not to theme.colors.background)
    // This allows transparent/custom backgrounds without affecting component colors
    if (this.context.options.background) {
      viewportStyle += `; background: ${this.context.options.background}`;
    }

    const combinedStyle = commonStyles ? `${viewportStyle}; ${commonStyles}` : viewportStyle;

    // Add data attributes for viewport info
    const dataAttrs = `data-viewport-width="${viewport.width}" data-viewport-height="${viewport.height}" data-viewport-label="${viewport.label}"`;

    return `<div class="${classes}" style="${combinedStyle}" ${dataAttrs}>\n${title}${children}\n</div>`;
  }

  /**
   * Render any AST node
   */
  protected renderNode(node: AnyNode): string {
    const renderer = this.nodeRenderers[node.type];
    if (renderer) {
      return renderer(node);
    }
    return `<!-- Unknown node type: ${node.type} -->`;
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
    return renderHeaderFn(node, this.getRenderContext());
  }

  private renderMain(node: MainNode): string {
    return renderMainFn(node, this.getRenderContext());
  }

  private renderFooter(node: FooterNode): string {
    return renderFooterFn(node, this.getRenderContext());
  }

  private renderSidebar(node: SidebarNode): string {
    return renderSidebarFn(node, this.getRenderContext());
  }

  private renderSection(node: SectionNode): string {
    return renderSectionFn(node, this.getRenderContext());
  }

  // ===========================================
  // Grid Node Renderers
  // ===========================================

  private renderRow(node: RowNode): string {
    return renderRowFn(node, this.getRenderContext());
  }

  private renderCol(node: ColNode): string {
    return renderColFn(node, this.getGridRenderContext());
  }

  /**
   * Build common inline styles for all values
   *
   * Position values (x, y) for absolute positioning:
   * - When x or y is specified, element gets position: absolute
   * - x → left, y → top
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

    this.buildPositionStyles(props, styles);
    this.buildSizeStyles(props, styles);
    this.buildPaddingStyles(props, styles);
    this.buildMarginStyles(props, styles);
    this.buildGapStyles(props, styles);

    return styles.join('; ');
  }

  /**
   * Build position styles (absolute positioning)
   */
  private buildPositionStyles(props: Omit<Partial<CommonProps>, 'align'>, styles: string[]): void {
    if (props.x !== undefined || props.y !== undefined) {
      styles.push('position: absolute');

      if (props.x !== undefined) {
        const xValue = resolveSizeValueToCss(props.x as number | ValueWithUnit);
        if (xValue) styles.push(`left: ${xValue}`);
      }

      if (props.y !== undefined) {
        const yValue = resolveSizeValueToCss(props.y as number | ValueWithUnit);
        if (yValue) styles.push(`top: ${yValue}`);
      }
    }
  }

  /**
   * Build size styles (width, height, min/max)
   */
  private buildSizeStyles(props: Omit<Partial<CommonProps>, 'align'>, styles: string[]): void {
    const wValue = resolveSizeValueToCss(props.w as number | ValueWithUnit | undefined);
    if (wValue) {
      styles.push(`width: ${wValue}`);
    }

    const hValue = resolveSizeValueToCss(props.h as number | ValueWithUnit | undefined);
    if (hValue) {
      styles.push(`height: ${hValue}`);
      styles.push(`min-height: ${hValue}`);
    }

    const minWValue = resolveSizeValueToCss(props.minW);
    if (minWValue) {
      styles.push(`min-width: ${minWValue}`);
    }
    const maxWValue = resolveSizeValueToCss(props.maxW);
    if (maxWValue) {
      styles.push(`max-width: ${maxWValue}`);
    }

    const minHValue = resolveSizeValueToCss(props.minH);
    if (minHValue) {
      styles.push(`min-height: ${minHValue}`);
    }
    const maxHValue = resolveSizeValueToCss(props.maxH);
    if (maxHValue) {
      styles.push(`max-height: ${maxHValue}`);
    }
  }

  /**
   * Build padding styles (p, px, py, pt, pr, pb, pl)
   */
  private buildPaddingStyles(props: Omit<Partial<CommonProps>, 'align'>, styles: string[]): void {
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
  }

  /**
   * Build margin styles (m, mx, my, mt, mr, mb, ml)
   */
  private buildMarginStyles(props: Omit<Partial<CommonProps>, 'align'>, styles: string[]): void {
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
  }

  /**
   * Build gap styles
   */
  private buildGapStyles(props: Omit<Partial<CommonProps>, 'align'>, styles: string[]): void {
    const gapValue = resolveSpacingValue(props.gap);
    if (gapValue) {
      styles.push(`gap: ${gapValue}`);
    }
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
    return renderCardFn(node, this.getRenderContext());
  }

  private renderModal(node: ModalNode): string {
    return renderModalFn(node, this.getRenderContext());
  }

  private renderDrawer(node: DrawerNode): string {
    return renderDrawerFn(node, this.getRenderContext());
  }

  private renderAccordion(node: AccordionNode): string {
    return renderAccordionFn(node, this.getRenderContext());
  }

  // ===========================================
  // Text Node Renderers
  // ===========================================

  private renderText(node: TextNode): string {
    return renderTextFn(node, this.getRenderContext());
  }

  private renderTitle(node: TitleNode): string {
    return renderTitleFn(node, this.getRenderContext());
  }

  private renderLink(node: LinkNode): string {
    return renderLinkFn(node, this.getRenderContext());
  }

  // ===========================================
  // Input Node Renderers
  // ===========================================

  private renderInput(node: InputNode): string {
    return renderInputFn(node, this.getRenderContext());
  }

  private renderTextarea(node: TextareaNode): string {
    return renderTextareaFn(node, this.getRenderContext());
  }

  private renderSelect(node: SelectNode): string {
    return renderSelectFn(node, this.getRenderContext());
  }

  private renderCheckbox(node: CheckboxNode): string {
    return renderCheckboxFn(node, this.getRenderContext());
  }

  private renderRadio(node: RadioNode): string {
    return renderRadioFn(node, this.getRenderContext());
  }

  private renderSwitch(node: SwitchNode): string {
    return renderSwitchFn(node, this.getRenderContext());
  }

  private renderSlider(node: SliderNode): string {
    return renderSliderFn(node, this.getRenderContext());
  }

  // ===========================================
  // Button Renderer
  // ===========================================

  private renderButton(node: ButtonNode): string {
    return renderButtonFn(node, this.getRenderContext());
  }

  // ===========================================
  // Display Node Renderers
  // ===========================================

  private renderImage(node: ImageNode): string {
    return renderImageFn(node, this.getRenderContext());
  }

  private renderPlaceholder(node: PlaceholderNode): string {
    return renderPlaceholderFn(node, this.getRenderContext());
  }

  private renderAvatar(node: AvatarNode): string {
    return renderAvatarFn(node, this.getRenderContext());
  }

  private renderBadge(node: BadgeNode): string {
    return renderBadgeFn(node, this.getRenderContext());
  }

  private renderIcon(node: IconNode): string {
    return renderIconFn(node, this.getRenderContext());
  }

  // ===========================================
  // Data Node Renderers
  // ===========================================

  private renderTable(node: TableNode): string {
    return renderTableFn(node, this.getRenderContext());
  }

  private renderList(node: ListNode): string {
    return renderListFn(node, this.getRenderContext());
  }

  // ===========================================
  // Feedback Node Renderers
  // ===========================================

  private renderAlert(node: AlertNode): string {
    return renderAlertFn(node, this.getRenderContext());
  }

  private renderToast(node: ToastNode): string {
    return renderToastFn(node, this.getRenderContext());
  }

  private renderProgress(node: ProgressNode): string {
    return renderProgressFn(node, this.getRenderContext());
  }

  private renderSpinner(node: SpinnerNode): string {
    return renderSpinnerFn(node, this.getRenderContext());
  }

  // ===========================================
  // Overlay Node Renderers
  // ===========================================

  private renderTooltip(node: TooltipNode): string {
    return renderTooltipFn(node, this.getRenderContext());
  }

  private renderPopover(node: PopoverNode): string {
    return renderPopoverFn(node, this.getRenderContext());
  }

  private renderDropdown(node: DropdownNode): string {
    return renderDropdownFn(node, this.getRenderContext());
  }

  // ===========================================
  // Navigation Node Renderers
  // ===========================================

  private renderNav(node: NavNode): string {
    return renderNavFn(node, this.getRenderContext());
  }

  private renderTabs(node: TabsNode): string {
    return renderTabsFn(node, this.getRenderContext());
  }

  private renderBreadcrumb(node: BreadcrumbNode): string {
    return renderBreadcrumbFn(node, this.getRenderContext());
  }

  // ===========================================
  // Divider Renderer
  // ===========================================

  private renderDivider(node: DividerComponentNode): string {
    return renderDividerFn(node, this.getRenderContext());
  }
}

/**
 * Create a new HTML renderer instance
 */
export function createHtmlRenderer(options?: RenderOptions): HtmlRenderer {
  return new HtmlRenderer(options);
}
