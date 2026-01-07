/**
 * SVG Renderer for wireweave
 *
 * Renders wireframe AST to SVG image format
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
} from '../../ast/types';
import type { SvgRenderOptions, SvgRenderResult, ThemeConfig } from '../types';
import { defaultTheme } from '../types';
import { resolveViewport } from '../../viewport';
import { getIconData, type IconData } from '../../icons/lucide-icons';

/**
 * Bounding box for layout calculations
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * SVG Renderer class
 *
 * Renders wireframe AST nodes to SVG elements
 */
export class SvgRenderer {
  private options: Required<SvgRenderOptions>;
  private theme: ThemeConfig;
  private currentX: number = 0;
  private currentY: number = 0;
  private contentWidth: number = 0;

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
    this.contentWidth = this.options.width - this.options.padding * 2;
  }

  /**
   * Render a wireframe document to SVG
   */
  render(doc: WireframeDocument): SvgRenderResult {
    this.currentX = this.options.padding;
    this.currentY = this.options.padding;

    // Get viewport from first page (only if explicitly set), or use options
    const firstPage = doc.children[0];
    let width = this.options.width;
    let height = this.options.height;

    if (firstPage && (firstPage.viewport !== undefined || firstPage.device !== undefined)) {
      const viewport = resolveViewport(firstPage.viewport, firstPage.device);
      width = viewport.width;
      height = viewport.height;
      this.contentWidth = width - this.options.padding * 2;
    }

    const content = doc.children.map((page) => this.renderPage(page)).join('\n');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    ${this.generateDefs()}
  </defs>
  <rect width="100%" height="100%" fill="${this.options.background}"/>
  <g transform="scale(${this.options.scale})">
    ${content}
  </g>
</svg>`;

    return { svg, width, height };
  }

  /**
   * Generate SVG defs (styles, patterns, etc.)
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

  /**
   * Render a page node
   */
  private renderPage(node: PageNode): string {
    const elements: string[] = [];

    // Render page title if present
    if (node.title) {
      elements.push(this.renderPageTitle(node.title));
    }

    for (const child of node.children) {
      elements.push(this.renderNode(child));
    }

    return elements.join('\n');
  }

  /**
   * Render page title
   */
  private renderPageTitle(title: string): string {
    const fontSize = 24;
    const y = this.currentY + fontSize;
    this.currentY += fontSize + 16;

    return `<text x="${this.currentX}" y="${y}" font-size="${fontSize}" font-weight="600" fill="${this.theme.colors.foreground}">${this.escapeXml(title)}</text>`;
  }

  /**
   * Render any AST node
   */
  private renderNode(node: AnyNode): string {
    switch (node.type) {
      // Layout nodes
      case 'Row':
        return this.renderRow(node as RowNode);
      case 'Col':
        return this.renderCol(node as ColNode);
      case 'Header':
        return this.renderHeader(node as HeaderNode);
      case 'Main':
        return this.renderMain(node as MainNode);
      case 'Footer':
        return this.renderFooter(node as FooterNode);
      case 'Sidebar':
        return this.renderSidebar(node as SidebarNode);

      // Container nodes
      case 'Card':
        return this.renderCard(node as CardNode);
      case 'Modal':
        return this.renderModal(node as ModalNode);

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

      // Data nodes
      case 'Table':
        return this.renderTable(node as TableNode);
      case 'List':
        return this.renderList(node as ListNode);

      // Feedback nodes
      case 'Alert':
        return this.renderAlert(node as AlertNode);
      case 'Progress':
        return this.renderProgress(node as ProgressNode);
      case 'Spinner':
        return this.renderSpinner(node as SpinnerNode);

      // Navigation nodes
      case 'Nav':
        return this.renderNav(node as NavNode);
      case 'Tabs':
        return this.renderTabs(node as TabsNode);
      case 'Breadcrumb':
        return this.renderBreadcrumb(node as BreadcrumbNode);

      default:
        return `<!-- Unsupported: ${node.type} -->`;
    }
  }

  // ===========================================
  // Layout Renderers
  // ===========================================

  private renderRow(node: RowNode): string {
    const savedX = this.currentX;
    const savedY = this.currentY;
    const elements: string[] = [];

    // Calculate column widths
    const totalSpan = node.children.reduce((sum, child) => {
      if ('span' in child && typeof child.span === 'number') {
        return sum + child.span;
      }
      return sum + 1;
    }, 0);

    const colWidth = this.contentWidth / Math.max(totalSpan, 1);
    let maxHeight = 0;

    for (const child of node.children) {
      const span = 'span' in child && typeof child.span === 'number' ? child.span : 1;
      const childWidth = colWidth * span;
      const startY = this.currentY;

      elements.push(this.renderNode(child));

      const childHeight = this.currentY - startY;
      maxHeight = Math.max(maxHeight, childHeight);

      this.currentX += childWidth;
      this.currentY = savedY;
    }

    this.currentX = savedX;
    this.currentY = savedY + maxHeight;

    return elements.join('\n');
  }

  private renderCol(node: ColNode): string {
    return node.children.map((child) => this.renderNode(child)).join('\n');
  }

  private renderHeader(node: HeaderNode): string {
    const height = 60;
    const x = this.currentX;
    const y = this.currentY;

    const savedY = this.currentY;
    this.currentY += 16;
    const children = node.children.map((c) => this.renderNode(c)).join('\n');
    this.currentY = savedY + height + 8;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${this.contentWidth}" height="${height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      ${children}
    </g>`;
  }

  private renderMain(node: MainNode): string {
    return node.children.map((c) => this.renderNode(c)).join('\n');
  }

  private renderFooter(node: FooterNode): string {
    const height = 60;
    const x = this.currentX;
    const y = this.currentY;

    const savedY = this.currentY;
    this.currentY += 16;
    const children = node.children.map((c) => this.renderNode(c)).join('\n');
    this.currentY = savedY + height + 8;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${this.contentWidth}" height="${height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      ${children}
    </g>`;
  }

  private renderSidebar(node: SidebarNode): string {
    const width = 200;
    const height = 300;
    const x = this.currentX;
    const y = this.currentY;

    const savedY = this.currentY;
    this.currentY += 16;
    const children = node.children.map((c) => this.renderNode(c)).join('\n');
    this.currentY = savedY + height + 8;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" fill="${this.theme.colors.background}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      ${children}
    </g>`;
  }

  // ===========================================
  // Container Renderers
  // ===========================================

  private renderCard(node: CardNode): string {
    const width = Math.min(300, this.contentWidth);
    const x = this.currentX;
    const y = this.currentY;

    const savedY = this.currentY;
    this.currentY += 16;

    // Render title if present
    let titleSvg = '';
    if (node.title) {
      const titleFontSize = 16;
      titleSvg = `<text x="16" y="${titleFontSize + 12}" font-size="${titleFontSize}" font-weight="600" fill="${this.theme.colors.foreground}">${this.escapeXml(node.title)}</text>`;
      this.currentY += titleFontSize + 8;
    }

    const childStartY = this.currentY - savedY;
    const children = node.children.map((c) => this.renderNode(c)).join('\n');
    const contentHeight = Math.max(this.currentY - savedY, 100);

    this.currentY = savedY + contentHeight + 16;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${contentHeight}" rx="8" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>
      ${titleSvg}
      <g transform="translate(16, ${childStartY})">
        ${children}
      </g>
    </g>`;
  }

  private renderModal(node: ModalNode): string {
    const width = 400;
    const height = 300;
    const x = (this.options.width - width) / 2;
    const y = (this.options.height - height) / 2;

    let titleSvg = '';
    if (node.title) {
      titleSvg = `<text x="20" y="30" font-size="18" font-weight="600" fill="${this.theme.colors.foreground}">${this.escapeXml(node.title)}</text>`;
    }

    const savedX = this.currentX;
    const savedY = this.currentY;
    this.currentX = 20;
    this.currentY = 50;

    const children = node.children.map((c) => this.renderNode(c)).join('\n');

    this.currentX = savedX;
    this.currentY = savedY;

    return `
    <g>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" opacity="0.5"/>
      <g transform="translate(${x}, ${y})">
        <rect width="${width}" height="${height}" rx="8" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>
        ${titleSvg}
        ${children}
      </g>
    </g>`;
  }

  // ===========================================
  // Text Renderers
  // ===========================================

  private renderText(node: TextNode): string {
    const fontSize = this.resolveFontSize(node.size);
    const fill = node.muted ? this.theme.colors.muted : this.theme.colors.foreground;
    const fontWeight = node.weight || 'normal';

    const y = this.currentY + fontSize;
    this.currentY += fontSize + 8;

    return `<text x="${this.currentX}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${this.escapeXml(node.content)}</text>`;
  }

  private renderTitle(node: TitleNode): string {
    const level = node.level || 1;
    const fontSize = this.getTitleFontSize(level);

    const y = this.currentY + fontSize;
    this.currentY += fontSize + 12;

    return `<text x="${this.currentX}" y="${y}" font-size="${fontSize}" font-weight="600" fill="${this.theme.colors.foreground}">${this.escapeXml(node.content)}</text>`;
  }

  private renderLink(node: LinkNode): string {
    const fontSize = 14;
    const y = this.currentY + fontSize;
    this.currentY += fontSize + 8;

    return `<text x="${this.currentX}" y="${y}" font-size="${fontSize}" fill="${this.theme.colors.primary}" text-decoration="underline">${this.escapeXml(node.content)}</text>`;
  }

  // ===========================================
  // Input Renderers
  // ===========================================

  private renderInput(node: InputNode): string {
    const width = 280;
    const height = 40;
    const x = this.currentX;
    let y = this.currentY;

    let result = '';

    if (node.label) {
      result += `<text x="${x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
      y += 24;
    }

    const placeholder = node.placeholder || '';

    result += `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="4" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="12" y="${height / 2 + 5}" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(placeholder)}</text>
    </g>`;

    this.currentY = y + height + 12;

    return result;
  }

  private renderTextarea(node: TextareaNode): string {
    const width = 280;
    const height = 100;
    const x = this.currentX;
    let y = this.currentY;

    let result = '';

    if (node.label) {
      result += `<text x="${x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
      y += 24;
    }

    const placeholder = node.placeholder || '';

    result += `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="4" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="12" y="24" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(placeholder)}</text>
    </g>`;

    this.currentY = y + height + 12;

    return result;
  }

  private renderSelect(node: SelectNode): string {
    const width = 280;
    const height = 40;
    const x = this.currentX;
    let y = this.currentY;

    let result = '';

    if (node.label) {
      result += `<text x="${x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
      y += 24;
    }

    const placeholder = node.placeholder || 'Select...';

    result += `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="4" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="12" y="${height / 2 + 5}" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(placeholder)}</text>
      <path d="M${width - 24} ${height / 2 - 3} l6 6 l6 -6" fill="none" stroke="${this.theme.colors.muted}" stroke-width="1.5"/>
    </g>`;

    this.currentY = y + height + 12;

    return result;
  }

  private renderCheckbox(node: CheckboxNode): string {
    const x = this.currentX;
    const y = this.currentY;
    const size = 18;

    let result = `
    <g transform="translate(${x}, ${y})">
      <rect width="${size}" height="${size}" rx="3" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;

    if (node.checked) {
      result += `<path d="M4 9 L7 12 L14 5" fill="none" stroke="${this.theme.colors.foreground}" stroke-width="2"/>`;
    }

    if (node.label) {
      result += `<text x="${size + 8}" y="${size - 3}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
    }

    result += '</g>';

    this.currentY += size + 12;

    return result;
  }

  private renderRadio(node: RadioNode): string {
    const x = this.currentX;
    const y = this.currentY;
    const size = 18;
    const radius = size / 2;

    let result = `
    <g transform="translate(${x}, ${y})">
      <circle cx="${radius}" cy="${radius}" r="${radius - 1}" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;

    if (node.checked) {
      result += `<circle cx="${radius}" cy="${radius}" r="${radius - 5}" fill="${this.theme.colors.foreground}"/>`;
    }

    if (node.label) {
      result += `<text x="${size + 8}" y="${size - 3}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
    }

    result += '</g>';

    this.currentY += size + 12;

    return result;
  }

  private renderSwitch(node: SwitchNode): string {
    const x = this.currentX;
    const y = this.currentY;
    const width = 44;
    const height = 24;
    const radius = height / 2;

    const isOn = node.checked;
    const bgColor = isOn ? this.theme.colors.primary : this.theme.colors.border;
    const knobX = isOn ? width - radius : radius;

    let result = `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="${radius}" fill="${bgColor}"/>
      <circle cx="${knobX}" cy="${radius}" r="${radius - 3}" fill="white"/>`;

    if (node.label) {
      result += `<text x="${width + 8}" y="${height - 6}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
    }

    result += '</g>';

    this.currentY += height + 12;

    return result;
  }

  // ===========================================
  // Button Renderer
  // ===========================================

  private renderButton(node: ButtonNode): string {
    const content = node.content;
    const hasIcon = !!node.icon;
    const isIconOnly = hasIcon && !content.trim();

    // Calculate button dimensions
    const iconSize = 16;
    const padding = isIconOnly ? 8 : 16;
    let width: number;

    if (isIconOnly) {
      width = iconSize + padding * 2;
    } else if (hasIcon) {
      width = Math.max(80, content.length * 10 + iconSize + 40);
    } else {
      width = Math.max(80, content.length * 10 + 32);
    }

    const height = 36;
    const x = this.currentX;
    const y = this.currentY;

    // Determine button variant from boolean flags
    let fill = this.theme.colors.primary;
    let textFill = '#ffffff';
    let isOutline = false;

    if (node.secondary) {
      fill = this.theme.colors.secondary;
    } else if (node.outline) {
      fill = 'white';
      textFill = this.theme.colors.foreground;
      isOutline = true;
    } else if (node.ghost) {
      fill = 'transparent';
      textFill = this.theme.colors.foreground;
    }

    this.currentY += height + 8;

    const strokeAttr = isOutline ? `stroke="${this.theme.colors.border}" stroke-width="1"` : '';

    // Render icon if present
    let iconSvg = '';
    if (hasIcon) {
      const iconData = getIconData(node.icon!);
      if (iconData) {
        const iconX = isIconOnly ? (width - iconSize) / 2 : padding;
        const iconY = (height - iconSize) / 2;
        iconSvg = this.renderIconPaths(iconData, iconX, iconY, iconSize, textFill);
      }
    }

    // Calculate text position
    const textX = hasIcon && !isIconOnly ? padding + iconSize + 8 + (width - padding - iconSize - 8 - padding) / 2 : width / 2;
    const textContent = isIconOnly ? '' : `<text x="${textX}" y="${height / 2 + 5}" font-size="14" fill="${textFill}" text-anchor="middle">${this.escapeXml(content)}</text>`;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="4" fill="${fill}" ${strokeAttr}/>
      ${iconSvg}
      ${textContent}
    </g>`;
  }

  /**
   * Render icon paths for SVG
   */
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

  // ===========================================
  // Display Renderers
  // ===========================================

  private renderImage(node: ImageNode): string {
    const width = node.w && typeof node.w === 'number' ? node.w : 200;
    const height = node.h && typeof node.h === 'number' ? node.h : 150;
    const x = this.currentX;
    const y = this.currentY;

    this.currentY += height + 12;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" fill="${this.theme.colors.muted}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="${width / 2}" y="${height / 2 + 5}" font-size="14" fill="${this.theme.colors.foreground}" text-anchor="middle">${this.escapeXml(node.alt || 'Image')}</text>
    </g>`;
  }

  private renderPlaceholder(node: PlaceholderNode): string {
    const width = node.w && typeof node.w === 'number' ? node.w : 200;
    const height = node.h && typeof node.h === 'number' ? node.h : 100;
    const x = this.currentX;
    const y = this.currentY;

    this.currentY += height + 12;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" fill="${this.theme.colors.muted}" stroke="${this.theme.colors.border}" stroke-width="1" stroke-dasharray="4,4"/>
      <text x="${width / 2}" y="${height / 2 + 5}" font-size="14" fill="${this.theme.colors.foreground}" text-anchor="middle">${this.escapeXml(node.label || 'Placeholder')}</text>
    </g>`;
  }

  private renderAvatar(node: AvatarNode): string {
    const sizes: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };
    const size = sizes[node.size || 'md'] || 40;
    const radius = size / 2;
    const x = this.currentX;
    const y = this.currentY;

    const initial = node.name ? node.name.charAt(0).toUpperCase() : '?';

    this.currentY += size + 12;

    return `
    <g transform="translate(${x}, ${y})">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${this.theme.colors.muted}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="${radius}" y="${radius + 5}" font-size="${size / 2.5}" fill="${this.theme.colors.foreground}" text-anchor="middle">${initial}</text>
    </g>`;
  }

  private renderBadge(node: BadgeNode): string {
    const content = node.content;
    const width = Math.max(24, content.length * 8 + 16);
    const height = 22;
    const x = this.currentX;
    const y = this.currentY;

    const fill = this.theme.colors.muted;
    const textFill = this.theme.colors.foreground;

    this.currentY += height + 8;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="11" fill="${fill}" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="${width / 2}" y="${height / 2 + 4}" font-size="12" fill="${textFill}" text-anchor="middle">${this.escapeXml(content)}</text>
    </g>`;
  }

  // ===========================================
  // Data Renderers
  // ===========================================

  private renderTable(node: TableNode): string {
    const columns = node.columns || [];
    const rows = node.rows || [];
    const rowCount = rows.length || 3;
    const colWidth = 120;
    const rowHeight = 40;
    const x = this.currentX;
    const y = this.currentY;

    let svg = `<g transform="translate(${x}, ${y})">`;

    // Header
    svg += `<rect width="${columns.length * colWidth}" height="${rowHeight}" fill="${this.theme.colors.muted}"/>`;
    columns.forEach((col, i) => {
      svg += `<text x="${i * colWidth + 12}" y="${rowHeight / 2 + 5}" font-size="14" font-weight="600">${this.escapeXml(col)}</text>`;
    });

    // Rows - if we have actual row data, use it; otherwise show placeholders
    const displayRowCount = rows.length > 0 ? rows.length : Math.max(rowCount, 3);
    for (let rowIdx = 0; rowIdx < displayRowCount; rowIdx++) {
      const rowY = (rowIdx + 1) * rowHeight;
      svg += `<rect y="${rowY}" width="${columns.length * colWidth}" height="${rowHeight}" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
      columns.forEach((_, colIdx) => {
        // If we have row data, try to render it
        const cellContent = rows[rowIdx] && rows[rowIdx][colIdx]
          ? String(typeof rows[rowIdx][colIdx] === 'object' ? '...' : rows[rowIdx][colIdx])
          : '—';
        svg += `<text x="${colIdx * colWidth + 12}" y="${rowY + rowHeight / 2 + 5}" font-size="14" fill="${this.theme.colors.muted}">${this.escapeXml(cellContent)}</text>`;
      });
    }

    svg += '</g>';

    this.currentY += (displayRowCount + 1) * rowHeight + 16;

    return svg;
  }

  private renderList(node: ListNode): string {
    const x = this.currentX;
    let y = this.currentY;
    const items = node.items || [];
    const ordered = node.ordered || false;

    let svg = `<g transform="translate(${x}, ${y})">`;

    items.forEach((item, idx) => {
      const marker = ordered ? `${idx + 1}.` : '•';
      const content = typeof item === 'string' ? item : item.content;
      svg += `<text x="0" y="${idx * 24 + 16}" font-size="14" fill="${this.theme.colors.foreground}">${marker} ${this.escapeXml(content)}</text>`;
    });

    svg += '</g>';

    this.currentY += items.length * 24 + 12;

    return svg;
  }

  // ===========================================
  // Feedback Renderers
  // ===========================================

  private renderAlert(node: AlertNode): string {
    const width = Math.min(400, this.contentWidth);
    const height = 48;
    const x = this.currentX;
    const y = this.currentY;

    this.currentY += height + 12;

    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="4" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>
      <text x="16" y="${height / 2 + 5}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.content)}</text>
    </g>`;
  }

  private renderProgress(node: ProgressNode): string {
    const width = 200;
    const height = 8;
    const x = this.currentX;
    let y = this.currentY;

    let result = '';

    if (node.label) {
      result += `<text x="${x}" y="${y + 14}" font-size="14" fill="${this.theme.colors.foreground}">${this.escapeXml(node.label)}</text>`;
      y += 24;
    }

    const value = node.value || 0;
    const max = node.max || 100;
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    result += `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="${height / 2}" fill="${this.theme.colors.muted}"/>
      <rect width="${(width * percent) / 100}" height="${height}" rx="${height / 2}" fill="${this.theme.colors.primary}"/>
    </g>`;

    this.currentY = y + height + 12;

    return result;
  }

  private renderSpinner(node: SpinnerNode): string {
    const sizes: Record<string, number> = { xs: 16, sm: 20, md: 24, lg: 32, xl: 40 };
    const size = sizes[node.size || 'md'] || 24;
    const x = this.currentX + size / 2;
    const y = this.currentY + size / 2;
    const radius = size / 2 - 2;

    this.currentY += size + 12;

    return `
    <g transform="translate(${x}, ${y})">
      <circle r="${radius}" fill="none" stroke="${this.theme.colors.muted}" stroke-width="2"/>
      <path d="M0,-${radius} A${radius},${radius} 0 0,1 ${radius},0" fill="none" stroke="${this.theme.colors.primary}" stroke-width="2" stroke-linecap="round"/>
    </g>`;
  }

  // ===========================================
  // Navigation Renderers
  // ===========================================

  private renderNav(node: NavNode): string {
    const items = node.items || [];
    const x = this.currentX;
    const y = this.currentY;
    const vertical = node.vertical || false;

    let svg = `<g transform="translate(${x}, ${y})">`;

    if (vertical) {
      items.forEach((item, idx) => {
        const label = typeof item === 'string' ? item : item.label;
        const isActive = typeof item === 'object' && item.active;
        const fill = isActive ? this.theme.colors.foreground : this.theme.colors.muted;
        svg += `<text x="0" y="${idx * 32 + 16}" font-size="14" fill="${fill}">${this.escapeXml(label)}</text>`;
      });
      this.currentY += items.length * 32 + 12;
    } else {
      let offsetX = 0;
      items.forEach((item) => {
        const label = typeof item === 'string' ? item : item.label;
        const isActive = typeof item === 'object' && item.active;
        const fill = isActive ? this.theme.colors.foreground : this.theme.colors.muted;
        svg += `<text x="${offsetX}" y="16" font-size="14" fill="${fill}">${this.escapeXml(label)}</text>`;
        offsetX += label.length * 8 + 24;
      });
      this.currentY += 32;
    }

    svg += '</g>';

    return svg;
  }

  private renderTabs(node: TabsNode): string {
    const items = node.items || [];
    const x = this.currentX;
    const y = this.currentY;
    const tabHeight = 40;

    let svg = `<g transform="translate(${x}, ${y})">`;

    let offsetX = 0;
    items.forEach((item) => {
      const label = typeof item === 'string' ? item : item;
      const tabWidth = label.length * 10 + 24;
      svg += `<rect x="${offsetX}" width="${tabWidth}" height="${tabHeight}" fill="white" stroke="${this.theme.colors.border}" stroke-width="1"/>`;
      svg += `<text x="${offsetX + tabWidth / 2}" y="${tabHeight / 2 + 5}" font-size="14" text-anchor="middle">${this.escapeXml(label)}</text>`;
      offsetX += tabWidth;
    });

    svg += '</g>';

    this.currentY += tabHeight + 12;

    return svg;
  }

  private renderBreadcrumb(node: BreadcrumbNode): string {
    const items = node.items || [];
    const separator = '/';
    const x = this.currentX;
    const y = this.currentY;

    let svg = `<g transform="translate(${x}, ${y})">`;

    let offsetX = 0;
    items.forEach((item, idx) => {
      const label = typeof item === 'string' ? item : item.label;
      const isLast = idx === items.length - 1;
      const fill = isLast ? this.theme.colors.foreground : this.theme.colors.muted;

      svg += `<text x="${offsetX}" y="16" font-size="14" fill="${fill}">${this.escapeXml(label)}</text>`;
      offsetX += label.length * 8 + 8;

      if (!isLast) {
        svg += `<text x="${offsetX}" y="16" font-size="14" fill="${this.theme.colors.muted}">${separator}</text>`;
        offsetX += 16;
      }
    });

    svg += '</g>';

    this.currentY += 28;

    return svg;
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  private getFontSize(size: string): number {
    const sizes: Record<string, number> = {
      xs: 12,
      sm: 14,
      base: 16,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    };
    return sizes[size] || 16;
  }

  private resolveFontSize(size: TextNode['size']): number {
    if (!size) return 16; // default 'base'
    if (typeof size === 'string') {
      return this.getFontSize(size);
    }
    // ValueWithUnit object
    if (typeof size === 'object' && 'value' in size) {
      // Convert to px if needed
      if (size.unit === 'px') return size.value;
      if (size.unit === 'rem') return size.value * 16;
      if (size.unit === 'em') return size.value * 16;
      return size.value;
    }
    return 16;
  }

  private getTitleFontSize(level: number): number {
    const sizes: Record<number, number> = {
      1: 32,
      2: 28,
      3: 24,
      4: 20,
      5: 18,
      6: 16,
    };
    return sizes[level] || 24;
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

/**
 * Create a new SVG renderer instance
 */
export function createSvgRenderer(options?: SvgRenderOptions): SvgRenderer {
  return new SvgRenderer(options);
}

/**
 * Render a wireframe document to SVG
 */
export function renderToSvg(doc: WireframeDocument, options?: SvgRenderOptions): SvgRenderResult {
  const renderer = new SvgRenderer(options);
  return renderer.render(doc);
}
