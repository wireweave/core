/**
 * Recorded shape of the authorable surface: which attributes each element takes.
 *
 * This is the derived set the two closure gates argue over, written down. It is
 * a snapshot, not a target — nothing here is a claim that the surface is right,
 * only a claim about what it currently is.
 *
 * **Both directions are failures.** A surface that grows admits attributes
 * nobody reviewed; a surface that shrinks silently withdraws authorable syntax
 * from documents already written against it. The second is the one nothing else
 * catches: `span` left thirty-nine elements in one refactor and every gate in
 * this package stayed green, because corpus validation *improved* — one file
 * used `span`, so the whole withdrawal cost a single error, buried under an
 * unrelated twenty-seven-error repair. A total that moves for two reasons at
 * once cannot report either, and a corpus is an accidental sample of the
 * language rather than a description of it.
 *
 * Recorded structurally rather than as a flat list per element, because the
 * structure is where changes actually happen. `BOX_ATTRIBUTES` is spread into
 * most elements, so a name entering or leaving it shows here as one edited line
 * instead of thirty-nine identical ones — and one line is legible enough to
 * argue with, which is the entire purpose of writing it down.
 *
 * **Updating**: change these entries in the same commit as the spec change, and
 * say which direction in the message. Regenerating this file to match whatever
 * the spec now says would make the gate a freshness check, which proves the two
 * files agree and nothing about whether the change was intended.
 */

/**
 * The shared lists, verbatim.
 *
 * Held separately from the element entries because they are the high-leverage
 * surface: an edit here moves every element that spreads the list.
 */
export const SHARED_ATTRIBUTE_LISTS = {
  BOX: [
    'visibleWhen',
    'enabledWhen',
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
    'w',
    'h',
    'minW',
    'maxW',
    'minH',
    'maxH',
    'x',
    'y',
  ],
  CONTAINER: ['flex', 'direction', 'justify', 'align', 'wrap', 'bg', 'border', 'rounded'],
  INTERACTIVE: ['navigate', 'opens', 'toggles', 'action', 'on'],
} as const

/** Which shared lists an element spreads, and what it declares beyond them. */
export interface SurfaceEntry {
  shared: readonly (keyof typeof SHARED_ATTRIBUTE_LISTS)[]
  own: readonly string[]
}

/**
 * Writable elements. `component`, `use`, `slot` and `item` take no attributes
 * at all — they are structure, not styled surface. `layout` takes only
 * `states`, which declares shared state rather than styling the shell.
 */
export const ELEMENT_SURFACE: Readonly<Record<string, SurfaceEntry>> = {
  // `page` spreads BOX minus `visibleWhen` / `enabledWhen`: a guarded outcome is
  // emitted by the component render path and toggled by the site runtime, and a
  // page is the board that path renders into, so a guard declared here would be
  // accepted by `validate()` and dropped at render. Recorded as the explicit
  // list because the entry is no longer the BOX spread.
  page: {
    shared: ['CONTAINER'],
    own: [
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
      'w',
      'h',
      'minW',
      'maxW',
      'minH',
      'maxH',
      'x',
      'y',
      'id',
      'title',
      'width',
      'height',
      'viewport',
      'device',
      'centered',
      'uses',
      'states',
    ],
  },
  layout: { shared: [], own: ['states'] },
  component: { shared: [], own: [] },
  use: { shared: [], own: [] },
  slot: { shared: [], own: [] },
  header: { shared: ['BOX', 'CONTAINER'], own: [] },
  main: { shared: ['BOX', 'CONTAINER'], own: ['scroll'] },
  footer: { shared: ['BOX', 'CONTAINER'], own: [] },
  sidebar: { shared: ['BOX', 'CONTAINER'], own: ['position'] },
  section: { shared: ['BOX', 'CONTAINER'], own: ['title', 'expanded'] },
  row: { shared: ['BOX', 'CONTAINER'], own: [] },
  col: { shared: ['BOX', 'CONTAINER'], own: ['span', 'sm', 'md', 'lg', 'xl', 'order', 'scroll'] },
  stack: { shared: ['BOX', 'CONTAINER'], own: [] },
  relative: { shared: ['BOX', 'CONTAINER'], own: [] },
  card: { shared: ['BOX', 'CONTAINER', 'INTERACTIVE'], own: ['title', 'shadow'] },
  modal: { shared: ['BOX', 'CONTAINER'], own: ['id', 'title'] },
  drawer: { shared: ['BOX', 'CONTAINER'], own: ['id', 'title', 'position'] },
  accordion: { shared: ['BOX', 'CONTAINER'], own: ['title'] },
  text: { shared: ['BOX', 'CONTAINER'], own: ['size', 'weight', 'muted', 'bold'] },
  title: { shared: ['BOX', 'CONTAINER'], own: ['level', 'size'] },
  link: { shared: ['BOX', 'CONTAINER', 'INTERACTIVE'], own: ['href', 'external'] },
  input: {
    shared: ['BOX', 'CONTAINER'],
    own: [
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
  },
  textarea: {
    shared: ['BOX', 'CONTAINER'],
    own: ['label', 'placeholder', 'value', 'rows', 'disabled', 'required'],
  },
  select: {
    shared: ['BOX', 'CONTAINER'],
    own: ['label', 'placeholder', 'value', 'disabled', 'required'],
  },
  checkbox: { shared: ['BOX'], own: ['label', 'checked', 'disabled'] },
  radio: { shared: ['BOX'], own: ['label', 'name', 'checked', 'disabled'] },
  switch: { shared: ['BOX', 'CONTAINER'], own: ['label', 'checked', 'disabled'] },
  slider: {
    shared: ['BOX', 'CONTAINER'],
    own: ['label', 'min', 'max', 'value', 'step', 'disabled'],
  },
  button: {
    shared: ['BOX', 'CONTAINER', 'INTERACTIVE'],
    own: [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
      'size',
      'icon',
      'disabled',
      'loading',
      'aria',
      'aria-label',
      'title',
    ],
  },
  image: { shared: ['BOX', 'CONTAINER', 'INTERACTIVE'], own: ['src', 'alt'] },
  placeholder: { shared: ['BOX', 'CONTAINER'], own: ['label'] },
  avatar: { shared: ['BOX', 'CONTAINER', 'INTERACTIVE'], own: ['name', 'size'] },
  badge: {
    shared: ['BOX', 'CONTAINER', 'INTERACTIVE'],
    own: ['variant', 'pill', 'icon', 'size', 'anchor'],
  },
  icon: { shared: ['BOX', 'CONTAINER', 'INTERACTIVE'], own: ['name', 'size', 'muted'] },
  table: { shared: ['BOX', 'CONTAINER'], own: ['striped', 'bordered', 'hover'] },
  list: { shared: ['BOX', 'CONTAINER'], own: ['ordered', 'none'] },
  alert: { shared: ['BOX', 'CONTAINER'], own: ['variant', 'dismissible', 'icon'] },
  toast: { shared: ['BOX', 'CONTAINER'], own: ['position', 'variant'] },
  progress: { shared: ['BOX', 'CONTAINER'], own: ['value', 'max', 'label', 'indeterminate'] },
  spinner: { shared: ['BOX', 'CONTAINER'], own: ['label', 'size'] },
  tooltip: { shared: ['BOX', 'CONTAINER'], own: ['position'] },
  popover: { shared: ['BOX', 'CONTAINER'], own: ['title'] },
  dropdown: { shared: ['BOX', 'CONTAINER'], own: [] },
  nav: { shared: ['BOX', 'CONTAINER'], own: ['vertical'] },
  tabs: { shared: ['BOX', 'CONTAINER'], own: ['active'] },
  breadcrumb: { shared: ['BOX', 'CONTAINER'], own: [] },
  divider: { shared: ['BOX'], own: ['vertical'] },
  marker: { shared: ['BOX'], own: ['color', 'anchor'] },
  annotations: { shared: ['BOX'], own: ['title'] },
  item: { shared: [], own: [] },
}

/**
 * Block nodes, keyed by AST node type.
 *
 * Deliberately separate: these are writable only inside a parent element, so
 * they are absent from `COMPONENT_SPECS`, and a walk over elements alone cannot
 * see them. That blind spot is what let a spec reference an attribute no
 * registry declared until `spec-reference-closure.test.ts` started looking here.
 */
export const BLOCK_SURFACE: Readonly<Record<string, SurfaceEntry>> = {
  ListItem: { shared: [], own: ['icon'] },
  DropdownItem: { shared: ['INTERACTIVE'], own: ['icon', 'href', 'danger', 'disabled'] },
  NavGroup: { shared: [], own: [] },
  NavItem: { shared: ['INTERACTIVE'], own: ['icon', 'href', 'active', 'disabled'] },
}
