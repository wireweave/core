// Graph-view derivation (scenario A6-GRAPHVIEW) — turn the normalized SsotGraph into node/link
// arrays consumable directly by graph UIs:
//   - 2D (@xyflow): the consumer computes x/y positions; we supply a per-kind `layer` as a layout
//     hint (a layered/hierarchical placement) plus degree for sizing.
//   - 3D (react-force-graph-3d): consumes `{ nodes: [{ id, … }], links: [{ source, target }] }`
//     natively — our GraphViewNode/GraphViewLink match that shape.

import type { Lifecycle, Confidence, SsotGraph, SsotKind } from './types.js'

export interface GraphViewNode {
  id: string
  kind: SsotKind
  title: string
  /** Semantic layer index (layout hint). See DEFAULT_KIND_LAYERS. */
  layer: number
  lifecycle: Lifecycle
  confidence: Confidence
  tags: string[]
  /** Incident link count over the returned links (for sizing). */
  degree: number
  /** First `domain:*` tag value, when present (a coarse grouping / colour hint). */
  cluster?: string
}

export interface GraphViewLink {
  source: string
  target: string
  rel: string
  /** relatesTo edge subtype, when rel='relatesTo'. */
  type?: string
  /** Free-text note carried on the relatesTo edge (for tooltips). */
  note?: string
}

export interface GraphView {
  nodes: GraphViewNode[]
  links: GraphViewLink[]
  /** Links dropped because an endpoint is missing (always reported; see includeDangling). */
  dangling: GraphViewLink[]
}

export interface GraphViewOptions {
  /** Override the layer for specific kinds (merged over DEFAULT_KIND_LAYERS). */
  layerByKind?: Partial<Record<SsotKind, number>>
  /** Keep dangling links in `links` too (they are always also listed in `dangling`). Default false. */
  includeDangling?: boolean
}

/**
 * Semantic layering, product-context outermost → implementation innermost → cross-cutting last:
 *   Platform(0) — the product itself
 *   Persona(1)  — who it serves
 *   Domain(2)   — business areas
 *   Capability(3) — what users can do
 *   Flow(4)     — journeys across screens
 *   Screen / Concept(5) — the UI surface and the domain vocabulary it shows
 *   Endpoint(6) — the API surface behind screens
 *   SystemComponent(7) — the code units providing endpoints
 *   Integration(8) — external systems those components talk to
 *   Invariant / Decision(9) — constraints and rationale that cut across every layer
 * Layers are only layout hints; override any of them via options.layerByKind.
 */
export const DEFAULT_KIND_LAYERS: Record<SsotKind, number> = {
  Platform: 0,
  Persona: 1,
  Domain: 2,
  Capability: 3,
  Flow: 4,
  Screen: 5,
  Concept: 5,
  Endpoint: 6,
  SystemComponent: 7,
  Integration: 8,
  Invariant: 9,
  Decision: 9,
}

function domainCluster(tags: string[]): string | undefined {
  for (const tag of tags) {
    if (tag.startsWith('domain:')) return tag.slice('domain:'.length)
  }
  return undefined
}

/** Derive graph-view node/link arrays from a normalized SsotGraph. */
export function deriveGraphView(graph: SsotGraph, options: GraphViewOptions = {}): GraphView {
  const { layerByKind, includeDangling = false } = options
  const layerFor = (kind: SsotKind): number => layerByKind?.[kind] ?? DEFAULT_KIND_LAYERS[kind]

  const valid: GraphViewLink[] = []
  const dangling: GraphViewLink[] = []
  for (const edge of graph.edges) {
    const link: GraphViewLink = { source: edge.from, target: edge.to, rel: edge.rel }
    if (edge.relationType !== undefined) {
      link.type = edge.relationType
      const note = relatesNote(graph, edge.from, edge.to, edge.relationType)
      if (note !== undefined) link.note = note
    }
    if (graph.nodes.has(edge.from) && graph.nodes.has(edge.to)) valid.push(link)
    else dangling.push(link)
  }

  const links = includeDangling ? [...valid, ...dangling] : valid

  const degree = new Map<string, number>()
  for (const link of links) {
    if (graph.nodes.has(link.source)) degree.set(link.source, (degree.get(link.source) ?? 0) + 1)
    if (graph.nodes.has(link.target)) degree.set(link.target, (degree.get(link.target) ?? 0) + 1)
  }

  const nodes: GraphViewNode[] = []
  for (const node of graph.nodes.values()) {
    const viewNode: GraphViewNode = {
      id: node.id,
      kind: node.kind,
      title: node.title,
      layer: layerFor(node.kind),
      lifecycle: node.facets.meta.lifecycle,
      confidence: node.facets.meta.confidence,
      tags: node.tags,
      degree: degree.get(node.id) ?? 0,
    }
    const cluster = domainCluster(node.tags)
    if (cluster !== undefined) viewNode.cluster = cluster
    nodes.push(viewNode)
  }

  return { nodes, links, dangling }
}

/** Look up the note on the source node's relatesTo entry matching (to, type). */
function relatesNote(graph: SsotGraph, from: string, to: string, type: string): string | undefined {
  const node = graph.nodes.get(from)
  if (!node) return undefined
  const edge = node.facets.semantics.relatesTo.find((r) => r.to === to && r.type === type)
  return edge?.note
}
