/**
 * Component definitions for Wireweave DSL editors
 *
 * The element set and its core metadata (category, attributes, hasChildren,
 * description) come from `@wireweave/core/spec`, which derives them from the
 * grammar. This module only adds what editors need on top — an example snippet
 * and the parent/child hints used for autocomplete and validation.
 *
 * Nothing here re-declares which elements exist: the `Record<GrammarElementName,
 * …>` key type means a new grammar element fails to typecheck until its editor
 * metadata is filled in, and an entry for a non-element is rejected.
 */

import {
  COMPONENT_SPEC_BY_NAME,
  COMPONENT_NAMES,
  type GrammarElementName,
} from '@wireweave/core/spec'
import type { ComponentDef } from './types.js'

/** Editor-only metadata: everything the core spec does not already state. */
interface EditorComponentMeta {
  /** Code example for documentation and hover cards */
  example: string
  /** Valid child components (for autocomplete) */
  validChildren?: string[]
  /** Valid parent components (for validation hints) */
  validParents?: string[]
  /**
   * Attributes accepted by editors but not part of the core spec's attribute
   * list — currently the `at(x, y)` placement shorthand, which the grammar
   * parses as a functional attribute rather than a `name=value` pair.
   */
  extraAttributes?: string[]
}

const EDITOR_METADATA: Readonly<Record<GrammarElementName, EditorComponentMeta>> = {
  // Layout
  page: {
    example: 'page "Login" at(0, 0) viewport="1280x800" { ... }',
    validChildren: ['header', 'main', 'footer', 'sidebar', 'section', 'nav', 'row', 'col', 'card'],
    validParents: [],
    extraAttributes: ['at'],
  },
  header: { example: 'header h=56 border { ... }', validParents: ['page'] },
  main: { example: 'main p=6 scroll { ... }', validParents: ['page'] },
  footer: { example: 'footer h=48 border { ... }', validParents: ['page'] },
  sidebar: { example: 'sidebar w=240 border { ... }', validParents: ['page'] },
  section: { example: 'section "Settings" expanded { ... }' },

  // Structure (reuse definitions — top level only)
  layout: {
    example: 'layout app { header { ... } slot footer { ... } }',
    validParents: [],
  },
  component: {
    example: 'component userbadge { avatar "SW" text "Seungwoo" }',
    validParents: [],
  },
  slot: {
    example: 'slot',
    validParents: ['layout'],
  },
  use: {
    example: 'use userbadge(name="Ada") { ... }',
  },
  repeat: {
    // No `validParents`: `repeat` is a fold, so it belongs wherever its body
    // would have been written out by hand — which is anywhere children go.
    example: 'row gap=4 { repeat 6 { use skeletonCard() } }',
  },

  // Grid
  row: { example: 'row flex gap=4 justify=between { ... }' },
  col: { example: 'col span=6 md=4 { ... }' },
  stack: { example: 'stack gap=4 align=center { ... }' },
  relative: { example: 'relative { button "Submit" marker 1 anchor=top-right }' },

  // Container
  card: { example: 'card "Settings" p=4 shadow=md { ... }' },
  modal: { example: 'modal "Confirm" w=400 { ... }' },
  drawer: { example: 'drawer "Menu" position=left { ... }' },
  accordion: { example: 'accordion { section "FAQ 1" { ... } }' },

  // Text
  text: { example: 'text "Hello World" size=lg weight=bold' },
  title: { example: 'title "Welcome" level=2' },
  link: { example: 'link "Learn more" href="/docs" external' },

  // Input
  input: { example: 'input "Email" inputType=email placeholder="user@example.com" required' },
  textarea: { example: 'textarea "Description" rows=4 placeholder="Enter description..."' },
  select: { example: 'select "Country" ["USA", "Canada", "UK"] placeholder="Select..."' },
  checkbox: { example: 'checkbox "I agree to terms" checked' },
  radio: { example: 'radio "Option A" name="choice" checked' },
  switch: { example: 'switch "Dark mode" checked' },
  slider: { example: 'slider "Volume" min=0 max=100 value=50' },
  button: { example: 'button "Submit" primary icon=send' },

  // Display
  image: { example: 'image w=200 h=150' },
  placeholder: { example: 'placeholder "Banner Image" w=full h=200 { ... }' },
  avatar: { example: 'avatar "John Doe" size=lg' },
  badge: { example: 'badge "New" variant=success pill' },
  icon: { example: 'icon "settings" size=lg' },

  // Data
  table: {
    example:
      'table striped bordered { columns ["Name", "Email"] row ["John", "john@example.com"] }',
  },
  list: { example: 'list ordered ["First", "Second", "Third"]' },

  // Feedback
  alert: { example: 'alert "Changes saved!" variant=success' },
  toast: { example: 'toast "Item deleted" position=bottom-right variant=danger' },
  progress: { example: 'progress value=75 label="Uploading..."' },
  spinner: { example: 'spinner size=lg' },

  // Overlay
  tooltip: { example: 'tooltip "More info" position=top { icon "circle-question-mark" }' },
  popover: { example: 'popover "Details" { ... }' },
  dropdown: { example: 'dropdown { item "Edit" icon=pencil item "Delete" icon=trash danger }' },

  // Navigation
  nav: {
    example:
      'nav [{ label="Home" icon=house active }, { label="Settings" icon=settings }] vertical',
  },
  tabs: { example: 'tabs { tab "General" active { ... } tab "Advanced" { ... } }' },
  breadcrumb: {
    example: 'breadcrumb [{ label="Home" href="/" }, { label="Products" }, { label="Details" }]',
  },

  // Divider
  divider: { example: 'divider my=4' },

  // Annotation
  marker: { example: 'marker 1 anchor=top-right color=blue' },
  annotations: {
    example: 'annotations title="화면 설명" { item 1 "제목" { text "설명" } }',
    validChildren: ['item'],
  },
  item: {
    example: 'item 1 "로그인 버튼" { text "OAuth 연동 예정" }',
    validParents: ['annotations'],
  },
}

function toComponentDef(name: GrammarElementName): ComponentDef {
  const spec = COMPONENT_SPEC_BY_NAME[name]
  const { example, validChildren, validParents, extraAttributes } = EDITOR_METADATA[name]

  return {
    name: spec.name,
    nodeType: spec.nodeType,
    category: spec.category,
    attributes: [...spec.attributes, ...(extraAttributes ?? [])],
    hasChildren: spec.hasChildren,
    description: spec.description,
    example,
    ...(validChildren ? { validChildren } : {}),
    ...(validParents ? { validParents } : {}),
  }
}

/**
 * All components in Wireweave DSL
 */
export const ALL_COMPONENTS: ComponentDef[] = COMPONENT_NAMES.map(toComponentDef)

/**
 * Map of component name to definition for quick lookup
 */
export const COMPONENT_MAP: Map<string, ComponentDef> = new Map(
  ALL_COMPONENTS.map((comp) => [comp.name, comp]),
)

/**
 * Map of AST node type to definition for quick lookup
 */
export const NODE_TYPE_MAP: Map<string, ComponentDef> = new Map(
  ALL_COMPONENTS.map((comp) => [comp.nodeType, comp]),
)

/**
 * Set of all valid component names
 */
export const VALID_COMPONENT_NAMES: ReadonlySet<string> = new Set(
  ALL_COMPONENTS.map((comp) => comp.name),
)
