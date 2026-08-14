import type {
  AnyNode,
  ComponentDefinitionNode,
  ComponentInputValue,
  ComponentUseNode,
  SlotNode,
} from '../ast'
import type {
  AppComponentInstanceId,
  AppComponentInput,
  AppDefinitionKind,
  AppDocument,
  AppLayoutInput,
  AppLinkDiagnostic,
  AppLinkResult,
  AppManifest,
  AppModuleInput,
  AppNodeId,
  AppNodeKind,
  AppReferenceInput,
  AppScreenInput,
  AppSourceMapEntry,
  AppSourceSpan,
  ResolvedAppComponent,
  ResolvedAppLayout,
  ResolvedAppModule,
  ResolvedAppReference,
  ResolvedAppScreen,
} from './types'

type DefinitionInput = AppLayoutInput | AppComponentInput
type NodeInput = DefinitionInput | AppScreenInput
type ResolvedDefinition = ResolvedAppLayout | ResolvedAppComponent

interface PendingNode {
  kind: AppNodeKind
  moduleId: string
  namespace: string
  input: NodeInput
  nodeId: AppNodeId
}

interface ResolvedNodeParts {
  nodeId: AppNodeId
  id: string
  moduleId: string
  namespace: string
  source: AppSourceSpan
  references: readonly ResolvedAppReference[]
}

/**
 * Create the stable identity used by linked documents and source maps.
 * Each segment is encoded so punctuation in authored identifiers cannot collide.
 *
 * @public
 */
export function createAppNodeId(namespace: string, kind: AppNodeKind, id: string): AppNodeId {
  return `${encodeURIComponent(namespace)}:${kind}:${encodeURIComponent(id)}` as AppNodeId
}

/** Create the stable identity of an invocation from its owner and structural path. */
export function createAppComponentInstanceId(
  ownerId: AppNodeId,
  targetId: AppNodeId,
  path: readonly number[],
): AppComponentInstanceId {
  return `${ownerId}:instance:${encodeURIComponent(targetId)}:${path.join('.')}` as AppComponentInstanceId
}

function compareSource(left: AppSourceSpan, right: AppSourceSpan): number {
  return (
    compareText(left.sourceId, right.sourceId) ||
    left.location.start.offset - right.location.start.offset ||
    left.location.end.offset - right.location.end.offset
  )
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareDiagnostic(left: AppLinkDiagnostic, right: AppLinkDiagnostic): number {
  return (
    compareSource(left.source, right.source) ||
    compareText(left.code, right.code) ||
    compareText(left.message, right.message)
  )
}

function definitionKey(namespace: string, kind: AppDefinitionKind, id: string): string {
  return `${namespace}\u0000${kind}\u0000${id}`
}

function nodeSource(module: AppModuleInput): AppSourceSpan {
  return module.source
}

function manifestSource(
  manifest: AppManifest,
  location: AppManifest['modules'][number]['location'],
) {
  return { sourceId: manifest.sourceId, location }
}

function componentUses(node: AnyNode): ComponentUseNode[] {
  const uses: ComponentUseNode[] = []
  const visit = (current: AnyNode): void => {
    if (current.type === 'ComponentUse') {
      uses.push(current)
      for (const fill of current.fills) for (const child of fill.children) visit(child)
      return
    }
    if ('children' in current && Array.isArray(current.children)) {
      for (const child of current.children as AnyNode[]) visit(child)
    }
  }
  visit(node)
  return uses
}

function referencesOf(pending: PendingNode): readonly AppReferenceInput[] {
  const inferred = componentUses(pending.input.node).map(
    (use): AppReferenceInput => ({
      kind: 'component',
      id: use.name,
      ...(use.namespace === undefined ? {} : { namespace: use.namespace }),
      source: {
        sourceId: pending.input.source.sourceId,
        location: use.loc ?? pending.input.source.location,
      },
    }),
  )
  return [...(pending.input.references ?? []), ...inferred]
}

function resolveReferences(
  pending: PendingNode,
  definitions: ReadonlyMap<string, PendingNode>,
  diagnostics: AppLinkDiagnostic[],
): ResolvedAppReference[] {
  const resolved: ResolvedAppReference[] = []

  for (const reference of referencesOf(pending)) {
    const namespace = reference.namespace ?? pending.namespace
    const target = definitions.get(definitionKey(namespace, reference.kind, reference.id))
    if (target === undefined) {
      diagnostics.push({
        code: 'missing-reference',
        message: `Missing ${reference.kind} reference "${namespace}:${reference.id}"`,
        source: reference.source,
      })
      continue
    }

    resolved.push({
      kind: reference.kind,
      id: reference.id,
      namespace,
      targetId: target.nodeId,
      source: reference.source,
    })
  }

  return resolved
}

function findCyclicReferences(
  definitions: readonly ResolvedDefinition[],
  diagnostics: AppLinkDiagnostic[],
): void {
  const byId = new Map(definitions.map((definition) => [definition.nodeId, definition]))
  const indexById = new Map<AppNodeId, number>()
  const lowById = new Map<AppNodeId, number>()
  const stack: AppNodeId[] = []
  const onStack = new Set<AppNodeId>()
  let nextIndex = 0

  const visit = (nodeId: AppNodeId): void => {
    const index = nextIndex++
    indexById.set(nodeId, index)
    lowById.set(nodeId, index)
    stack.push(nodeId)
    onStack.add(nodeId)

    const definition = byId.get(nodeId)
    for (const reference of definition?.references ?? []) {
      if (!byId.has(reference.targetId)) continue
      if (!indexById.has(reference.targetId)) {
        visit(reference.targetId)
        lowById.set(
          nodeId,
          Math.min(lowById.get(nodeId) ?? index, lowById.get(reference.targetId) ?? index),
        )
      } else if (onStack.has(reference.targetId)) {
        lowById.set(
          nodeId,
          Math.min(lowById.get(nodeId) ?? index, indexById.get(reference.targetId) ?? index),
        )
      }
    }

    if (lowById.get(nodeId) !== indexById.get(nodeId)) return

    const members: AppNodeId[] = []
    let member: AppNodeId | undefined
    do {
      member = stack.pop()
      if (member === undefined) break
      onStack.delete(member)
      members.push(member)
    } while (member !== nodeId)

    const memberSet = new Set(members)
    const cyclicEdges = members.flatMap((id) => {
      const owner = byId.get(id)
      return (owner?.references ?? []).filter((reference) => memberSet.has(reference.targetId))
    })
    const selfCycle = members.length === 1 && cyclicEdges.some((edge) => edge.targetId === nodeId)
    if (members.length < 2 && !selfCycle) return

    const source = cyclicEdges.map((edge) => edge.source).sort(compareSource)[0]
    if (source === undefined) return

    const names = [...members].sort().join(', ')
    diagnostics.push({
      code: 'cyclic-reference',
      message: `Cyclic layout/component reference among ${names}`,
      source,
    })
  }

  for (const definition of [...definitions].sort((left, right) =>
    compareText(left.nodeId, right.nodeId),
  )) {
    if (!indexById.has(definition.nodeId)) visit(definition.nodeId)
  }
}

function useSource(owner: PendingNode, use: ComponentUseNode): AppSourceSpan {
  return {
    sourceId: owner.input.source.sourceId,
    location: use.loc ?? owner.input.source.location,
  }
}

function childNodes(node: AnyNode): readonly AnyNode[] {
  return 'children' in node && Array.isArray(node.children) ? (node.children as AnyNode[]) : []
}

function namedSlots(definition: ComponentDefinitionNode): Map<string, SlotNode> {
  const slots = new Map<string, SlotNode>()
  const visit = (node: AnyNode): void => {
    if (node.type === 'ComponentUse') return
    if (node.type === 'Slot' && node.name !== undefined && !slots.has(node.name)) {
      slots.set(node.name, node)
    }
    for (const child of childNodes(node)) visit(child)
  }
  for (const child of definition.children) visit(child)
  return slots
}

function validateComponentDefinitions(
  definitions: ReadonlyMap<string, PendingNode>,
  diagnostics: AppLinkDiagnostic[],
): Set<AppNodeId> {
  const invalid = new Set<AppNodeId>()
  for (const pending of definitions.values()) {
    if (pending.kind !== 'component') continue
    const definition = pending.input.node as ComponentDefinitionNode
    const parameterNames = new Set<string>()
    for (const parameter of definition.parameters ?? []) {
      if (parameterNames.has(parameter.name)) {
        diagnostics.push({
          code: 'invalid-component-definition',
          message: `Duplicate parameter "${parameter.name}" in component "${pending.namespace}:${pending.input.id}"`,
          source: pending.input.source,
        })
        invalid.add(pending.nodeId)
      }
      parameterNames.add(parameter.name)
    }

    const slotNames = new Set<string>()
    const inspect = (node: AnyNode): void => {
      if (node.type === 'ComponentUse') return
      if (node.type === 'Slot') {
        const name = node.name?.trim()
        if (name === undefined || name.length === 0) {
          diagnostics.push({
            code: 'invalid-component-definition',
            message: `Unnamed slot in component "${pending.namespace}:${pending.input.id}"`,
            source: pending.input.source,
          })
          invalid.add(pending.nodeId)
        } else if (slotNames.has(name)) {
          diagnostics.push({
            code: 'invalid-component-definition',
            message: `Duplicate slot "${name}" in component "${pending.namespace}:${pending.input.id}"`,
            source: pending.input.source,
          })
          invalid.add(pending.nodeId)
        } else {
          slotNames.add(name)
        }
      }
      for (const [key, value] of Object.entries(node)) {
        if (key === 'loc' || key === 'children' || typeof value !== 'string') continue
        const name = /^\$([a-zA-Z_][a-zA-Z0-9_-]*)$/.exec(value)?.[1]
        if (name !== undefined && !parameterNames.has(name)) {
          diagnostics.push({
            code: 'invalid-component-definition',
            message: `Unknown parameter reference "$${name}" in component "${pending.namespace}:${pending.input.id}"`,
            source: pending.input.source,
          })
          invalid.add(pending.nodeId)
        }
      }
      for (const child of childNodes(node)) inspect(child)
    }
    for (const child of definition.children) inspect(child)
  }
  return invalid
}

function substituteTemplate(
  value: unknown,
  inputs: Readonly<Record<string, ComponentInputValue>>,
): unknown {
  if (typeof value === 'string') {
    const name = /^\$([a-zA-Z_][a-zA-Z0-9_-]*)$/.exec(value)?.[1]
    return name !== undefined && name in inputs ? inputs[name] : value
  }
  if (Array.isArray(value)) return value.map((item) => substituteTemplate(item, inputs))
  if (value === null || typeof value !== 'object') return value
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    result[key] = key === 'loc' ? item : substituteTemplate(item, inputs)
  }
  return result
}

interface ExpansionContext {
  owner: PendingNode
  definitions: ReadonlyMap<string, PendingNode>
  invalidDefinitions: ReadonlySet<AppNodeId>
  diagnostics: AppLinkDiagnostic[]
}

function expandComponentUse(
  use: ComponentUseNode,
  path: readonly number[],
  context: ExpansionContext,
): ComponentUseNode {
  const namespace = use.namespace ?? context.owner.namespace
  const target = context.definitions.get(definitionKey(namespace, 'component', use.name))
  if (target === undefined || target.kind !== 'component') return use
  const definition = target.input.node as ComponentDefinitionNode
  const source = useSource(context.owner, use)
  let valid = !context.invalidDefinitions.has(target.nodeId)
  const declaredParameters = definition.parameters ?? []
  const parameters = new Map(declaredParameters.map((item) => [item.name, item.valueType]))
  for (const parameter of declaredParameters) {
    if (!(parameter.name in use.inputs)) {
      context.diagnostics.push({
        code: 'invalid-component-invocation',
        message: `Missing input "${parameter.name}" for component "${namespace}:${use.name}"`,
        source,
      })
      valid = false
    }
  }
  for (const [name, value] of Object.entries(use.inputs)) {
    const expected = parameters.get(name)
    if (expected === undefined) {
      context.diagnostics.push({
        code: 'invalid-component-invocation',
        message: `Unknown input "${name}" for component "${namespace}:${use.name}"`,
        source,
      })
      valid = false
    } else if (typeof value !== expected) {
      context.diagnostics.push({
        code: 'invalid-component-invocation',
        message: `Input "${name}" for component "${namespace}:${use.name}" must be ${expected}, received ${typeof value}`,
        source,
      })
      valid = false
    }
  }

  const slots = namedSlots(definition)
  const fills = new Map<string, ComponentUseNode['fills'][number]>()
  for (const fill of use.fills) {
    if (fills.has(fill.name)) {
      context.diagnostics.push({
        code: 'invalid-component-invocation',
        message: `Duplicate fill "${fill.name}" for component "${namespace}:${use.name}"`,
        source,
      })
      valid = false
    } else {
      fills.set(fill.name, fill)
    }
    if (!slots.has(fill.name)) {
      context.diagnostics.push({
        code: 'invalid-component-invocation',
        message: `Unknown slot "${fill.name}" for component "${namespace}:${use.name}"`,
        source,
      })
      valid = false
    }
  }
  for (const slot of slots.keys()) {
    if (!fills.has(slot)) {
      context.diagnostics.push({
        code: 'invalid-component-invocation',
        message: `Missing fill for slot "${slot}" in component "${namespace}:${use.name}"`,
        source,
      })
      valid = false
    }
  }
  if (!valid) return use

  const expandNodes = (
    nodes: readonly AnyNode[],
    basePath: readonly number[],
    inputs?: Readonly<Record<string, ComponentInputValue>>,
  ): AnyNode[] =>
    nodes.flatMap((node, index) => {
      const nodePath = [...basePath, index]
      if (node.type === 'Slot' && node.name !== undefined) {
        const fill = fills.get(node.name)
        return fill === undefined ? [] : expandNodes(fill.children, [...nodePath, 0])
      }
      const substituted = (
        inputs === undefined ? node : substituteTemplate(node, inputs)
      ) as AnyNode
      if (substituted.type === 'ComponentUse') {
        return [expandComponentUse(substituted, nodePath, context)]
      }
      if ('children' in substituted && Array.isArray(substituted.children)) {
        substituted.children = expandNodes(substituted.children as AnyNode[], nodePath, inputs)
      }
      return [substituted]
    })

  return {
    ...use,
    targetId: target.nodeId,
    instanceId: createAppComponentInstanceId(context.owner.nodeId, target.nodeId, path),
    children: expandNodes(definition.children, path, use.inputs),
  }
}

function expandNode(node: AnyNode, path: readonly number[], context: ExpansionContext): AnyNode {
  if (node.type === 'ComponentUse') return expandComponentUse(node, path, context)
  const clone = substituteTemplate(node, {}) as AnyNode
  if ('children' in clone && Array.isArray(clone.children)) {
    clone.children = (clone.children as AnyNode[]).map((child, index) =>
      expandNode(child, [...path, index], context),
    )
  }
  return clone
}

/**
 * Link parsed Wireweave modules into one dependency-closed application document.
 * The function is pure and returns no document whenever validation finds an error.
 *
 * @public
 * @example
 * `const result = linkApp(manifest, modules)`
 */
export function linkApp(manifest: AppManifest, modules: readonly AppModuleInput[]): AppLinkResult {
  const diagnostics: AppLinkDiagnostic[] = []
  const moduleGroups = new Map<string, AppModuleInput[]>()
  for (const module of modules) {
    const group = moduleGroups.get(module.id)
    if (group === undefined) moduleGroups.set(module.id, [module])
    else group.push(module)
  }
  for (const group of moduleGroups.values()) group.sort((a, b) => compareSource(a.source, b.source))

  for (const [id, group] of moduleGroups) {
    for (const duplicate of group.slice(1)) {
      diagnostics.push({
        code: 'duplicate-module',
        message: `Duplicate module input "${id}"`,
        source: nodeSource(duplicate),
      })
    }
  }

  const selected: { module: AppModuleInput; namespace: string }[] = []
  const seenModuleIds = new Set<string>()
  const seenNamespaces = new Set<string>()
  for (const entry of manifest.modules) {
    const source = manifestSource(manifest, entry.location)
    if (seenModuleIds.has(entry.id)) {
      diagnostics.push({
        code: 'duplicate-module',
        message: `Duplicate module manifest entry "${entry.id}"`,
        source,
      })
      continue
    }
    seenModuleIds.add(entry.id)

    if (seenNamespaces.has(entry.namespace)) {
      diagnostics.push({
        code: 'duplicate-namespace',
        message: `Duplicate module namespace "${entry.namespace}"`,
        source,
      })
      continue
    }
    seenNamespaces.add(entry.namespace)

    const group = moduleGroups.get(entry.id)
    if (group === undefined) {
      diagnostics.push({
        code: 'missing-module',
        message: `Missing module input "${entry.id}"`,
        source,
      })
      continue
    }
    // A duplicate module has no unambiguous declaration graph to link. The
    // duplicate diagnostic above is sufficient; selecting one would make all
    // later diagnostics depend on input array order.
    if (group.length > 1) continue
    const module = group[0]
    if (module === undefined) continue
    selected.push({ module, namespace: entry.namespace })
  }

  const definitions = new Map<string, PendingNode>()
  const screens = new Map<string, PendingNode>()
  const pendingModules: { id: string; namespace: string; nodes: PendingNode[] }[] = []

  for (const { module, namespace } of selected) {
    const nodes: PendingNode[] = []
    const addDefinition = (kind: AppDefinitionKind, input: DefinitionInput): void => {
      const pending: PendingNode = {
        kind,
        moduleId: module.id,
        namespace,
        input,
        nodeId: createAppNodeId(namespace, kind, input.id),
      }
      const key = definitionKey(namespace, kind, input.id)
      if (definitions.has(key)) {
        diagnostics.push({
          code: 'duplicate-definition',
          message: `Duplicate ${kind} definition "${namespace}:${input.id}"`,
          source: input.source,
        })
      } else {
        definitions.set(key, pending)
        nodes.push(pending)
      }
    }

    for (const layout of module.layouts) addDefinition('layout', layout)
    for (const component of module.components) addDefinition('component', component)
    for (const screen of module.screens) {
      const pending: PendingNode = {
        kind: 'screen',
        moduleId: module.id,
        namespace,
        input: screen,
        nodeId: createAppNodeId(namespace, 'screen', screen.id),
      }
      const key = `${namespace}\u0000${screen.id}`
      if (screens.has(key)) {
        diagnostics.push({
          code: 'duplicate-screen',
          message: `Duplicate screen definition "${namespace}:${screen.id}"`,
          source: screen.source,
        })
      } else {
        screens.set(key, pending)
        nodes.push(pending)
      }
    }
    pendingModules.push({ id: module.id, namespace, nodes })
  }

  const resolvedById = new Map<
    AppNodeId,
    ResolvedAppLayout | ResolvedAppComponent | ResolvedAppScreen
  >()
  const toParts = (pending: PendingNode): ResolvedNodeParts => ({
    nodeId: pending.nodeId,
    id: pending.input.id,
    moduleId: pending.moduleId,
    namespace: pending.namespace,
    source: pending.input.source,
    references: resolveReferences(pending, definitions, diagnostics),
  })
  const invalidDefinitions = validateComponentDefinitions(definitions, diagnostics)

  for (const pendingModule of pendingModules) {
    for (const pending of pendingModule.nodes) {
      const parts = toParts(pending)
      const expansion: ExpansionContext = {
        owner: pending,
        definitions,
        invalidDefinitions,
        diagnostics,
      }
      if (pending.kind === 'layout') {
        resolvedById.set(pending.nodeId, {
          ...parts,
          kind: 'layout',
          node: expandNode(pending.input.node, [], expansion) as AppLayoutInput['node'],
        })
      } else if (pending.kind === 'component') {
        resolvedById.set(pending.nodeId, {
          ...parts,
          kind: 'component',
          node: pending.input.node as AppComponentInput['node'],
        })
      } else {
        resolvedById.set(pending.nodeId, {
          ...parts,
          kind: 'screen',
          node: expandNode(pending.input.node, [], expansion) as AppScreenInput['node'],
        })
      }
    }
  }

  const resolvedDefinitions = [...resolvedById.values()].filter(
    (node): node is ResolvedDefinition => node.kind !== 'screen',
  )
  findCyclicReferences(resolvedDefinitions, diagnostics)

  diagnostics.sort(compareDiagnostic)
  if (diagnostics.length > 0) return { ok: false, document: null, diagnostics }

  const resolvedModules: ResolvedAppModule[] = pendingModules.map((pendingModule) => {
    const nodes = pendingModule.nodes.map((node) => resolvedById.get(node.nodeId))
    return {
      id: pendingModule.id,
      namespace: pendingModule.namespace,
      layouts: nodes.filter((node): node is ResolvedAppLayout => node?.kind === 'layout'),
      components: nodes.filter((node): node is ResolvedAppComponent => node?.kind === 'component'),
      screens: nodes.filter((node): node is ResolvedAppScreen => node?.kind === 'screen'),
    }
  })
  const layouts = resolvedModules.flatMap((module) => module.layouts)
  const components = resolvedModules.flatMap((module) => module.components)
  const linkedScreens = resolvedModules.flatMap((module) => module.screens)
  const sourceMap: AppSourceMapEntry[] = resolvedModules.flatMap((module) =>
    [...module.layouts, ...module.components, ...module.screens].map((node) => ({
      nodeId: node.nodeId,
      source: node.source,
    })),
  )
  const document: AppDocument = {
    type: 'AppDocument',
    id: manifest.id,
    modules: resolvedModules,
    layouts,
    components,
    screens: linkedScreens,
    sourceMap,
  }
  return { ok: true, document, diagnostics: [] }
}
