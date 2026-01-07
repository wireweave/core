/**
 * Type guards for wireweave AST
 *
 * Provides runtime type checking for AST nodes
 */

import type {
  AnyNode,
  ContainerNode,
  LeafNode,
  LayoutNode,
  GridNode,
  ContainerComponentNode,
  TextContentNode,
  InputComponentNode,
  DisplayNode,
  DataNode,
  FeedbackNode,
  OverlayNode,
  NavigationNode,
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
  NodeType,
} from './types';

// ===========================================
// Container Type Guards
// ===========================================

const CONTAINER_TYPES: NodeType[] = [
  'Page',
  'Header',
  'Main',
  'Footer',
  'Sidebar',
  'Section',
  'Row',
  'Col',
  'Card',
  'Modal',
  'Drawer',
  'Accordion',
  'Tooltip',
  'Popover',
];

export function isContainerNode(node: AnyNode): node is ContainerNode {
  return CONTAINER_TYPES.includes(node.type as NodeType);
}

export function hasChildren(node: AnyNode): node is AnyNode & { children: AnyNode[] } {
  return 'children' in node && Array.isArray((node as { children?: unknown }).children);
}

export function isLeafNode(node: AnyNode): node is LeafNode {
  return !isContainerNode(node);
}

// ===========================================
// Layout Type Guards
// ===========================================

export function isLayoutNode(node: AnyNode): node is LayoutNode {
  return ['Page', 'Header', 'Main', 'Footer', 'Sidebar', 'Section'].includes(node.type);
}

export function isPageNode(node: AnyNode): node is PageNode {
  return node.type === 'Page';
}

export function isHeaderNode(node: AnyNode): node is HeaderNode {
  return node.type === 'Header';
}

export function isMainNode(node: AnyNode): node is MainNode {
  return node.type === 'Main';
}

export function isFooterNode(node: AnyNode): node is FooterNode {
  return node.type === 'Footer';
}

export function isSidebarNode(node: AnyNode): node is SidebarNode {
  return node.type === 'Sidebar';
}

export function isSectionNode(node: AnyNode): node is SectionNode {
  return node.type === 'Section';
}

// ===========================================
// Grid Type Guards
// ===========================================

export function isGridNode(node: AnyNode): node is GridNode {
  return ['Row', 'Col'].includes(node.type);
}

export function isRowNode(node: AnyNode): node is RowNode {
  return node.type === 'Row';
}

export function isColNode(node: AnyNode): node is ColNode {
  return node.type === 'Col';
}

// ===========================================
// Container Component Type Guards
// ===========================================

export function isContainerComponentNode(node: AnyNode): node is ContainerComponentNode {
  return ['Card', 'Modal', 'Drawer', 'Accordion'].includes(node.type);
}

export function isCardNode(node: AnyNode): node is CardNode {
  return node.type === 'Card';
}

export function isModalNode(node: AnyNode): node is ModalNode {
  return node.type === 'Modal';
}

export function isDrawerNode(node: AnyNode): node is DrawerNode {
  return node.type === 'Drawer';
}

export function isAccordionNode(node: AnyNode): node is AccordionNode {
  return node.type === 'Accordion';
}

// ===========================================
// Text Content Type Guards
// ===========================================

export function isTextContentNode(node: AnyNode): node is TextContentNode {
  return ['Text', 'Title', 'Link'].includes(node.type);
}

export function isTextNode(node: AnyNode): node is TextNode {
  return node.type === 'Text';
}

export function isTitleNode(node: AnyNode): node is TitleNode {
  return node.type === 'Title';
}

export function isLinkNode(node: AnyNode): node is LinkNode {
  return node.type === 'Link';
}

// ===========================================
// Input Component Type Guards
// ===========================================

export function isInputComponentNode(node: AnyNode): node is InputComponentNode {
  return ['Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider'].includes(
    node.type
  );
}

export function isInputNode(node: AnyNode): node is InputNode {
  return node.type === 'Input';
}

export function isTextareaNode(node: AnyNode): node is TextareaNode {
  return node.type === 'Textarea';
}

export function isSelectNode(node: AnyNode): node is SelectNode {
  return node.type === 'Select';
}

export function isCheckboxNode(node: AnyNode): node is CheckboxNode {
  return node.type === 'Checkbox';
}

export function isRadioNode(node: AnyNode): node is RadioNode {
  return node.type === 'Radio';
}

export function isSwitchNode(node: AnyNode): node is SwitchNode {
  return node.type === 'Switch';
}

export function isSliderNode(node: AnyNode): node is SliderNode {
  return node.type === 'Slider';
}

// ===========================================
// Button Type Guard
// ===========================================

export function isButtonNode(node: AnyNode): node is ButtonNode {
  return node.type === 'Button';
}

// ===========================================
// Display Component Type Guards
// ===========================================

export function isDisplayNode(node: AnyNode): node is DisplayNode {
  return ['Image', 'Placeholder', 'Avatar', 'Badge', 'Icon'].includes(node.type);
}

export function isImageNode(node: AnyNode): node is ImageNode {
  return node.type === 'Image';
}

export function isPlaceholderNode(node: AnyNode): node is PlaceholderNode {
  return node.type === 'Placeholder';
}

export function isAvatarNode(node: AnyNode): node is AvatarNode {
  return node.type === 'Avatar';
}

export function isBadgeNode(node: AnyNode): node is BadgeNode {
  return node.type === 'Badge';
}

export function isIconNode(node: AnyNode): node is IconNode {
  return node.type === 'Icon';
}

// ===========================================
// Data Component Type Guards
// ===========================================

export function isDataNode(node: AnyNode): node is DataNode {
  return ['Table', 'List'].includes(node.type);
}

export function isTableNode(node: AnyNode): node is TableNode {
  return node.type === 'Table';
}

export function isListNode(node: AnyNode): node is ListNode {
  return node.type === 'List';
}

// ===========================================
// Feedback Component Type Guards
// ===========================================

export function isFeedbackNode(node: AnyNode): node is FeedbackNode {
  return ['Alert', 'Toast', 'Progress', 'Spinner'].includes(node.type);
}

export function isAlertNode(node: AnyNode): node is AlertNode {
  return node.type === 'Alert';
}

export function isToastNode(node: AnyNode): node is ToastNode {
  return node.type === 'Toast';
}

export function isProgressNode(node: AnyNode): node is ProgressNode {
  return node.type === 'Progress';
}

export function isSpinnerNode(node: AnyNode): node is SpinnerNode {
  return node.type === 'Spinner';
}

// ===========================================
// Overlay Component Type Guards
// ===========================================

export function isOverlayNode(node: AnyNode): node is OverlayNode {
  return ['Tooltip', 'Popover', 'Dropdown'].includes(node.type);
}

export function isTooltipNode(node: AnyNode): node is TooltipNode {
  return node.type === 'Tooltip';
}

export function isPopoverNode(node: AnyNode): node is PopoverNode {
  return node.type === 'Popover';
}

export function isDropdownNode(node: AnyNode): node is DropdownNode {
  return node.type === 'Dropdown';
}

// ===========================================
// Navigation Component Type Guards
// ===========================================

export function isNavigationNode(node: AnyNode): node is NavigationNode {
  return ['Nav', 'Tabs', 'Breadcrumb'].includes(node.type);
}

export function isNavNode(node: AnyNode): node is NavNode {
  return node.type === 'Nav';
}

export function isTabsNode(node: AnyNode): node is TabsNode {
  return node.type === 'Tabs';
}

export function isBreadcrumbNode(node: AnyNode): node is BreadcrumbNode {
  return node.type === 'Breadcrumb';
}

// ===========================================
// Divider Type Guard
// ===========================================

export function isDividerNode(node: AnyNode): node is DividerComponentNode {
  return node.type === 'Divider';
}

// ===========================================
// Generic Type Guard
// ===========================================

export function isNodeType<T extends NodeType>(
  node: AnyNode,
  type: T
): node is Extract<AnyNode, { type: T }> {
  return node.type === type;
}
