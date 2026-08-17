/**
 * Attribute definitions for Wireweave DSL editors
 *
 * The attribute vocabulary — every name, its value type, enum values, and
 * description — comes from `@wireweave/core/spec`, which is the DSL's
 * specification. This module adds only what editors need on top: a code example
 * per attribute. Nothing here re-declares which attributes exist, so an
 * attribute can be introduced in exactly one place.
 *
 * The two exceptions are quarantined in `core-spec-gaps.ts`, which documents why
 * each one cannot be derived.
 */

import {
  ATTRIBUTE_SPECS,
  BOX_ATTRIBUTES as SPEC_BOX_ATTRIBUTES,
  CONTAINER_ATTRIBUTES as SPEC_CONTAINER_ATTRIBUTES,
} from '@wireweave/core/spec'
import type { AttributeSpec } from '@wireweave/core/spec'

import { EDITOR_ONLY_ATTRIBUTES, PENDING_CORE_ATTRIBUTES } from './core-spec-gaps.js'
import type { AttributeDef } from './types.js'

/**
 * Attributes every element honours, because each renderer turns them into that
 * element's own box.
 */
export const BOX_ATTRIBUTES: readonly string[] = SPEC_BOX_ATTRIBUTES

/**
 * Attributes only the elements that render a flex container honour.
 *
 * Kept separate from {@link BOX_ATTRIBUTES} rather than merged into one "common"
 * list, which is the shape core replaced. The merged list said every element
 * accepts `direction` and `bg`; leaf controls build their own markup and read
 * neither, so offering them there completed attributes that render nothing.
 * Re-forming the union here would restore exactly that, one layer further out.
 */
export const CONTAINER_ATTRIBUTES: readonly string[] = SPEC_CONTAINER_ATTRIBUTES

/**
 * Editor-only metadata: a usage example per spec attribute.
 *
 * Deliberately a total map. `toAttributeDef` throws when an attribute has no
 * example, so a new attribute in the core spec cannot reach an editor without
 * one — the same forcing function the element layer gets from its key type.
 */
const ATTRIBUTE_EXAMPLES: Readonly<Record<string, string>> = {
  // Spacing
  p: 'p=4',
  px: 'px=4',
  py: 'py=4',
  pt: 'pt=4',
  pr: 'pr=4',
  pb: 'pb=4',
  pl: 'pl=4',
  m: 'm=4',
  mx: 'mx=auto',
  my: 'my=4',
  mt: 'mt=4',
  mr: 'mr=4',
  mb: 'mb=4',
  ml: 'ml=4',
  gap: 'gap=4',

  // Size
  w: 'w=full',
  h: 'h=full',
  width: 'width=400',
  height: 'height=300',
  minW: 'minW=200',
  maxW: 'maxW=600',
  minH: 'minH=100',
  maxH: 'maxH=400',

  // Flex / Grid
  flex: 'flex',
  direction: 'direction=column',
  justify: 'justify=center',
  align: 'align=center',
  wrap: 'wrap',
  span: 'span=6',
  sm: 'sm=6',
  md: 'md=4',
  lg: 'lg=3',
  xl: 'xl=2',
  order: 'order=1',

  // Position
  x: 'x=100',
  y: 'y=50',
  position: 'position=left',

  // Visual
  border: 'border',
  rounded: 'rounded',
  shadow: 'shadow=md',
  bg: 'bg=muted',

  // Text
  size: 'size=lg',
  weight: 'weight=bold',
  level: 'level=2',
  muted: 'muted',
  bold: 'bold',

  // Button variants
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'danger',

  // Status variant
  variant: 'variant=success',

  // Form
  inputType: 'inputType=email',
  placeholder: 'placeholder="Enter text"',
  value: 'value="default"',
  label: 'label="Name"',
  name: 'name="field"',
  required: 'required',
  disabled: 'disabled',
  readonly: 'readonly',
  checked: 'checked',
  loading: 'loading',
  rows: 'rows=4',
  min: 'min=0',
  max: 'max=100',
  step: 'step=1',

  // Content
  title: 'title="Title"',
  src: 'src="/image.png"',
  alt: 'alt="Image"',
  href: 'href="/path"',
  icon: 'icon="home"',
  external: 'external',

  // Accessibility
  aria: 'aria="Close dialog"',
  'aria-label': 'aria-label="Close dialog"',

  // State
  active: 'active=0',
  expanded: 'expanded',
  centered: 'centered',
  vertical: 'vertical',
  scroll: 'scroll',

  // Feedback
  dismissible: 'dismissible',
  indeterminate: 'indeterminate',
  pill: 'pill',

  // Data
  striped: 'striped',
  bordered: 'bordered',
  hover: 'hover',
  ordered: 'ordered',
  none: 'none',

  // Page / viewport
  id: 'id="dashboard"',
  viewport: 'viewport="1440x900"',
  device: 'device="iphone14"',

  // Reuse
  uses: 'uses="app-shell"',

  // Interaction
  navigate: 'navigate="Dashboard"',
  opens: 'opens="settings-modal"',
  toggles: 'toggles="filter-drawer"',
  action: 'action=back',

  // Typed state and events
  states: 'states=[{ name=allowed, valueType=boolean, initial=false }]',
  on: 'on={ event=click, effects=[{ kind=toggle, state=allowed }] }',
  visibleWhen: 'visibleWhen={ state=allowed, equals=true }',
  enabledWhen: 'enabledWhen={ state=allowed, equals=true }',

  // Annotation
  anchor: 'anchor=top-right',
  color: 'color=blue',
}

function toAttributeDef(spec: AttributeSpec): AttributeDef {
  const example = ATTRIBUTE_EXAMPLES[spec.name]
  if (example === undefined) {
    throw new Error(
      `[@wireweave/language-data] No editor example for attribute "${spec.name}". ` +
        `Add one to ATTRIBUTE_EXAMPLES in src/attributes.ts.`,
    )
  }
  if (spec.description === undefined) {
    throw new Error(
      `[@wireweave/language-data] Attribute "${spec.name}" has no description in the core spec.`,
    )
  }
  return {
    name: spec.name,
    type: spec.type,
    ...(spec.values ? { values: [...spec.values] } : {}),
    description: spec.description,
    example,
  }
}

/**
 * All attributes editors offer: the DSL specification, plus the two documented
 * gap categories in `core-spec-gaps.ts`.
 */
export const ATTRIBUTES: AttributeDef[] = [
  ...ATTRIBUTE_SPECS.map(toAttributeDef),
  ...EDITOR_ONLY_ATTRIBUTES,
  ...PENDING_CORE_ATTRIBUTES,
]

/**
 * Map of attribute name to definition for quick lookup
 */
export const ATTRIBUTE_MAP: Map<string, AttributeDef> = new Map(
  ATTRIBUTES.map((attr) => [attr.name, attr]),
)

/**
 * Set of all valid attribute names
 */
export const VALID_ATTRIBUTE_NAMES: ReadonlySet<string> = new Set(
  ATTRIBUTES.map((attr) => attr.name),
)
