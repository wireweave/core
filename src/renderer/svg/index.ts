/**
 * SVG Renderer for wireweave
 *
 * A proper layout engine that renders wireframe AST to SVG image format
 * with correct flexbox-like layout calculations.
 */

import type {
  WireframeDocument,
  PageNode,
  AnyNode,
  RowNode,
  ColNode,
  HeaderNode,
  MainNode,
  FooterNode,
  SidebarNode,
  CardNode,
  TextNode,
  TitleNode,
  ButtonNode,
  InputNode,
  TextareaNode,
  TableNode,
  ListNode,
  AlertNode,
  BadgeNode,
  ProgressNode,
  SpinnerNode,
  CheckboxNode,
  RadioNode,
  SwitchNode,
  ImageNode,
  PlaceholderNode,
  AvatarNode,
  ModalNode,
  NavNode,
  TabsNode,
  BreadcrumbNode,
  SelectNode,
  LinkNode,
  IconNode,
  DividerComponentNode,
} from '../../ast/types';
import type { SvgRenderOptions, SvgRenderResult, ThemeConfig } from '../types';
import { defaultTheme } from '../types';
import { resolveViewport } from '../../viewport';
import { getIconData, type IconData } from '../../icons/lucide-icons';
import {
  computeFlexLayout,
  createFlexItemProps,
  createFlexGrowItemProps,
  toJustifyContent,
  toAlignItems,
  type FlexItemProps,
  type FlexContainerConfig,
} from './flex-layout';

// ===========================================
// Layout Types
// ===========================================

/**
 * Layout box - represents an element's computed position and size
 */
interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
  node: AnyNode | null;
  children: LayoutBox[];
  // For internal use
  padding?: { top: number; right: number; bottom: number; left: number };
}

/**
 * Size measurement result
 */
interface Size {
  width: number;
  height: number;
}

/**
 * Layout constraints passed down during layout
 */
interface Constraints {
  maxWidth: number;
  maxHeight?: number;  // Optional - only set when parent has known height
  inHeader?: boolean;  // Whether we're inside a header context
}

// ===========================================
// SVG Renderer Class
// ===========================================

export class SvgRenderer {
  private options: Required<SvgRenderOptions>;
  private theme: ThemeConfig;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private clipPathDefs: string[] = [];
  private clipPathCounter: number = 0;

  // Default spacing values
  private readonly DEFAULT_GAP = 16;

  constructor(options: SvgRenderOptions = {}) {
    this.options = {
      width: options.width ?? 800,
      height: options.height ?? 600,
      scale: options.scale ?? 1,
      background: options.background ?? '#ffffff',
      padding: options.padding ?? 20,
      fontFamily: options.fontFamily ?? 'system-ui, -apple-system, sans-serif',
    };
    this.theme = defaultTheme;
  }

  /**
   * Render a wireframe document to SVG
   */
  render(doc: WireframeDocument): SvgRenderResult {
    // Reset state for new render
    this.clipPathDefs = [];
    this.clipPathCounter = 0;

    // Get viewport from first page
    const firstPage = doc.children[0];
    let width = this.options.width;
    let height = this.options.height;

    if (firstPage) {
      // Check for explicit width/height attributes (highest priority)
      const pageAny = firstPage as PageNode & { width?: number; height?: number };
      const hasExplicitWidth = pageAny.width !== undefined;
      const hasExplicitHeight = pageAny.height !== undefined;

      if (hasExplicitWidth || hasExplicitHeight) {
        // Use explicit dimensions
        if (hasExplicitWidth) {
          width = pageAny.width!;
        }
        if (hasExplicitHeight) {
          height = pageAny.height!;
        }
      } else if (firstPage.viewport !== undefined || firstPage.device !== undefined) {
        // Fall back to viewport/device presets only if no explicit dimensions
        const viewport = resolveViewport(firstPage.viewport, firstPage.device);
        width = viewport.width;
        height = viewport.height;
      }
    }

    this.pageWidth = width;
    this.pageHeight = height;

    // Layout and render each page
    const content = doc.children.map((page) => this.renderPage(page)).join('\n');

    // Build defs section including any clip paths
    const allDefs = this.generateDefs() + '\n' + this.clipPathDefs.join('\n');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    ${allDefs}
  </defs>
  <rect width="100%" height="100%" fill="${this.options.background}"/>
  <g transform="scale(${this.options.scale})">
    ${content}
  </g>
</svg>`;

    return { svg, width, height };
  }

  /**
   * Generate SVG defs (styles)
   */
  private generateDefs(): string {
    return `
    <style>
      text { font-family: ${this.options.fontFamily}; }
      .wf-title { font-weight: 600; }
      .wf-muted { fill: ${this.theme.colors.muted}; }
    </style>
    `;
  }

  // ===========================================
  // Page Layout
  // ===========================================

  private renderPage(page: PageNode): string {
    const padding = this.options.padding;
    const contentWidth = this.pageWidth - padding * 2;
    const contentHeight = this.pageHeight - padding * 2;

    // Layout children
    const constraints: Constraints = {
      maxWidth: contentWidth,
      maxHeight: contentHeight,
    };

    // Measure and layout all children
    const childBoxes: LayoutBox[] = [];
    let currentY = padding;

    // Note: page.title is NOT rendered visually in SVG (same as HTML where it goes to <title> tag)

    // Check if page should be centered
    const isCentered = page.centered === true;

    // Check for Header/Main/Footer pattern
    const hasHeader = page.children.some(c => c.type === 'Header');
    const hasFooter = page.children.some(c => c.type === 'Footer');
    const hasMain = page.children.some(c => c.type === 'Main');

    if (hasHeader || hasFooter || hasMain) {
      // Use fixed header/footer layout
      return this.renderPageWithFixedLayout(page, padding, contentWidth, contentHeight);
    }

    // First pass: measure all children
    const measurements: Size[] = page.children.map(child => this.measureNode(child, constraints));

    // Calculate total content height
    const gap = this.getGap(page) || this.DEFAULT_GAP;
    const totalChildrenHeight = measurements.reduce((sum, m, i) => {
      return sum + m.height + (i > 0 ? gap : 0);
    }, 0);

    // If centered, adjust starting Y
    if (isCentered) {
      const availableHeight = contentHeight;
      currentY = padding + Math.max(0, (availableHeight - totalChildrenHeight) / 2);
    }

    // Second pass: layout children
    for (let i = 0; i < page.children.length; i++) {
      const child = page.children[i];
      const measurement = measurements[i];

      // Calculate X position (center horizontally if centered or for cards)
      let childX = padding;
      if (isCentered || this.shouldCenterHorizontally(child)) {
        childX = padding + (contentWidth - measurement.width) / 2;
      }

      const box = this.layoutNode(child, childX, currentY, constraints);
      childBoxes.push(box);
      currentY += box.height + gap;
    }

    // Render
    const elements: string[] = [];

    for (const box of childBoxes) {
      elements.push(this.renderBox(box));
    }

    return elements.join('\n');
  }

  /**
   * Render page with fixed header/footer layout
   * Header at top, Footer at bottom, Main fills remaining space
   */
  private renderPageWithFixedLayout(
    page: PageNode,
    padding: number,
    contentWidth: number,
    contentHeight: number
  ): string {
    const constraints: Constraints = {
      maxWidth: contentWidth,
      maxHeight: contentHeight,
    };

    // Separate children by type
    const header = page.children.find(c => c.type === 'Header');
    const footer = page.children.find(c => c.type === 'Footer');
    const otherChildren = page.children.filter(c => c.type !== 'Header' && c.type !== 'Footer');

    const elements: string[] = [];
    let headerHeight = 0;
    let footerHeight = 0;

    // Note: page.title is NOT rendered visually in SVG (same as HTML where it goes to <title> tag)
    let currentY = padding;

    // Layout header at top
    if (header) {
      const headerMeasure = this.measureNode(header, constraints);
      headerHeight = headerMeasure.height;
      const headerBox = this.layoutNode(header, padding, currentY, constraints);
      elements.push(this.renderBox(headerBox));
    }

    // Layout footer at bottom
    if (footer) {
      const footerMeasure = this.measureNode(footer, constraints);
      footerHeight = footerMeasure.height;
      const footerY = this.pageHeight - padding - footerHeight;
      const footerBox = this.layoutNode(footer, padding, footerY, constraints);
      elements.push(this.renderBox(footerBox));
    }

    // Calculate available height for main content
    const mainStartY = currentY + headerHeight;
    const mainEndY = this.pageHeight - padding - footerHeight;
    const mainHeight = mainEndY - mainStartY;

    // Layout other children (Main and others) in the remaining space with clipping
    if (otherChildren.length > 0) {
      const mainConstraints: Constraints = {
        maxWidth: contentWidth,
        maxHeight: mainHeight,
      };

      // Generate a unique clip path ID and add to defs
      const clipId = `main-clip-${this.clipPathCounter++}`;
      this.clipPathDefs.push(`<clipPath id="${clipId}"><rect x="${padding}" y="${mainStartY}" width="${contentWidth}" height="${mainHeight}"/></clipPath>`);

      // Create clipped group for main content
      const mainContent: string[] = [];
      mainContent.push(`<g clip-path="url(#${clipId})">`);

      let childY = mainStartY;
      const gap = this.getGap(page) || 0;

      for (const child of otherChildren) {
        const childBox = this.layoutNode(child, padding, childY, mainConstraints);
        mainContent.push(this.renderBox(childBox));
        childY += childBox.height + gap;
      }

      mainContent.push(`</g>`);
      elements.push(mainContent.join('\n'));
    }

    return elements.join('\n');
  }

  private shouldCenterHorizontally(node: AnyNode): boolean {
    return node.type === 'Card' || node.type === 'Modal';
  }

  // ===========================================
  // Measurement Phase
  // ===========================================

  private measureNode(node: AnyNode, constraints: Constraints): Size {
    switch (node.type) {
      case 'Row':
        return this.measureRow(node as RowNode, constraints);
      case 'Col':
        return this.measureCol(node as ColNode, constraints);
      case 'Header':
        return this.measureHeader(node as HeaderNode, constraints);
      case 'Footer':
        return this.measureFooter(node as FooterNode, constraints);
      case 'Main':
        return this.measureMain(node as MainNode, constraints);
      case 'Sidebar':
        return this.measureSidebar(node as SidebarNode, constraints);
      case 'Card':
        return this.measureCard(node as CardNode, constraints);
      case 'Modal':
        return this.measureModal(node as ModalNode, constraints);
      case 'Title':
        return this.measureTitle(node as TitleNode);
      case 'Text':
        return this.measureText(node as TextNode);
      case 'Button':
        return this.measureButton(node as ButtonNode, constraints);
      case 'Input':
        return this.measureInput(node as InputNode, constraints);
      case 'Textarea':
        return this.measureTextarea(node as TextareaNode, constraints);
      case 'Select':
        return this.measureSelect(node as SelectNode, constraints);
      case 'Checkbox':
        return this.measureCheckbox(node as CheckboxNode);
      case 'Radio':
        return this.measureRadio(node as RadioNode);
      case 'Switch':
        return this.measureSwitch(node as SwitchNode);
      case 'Link':
        return this.measureLink(node as LinkNode);
      case 'Image':
        return this.measureImage(node as ImageNode, constraints);
      case 'Placeholder':
        return this.measurePlaceholder(node as PlaceholderNode, constraints);
      case 'Avatar':
        return this.measureAvatar(node as AvatarNode, constraints);
      case 'Badge':
        return this.measureBadge(node as BadgeNode);
      case 'Table':
        return this.measureTable(node as TableNode);
      case 'List':
        return this.measureList(node as ListNode);
      case 'Alert':
        return this.measureAlert(node as AlertNode, constraints);
      case 'Progress':
        return this.measureProgress(node as ProgressNode, constraints);
      case 'Spinner':
        return this.measureSpinner(node as SpinnerNode);
      case 'Nav':
        return this.measureNav(node as NavNode);
      case 'Tabs':
        return this.measureTabs(node as TabsNode);
      case 'Breadcrumb':
        return this.measureBreadcrumb(node as BreadcrumbNode);
      case 'Icon':
        return this.measureIcon(node as IconNode);
      case 'Divider':
        return this.measureDivider(node as DividerComponentNode, constraints);
      default:
        return { width: 100, height: 40 };
    }
  }

  private measureRow(node: RowNode, constraints: Constraints): Size {
    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const innerWidth = constraints.maxWidth - padding.left - padding.right;

    // Measure all children
    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    // Row height is max child height
    const maxChildHeight = Math.max(...childMeasurements.map(m => m.height), 0);

    // Calculate actual content width for natural width rows
    // This is needed for justify=between to work correctly in parent rows
    const totalChildWidth = childMeasurements.reduce((sum, m) => sum + m.width, 0);
    const totalGapWidth = Math.max(0, (node.children.length - 1) * gap);
    const contentWidth = totalChildWidth + totalGapWidth + padding.left + padding.right;

    // If row has explicit width or w=full, use maxWidth; otherwise use content width
    // Flex children expand during layout, not measurement
    const hasExplicitWidth = 'w' in node && node.w !== undefined;
    const width = hasExplicitWidth ? constraints.maxWidth : Math.min(contentWidth, constraints.maxWidth);

    return {
      width,
      height: maxChildHeight + padding.top + padding.bottom,
    };
  }

  private measureCol(node: ColNode, constraints: Constraints): Size {
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const padding = this.getPadding(node);
    const innerWidth = constraints.maxWidth - padding.left - padding.right;

    // Measure all children
    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    // Calculate total height
    const totalHeight = childMeasurements.reduce((sum, m, i) =>
      sum + m.height + (i > 0 ? gap : 0), 0
    );

    // Width is max child width or full width
    const maxChildWidth = Math.max(...childMeasurements.map(m => m.width), 0);

    return {
      width: Math.max(maxChildWidth + padding.left + padding.right, constraints.maxWidth),
      height: totalHeight + padding.top + padding.bottom,
    };
  }

  private measureHeader(node: HeaderNode, constraints: Constraints): Size {
    const padding = this.getPadding(node);
    // Fixed height of 56px to match CSS min-height: 56px
    const height = this.resolveSize(node.h) || 56;
    return {
      width: constraints.maxWidth,
      height: height + padding.top + padding.bottom,
    };
  }

  private measureFooter(node: FooterNode, constraints: Constraints): Size {
    const padding = this.getPadding(node);
    const height = this.resolveSize(node.h) || 60;
    return {
      width: constraints.maxWidth,
      height: height + padding.top + padding.bottom,
    };
  }

  private measureMain(node: MainNode, constraints: Constraints): Size {
    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const innerWidth = constraints.maxWidth - padding.left - padding.right;

    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    const totalHeight = childMeasurements.reduce((sum, m, i) =>
      sum + m.height + (i > 0 ? gap : 0), 0
    );

    return {
      width: constraints.maxWidth,
      height: totalHeight + padding.top + padding.bottom,
    };
  }

  private measureSidebar(node: SidebarNode, constraints: Constraints): Size {
    const width = this.resolveSize(node.w) || 200;
    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? 8;

    const innerWidth = width - padding.left - padding.right;
    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    const contentHeight = childMeasurements.reduce((sum, m, i) =>
      sum + m.height + (i > 0 ? gap : 0), 0
    ) + padding.top + padding.bottom;

    // Sidebar fills available height if no explicit height set
    const explicitHeight = this.resolveSize(node.h);
    const height = explicitHeight || constraints.maxHeight || contentHeight;

    return { width, height };
  }

  private measureCard(node: CardNode, constraints: Constraints): Size {
    // Card width: explicit w, or fit content up to maxWidth
    let cardWidth = this.resolveSize(node.w);
    if (!cardWidth) {
      // Use constraints.maxWidth directly - parent Row will handle distribution
      cardWidth = Math.min(360, constraints.maxWidth);
    } else {
      // Even with explicit width, don't exceed constraints
      cardWidth = Math.min(cardWidth, constraints.maxWidth);
    }

    // Check for explicit height
    const explicitHeight = this.resolveSize(node.h);
    if (explicitHeight) {
      return { width: cardWidth, height: explicitHeight };
    }

    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const innerWidth = cardWidth - padding.left - padding.right;

    // Measure children
    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    let contentHeight = 0;

    // Add title height if present
    if (node.title) {
      contentHeight += 28;
    }

    // Add children heights
    contentHeight += childMeasurements.reduce((sum, m, i) =>
      sum + m.height + (i > 0 ? gap : 0), 0
    );

    return {
      width: cardWidth,
      height: contentHeight + padding.top + padding.bottom,
    };
  }

  private measureModal(node: ModalNode, constraints: Constraints): Size {
    const width = this.resolveSize(node.w) || 400;
    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const innerWidth = width - padding.left - padding.right;

    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    let contentHeight = node.title ? 40 : 0;
    contentHeight += childMeasurements.reduce((sum, m, i) =>
      sum + m.height + (i > 0 ? gap : 0), 0
    );

    return {
      width,
      height: contentHeight + padding.top + padding.bottom,
    };
  }

  private measureTitle(node: TitleNode): Size {
    const level = node.level || 1;
    const fontSize = this.getTitleFontSize(level);
    const textWidth = this.estimateTextWidth(node.content, fontSize);
    return { width: textWidth, height: fontSize + 8 };
  }

  private measureText(node: TextNode): Size {
    const fontSize = this.resolveFontSize(node.size);
    const textWidth = this.estimateTextWidth(node.content, fontSize);
    return { width: textWidth, height: fontSize + 8 };
  }

  private measureButton(node: ButtonNode, constraints: Constraints): Size {
    const hasIcon = !!node.icon;
    // Icon-only: has icon but no text content (or default "Button" text)
    const isIconOnly = hasIcon && (!node.content.trim() || node.content === 'Button');
    const iconSize = 16;
    const padding = 16;

    let width: number;
    if (this.isFullWidth(node)) {
      width = constraints.maxWidth;
    } else if (isIconOnly) {
      width = iconSize + padding * 2;
    } else if (hasIcon) {
      width = Math.max(80, this.estimateTextWidth(node.content, 14) + iconSize + 48);
    } else {
      width = Math.max(80, this.estimateTextWidth(node.content, 14) + 32);
    }

    return { width, height: 40 };
  }

  private measureInput(node: InputNode, constraints: Constraints): Size {
    // In header context, calculate auto width based on placeholder text
    // Similar to how browsers calculate width: auto for input elements
    let width: number;
    if (this.resolveSize(node.w)) {
      width = this.resolveSize(node.w)!;
    } else if (constraints.inHeader) {
      // Calculate auto width: placeholder text + padding + default margin
      const placeholderWidth = node.placeholder
        ? this.estimateTextWidth(node.placeholder, 14)
        : 60;
      // Input auto width: placeholder + padding(24px) + browser default space(~100px)
      width = Math.max(120, placeholderWidth + 24 + 100);
    } else {
      width = constraints.maxWidth;
    }
    let height = 36;  // Match CSS: padding 8px*2 + line-height ~18px
    if (node.label) height += 24;
    return { width, height };
  }

  private measureTextarea(node: TextareaNode, constraints: Constraints): Size {
    // Textareas stretch to full width by default
    const width = this.resolveSize(node.w) || constraints.maxWidth;
    let height = node.rows ? node.rows * 24 : 100;
    if (node.label) height += 24;
    return { width, height };
  }

  private measureSelect(node: SelectNode, constraints: Constraints): Size {
    // Selects stretch to full width by default
    const width = this.resolveSize(node.w) || constraints.maxWidth;
    let height = 40;
    if (node.label) height += 24;
    return { width, height };
  }

  private measureCheckbox(node: CheckboxNode): Size {
    const labelWidth = node.label ? this.estimateTextWidth(node.label, 14) + 8 : 0;
    return { width: 18 + labelWidth, height: 24 };
  }

  private measureRadio(node: RadioNode): Size {
    const labelWidth = node.label ? this.estimateTextWidth(node.label, 14) + 8 : 0;
    return { width: 18 + labelWidth, height: 24 };
  }

  private measureSwitch(node: SwitchNode): Size {
    const labelWidth = node.label ? this.estimateTextWidth(node.label, 14) + 8 : 0;
    return { width: 44 + labelWidth, height: 28 };
  }

  private measureLink(node: LinkNode): Size {
    const fontSize = 14;
    const textWidth = this.estimateTextWidth(node.content, fontSize);
    return { width: textWidth, height: fontSize + 8 };
  }

  private measureImage(node: ImageNode, constraints: Constraints): Size {
    let width: number;
    if (this.isFullWidth(node)) {
      width = constraints.maxWidth;
    } else {
      width = this.resolveSize(node.w) || 200;
    }
    const height = this.resolveSize(node.h) || 150;
    return { width, height };
  }

  private measurePlaceholder(node: PlaceholderNode, constraints: Constraints): Size {
    let width: number;
    // In column/card context, placeholder should fill available width by default (like CSS width: 100%)
    if (node.w !== undefined) {
      width = this.isFullWidth(node) ? constraints.maxWidth : (this.resolveSize(node.w) || 200);
    } else {
      // Default: fill parent width (CSS-like behavior)
      width = constraints.maxWidth || 200;
    }
    const height = this.resolveSize(node.h) || 100;
    return { width, height };
  }

  private measureAvatar(node: AvatarNode, constraints?: Constraints): Size {
    const sizes: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };
    // Header avatars use 'sm' size (32px) by default to match CSS
    const defaultSize = constraints?.inHeader ? 'sm' : 'md';
    const size = sizes[node.size || defaultSize] || 40;
    return { width: size, height: size };
  }

  private measureBadge(node: BadgeNode): Size {
    const width = Math.max(24, this.estimateTextWidth(node.content, 12) + 16);
    return { width, height: 22 };
  }

  private measureTable(node: TableNode): Size {
    const columns = node.columns || [];
    const rows = node.rows || [];
    const rowCount = rows.length || 3;
    const colWidth = 120;
    const rowHeight = 40;

    return {
      width: columns.length * colWidth,
      height: (rowCount + 1) * rowHeight,
    };
  }

  private measureList(node: ListNode): Size {
    const items = node.items || [];
    const maxItemWidth = Math.max(...items.map(item => {
      const content = typeof item === 'string' ? item : item.content;
      return this.estimateTextWidth(content, 14);
    }), 100);
    return { width: maxItemWidth + 24, height: items.length * 28 };
  }

  private measureAlert(_node: AlertNode, constraints: Constraints): Size {
    const width = Math.min(400, constraints.maxWidth);
    return { width, height: 48 };
  }

  private measureProgress(node: ProgressNode, constraints: Constraints): Size {
    const width = Math.min(200, constraints.maxWidth);
    let height = 8;
    if (node.label) height += 24;
    return { width, height };
  }

  private measureSpinner(node: SpinnerNode): Size {
    const sizes: Record<string, number> = { xs: 16, sm: 20, md: 24, lg: 32, xl: 40 };
    const size = sizes[node.size || 'md'] || 24;
    return { width: size, height: size };
  }

  private measureNav(node: NavNode): Size {
    const items = node.items || [];
    if (node.vertical) {
      const maxWidth = Math.max(...items.map(item => {
        const label = typeof item === 'string' ? item : item.label;
        return this.estimateTextWidth(label, 14);
      }), 100);
      return { width: maxWidth, height: items.length * 32 };
    } else {
      const totalWidth = items.reduce((sum, item) => {
        const label = typeof item === 'string' ? item : item.label;
        return sum + this.estimateTextWidth(label, 14) + 24;
      }, 0);
      return { width: totalWidth, height: 32 };
    }
  }

  private measureTabs(node: TabsNode): Size {
    const items = node.items || [];
    const totalWidth = items.reduce((sum, item) => {
      const label = typeof item === 'string' ? item : item;
      return sum + this.estimateTextWidth(label, 14) + 32;
    }, 0);
    return { width: totalWidth, height: 44 };
  }

  private measureBreadcrumb(node: BreadcrumbNode): Size {
    const items = node.items || [];
    const totalWidth = items.reduce((sum, item, idx) => {
      const label = typeof item === 'string' ? item : item.label;
      return sum + this.estimateTextWidth(label, 14) + (idx < items.length - 1 ? 24 : 0);
    }, 0);
    return { width: totalWidth, height: 28 };
  }

  private measureIcon(node: IconNode): Size {
    const sizes: Record<string, number> = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };
    const size = sizes[node.size || 'md'] || 20;
    return { width: size, height: size };
  }

  private measureDivider(_node: DividerComponentNode, constraints: Constraints): Size {
    // Divider is always horizontal for now
    return { width: constraints.maxWidth, height: 1 };
  }

  // ===========================================
  // Layout Phase
  // ===========================================

  private layoutNode(node: AnyNode, x: number, y: number, constraints: Constraints): LayoutBox {
    switch (node.type) {
      case 'Row':
        return this.layoutRow(node as RowNode, x, y, constraints);
      case 'Col':
        return this.layoutCol(node as ColNode, x, y, constraints);
      case 'Header':
        return this.layoutHeader(node as HeaderNode, x, y, constraints);
      case 'Footer':
        return this.layoutFooter(node as FooterNode, x, y, constraints);
      case 'Main':
        return this.layoutMain(node as MainNode, x, y, constraints);
      case 'Sidebar':
        return this.layoutSidebar(node as SidebarNode, x, y, constraints);
      case 'Card':
        return this.layoutCard(node as CardNode, x, y, constraints);
      default:
        // Simple leaf nodes don't need complex layout
        const size = this.measureNode(node, constraints);
        return {
          x, y,
          width: size.width,
          height: size.height,
          node,
          children: [],
        };
    }
  }

  private layoutRow(node: RowNode, x: number, y: number, constraints: Constraints): LayoutBox {
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const padding = this.getPadding(node);
    const innerWidth = constraints.maxWidth - padding.left - padding.right;
    const justify = node.justify || 'start';
    // In header context, default to center alignment to match CSS behavior
    const align = node.align || (constraints.inHeader ? 'center' : 'start');

    // Step 1: Measure all children to get their content sizes
    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    // Step 2: Create flex item props for each child
    const flexItems: FlexItemProps[] = node.children.map((child, i) => {
      const measurement = childMeasurements[i];

      // Check for explicit width
      if ('w' in child && child.w !== undefined && child.w !== 'full') {
        const resolved = this.resolveSize(child.w);
        if (resolved !== undefined) {
          // Fixed width item: flex: 0 0 <width>
          return createFlexItemProps(measurement.height, {
            basis: resolved,
            grow: 0,
            shrink: 0,
            minSize: resolved,
            maxSize: resolved,
            contentSize: measurement.width,
          });
        }
      }

      // Check if this is a flex-growing container
      if (this.isFlexContainer(child)) {
        // Flex item: flex: 1 1 0
        return createFlexGrowItemProps(measurement.height, {
          basis: 0,
          grow: 1,
          shrink: 1,
          minSize: 0,
          maxSize: Infinity,
          contentSize: measurement.width,
        });
      }

      // In header context, Input nodes are flex (CSS: flex: 1 1 auto)
      if (constraints.inHeader && child.type === 'Input') {
        return createFlexGrowItemProps(measurement.height, {
          basis: measurement.width, // auto = content size
          grow: 1,
          shrink: 1,
          minSize: 120, // min-width: 120px
          maxSize: Infinity,
          contentSize: measurement.width,
        });
      }

      // Natural width item: flex: 0 1 auto
      return createFlexItemProps(measurement.height, {
        basis: measurement.width, // auto = content size
        grow: 0,
        shrink: 1,
        minSize: 0,
        maxSize: Infinity,
        contentSize: measurement.width,
      });
    });

    // Step 3: Compute flex layout
    const flexConfig: FlexContainerConfig = {
      mainSize: innerWidth,
      crossSize: undefined, // Will use max child height
      direction: 'row',
      justifyContent: toJustifyContent(justify),
      alignItems: toAlignItems(align),
      gap,
    };

    const flexResult = computeFlexLayout(flexItems, flexConfig);

    // Step 4: Calculate row height
    const maxChildHeight = Math.max(...childMeasurements.map(m => m.height), 0);
    const innerMaxHeight = constraints.maxHeight ? constraints.maxHeight - padding.top - padding.bottom : undefined;
    const effectiveHeight = innerMaxHeight || maxChildHeight;
    const rowHeight = effectiveHeight + padding.top + padding.bottom;

    // Step 5: Layout children using flex results
    const children: LayoutBox[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const flexItem = flexResult.items[i];
      const measurement = childMeasurements[i];

      // Get positions from flex layout
      const childX = x + padding.left + flexItem.mainPosition;

      // Calculate Y based on align (use cross position from flex layout)
      let childY = y + padding.top;
      switch (align) {
        case 'center':
          childY = y + padding.top + (maxChildHeight - measurement.height) / 2;
          break;
        case 'end':
          childY = y + padding.top + (maxChildHeight - measurement.height);
          break;
      }

      const childBox = this.layoutNode(child, childX, childY, {
        ...constraints,
        maxWidth: flexItem.mainSize,
        maxHeight: effectiveHeight,
      });
      children.push(childBox);
    }

    return {
      x, y,
      width: constraints.maxWidth,
      height: rowHeight,
      node,
      children,
      padding,
    };
  }

  private layoutCol(node: ColNode, x: number, y: number, constraints: Constraints): LayoutBox {
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const padding = this.getPadding(node);
    const innerWidth = constraints.maxWidth - padding.left - padding.right;
    const innerHeight = constraints.maxHeight ? constraints.maxHeight - padding.top - padding.bottom : undefined;
    const align = node.align || 'stretch';

    // Step 1: Measure all children to get their content sizes
    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    // Step 2: Create flex item props for each child (for vertical layout)
    const flexItems: FlexItemProps[] = node.children.map((child, i) => {
      const measurement = childMeasurements[i];

      // Check for explicit height
      if ('h' in child && child.h !== undefined) {
        const resolved = this.resolveSize(child.h);
        if (resolved !== undefined) {
          // Fixed height item: flex: 0 0 <height>
          return createFlexItemProps(measurement.width, {
            basis: resolved,
            grow: 0,
            shrink: 0,
            minSize: resolved,
            maxSize: resolved,
            contentSize: measurement.height,
          });
        }
      }

      // Check if this is a flex-growing row (contains Sidebar/Main)
      if (child.type === 'Row' && this.rowContainsSidebarOrMain(child as RowNode)) {
        // Flex item: flex: 1 1 0
        return createFlexGrowItemProps(measurement.width, {
          basis: 0,
          grow: 1,
          shrink: 1,
          minSize: 0,
          maxSize: Infinity,
          contentSize: measurement.height,
        });
      }

      // Natural height item: flex: 0 1 auto
      return createFlexItemProps(measurement.width, {
        basis: measurement.height, // auto = content size
        grow: 0,
        shrink: 1,
        minSize: 0,
        maxSize: Infinity,
        contentSize: measurement.height,
      });
    });

    // Step 3: Compute flex layout (vertical)
    const flexConfig: FlexContainerConfig = {
      mainSize: innerHeight ?? childMeasurements.reduce((sum, m, i) =>
        sum + m.height + (i > 0 ? gap : 0), 0
      ),
      crossSize: innerWidth,
      direction: 'column',
      justifyContent: 'flex-start',
      alignItems: toAlignItems(align),
      gap,
    };

    const flexResult = computeFlexLayout(flexItems, flexConfig);

    // Step 4: Layout children using flex results
    const children: LayoutBox[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const flexItem = flexResult.items[i];
      const measurement = childMeasurements[i];

      // Calculate X based on align
      let childX = x + padding.left;
      let childWidth = align === 'stretch' ? innerWidth : measurement.width;

      switch (align) {
        case 'center':
          childX = x + padding.left + (innerWidth - measurement.width) / 2;
          break;
        case 'end':
          childX = x + padding.left + (innerWidth - measurement.width);
          break;
      }

      // Get Y position from flex layout
      const childY = y + padding.top + flexItem.mainPosition;

      const childBox = this.layoutNode(child, childX, childY, {
        ...constraints,
        maxWidth: childWidth,
        maxHeight: flexItem.mainSize,
      });
      children.push(childBox);
    }

    // Calculate total height
    const totalHeight = flexResult.mainSizeUsed;

    return {
      x, y,
      width: constraints.maxWidth,
      height: totalHeight + padding.top + padding.bottom,
      node,
      children,
      padding,
    };
  }

  private rowContainsSidebarOrMain(row: RowNode): boolean {
    return row.children.some(child =>
      child.type === 'Sidebar' || child.type === 'Main'
    );
  }

  private layoutHeader(node: HeaderNode, x: number, y: number, constraints: Constraints): LayoutBox {
    const padding = this.getPadding(node);
    // Fixed height of 56px to match CSS min-height: 56px
    const height = this.resolveSize(node.h) || 56;
    const innerWidth = constraints.maxWidth - padding.left - padding.right;

    // Layout children - if child is a Row, let it handle its own justify
    const children: LayoutBox[] = [];
    let currentY = y + padding.top;

    for (const child of node.children) {
      // Don't pass maxHeight to header children - they should use natural height
      // This prevents rows from stretching to fill page height
      const childBox = this.layoutNode(child, x + padding.left, currentY, {
        ...constraints,
        maxWidth: innerWidth,
        maxHeight: undefined,  // Children use natural height
        inHeader: true,  // Pass header context for child sizing (e.g., smaller avatars)
      });

      // Vertically center the child within header height
      const verticalOffset = (height - childBox.height) / 2;
      childBox.y = y + padding.top + verticalOffset;

      // Also adjust all nested children's Y positions
      this.adjustChildrenY(childBox, verticalOffset);

      children.push(childBox);
      currentY += childBox.height;
    }

    return {
      x, y,
      width: constraints.maxWidth,
      height: height + padding.top + padding.bottom,
      node,
      children,
      padding,
    };
  }

  private adjustChildrenY(box: LayoutBox, offset: number): void {
    for (const child of box.children) {
      child.y += offset;
      this.adjustChildrenY(child, offset);
    }
  }

  /**
   * Check if a node should flex to fill available space in a Row
   * Only layout containers without explicit width should flex
   */
  private isFlexContainer(node: AnyNode): boolean {
    // Main, Col (without explicit width) should flex
    if (node.type === 'Main') return true;
    if (node.type === 'Col' && !('w' in node && node.w !== undefined)) return true;
    // Card and Sidebar without explicit width should NOT flex - they have natural sizes
    return false;
  }

  private layoutFooter(node: FooterNode, x: number, y: number, constraints: Constraints): LayoutBox {
    const padding = this.getPadding(node);
    const height = this.resolveSize(node.h) || 60;
    const innerWidth = constraints.maxWidth - padding.left - padding.right;

    // Layout children - if child is a Row, let it handle its own justify
    const children: LayoutBox[] = [];
    let currentY = y + padding.top;

    for (const child of node.children) {
      // Don't pass maxHeight to footer children - they should use natural height
      const childBox = this.layoutNode(child, x + padding.left, currentY, {
        ...constraints,
        maxWidth: innerWidth,
        maxHeight: undefined,  // Children use natural height
      });

      // Vertically center the child within footer height
      const verticalOffset = (height - childBox.height) / 2;
      childBox.y = y + padding.top + verticalOffset;

      // Also adjust all nested children's Y positions
      this.adjustChildrenY(childBox, verticalOffset);

      children.push(childBox);
      currentY += childBox.height;
    }

    return {
      x, y,
      width: constraints.maxWidth,
      height: height + padding.top + padding.bottom,
      node,
      children,
      padding,
    };
  }

  private layoutMain(node: MainNode, x: number, y: number, constraints: Constraints): LayoutBox {
    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const innerWidth = constraints.maxWidth - padding.left - padding.right;

    const childMeasurements = node.children.map(child =>
      this.measureNode(child, { ...constraints, maxWidth: innerWidth })
    );

    const children: LayoutBox[] = [];
    let currentY = y + padding.top;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childBox = this.layoutNode(child, x + padding.left, currentY, {
        ...constraints,
        maxWidth: innerWidth,
      });
      children.push(childBox);
      currentY += childBox.height + gap;
    }

    const totalHeight = childMeasurements.reduce((sum, m, i) =>
      sum + m.height + (i > 0 ? gap : 0), 0
    );

    return {
      x, y,
      width: constraints.maxWidth,
      height: totalHeight + padding.top + padding.bottom,
      node,
      children,
      padding,
    };
  }

  private layoutSidebar(node: SidebarNode, x: number, y: number, constraints: Constraints): LayoutBox {
    const width = this.resolveSize(node.w) || 200;
    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? 8;
    const innerWidth = width - padding.left - padding.right;

    const children: LayoutBox[] = [];
    let currentY = y + padding.top;

    for (const child of node.children) {
      const childBox = this.layoutNode(child, x + padding.left, currentY, {
        ...constraints,
        maxWidth: innerWidth,
      });
      children.push(childBox);
      currentY += childBox.height + gap;
    }

    const contentHeight = currentY - y - padding.top - gap + padding.bottom;

    // Use constraints.maxHeight if available (fills parent row height)
    // Otherwise use content height with minimum of 200
    const height = constraints.maxHeight || Math.max(contentHeight, 200);

    return {
      x, y,
      width,
      height,
      node,
      children,
      padding,
    };
  }

  private layoutCard(node: CardNode, x: number, y: number, constraints: Constraints): LayoutBox {
    let cardWidth = this.resolveSize(node.w);
    if (!cardWidth) {
      cardWidth = Math.min(360, constraints.maxWidth);
    }

    const padding = this.getPadding(node);
    const gap = this.getGap(node) ?? this.DEFAULT_GAP;
    const innerWidth = cardWidth - padding.left - padding.right;

    const children: LayoutBox[] = [];
    let currentY = y + padding.top;

    // Add title height
    if (node.title) {
      currentY += 28;
    }

    for (const child of node.children) {
      const childBox = this.layoutNode(child, x + padding.left, currentY, {
        ...constraints,
        maxWidth: innerWidth,
      });
      children.push(childBox);
      currentY += childBox.height + gap;
    }

    const totalHeight = currentY - y - gap + padding.bottom;

    return {
      x, y,
      width: cardWidth,
      height: totalHeight,
      node,
      children,
      padding,
    };
  }

  // ===========================================
  // Render Phase
  // ===========================================

  private renderBox(box: LayoutBox): string {
    if (!box.node) return '';

    switch (box.node.type) {
      case 'Row':
        return this.renderRowBox(box);
      case 'Col':
        return this.renderColBox(box);
      case 'Header':
        return this.renderHeaderBox(box);
      case 'Footer':
        return this.renderFooterBox(box);
      case 'Main':
        return this.renderMainBox(box);
      case 'Sidebar':
        return this.renderSidebarBox(box);
      case 'Card':
        return this.renderCardBox(box);
      case 'Modal':
        return this.renderModalBox(box);
      case 'Title':
        return this.renderTitleBox(box);
      case 'Text':
        return this.renderTextBox(box);
      case 'Button':
        return this.renderButtonBox(box);
      case 'Input':
        return this.renderInputBox(box);
      case 'Textarea':
        return this.renderTextareaBox(box);
      case 'Select':
        return this.renderSelectBox(box);
      case 'Checkbox':
        return this.renderCheckboxBox(box);
      case 'Radio':
        return this.renderRadioBox(box);
      case 'Switch':
        return this.renderSwitchBox(box);
      case 'Link':
        return this.renderLinkBox(box);
      case 'Image':
        return this.renderImageBox(box);
      case 'Placeholder':
        return this.renderPlaceholderBox(box);
      case 'Avatar':
        return this.renderAvatarBox(box);
      case 'Badge':
        return this.renderBadgeBox(box);
      case 'Table':
        return this.renderTableBox(box);
      case 'List':
        return this.renderListBox(box);
      case 'Alert':
        return this.renderAlertBox(box);
      case 'Progress':
        return this.renderProgressBox(box);
      case 'Spinner':
        return this.renderSpinnerBox(box);
      case 'Nav':
        return this.renderNavBox(box);
      case 'Tabs':
        return this.renderTabsBox(box);
      case 'Breadcrumb':
        return this.renderBreadcrumbBox(box);
      case 'Icon':
        return this.renderIconBox(box);
      case 'Divider':
        return this.renderDividerBox(box);
      default:
        return `<!-- Unsupported: ${box.node.type} -->`;
    }
  }

  private renderRowBox(box: LayoutBox): string {
    const childrenSvg = box.children.map(child => this.renderBox(child)).join('\n');
    return childrenSvg;
  }

  private renderColBox(box: LayoutBox): string {
    const childrenSvg = box.children.map(child => this.renderBox(child)).join('\n');
    return childrenSvg;
  }

  private renderHeaderBox(box: LayoutBox): string {
    const node = box.node as HeaderNode;
    const hasBorder = node.border !== false;

    let svg = `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${this.theme.colors.background}"/>`;

    // Bottom border only (like CSS border-bottom)
    if (hasBorder) {
      svg += `<line x1="${box.x}" y1="${box.y + box.height}" x2="${box.x + box.width}" y2="${box.y + box.height}" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
    }

    svg += box.children.map(child => this.renderBox(child)).join('\n');
    svg += `</g>`;

    return svg;
  }

  private renderFooterBox(box: LayoutBox): string {
    const node = box.node as FooterNode;
    const hasBorder = node.border !== false;

    let svg = `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${this.theme.colors.background}"`;
    if (hasBorder) {
      svg += ` stroke="${this.theme.colors.border}" stroke-width="1"`;
    }
    svg += `/>`;

    svg += box.children.map(child => this.renderBox(child)).join('\n');
    svg += `</g>`;

    return svg;
  }

  private renderMainBox(box: LayoutBox): string {
    const childrenSvg = box.children.map(child => this.renderBox(child)).join('\n');
    return childrenSvg;
  }

  private renderSidebarBox(box: LayoutBox): string {
    // Sidebar always has a border in wireframe style
    let svg = `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="1"/>`;

    svg += box.children.map(child => this.renderBox(child)).join('\n');
    svg += `</g>`;

    return svg;
  }

  private renderCardBox(box: LayoutBox): string {
    const node = box.node as CardNode;
    const shadowAttr = node.shadow ? 'filter="url(#shadow)"' : '';

    let svg = `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="8" fill="white" stroke="${this.theme.colors.border}" stroke-width="1" ${shadowAttr}/>`;

    if (node.title) {
      const padding = this.getPadding(node);
      svg += `<text x="${box.x + padding.left}" y="${box.y + padding.top + 18}" font-size="16" font-weight="600" fill="${this.theme.colors.foreground}">${this.escapeXml(node.title)}</text>`;
    }

    svg += box.children.map(child => this.renderBox(child)).join('\n');
    svg += `</g>`;

    return svg;
  }

  private renderModalBox(box: LayoutBox): string {
    const node = box.node as ModalNode;

    // Center modal
    const modalX = (this.pageWidth - box.width) / 2;
    const modalY = (this.pageHeight - box.height) / 2;

    let svg = `<g>
      <rect width="${this.pageWidth}" height="${this.pageHeight}" fill="rgba(0,0,0,0.5)"/>
      <rect x="${modalX}" y="${modalY}" width="${box.width}" height="${box.height}" rx="8" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;

    if (node.title) {
      svg += `<text x="${modalX + 20}" y="${modalY + 30}" font-size="18" font-weight="600" fill="${this.theme.colors.foreground}">${this.escapeXml(node.title)}</text>`;
    }

    // Adjust children positions to modal center
    for (const child of box.children) {
      const adjustedChild = { ...child, x: modalX + (child.x - box.x), y: modalY + (child.y - box.y) };
      svg += this.renderBox(adjustedChild);
    }

    svg += `</g>`;

    return svg;
  }

  private renderTitleBox(box: LayoutBox): string {
    const node = box.node as TitleNode;
    const level = node.level || 1;
    const fontSize = this.getTitleFontSize(level);
    const textY = box.y + fontSize;

    let textX = box.x;
    let anchor = 'start';
    if (node.align === 'center') {
      textX = box.x + box.width / 2;
      anchor = 'middle';
    } else if (node.align === 'right') {
      textX = box.x + box.width;
      anchor = 'end';
    }

    return `<text x="${textX}" y="${textY}" font-size="${fontSize}" font-weight="600" fill="${this.theme.colors.foreground}" text-anchor="${anchor}">${this.escapeXml(node.content)}</text>`;
  }

  private renderTextBox(box: LayoutBox): string {
    const node = box.node as TextNode;
    const fontSize = this.resolveFontSize(node.size);
    const fill = node.muted ? this.theme.colors.muted : this.theme.colors.foreground;
    const fontWeight = node.weight || 'normal';
    const textY = box.y + fontSize;

    let textX = box.x;
    let anchor = 'start';
    if (node.align === 'center') {
      textX = box.x + box.width / 2;
      anchor = 'middle';
    } else if (node.align === 'right') {
      textX = box.x + box.width;
      anchor = 'end';
    }

    return `<text x="${textX}" y="${textY}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${anchor}">${this.escapeXml(node.content)}</text>`;
  }

  private renderButtonBox(box: LayoutBox): string {
    const node = box.node as ButtonNode;
    const hasIcon = !!node.icon;
    // Icon-only: has icon but no text content (or default "Button" text)
    const isIconOnly = hasIcon && (!node.content.trim() || node.content === 'Button');

    let fill = this.theme.colors.primary;
    let textFill = '#ffffff';
    let strokeAttr = '';

    if (node.secondary) {
      fill = this.theme.colors.secondary;
    } else if (node.outline) {
      fill = 'white';
      textFill = this.theme.colors.foreground;
      strokeAttr = `stroke="${this.theme.colors.border}" stroke-width="1"`;
    } else if (node.ghost) {
      fill = 'transparent';
      textFill = this.theme.colors.foreground;
    }

    let svg = `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="4" fill="${fill}" ${strokeAttr}/>`;

    if (hasIcon) {
      const iconData = getIconData(node.icon!);
      if (iconData) {
        const iconSize = 16;
        const iconX = isIconOnly ? box.x + (box.width - iconSize) / 2 : box.x + 16;
        const iconY = box.y + (box.height - iconSize) / 2;
        svg += this.renderIconPaths(iconData, iconX, iconY, iconSize, textFill);
      }
    }

    if (!isIconOnly) {
      const textX = hasIcon ? box.x + 36 + (box.width - 52) / 2 : box.x + box.width / 2;
      svg += `<text x="${textX}" y="${box.y + box.height / 2 + 5}" font-size="14" fill="${textFill}" text-anchor="middle">${this.escapeXml(node.content)}</text>`;
    }

    svg += `</g>`;
    return svg;
  }

  private renderInputBox(box: LayoutBox): string {
    const node = box.node as InputNode;
    let y = box.y;
    let svg = '<g>';

    // Don't show label if it's the default "Label" and input has a placeholder
    const shouldShowLabel = node.label && !(node.label === 'Label' && node.placeholder);
    if (shouldShowLabel) {
      svg += `<text x="${box.x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label!)}</text>`;
      y += 24;
    }

    const inputHeight = 36;  // Match CSS height
    const placeholder = node.placeholder || '';

    // Gray background without border (like HTML input style)
    svg += `<rect x="${box.x}" y="${y}" width="${box.width}" height="${inputHeight}" rx="4" fill="#f4f4f5"/>`;
    svg += `<text x="${box.x + 12}" y="${y + inputHeight / 2 + 5}" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(placeholder)}</text>`;
    svg += '</g>';

    return svg;
  }

  private renderTextareaBox(box: LayoutBox): string {
    const node = box.node as TextareaNode;
    let y = box.y;
    let svg = '<g>';

    if (node.label) {
      svg += `<text x="${box.x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
      y += 24;
    }

    const textareaHeight = box.height - (node.label ? 24 : 0);
    const placeholder = node.placeholder || '';

    svg += `<rect x="${box.x}" y="${y}" width="${box.width}" height="${textareaHeight}" rx="4" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
    svg += `<text x="${box.x + 12}" y="${y + 24}" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(placeholder)}</text>`;
    svg += '</g>';

    return svg;
  }

  private renderSelectBox(box: LayoutBox): string {
    const node = box.node as SelectNode;
    let y = box.y;
    let svg = '<g>';

    if (node.label) {
      svg += `<text x="${box.x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
      y += 24;
    }

    const selectHeight = 40;
    const placeholder = node.placeholder || 'Select...';

    svg += `<rect x="${box.x}" y="${y}" width="${box.width}" height="${selectHeight}" rx="4" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
    svg += `<text x="${box.x + 12}" y="${y + selectHeight / 2 + 5}" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(placeholder)}</text>`;
    svg += `<path d="M${box.x + box.width - 24} ${y + selectHeight / 2 - 3} l6 6 l6 -6" fill="none" stroke="${this.theme.colors.muted}" stroke-width="1.5"/>`;
    svg += '</g>';

    return svg;
  }

  private renderCheckboxBox(box: LayoutBox): string {
    const node = box.node as CheckboxNode;
    const size = 18;

    let svg = `<g>
      <rect x="${box.x}" y="${box.y}" width="${size}" height="${size}" rx="3" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;

    if (node.checked) {
      svg += `<path d="M${box.x + 4} ${box.y + 9} L${box.x + 7} ${box.y + 12} L${box.x + 14} ${box.y + 5}" fill="none" stroke="${this.theme.colors.foreground}" stroke-width="2"/>`;
    }

    if (node.label) {
      svg += `<text x="${box.x + size + 8}" y="${box.y + size - 3}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
    }

    svg += '</g>';
    return svg;
  }

  private renderRadioBox(box: LayoutBox): string {
    const node = box.node as RadioNode;
    const size = 18;
    const radius = size / 2;
    const cx = box.x + radius;
    const cy = box.y + radius;

    let svg = `<g>
      <circle cx="${cx}" cy="${cy}" r="${radius - 1}" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;

    if (node.checked) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${radius - 5}" fill="${this.theme.colors.foreground}"/>`;
    }

    if (node.label) {
      svg += `<text x="${box.x + size + 8}" y="${box.y + size - 3}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
    }

    svg += '</g>';
    return svg;
  }

  private renderSwitchBox(box: LayoutBox): string {
    const node = box.node as SwitchNode;
    const width = 44;
    const height = 24;
    const radius = height / 2;

    const isOn = node.checked;
    const bgColor = isOn ? this.theme.colors.primary : this.theme.colors.border;
    const knobX = isOn ? box.x + width - radius : box.x + radius;

    let svg = `<g>
      <rect x="${box.x}" y="${box.y}" width="${width}" height="${height}" rx="${radius}" fill="${bgColor}"/>
      <circle cx="${knobX}" cy="${box.y + radius}" r="${radius - 3}" fill="white"/>`;

    if (node.label) {
      svg += `<text x="${box.x + width + 8}" y="${box.y + height - 6}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
    }

    svg += '</g>';
    return svg;
  }

  private renderLinkBox(box: LayoutBox): string {
    const node = box.node as LinkNode;
    const fontSize = 14;
    const textY = box.y + fontSize;

    return `<text x="${box.x}" y="${textY}" font-size="${fontSize}" fill="${this.theme.colors.primary}" text-decoration="underline">${this.escapeXml(node.content)}</text>`;
  }

  private renderImageBox(box: LayoutBox): string {
    const node = box.node as ImageNode;

    return `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${this.theme.colors.muted}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <line x1="${box.x}" y1="${box.y}" x2="${box.x + box.width}" y2="${box.y + box.height}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <line x1="${box.x + box.width}" y1="${box.y}" x2="${box.x}" y2="${box.y + box.height}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="${box.x + box.width / 2}" y="${box.y + box.height / 2 + 5}" font-size="14" fill="${this.theme.colors.foreground}" text-anchor="middle">${this.escapeXml(node.alt || 'Image')}</text>
    </g>`;
  }

  private renderPlaceholderBox(box: LayoutBox): string {
    const node = box.node as PlaceholderNode;
    const patternId = `placeholder-pattern-${this.clipPathCounter++}`;

    // Create diagonal stripe pattern similar to HTML's repeating-linear-gradient
    const patternDef = `<pattern id="${patternId}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" fill="#f9f9f9"/>
      <rect width="7" height="14" fill="rgba(0,0,0,0.03)"/>
    </pattern>`;

    // Add pattern to defs (we'll need to inject this)
    this.clipPathDefs.push(patternDef);

    return `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="4" fill="url(#${patternId})" stroke="${this.theme.colors.muted}" stroke-width="1" stroke-dasharray="4,2"/>
      <text x="${box.x + box.width / 2}" y="${box.y + box.height / 2 + 5}" font-size="14" fill="${this.theme.colors.muted}" text-anchor="middle">${this.escapeXml(node.label || 'Placeholder')}</text>
    </g>`;
  }

  private renderAvatarBox(box: LayoutBox): string {
    const node = box.node as AvatarNode;
    const radius = box.width / 2;
    const cx = box.x + radius;
    const cy = box.y + radius;

    const initial = node.name ? node.name.charAt(0).toUpperCase() : '?';

    // Black background with white text (like HTML avatar style)
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${this.theme.colors.foreground}"/>
      <text x="${cx}" y="${cy + 5}" font-size="${box.width / 2.5}" fill="${this.theme.colors.background}" text-anchor="middle">${initial}</text>
    </g>`;
  }

  private renderBadgeBox(box: LayoutBox): string {
    const node = box.node as BadgeNode;

    return `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="11" fill="${this.theme.colors.muted}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="${box.x + box.width / 2}" y="${box.y + box.height / 2 + 4}" font-size="12" fill="${this.theme.colors.foreground}" text-anchor="middle">${this.escapeXml(node.content)}</text>
    </g>`;
  }

  private renderTableBox(box: LayoutBox): string {
    const node = box.node as TableNode;
    const columns = node.columns || [];
    const rows = node.rows || [];
    const rowCount = rows.length || 3;
    const colWidth = 120;
    const rowHeight = 40;

    let svg = `<g>`;

    // Header
    svg += `<rect x="${box.x}" y="${box.y}" width="${columns.length * colWidth}" height="${rowHeight}" fill="${this.theme.colors.muted}"/>`;
    columns.forEach((col, i) => {
      svg += `<text x="${box.x + i * colWidth + 12}" y="${box.y + rowHeight / 2 + 5}" font-size="14" font-weight="600">${this.escapeXml(col)}</text>`;
    });

    // Rows
    const displayRowCount = rows.length > 0 ? rows.length : rowCount;
    for (let rowIdx = 0; rowIdx < displayRowCount; rowIdx++) {
      const rowY = box.y + (rowIdx + 1) * rowHeight;
      svg += `<rect x="${box.x}" y="${rowY}" width="${columns.length * colWidth}" height="${rowHeight}" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
      columns.forEach((_, colIdx) => {
        const cellContent = rows[rowIdx] && rows[rowIdx][colIdx]
          ? String(typeof rows[rowIdx][colIdx] === 'object' ? '...' : rows[rowIdx][colIdx])
          : '—';
        svg += `<text x="${box.x + colIdx * colWidth + 12}" y="${rowY + rowHeight / 2 + 5}" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(cellContent)}</text>`;
      });
    }

    svg += '</g>';
    return svg;
  }

  private renderListBox(box: LayoutBox): string {
    const node = box.node as ListNode;
    const items = node.items || [];
    const ordered = node.ordered || false;

    let svg = '<g>';

    items.forEach((item, idx) => {
      const marker = ordered ? `${idx + 1}.` : '•';
      const content = typeof item === 'string' ? item : item.content;
      svg += `<text x="${box.x}" y="${box.y + idx * 28 + 16}" font-size="14" fill="${this.theme.colors.foreground}">${marker} ${this.escapeXml(content)}</text>`;
    });

    svg += '</g>';
    return svg;
  }

  private renderAlertBox(box: LayoutBox): string {
    const node = box.node as AlertNode;

    return `<g>
      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="4" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="${box.x + 16}" y="${box.y + box.height / 2 + 5}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.content)}</text>
    </g>`;
  }

  private renderProgressBox(box: LayoutBox): string {
    const node = box.node as ProgressNode;
    let y = box.y;
    let svg = '<g>';

    if (node.label) {
      svg += `<text x="${box.x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
      y += 24;
    }

    const barHeight = 8;
    const value = node.value || 0;
    const max = node.max || 100;
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    svg += `<rect x="${box.x}" y="${y}" width="${box.width}" height="${barHeight}" rx="${barHeight / 2}" fill="${this.theme.colors.muted}"/>`;
    svg += `<rect x="${box.x}" y="${y}" width="${(box.width * percent) / 100}" height="${barHeight}" rx="${barHeight / 2}" fill="${this.theme.colors.primary}"/>`;
    svg += '</g>';

    return svg;
  }

  private renderSpinnerBox(box: LayoutBox): string {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const radius = box.width / 2 - 2;

    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${this.theme.colors.muted}" stroke-width="2"/>
      <path d="M${cx},${cy - radius} A${radius},${radius} 0 0,1 ${cx + radius},${cy}" fill="none" stroke="${this.theme.colors.primary}" stroke-width="2" stroke-linecap="round"/>
    </g>`;
  }

  private renderNavBox(box: LayoutBox): string {
    const node = box.node as NavNode;
    const vertical = node.vertical || false;

    let svg = '<g>';

    // If block syntax (children), render children
    if (node.children && node.children.length > 0) {
      let offsetY = 0;
      node.children.forEach((child) => {
        if (child.type === 'divider') {
          offsetY += 16;
          svg += `<line x1="${box.x}" y1="${box.y + offsetY}" x2="${box.x + box.width - 32}" y2="${box.y + offsetY}" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
          offsetY += 8;
        } else if (child.type === 'group') {
          // Group label
          svg += `<text x="${box.x}" y="${box.y + offsetY + 16}" font-size="11" font-weight="500" fill="${this.theme.colors.muted}" text-transform="uppercase">${this.escapeXml(child.label)}</text>`;
          offsetY += 28;
          // Group items
          child.items.forEach((item) => {
            if (item.type === 'divider') {
              offsetY += 8;
              svg += `<line x1="${box.x}" y1="${box.y + offsetY}" x2="${box.x + box.width - 32}" y2="${box.y + offsetY}" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
              offsetY += 8;
            } else {
              const fill = item.active ? this.theme.colors.foreground : this.theme.colors.muted;
              const fontWeight = item.active ? 'font-weight="500"' : '';
              svg += `<text x="${box.x}" y="${box.y + offsetY + 16}" font-size="14" ${fontWeight} fill="${fill}">${this.escapeXml(item.label)}</text>`;
              offsetY += 32;
            }
          });
        } else if (child.type === 'item') {
          const fill = child.active ? this.theme.colors.foreground : this.theme.colors.muted;
          const fontWeight = child.active ? 'font-weight="500"' : '';
          svg += `<text x="${box.x}" y="${box.y + offsetY + 16}" font-size="14" ${fontWeight} fill="${fill}">${this.escapeXml(child.label)}</text>`;
          offsetY += 32;
        }
      });
      svg += '</g>';
      return svg;
    }

    // Array syntax (items)
    const items = node.items || [];
    if (vertical) {
      items.forEach((item, idx) => {
        const label = typeof item === 'string' ? item : item.label;
        const isActive = typeof item === 'object' && item.active;
        const fill = isActive ? this.theme.colors.foreground : this.theme.colors.muted;
        svg += `<text x="${box.x}" y="${box.y + idx * 32 + 16}" font-size="14" fill="${fill}">${this.escapeXml(label)}</text>`;
      });
    } else {
      let offsetX = 0;
      items.forEach((item) => {
        const label = typeof item === 'string' ? item : item.label;
        const isActive = typeof item === 'object' && item.active;
        const fill = isActive ? this.theme.colors.foreground : this.theme.colors.muted;
        svg += `<text x="${box.x + offsetX}" y="${box.y + 16}" font-size="14" fill="${fill}">${this.escapeXml(label)}</text>`;
        offsetX += this.estimateTextWidth(label, 14) + 24;
      });
    }

    svg += '</g>';
    return svg;
  }

  private renderTabsBox(box: LayoutBox): string {
    const node = box.node as TabsNode;
    const items = node.items || [];
    const tabHeight = 40;

    let svg = '<g>';
    let offsetX = 0;

    items.forEach((item, idx) => {
      const label = typeof item === 'string' ? item : item;
      const tabWidth = this.estimateTextWidth(label, 14) + 32;
      const isFirst = idx === 0;

      svg += `<rect x="${box.x + offsetX}" y="${box.y}" width="${tabWidth}" height="${tabHeight}" fill="${isFirst ? 'white' : this.theme.colors.muted}" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
      svg += `<text x="${box.x + offsetX + tabWidth / 2}" y="${box.y + tabHeight / 2 + 5}" font-size="14" text-anchor="middle" fill="${this.theme.colors.foreground}">${this.escapeXml(label)}</text>`;
      offsetX += tabWidth;
    });

    svg += '</g>';
    return svg;
  }

  private renderBreadcrumbBox(box: LayoutBox): string {
    const node = box.node as BreadcrumbNode;
    const items = node.items || [];
    const separator = '/';

    let svg = '<g>';
    let offsetX = 0;

    items.forEach((item, idx) => {
      const label = typeof item === 'string' ? item : item.label;
      const isLast = idx === items.length - 1;
      const fill = isLast ? this.theme.colors.foreground : this.theme.colors.muted;

      svg += `<text x="${box.x + offsetX}" y="${box.y + 16}" font-size="14" fill="${fill}">${this.escapeXml(label)}</text>`;
      offsetX += this.estimateTextWidth(label, 14) + 8;

      if (!isLast) {
        svg += `<text x="${box.x + offsetX}" y="${box.y + 16}" font-size="14" fill="${this.theme.colors.muted}">${separator}</text>`;
        offsetX += 16;
      }
    });

    svg += '</g>';
    return svg;
  }

  private renderIconBox(box: LayoutBox): string {
    const node = box.node as IconNode;
    const iconData = getIconData(node.name);

    if (!iconData) {
      return `<!-- Icon not found: ${node.name} -->`;
    }

    const color = this.theme.colors.foreground;
    return this.renderIconPaths(iconData, box.x, box.y, box.width, color);
  }

  private renderDividerBox(box: LayoutBox): string {
    // Divider is always horizontal for now
    return `<line x1="${box.x}" y1="${box.y}" x2="${box.x + box.width}" y2="${box.y}" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  private renderIconPaths(data: IconData, x: number, y: number, size: number, color: string): string {
    const scale = size / 24;
    const paths = data.map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `<${tag} ${attrStr} />`;
    }).join('');

    return `<g transform="translate(${x}, ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
  }

  private getPadding(node: AnyNode): { top: number; right: number; bottom: number; left: number } {
    const defaultPadding = { top: 0, right: 0, bottom: 0, left: 0 };

    if (!('p' in node) && !('px' in node) && !('py' in node)) {
      // Default padding for certain node types
      if (node.type === 'Card' || node.type === 'Header' || node.type === 'Footer' || node.type === 'Sidebar') {
        return { top: 16, right: 16, bottom: 16, left: 16 };
      }
      return defaultPadding;
    }

    let p = 0;
    if ('p' in node && node.p !== undefined) {
      p = this.resolveSpacing(node.p);
    }

    let px = p;
    let py = p;

    if ('px' in node && node.px !== undefined) {
      px = this.resolveSpacing(node.px);
    }
    if ('py' in node && node.py !== undefined) {
      py = this.resolveSpacing(node.py);
    }

    // Header uses horizontal-only padding to match CSS: padding: 0 16px
    if (node.type === 'Header') {
      return { top: 0, right: px, bottom: 0, left: px };
    }

    return { top: py, right: px, bottom: py, left: px };
  }

  private getGap(node: AnyNode): number | undefined {
    if ('gap' in node && node.gap !== undefined) {
      return this.resolveSpacing(node.gap);
    }
    return undefined;
  }

  private resolveSpacing(value: unknown): number {
    if (typeof value === 'number') {
      return value * 4; // Tailwind-like spacing scale
    }
    if (typeof value === 'object' && value && 'value' in value) {
      return (value as { value: number }).value;
    }
    return 0;
  }

  private resolveSize(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      if (value === 'full') return undefined; // Will be handled by constraints
      const num = parseFloat(value);
      if (!isNaN(num)) return num;
    }
    if (typeof value === 'object' && value && 'value' in value) {
      return (value as { value: number }).value;
    }
    return undefined;
  }

  private isFullWidth(node: AnyNode): boolean {
    if ('w' in node) {
      return node.w === 'full';
    }
    return false;
  }

  private estimateTextWidth(text: string, fontSize: number): number {
    // Rough estimate: average character width is ~0.6 of font size
    return text.length * fontSize * 0.6;
  }

  private resolveFontSize(size: TextNode['size']): number {
    if (!size) return 16;
    if (typeof size === 'string') {
      const sizes: Record<string, number> = {
        xs: 12, sm: 14, base: 16, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30,
      };
      return sizes[size] || 16;
    }
    if (typeof size === 'object' && 'value' in size) {
      if (size.unit === 'px') return size.value;
      if (size.unit === 'rem') return size.value * 16;
      if (size.unit === 'em') return size.value * 16;
      return size.value;
    }
    return 16;
  }

  private getTitleFontSize(level: number): number {
    // Match CSS: h1=36, h2=30, h3=24, h4=20, h5=18, h6=16
    const sizes: Record<number, number> = { 1: 36, 2: 30, 3: 24, 4: 20, 5: 18, 6: 16 };
    return sizes[level] || 20;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// ===========================================
// Export Functions
// ===========================================

export function createSvgRenderer(options?: SvgRenderOptions): SvgRenderer {
  return new SvgRenderer(options);
}

export function renderToSvg(doc: WireframeDocument, options?: SvgRenderOptions): SvgRenderResult {
  const renderer = new SvgRenderer(options);
  return renderer.render(doc);
}

export type { LayoutBox, Size, Constraints };
