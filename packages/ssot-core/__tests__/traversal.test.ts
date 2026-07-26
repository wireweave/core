import { describe, it, expect } from 'vitest'
import {
  normalize,
  impactClosure,
  neighbors,
  reachable,
  buildAdjacencyIndex,
  type RawCatalog,
} from '../src/index.js'

// A small fixture graph exercising every impact relation plus non-impact edges that must be
// excluded. Raw rel strings match what build-graph.mjs emits (relatesTo carries a ':type' suffix).
const RAW: RawCatalog = {
  generatedFrom: 'fixture',
  nodeCount: 7,
  edgeCount: 7,
  nodes: [
    { id: 'decision.d1', kind: 'Decision', title: 'D1', file: 'd1.md' },
    { id: 'concept.c1', kind: 'Concept', title: 'C1', file: 'c1.md' },
    { id: 'capability.cap1', kind: 'Capability', title: 'Cap1', file: 'cap1.md' },
    { id: 'domain.dom1', kind: 'Domain', title: 'Dom1', file: 'dom1.md' },
    { id: 'invariant.inv1', kind: 'Invariant', title: 'Inv1', file: 'inv1.md' },
    { id: 'component.comp1', kind: 'SystemComponent', title: 'Comp1', file: 'comp1.md' },
    { id: 'persona.p1', kind: 'Persona', title: 'P1', file: 'p1.md' },
  ],
  edges: [
    { from: 'decision.d1', to: 'concept.c1', rel: 'relatesTo:relates-to' },
    { from: 'capability.cap1', to: 'decision.d1', rel: 'decidedBy' },
    { from: 'concept.c1', to: 'domain.dom1', rel: 'impacts' },
    { from: 'capability.cap1', to: 'component.comp1', rel: 'realizedBy' }, // non-impact
    { from: 'invariant.inv1', to: 'capability.cap1', rel: 'governs' },
    { from: 'domain.dom1', to: 'persona.p1', rel: 'servesPersona' }, // non-impact
    { from: 'concept.c1', to: 'invariant.inv1', rel: 'governedBy' },
  ],
  paths: [],
}

describe('normalize + traversal (A3-GRAPH)', () => {
  const graph = normalize(RAW)

  it('normalizes edges with relationType recovered and no parse errors', () => {
    expect(graph.nodes.size).toBe(7)
    expect(graph.edges).toHaveLength(7)
    expect(graph.parseErrors).toHaveLength(0)
    const relatesEdge = graph.edges.find((e) => e.rel === 'relatesTo')
    expect(relatesEdge?.relationType).toBe('relates-to')
  })

  // Ground truth captured by running the original ssot-studio governance.mjs impactClosure against
  // this exact fixture: impacted = ["concept.c1","capability.cap1","domain.dom1","invariant.inv1"],
  // edges traversed = 10, depth-1 impacted = ["concept.c1","capability.cap1"].
  it('impactClosure matches governance.mjs output (order, set, edge count)', () => {
    const result = impactClosure(graph, ['decision.d1'])
    expect(result.impacted).toEqual([
      'concept.c1',
      'capability.cap1',
      'domain.dom1',
      'invariant.inv1',
    ])
    expect(result.edges).toHaveLength(10)
    // Non-impact edges never pull in their targets.
    expect(result.impacted).not.toContain('component.comp1')
    expect(result.impacted).not.toContain('persona.p1')
  })

  it('respects the depth cap like governance.mjs (maxDepth 1)', () => {
    const result = impactClosure(graph, ['decision.d1'], { maxDepth: 1 })
    expect(result.impacted).toEqual(['concept.c1', 'capability.cap1'])
  })

  it('accepts a prebuilt adjacency index (same result)', () => {
    const index = buildAdjacencyIndex(graph)
    const a = impactClosure(graph, ['decision.d1'], {}, index)
    const b = impactClosure(graph, ['decision.d1'])
    expect(a.impacted).toEqual(b.impacted)
  })

  it('neighbors and reachable operate over the same single graph model', () => {
    expect(neighbors(graph, 'concept.c1', { rel: 'impacts' })).toEqual(['domain.dom1'])
    // reachable follows out edges of all relations by default: c1 → dom1/inv1, inv1 → cap1,
    // cap1 → comp1/d1, dom1 → p1 — i.e. every other node (6) is reachable out from c1.
    const r = reachable(graph, 'concept.c1')
    expect(r.size).toBe(6)
    expect(r.has('domain.dom1')).toBe(true)
    expect(r.has('capability.cap1')).toBe(true)
    expect(r.has('concept.c1')).toBe(false) // start node excluded
    // With a maxDepth-1 out traversal only the direct out-neighbors are reached.
    const shallow = reachable(graph, 'concept.c1', { maxDepth: 1 })
    expect(shallow).toEqual(new Set(['domain.dom1', 'invariant.inv1']))
  })
})
