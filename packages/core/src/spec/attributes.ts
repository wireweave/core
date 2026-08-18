/**
 * Wireweave DSL Attribute Definitions
 *
 * Complete list of all valid attributes in Wireweave DSL.
 */

import { DEVICE_PRESETS } from '../viewport/presets'

import type { AttributeSpec } from './types'

/**
 * All valid attributes in Wireweave DSL
 */
export const ATTRIBUTE_SPECS: readonly AttributeSpec[] = [
  // ============================================
  // Spacing Attributes
  // ============================================
  { name: 'p', type: 'number', description: 'Padding (all sides)' },
  { name: 'px', type: 'number', description: 'Horizontal padding' },
  { name: 'py', type: 'number', description: 'Vertical padding' },
  { name: 'pt', type: 'number', description: 'Top padding' },
  { name: 'pr', type: 'number', description: 'Right padding' },
  { name: 'pb', type: 'number', description: 'Bottom padding' },
  { name: 'pl', type: 'number', description: 'Left padding' },
  { name: 'm', type: 'number', description: 'Margin (all sides)' },
  { name: 'mx', type: 'string', description: 'Horizontal margin (number or "auto")' },
  { name: 'my', type: 'number', description: 'Vertical margin' },
  { name: 'mt', type: 'number', description: 'Top margin' },
  { name: 'mr', type: 'number', description: 'Right margin' },
  { name: 'mb', type: 'number', description: 'Bottom margin' },
  { name: 'ml', type: 'number', description: 'Left margin' },
  { name: 'gap', type: 'number', description: 'Gap between children' },

  // ============================================
  // Size Attributes
  // ============================================
  {
    name: 'w',
    type: 'string',
    values: ['full', 'auto', 'screen', 'fit'],
    description: 'Width — a number of pixels, or one of the size keywords',
  },
  {
    name: 'h',
    type: 'string',
    values: ['full', 'auto', 'screen'],
    description: 'Height — a number of pixels, or one of the size keywords',
  },
  { name: 'width', type: 'number', description: 'Width in pixels (page only)' },
  { name: 'height', type: 'number', description: 'Height in pixels (page only)' },
  { name: 'minW', type: 'number', description: 'Minimum width' },
  { name: 'maxW', type: 'number', description: 'Maximum width' },
  { name: 'minH', type: 'number', description: 'Minimum height' },
  { name: 'maxH', type: 'number', description: 'Maximum height' },

  // ============================================
  // Flex/Grid Layout Attributes
  // ============================================
  { name: 'flex', type: 'boolean', description: 'Enable flexbox' },
  {
    name: 'direction',
    type: 'enum',
    values: ['row', 'column', 'row-reverse', 'column-reverse'],
    description: 'Flex direction',
  },
  {
    name: 'justify',
    type: 'enum',
    values: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    description: 'Main axis alignment',
  },
  {
    name: 'align',
    type: 'enum',
    values: ['start', 'center', 'end', 'stretch', 'baseline'],
    description: 'Cross axis alignment',
  },
  {
    name: 'wrap',
    type: 'boolean',
    values: ['nowrap'],
    // `boolean | 'nowrap'` in the AST: bare `wrap` enables wrapping, and
    // `wrap=nowrap` opts a container out of it (`renderer/html/index.ts`
    // branches on the keyword). Both halves have to be stated or the keyword
    // reads as an unknown value to every editor downstream.
    description: 'Enable flex wrap, or wrap=nowrap to force a single line',
  },
  { name: 'span', type: 'number', description: 'Grid column span (1-12)' },
  { name: 'sm', type: 'number', description: 'Responsive span at 576px+' },
  { name: 'md', type: 'number', description: 'Responsive span at 768px+' },
  { name: 'lg', type: 'number', description: 'Responsive span at 992px+' },
  { name: 'xl', type: 'number', description: 'Responsive span at 1200px+' },
  { name: 'order', type: 'number', description: 'Flex order' },

  // ============================================
  // Position Attributes
  // ============================================
  { name: 'x', type: 'number', description: 'Horizontal position' },
  { name: 'y', type: 'number', description: 'Vertical position' },
  {
    name: 'position',
    type: 'enum',
    values: [
      'left',
      'right',
      'top',
      'bottom',
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ],
    description: 'Position preset',
  },

  // ============================================
  // Visual Attributes
  // ============================================
  { name: 'border', type: 'boolean', description: 'Show border' },
  { name: 'rounded', type: 'boolean', description: 'Apply border radius' },
  {
    name: 'shadow',
    type: 'enum',
    values: ['none', 'sm', 'md', 'lg', 'xl'],
    description: 'Box shadow',
  },
  {
    name: 'bg',
    type: 'enum',
    values: ['muted', 'primary', 'secondary'],
    description: 'Background variant',
  },

  // ============================================
  // Text Attributes
  // ============================================
  {
    name: 'size',
    type: 'enum',
    values: ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl'],
    description: 'Size preset',
  },
  {
    name: 'weight',
    type: 'enum',
    values: ['normal', 'medium', 'semibold', 'bold'],
    description: 'Font weight',
  },
  { name: 'level', type: 'number', description: 'Heading level (1-6)' },
  { name: 'muted', type: 'boolean', description: 'Muted/dimmed style' },
  { name: 'bold', type: 'boolean', description: 'Bold text' },

  // ============================================
  // Button Variant Attributes
  // ============================================
  { name: 'primary', type: 'boolean', description: 'Primary style' },
  { name: 'secondary', type: 'boolean', description: 'Secondary style' },
  { name: 'outline', type: 'boolean', description: 'Outline style' },
  { name: 'ghost', type: 'boolean', description: 'Ghost/transparent style' },
  { name: 'danger', type: 'boolean', description: 'Danger/destructive style' },

  // ============================================
  // Status Variant Attributes
  // ============================================
  {
    name: 'variant',
    type: 'enum',
    values: ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info'],
    description: 'Status variant',
  },

  // ============================================
  // Form Attributes
  // ============================================
  {
    name: 'inputType',
    type: 'enum',
    values: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date'],
    description: 'Input field type',
  },
  { name: 'placeholder', type: 'string', description: 'Placeholder text' },
  { name: 'value', type: 'string', description: 'Default value' },
  { name: 'label', type: 'string', description: 'Field label' },
  /**
   * One row, three meanings, and the row states only what they share.
   *
   * This registry is a flat namespace: {@link ATTRIBUTE_MAP} and
   * {@link VALID_ATTRIBUTE_NAMES} are keyed by attribute name alone, with no
   * owning element, so a name can hold exactly one spec. `name` is written by
   * three unrelated elements — the group name on `radio`, the person's name an
   * `avatar` draws initials from, and the glyph an `icon` resolves — and a
   * second `name` row does not scope them apart, it silently shadows (last
   * write wins in the Map, while the count-based gates in
   * `packages/language-data` see a duplicate and go red). So this description
   * says what is true of all three and no more.
   *
   * What is true of only one of them goes in `attribute-overrides.ts`, keyed by
   * element, and is read through `attributeFor`. That is why the glyph domain is
   * not listed here: it holds on `icon` alone, and a `values` list on this row
   * would tell every element-blind consumer that a radio group must be called
   * `circle-alert`.
   *
   * Never add a second row for a name that already exists. Widen this one, and
   * put the narrow half in the override table.
   */
  {
    name: 'name',
    type: 'string',
    description: 'Name — what the element is called, or the named thing it resolves',
  },
  { name: 'required', type: 'boolean', description: 'Required field' },
  { name: 'disabled', type: 'boolean', description: 'Disabled state' },
  { name: 'readonly', type: 'boolean', description: 'Read-only state' },
  { name: 'checked', type: 'boolean', description: 'Checked state' },
  { name: 'loading', type: 'boolean', description: 'Loading state' },
  { name: 'rows', type: 'number', description: 'Textarea rows' },
  { name: 'min', type: 'number', description: 'Minimum value' },
  { name: 'max', type: 'number', description: 'Maximum value' },
  { name: 'step', type: 'number', description: 'Step increment' },

  // ============================================
  // Content Attributes
  // ============================================
  { name: 'title', type: 'string', description: 'Title text' },
  { name: 'src', type: 'string', description: 'Source URL' },
  { name: 'alt', type: 'string', description: 'Alt text' },
  { name: 'href', type: 'string', description: 'Link URL' },
  /**
   * Left open here on purpose. The glyph set is closed and known — see
   * `attribute-overrides.ts` — but a `values` list on this row is mirrored into
   * the editor's element-blind value vocabulary, which would colour 1,667 words
   * like `home` and `map` as language constants in every value position. Ask
   * `attributeFor(element, 'icon')` for the domain.
   */
  { name: 'icon', type: 'string', description: 'Icon name' },
  { name: 'external', type: 'boolean', description: 'External link' },

  // ============================================
  // Accessibility Attributes
  // ============================================
  {
    name: 'aria',
    type: 'string',
    description: 'Accessible name, rendered as aria-label (e.g. icon-only button)',
  },
  {
    name: 'aria-label',
    type: 'string',
    description: 'Accessible name (synonym for aria), rendered as aria-label',
  },

  // ============================================
  // State Attributes
  // ============================================
  { name: 'active', type: 'number', description: 'Active index' },
  { name: 'expanded', type: 'boolean', description: 'Expanded state' },
  { name: 'centered', type: 'boolean', description: 'Center content' },
  { name: 'vertical', type: 'boolean', description: 'Vertical orientation' },
  { name: 'scroll', type: 'boolean', description: 'Enable scrolling' },

  // ============================================
  // Feedback Attributes
  // ============================================
  { name: 'dismissible', type: 'boolean', description: 'Can be dismissed' },
  { name: 'indeterminate', type: 'boolean', description: 'Indeterminate state' },
  { name: 'pill', type: 'boolean', description: 'Pill/rounded style' },

  // ============================================
  // Data Attributes
  // ============================================
  { name: 'striped', type: 'boolean', description: 'Striped rows' },
  { name: 'bordered', type: 'boolean', description: 'Full borders' },
  { name: 'hover', type: 'boolean', description: 'Hover effect' },
  { name: 'ordered', type: 'boolean', description: 'Ordered list' },
  { name: 'none', type: 'boolean', description: 'No list markers' },

  // ============================================
  // Page/Viewport Attributes
  // ============================================
  { name: 'viewport', type: 'string', description: 'Viewport size (e.g., "1440x900")' },
  {
    name: 'device',
    type: 'enum',
    // Derived, not transcribed: `resolveViewport` looks the value up in
    // `DEVICE_PRESETS` and silently falls back to the default when it misses, so
    // a hand-kept copy of the key list would turn every typo into a wireframe
    // rendered at the wrong width with no diagnostic.
    values: Object.keys(DEVICE_PRESETS),
    description: 'Device preset',
  },

  // ============================================
  // Interaction Attributes
  // ============================================
  // The wire between two screens, or between a screen and one of its overlays.
  // `navigate` / `opens` / `toggles` resolve against an `id` (see below); the
  // AST counterpart is `InteractiveProps` in `src/ast/types.ts`.
  {
    name: 'navigate',
    type: 'string',
    description: 'Screen this element navigates to — a page id, a page title, or a URL',
  },
  { name: 'opens', type: 'string', description: 'id of the modal or drawer this element opens' },
  {
    name: 'toggles',
    type: 'string',
    description: 'id of the modal or drawer this element shows or hides',
  },
  {
    name: 'action',
    type: 'string',
    description: 'Named interaction with no target, e.g. back, close, submit',
  },
  {
    name: 'on',
    type: 'object',
    description: 'Typed click event with an optional equality guard and ordered effects',
  },
  {
    name: 'visibleWhen',
    type: 'object',
    description: 'Equality guard controlling whether this branch is visible',
  },
  {
    name: 'enabledWhen',
    type: 'object',
    description: 'Equality guard controlling whether this control is enabled',
  },
  {
    name: 'states',
    type: 'object[]',
    description: 'Typed application state declarations owned by a page or shared layout',
  },
  {
    name: 'variants',
    type: 'string[]',
    description:
      'Named state variants of this page — each one renders the page again as a screen of its own',
  },
  {
    name: 'when',
    type: 'string[]',
    description:
      'Variant boards this element is drawn on — when=loading, or when=[loading, empty] for both',
  },
  {
    name: 'id',
    type: 'string',
    description: 'Stable identifier this page or overlay is addressed by, as distinct from title',
  },

  // ============================================
  // Annotation Attributes
  // ============================================
  {
    name: 'anchor',
    type: 'enum',
    values: [
      'top-left',
      'top-center',
      'top-right',
      'center-left',
      'center',
      'center-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ],
    description: 'Corner or edge of the parent this element is pinned to',
  },
  {
    name: 'color',
    type: 'enum',
    values: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'],
    description: 'Marker color',
  },

  // ============================================
  // Reuse Attributes
  // ============================================
  { name: 'uses', type: 'string', description: 'Name of the layout a page is drawn inside' },
] as const

/**
 * Set of all valid attribute names for quick lookup
 */
export const VALID_ATTRIBUTE_NAMES: ReadonlySet<string> = new Set(
  ATTRIBUTE_SPECS.map((attr) => attr.name),
)

/**
 * Map of attribute name to spec for quick lookup
 */
export const ATTRIBUTE_MAP: ReadonlyMap<string, AttributeSpec> = new Map(
  ATTRIBUTE_SPECS.map((attr) => [attr.name, attr]),
)

/**
 * Attributes every element accepts, because every renderer turns them into that
 * element's own box: padding, margin, gap, size bounds, absolute offsets.
 *
 * The membership of this list is measured, not asserted.
 * `@wireweave/language-data`'s `__tests__/spec-render-closure.test.ts` renders
 * each element with and without each attribute it declares and fails on any pair
 * that leaves the output identical — bar a short list of recorded render debt,
 * which may only shrink. So an attribute only some elements honour cannot sit
 * here: it belongs in {@link CONTAINER_ATTRIBUTES} or on the individual elements
 * that read it. Changes to the list itself are caught by
 * `__tests__/spec-surface-baseline.ts` in the same package, in both directions:
 * a name leaving this list withdraws syntax from documents already using it, and
 * that is as much a failure as a name arriving unreviewed.
 *
 * Both gates live outside this package deliberately. A check shipped alongside
 * the list it checks is the producer grading its own output, and this list is
 * the thing under test.
 */
export const BOX_ATTRIBUTES: readonly string[] = [
  // Guarded runtime outcomes
  'visibleWhen',
  'enabledWhen',
  // Build-time variant scope. Listed beside the guards because it reads like
  // them and is deliberately not one of them: a guard leaves the element in the
  // markup for the runtime to toggle, `when` decides whether the element is in
  // that board's markup at all. Every element takes it for the same reason
  // every element takes a guard — which boards a piece of a screen belongs to
  // is a property of the piece, not of what kind of piece it is.
  'when',
  // Spacing
  'p',
  'px',
  'py',
  'pt',
  'pr',
  'pb',
  'pl',
  'm',
  'mx',
  'my',
  'mt',
  'mr',
  'mb',
  'ml',
  'gap',
  // Size
  'w',
  'h',
  'minW',
  'maxW',
  'minH',
  'maxH',
  // Position
  'x',
  'y',
] as const

/**
 * Attributes only the elements that render a flex container honour — the flex
 * properties themselves plus the decoration `getCommonClasses` puts on that
 * container.
 *
 * Leaf controls (`checkbox`, `radio`, `divider`, `marker`, `annotations`) build
 * their own markup and read none of these, so they declare {@link BOX_ATTRIBUTES}
 * alone. Spread both lists on an element that renders a container.
 */
export const CONTAINER_ATTRIBUTES: readonly string[] = [
  // Flex
  'flex',
  'direction',
  'justify',
  'align',
  'wrap',
  // Decoration
  'bg',
  'border',
  'rounded',
] as const

/**
 * Attributes every element that can be interacted with accepts.
 *
 * The mirror of `InteractiveProps` in `src/ast/types.ts`: an element whose node
 * extends that interface belongs in this list, and one whose node does not, does
 * not. Spread it the way {@link BOX_ATTRIBUTES} is spread, so that adding an
 * interaction attribute reaches every interactive element at once rather than
 * six out of seven.
 */
export const INTERACTIVE_ATTRIBUTES: readonly string[] = [
  'navigate',
  'opens',
  'toggles',
  'action',
  'on',
] as const
