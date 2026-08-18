/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Derived from `src/grammar/wireframe.peggy` by `scripts/extract-grammar-elements.mjs`
 * (`pnpm build:spec`). The grammar is the single source of truth for the DSL
 * element set; edit the grammar and regenerate, never this file.
 */

/** Every DSL element keyword, mapped to the AST node type its rule emits. */
export const GRAMMAR_ELEMENTS = {
  page: 'Page',
  layout: 'Layout',
  component: 'Component',
  use: 'ComponentUse',
  slot: 'Slot',
  repeat: 'Repeat',
  header: 'Header',
  main: 'Main',
  footer: 'Footer',
  sidebar: 'Sidebar',
  row: 'Row',
  col: 'Col',
  stack: 'Stack',
  relative: 'Relative',
  card: 'Card',
  modal: 'Modal',
  drawer: 'Drawer',
  accordion: 'Accordion',
  section: 'Section',
  text: 'Text',
  title: 'Title',
  link: 'Link',
  button: 'Button',
  input: 'Input',
  textarea: 'Textarea',
  select: 'Select',
  checkbox: 'Checkbox',
  radio: 'Radio',
  switch: 'Switch',
  slider: 'Slider',
  image: 'Image',
  placeholder: 'Placeholder',
  avatar: 'Avatar',
  badge: 'Badge',
  icon: 'Icon',
  table: 'Table',
  list: 'List',
  alert: 'Alert',
  toast: 'Toast',
  progress: 'Progress',
  spinner: 'Spinner',
  tooltip: 'Tooltip',
  popover: 'Popover',
  dropdown: 'Dropdown',
  nav: 'Nav',
  tabs: 'Tabs',
  breadcrumb: 'Breadcrumb',
  divider: 'Divider',
  marker: 'Marker',
  annotations: 'Annotations',
  item: 'AnnotationItem',
} as const

/** Union of every DSL element keyword. */
export type GrammarElementName = keyof typeof GRAMMAR_ELEMENTS

/** Union of every AST node type an element rule emits. */
export type GrammarNodeType = (typeof GRAMMAR_ELEMENTS)[GrammarElementName]

/**
 * Node types that exist only inside another element's block.
 *
 * `nav { item … }` and `nav { group { … } }` produce real nodes — they carry
 * attributes, hold interaction intents and need a source location — but their
 * keywords are not elements: `item` means something different in `nav`,
 * `list`, `dropdown` and `annotations`, so it cannot map to one node type the
 * way {@link GRAMMAR_ELEMENTS} entries do. They are addressed by node type
 * instead, and the spec registry gives them their metadata that way.
 */
export const GRAMMAR_BLOCK_NODE_TYPES = [
  'ListItem',
  'DropdownItem',
  'NavGroup',
  'NavItem',
] as const

/** Union of every block-scoped node type. */
export type GrammarBlockNodeType = (typeof GRAMMAR_BLOCK_NODE_TYPES)[number]

/**
 * The grammar's `ChildKeyword` set: keywords that start a child element and so
 * cannot be parsed back as attribute names (`AttributeName = !ChildKeyword Identifier`).
 * It also covers block-scoped keywords (`columns`, `tab`, `group`) that are not
 * elements of their own, and omits element keywords that are deliberately
 * context-sensitive (`title`, `placeholder`, `icon` double as attribute names).
 */
export const GRAMMAR_CHILD_KEYWORDS = [
  'page',
  'header',
  'main',
  'footer',
  'sidebar',
  'row',
  'col',
  'stack',
  'relative',
  'card',
  'modal',
  'drawer',
  'accordion',
  'section',
  'text',
  'link',
  'button',
  'input',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'image',
  'avatar',
  'badge',
  'table',
  'columns',
  'list',
  'item',
  'alert',
  'toast',
  'progress',
  'spinner',
  'tooltip',
  'popover',
  'dropdown',
  'divider',
  'nav',
  'tabs',
  'tab',
  'breadcrumb',
  'group',
  'marker',
  'annotations',
  'repeat',
  'layout',
  'component',
  'use',
  'fill',
  'slot',
] as const
