/**
 * Wireweave DSL Component Definitions
 *
 * Metadata for every element the grammar defines.
 *
 * The element set itself is not declared here — it is extracted from
 * `src/grammar/wireframe.peggy` into `grammar-elements.generated.ts`. This file
 * only attaches metadata (category, attributes, description) to those elements,
 * and the `Record<GrammarElementName, …>` key type makes that attachment total:
 * a new grammar element fails to typecheck until its metadata is filled in, and
 * an entry for a non-element is rejected as an excess property.
 */

import type { ComponentCategory, ComponentSpec } from './types'
import { BOX_ATTRIBUTES, CONTAINER_ATTRIBUTES, INTERACTIVE_ATTRIBUTES } from './attributes'
import {
  GRAMMAR_ELEMENTS,
  GRAMMAR_BLOCK_NODE_TYPES,
  type GrammarElementName,
  type GrammarBlockNodeType,
} from './grammar-elements.generated'

/**
 * Everything about an element that the grammar does not already state.
 * Its name and AST node type come from {@link GRAMMAR_ELEMENTS}.
 */
interface ComponentMetadata {
  /** Component category */
  category: ComponentCategory
  /** Valid attributes for this component (names only, definitions in ATTRIBUTE_SPECS) */
  attributes: readonly string[]
  /** Whether this component can have children */
  hasChildren: boolean
  /** Description for documentation */
  description: string
}

/**
 * Metadata for every grammar element, in presentation order (the order editors
 * and docs list components in — not the grammar's rule order).
 */
const COMPONENT_METADATA: Readonly<Record<GrammarElementName, ComponentMetadata>> = {
  // ============================================
  // Layout Components
  // ============================================
  page: {
    category: 'layout',
    attributes: [
      // `visibleWhen` / `enabledWhen` are filtered out of the spread rather than
      // inherited. They are guarded *outcomes*: the renderer emits
      // `data-wf-visible-when` / `data-wf-enabled-when` from the component path,
      // and the site runtime toggles the element they land on. A page is the
      // board that path renders *into* — nothing emits the attribute for it and
      // nothing would toggle it, so declaring it would let an author write a
      // guard on a page, pass `validate()`, and have the value silently dropped.
      // `when` is filtered out alongside the guards, for a reason of its own: a
      // page *is* a board, so scoping one to a variant would be a board saying
      // which board it is drawn on. The axis a page declares is `variants`, and
      // `when` names positions along it — the two sit at different levels and a
      // page carrying both would be asking `expandVariants` to filter a page
      // against a name it is itself the source of.
      ...BOX_ATTRIBUTES.filter(
        (name) => name !== 'visibleWhen' && name !== 'enabledWhen' && name !== 'when',
      ),
      ...CONTAINER_ATTRIBUTES,
      'id',
      'title',
      'width',
      'height',
      'viewport',
      'device',
      'centered',
      'uses',
      'states',
      'variants',
    ],
    hasChildren: true,
    description:
      'Root container for a wireframe page. Multiple pages in one .wf file lay out side-by-side on a canvas; use at(x, y) for explicit placement, or omit for auto-flow. Give it uses=<layout> to draw it inside a shared layout instead of restating the shell.',
  },

  // ============================================
  // Structure Definitions
  // ============================================
  layout: {
    category: 'structure',
    attributes: ['states'],
    hasChildren: true,
    description:
      "Define a page shell once, under a name, so pages can reference it with uses= instead of repeating it. Mark where a referencing page's own content goes with slot: `layout app { header { … } slot footer { … } }`.",
  },
  component: {
    category: 'structure',
    attributes: [],
    hasChildren: true,
    description:
      'Define a named, reusable fragment with typed parameters and named slots so screens can invoke it explicitly.',
  },
  use: {
    category: 'structure',
    attributes: [],
    hasChildren: true,
    description:
      'Invoke a reusable component with named typed inputs and optional named slot fills. This is distinct from page uses=, which continues to reference layouts.',
  },
  slot: {
    category: 'structure',
    attributes: [],
    hasChildren: false,
    description:
      'Mark content insertion: bare inside a layout, or named inside a reusable component.',
  },
  repeat: {
    category: 'structure',
    attributes: [],
    hasChildren: true,
    description:
      'Draw the same body a fixed number of times: `repeat 6 { use skeletonCard() }`. The count is positional, and there is deliberately no index variable — every copy is identical, because copies that differ are data binding rather than a wireframe.',
  },
  header: {
    category: 'layout',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES],
    hasChildren: true,
    description: 'Page header section',
  },
  main: {
    category: 'layout',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'scroll'],
    hasChildren: true,
    description: 'Main content section',
  },
  footer: {
    category: 'layout',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES],
    hasChildren: true,
    description: 'Page footer section',
  },
  sidebar: {
    category: 'layout',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'position'],
    hasChildren: true,
    description: 'Side navigation or content area',
  },
  section: {
    category: 'layout',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'title', 'expanded'],
    hasChildren: true,
    description: 'Grouped content section',
  },

  // ============================================
  // Grid Components
  // ============================================
  row: {
    category: 'grid',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES],
    hasChildren: true,
    description: 'Horizontal flex container',
  },
  col: {
    category: 'grid',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      // `span` sizes a grid column and does nothing on any other element, so it
      // is declared on the one element that reads it rather than on every one.
      'span',
      'sm',
      'md',
      'lg',
      'xl',
      'order',
      'scroll',
    ],
    hasChildren: true,
    description: 'Vertical flex container or grid column',
  },
  stack: {
    category: 'grid',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES],
    hasChildren: true,
    description: 'Vertical stack that only takes content height (unlike col which fills)',
  },
  relative: {
    category: 'grid',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES],
    hasChildren: true,
    description: 'Container for overlaying elements with absolute positioning',
  },

  // ============================================
  // Container Components
  // ============================================
  card: {
    category: 'container',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      ...INTERACTIVE_ATTRIBUTES,
      'title',
      'shadow',
    ],
    hasChildren: true,
    description: 'Card container with optional title',
  },
  modal: {
    category: 'container',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'id', 'title'],
    hasChildren: true,
    description: 'Modal dialog overlay',
  },
  drawer: {
    category: 'container',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'id', 'title', 'position'],
    hasChildren: true,
    description: 'Slide-in drawer panel',
  },
  accordion: {
    category: 'container',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'title'],
    hasChildren: true,
    description: 'Collapsible sections container',
  },

  // ============================================
  // Text Components
  // ============================================
  text: {
    category: 'text',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'size', 'weight', 'muted', 'bold'],
    hasChildren: false,
    description: 'Text content',
  },
  title: {
    category: 'text',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'level', 'size'],
    hasChildren: false,
    description: 'Heading element (h1-h6)',
  },
  link: {
    category: 'text',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      ...INTERACTIVE_ATTRIBUTES,
      'href',
      'external',
    ],
    hasChildren: false,
    description: 'Hyperlink text',
  },

  // ============================================
  // Input Components
  // ============================================
  input: {
    category: 'input',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      'label',
      'inputType',
      'placeholder',
      'value',
      'disabled',
      'required',
      'readonly',
      'icon',
      'size',
    ],
    hasChildren: false,
    description: 'Text input field',
  },
  textarea: {
    category: 'input',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      'label',
      'placeholder',
      'value',
      'rows',
      'disabled',
      'required',
    ],
    hasChildren: false,
    description: 'Multi-line text input',
  },
  select: {
    category: 'input',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      'label',
      'placeholder',
      'value',
      'disabled',
      'required',
    ],
    hasChildren: false,
    description: 'Dropdown select',
  },
  checkbox: {
    category: 'input',
    attributes: [...BOX_ATTRIBUTES, 'label', 'checked', 'disabled'],
    hasChildren: false,
    description: 'Checkbox input',
  },
  radio: {
    category: 'input',
    attributes: [...BOX_ATTRIBUTES, 'label', 'name', 'checked', 'disabled'],
    hasChildren: false,
    description: 'Radio button input',
  },
  switch: {
    category: 'input',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'label', 'checked', 'disabled'],
    hasChildren: false,
    description: 'Toggle switch',
  },
  slider: {
    category: 'input',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      'label',
      'min',
      'max',
      'value',
      'step',
      'disabled',
    ],
    hasChildren: false,
    description: 'Range slider',
  },
  button: {
    category: 'input',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      ...INTERACTIVE_ATTRIBUTES,
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
      'size',
      'icon',
      'disabled',
      'loading',
      // Accessibility: give icon-only buttons an accessible name / tooltip
      'aria',
      'aria-label',
      'title',
    ],
    hasChildren: false,
    description: 'Clickable button',
  },

  // ============================================
  // Display Components
  // ============================================
  image: {
    category: 'display',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      ...INTERACTIVE_ATTRIBUTES,
      'src',
      'alt',
    ],
    hasChildren: false,
    description: 'Image placeholder',
  },
  placeholder: {
    category: 'display',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'label'],
    hasChildren: true,
    description: 'Generic placeholder',
  },
  avatar: {
    category: 'display',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      ...INTERACTIVE_ATTRIBUTES,
      'name',
      'size',
    ],
    hasChildren: false,
    description: 'User avatar',
  },
  badge: {
    category: 'display',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      ...INTERACTIVE_ATTRIBUTES,
      'variant',
      'pill',
      'icon',
      'size',
      'anchor',
    ],
    hasChildren: false,
    description: 'Status badge',
  },
  icon: {
    category: 'display',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      ...INTERACTIVE_ATTRIBUTES,
      'name',
      'size',
      'muted',
    ],
    hasChildren: false,
    description: 'Lucide icon',
  },

  // ============================================
  // Data Components
  // ============================================
  table: {
    category: 'data',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'striped', 'bordered', 'hover'],
    hasChildren: false,
    description: 'Data table',
  },
  list: {
    category: 'data',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'ordered', 'none'],
    hasChildren: false,
    description: 'List of items',
  },

  // ============================================
  // Feedback Components
  // ============================================
  alert: {
    category: 'feedback',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'variant', 'dismissible', 'icon'],
    hasChildren: false,
    description: 'Alert message',
  },
  toast: {
    category: 'feedback',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'position', 'variant'],
    hasChildren: false,
    description: 'Toast notification',
  },
  progress: {
    category: 'feedback',
    attributes: [
      ...BOX_ATTRIBUTES,
      ...CONTAINER_ATTRIBUTES,
      'value',
      'max',
      'label',
      'indeterminate',
    ],
    hasChildren: false,
    description: 'Progress bar',
  },
  spinner: {
    category: 'feedback',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'label', 'size'],
    hasChildren: false,
    description: 'Loading spinner',
  },

  // ============================================
  // Overlay Components
  // ============================================
  tooltip: {
    category: 'overlay',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'position'],
    hasChildren: false,
    description: 'Tooltip on hover',
  },
  popover: {
    category: 'overlay',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'title'],
    hasChildren: true,
    description: 'Popover panel',
  },
  dropdown: {
    category: 'overlay',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES],
    hasChildren: false,
    description: 'Dropdown menu',
  },

  // ============================================
  // Navigation Components
  // ============================================
  nav: {
    category: 'navigation',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'vertical'],
    hasChildren: false,
    description: 'Navigation menu',
  },
  tabs: {
    category: 'navigation',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'active'],
    hasChildren: true,
    description: 'Tab navigation',
  },
  breadcrumb: {
    category: 'navigation',
    attributes: [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES],
    hasChildren: false,
    description: 'Breadcrumb navigation',
  },

  // ============================================
  // Divider Component
  // ============================================
  divider: {
    category: 'layout',
    attributes: [...BOX_ATTRIBUTES, 'vertical'],
    hasChildren: false,
    description: 'Horizontal separator',
  },

  // ============================================
  // Annotation Components
  // ============================================
  marker: {
    category: 'annotation',
    attributes: [...BOX_ATTRIBUTES, 'color', 'anchor'],
    hasChildren: false,
    description: 'Number marker for referencing in annotations',
  },
  annotations: {
    category: 'annotation',
    attributes: [...BOX_ATTRIBUTES, 'title'],
    hasChildren: true,
    description: 'Documentation panel for screen specifications',
  },
  item: {
    category: 'annotation',
    attributes: [],
    hasChildren: true,
    description: 'Individual annotation entry with marker number and title',
  },
} as const

/**
 * Every element keyword, in presentation order.
 *
 * `Object.keys` widens to `string[]`; the keys are exactly `GrammarElementName`
 * because {@link COMPONENT_METADATA} is typed as a total record over it.
 */
export const COMPONENT_NAMES = Object.keys(COMPONENT_METADATA) as readonly GrammarElementName[]

/**
 * All valid components in Wireweave DSL
 */
export const COMPONENT_SPECS: readonly ComponentSpec[] = COMPONENT_NAMES.map((name) => ({
  name,
  nodeType: GRAMMAR_ELEMENTS[name],
  ...COMPONENT_METADATA[name],
}))

/**
 * Set of all valid component names for quick lookup
 */
export const VALID_COMPONENT_NAMES: ReadonlySet<string> = new Set(COMPONENT_NAMES)

/**
 * Map of component name to spec for quick lookup
 */
export const COMPONENT_MAP: ReadonlyMap<string, ComponentSpec> = new Map(
  COMPONENT_SPECS.map((comp) => [comp.name, comp]),
)

/**
 * Metadata for the nodes that live only inside another element's block.
 *
 * Kept apart from {@link COMPONENT_METADATA} because these are addressed by node
 * type, not by keyword: `item` names four different shapes depending on the
 * block it appears in, so it cannot be a key in a name-to-spec registry. The
 * `Record<GrammarBlockNodeType, …>` key type makes this total the same way — a
 * new `createBlockNode` type in the grammar fails to typecheck until its
 * metadata is here.
 *
 * `keyword` is what the author writes and what a diagnostic should name, which
 * is why it is stated rather than derived: `NavItem` is a fact about the AST,
 * `item` is the word in the source file.
 */
const BLOCK_NODE_METADATA: Readonly<
  Record<GrammarBlockNodeType, ComponentMetadata & { keyword: string }>
> = {
  NavItem: {
    keyword: 'item',
    category: 'navigation',
    attributes: [...INTERACTIVE_ATTRIBUTES, 'icon', 'href', 'active', 'disabled'],
    hasChildren: false,
    description: 'Navigation entry inside a nav block',
  },
  NavGroup: {
    keyword: 'group',
    category: 'navigation',
    attributes: [],
    hasChildren: true,
    description: 'Labelled group of navigation entries inside a nav block',
  },
  DropdownItem: {
    keyword: 'item',
    category: 'overlay',
    attributes: [...INTERACTIVE_ATTRIBUTES, 'icon', 'href', 'danger', 'disabled'],
    hasChildren: false,
    description: 'Menu entry inside a dropdown',
  },
  ListItem: {
    keyword: 'item',
    category: 'data',
    attributes: ['icon'],
    hasChildren: true,
    description: 'Entry inside a list block, optionally nesting a further list',
  },
}

/**
 * Specs for block-scoped nodes. Deliberately absent from {@link COMPONENT_SPECS}
 * and {@link COMPONENT_MAP}: those answer "what elements can I write here", and
 * `item` is not writable on its own.
 */
export const BLOCK_NODE_SPECS: readonly ComponentSpec[] = GRAMMAR_BLOCK_NODE_TYPES.map(
  (nodeType) => {
    const { keyword, ...metadata } = BLOCK_NODE_METADATA[nodeType]
    return { name: keyword, nodeType, ...metadata }
  },
)

/**
 * Map of AST node type to spec for quick lookup.
 *
 * Covers every node type the parser can emit — elements and block-scoped nodes
 * alike — because a consumer that dispatches on `node.type` has no way to know
 * which category a node came from. `__tests__/grammar-spec-ssot.test.ts` holds
 * that coverage total against the grammar.
 */
export const NODE_TYPE_MAP: ReadonlyMap<string, ComponentSpec> = new Map(
  [...COMPONENT_SPECS, ...BLOCK_NODE_SPECS].map((comp) => [comp.nodeType, comp]),
)

/**
 * Map of AST node type to spec, restricted to elements.
 *
 * The distinction from {@link NODE_TYPE_MAP} is the two different questions a
 * consumer can be asking. "Can this node be resolved at all" — validation,
 * attribute checking — wants every emitted type. "Is this a component the
 * author placed on the screen" — element counts, category tallies, inventories
 * — must exclude block-scoped nodes, or a nav's entries each get counted as
 * screen elements alongside the nav itself.
 */
export const ELEMENT_NODE_TYPE_MAP: ReadonlyMap<string, ComponentSpec> = new Map(
  COMPONENT_SPECS.map((comp) => [comp.nodeType, comp]),
)

/**
 * Spec by element name — the typed lookup consumers derive their own
 * per-element data from (editor tooling, docs generators).
 */
export const COMPONENT_SPEC_BY_NAME: Readonly<Record<GrammarElementName, ComponentSpec>> =
  Object.fromEntries(COMPONENT_SPECS.map((comp) => [comp.name, comp])) as Record<
    GrammarElementName,
    ComponentSpec
  >

/**
 * Get valid attributes for a component (by name or node type)
 */
export function getValidAttributes(componentNameOrType: string): readonly string[] | undefined {
  const spec = COMPONENT_MAP.get(componentNameOrType) ?? NODE_TYPE_MAP.get(componentNameOrType)
  return spec?.attributes
}

/**
 * Check if an attribute is valid for a component
 */
export function isValidAttribute(componentNameOrType: string, attributeName: string): boolean {
  const validAttrs = getValidAttributes(componentNameOrType)
  if (!validAttrs) return false
  return validAttrs.includes(attributeName)
}
