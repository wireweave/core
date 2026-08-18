/**
 * AST Type definitions for wireweave
 *
 * Comprehensive type definitions for all AST nodes
 */

// ===========================================
// Source Location
// ===========================================

export interface Position {
  line: number
  column: number
  offset: number
}

export interface SourceLocation {
  start: Position
  end: Position
}

// ===========================================
// Base Node
// ===========================================

export interface BaseNode {
  type: string
  loc?: SourceLocation
}

// ===========================================
// Common Props
// ===========================================

/**
 * Value with CSS unit (e.g., 16px, 100%, 2em)
 * Used when explicit unit is specified in DSL
 */
export interface ValueWithUnit {
  value: number
  unit: 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw'
}

/**
 * Spacing value:
 * - number: spacing token (0=0px, 1=4px, 2=8px, 4=16px, 6=24px, 8=32px, etc.)
 * - ValueWithUnit: direct CSS value (e.g., { value: 16, unit: 'px' })
 */
export type SpacingValue = number | ValueWithUnit

export interface SpacingProps {
  p?: SpacingValue
  px?: SpacingValue
  py?: SpacingValue
  pt?: SpacingValue
  pr?: SpacingValue
  pb?: SpacingValue
  pl?: SpacingValue
  m?: SpacingValue
  mx?: SpacingValue | 'auto'
  my?: SpacingValue
  mt?: SpacingValue
  mr?: SpacingValue
  mb?: SpacingValue
  ml?: SpacingValue
}

/**
 * Width/Height value:
 * - number: size token or direct px
 * - ValueWithUnit: direct CSS value with unit
 * - string keywords: 'full', 'auto', 'screen', 'fit'
 */
export type WidthValue = number | ValueWithUnit | 'full' | 'auto' | 'screen' | 'fit'
export type HeightValue = number | ValueWithUnit | 'full' | 'auto' | 'screen'

export interface SizeProps {
  w?: WidthValue
  h?: HeightValue
  minW?: number | ValueWithUnit
  maxW?: number | ValueWithUnit
  minH?: number | ValueWithUnit
  maxH?: number | ValueWithUnit
}

export type JustifyValue = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
export type AlignValue = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type DirectionValue = 'row' | 'column' | 'row-reverse' | 'column-reverse'

export interface FlexProps {
  flex?: boolean | number
  direction?: DirectionValue
  justify?: JustifyValue
  align?: AlignValue
  wrap?: boolean | 'nowrap'
  gap?: SpacingValue
}

export interface GridProps {
  span?: number
}

/**
 * Position props for absolute/relative positioning
 * - x, y: position coordinates (relative to parent or absolute on page)
 * - All values are in pixels
 */
export interface PositionProps {
  x?: number | ValueWithUnit
  y?: number | ValueWithUnit
}

/**
 * Appearance props for visual styling
 * - bg: background color (muted, primary, secondary)
 * - border: show border
 */
export interface AppearanceProps {
  bg?: 'muted' | 'primary' | 'secondary'
  border?: boolean
  rounded?: boolean
}

export interface CommonProps
  extends
    SpacingProps,
    SizeProps,
    FlexProps,
    GridProps,
    PositionProps,
    AppearanceProps,
    GuardedOutcomeProps {}

// ===========================================
// Interactive Props
// ===========================================

/**
 * Interactive properties for components that can trigger actions.
 * Used for buttons, links, avatars, icons, and other clickable elements.
 */
/** Scalar values supported by the deterministic prototype state store. */
export type StateValue = string | number | boolean

/** Closed scalar types supported by a state declaration. */
export type StateValueType = 'string' | 'number' | 'boolean'

/** One typed state value and the value it resets to. */
export interface StateDeclaration {
  name: string
  valueType: StateValueType
  initial: StateValue
}

/** Equality is the only guard operation: small, typed, and deterministic. */
export interface StateGuard {
  state: string
  equals: StateValue
}

/** State-controlled render outcomes available on every ordinary node. */
export interface GuardedOutcomeProps {
  visibleWhen?: StateGuard
  enabledWhen?: StateGuard
}

export type InteractionEffect =
  | { kind: 'navigate'; target: string }
  | { kind: 'set'; state: string; value: StateValue }
  | { kind: 'reset'; state: string }
  | { kind: 'toggle'; state: string }
  | { kind: 'open'; target: string }
  | { kind: 'close'; target: string }

/** A browser event with an optional state guard and ordered effects. */
export interface InteractionHandler {
  event: 'click'
  guard?: StateGuard
  effects: InteractionEffect[]
}

export interface InteractiveProps extends GuardedOutcomeProps {
  /** Navigate to another page or URL */
  navigate?: string
  /** Opens a modal, drawer, or other overlay element by id */
  opens?: string
  /** Toggles visibility or state of an element by id */
  toggles?: string
  /** Custom action identifier (e.g., "submit", "logout", "delete") */
  action?: string
  /** Typed event/guard/effect handlers. Legacy intent props remain supported. */
  on?: InteractionHandler | InteractionHandler[]
}

// ===========================================
// Document Node
// ===========================================

/**
 * Wireframe Document — root node, holds `Page`s and reuse definitions.
 *
 * Multi-page semantics:
 * - A document is a *canvas* of pages. `renderPage` consumes one page;
 *   `renderCanvas` composes all pages into one canvas (grid auto-layout
 *   when no coords are set, absolute positioning when `at(x, y)` is set).
 * - The canvas itself (gap, layout) is a *renderer* concern, not part of
 *   the DSL — see `CanvasOptions` in `renderer/types.ts`. Chrome / grid /
 *   pan-zoom are host concerns and live entirely outside the renderer.
 *
 * A document child is not necessarily a page: `layout` and `component`
 * definitions are top-level siblings of `page` (see {@link TopLevelNode}).
 * They define trees to be reused, not screens to be drawn, so consumers that
 * want screens must select them — {@link documentPages}.
 *
 * Two independent name scopes live at this level, and neither is enforced by
 * the parser:
 * - {@link PageNode.id} — what `navigate=` addresses.
 * - the `name` of a {@link LayoutDefinitionNode} / {@link ComponentDefinitionNode}
 *   — what `uses=` addresses.
 *
 * A duplicate in either scope is a well-formed document that means something
 * unintended (a second page with the same `id` is simply unreachable), so it
 * is a diagnostic, not a parse error: reporting it belongs to `validation/`,
 * where it can carry a location and still let the file be parsed, printed and
 * edited. Resolution must therefore stay total in the presence of duplicates.
 */
export interface WireframeDocument extends BaseNode {
  type: 'Document'
  children: TopLevelNode[]
}

// ===========================================
// Layout Nodes
// ===========================================

/**
 * Page — a single fixed-size board (one wireframe screen).
 *
 * Note on `x` / `y` (inherited from `PositionProps` via `CommonProps`):
 * for `Page` these are **canvas coordinates** — the position of this page's
 * top-left corner on the multi-page canvas, in pixels. They are written in
 * DSL as `page "Login" at(0, 0) { ... }`. Pages without `at(...)` get
 * auto-grid placement at canvas-render time.
 *
 * For non-page nodes the same `x` / `y` mean position inside a `Relative`
 * parent — context disambiguates.
 */
export interface PageNode extends BaseNode, CommonProps {
  type: 'Page'
  /**
   * Stable identifier this page is referenced by — the `id=home` attribute.
   *
   * This is the screen's *address*, as distinct from {@link PageNode.title},
   * which is its *display name*. `navigate="home"` resolves against this, so
   * renaming a title must not break a link. Same role the `id` on
   * {@link ModalNode} / {@link DrawerNode} plays for `opens=` / `toggles=`,
   * one scope up: those address an overlay within a page, this addresses a
   * page within a document.
   *
   * Optional, and deliberately not enforced unique by the parser — see the
   * note on {@link WireframeDocument} for where uniqueness is checked and what
   * a duplicate costs.
   */
  id?: string
  title?: string | null
  /** Center content both horizontally and vertically */
  centered?: boolean
  /** Viewport size (e.g., "1440x900", "1440", or number for width only) */
  viewport?: string | number
  /** Device preset (e.g., "iphone14", "desktop") */
  device?: string
  /**
   * Name of the `layout` this page is drawn inside — the `uses=app` attribute.
   * Resolving it to a {@link LayoutDefinitionNode} is a renderer concern; the
   * parser only records the reference.
   */
  uses?: string
  /** Application state declarations contributed by this screen module. */
  states?: StateDeclaration[]
  /**
   * Named state variants of this screen — `variants=[loading, empty, ready]`.
   *
   * Each name draws the page again as a screen of its own, so a document
   * declaring three variants renders three independent boards rather than one
   * board with a toggle in it. That is the whole difference from {@link states}:
   * a state is a runtime value the site runtime flips and guards read, so the
   * transitions between states have to exist as UI somewhere; a variant is an
   * axis of the *artifact*, so the states appear side by side and nothing in
   * the wireframe has to offer a way to switch between them. A reviewer of a
   * variant sheet never mistakes a state-switching control for a product
   * feature, because there is none to mistake.
   *
   * Deliberately page-local, where `states` is collected document-wide: a
   * variant only means anything relative to the page it varies, and a document
   * scope would make one page's variant list multiply every other page's
   * screens. Names are free-form identifiers — the language fixes no vocabulary
   * of states, because which states a screen has is a property of that screen.
   */
  variants?: string[]
  /**
   * Which variant this page *is* — set by `expandVariants`, never by an author.
   *
   * The authored `variants` list and this are the two ends of the same
   * expansion: a page carries the list before it, and each page it expands into
   * carries one name from that list and no list. The printer therefore only
   * writes `variants`, and a document that has been expanded prints back as the
   * boards it became rather than as the fold it came from — the same asymmetry
   * `repeat` has between its node and its copies.
   */
  variant?: string
  children: AnyNode[]
}

// ===========================================
// Reuse Definition Nodes
// ===========================================

/**
 * Layout — a named shell defined once and referenced by pages (`uses=<name>`).
 *
 * A layout body is ordinary element content plus one {@link SlotNode} marking
 * where a referencing page's own children belong:
 *
 * ```wireframe
 * layout app {
 *   header { title "Acme" }
 *   slot
 *   footer { text "© 2026" }
 * }
 * ```
 *
 * The node type is `'Layout'`; the interface is named `LayoutDefinitionNode`
 * because `LayoutNode` already names the union of layout-*category* elements
 * (page / header / main / footer / sidebar / section).
 */
export interface LayoutDefinitionNode extends BaseNode, CommonProps {
  type: 'Layout'
  /** Grammar `Identifier` this layout is referenced by. */
  name: string
  /** Application state declarations contributed by this shared layout module. */
  states?: StateDeclaration[]
  children: AnyNode[]
}

/**
 * Component — a named fragment defined once for reuse across pages.
 *
 * Definition and round-trip only: expanding a component into its use sites is
 * a renderer concern, so nothing here describes instantiation.
 */
export interface ComponentDefinitionNode extends BaseNode, CommonProps {
  type: 'Component'
  /** Grammar `Identifier` this component is referenced by. */
  name: string
  /** Typed values every invocation must provide by name. */
  parameters?: ComponentParameter[]
  children: AnyNode[]
}

/** Scalar input types supported by reusable component contracts. */
export type ComponentParameterType = 'string' | 'number' | 'boolean'

/** One named, required input declared by a reusable component. */
export interface ComponentParameter {
  name: string
  valueType: ComponentParameterType
}

/** Values accepted by a component invocation. */
export type ComponentInputValue = string | number | boolean

/** Content supplied to one named slot at a component use-site. */
export interface ComponentSlotFill {
  name: string
  children: AnyNode[]
  loc?: SourceLocation
}

/**
 * An explicit reusable-component invocation.
 *
 * This is intentionally separate from {@link PageNode.uses}: `uses=` remains
 * the legacy page-layout reference, while `use` invokes a component fragment.
 * The linker fills `instanceId`, `targetId`, and `children` after validating
 * and expanding the invocation.
 */
export interface ComponentUseNode extends BaseNode {
  type: 'ComponentUse'
  name: string
  namespace?: string
  inputs: Record<string, ComponentInputValue>
  fills: ComponentSlotFill[]
  instanceId?: string
  targetId?: string
  children?: AnyNode[]
}

/**
 * Slot — the position inside a {@link LayoutDefinitionNode} where a
 * referencing page's own content is placed.
 *
 * A bare positional marker: no name, no block. Its position among its parent's
 * `children` is the whole content of the node.
 */
export interface SlotNode extends BaseNode, CommonProps {
  type: 'Slot'
  /** Required for component slots; absent for the legacy layout slot. */
  name?: string
}

export interface HeaderNode extends BaseNode, CommonProps {
  type: 'Header'
  border?: boolean
  children: AnyNode[]
}

export interface MainNode extends BaseNode, CommonProps {
  type: 'Main'
  /** Enable vertical scrolling for overflow content */
  scroll?: boolean
  children: AnyNode[]
}

export interface FooterNode extends BaseNode, CommonProps {
  type: 'Footer'
  border?: boolean
  children: AnyNode[]
}

export interface SidebarNode extends BaseNode, CommonProps {
  type: 'Sidebar'
  position?: 'left' | 'right'
  children: AnyNode[]
}

export interface SectionNode extends BaseNode, CommonProps {
  type: 'Section'
  title?: string | null
  expanded?: boolean
  children: AnyNode[]
}

/**
 * `repeat N { … }` — the same body drawn `count` times.
 *
 * A folding device, not an expressive one: it carries a count and nothing else,
 * so every copy is identical by construction. There is deliberately no index
 * variable — an index is what lets copies differ, and copies that differ are
 * data binding rather than a wireframe.
 *
 * The node survives into the AST unexpanded so the printer can write
 * `repeat 6` back out. Expansion happens on the way to a rendered tree
 * (`expandRepeats`), never in the parser.
 */
export interface RepeatNode extends BaseNode {
  type: 'Repeat'
  /** How many times to draw `children`. A non-negative integer; `0` draws nothing. */
  count: number
  children: AnyNode[]
}

// ===========================================
// Grid Nodes
// ===========================================

export interface RowNode extends BaseNode, CommonProps {
  type: 'Row'
  children: AnyNode[]
}

export interface ColNode extends BaseNode, CommonProps {
  type: 'Col'
  /** Responsive breakpoint spans (sm: 576px+, md: 768px+, lg: 992px+, xl: 1200px+) */
  sm?: number
  md?: number
  lg?: number
  xl?: number
  /** Column order in flex container */
  order?: number
  /** Enable vertical scrolling */
  scroll?: boolean
  children: AnyNode[]
}

/**
 * Stack - Vertical content grouping container
 *
 * Unlike Col which fills available space (flex: 1),
 * Stack only takes up the space needed by its content (flex: 0 0 auto).
 *
 * Use cases:
 * - Grouping form fields vertically
 * - Card content layout
 * - Centering content with justify/align
 */
export interface StackNode extends BaseNode, CommonProps {
  type: 'Stack'
  children: AnyNode[]
}

/**
 * Relative - Position children with absolute positioning
 *
 * Creates a position: relative container.
 * First child is the base element, subsequent children are overlaid on top.
 * Child elements can use `anchor` attribute to specify position:
 * - top-left, top-center, top-right
 * - center-left, center, center-right
 * - bottom-left, bottom-center, bottom-right
 */
export interface RelativeNode extends BaseNode, CommonProps {
  type: 'Relative'
  children: AnyNode[]
}

export type AnchorPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

// ===========================================
// Container Nodes
// ===========================================

export type ShadowValue = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export interface CardNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Card'
  title?: string | null
  shadow?: ShadowValue
  border?: boolean
  children: AnyNode[]
}

export interface ModalNode extends BaseNode, CommonProps {
  type: 'Modal'
  title?: string | null
  /** Unique identifier for targeting with opens/toggles */
  id?: string
  children: AnyNode[]
}

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'

export interface DrawerNode extends BaseNode, CommonProps {
  type: 'Drawer'
  title?: string | null
  /** Unique identifier for targeting with opens/toggles */
  id?: string
  position?: DrawerPosition
  children: AnyNode[]
}

export interface AccordionNode extends BaseNode, CommonProps {
  type: 'Accordion'
  title?: string | null
  children: AnyNode[]
}

// ===========================================
// Text Nodes
// ===========================================

export type TextSizeToken = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type TextSize = TextSizeToken | ValueWithUnit
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export interface TextNode extends BaseNode, Omit<CommonProps, 'align'> {
  type: 'Text'
  content: string
  size?: TextSize
  weight?: TextWeight
  /** Shorthand for `weight: 'bold'`; an explicit `weight` wins. */
  bold?: boolean
  align?: TextAlign
  muted?: boolean
}

export type TitleLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface TitleNode extends BaseNode, Omit<CommonProps, 'align'> {
  type: 'Title'
  content: string
  level?: TitleLevel
  size?: TextSize
  align?: TextAlign
}

export interface LinkNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Link'
  content: string
  href?: string
  external?: boolean
}

// ===========================================
// Input Nodes
// ===========================================

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date'

export interface InputNode extends BaseNode, CommonProps {
  type: 'Input'
  label?: string | null
  inputType?: InputType
  placeholder?: string
  value?: string
  disabled?: boolean
  required?: boolean
  readonly?: boolean
  icon?: string
}

export interface TextareaNode extends BaseNode, CommonProps {
  type: 'Textarea'
  label?: string | null
  placeholder?: string
  value?: string
  rows?: number
  disabled?: boolean
  required?: boolean
}

export interface SelectNode extends BaseNode, CommonProps {
  type: 'Select'
  label?: string | null
  options: (string | SelectOption)[]
  value?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export interface SelectOption {
  label: string
  value: string
}

export interface CheckboxNode extends BaseNode, CommonProps {
  type: 'Checkbox'
  label?: string | null
  checked?: boolean
  disabled?: boolean
}

export interface RadioNode extends BaseNode, CommonProps {
  type: 'Radio'
  label?: string | null
  name?: string
  checked?: boolean
  disabled?: boolean
}

export interface SwitchNode extends BaseNode, CommonProps {
  type: 'Switch'
  label?: string | null
  checked?: boolean
  disabled?: boolean
}

export interface SliderNode extends BaseNode, CommonProps {
  type: 'Slider'
  label?: string | null
  min?: number
  max?: number
  value?: number
  step?: number
  disabled?: boolean
}

// ===========================================
// Button Node
// ===========================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ButtonSize = ButtonSizeToken | number | ValueWithUnit

export interface ButtonNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Button'
  content: string
  primary?: boolean
  secondary?: boolean
  outline?: boolean
  ghost?: boolean
  danger?: boolean
  size?: ButtonSize
  icon?: string
  disabled?: boolean
  loading?: boolean
  /**
   * Accessible name, rendered as `aria-label`. Use this to give an icon-only
   * button (`button "" icon="x" aria="Close"`) a real accessible name for
   * screen-reader users (WCAG 4.1.2 / 1.1.1) without showing visible text.
   * `aria-label` is accepted as a synonym.
   */
  aria?: string
  'aria-label'?: string
  /**
   * Tooltip text, rendered as the `title` attribute. Also contributes an
   * accessible name (lower priority than `aria-label`/text content).
   */
  title?: string
}

// ===========================================
// Display Nodes
// ===========================================

export interface ImageNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Image'
  src?: string | null
  alt?: string
}

export interface PlaceholderNode extends BaseNode, CommonProps {
  type: 'Placeholder'
  label?: string | null
  children?: AnyNode[]
}

export type AvatarSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarSize = AvatarSizeToken | number | ValueWithUnit

export interface AvatarNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Avatar'
  name?: string | null
  src?: boolean
  size?: AvatarSize
}

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

export type BadgeSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type BadgeSize = BadgeSizeToken | number | ValueWithUnit

export interface BadgeNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Badge'
  content: string
  variant?: BadgeVariant
  pill?: boolean
  icon?: string
  size?: BadgeSize
  /** Anchor position when inside an overlay container */
  anchor?: AnchorPosition
}

export type IconSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type IconSize = IconSizeToken | number | ValueWithUnit

export interface IconNode extends BaseNode, CommonProps, InteractiveProps {
  type: 'Icon'
  name: string
  size?: IconSize
  muted?: boolean
}

// ===========================================
// Data Nodes
// ===========================================

export interface TableNode extends BaseNode, CommonProps {
  type: 'Table'
  columns: string[]
  rows: (string | AnyNode)[][]
  striped?: boolean
  bordered?: boolean
  hover?: boolean
}

export interface ListItemNode extends BaseNode {
  type: 'ListItem'
  content: string
  icon?: string
  children?: ListItemNode[]
}

export interface ListNode extends BaseNode, CommonProps {
  type: 'List'
  items: (string | ListItemNode)[]
  ordered?: boolean
  none?: boolean
}

// ===========================================
// Feedback Nodes
// ===========================================

export type AlertVariant = 'success' | 'warning' | 'danger' | 'info'

export interface AlertNode extends BaseNode, CommonProps {
  type: 'Alert'
  content: string
  variant?: AlertVariant
  dismissible?: boolean
  icon?: string
}

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastNode extends BaseNode, CommonProps {
  type: 'Toast'
  content: string
  position?: ToastPosition
  variant?: AlertVariant
}

export interface ProgressNode extends BaseNode, CommonProps {
  type: 'Progress'
  value?: number
  max?: number
  label?: string
  indeterminate?: boolean
}

export type SpinnerSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerSize = SpinnerSizeToken | number | ValueWithUnit

export interface SpinnerNode extends BaseNode, CommonProps {
  type: 'Spinner'
  label?: string | null
  size?: SpinnerSize
}

// ===========================================
// Overlay Nodes
// ===========================================

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left'

export interface TooltipNode extends BaseNode, CommonProps {
  type: 'Tooltip'
  content: string
  position?: TooltipPosition
  children: AnyNode[]
}

export interface PopoverNode extends BaseNode, CommonProps {
  type: 'Popover'
  title?: string | null
  children: AnyNode[]
}

export interface DropdownItemNode extends BaseNode, InteractiveProps {
  type: 'DropdownItem'
  label: string
  icon?: string
  href?: string
  danger?: boolean
  disabled?: boolean
}

export interface DropdownNode extends BaseNode, CommonProps {
  type: 'Dropdown'
  items: (DropdownItemNode | DividerComponentNode)[]
}

// ===========================================
// Navigation Nodes
// ===========================================

/** Nav item for array syntax: nav ["a", "b"] */
export interface NavItem extends InteractiveProps {
  label: string
  icon?: string
  href?: string
  active?: boolean
  disabled?: boolean
}

/**
 * Nav item for block syntax: item "label" icon="x" active
 *
 * `NavItem` is the same shape written as an array entry, which carries no `type`
 * because an array position needs no discriminant. Here the tag is load-bearing:
 * a nav block holds items, groups and dividers in one list.
 */
export interface NavBlockItem extends BaseNode, InteractiveProps {
  type: 'NavItem'
  label: string
  icon?: string
  href?: string
  active?: boolean
  disabled?: boolean
}

/** Nav group for block syntax: group "label" { ... } */
export interface NavGroupNode extends BaseNode {
  type: 'NavGroup'
  label: string
  items: (NavBlockItem | DividerComponentNode)[]
}

/**
 * Nav child can be group, item, or divider.
 *
 * The divider is the ordinary {@link DividerComponentNode}: `divider` means one
 * thing in this DSL, and a separator written inside a nav block is the same
 * element as one written between two cards.
 */
export type NavChild = NavGroupNode | NavBlockItem | DividerComponentNode

export interface NavNode extends BaseNode, CommonProps {
  type: 'Nav'
  /** Items for array syntax */
  items: (string | NavItem)[]
  /** Children for block syntax */
  children: NavChild[]
  vertical?: boolean
}

export interface TabNode {
  label: string
  active?: boolean
  disabled?: boolean
  children: AnyNode[]
}

export interface TabsNode extends BaseNode, CommonProps {
  type: 'Tabs'
  items: string[]
  active?: number
  children: TabNode[]
}

export interface BreadcrumbItem extends InteractiveProps {
  label: string
  href?: string
}

export interface BreadcrumbNode extends BaseNode, CommonProps {
  type: 'Breadcrumb'
  items: (string | BreadcrumbItem)[]
}

// ===========================================
// Divider Node
// ===========================================

export interface DividerComponentNode extends BaseNode, CommonProps {
  type: 'Divider'
  vertical?: boolean
}

// ===========================================
// Annotation Nodes
// ===========================================

export type MarkerColor = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange'

/**
 * Marker - Number marker for referencing in annotations
 *
 * Displays a numbered circle that can be placed on UI elements.
 * Recommended to use inside `relative` with `anchor` for positioning outside the UI.
 *
 * Example:
 * ```wireframe
 * relative {
 *   button "Submit"
 *   marker 1 anchor=top-right
 * }
 * ```
 */
export interface MarkerNode extends BaseNode, CommonProps {
  type: 'Marker'
  /** The marker number (1, 2, 3, ...) */
  number: number
  /** Marker color */
  color?: MarkerColor
  /** Anchor position when inside a relative container */
  anchor?: AnchorPosition
}

/**
 * Annotations - Documentation panel for screen specifications
 *
 * Container for annotation items that describe UI elements.
 * Visually distinct from wireframe UI with dashed border and different background.
 * Rendered with data-role="documentation" for LLM recognition.
 *
 * Example:
 * ```wireframe
 * annotations title="화면 설명" {
 *   item 1 "이메일 입력" { text "유효성 검사 적용" }
 *   item 2 "로그인 버튼" { text "OAuth 연동" }
 * }
 * ```
 */
export interface AnnotationsNode extends BaseNode, CommonProps {
  type: 'Annotations'
  /** Panel title (default: "화면 설명" or "Annotations") */
  title?: string
  children: AnnotationItemNode[]
}

/**
 * AnnotationItem - Individual annotation entry
 *
 * Represents a single annotation with a marker number, title, and description content.
 *
 * Example:
 * ```wireframe
 * item 1 "이메일 입력" {
 *   text "- 유효성 검사 적용"
 *   text "- 최대 255자"
 * }
 * ```
 */
export interface AnnotationItemNode extends BaseNode {
  type: 'AnnotationItem'
  /** The marker number this item references */
  number: number
  /** Item title */
  title: string
  /** Description content (Text nodes) */
  children: AnyNode[]
}

// ===========================================
// Node Type Unions
// ===========================================

export type LayoutNode = PageNode | HeaderNode | MainNode | FooterNode | SidebarNode | SectionNode

/** A named tree defined once for reuse, rather than a screen to draw. */
export type DefinitionNode = LayoutDefinitionNode | ComponentDefinitionNode

/** What a {@link WireframeDocument} can hold directly. */
export type TopLevelNode = PageNode | DefinitionNode

export type GridNode = RowNode | ColNode | StackNode | RelativeNode

export type ContainerComponentNode = CardNode | ModalNode | DrawerNode | AccordionNode

export type TextContentNode = TextNode | TitleNode | LinkNode

export type InputComponentNode =
  | InputNode
  | TextareaNode
  | SelectNode
  | CheckboxNode
  | RadioNode
  | SwitchNode
  | SliderNode

export type DisplayNode = ImageNode | PlaceholderNode | AvatarNode | BadgeNode | IconNode

export type DataNode = TableNode | ListNode

export type FeedbackNode = AlertNode | ToastNode | ProgressNode | SpinnerNode

export type OverlayNode = TooltipNode | PopoverNode | DropdownNode

export type NavigationNode = NavNode | TabsNode | BreadcrumbNode

export type AnnotationNode = MarkerNode | AnnotationsNode | AnnotationItemNode

export type ContainerNode =
  | LayoutNode
  | DefinitionNode
  | GridNode
  | ContainerComponentNode
  | PopoverNode
  | TooltipNode
  | AnnotationsNode
  | AnnotationItemNode
  | ComponentUseNode
  | RepeatNode

export type LeafNode =
  | TextContentNode
  | InputComponentNode
  | ButtonNode
  | DisplayNode
  | DataNode
  | FeedbackNode
  | DropdownNode
  | NavigationNode
  | DividerComponentNode
  | MarkerNode
  | SlotNode

export type AnyNode = ContainerNode | LeafNode

export type NodeType =
  | 'Document'
  | 'Page'
  | 'Layout'
  | 'Component'
  | 'ComponentUse'
  | 'Slot'
  | 'Repeat'
  | 'Header'
  | 'Main'
  | 'Footer'
  | 'Sidebar'
  | 'Section'
  | 'Row'
  | 'Col'
  | 'Stack'
  | 'Relative'
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
  | 'Divider'
  | 'Marker'
  | 'Annotations'
  | 'AnnotationItem'
