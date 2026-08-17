/**
 * @wireweave/language-data
 *
 * Language definitions and metadata for Wireweave DSL editor integrations.
 *
 * The element set comes from `@wireweave/core/spec` (which the grammar
 * generates); this package layers editor metadata on top, so editors recognize
 * a new grammar element without any hand-maintained name list.
 *
 * Provides:
 * - Component and attribute definitions
 * - Editor utilities (autocomplete, validation hints)
 * - Monaco language configuration (coming soon)
 */

// Types
export type { ComponentDef, AttributeDef, ComponentCategory, AttributeValueType } from './types.js'

// Data
export {
  ALL_COMPONENTS,
  COMPONENT_MAP,
  NODE_TYPE_MAP,
  VALID_COMPONENT_NAMES,
} from './components.js'
export {
  ATTRIBUTES,
  ATTRIBUTE_MAP,
  BOX_ATTRIBUTES,
  CONTAINER_ATTRIBUTES,
  VALID_ATTRIBUTE_NAMES,
} from './attributes.js'
export { CATEGORY_LABELS, VALUE_KEYWORDS, COMMON_NUMBERS, SPACING_SCALE } from './keywords.js'

// Utilities
export {
  getComponent,
  getComponentByNodeType,
  getAttribute,
  getValidChildren,
  isValidChild,
  getComponentAttributes,
  getComponentsByCategory,
  getAttributeTypeLabel,
  formatAttributeValues,
  isComponent,
  isAttribute,
  getComponentNames,
  getAttributeNames,
  getCategories,
} from './utils.js'
