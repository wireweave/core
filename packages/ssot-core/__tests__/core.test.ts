import { describe, it, expect } from 'vitest'
import {
  parseYaml,
  splitFrontmatter,
  splitEdgeRel,
  normalize,
  parseNodeBody,
  mergeBodyIntoNode,
  parseRelatesString,
  collectTagGroups,
  nodeMatchesTags,
  classify,
  detectStateSignals,
  type RawCatalog,
  type SsotNode,
} from '../src/index.js'

describe('yaml subset parser', () => {
  it('parses scalars, quoted strings, flow sequences, and block-mapping sequences', () => {
    const y = parseYaml(
      [
        'id: x.y',
        'title: "hi there"',
        'flag: true',
        'num: 42',
        'tags: [a:b, c:d]',
        'relatesTo:',
        '  - to: p.q',
        '    type: calls',
        '    note: some note, with comma',
      ].join('\n'),
    )
    expect(y.id).toBe('x.y')
    expect(y.title).toBe('hi there')
    expect(y.flag).toBe(true)
    expect(y.num).toBe(42)
    expect(y.tags).toEqual(['a:b', 'c:d'])
    expect(y.relatesTo).toEqual([{ to: 'p.q', type: 'calls', note: 'some note, with comma' }])
  })

  it('strips inline comments outside quotes', () => {
    const { frontmatter, body, hasFrontmatter } = splitFrontmatter(
      '---\nid: a.b  # trailing comment\n---\nbody text\n',
    )
    expect(hasFrontmatter).toBe(true)
    expect(frontmatter.id).toBe('a.b')
    expect(body).toBe('body text\n')
  })
})

describe('catalog normalization', () => {
  const raw: RawCatalog = {
    generatedFrom: 'x',
    nodeCount: 2,
    edgeCount: 2,
    nodes: [
      { id: 'concept.a', kind: 'Concept', title: 'A', file: 'a.md' },
      { id: 'invariant.b', kind: 'Invariant', title: 'B', file: 'b.md' },
    ],
    edges: [
      { from: 'concept.a', to: 'invariant.b', rel: 'governedBy' },
      { from: 'concept.a', to: 'concept.missing', rel: 'relatesTo:owns' },
    ],
    paths: [],
  }

  it('splits edge rels and recovers relationType', () => {
    expect(splitEdgeRel('relatesTo:owns')).toEqual({ rel: 'relatesTo', relationType: 'owns' })
    expect(splitEdgeRel('governedBy')).toEqual({ rel: 'governedBy' })
    expect(splitEdgeRel('bogus')).toBeNull()
  })

  it('detects dangling edges as parse errors', () => {
    const graph = normalize(raw)
    expect(graph.nodes.size).toBe(2)
    expect(graph.edges).toHaveLength(2)
    const dangling = graph.parseErrors.filter((e) => e.kind === 'danglingEdge')
    expect(dangling.some((e) => e.nodeId === 'concept.missing')).toBe(true)
  })
})

describe('body authority merge', () => {
  it('overrides catalog facets with body frontmatter and recomputes openCount', () => {
    const graph = normalize({
      generatedFrom: 'x',
      nodeCount: 1,
      edgeCount: 0,
      nodes: [
        {
          id: 'concept.a',
          kind: 'Concept',
          title: 'A',
          file: 'a.md',
          facets: { definition: 'stale' },
        },
      ],
      edges: [],
      paths: [],
    })
    const node = graph.nodes.get('concept.a') as SsotNode
    const body = parseNodeBody(
      [
        '---',
        'id: concept.a',
        'kind: Concept',
        'title: A',
        'definition: fresh definition',
        'governs: [invariant.x, invariant.y]',
        '---',
        '## 미확정 (OPEN)',
        '- [ ] OPEN: still open',
        '- [x] resolved',
      ].join('\n'),
    )
    const merged = mergeBodyIntoNode(node, body)
    expect(merged.facets.semantics.definition).toBe('fresh definition')
    expect(merged.facets.semantics.governs).toEqual(['invariant.x', 'invariant.y'])
    expect(merged.openCount).toBe(1) // one unchecked OPEN item
    expect(node.facets.semantics.definition).toBe('stale') // input not mutated
  })

  it('restores a legacy relatesTo string', () => {
    expect(parseRelatesString('{ to: concept.x, type: builds, note: a, b, c }')).toEqual({
      to: 'concept.x',
      type: 'builds',
      note: 'a, b, c',
    })
  })
})

describe('tags', () => {
  const nodes = [
    { id: 'n1', tags: ['domain:auth', 'status:active'] },
    { id: 'n2', tags: ['domain:billing', 'status:active'] },
    { id: 'n3', tags: ['freeform'] },
  ]

  it('groups tags by namespace with etc last', () => {
    const groups = collectTagGroups(nodes)
    expect(groups[0]?.namespace).toBe('domain')
    expect(groups.at(-1)?.namespace).toBe('etc')
  })

  it('applies OR within namespace and AND across namespaces', () => {
    // both domains OR + status:active → n1 and n2 pass
    const selected = new Set(['domain:auth', 'domain:billing', 'status:active'])
    expect(nodeMatchesTags(nodes[0]!, selected)).toBe(true)
    expect(nodeMatchesTags(nodes[1]!, selected)).toBe(true)
    expect(nodeMatchesTags(nodes[2]!, selected)).toBe(false)
  })
})

describe('structure classification', () => {
  const treeGraph = normalize({
    generatedFrom: 'x',
    nodeCount: 3,
    edgeCount: 2,
    nodes: [
      { id: 'domain.root', kind: 'Domain', title: 'R', file: 'r.md' },
      { id: 'component.a', kind: 'SystemComponent', title: 'A', file: 'a.md' },
      { id: 'component.b', kind: 'SystemComponent', title: 'B', file: 'b.md' },
    ],
    edges: [
      { from: 'domain.root', to: 'component.a', rel: 'realizedBy' },
      { from: 'domain.root', to: 'component.b', rel: 'realizedBy' },
    ],
    paths: [],
  })

  it('classifies a containment hierarchy as a tree', () => {
    const result = classify({
      nodes: [...treeGraph.nodes.values()],
      edges: treeGraph.edges,
    })
    expect(result.kind).toBe('tree')
  })

  it('detects state-machine signals in body prose', () => {
    const sig = detectStateSignals('lifecycle: ACTIVE | EXPIRED | DELETED\n발급 → 연장 → 만료')
    expect(sig.hasStateEnum).toBe(true)
    expect(sig.hasTransitionProse).toBe(true)
  })
})
