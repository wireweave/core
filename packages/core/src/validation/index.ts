/**
 * Wireweave DSL Validation
 *
 * Validates AST nodes against the DSL specification.
 * Checks that all attributes are valid for their respective components.
 */

import type {
  WireframeDocument,
  AnyNode,
  ComponentDefinitionNode,
  ComponentUseNode,
} from '../ast/types'
import { NODE_TYPE_MAP } from '../spec/components'
import { VALID_ATTRIBUTE_NAMES } from '../spec/attributes'

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error message */
  message: string
  /** Path to the invalid node (e.g., "pages[0].children[1]") */
  path: string
  /** Node type where error occurred */
  nodeType: string
  /** Invalid attribute name (if applicable) */
  attribute?: string
  /** Source location (if available) */
  location?: {
    line: number
    column: number
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the AST is valid */
  valid: boolean
  /** List of validation errors */
  errors: ValidationError[]
  /** Summary error message (if invalid) */
  errorSummary?: string
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** If true, stop at first error */
  stopOnFirstError?: boolean
  /** Maximum number of errors to collect */
  maxErrors?: number
}

// Meta attributes that are not user-facing (internal AST properties)
const META_ATTRIBUTES = new Set([
  'type',
  'loc',
  'children',
  'content',
  'items',
  'columns',
  'rows',
  'options',
  'parameters',
  'inputs',
  'fills',
  'instanceId',
  'targetId',
])

// Positional values written by the grammar rather than by `name=value`.
// `name` remains a real attribute on icon/avatar/radio, so this is scoped to
// layout definitions instead of being added to META_ATTRIBUTES globally.
const POSITIONAL_PROPS: Readonly<Record<string, readonly string[]>> = {
  Layout: ['name'],
  Component: ['name'],
  ComponentUse: ['name', 'namespace'],
  Slot: ['name'],
}

const STRUCTURAL_NODE_TYPES = new Set(['item', 'group', 'divider'])

function checkComponentContracts(
  ast: WireframeDocument,
  addError: (error: ValidationError) => boolean,
): boolean {
  const definitions = new Map<string, ComponentDefinitionNode>()
  for (const child of ast.children) {
    if (child.type === 'Component' && !definitions.has(child.name)) {
      definitions.set(child.name, child)
    }
  }

  const report = (node: AnyNode, path: string, message: string, attribute: string): boolean =>
    addError({
      message,
      path,
      nodeType: node.type,
      attribute,
      location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
    })
  const childrenOf = (node: AnyNode): readonly AnyNode[] =>
    'children' in node && Array.isArray(node.children) ? (node.children as AnyNode[]) : []

  for (let index = 0; index < ast.children.length; index++) {
    const definition = ast.children[index]
    if (definition?.type !== 'Component') continue

    const parameters = new Set<string>()
    for (const parameter of definition.parameters ?? []) {
      if (
        parameters.has(parameter.name) &&
        !report(
          definition,
          `definitions[${index}]`,
          `Duplicate component parameter "${parameter.name}" in component "${definition.name}"`,
          'parameters',
        )
      ) {
        return false
      }
      parameters.add(parameter.name)
    }

    const slots = new Set<string>()
    const inspect = (node: AnyNode, path: string): boolean => {
      if (node.type === 'ComponentUse') return true
      if (node.type === 'Slot') {
        const name = node.name?.trim()
        if (name === undefined || name.length === 0) {
          return report(
            node,
            path,
            `Component "${definition.name}" contains an unnamed slot`,
            'name',
          )
        }
        if (slots.has(name)) {
          return report(
            node,
            path,
            `Duplicate component slot "${name}" in component "${definition.name}"`,
            'name',
          )
        }
        slots.add(name)
      }
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'children' || typeof value !== 'string') continue
        const name = /^\$([a-zA-Z_][a-zA-Z0-9_-]*)$/.exec(value)?.[1]
        if (
          name !== undefined &&
          !parameters.has(name) &&
          !report(
            node,
            path,
            `Unknown component parameter reference "$${name}" in component "${definition.name}"`,
            key,
          )
        ) {
          return false
        }
      }
      const children = childrenOf(node)
      for (let childIndex = 0; childIndex < children.length; childIndex++) {
        const child = children[childIndex]
        if (child && !inspect(child, `${path}.children[${childIndex}]`)) return false
      }
      return true
    }
    for (let childIndex = 0; childIndex < definition.children.length; childIndex++) {
      const child = definition.children[childIndex]
      if (child && !inspect(child, `definitions[${index}].children[${childIndex}]`)) return false
    }
  }

  const validateUse = (use: ComponentUseNode, path: string): boolean => {
    const definition = use.namespace === undefined ? definitions.get(use.name) : undefined
    if (definition === undefined) {
      return (
        use.namespace !== undefined || report(use, path, `Unknown component "${use.name}"`, 'name')
      )
    }

    const declaredParameters = definition.parameters ?? []
    const parameters = new Map(declaredParameters.map((item) => [item.name, item.valueType]))
    for (const parameter of declaredParameters) {
      if (
        !(parameter.name in use.inputs) &&
        !report(
          use,
          path,
          `Missing input "${parameter.name}" for component "${use.name}"`,
          'inputs',
        )
      ) {
        return false
      }
    }
    for (const [name, value] of Object.entries(use.inputs)) {
      const expected = parameters.get(name)
      if (
        expected === undefined &&
        !report(use, path, `Unknown input "${name}" for component "${use.name}"`, 'inputs')
      ) {
        return false
      }
      if (
        expected !== undefined &&
        typeof value !== expected &&
        !report(
          use,
          path,
          `Input "${name}" for component "${use.name}" must be ${expected}, received ${typeof value}`,
          'inputs',
        )
      ) {
        return false
      }
    }

    const slots = new Set<string>()
    const collectSlots = (node: AnyNode): void => {
      if (node.type === 'ComponentUse') return
      if (node.type === 'Slot' && node.name !== undefined) slots.add(node.name)
      for (const child of childrenOf(node)) collectSlots(child)
    }
    for (const child of definition.children) collectSlots(child)

    const fills = new Set<string>()
    for (const fill of use.fills) {
      if (
        fills.has(fill.name) &&
        !report(use, path, `Duplicate fill "${fill.name}" for component "${use.name}"`, 'fills')
      ) {
        return false
      }
      fills.add(fill.name)
      if (
        !slots.has(fill.name) &&
        !report(use, path, `Unknown slot "${fill.name}" for component "${use.name}"`, 'fills')
      ) {
        return false
      }
    }
    for (const slot of slots) {
      if (
        !fills.has(slot) &&
        !report(use, path, `Missing fill for slot "${slot}" in component "${use.name}"`, 'fills')
      ) {
        return false
      }
    }
    return true
  }

  const visit = (node: AnyNode, path: string): boolean => {
    if (node.type === 'ComponentUse') {
      if (!validateUse(node, path)) return false
      for (let fillIndex = 0; fillIndex < node.fills.length; fillIndex++) {
        const fill = node.fills[fillIndex]
        if (fill === undefined) continue
        for (let childIndex = 0; childIndex < fill.children.length; childIndex++) {
          const child = fill.children[childIndex]
          if (child && !visit(child, `${path}.fills[${fillIndex}].children[${childIndex}]`)) {
            return false
          }
        }
      }
    }
    const children = childrenOf(node)
    for (let childIndex = 0; childIndex < children.length; childIndex++) {
      const child = children[childIndex]
      if (child && !visit(child, `${path}.children[${childIndex}]`)) return false
    }
    return true
  }

  for (let index = 0; index < ast.children.length; index++) {
    const child = ast.children[index]
    if (child && !visit(child, `children[${index}]`)) return false
  }
  return true
}

/**
 * Validate a Wireweave AST document
 *
 * @param ast - The parsed AST document
 * @param options - Validation options
 * @returns Validation result with errors if invalid
 */
export function validate(
  ast: WireframeDocument,
  options: ValidationOptions = {},
): ValidationResult {
  const errors: ValidationError[] = []
  const maxErrors = options.maxErrors ?? 100

  function addError(error: ValidationError): boolean {
    errors.push(error)
    if (options.stopOnFirstError || errors.length >= maxErrors) {
      return false // Stop validation
    }
    return true // Continue validation
  }

  function validateNode(node: AnyNode, path: string): boolean {
    const nodeType = node.type
    const spec = NODE_TYPE_MAP.get(nodeType)

    if (!spec) {
      if (STRUCTURAL_NODE_TYPES.has(nodeType)) return true
      // Unknown node type - this shouldn't happen if parser is correct
      return addError({
        message: `Unknown component type: ${nodeType}`,
        path,
        nodeType,
        location: node.loc
          ? { line: node.loc.start.line, column: node.loc.start.column }
          : undefined,
      })
    }

    // Check all attributes on this node
    const validAttrs = new Set(spec.attributes)
    const positional = POSITIONAL_PROPS[nodeType]

    for (const key of Object.keys(node)) {
      // Skip meta attributes
      if (META_ATTRIBUTES.has(key)) continue
      if (positional?.includes(key)) continue

      // Check if attribute is valid for this component
      if (!validAttrs.has(key)) {
        // Check if it's a valid attribute at all (might be on wrong component)
        const isKnownAttr = VALID_ATTRIBUTE_NAMES.has(key)
        const message = isKnownAttr
          ? `Attribute "${key}" is not valid on ${spec.name}. Valid attributes: ${spec.attributes.slice(0, 10).join(', ')}${spec.attributes.length > 10 ? '...' : ''}`
          : `Unknown attribute "${key}" on ${spec.name}`

        const shouldContinue = addError({
          message,
          path,
          nodeType,
          attribute: key,
          location: node.loc
            ? { line: node.loc.start.line, column: node.loc.start.column }
            : undefined,
        })

        if (!shouldContinue) return false
      }
    }

    // Recursively validate children
    if ('children' in node && Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as AnyNode
        if (child && typeof child === 'object' && 'type' in child) {
          const shouldContinue = validateNode(child, `${path}.children[${i}]`)
          if (!shouldContinue) return false
        }
      }
    }

    if (node.type === 'ComponentUse') {
      for (let fillIndex = 0; fillIndex < node.fills.length; fillIndex++) {
        const fill = node.fills[fillIndex]
        if (fill === undefined) continue
        for (let childIndex = 0; childIndex < fill.children.length; childIndex++) {
          const child = fill.children[childIndex]
          if (
            child &&
            !validateNode(child, `${path}.fills[${fillIndex}].children[${childIndex}]`)
          ) {
            return false
          }
        }
      }
    }

    return true
  }

  // Validate pages and layout definitions. Definitions share the top-level
  // list with pages but retain their own path/index namespace for diagnostics.
  let pageIndex = 0
  let definitionIndex = 0
  if (ast.children) {
    for (const child of ast.children) {
      const isPage = child.type === 'Page'
      const path = isPage ? `pages[${pageIndex++}]` : `definitions[${definitionIndex++}]`
      if (!validateNode(child, path)) break
    }
  }

  if (errors.length < maxErrors) checkComponentContracts(ast, addError)

  const valid = errors.length === 0

  return {
    valid,
    errors,
    errorSummary: valid ? undefined : formatErrorSummary(errors),
  }
}

/**
 * Format a summary of validation errors
 */
function formatErrorSummary(errors: ValidationError[]): string {
  if (errors.length === 0) return ''

  if (errors.length === 1) {
    return errors[0].message
  }

  const uniqueMessages = [...new Set(errors.map((e) => e.message))]
  const shown = uniqueMessages.slice(0, 3)
  const remaining = errors.length - shown.length

  let summary = shown.join('; ')
  if (remaining > 0) {
    summary += ` (and ${remaining} more error${remaining > 1 ? 's' : ''})`
  }

  return summary
}

/**
 * Quick validation check - returns true if AST has valid attributes
 *
 * @param ast - The parsed AST document
 * @returns true if all attributes are valid
 */
export function isValidAst(ast: WireframeDocument): boolean {
  return validate(ast, { stopOnFirstError: true }).valid
}

/**
 * Get all validation errors from an AST
 *
 * @param ast - The parsed AST document
 * @returns Array of validation errors
 */
export function getValidationErrors(ast: WireframeDocument): ValidationError[] {
  return validate(ast).errors
}
