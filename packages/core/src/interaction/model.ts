import type {
  AnyNode,
  InteractionEffect,
  InteractiveProps,
  NodeType,
  SourceLocation,
  StateDeclaration,
  StateGuard,
  StateValue,
  StateValueType,
  WireframeDocument,
} from '../ast'
import { walk } from '../ast'
import {
  categoryOf,
  getInteractiveLabel,
  getInteractions,
  getItemInteractionSources,
} from '../extract/node-info'
import type { InteractionKind } from '../extract/types'
import { buildSiteModel } from '../renderer/site/model'

/** Overlay toggle is distinct from the typed boolean-state `toggle` effect. */
export type NormalizedInteractionEffect =
  | InteractionEffect
  | { kind: 'toggle-overlay'; target: string }
  | { kind: 'legacy-action'; action: string }

export interface NormalizedInteractionHandler {
  event: 'click'
  guard?: StateGuard
  effects: NormalizedInteractionEffect[]
}

export interface NormalizedInteraction {
  screenIndex: number
  source: 'screen' | 'layout'
  signature: string
  handler: NormalizedInteractionHandler
  /** Present when this entry came from a legacy scalar intent attribute. */
  legacyKind?: InteractionKind
  trigger: {
    nodeType: NodeType
    label?: string
    loc?: SourceLocation
    item?: { index: number }
  }
}

export type InteractionDiagnosticCode =
  | 'invalid-state-declaration'
  | 'duplicate-state-declaration'
  | 'invalid-interaction-handler'
  | 'unknown-legacy-action'

export interface InteractionDiagnostic {
  code: InteractionDiagnosticCode
  message: string
  screenIndex?: number
  source?: 'screen' | 'layout'
  loc?: SourceLocation
}

export interface InteractionModel {
  states: StateDeclaration[]
  interactions: NormalizedInteraction[]
  diagnostics: InteractionDiagnostic[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStateValue(value: unknown): value is StateValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function valueMatches(type: StateValueType, value: StateValue): boolean {
  return typeof value === type
}

/** Normalize a guard object emitted by the generic DSL object grammar. */
export function normalizeStateGuard(value: unknown): StateGuard | undefined {
  if (!isRecord(value) || typeof value.state !== 'string' || !isStateValue(value.equals)) {
    return undefined
  }
  const state = value.state.trim()
  return state.length > 0 ? { state, equals: value.equals } : undefined
}

function normalizeEffect(value: unknown): NormalizedInteractionEffect | undefined {
  if (!isRecord(value) || typeof value.kind !== 'string') return undefined
  switch (value.kind) {
    case 'navigate':
    case 'open':
    case 'close': {
      if (typeof value.target !== 'string' || value.target.trim().length === 0) return undefined
      return { kind: value.kind, target: value.target.trim() }
    }
    case 'set': {
      if (
        typeof value.state !== 'string' ||
        value.state.trim().length === 0 ||
        !isStateValue(value.value)
      ) {
        return undefined
      }
      return { kind: 'set', state: value.state.trim(), value: value.value }
    }
    case 'reset':
    case 'toggle': {
      if (typeof value.state !== 'string' || value.state.trim().length === 0) return undefined
      return { kind: value.kind, state: value.state.trim() }
    }
    default:
      return undefined
  }
}

/**
 * Normalize the public `on=` shape. Malformed handlers are inert; diagnostics
 * are added by {@link collectInteractions}, where screen/source context exists.
 */
export function normalizeInteractionHandlers(value: unknown): NormalizedInteractionHandler[] {
  const candidates = Array.isArray(value) ? value : [value]
  const handlers: NormalizedInteractionHandler[] = []
  for (const candidate of candidates) {
    if (!isRecord(candidate) || candidate.event !== 'click') continue
    const effects = Array.isArray(candidate.effects)
      ? candidate.effects.map(normalizeEffect)
      : [normalizeEffect(candidate.effects)]
    if (effects.length === 0 || effects.some((effect) => effect === undefined)) continue

    const handler: NormalizedInteractionHandler = {
      event: 'click',
      effects: effects as NormalizedInteractionEffect[],
    }
    if (candidate.guard !== undefined) {
      const guard = normalizeStateGuard(candidate.guard)
      if (guard === undefined) continue
      handler.guard = guard
    }
    handlers.push(handler)
  }
  return handlers
}

/** Stable payload shared by rendered DOM markers and the runtime registry. */
export function interactionSignature(handler: NormalizedInteractionHandler): string {
  return JSON.stringify(handler)
}

function legacyHandler(kind: InteractionKind, target: string): NormalizedInteractionHandler {
  switch (kind) {
    case 'navigate':
      return { event: 'click', effects: [{ kind: 'navigate', target: target.trim() }] }
    case 'opens':
      return { event: 'click', effects: [{ kind: 'open', target: target.trim() }] }
    case 'toggles':
      return { event: 'click', effects: [{ kind: 'toggle-overlay', target: target.trim() }] }
    case 'action':
      return { event: 'click', effects: [{ kind: 'legacy-action', action: target.trim() }] }
  }
}

function normalizeStateDeclaration(value: unknown): StateDeclaration | undefined {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    (value.valueType !== 'string' &&
      value.valueType !== 'number' &&
      value.valueType !== 'boolean') ||
    !isStateValue(value.initial)
  ) {
    return undefined
  }
  const name = value.name.trim()
  if (name.length === 0 || !valueMatches(value.valueType, value.initial)) return undefined
  return { name, valueType: value.valueType, initial: value.initial }
}

function collectStates(
  doc: WireframeDocument,
  diagnostics: InteractionDiagnostic[],
): StateDeclaration[] {
  const states: StateDeclaration[] = []
  const names = new Set<string>()
  for (const owner of doc.children) {
    if (owner.type !== 'Page' && owner.type !== 'Layout') continue
    const raw = owner.states
    if (raw === undefined) continue
    if (!Array.isArray(raw)) {
      diagnostics.push({
        code: 'invalid-state-declaration',
        message: 'states must be an array of typed state declarations',
        ...(owner.loc ? { loc: owner.loc } : {}),
      })
      continue
    }
    for (const candidate of raw as unknown[]) {
      const state = normalizeStateDeclaration(candidate)
      if (state === undefined) {
        diagnostics.push({
          code: 'invalid-state-declaration',
          message:
            'state declarations require name, valueType, and a matching scalar initial value',
          ...(owner.loc ? { loc: owner.loc } : {}),
        })
        continue
      }
      if (names.has(state.name)) {
        diagnostics.push({
          code: 'duplicate-state-declaration',
          message: `state ${JSON.stringify(state.name)} was already declared; first declaration wins`,
          ...(owner.loc ? { loc: owner.loc } : {}),
        })
        continue
      }
      names.add(state.name)
      states.push(state)
    }
  }
  return states
}

interface TriggerSource {
  props: Partial<InteractiveProps>
  trigger: NormalizedInteraction['trigger']
}

function sourcesIn(nodes: readonly AnyNode[]): TriggerSource[] {
  const sources: TriggerSource[] = []
  for (const child of nodes) {
    walk(child, (node) => {
      if (categoryOf(node) === undefined) return
      const trigger: NormalizedInteraction['trigger'] = { nodeType: node.type }
      const label = getInteractiveLabel(node)
      if (label !== undefined) trigger.label = label
      if (node.loc) trigger.loc = node.loc
      sources.push({ props: node as Partial<InteractiveProps>, trigger })

      for (const item of getItemInteractionSources(node)) {
        const itemTrigger: NormalizedInteraction['trigger'] = {
          nodeType: item.container,
          item: { index: item.itemIndex },
        }
        if (item.itemLabel !== undefined) itemTrigger.label = item.itemLabel
        if (node.loc) itemTrigger.loc = node.loc
        sources.push({ props: item.props, trigger: itemTrigger })
      }
    })
  }
  return sources
}

/**
 * The canonical interaction/state source for graph extraction and renderSite.
 * Layout intent is expanded once per screen using that layout, so shared chrome
 * has the same reachable routes in both consumers.
 *
 * ## Components are read through the linker, never from here
 *
 * Screens and layouts are walked; `component` definitions are not. That is the
 * boundary, not an omission. A handler inside a definition is written against
 * the component's *parameters* — `target="$to"` — so before an invocation binds
 * its inputs there is no destination to record, only the name of one. Walking
 * definitions here would register `"$to"` as a route and invent a graph edge to
 * a screen that does not exist, and a component used twice with different
 * inputs is two different routes that a single walk of the definition cannot
 * tell apart.
 *
 * Binding those inputs is `linkApp`'s job: `expandComponentUse` substitutes the
 * invocation's inputs, fills its slots, and hands back a tree whose handlers
 * name real targets. So `linkAndCompileApp` — link, then compile — sees every
 * component interaction, while `renderSite(parse(src))` on a document that
 * never went through the linker leaves each invocation
 * `data-wf-component-unresolved` and contributes no interactions. Handlers
 * written directly on a screen or a layout work in both paths; only handlers
 * *inside a component definition* require the linked path.
 */
export function collectInteractions(doc: WireframeDocument): InteractionModel {
  const diagnostics: InteractionDiagnostic[] = []
  const states = collectStates(doc, diagnostics)
  const interactions: NormalizedInteraction[] = []
  const site = buildSiteModel(doc)
  const layouts = new Map(site.shells.map((shell) => [shell.name, shell.layout] as const))

  const add = (
    screenIndex: number,
    source: NormalizedInteraction['source'],
    triggerSource: TriggerSource,
  ): void => {
    const legacy = getInteractions(triggerSource.props as AnyNode).map(({ kind, target }) => ({
      kind,
      handler: legacyHandler(kind, target),
    }))
    const typed = normalizeInteractionHandlers(triggerSource.props.on)
    if (triggerSource.props.on !== undefined && typed.length === 0) {
      diagnostics.push({
        code: 'invalid-interaction-handler',
        message: 'on requires event=click, an optional equality guard, and valid ordered effects',
        screenIndex,
        source,
        ...(triggerSource.trigger.loc ? { loc: triggerSource.trigger.loc } : {}),
      })
    }

    for (const entry of [...legacy, ...typed.map((handler) => ({ handler, kind: undefined }))]) {
      const { handler } = entry
      for (const effect of handler.effects) {
        if (
          effect.kind === 'legacy-action' &&
          effect.action !== 'close' &&
          effect.action !== 'back'
        ) {
          diagnostics.push({
            code: 'unknown-legacy-action',
            message: `legacy action ${JSON.stringify(effect.action)} is inert in the generated runtime`,
            screenIndex,
            source,
            ...(triggerSource.trigger.loc ? { loc: triggerSource.trigger.loc } : {}),
          })
        }
      }
      const interaction: NormalizedInteraction = {
        screenIndex,
        source,
        signature: interactionSignature(handler),
        handler,
        trigger: triggerSource.trigger,
      }
      if (entry.kind !== undefined) interaction.legacyKind = entry.kind
      interactions.push(interaction)
    }
  }

  for (const screen of site.screens) {
    for (const source of sourcesIn(screen.page.children)) add(screen.index, 'screen', source)
    if (screen.shell !== undefined) {
      const layout = layouts.get(screen.shell)
      if (layout !== undefined) {
        for (const source of sourcesIn(layout.children)) add(screen.index, 'layout', source)
      }
    }
  }

  return { states, interactions, diagnostics }
}
