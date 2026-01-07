/**
 * AST Type definitions for wireweave
 *
 * Comprehensive type definitions for all AST nodes
 */
interface Position {
    line: number;
    column: number;
    offset: number;
}
interface SourceLocation {
    start: Position;
    end: Position;
}
interface BaseNode {
    type: string;
    loc?: SourceLocation;
}
/**
 * Value with CSS unit (e.g., 16px, 100%, 2em)
 * Used when explicit unit is specified in DSL
 */
interface ValueWithUnit {
    value: number;
    unit: 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw';
}
/**
 * Spacing value:
 * - number: spacing token (0=0px, 1=4px, 2=8px, 4=16px, 6=24px, 8=32px, etc.)
 * - ValueWithUnit: direct CSS value (e.g., { value: 16, unit: 'px' })
 */
type SpacingValue = number | ValueWithUnit;
interface SpacingProps {
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
type WidthValue = number | ValueWithUnit | 'full' | 'auto' | 'screen' | 'fit';
type HeightValue = number | ValueWithUnit | 'full' | 'auto' | 'screen';
interface SizeProps {
    w?: WidthValue;
    h?: HeightValue;
    minW?: number | ValueWithUnit;
    maxW?: number | ValueWithUnit;
    minH?: number | ValueWithUnit;
    maxH?: number | ValueWithUnit;
}
type JustifyValue = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type AlignValue = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type DirectionValue = 'row' | 'column' | 'row-reverse' | 'column-reverse';
interface FlexProps {
    flex?: boolean | number;
    direction?: DirectionValue;
    justify?: JustifyValue;
    align?: AlignValue;
    wrap?: boolean | 'nowrap';
    gap?: SpacingValue;
}
interface GridProps {
    span?: number;
}
interface CommonProps extends SpacingProps, SizeProps, FlexProps, GridProps {
}
interface WireframeDocument extends BaseNode {
    type: 'Document';
    children: PageNode[];
}
interface PageNode extends BaseNode, CommonProps {
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
interface HeaderNode extends BaseNode, CommonProps {
    type: 'Header';
    border?: boolean;
    children: AnyNode[];
}
interface MainNode extends BaseNode, CommonProps {
    type: 'Main';
    children: AnyNode[];
}
interface FooterNode extends BaseNode, CommonProps {
    type: 'Footer';
    border?: boolean;
    children: AnyNode[];
}
interface SidebarNode extends BaseNode, CommonProps {
    type: 'Sidebar';
    position?: 'left' | 'right';
    children: AnyNode[];
}
interface SectionNode extends BaseNode, CommonProps {
    type: 'Section';
    title?: string | null;
    expanded?: boolean;
    children: AnyNode[];
}
interface RowNode extends BaseNode, CommonProps {
    type: 'Row';
    children: AnyNode[];
}
interface ColNode extends BaseNode, CommonProps {
    type: 'Col';
    /** Responsive breakpoint spans (sm: 576px+, md: 768px+, lg: 992px+, xl: 1200px+) */
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    /** Column order in flex container */
    order?: number;
    children: AnyNode[];
}
type ShadowValue = 'none' | 'sm' | 'md' | 'lg' | 'xl';
interface CardNode extends BaseNode, CommonProps {
    type: 'Card';
    title?: string | null;
    shadow?: ShadowValue;
    border?: boolean;
    children: AnyNode[];
}
interface ModalNode extends BaseNode, CommonProps {
    type: 'Modal';
    title?: string | null;
    children: AnyNode[];
}
type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
interface DrawerNode extends BaseNode, CommonProps {
    type: 'Drawer';
    title?: string | null;
    position?: DrawerPosition;
    children: AnyNode[];
}
interface AccordionNode extends BaseNode, CommonProps {
    type: 'Accordion';
    title?: string | null;
    children: AnyNode[];
}
type TextSizeToken = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type TextSize = TextSizeToken | ValueWithUnit;
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
type TextAlign = 'left' | 'center' | 'right' | 'justify';
interface TextNode extends BaseNode, Omit<CommonProps, 'align'> {
    type: 'Text';
    content: string;
    size?: TextSize;
    weight?: TextWeight;
    align?: TextAlign;
    muted?: boolean;
}
type TitleLevel = 1 | 2 | 3 | 4 | 5 | 6;
interface TitleNode extends BaseNode, Omit<CommonProps, 'align'> {
    type: 'Title';
    content: string;
    level?: TitleLevel;
    size?: TextSize;
    align?: TextAlign;
}
interface LinkNode extends BaseNode, CommonProps {
    type: 'Link';
    content: string;
    href?: string;
    external?: boolean;
}
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';
interface InputNode extends BaseNode, CommonProps {
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
interface TextareaNode extends BaseNode, CommonProps {
    type: 'Textarea';
    label?: string | null;
    placeholder?: string;
    value?: string;
    rows?: number;
    disabled?: boolean;
    required?: boolean;
}
interface SelectNode extends BaseNode, CommonProps {
    type: 'Select';
    label?: string | null;
    options: (string | SelectOption)[];
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}
interface SelectOption {
    label: string;
    value: string;
}
interface CheckboxNode extends BaseNode, CommonProps {
    type: 'Checkbox';
    label?: string | null;
    checked?: boolean;
    disabled?: boolean;
}
interface RadioNode extends BaseNode, CommonProps {
    type: 'Radio';
    label?: string | null;
    name?: string;
    checked?: boolean;
    disabled?: boolean;
}
interface SwitchNode extends BaseNode, CommonProps {
    type: 'Switch';
    label?: string | null;
    checked?: boolean;
    disabled?: boolean;
}
interface SliderNode extends BaseNode, CommonProps {
    type: 'Slider';
    label?: string | null;
    min?: number;
    max?: number;
    value?: number;
    step?: number;
    disabled?: boolean;
}
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface ButtonNode extends BaseNode, CommonProps {
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
interface ImageNode extends BaseNode, CommonProps {
    type: 'Image';
    src?: string | null;
    alt?: string;
}
interface PlaceholderNode extends BaseNode, CommonProps {
    type: 'Placeholder';
    label?: string | null;
}
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface AvatarNode extends BaseNode, CommonProps {
    type: 'Avatar';
    name?: string | null;
    src?: boolean;
    size?: AvatarSize | number;
}
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface BadgeNode extends BaseNode, CommonProps {
    type: 'Badge';
    content: string;
    variant?: BadgeVariant;
    pill?: boolean;
    icon?: string;
    size?: BadgeSize;
}
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface IconNode extends BaseNode, CommonProps {
    type: 'Icon';
    name: string;
    size?: IconSize | number;
    muted?: boolean;
}
interface TableNode extends BaseNode, CommonProps {
    type: 'Table';
    columns: string[];
    rows: (string | AnyNode)[][];
    striped?: boolean;
    bordered?: boolean;
    hover?: boolean;
}
interface ListItemNode {
    content: string;
    icon?: string;
    children?: ListItemNode[];
}
interface ListNode extends BaseNode, CommonProps {
    type: 'List';
    items: (string | ListItemNode)[];
    ordered?: boolean;
    none?: boolean;
}
type AlertVariant = 'success' | 'warning' | 'danger' | 'info';
interface AlertNode extends BaseNode, CommonProps {
    type: 'Alert';
    content: string;
    variant?: AlertVariant;
    dismissible?: boolean;
    icon?: string;
}
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
interface ToastNode extends BaseNode, CommonProps {
    type: 'Toast';
    content: string;
    position?: ToastPosition;
    variant?: AlertVariant;
}
interface ProgressNode extends BaseNode, CommonProps {
    type: 'Progress';
    value?: number;
    max?: number;
    label?: string;
    indeterminate?: boolean;
}
type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface SpinnerNode extends BaseNode, CommonProps {
    type: 'Spinner';
    label?: string | null;
    size?: SpinnerSize | number;
}
type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
interface TooltipNode extends BaseNode, CommonProps {
    type: 'Tooltip';
    content: string;
    position?: TooltipPosition;
    children: AnyNode[];
}
interface PopoverNode extends BaseNode, CommonProps {
    type: 'Popover';
    title?: string | null;
    children: AnyNode[];
}
interface DropdownItemNode {
    label: string;
    icon?: string;
    danger?: boolean;
    disabled?: boolean;
}
interface DividerNode {
    type: 'divider';
}
interface DropdownNode extends BaseNode, CommonProps {
    type: 'Dropdown';
    items: (DropdownItemNode | DividerNode)[];
}
interface NavItem {
    label: string;
    icon?: string;
    href?: string;
    active?: boolean;
    disabled?: boolean;
}
interface NavNode extends BaseNode, CommonProps {
    type: 'Nav';
    items: (string | NavItem)[];
    vertical?: boolean;
}
interface TabNode {
    label: string;
    active?: boolean;
    disabled?: boolean;
    children: AnyNode[];
}
interface TabsNode extends BaseNode, CommonProps {
    type: 'Tabs';
    items: string[];
    active?: number;
    children: TabNode[];
}
interface BreadcrumbItem {
    label: string;
    href?: string;
}
interface BreadcrumbNode extends BaseNode, CommonProps {
    type: 'Breadcrumb';
    items: (string | BreadcrumbItem)[];
}
interface DividerComponentNode extends BaseNode, CommonProps {
    type: 'Divider';
}
type LayoutNode = PageNode | HeaderNode | MainNode | FooterNode | SidebarNode | SectionNode;
type GridNode = RowNode | ColNode;
type ContainerComponentNode = CardNode | ModalNode | DrawerNode | AccordionNode;
type TextContentNode = TextNode | TitleNode | LinkNode;
type InputComponentNode = InputNode | TextareaNode | SelectNode | CheckboxNode | RadioNode | SwitchNode | SliderNode;
type DisplayNode = ImageNode | PlaceholderNode | AvatarNode | BadgeNode | IconNode;
type DataNode = TableNode | ListNode;
type FeedbackNode = AlertNode | ToastNode | ProgressNode | SpinnerNode;
type OverlayNode = TooltipNode | PopoverNode | DropdownNode;
type NavigationNode = NavNode | TabsNode | BreadcrumbNode;
type ContainerNode = LayoutNode | GridNode | ContainerComponentNode | PopoverNode | TooltipNode;
type LeafNode = TextContentNode | InputComponentNode | ButtonNode | DisplayNode | DataNode | FeedbackNode | DropdownNode | NavigationNode | DividerComponentNode;
type AnyNode = ContainerNode | LeafNode;
type NodeType = 'Document' | 'Page' | 'Header' | 'Main' | 'Footer' | 'Sidebar' | 'Section' | 'Row' | 'Col' | 'Card' | 'Modal' | 'Drawer' | 'Accordion' | 'Text' | 'Title' | 'Link' | 'Input' | 'Textarea' | 'Select' | 'Checkbox' | 'Radio' | 'Switch' | 'Slider' | 'Button' | 'Image' | 'Placeholder' | 'Avatar' | 'Badge' | 'Icon' | 'Table' | 'List' | 'Alert' | 'Toast' | 'Progress' | 'Spinner' | 'Tooltip' | 'Popover' | 'Dropdown' | 'Nav' | 'Tabs' | 'Breadcrumb' | 'Divider';

export type { DividerComponentNode as $, AnyNode as A, ButtonNode as B, ContainerNode as C, DrawerNode as D, FeedbackNode as E, FooterNode as F, GridNode as G, HeaderNode as H, InputComponentNode as I, AlertNode as J, ToastNode as K, LeafNode as L, MainNode as M, ProgressNode as N, SpinnerNode as O, PageNode as P, OverlayNode as Q, RowNode as R, SidebarNode as S, TextContentNode as T, TooltipNode as U, PopoverNode as V, DropdownNode as W, NavigationNode as X, NavNode as Y, TabsNode as Z, BreadcrumbNode as _, LayoutNode as a, NodeType as a0, WireframeDocument as a1, Position as a2, SourceLocation as a3, BaseNode as a4, ValueWithUnit as a5, SpacingValue as a6, SpacingProps as a7, WidthValue as a8, HeightValue as a9, TooltipPosition as aA, DropdownItemNode as aB, DividerNode as aC, NavItem as aD, TabNode as aE, BreadcrumbItem as aF, SizeProps as aa, JustifyValue as ab, AlignValue as ac, DirectionValue as ad, FlexProps as ae, GridProps as af, CommonProps as ag, ShadowValue as ah, DrawerPosition as ai, TextSizeToken as aj, TextSize as ak, TextWeight as al, TextAlign as am, TitleLevel as an, InputType as ao, SelectOption as ap, ButtonVariant as aq, ButtonSize as ar, AvatarSize as as, BadgeVariant as at, BadgeSize as au, IconSize as av, ListItemNode as aw, AlertVariant as ax, ToastPosition as ay, SpinnerSize as az, SectionNode as b, ColNode as c, ContainerComponentNode as d, CardNode as e, ModalNode as f, AccordionNode as g, TextNode as h, TitleNode as i, LinkNode as j, InputNode as k, TextareaNode as l, SelectNode as m, CheckboxNode as n, RadioNode as o, SwitchNode as p, SliderNode as q, DisplayNode as r, ImageNode as s, PlaceholderNode as t, AvatarNode as u, BadgeNode as v, IconNode as w, DataNode as x, TableNode as y, ListNode as z };
