// Structure detection — a node subset S + induced subgraph (internal edges E) → a visualization form.
//
// Four forms: graph | tree | table | stateMachine.
// Priority (elimination, first match wins):
//   1) stateMachine — body has both a state enum + transition prose (body-only signal, lowest false+).
//   2) tree — containment relations dominate + single-root acyclic (in-degree ≤ 1).
//   3) table — homogeneous item set + near-zero internal relations (edgeDensity guard).
//   4) graph — fallback (zero information loss, high readability cost → last).

import type { SsotEdge, SsotNode } from './types.js'

export type StructureKind = 'graph' | 'tree' | 'table' | 'stateMachine'

export interface StructureSignals {
  size: number
  /** |E| / |S| (internal edge density, excluding self). */
  edgeDensity: number
  /** Fraction of hierarchical (contains/owns/realizedBy …) rels. */
  containmentRatio: number
  /** Count of non-hierarchical (relatesTo/impacts/dependsOn …) relations. */
  symmetricRels: number
  /** Single-kind fraction (most common kind / size). */
  kindHomogeneity: number
  /** Fraction of nodes sharing the same facet key set. */
  facetUniformity: number
  /** Body contains an 'A | B | C' state enum. */
  hasStateEnum: boolean
  /** Body contains '→' transition prose. */
  hasTransitionProse: boolean
}

export interface ClassifyThresholds {
  treeContainmentRatio: number // ≥
  tableKindHomogeneity: number // ≥
  tableFacetUniformity: number // ≥
  tableMaxEdgeDensity: number // <
}

export const DEFAULT_THRESHOLDS: ClassifyThresholds = {
  treeContainmentRatio: 0.8,
  tableKindHomogeneity: 0.9,
  tableFacetUniformity: 0.7,
  tableMaxEdgeDensity: 0.2,
}

/** Relations treated as hierarchical. */
const CONTAINMENT_RELS = new Set<string>([
  'realizedBy',
  'servesPersona',
  'governs',
  'owns',
  'contains',
])
/** relatesTo relationTypes treated as hierarchical. */
const CONTAINMENT_RELATION_TYPES = new Set<string>(['owns', 'contains', 'has', 'includes'])
/** Non-hierarchical (symmetric/propagation) relations. */
const SYMMETRIC_RELS = new Set<string>(['impacts', 'dependsOn'])

function isContainmentEdge(e: SsotEdge): boolean {
  if (e.rel === 'relatesTo') {
    return e.relationType !== undefined && CONTAINMENT_RELATION_TYPES.has(e.relationType)
  }
  return CONTAINMENT_RELS.has(e.rel)
}

function isSymmetricEdge(e: SsotEdge): boolean {
  if (SYMMETRIC_RELS.has(e.rel)) return true
  if (e.rel === 'relatesTo') {
    return !(e.relationType !== undefined && CONTAINMENT_RELATION_TYPES.has(e.relationType))
  }
  return false
}

// ── body state-machine signals ───────────────────────────────────

// State enum: 'RUNNING | CLOSED | DELETED' or 'ACTIVE|EXPIRED' (2+ tokens).
const STATE_ENUM_RE = /\b[A-Z][A-Z0-9_]{1,}(?:\s*\|\s*[A-Z][A-Z0-9_]{1,}){1,}/
// Transition prose: 'issue → extend → expire' (2+ arrows certain, 1 accepted).
const TRANSITION_RE = /\S\s*(?:→|->|=>)\s*\S/
// State context keyword (false-positive suppression): status/state/상태/생명주기/lifecycle.
const STATE_CONTEXT_RE = /(status|state|상태|생명주기|lifecycle)/i

/** Extract state-enum / transition-prose signals from node body markdown. */
export function detectStateSignals(markdown: string): {
  hasStateEnum: boolean
  hasTransitionProse: boolean
} {
  const hasEnumRaw = STATE_ENUM_RE.test(markdown)
  // Accept the enum only near state context (or when there are enough uppercase tokens).
  const hasStateEnum = hasEnumRaw && (STATE_CONTEXT_RE.test(markdown) || hasEnumRaw)
  const hasTransitionProse = TRANSITION_RE.test(markdown)
  return { hasStateEnum, hasTransitionProse }
}

// ── signal extraction ────────────────────────────────────────────

function facetKeySet(node: SsotNode): string {
  const keys: string[] = []
  const f = node.facets
  if (f.purpose.purpose) keys.push('purpose')
  if (f.purpose.value) keys.push('value')
  if (f.purpose.servesPersona.length) keys.push('servesPersona')
  if (f.semantics.definition) keys.push('definition')
  if (f.semantics.relatesTo.length) keys.push('relatesTo')
  if (f.semantics.governedBy.length) keys.push('governedBy')
  if (f.semantics.governs.length) keys.push('governs')
  if (f.realization.realizedBy.length) keys.push('realizedBy')
  if (f.realization.implementedIn.length) keys.push('implementedIn')
  if (f.realization.dependsOn.length) keys.push('dependsOn')
  if (f.realization.consumesApi.length) keys.push('consumesApi')
  if (f.realization.providesApi.length) keys.push('providesApi')
  if (f.realization.impacts.length) keys.push('impacts')
  if (f.realization.integratesWith.length) keys.push('integratesWith')
  if (f.meta.decidedBy.length) keys.push('decidedBy')
  return keys.sort().join(',')
}

/**
 * Compute signals from a node subset + internal edges.
 * stateMachine signals depend on the body — when bodies are not loaded they are false (so the
 * upper classifier resolves to graph/tree/table).
 */
export function computeSignals(nodes: SsotNode[], edges: SsotEdge[]): StructureSignals {
  const size = nodes.length
  if (size === 0) {
    return {
      size: 0,
      edgeDensity: 0,
      containmentRatio: 0,
      symmetricRels: 0,
      kindHomogeneity: 0,
      facetUniformity: 0,
      hasStateEnum: false,
      hasTransitionProse: false,
    }
  }

  const containment = edges.filter(isContainmentEdge).length
  const symmetric = edges.filter(isSymmetricEdge).length
  const containmentRatio = edges.length === 0 ? 0 : containment / edges.length

  // kind homogeneity
  const kindCount = new Map<string, number>()
  for (const n of nodes) kindCount.set(n.kind, (kindCount.get(n.kind) ?? 0) + 1)
  const maxKind = Math.max(...kindCount.values())
  const kindHomogeneity = maxKind / size

  // facet key-set homogeneity
  const facetCount = new Map<string, number>()
  for (const n of nodes) {
    const key = facetKeySet(n)
    facetCount.set(key, (facetCount.get(key) ?? 0) + 1)
  }
  const maxFacet = Math.max(...facetCount.values())
  const facetUniformity = maxFacet / size

  // state-machine signals (union over bodies)
  let hasStateEnum = false
  let hasTransitionProse = false
  for (const n of nodes) {
    if (n.body) {
      const sig = detectStateSignals(n.body.markdown)
      if (sig.hasStateEnum) hasStateEnum = true
      if (sig.hasTransitionProse) hasTransitionProse = true
    }
  }

  return {
    size,
    edgeDensity: edges.length / size,
    containmentRatio,
    symmetricRels: symmetric,
    kindHomogeneity,
    facetUniformity,
    hasStateEnum,
    hasTransitionProse,
  }
}

// ── acyclic single-root containment check (tree) ─────────────────

/**
 * Whether the induced subgraph is tree-shaped (each node in-degree ≤ 1, no cycles).
 * Judged over hierarchical edges only.
 */
export function isTreeShaped(nodeIds: Set<string>, edges: SsotEdge[]): boolean {
  const hierEdges = edges.filter(isContainmentEdge)
  if (hierEdges.length === 0) return false

  const indeg = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) {
    indeg.set(id, 0)
    adj.set(id, [])
  }
  for (const e of hierEdges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1)
    adj.get(e.from)?.push(e.to)
  }
  // in-degree ≤ 1
  for (const d of indeg.values()) {
    if (d > 1) return false
  }
  // cycle check (DFS)
  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()
  for (const id of nodeIds) color.set(id, WHITE)
  const hasCycle = (u: string): boolean => {
    color.set(u, GRAY)
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v)
      if (c === GRAY) return true
      if (c === WHITE && hasCycle(v)) return true
    }
    color.set(u, BLACK)
    return false
  }
  for (const id of nodeIds) {
    if (color.get(id) === WHITE && hasCycle(id)) return false
  }
  return true
}

// ── classification ───────────────────────────────────────────────

export interface ClassifyInput {
  nodes: SsotNode[]
  edges: SsotEdge[]
}

export interface ClassifyResult {
  kind: StructureKind
  signals: StructureSignals
  /** The reason for the verdict (for debugging / UI explanation). */
  reason: string
}

/** Signals → structure kind. Elimination priority, first match wins. */
export function classifyStructure(
  signals: StructureSignals,
  nodeIds: Set<string>,
  edges: SsotEdge[],
  thresholds: ClassifyThresholds = DEFAULT_THRESHOLDS,
): { kind: StructureKind; reason: string } {
  // 1) stateMachine
  if (signals.hasStateEnum && signals.hasTransitionProse) {
    return {
      kind: 'stateMachine',
      reason: 'body has both a state enum + transition prose',
    }
  }

  // 2) tree
  if (signals.containmentRatio >= thresholds.treeContainmentRatio && isTreeShaped(nodeIds, edges)) {
    return {
      kind: 'tree',
      reason: `containment dominates (containmentRatio=${signals.containmentRatio.toFixed(2)}) + single-root acyclic`,
    }
  }

  // 3) table
  if (
    signals.kindHomogeneity >= thresholds.tableKindHomogeneity &&
    signals.facetUniformity >= thresholds.tableFacetUniformity &&
    signals.edgeDensity < thresholds.tableMaxEdgeDensity
  ) {
    return {
      kind: 'table',
      reason: `homogeneous set (kindHomogeneity=${signals.kindHomogeneity.toFixed(2)}, facetUniformity=${signals.facetUniformity.toFixed(2)}) + low edgeDensity (${signals.edgeDensity.toFixed(2)})`,
    }
  }

  // 4) graph (fallback)
  return {
    kind: 'graph',
    reason:
      signals.symmetricRels > 0
        ? `non-hierarchical relations (symmetricRels=${signals.symmetricRels}) present → graph`
        : 'mixed kinds / relation-edge centric → graph (fallback)',
  }
}

/** Input (nodes + edges) → signal computation + classification in one call. */
export function classify(
  input: ClassifyInput,
  thresholds: ClassifyThresholds = DEFAULT_THRESHOLDS,
): ClassifyResult {
  const signals = computeSignals(input.nodes, input.edges)
  const nodeIds = new Set(input.nodes.map((n) => n.id))
  const { kind, reason } = classifyStructure(signals, nodeIds, input.edges, thresholds)
  return { kind, signals, reason }
}
