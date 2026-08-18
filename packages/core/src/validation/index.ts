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
import { collectParameterReferences } from '../ast/component-parameters'
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

/**
 * Keys on a node that are not attributes.
 *
 * Two kinds, both invisible in the source text: the structural fields the parser
 * adds (`type`, `loc`, `children`), and the *positional* props a rule writes from
 * something the author gave without naming — `text "Hi"` becomes `content`,
 * `nav { item "Home" }` becomes `label`, `table [[…]]` becomes `columns`/`rows`.
 * An author cannot write `content=` or `label=`, so reporting them as invalid
 * attributes blames them for something the parser wrote.
 */
const META_ATTRIBUTES = new Set([
  'type',
  'loc',
  'children',
  'content',
  'label',
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

/**
 * Positional props that only *some* node types write, keyed by node type.
 *
 * Same class as {@link META_ATTRIBUTES} — the author gave the value without
 * naming it — but these cannot join that set, because the same key is a real
 * authored attribute elsewhere. `layout app` and `component userbadge` write
 * `name` from an identifier that is part of the syntax, while `radio`, `avatar`
 * and `icon` all declare `name` as an attribute an author writes by hand.
 * Excluding it globally would stop reporting a misspelled `name` on those three;
 * not excluding it at all reports every `layout` in every document.
 */
const POSITIONAL_PROPS: Readonly<Record<string, readonly string[]>> = {
  Layout: ['name'],
  Component: ['name'],
  ComponentUse: ['name', 'namespace'],
  Slot: ['name'],
}

/**
 * A declared name, normalised the way the resolver normalises it.
 *
 * `renderer/site/model.ts` trims and treats blank as absent, so `id=" home "`
 * and `id="home"` are the same address to it. This function has to agree: a
 * validator that split them would call a real collision distinct, and one that
 * merged names the resolver keeps apart would invent a collision. Either way the
 * diagnostic would be about a document other than the one that renders.
 *
 * @param value - the raw attribute value
 * @returns the address, or `undefined` when the name is absent or blank
 */
function declaredName(value: string | undefined): string | undefined {
  const name = value?.trim()
  return name !== undefined && name.length > 0 ? name : undefined
}

/**
 * Report every top-level name declared more than once.
 *
 * Two scopes, independent of each other and both unenforced by the parser — see
 * {@link WireframeDocument}. `id` addresses a page for `navigate=`; the `name` of
 * a `layout` or `component` addresses a definition for `uses=`. The two do not
 * collide with each other, and a `layout` and a `component` do collide with each
 * other, because it is one `uses=` namespace they both answer in.
 *
 * Reported on the *second* declaration, never the first, because first-wins is
 * what the resolver actually does: `buildSiteModel` gives the name to the
 * earliest declarer and leaves the later page reachable only by index. Blaming
 * the first would send the author to edit the page that still works.
 *
 * This is the whole reason the rule exists. A duplicate here is not a crash and
 * not a visible defect — every page still renders, and the artefact looks right.
 * What is lost is silent: `navigate="checkout"` reaches one screen forever, and
 * the other becomes unreachable by name with nothing in the output to say so.
 *
 * @param ast - the document to scan
 * @param addError - collector; returns false when validation should stop
 * @returns false when the caller should stop validating
 */
function checkDuplicateDeclarations(
  ast: WireframeDocument,
  addError: (error: ValidationError) => boolean,
): boolean {
  /** Declaring node type → the scope its name lives in. */
  const SCOPE_OF: Readonly<Record<string, 'page' | 'definition'>> = {
    Page: 'page',
    Layout: 'definition',
    Component: 'definition',
  }

  const owners = new Map<string, { nodeType: string; index: number }>()

  const children = ast.children ?? []
  for (let index = 0; index < children.length; index++) {
    const node = children[index]
    const scope = SCOPE_OF[node?.type]
    if (scope === undefined) continue

    const name = declaredName(node.type === 'Page' ? node.id : node.name)
    if (name === undefined) continue

    // Keyed by scope so the two namespaces cannot reach each other: a page
    // `id=app` and a `layout app` are addressed by different attributes and are
    // not a collision.
    const key = `${scope}\u0000${name}`
    const owner = owners.get(key)
    if (owner === undefined) {
      owners.set(key, { nodeType: node.type, index })
      continue
    }

    const message =
      scope === 'page'
        ? `Duplicate page id "${name}" — pages[${owner.index}] already declares it, ` +
          `so navigate="${name}" resolves there and this page is reachable only by index`
        : `Duplicate ${node.type.toLowerCase()} name "${name}" — ` +
          `${owner.nodeType.toLowerCase()} at pages[${owner.index}] already declares it, ` +
          `so uses="${name}" resolves there and this definition is unreferenceable`

    if (
      !addError({
        message,
        path: `pages[${index}]`,
        nodeType: node.type,
        attribute: node.type === 'Page' ? 'id' : 'name',
        location: node.loc
          ? { line: node.loc.start.line, column: node.loc.start.column }
          : undefined,
      })
    ) {
      return false
    }
  }

  return true
}

/**
 * Report every element `id` declared twice inside one declaring context.
 *
 * The third scope, one level below the two in {@link checkDuplicateDeclarations}
 * and drawn from the renderer rather than invented here. `renderer/site/index.ts`
 * gives each page its own id scope (`s0-`) and each shell its own (`l0-`), so the
 * same `id` in two different pages is two different DOM ids and stays legal —
 * that scoping is a feature, and a rule that flagged it would contradict it.
 * Inside one context there is no such escape: both elements reach the DOM with
 * the identical id.
 *
 * What that costs is exactly what the two scopes above cost, in the DOM instead
 * of the model. `opens=` and `toggles=` resolve through an `[id="…"]` selector
 * (`renderer/site/runtime.ts`), and a selector matches the first element — so the
 * second overlay can never be opened, while both still render and the artefact
 * still looks right. Browser `getElementById`, fragment links and `aria-*`
 * references all narrow the same way.
 *
 * Deliberately a diagnostic and nothing more. Suffixing the second id, or
 * uniquifying it automatically, would make the renderer paper over the author's
 * typo: the two overlays would both work, neither would be addressable by the
 * name written in the source, and `opens=` would point at whichever one won.
 *
 * Which ids count is derived, not listed: any node carrying a string `id`,
 * except the context's own — a page's `id` addresses the page for `navigate=`
 * and never becomes a DOM id, so it shares no namespace with the overlays inside
 * it. Today the parser writes `id` on `Page`, `Modal` and `Drawer` only.
 *
 * @param ast - the document to scan
 * @param addError - collector; returns false when validation should stop
 * @returns false when the caller should stop validating
 */
function checkDuplicateElementIds(
  ast: WireframeDocument,
  addError: (error: ValidationError) => boolean,
): boolean {
  /** Top-level node types that open an id scope, and the word for one. */
  const CONTEXT_OF: Readonly<Record<string, string>> = {
    Page: 'page',
    Layout: 'layout',
    Component: 'component',
  }

  const children = ast.children ?? []
  for (let index = 0; index < children.length; index++) {
    const root = children[index]
    const context = CONTEXT_OF[root?.type]
    if (context === undefined) continue

    const owners = new Map<string, { nodeType: string; path: string }>()
    let stopped = false

    const walk = (node: AnyNode, path: string): boolean => {
      // The root's own `id` is the context's address, not an element id inside
      // it, so the scan starts below it.
      if (node !== root) {
        const value = 'id' in node ? (node as { id?: unknown }).id : undefined
        const name = typeof value === 'string' ? declaredName(value) : undefined
        if (name !== undefined) {
          const owner = owners.get(name)
          if (owner === undefined) {
            owners.set(name, { nodeType: node.type, path })
          } else {
            const message =
              `Duplicate element id "${name}" — the ${owner.nodeType.toLowerCase()} at ` +
              `${owner.path} already declares it in this ${context}, so opens="${name}" ` +
              `and toggles="${name}" reach that one and this ${node.type.toLowerCase()} ` +
              `cannot be addressed`
            if (
              !addError({
                message,
                path,
                nodeType: node.type,
                attribute: 'id',
                location: node.loc
                  ? { line: node.loc.start.line, column: node.loc.start.column }
                  : undefined,
              })
            ) {
              stopped = true
              return false
            }
          }
        }
      }

      if ('children' in node && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i] as AnyNode
          if (child && typeof child === 'object' && 'type' in child) {
            if (!walk(child, `${path}.children[${i}]`)) return false
          }
        }
      }
      return true
    }

    walk(root, `pages[${index}]`)
    if (stopped) return false
  }

  return true
}

function checkComponentContracts(
  ast: WireframeDocument,
  addError: (error: ValidationError) => boolean,
): boolean {
  const definitions = new Map<string, ComponentDefinitionNode>()
  for (const child of ast.children) {
    if (child.type === 'Component' && !definitions.has(child.name))
      definitions.set(child.name, child)
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
          `pages[${index}]`,
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
      for (let childIndex = 0; childIndex < childrenOf(node).length; childIndex++) {
        const child = childrenOf(node)[childIndex]
        if (child && !inspect(child, `${path}.children[${childIndex}]`)) return false
      }
      return true
    }
    for (let childIndex = 0; childIndex < definition.children.length; childIndex++) {
      const child = definition.children[childIndex]
      if (child && !inspect(child, `pages[${index}].children[${childIndex}]`)) return false
    }

    // Link-time substitution descends into arrays and nested objects, so the
    // reference check must cover the same shape — a reference inside an effect
    // is substituted, and an undeclared name would otherwise render literally.
    for (const reference of collectParameterReferences(definition.children)) {
      if (parameters.has(reference.name)) continue
      if (
        !report(
          reference.node,
          `pages[${index}]`,
          `Unknown component parameter reference "$${reference.name}" in component "${definition.name}"`,
          reference.key,
        )
      ) {
        return false
      }
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
          if (child && !visit(child, `${path}.fills[${fillIndex}].children[${childIndex}]`))
            return false
        }
      }
    }
    for (let index = 0; index < childrenOf(node).length; index++) {
      const child = childrenOf(node)[index]
      if (child && !visit(child, `${path}.children[${index}]`)) return false
    }
    return true
  }
  for (let index = 0; index < ast.children.length; index++) {
    const child = ast.children[index]
    if (child && !visit(child, `pages[${index}]`)) return false
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
          if (!child) continue
          const shouldContinue = validateNode(
            child,
            `${path}.fills[${fillIndex}].children[${childIndex}]`,
          )
          if (!shouldContinue) return false
        }
      }
    }

    return true
  }

  // Validate each page in the document
  let shouldContinue = true
  if (ast.children) {
    for (let i = 0; i < ast.children.length; i++) {
      const page = ast.children[i]
      shouldContinue = validateNode(page, `pages[${i}]`)
      if (!shouldContinue) break
    }
  }

  // After the walk, so a document with both kinds of defect reports them in the
  // order it always has and existing callers see no reordering. Document scopes
  // before the per-context one: a duplicate `id` on two pages is the reason the
  // second page's elements are unreachable, so it reads first.
  if (shouldContinue) shouldContinue = checkComponentContracts(ast, addError)
  if (shouldContinue) shouldContinue = checkDuplicateDeclarations(ast, addError)
  if (shouldContinue) checkDuplicateElementIds(ast, addError)

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
