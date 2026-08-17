/**
 * Types for Wireweave DSL Specification
 */

/**
 * Attribute value type
 */
export type AttributeValueType =
  | 'boolean'
  | 'number'
  | 'string'
  | 'string[]'
  | 'object'
  | 'object[]'
  | 'enum'

/**
 * Attribute definition
 */
export interface AttributeSpec {
  /** Attribute name */
  name: string
  /** Value type */
  type: AttributeValueType
  /**
   * Value keywords this attribute accepts, machine-readable.
   *
   * For `type: 'enum'` these are the whole domain. For the attributes whose
   * value is *either* a keyword or something open-ended — `w="full"` or
   * `w=240`, bare `wrap` or `wrap=nowrap` — they are the keyword half, and
   * {@link AttributeSpec.type} names the other half. Listing them here rather
   * than inside the description sentence is what lets an editor complete them.
   */
  values?: readonly string[]
  /** Description for documentation */
  description?: string
}

/**
 * A narrowing of one registry attribute, scoped to one element.
 *
 * {@link AttributeSpec} is a flat namespace keyed by attribute name alone, so it
 * can only state what an attribute means everywhere at once. Some facts are not
 * of that shape: `name` on `icon` is a glyph out of a closed 1.6k-name set,
 * while `name` on `radio` is whatever string groups the radios. An override
 * carries the narrower fact for the one element it holds on, and the wider one
 * stays in the registry for everybody else.
 *
 * Narrowing only, in both directions:
 * - `name` is absent from this type, so an override cannot rename an attribute
 *   and therefore cannot bring a name into existence that the registry has not
 *   already declared.
 * - `values` may only shrink an existing domain, and `type` may only move to
 *   `enum` from an open one. `spec-override-containment.test.ts` in
 *   `packages/language-data` holds both, because an override that widened would
 *   be a second registry hiding behind a lookup function.
 */
export type AttributeOverride = Omit<Partial<AttributeSpec>, 'name'>

/**
 * Component category
 *
 * `structure` is the odd one out: its elements (`layout`, `component`, `slot`)
 * declare reusable structure rather than draw anything, so editors and docs
 * must not offer them as ordinary content the way they offer a `card`.
 */
export type ComponentCategory =
  | 'structure'
  | 'layout'
  | 'grid'
  | 'container'
  | 'text'
  | 'input'
  | 'display'
  | 'data'
  | 'feedback'
  | 'overlay'
  | 'navigation'
  | 'annotation'

/**
 * Component definition
 */
export interface ComponentSpec {
  /** Component name (lowercase, as used in DSL) */
  name: string
  /** AST node type (PascalCase) */
  nodeType: string
  /** Component category */
  category: ComponentCategory
  /** Valid attributes for this component (names only, definitions in ATTRIBUTES) */
  attributes: readonly string[]
  /** Whether this component can have children */
  hasChildren: boolean
  /** Description for documentation */
  description: string
}
