/**
 * Wireweave DSL Specification
 *
 * The authoritative specification for Wireweave DSL: every valid element, its
 * attributes, and its attribute value types.
 *
 * The element set itself is owned by the grammar (`src/grammar/wireframe.peggy`)
 * and re-exported here through `grammar-elements.generated`; this module adds
 * the metadata layer on top. Every consumer — printer, validation, editor
 * tooling — derives its element list from here, so there is exactly one place
 * an element can be introduced: the grammar.
 *
 * Attributes come in two layers, and which one to read depends on what the
 * consumer knows. `attributes.ts` answers by name alone, for tooling that has a
 * word and no element. `attribute-overrides.ts` answers by element and name
 * together, through `attributeFor`, for tooling that has both — and holds the
 * facts that are only true on one element, which the flat registry has no way
 * to express.
 */

export * from './grammar-elements.generated'
export * from './icon-names.generated'
export * from './types'
export * from './components'
export * from './attributes'
export * from './attribute-overrides'
