/**
 * AST Type definitions for wireweave
 *
 * Re-exports all types from the AST module for external consumption.
 * This provides a stable public API for type imports.
 */

// Re-export everything from ast/types
export type {
  // Source Location
  Position,
  SourceLocation,

  // Base
  BaseNode,

  // Common Props
  SpacingValue,
  SpacingProps,
  WidthValue,
  HeightValue,
  SizeProps,
  JustifyValue,
  AlignValue,
  DirectionValue,
  FlexProps,
  GridProps,
  CommonProps,

  // Document
  WireframeDocument,

  // Layout
  PageNode,
  HeaderNode,
  MainNode,
  FooterNode,
  SidebarNode,
  SectionNode,

  // Grid
  RowNode,
  ColNode,

  // Container
  ShadowValue,
  CardNode,
  ModalNode,
  DrawerPosition,
  DrawerNode,
  AccordionNode,

  // Text
  TextSize,
  TextWeight,
  TextAlign,
  TextNode,
  TitleLevel,
  TitleNode,
  LinkNode,

  // Input
  InputType,
  InputNode,
  TextareaNode,
  SelectNode,
  SelectOption,
  CheckboxNode,
  RadioNode,
  SwitchNode,
  SliderNode,

  // Button
  ButtonVariant,
  ButtonSize,
  ButtonNode,

  // Display
  ImageNode,
  PlaceholderNode,
  AvatarSize,
  AvatarNode,
  BadgeVariant,
  BadgeNode,
  IconNode,

  // Data
  TableNode,
  ListItemNode,
  ListNode,

  // Feedback
  AlertVariant,
  AlertNode,
  ToastPosition,
  ToastNode,
  ProgressNode,
  SpinnerSize,
  SpinnerNode,

  // Overlay
  TooltipPosition,
  TooltipNode,
  PopoverNode,
  DropdownItemNode,
  DividerNode,
  DropdownNode,

  // Navigation
  NavItem,
  NavNode,
  TabNode,
  TabsNode,
  BreadcrumbItem,
  BreadcrumbNode,

  // Divider Component
  DividerComponentNode,

  // Node Type Unions
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
  ContainerNode,
  LeafNode,
  AnyNode,
  NodeType,
} from '../ast/types';

// Re-export guards for convenience
export { isContainerNode, isLeafNode } from '../ast/guards';
