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
  | 'enum';

/**
 * Attribute definition
 */
export interface AttributeSpec {
  /** Attribute name */
  name: string;
  /** Value type */
  type: AttributeValueType;
  /** Enum values (if type is 'enum') */
  values?: readonly string[];
  /** Description for documentation */
  description?: string;
}

/**
 * Component category
 */
export type ComponentCategory =
  | 'layout'
  | 'grid'
  | 'container'
  | 'text'
  | 'input'
  | 'display'
  | 'data'
  | 'feedback'
  | 'overlay'
  | 'navigation';

/**
 * Component definition
 */
export interface ComponentSpec {
  /** Component name (lowercase, as used in DSL) */
  name: string;
  /** AST node type (PascalCase) */
  nodeType: string;
  /** Component category */
  category: ComponentCategory;
  /** Valid attributes for this component (names only, definitions in ATTRIBUTES) */
  attributes: readonly string[];
  /** Whether this component can have children */
  hasChildren: boolean;
  /** Description for documentation */
  description?: string;
}
