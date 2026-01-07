import { a1 as WireframeDocument, A as AnyNode, P as PageNode } from './types-DtovIYS6.cjs';

/**
 * Renderer type definitions for wireweave
 *
 * Provides types for rendering options, themes, and context
 */
interface RenderOptions {
    /** Theme variant */
    theme?: 'light' | 'dark';
    /** Scale factor for sizing */
    scale?: number;
    /** Include CSS styles in output */
    includeStyles?: boolean;
    /** Minify output (no indentation/newlines) */
    minify?: boolean;
    /** CSS class prefix for scoping */
    classPrefix?: string;
}
interface RenderResult {
    /** Rendered HTML content */
    html: string;
    /** Generated CSS styles */
    css: string;
}
interface SvgRenderOptions {
    /** Width of the SVG viewport */
    width?: number;
    /** Height of the SVG viewport */
    height?: number;
    /** Padding around content */
    padding?: number;
    /** Scale factor */
    scale?: number;
    /** Background color */
    background?: string;
    /** Font family */
    fontFamily?: string;
}
interface SvgRenderResult {
    /** Rendered SVG content */
    svg: string;
    /** Actual width */
    width: number;
    /** Actual height */
    height: number;
}
interface RenderContext {
    /** Resolved render options */
    options: Required<RenderOptions>;
    /** Theme configuration */
    theme: ThemeConfig;
    /** Current nesting depth for indentation */
    depth: number;
}
interface ThemeColors {
    /** Primary action color */
    primary: string;
    /** Secondary/muted action color */
    secondary: string;
    /** Success state color */
    success: string;
    /** Warning state color */
    warning: string;
    /** Danger/error state color */
    danger: string;
    /** Muted/disabled color */
    muted: string;
    /** Background color */
    background: string;
    /** Foreground/text color */
    foreground: string;
    /** Border color */
    border: string;
}
interface ThemeConfig {
    /** Color palette */
    colors: ThemeColors;
    /** Spacing scale (number -> px value) */
    spacing: Record<number, string>;
    /** Border radius */
    radius: string;
    /** Font family */
    fontFamily: string;
    /** Shadow styles */
    shadows: Record<string, string>;
}
/**
 * Default wireframe theme using black/white/gray palette
 * Follows wireweave design principles for sketch-like appearance
 */
declare const defaultTheme: ThemeConfig;
/**
 * Dark theme configuration
 * Inverts colors for dark mode display
 */
declare const darkTheme: ThemeConfig;
/**
 * Get theme configuration by name
 */
declare function getTheme(name: 'light' | 'dark'): ThemeConfig;

/**
 * Base HTML Renderer for wireweave
 *
 * Provides abstract base class for HTML rendering with theme support
 */

/**
 * Abstract base renderer class
 *
 * Provides core infrastructure for HTML rendering:
 * - Theme management
 * - Indentation and formatting
 * - Depth tracking for nested elements
 */
declare abstract class BaseRenderer {
    protected context: RenderContext;
    constructor(options?: RenderOptions);
    /**
     * Build theme configuration based on options
     */
    protected buildTheme(options: Required<RenderOptions>): ThemeConfig;
    /**
     * Render a wireframe document to HTML and CSS
     */
    render(document: WireframeDocument): RenderResult;
    /**
     * Render a complete wireframe document
     */
    protected renderDocument(document: WireframeDocument): string;
    /**
     * Render a page node (to be implemented by subclasses)
     */
    protected abstract renderPage(node: AnyNode): string;
    /**
     * Render any AST node (to be implemented by subclasses)
     */
    protected abstract renderNode(node: AnyNode): string;
    /**
     * Get the CSS class prefix
     */
    protected get prefix(): string;
    /**
     * Add indentation based on current depth
     */
    protected indent(content: string): string;
    /**
     * Execute a function with increased depth
     */
    protected withDepth<T>(fn: () => T): T;
    /**
     * Escape HTML special characters
     */
    protected escapeHtml(text: string): string;
    /**
     * Build a CSS class string from an array of class names
     */
    protected buildClassString(classes: (string | undefined | false)[]): string;
    /**
     * Build HTML attributes string
     */
    protected buildAttrsString(attrs: Record<string, string | undefined | boolean>): string;
    /**
     * Simple HTML minification
     */
    private minifyHtml;
    /**
     * Simple CSS minification
     */
    private minifyCss;
}

/**
 * HTML Renderer for wireweave
 *
 * Converts AST nodes to HTML output
 */

/**
 * HTML Renderer class
 *
 * Renders wireframe AST to semantic HTML with utility classes
 */
declare class HtmlRenderer extends BaseRenderer {
    constructor(options?: RenderOptions);
    /**
     * Render a page node
     */
    protected renderPage(node: PageNode): string;
    /**
     * Render any AST node
     */
    protected renderNode(node: AnyNode): string;
    /**
     * Render children nodes
     */
    protected renderChildren(children: AnyNode[]): string;
    /**
     * Get common CSS classes from props
     * Uses Omit to exclude 'align' since TextNode/TitleNode have incompatible align types
     *
     * All numeric values are handled by buildCommonStyles as inline px values.
     * CSS classes are only used for keyword values (full, auto, screen, fit, etc.)
     */
    private getCommonClasses;
    private renderHeader;
    private renderMain;
    private renderFooter;
    private renderSidebar;
    private renderSection;
    private renderRow;
    private renderCol;
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
    private buildCommonStyles;
    /**
     * Build inline styles for Col node (extends common styles with order)
     */
    private buildColStyles;
    private renderCard;
    private renderModal;
    private renderDrawer;
    private renderAccordion;
    private renderText;
    private renderTitle;
    private renderLink;
    private renderInput;
    private renderTextarea;
    private renderSelect;
    private renderCheckbox;
    private renderRadio;
    private renderSwitch;
    private renderSlider;
    private renderButton;
    private renderImage;
    private renderPlaceholder;
    private renderAvatar;
    private renderBadge;
    private renderIcon;
    private renderTable;
    private renderList;
    private renderAlert;
    private renderToast;
    private renderProgress;
    private renderSpinner;
    private renderTooltip;
    private renderPopover;
    private renderDropdown;
    private renderNav;
    private renderTabs;
    private renderBreadcrumb;
    private renderDivider;
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
    private renderSemanticMarkers;
    /**
     * Render a single semantic marker to HTML (without content)
     */
    private renderSemanticMarker;
    /**
     * Render a semantic marker with text content (for badge)
     */
    private renderSemanticMarkerWithContent;
    /**
     * Process table cell content with semantic markers and newlines
     *
     * Special handling for avatar + text layout:
     * When content starts with [avatar], wraps in flex container
     * so avatar and text align horizontally, with text stacking vertically
     */
    private renderTableCellContent;
}
/**
 * Create a new HTML renderer instance
 */
declare function createHtmlRenderer(options?: RenderOptions): HtmlRenderer;

/**
 * SVG Renderer for wireweave
 *
 * Renders wireframe AST to SVG image format
 */

/**
 * SVG Renderer class
 *
 * Renders wireframe AST nodes to SVG elements
 */
declare class SvgRenderer {
    private options;
    private theme;
    private currentX;
    private currentY;
    private contentWidth;
    constructor(options?: SvgRenderOptions);
    /**
     * Render a wireframe document to SVG
     */
    render(doc: WireframeDocument): SvgRenderResult;
    /**
     * Generate SVG defs (styles, patterns, etc.)
     */
    private generateDefs;
    /**
     * Render a page node
     */
    private renderPage;
    /**
     * Render page title
     */
    private renderPageTitle;
    /**
     * Render any AST node
     */
    private renderNode;
    private renderRow;
    private renderCol;
    private renderHeader;
    private renderMain;
    private renderFooter;
    private renderSidebar;
    private renderCard;
    private renderModal;
    private renderText;
    private renderTitle;
    private renderLink;
    private renderInput;
    private renderTextarea;
    private renderSelect;
    private renderCheckbox;
    private renderRadio;
    private renderSwitch;
    private renderButton;
    /**
     * Render icon paths for SVG
     */
    private renderIconPaths;
    private renderImage;
    private renderPlaceholder;
    private renderAvatar;
    private renderBadge;
    private renderTable;
    private renderList;
    private renderAlert;
    private renderProgress;
    private renderSpinner;
    private renderNav;
    private renderTabs;
    private renderBreadcrumb;
    private getFontSize;
    private resolveFontSize;
    private getTitleFontSize;
    private escapeXml;
}
/**
 * Create a new SVG renderer instance
 */
declare function createSvgRenderer(options?: SvgRenderOptions): SvgRenderer;

/**
 * CSS Style Generator for wireweave
 *
 * Generates CSS classes for grid, spacing, and flex utilities
 */

/**
 * Generate all CSS styles for wireframe rendering
 *
 * @param theme - Theme configuration
 * @param prefix - CSS class prefix (default: 'wf')
 * @returns Complete CSS string
 */
declare function generateStyles(theme: ThemeConfig, prefix?: string): string;

/**
 * Component-specific CSS styles for wireweave
 *
 * Detailed styles for all UI components with:
 * - Wireframe aesthetic (black/white/gray)
 * - Accessibility considerations
 * - Responsive design
 */

/**
 * Generate all component-specific CSS styles
 */
declare function generateComponentStyles(_theme: ThemeConfig, prefix?: string): string;

/**
 * Lucide Icons Data
 *
 * Auto-generated from lucide package.
 * Do not edit manually.
 *
 * Total icons: 1666
 *
 * @license ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023
 * as part of Feather (MIT). All other copyright (c) for Lucide are held
 * by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * @see https://lucide.dev
 */
type IconElement = [string, Record<string, string>];
type IconData = IconElement[];
declare const lucideIcons: Record<string, IconData>;
/**
 * Get icon data by name
 */
declare function getIconData(name: string): IconData | undefined;
/**
 * Render icon data to SVG string
 */
declare function renderIconSvg(data: IconData, _size?: number, // size is now controlled by CSS, this param is kept for API compatibility
strokeWidth?: number, className?: string, styleAttr?: string): string;

/**
 * Renderer module for wireweave
 *
 * Provides render functions to convert AST to HTML/CSS and SVG
 */

/**
 * Render AST to HTML and CSS
 *
 * @param document - Parsed wireframe document
 * @param options - Render options
 * @returns Object containing HTML and CSS strings
 */
declare function render(document: WireframeDocument, options?: RenderOptions): RenderResult;
/**
 * Render AST to standalone HTML with embedded CSS
 *
 * @param document - Parsed wireframe document
 * @param options - Render options
 * @returns Complete HTML document string
 */
declare function renderToHtml(document: WireframeDocument, options?: RenderOptions): string;
/**
 * Render AST to SVG using foreignObject with HTML+CSS
 *
 * This approach embeds HTML+CSS inside SVG using foreignObject,
 * which allows CSS flexbox/grid layouts to work properly.
 *
 * @param document - Parsed wireframe document
 * @param options - SVG render options
 * @returns Object containing SVG string and dimensions
 */
declare function renderToSvg(document: WireframeDocument, options?: SvgRenderOptions): SvgRenderResult;
/**
 * Render AST to pure SVG (without foreignObject)
 *
 * This uses the original SVG renderer with manual layout calculations.
 * Use this when foreignObject is not supported.
 *
 * @param document - Parsed wireframe document
 * @param options - SVG render options
 * @returns Object containing SVG string and dimensions
 */
declare function renderToPureSvg(document: WireframeDocument, options?: SvgRenderOptions): SvgRenderResult;

export { HtmlRenderer, type IconData, type IconElement, type RenderContext, type RenderOptions, type RenderResult, type SvgRenderOptions, type SvgRenderResult, SvgRenderer, type ThemeColors, type ThemeConfig, createHtmlRenderer, createSvgRenderer, darkTheme, defaultTheme, generateComponentStyles, generateStyles, getIconData, getTheme, lucideIcons, render, renderIconSvg, renderToHtml, renderToPureSvg, renderToSvg };
