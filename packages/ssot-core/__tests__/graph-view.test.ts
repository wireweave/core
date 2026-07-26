import { describe, it, expect } from 'vitest'
import {
  normalize,
  deriveGraphView,
  DEFAULT_KIND_LAYERS,
  SSOT_KINDS,
  type RawCatalog,
} from '../src/index.js'

const RAW: RawCatalog = {
  generatedFrom: 'fixture',
  nodeCount: 3,
  edgeCount: 3,
  nodes: [
    {
      id: 'platform.p',
      kind: 'Platform',
      title: 'P',
      file: 'p.md',
      confidence: 'high',
      lifecycle: 'active',
      tags: ['domain:core', 'status:active'],
    },
    {
      id: 'concept.a',
      kind: 'Concept',
      title: 'A',
      file: 'a.md',
      confidence: 'inferred',
      facets: { relatesTo: [{ to: 'concept.b', type: 'relates-to', note: 'because' }] },
    },
    { id: 'concept.b', kind: 'Concept', title: 'B', file: 'b.md', confidence: 'inferred' },
  ],
  edges: [
    { from: 'platform.p', to: 'concept.a', rel: 'realizedBy' },
    { from: 'concept.a', to: 'concept.b', rel: 'relatesTo:relates-to' },
    { from: 'concept.a', to: 'concept.ghost', rel: 'impacts' }, // dangling
  ],
  paths: [],
}

describe('deriveGraphView (A6-GRAPHVIEW)', () => {
  const graph = normalize(RAW)

  it('emits nodes with kind layer index, lifecycle, confidence, tags, cluster, degree', () => {
    const view = deriveGraphView(graph)
    const byId = new Map(view.nodes.map((n) => [n.id, n]))

    const p = byId.get('platform.p')
    expect(p?.layer).toBe(DEFAULT_KIND_LAYERS.Platform)
    expect(p?.layer).toBe(0)
    expect(p?.lifecycle).toBe('active')
    expect(p?.confidence).toBe('high')
    expect(p?.cluster).toBe('core') // first domain:* tag value
    expect(p?.degree).toBe(1)

    const a = byId.get('concept.a')
    expect(a?.layer).toBe(DEFAULT_KIND_LAYERS.Concept)
    expect(a?.degree).toBe(2) // one out (relatesTo), one in (realizedBy from platform)
    expect(a?.cluster).toBeUndefined()
  })

  it('emits links directly consumable by force-graph (source/target/rel[, type, note])', () => {
    const view = deriveGraphView(graph)
    // dangling dropped by default
    expect(view.links).toHaveLength(2)
    expect(view.dangling).toHaveLength(1)
    expect(view.dangling[0]?.target).toBe('concept.ghost')

    const rel = view.links.find((l) => l.rel === 'relatesTo')
    expect(rel).toMatchObject({ source: 'concept.a', target: 'concept.b', type: 'relates-to' })
    expect(rel?.note).toBe('because')

    // 3D consumer shape: nodes[{id}], links[{source,target}]
    for (const l of view.links) {
      expect(typeof l.source).toBe('string')
      expect(typeof l.target).toBe('string')
    }
  })

  it('includes dangling links in the main array when asked', () => {
    const view = deriveGraphView(graph, { includeDangling: true })
    expect(view.links).toHaveLength(3)
    expect(view.dangling).toHaveLength(1) // still reported separately
  })

  it('honours a per-kind layer override', () => {
    const view = deriveGraphView(graph, { layerByKind: { Platform: 99 } })
    const p = view.nodes.find((n) => n.id === 'platform.p')
    expect(p?.layer).toBe(99)
  })

  it('DEFAULT_KIND_LAYERS covers every kind', () => {
    for (const kind of SSOT_KINDS) {
      expect(typeof DEFAULT_KIND_LAYERS[kind]).toBe('number')
    }
  })
})
