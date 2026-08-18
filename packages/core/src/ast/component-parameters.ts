/**
 * Component parameter references (`"$name"`) — one traversal, one pattern.
 *
 * A component body may reference a declared parameter anywhere a string value
 * sits: a top-level prop (`title "$name"`), a nested object (an interaction
 * effect's `target`), or an element of an array (`effects[]`). Substitution at
 * link time walks all three. Validation must walk exactly the same shape, or a
 * reference that gets substituted is never checked — an undeclared name then
 * survives as the literal string `"$too"` with no diagnostic.
 *
 * Both the linker and the document validator therefore share the traversal and
 * the pattern defined here rather than re-deriving either.
 */

import type { AnyNode } from './types'

/**
 * The one pattern that recognises a whole-string parameter reference.
 *
 * A reference is the entire string value; `"$to"` substitutes, `"a $to b"` is
 * literal text. Kept as a single source so substitution and validation cannot
 * disagree about what counts as a reference.
 *
 * @internal
 */
const PARAMETER_REFERENCE = /^\$([a-zA-Z_][a-zA-Z0-9_-]*)$/

/**
 * The parameter name a string value references, or `undefined` when the value
 * is ordinary text.
 *
 * @param value - Any value; only whole-string references match.
 * @returns The referenced name without its `$`, or `undefined`.
 * @public
 */
export function parameterReferenceName(value: unknown): string | undefined {
  return typeof value === 'string' ? PARAMETER_REFERENCE.exec(value)?.[1] : undefined
}

/**
 * One `"$name"` reference found inside a component body.
 *
 * @public
 */
export interface ComponentParameterReference {
  /** Referenced parameter name, without its `$`. */
  name: string
  /**
   * Property key the reference was found under. Nested keys report the leaf
   * key (`target`), which is what an author sees in the source text.
   */
  key: string
  /** Nearest enclosing AST node, for diagnostic location and node type. */
  node: AnyNode
}

/**
 * Every parameter reference reachable from a component's children.
 *
 * Mirrors link-time substitution exactly: it descends into arrays and plain
 * objects as well as child nodes, and skips `loc` so a source location can
 * never be mistaken for authored content. `ComponentUse` subtrees are skipped —
 * a nested invocation's inputs belong to that component's own scope, and its
 * body is validated where it is defined.
 *
 * @param children - The component definition's children.
 * @returns References in traversal order.
 * @public
 * @example
 * `collectParameterReferences(definition.children).map((item) => item.name)`
 */
export function collectParameterReferences(
  children: readonly AnyNode[],
): ComponentParameterReference[] {
  const found: ComponentParameterReference[] = []

  const visitValue = (value: unknown, key: string, node: AnyNode): void => {
    const name = parameterReferenceName(value)
    if (name !== undefined) {
      found.push({ name, key, node })
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) visitValue(item, key, node)
      return
    }
    if (value === null || typeof value !== 'object') return
    for (const [childKey, item] of Object.entries(value)) {
      if (childKey === 'loc') continue
      visitValue(item, childKey, node)
    }
  }

  const visitNode = (node: AnyNode): void => {
    // A nested invocation carries its own parameter scope; its inputs are
    // checked against that component's contract, not this one's.
    if (node.type === 'ComponentUse') return
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'children') continue
      visitValue(value, key, node)
    }
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children as AnyNode[]) visitNode(child)
    }
  }

  for (const child of children) visitNode(child)
  return found
}
