import { A as AnyNode, C as ContainerNode, L as LeafNode, a as LayoutNode, P as PageNode, H as HeaderNode, M as MainNode, F as FooterNode, S as SidebarNode, b as SectionNode, G as GridNode, R as RowNode, c as ColNode, d as ContainerComponentNode, e as CardNode, f as ModalNode, D as DrawerNode, g as AccordionNode, T as TextContentNode, h as TextNode, i as TitleNode, j as LinkNode, I as InputComponentNode, k as InputNode, l as TextareaNode, m as SelectNode, n as CheckboxNode, o as RadioNode, p as SwitchNode, q as SliderNode, B as ButtonNode, r as DisplayNode, s as ImageNode, t as PlaceholderNode, u as AvatarNode, v as BadgeNode, w as IconNode, x as DataNode, y as TableNode, z as ListNode, E as FeedbackNode, J as AlertNode, K as ToastNode, N as ProgressNode, O as SpinnerNode, Q as OverlayNode, U as TooltipNode, V as PopoverNode, W as DropdownNode, X as NavigationNode, Y as NavNode, Z as TabsNode, _ as BreadcrumbNode, $ as DividerComponentNode, a0 as NodeType, a1 as WireframeDocument } from './types-DtovIYS6.cjs';
export { ax as AlertVariant, ac as AlignValue, as as AvatarSize, au as BadgeSize, at as BadgeVariant, a4 as BaseNode, aF as BreadcrumbItem, ar as ButtonSize, aq as ButtonVariant, ag as CommonProps, ad as DirectionValue, aC as DividerNode, ai as DrawerPosition, aB as DropdownItemNode, ae as FlexProps, af as GridProps, a9 as HeightValue, av as IconSize, ao as InputType, ab as JustifyValue, aw as ListItemNode, aD as NavItem, a2 as Position, ap as SelectOption, ah as ShadowValue, aa as SizeProps, a3 as SourceLocation, a7 as SpacingProps, a6 as SpacingValue, az as SpinnerSize, aE as TabNode, am as TextAlign, ak as TextSize, aj as TextSizeToken, al as TextWeight, an as TitleLevel, ay as ToastPosition, aA as TooltipPosition, a5 as ValueWithUnit, a8 as WidthValue } from './types-DtovIYS6.cjs';
export { ExpectedToken, ParseError, ParseErrorInfo, ParseOptions, ParseResult, getErrors, isValid, parse, tryParse } from './parser.cjs';
export { HtmlRenderer, IconData, IconElement, RenderContext, RenderOptions, RenderResult, SvgRenderOptions, SvgRenderResult, SvgRenderer, ThemeColors, ThemeConfig, createHtmlRenderer, createSvgRenderer, darkTheme, defaultTheme, generateComponentStyles, generateStyles, getIconData, getTheme, lucideIcons, render, renderIconSvg, renderToHtml, renderToPureSvg, renderToSvg } from './renderer.cjs';

/**
 * Type guards for wireweave AST
 *
 * Provides runtime type checking for AST nodes
 */

declare function isContainerNode(node: AnyNode): node is ContainerNode;
declare function hasChildren(node: AnyNode): node is AnyNode & {
    children: AnyNode[];
};
declare function isLeafNode(node: AnyNode): node is LeafNode;
declare function isLayoutNode(node: AnyNode): node is LayoutNode;
declare function isPageNode(node: AnyNode): node is PageNode;
declare function isHeaderNode(node: AnyNode): node is HeaderNode;
declare function isMainNode(node: AnyNode): node is MainNode;
declare function isFooterNode(node: AnyNode): node is FooterNode;
declare function isSidebarNode(node: AnyNode): node is SidebarNode;
declare function isSectionNode(node: AnyNode): node is SectionNode;
declare function isGridNode(node: AnyNode): node is GridNode;
declare function isRowNode(node: AnyNode): node is RowNode;
declare function isColNode(node: AnyNode): node is ColNode;
declare function isContainerComponentNode(node: AnyNode): node is ContainerComponentNode;
declare function isCardNode(node: AnyNode): node is CardNode;
declare function isModalNode(node: AnyNode): node is ModalNode;
declare function isDrawerNode(node: AnyNode): node is DrawerNode;
declare function isAccordionNode(node: AnyNode): node is AccordionNode;
declare function isTextContentNode(node: AnyNode): node is TextContentNode;
declare function isTextNode(node: AnyNode): node is TextNode;
declare function isTitleNode(node: AnyNode): node is TitleNode;
declare function isLinkNode(node: AnyNode): node is LinkNode;
declare function isInputComponentNode(node: AnyNode): node is InputComponentNode;
declare function isInputNode(node: AnyNode): node is InputNode;
declare function isTextareaNode(node: AnyNode): node is TextareaNode;
declare function isSelectNode(node: AnyNode): node is SelectNode;
declare function isCheckboxNode(node: AnyNode): node is CheckboxNode;
declare function isRadioNode(node: AnyNode): node is RadioNode;
declare function isSwitchNode(node: AnyNode): node is SwitchNode;
declare function isSliderNode(node: AnyNode): node is SliderNode;
declare function isButtonNode(node: AnyNode): node is ButtonNode;
declare function isDisplayNode(node: AnyNode): node is DisplayNode;
declare function isImageNode(node: AnyNode): node is ImageNode;
declare function isPlaceholderNode(node: AnyNode): node is PlaceholderNode;
declare function isAvatarNode(node: AnyNode): node is AvatarNode;
declare function isBadgeNode(node: AnyNode): node is BadgeNode;
declare function isIconNode(node: AnyNode): node is IconNode;
declare function isDataNode(node: AnyNode): node is DataNode;
declare function isTableNode(node: AnyNode): node is TableNode;
declare function isListNode(node: AnyNode): node is ListNode;
declare function isFeedbackNode(node: AnyNode): node is FeedbackNode;
declare function isAlertNode(node: AnyNode): node is AlertNode;
declare function isToastNode(node: AnyNode): node is ToastNode;
declare function isProgressNode(node: AnyNode): node is ProgressNode;
declare function isSpinnerNode(node: AnyNode): node is SpinnerNode;
declare function isOverlayNode(node: AnyNode): node is OverlayNode;
declare function isTooltipNode(node: AnyNode): node is TooltipNode;
declare function isPopoverNode(node: AnyNode): node is PopoverNode;
declare function isDropdownNode(node: AnyNode): node is DropdownNode;
declare function isNavigationNode(node: AnyNode): node is NavigationNode;
declare function isNavNode(node: AnyNode): node is NavNode;
declare function isTabsNode(node: AnyNode): node is TabsNode;
declare function isBreadcrumbNode(node: AnyNode): node is BreadcrumbNode;
declare function isDividerNode(node: AnyNode): node is DividerComponentNode;
declare function isNodeType<T extends NodeType>(node: AnyNode, type: T): node is Extract<AnyNode, {
    type: T;
}>;

/**
 * AST utility functions for wireweave
 *
 * Provides traversal and search utilities for AST nodes
 */

/**
 * Callback function for AST traversal
 */
type WalkCallback = (node: AnyNode, parent?: AnyNode, depth?: number) => void | boolean;
/**
 * Predicate function for finding nodes
 */
type NodePredicate = (node: AnyNode) => boolean;
/**
 * Walk through all nodes in the AST
 *
 * @param node - The starting node
 * @param callback - Function called for each node. Return false to stop traversal.
 * @param parent - Parent node (used internally)
 * @param depth - Current depth (used internally)
 */
declare function walk(node: AnyNode, callback: WalkCallback, parent?: AnyNode, depth?: number): void;
/**
 * Walk through a document's AST
 *
 * @param document - The wireframe document
 * @param callback - Function called for each node
 */
declare function walkDocument(document: WireframeDocument, callback: WalkCallback): void;
/**
 * Find the first node matching a predicate
 *
 * @param node - The starting node
 * @param predicate - Function to test each node
 * @returns The first matching node, or undefined
 */
declare function find(node: AnyNode, predicate: NodePredicate): AnyNode | undefined;
/**
 * Find all nodes matching a predicate
 *
 * @param node - The starting node
 * @param predicate - Function to test each node
 * @returns Array of matching nodes
 */
declare function findAll(node: AnyNode, predicate: NodePredicate): AnyNode[];
/**
 * Find all nodes of a specific type
 *
 * @param node - The starting node
 * @param type - The node type to find
 * @returns Array of matching nodes
 */
declare function findByType<T extends AnyNode>(node: AnyNode, type: NodeType): T[];
/**
 * Count all nodes in the AST
 *
 * @param node - The starting node
 * @returns Total number of nodes
 */
declare function countNodes(node: AnyNode): number;
/**
 * Get the maximum depth of the AST
 *
 * @param node - The starting node
 * @returns Maximum depth
 */
declare function getMaxDepth(node: AnyNode): number;
/**
 * Get ancestors of a node (path from root to node)
 *
 * @param root - The root node
 * @param target - The target node to find
 * @returns Array of ancestor nodes, or empty array if not found
 */
declare function getAncestors(root: AnyNode, target: AnyNode): AnyNode[];
/**
 * Map over all nodes in the AST
 *
 * @param node - The starting node
 * @param mapper - Function to transform each node
 * @returns New AST with transformed nodes
 */
declare function mapNodes<T>(node: AnyNode, mapper: (node: AnyNode) => T): T[];
/**
 * Clone an AST node (deep clone)
 *
 * @param node - The node to clone
 * @returns A deep clone of the node
 */
declare function cloneNode<T extends AnyNode>(node: T): T;
/**
 * Check if a node contains a specific child (at any depth)
 *
 * @param node - The parent node
 * @param target - The target node to find
 * @returns True if the target is found
 */
declare function contains(node: AnyNode, target: AnyNode): boolean;
/**
 * Get all node types present in the AST
 *
 * @param node - The starting node
 * @returns Set of node types
 */
declare function getNodeTypes(node: AnyNode): Set<NodeType>;

/**
 * Device viewport presets for wireweave
 *
 * Standard device dimensions for wireframe design
 */
interface ViewportSize {
    width: number;
    height: number;
    label: string;
    category: 'desktop' | 'tablet' | 'mobile';
}
/**
 * Device preset definitions
 */
declare const DEVICE_PRESETS: Record<string, ViewportSize>;
/**
 * Default viewport size (desktop)
 */
declare const DEFAULT_VIEWPORT: ViewportSize;
/**
 * Parse viewport value (e.g., "1440x900", "1440", or number)
 */
declare function parseViewportString(value: string | number): {
    width: number;
    height?: number;
} | null;
/**
 * Get viewport size from device preset or explicit size
 */
declare function resolveViewport(viewport?: string | number, device?: string): ViewportSize;
/**
 * Get all available device presets
 */
declare function getDevicePresets(): Record<string, ViewportSize>;
/**
 * Check if a device preset exists
 */
declare function isValidDevicePreset(device: string): boolean;
/**
 * Calculate scale factor to fit viewport in container
 *
 * @param viewport - The viewport dimensions
 * @param containerWidth - Available container width
 * @param containerHeight - Available container height (optional)
 * @param maxScale - Maximum scale factor (default: 1)
 * @returns Scale factor (0-1 range, or up to maxScale)
 */
declare function calculateViewportScale(viewport: ViewportSize, containerWidth: number, containerHeight?: number, maxScale?: number): number;
/**
 * Options for creating preview wrapper HTML
 */
interface PreviewWrapperOptions {
    /** CSS class prefix (default: 'wf') */
    prefix?: string;
    /** Dark mode background */
    darkMode?: boolean;
    /** Container width for auto-scaling */
    containerWidth?: number;
    /** Container height for auto-scaling */
    containerHeight?: number;
    /** Custom scale (overrides auto-calculated scale) */
    scale?: number;
}
/**
 * Wrap rendered HTML in a preview container with scaling
 *
 * @param html - The rendered wireframe HTML
 * @param viewport - The viewport size used for rendering
 * @param options - Preview wrapper options
 * @returns HTML string with preview wrapper
 */
declare function wrapInPreviewContainer(html: string, viewport: ViewportSize, options?: PreviewWrapperOptions): string;

export { AccordionNode, AlertNode, AnyNode, AvatarNode, BadgeNode, BreadcrumbNode, ButtonNode, CardNode, CheckboxNode, ColNode, ContainerComponentNode, ContainerNode, DEFAULT_VIEWPORT, DEVICE_PRESETS, DataNode, DisplayNode, DividerComponentNode, DrawerNode, DropdownNode, FeedbackNode, FooterNode, GridNode, HeaderNode, IconNode, ImageNode, InputComponentNode, InputNode, LayoutNode, LeafNode, LinkNode, ListNode, MainNode, ModalNode, NavNode, NavigationNode, type NodePredicate, NodeType, OverlayNode, PageNode, PlaceholderNode, PopoverNode, type PreviewWrapperOptions, ProgressNode, RadioNode, RowNode, SectionNode, SelectNode, SidebarNode, SliderNode, SpinnerNode, SwitchNode, TableNode, TabsNode, TextContentNode, TextNode, TextareaNode, TitleNode, ToastNode, TooltipNode, type ViewportSize, type WalkCallback, WireframeDocument, calculateViewportScale, cloneNode, contains, countNodes, find, findAll, findByType, getAncestors, getDevicePresets, getMaxDepth, getNodeTypes, hasChildren, isAccordionNode, isAlertNode, isAvatarNode, isBadgeNode, isBreadcrumbNode, isButtonNode, isCardNode, isCheckboxNode, isColNode, isContainerComponentNode, isContainerNode, isDataNode, isDisplayNode, isDividerNode, isDrawerNode, isDropdownNode, isFeedbackNode, isFooterNode, isGridNode, isHeaderNode, isIconNode, isImageNode, isInputComponentNode, isInputNode, isLayoutNode, isLeafNode, isLinkNode, isListNode, isMainNode, isModalNode, isNavNode, isNavigationNode, isNodeType, isOverlayNode, isPageNode, isPlaceholderNode, isPopoverNode, isProgressNode, isRadioNode, isRowNode, isSectionNode, isSelectNode, isSidebarNode, isSliderNode, isSpinnerNode, isSwitchNode, isTableNode, isTabsNode, isTextContentNode, isTextNode, isTextareaNode, isTitleNode, isToastNode, isTooltipNode, isValidDevicePreset, mapNodes, parseViewportString, resolveViewport, walk, walkDocument, wrapInPreviewContainer };
