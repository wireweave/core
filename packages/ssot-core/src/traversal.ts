// Relation traversal — look up adjacent/reverse edges by node id, plus impact-closure analysis.
//
// The edges array is the single source of truth. To cut repeated-lookup cost, build an adjacency
// index once with buildAdjacencyIndex (O(1) lookup) and reuse it. For one-off lookups use the
// helpers directly.
//
// This module is the single home for graph logic (scenario A3-GRAPH): the impactClosure semantics
// that the ssot-studio governance.mjs / build-graph.mjs scripts each re-implemented now live here
// once, over the normalized SsotGraph.

import type { EdgeRel, SsotEdge, SsotGraph, SsotNode } from './types.js'

export interface EdgeFilter {
  /** A specific relation only. Unset = all. */
  rel?: EdgeRel
  /** When rel='relatesTo', match this relationType. */
  relationType?: string
}

function matches(edge: SsotEdge, filter?: EdgeFilter): boolean {
  if (!filter) return true
  if (filter.rel !== undefined && edge.rel !== filter.rel) return false
  if (filter.relationType !== undefined && edge.relationType !== filter.relationType) return false
  return true
}

/** Edges leaving id (out direction). */
export function outgoingEdges(graph: SsotGraph, id: string, filter?: EdgeFilter): SsotEdge[] {
  return graph.edges.filter((e) => e.from === id && matches(e, filter))
}

/** Edges entering id (in / reverse direction). */
export function incomingEdges(graph: SsotGraph, id: string, filter?: EdgeFilter): SsotEdge[] {
  return graph.edges.filter((e) => e.to === id && matches(e, filter))
}

/** One-hop neighbor ids from id (out direction). */
export function neighbors(graph: SsotGraph, id: string, filter?: EdgeFilter): string[] {
  return unique(outgoingEdges(graph, id, filter).map((e) => e.to))
}

/** Reverse (incoming) one-hop neighbor ids of id. */
export function reverseNeighbors(graph: SsotGraph, id: string, filter?: EdgeFilter): string[] {
  return unique(incomingEdges(graph, id, filter).map((e) => e.from))
}

function unique(xs: string[]): string[] {
  return [...new Set(xs)]
}

// ── adjacency index (repeated-lookup optimization) ───────────────

export interface AdjacencyIndex {
  out: Map<string, SsotEdge[]>
  in: Map<string, SsotEdge[]>
}

/** Group edges by from/to in one pass. Call before repeated traversals. */
export function buildAdjacencyIndex(graph: SsotGraph): AdjacencyIndex {
  const out = new Map<string, SsotEdge[]>()
  const inIdx = new Map<string, SsotEdge[]>()
  for (const edge of graph.edges) {
    push(out, edge.from, edge)
    push(inIdx, edge.to, edge)
  }
  return { out, in: inIdx }
}

function push(map: Map<string, SsotEdge[]>, key: string, edge: SsotEdge): void {
  const arr = map.get(key)
  if (arr) arr.push(edge)
  else map.set(key, [edge])
}

// ── subgraph / search ────────────────────────────────────────────

export interface InducedSubgraph {
  /** S — the node id set. */
  nodeIds: Set<string>
  /** Edges internal to S (both endpoints in S). */
  edges: SsotEdge[]
}

/** Extract the subgraph induced by a node subset S (internal edges). */
export function inducedSubgraph(graph: SsotGraph, nodeIds: Iterable<string>): InducedSubgraph {
  const set = new Set(nodeIds)
  const edges = graph.edges.filter((e) => set.has(e.from) && set.has(e.to))
  return { nodeIds: set, edges }
}

export interface TraverseOptions {
  filter?: EdgeFilter
  /** Max depth (unset = unbounded). The start node is depth 0. */
  maxDepth?: number
  /** Whether to traverse reverse (in) edges. Default false (out direction). */
  reverse?: boolean
}

/**
 * BFS over reachable node ids (excluding the start). Cycle-safe.
 * Pass an index for O(1) adjacency lookups.
 */
export function reachable(
  graph: SsotGraph,
  startId: string,
  options: TraverseOptions = {},
  index?: AdjacencyIndex,
): Set<string> {
  const { filter, maxDepth = Infinity, reverse = false } = options
  const idx = index ?? buildAdjacencyIndex(graph)
  const visited = new Set<string>([startId])
  const result = new Set<string>()
  let frontier: string[] = [startId]
  let depth = 0
  while (frontier.length > 0 && depth < maxDepth) {
    const next: string[] = []
    for (const id of frontier) {
      const edges = (reverse ? idx.in.get(id) : idx.out.get(id)) ?? []
      for (const edge of edges) {
        if (filter && !matches(edge, filter)) continue
        const target = reverse ? edge.from : edge.to
        if (visited.has(target)) continue
        visited.add(target)
        result.add(target)
        next.push(target)
      }
    }
    frontier = next
    depth++
  }
  return result
}

// ── impact closure ───────────────────────────────────────────────

/**
 * Conceptual-propagation relations for impact analysis: impacts / governs / governedBy / decidedBy,
 * plus every relatesTo edge (the ssot-studio scripts encoded these as 'relatesTo:*' raw rels).
 * Ported verbatim from governance.mjs's isImpactEdge so results stay equivalent (scenario A3-GRAPH).
 */
export const IMPACT_RELS: ReadonlySet<EdgeRel> = new Set<EdgeRel>([
  'impacts',
  'governs',
  'governedBy',
  'decidedBy',
  'relatesTo',
])

function isImpactEdge(edge: SsotEdge): boolean {
  return IMPACT_RELS.has(edge.rel)
}

export interface ImpactOptions {
  /** Max BFS depth, clamped to [1, 10]. Default 5 (matches governance.mjs). */
  maxDepth?: number
}

export interface ImpactClosureResult {
  /** Nodes propagation reaches from the seeds (seeds excluded). */
  impacted: string[]
  /** The impact edges traversed (may repeat when reached from multiple sides). */
  edges: SsotEdge[]
}

/**
 * From seedIds, walk impact edges in both directions (out + in) and return the reached node set
 * (seeds excluded) plus the traversed edges. Bidirectional BFS with a depth cap — a faithful port
 * of governance.mjs's impactClosure, run over the normalized SsotGraph.
 */
export function impactClosure(
  graph: SsotGraph,
  seedIds: Iterable<string>,
  options: ImpactOptions = {},
  index?: AdjacencyIndex,
): ImpactClosureResult {
  const { maxDepth = 5 } = options
  const idx = index ?? buildAdjacencyIndex(graph)
  const seeds = [...seedIds]
  const visited = new Set<string>(seeds)
  const reached = new Set<string>()
  const usedEdges: SsotEdge[] = []
  let frontier = [...seeds]
  const cap = Math.max(1, Math.min(maxDepth, 10))
  for (let d = 0; d < cap && frontier.length > 0; d++) {
    const next: string[] = []
    for (const cur of frontier) {
      const outEdges = idx.out.get(cur) ?? []
      const inEdges = idx.in.get(cur) ?? []
      for (const edge of [...outEdges, ...inEdges]) {
        if (!isImpactEdge(edge)) continue
        const other = edge.from === cur ? edge.to : edge.from
        usedEdges.push(edge)
        if (visited.has(other)) continue
        visited.add(other)
        reached.add(other)
        next.push(other)
      }
    }
    frontier = next
  }
  for (const s of seeds) reached.delete(s)
  return { impacted: [...reached], edges: usedEdges }
}

/** Node lookup helper (undefined when absent). */
export function getNode(graph: SsotGraph, id: string): SsotNode | undefined {
  return graph.nodes.get(id)
}
