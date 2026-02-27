/**
 * AST Type definitions for wireweave
 *
 * Comprehensive type definitions for all AST nodes
 */

// ===========================================
// Source Location
// ===========================================

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

// ===========================================
// Base Node
// ===========================================

export interface BaseNode {
  type: string;
  loc?: SourceLocation;
}

// ===========================================
// Common Props
// ===========================================

/**
 * Value with CSS unit (e.g., 16px, 100%, 2em)
 * Used when explicit unit is specified in DSL
 */
export interface ValueWithUnit {
  value: number;
  unit: 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw';
}

/**
 * Spacing value:
 * - number: spacing token (0=0px, 1=4px, 2=8px, 4=16px, 6=24px, 8=32px, etc.)
 * - ValueWithUnit: direct CSS value (e.g., { value: 16, unit: 'px' })
 */
export type SpacingValue = number | ValueWithUnit;

export interface SpacingProps {
  p?: SpacingValue;
  px?: SpacingValue;
  py?: SpacingValue;
  pt?: SpacingValue;
  pr?: SpacingValue;
  pb?: SpacingValue;
  pl?: SpacingValue;
  m?: SpacingValue;
  mx?: SpacingValue | 'auto';
  my?: SpacingValue;
  mt?: SpacingValue;
  mr?: SpacingValue;
  mb?: SpacingValue;
  ml?: SpacingValue;
}

/**
 * Width/Height value:
 * - number: size token or direct px
 * - ValueWithUnit: direct CSS value with unit
 * - string keywords: 'full', 'auto', 'screen', 'fit'
 */
export type WidthValue = number | ValueWithUnit | 'full' | 'auto' | 'screen' | 'fit';
export type HeightValue = number | ValueWithUnit | 'full' | 'auto' | 'screen';

export interface SizeProps {
  w?: WidthValue;
  h?: HeightValue;
  minW?: number | ValueWithUnit;
  maxW?: number | ValueWithUnit;
  minH?: number | ValueWithUnit;
  maxH?: number | ValueWithUnit;
}

export type JustifyValue = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type AlignValue = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type DirectionValue = 'row' | 'column' | 'row-reverse' | 'column-reverse';

export interface FlexProps {
  flex?: boolean | number;
  direction?: DirectionValue;
  justify?: JustifyValue;
  align?: AlignValue;
  wrap?: boolean | 'nowrap';
  gap?: SpacingValue;
}

export interface GridProps {
  span?: number;
}

/**
 * Position props for absolute/relative positioning
 * - x, y: position coordinates (relative to parent or absolute on page)
 * - All values are in pixels
 */
export interface PositionProps {
  x?: number | ValueWithUnit;
  y?: number | ValueWithUnit;
}

/**
 * Appearance props for visual styling
 * - bg: background color (muted, primary, secondary)
 * - border: show border
 */
export interface AppearanceProps {
  bg?: 'muted' | 'primary' | 'secondary';
  border?: boolean;
}

export interface CommonProps extends SpacingProps, SizeProps, FlexProps, GridProps, PositionProps, AppearanceProps {}

// ===========================================
// Interactive Props
// ===========================================

/**
 * Interactive properties for components that can trigger actions.
 * Used for buttons, links, avatars, icons, and other clickable elements.
 */
export interface InteractiveProps {
  /** Navigate to another page or URL */
  navigate?: string;
  /** Opens a modal, drawer, or other overlay element by id */
  opens?: string;
  /** Toggles visibility or state of an element by id */
  toggles?: string;
  /** Custom action identifier (e.g., "submit", "logout", "delete") */
  action?: string;
}

// ===========================================
// Document Node
// ===========================================

export interface WireframeDocument extends BaseNode {
  type: 'Document';
  children: PageNode[];
}

// ===========================================
// Layout Nodes
// ===========================================

export interface PageNode extends BaseNode, CommonProps {
  type: 'Page';
  title?: string | null;
  /** Center content both horizontally and vertically */
  centered?: boolean;
  /** Viewport size (e.g., "1440x900", "1440", or number for width only) */
  viewport?: string | number;
  /** Device preset (e.g., "iphone14", "desktop") */
  device?: string;
  children: AnyNode[];
}

export interface HeaderNode extends BaseNode, CommonProps {
  type: 'Header';
  border?: boolean;
  children: AnyNode[];
}

export interface MainNode extends BaseNode, CommonProps {
  type: 'Main';
  /** Enable vertical scrolling for overflow content */
  scroll?: boolean;
  children: AnyNode[];
}

export interface FooterNode extends BaseNode, CommonProps {
  type: 'Footer';
  border?: boolean;
  children: AnyNode[];
}

export interface SidebarNode extends BaseNode, CommonProps {
  type: 'Sidebar';
  position?: 'left' | 'right';
  children: AnyNode[];
}

export interface SectionNode extends BaseNode, CommonProps {
  type: 'Section';
  title?: string | null;
  expanded?: boolean;
  children: AnyNode[];
}

// ===========================================
// Grid Nodes
// ===========================================

export interface RowNode extends BaseNode, CommonProps {
  type: 'Row';
  children: AnyNode[];
}

export interface ColNode extends BaseNode, CommonProps {
  type: 'Col';
  /** Responsive breakpoint spans (sm: 576px+, md: 768px+, lg: 992px+, xl: 1200px+) */
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  /** Column order in flex container */
  order?: number;
  /** Enable vertical scrolling */
  scroll?: boolean;
  children: AnyNode[];
}

// ===========================================
// Container Nodes
// ===========================================

export type ShadowValue = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Card';
  title?: string | null;
  shadow?: ShadowValue;
  border?: boolean;
  children: AnyNode[];
}

export interface ModalNode extends BaseNode, CommonProps {
  type: 'Modal';
  title?: string | null;
  /** Unique identifier for targeting with opens/toggles */
  id?: string;
  children: AnyNode[];
}

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerNode extends BaseNode, CommonProps {
  type: 'Drawer';
  title?: string | null;
  /** Unique identifier for targeting with opens/toggles */
  id?: string;
  position?: DrawerPosition;
  children: AnyNode[];
}

export interface AccordionNode extends BaseNode, CommonProps {
  type: 'Accordion';
  title?: string | null;
  children: AnyNode[];
}

// ===========================================
// Text Nodes
// ===========================================

export type TextSizeToken = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TextSize = TextSizeToken | ValueWithUnit;
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface TextNode extends BaseNode, Omit<CommonProps, 'align'> {
  type: 'Text';
  content: string;
  size?: TextSize;
  weight?: TextWeight;
  align?: TextAlign;
  muted?: boolean;
}

export type TitleLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TitleNode extends BaseNode, Omit<CommonProps, 'align'> {
  type: 'Title';
  content: string;
  level?: TitleLevel;
  size?: TextSize;
  align?: TextAlign;
}

export interface LinkNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Link';
  content: string;
  href?: string;
  external?: boolean;
}

// ===========================================
// Input Nodes
// ===========================================

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';

export interface InputNode extends BaseNode, CommonProps {
  type: 'Input';
  label?: string | null;
  inputType?: InputType;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  icon?: string;
}

export interface TextareaNode extends BaseNode, CommonProps {
  type: 'Textarea';
  label?: string | null;
  placeholder?: string;
  value?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}

export interface SelectNode extends BaseNode, CommonProps {
  type: 'Select';
  label?: string | null;
  options: (string | SelectOption)[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface CheckboxNode extends BaseNode, CommonProps {
  type: 'Checkbox';
  label?: string | null;
  checked?: boolean;
  disabled?: boolean;
}

export interface RadioNode extends BaseNode, CommonProps {
  type: 'Radio';
  label?: string | null;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
}

export interface SwitchNode extends BaseNode, CommonProps {
  type: 'Switch';
  label?: string | null;
  checked?: boolean;
  disabled?: boolean;
}

export interface SliderNode extends BaseNode, CommonProps {
  type: 'Slider';
  label?: string | null;
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  disabled?: boolean;
}

// ===========================================
// Button Node
// ===========================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonSize = ButtonSizeToken | number | ValueWithUnit;

export interface ButtonNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Button';
  content: string;
  primary?: boolean;
  secondary?: boolean;
  outline?: boolean;
  ghost?: boolean;
  danger?: boolean;
  size?: ButtonSize;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
}

// ===========================================
// Display Nodes
// ===========================================

export interface ImageNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Image';
  src?: string | null;
  alt?: string;
}

export interface PlaceholderNode extends BaseNode, CommonProps {
  type: 'Placeholder';
  label?: string | null;
  children?: AnyNode[];
}

export type AvatarSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarSize = AvatarSizeToken | number | ValueWithUnit;

export interface AvatarNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Avatar';
  name?: string | null;
  src?: boolean;
  size?: AvatarSize;
}

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BadgeSize = BadgeSizeToken | number | ValueWithUnit;

export interface BadgeNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Badge';
  content: string;
  variant?: BadgeVariant;
  pill?: boolean;
  icon?: string;
  size?: BadgeSize;
}

export type IconSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconSize = IconSizeToken | number | ValueWithUnit;

export interface IconNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Icon';
  name: string;
  size?: IconSize;
  muted?: boolean;
}

// ===========================================
// Data Nodes
// ===========================================

export interface TableNode extends BaseNode, CommonProps {
  type: 'Table';
  columns: string[];
  rows: (string | AnyNode)[][];
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
}

export interface ListItemNode {
  content: string;
  icon?: string;
  children?: ListItemNode[];
}

export interface ListNode extends BaseNode, CommonProps {
  type: 'List';
  items: (string | ListItemNode)[];
  ordered?: boolean;
  none?: boolean;
}

// ===========================================
// Feedback Nodes
// ===========================================

export type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

export interface AlertNode extends BaseNode, CommonProps {
  type: 'Alert';
  content: string;
  variant?: AlertVariant;
  dismissible?: boolean;
  icon?: string;
}

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastNode extends BaseNode, CommonProps {
  type: 'Toast';
  content: string;
  position?: ToastPosition;
  variant?: AlertVariant;
}

export interface ProgressNode extends BaseNode, CommonProps {
  type: 'Progress';
  value?: number;
  max?: number;
  label?: string;
  indeterminate?: boolean;
}

export type SpinnerSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerSize = SpinnerSizeToken | number | ValueWithUnit;

export interface SpinnerNode extends BaseNode, CommonProps {
  type: 'Spinner';
  label?: string | null;
  size?: SpinnerSize;
}

// ===========================================
// Overlay Nodes
// ===========================================

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipNode extends BaseNode, CommonProps {
  type: 'Tooltip';
  content: string;
  position?: TooltipPosition;
  children: AnyNode[];
}

export interface PopoverNode extends BaseNode, CommonProps {
  type: 'Popover';
  title?: string | null;
  children: AnyNode[];
}

export interface DropdownItemNode extends InteractiveProps {
  label: string;
  icon?: string;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

export interface DividerNode {
  type: 'divider';
}

export interface DropdownNode extends BaseNode, CommonProps {
  type: 'Dropdown';
  items: (DropdownItemNode | DividerNode)[];
}

// ===========================================
// Navigation Nodes
// ===========================================

/** Nav item for array syntax: nav ["a", "b"] */
export interface NavItem extends InteractiveProps {
  label: string;
  icon?: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}

/** Nav item for block syntax: item "label" icon="x" active */
export interface NavBlockItem extends InteractiveProps {
  type: 'item';
  label: string;
  icon?: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}

/** Nav group for block syntax: group "label" { ... } */
export interface NavGroupNode {
  type: 'group';
  label: string;
  collapsed?: boolean;
  items: (NavBlockItem | NavDivider)[];
}

/** Divider inside nav block */
export interface NavDivider {
  type: 'divider';
}

/** Nav child can be group, item, or divider */
export type NavChild = NavGroupNode | NavBlockItem | NavDivider;

export interface NavNode extends BaseNode, CommonProps {
  type: 'Nav';
  /** Items for array syntax */
  items: (string | NavItem)[];
  /** Children for block syntax */
  children: NavChild[];
  vertical?: boolean;
}

export interface TabNode {
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: AnyNode[];
}

export interface TabsNode extends BaseNode, CommonProps {
  type: 'Tabs';
  items: string[];
  active?: number;
  children: TabNode[];
}

export interface BreadcrumbItem extends InteractiveProps {
  label: string;
  href?: string;
}

export interface BreadcrumbNode extends BaseNode, CommonProps {
  type: 'Breadcrumb';
  items: (string | BreadcrumbItem)[];
}

// ===========================================
// Divider Node
// ===========================================

export interface DividerComponentNode extends BaseNode, CommonProps {
  type: 'Divider';
}

// ===========================================
// Node Type Unions
// ===========================================

export type LayoutNode =
  | PageNode
  | HeaderNode
  | MainNode
  | FooterNode
  | SidebarNode
  | SectionNode;

export type GridNode = RowNode | ColNode;

export type ContainerComponentNode =
  | CardNode
  | ModalNode
  | DrawerNode
  | AccordionNode;

export type TextContentNode = TextNode | TitleNode | LinkNode;

export type InputComponentNode =
  | InputNode
  | TextareaNode
  | SelectNode
  | CheckboxNode
  | RadioNode
  | SwitchNode
  | SliderNode;

export type DisplayNode =
  | ImageNode
  | PlaceholderNode
  | AvatarNode
  | BadgeNode
  | IconNode;

export type DataNode = TableNode | ListNode;

export type FeedbackNode =
  | AlertNode
  | ToastNode
  | ProgressNode
  | SpinnerNode;

export type OverlayNode = TooltipNode | PopoverNode | DropdownNode;

export type NavigationNode = NavNode | TabsNode | BreadcrumbNode;

export type ContainerNode =
  | LayoutNode
  | GridNode
  | ContainerComponentNode
  | PopoverNode
  | TooltipNode;

export type LeafNode =
  | TextContentNode
  | InputComponentNode
  | ButtonNode
  | DisplayNode
  | DataNode
  | FeedbackNode
  | DropdownNode
  | NavigationNode
  | DividerComponentNode;

export type AnyNode = ContainerNode | LeafNode;

export type NodeType =
  | 'Document'
  | 'Page'
  | 'Header'
  | 'Main'
  | 'Footer'
  | 'Sidebar'
  | 'Section'
  | 'Row'
  | 'Col'
  | 'Card'
  | 'Modal'
  | 'Drawer'
  | 'Accordion'
  | 'Text'
  | 'Title'
  | 'Link'
  | 'Input'
  | 'Textarea'
  | 'Select'
  | 'Checkbox'
  | 'Radio'
  | 'Switch'
  | 'Slider'
  | 'Button'
  | 'Image'
  | 'Placeholder'
  | 'Avatar'
  | 'Badge'
  | 'Icon'
  | 'Table'
  | 'List'
  | 'Alert'
  | 'Toast'
  | 'Progress'
  | 'Spinner'
  | 'Tooltip'
  | 'Popover'
  | 'Dropdown'
  | 'Nav'
  | 'Tabs'
  | 'Breadcrumb'
  | 'Divider';
