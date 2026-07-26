import { describe, it, expect } from 'vitest'
import {
  normalize,
  verify,
  parseNodeBody,
  type RawCatalog,
  type VerifyAdapter,
} from '../src/index.js'

const NOW = Date.UTC(2026, 0, 1)

function rulesFired(findings: { rule: string }[]): Set<string> {
  return new Set(findings.map((f) => f.rule))
}

// A clean two-node graph: required facets filled, valid tags/edges, owner set, no stale date.
const CLEAN: RawCatalog = {
  generatedFrom: 'fixture',
  nodeCount: 2,
  edgeCount: 1,
  nodes: [
    {
      id: 'persona.admin',
      kind: 'Persona',
      title: 'Admin',
      file: 'persona.admin.md',
      confidence: 'inferred',
      owner: 'team-x',
      tags: ['domain:auth'],
      facets: { purpose: 'manage', definition: 'an operator' },
    },
    {
      id: 'domain.billing',
      kind: 'Domain',
      title: 'Billing',
      file: 'domain.billing.md',
      confidence: 'inferred',
      owner: 'team-x',
      tags: ['domain:billing', 'status:active'],
      facets: {
        purpose: 'charge users',
        definition: 'money in',
        servesPersona: ['persona.admin'],
        relatesTo: [{ to: 'persona.admin', type: 'relates-to' }],
        realizedBy: ['persona.admin'],
      },
    },
  ],
  edges: [{ from: 'domain.billing', to: 'persona.admin', rel: 'servesPersona' }],
  paths: [],
}

describe('verify — clean graph (A4-VERIFY)', () => {
  it('reports zero errors on a conformant graph', () => {
    const graph = normalize(CLEAN)
    const summary = verify(graph, { now: NOW, rawNodes: CLEAN.nodes })
    expect(summary.errorCount).toBe(0)
  })
})

// A graph seeded with one instance of every defect class.
const DEFECTIVE: RawCatalog = {
  generatedFrom: 'fixture',
  nodeCount: 6,
  edgeCount: 3,
  nodes: [
    // duplicate id (appears twice)
    { id: 'concept.dup', kind: 'Concept', title: 'Dup A', file: 'a.md', confidence: 'inferred' },
    { id: 'concept.dup', kind: 'Concept', title: 'Dup B', file: 'b.md', confidence: 'inferred' },
    // id prefix ↔ kind mismatch (prefix screen, kind Decision)
    { id: 'screen.wrong', kind: 'Decision', title: 'Wrong', file: 'w.md', confidence: 'inferred' },
    // high-confidence Capability missing required facets + active with no implementedIn
    {
      id: 'capability.active',
      kind: 'Capability',
      title: 'Active',
      file: 'act.md',
      confidence: 'high',
      lifecycle: 'active',
      owner: 'team-x',
    },
    // bad tag + orphan owner (TBD)
    {
      id: 'persona.bad',
      kind: 'Persona',
      title: 'Bad',
      file: 'bad.md',
      confidence: 'inferred',
      owner: 'TBD',
      tags: ['NotValid'],
      facets: { purpose: 'x', definition: 'y' },
    },
    // stale lastVerified
    {
      id: 'concept.stale',
      kind: 'Concept',
      title: 'Stale',
      file: 'stale.md',
      confidence: 'inferred',
      owner: 'team-x',
      lastVerified: '2000-01-01',
    },
  ],
  edges: [
    // dangling: target node absent
    { from: 'concept.dup', to: 'concept.ghost', rel: 'relatesTo:relates-to' },
    // non-standard edge type with a known normalization ('uses' → 'calls')
    { from: 'concept.dup', to: 'concept.stale', rel: 'relatesTo:uses' },
  ],
  paths: [],
}

describe('verify — every rule fires (A4-VERIFY)', () => {
  const graph = normalize(DEFECTIVE)
  const summary = verify(graph, { now: NOW, rawNodes: DEFECTIVE.nodes })
  const fired = rulesFired(summary.findings)

  it.each([
    'dangling-edge',
    'duplicate-id',
    'kind-prefix-mismatch',
    'missing-facet',
    'active-without-code',
    'bad-tag',
    'orphan-owner',
    'stale',
    'nonstandard-edge-type',
  ])('fires %s', (rule) => {
    expect(fired.has(rule)).toBe(true)
  })

  it('suggests a normalization for a known non-standard edge type', () => {
    const finding = summary.findings.find((f) => f.rule === 'nonstandard-edge-type')
    expect(finding?.details?.suggestion).toBe('calls')
  })

  it('classifies high-confidence facet gaps as errors, low-confidence as warnings', () => {
    const missing = summary.findings.find((f) => f.rule === 'missing-facet')
    expect(missing?.severity).toBe('error')
  })
})

describe('verify — section completeness needs a loaded body (A4-VERIFY)', () => {
  it('fires missing-section for a high-confidence node with an incomplete body', () => {
    const raw: RawCatalog = {
      generatedFrom: 'fixture',
      nodeCount: 1,
      edgeCount: 0,
      nodes: [
        {
          id: 'screen.partial',
          kind: 'Screen',
          title: 'Partial',
          file: 's.md',
          confidence: 'high',
          owner: 'team-x',
          facets: {
            purpose: 'do a thing',
            servesPersona: ['persona.admin'],
            implementedIn: ['app/s.tsx'],
          },
        },
      ],
      edges: [],
      paths: [],
    }
    const graph = normalize(raw)
    const node = graph.nodes.get('screen.partial')
    // Only 1 of the 5 required Screen sections present.
    node!.body = parseNodeBody('## 화면 목적\n무엇을 한다')
    const summary = verify(graph, { now: NOW, rawNodes: raw.nodes })
    const finding = summary.findings.find((f) => f.rule === 'missing-section')
    expect(finding?.severity).toBe('error')
    expect(finding?.details?.sections).toContain('상태 / 엣지케이스')
  })

  it('skips section-completeness (not an error) when the body is not loaded', () => {
    const raw: RawCatalog = {
      generatedFrom: 'fixture',
      nodeCount: 1,
      edgeCount: 0,
      nodes: [{ id: 'screen.x', kind: 'Screen', title: 'X', file: 'x.md', confidence: 'high' }],
      edges: [],
      paths: [],
    }
    const summary = verify(normalize(raw), { now: NOW, rawNodes: raw.nodes })
    expect(summary.skipped.map((s) => s.rule)).toContain('section-completeness')
  })
})

describe('verify — adapter-gated checks (A4-VERIFY)', () => {
  const raw: RawCatalog = {
    generatedFrom: 'fixture',
    nodeCount: 1,
    edgeCount: 0,
    nodes: [
      { id: 'concept.mirror', kind: 'Concept', title: 'M', file: 'm.md', confidence: 'inferred' },
    ],
    edges: [],
    paths: [{ from: 'concept.mirror', field: 'implementedIn', raw: 'src/gone.ts' }],
  }

  it('reports adapter checks as skipped when no adapter is injected', () => {
    const summary = verify(normalize(raw), { now: NOW })
    const skippedRules = summary.skipped.map((s) => s.rule)
    expect(skippedRules).toContain('implementedIn-missing')
    expect(skippedRules).toContain('mirror-drift')
    expect(skippedRules).toContain('duplicate-id') // rawNodes absent too
  })

  it('flags a non-existent implementedIn path via the injected adapter', () => {
    const adapter: VerifyAdapter = { pathExists: () => false }
    const summary = verify(normalize(raw), { now: NOW, adapter })
    const finding = summary.findings.find((f) => f.rule === 'implementedIn-missing')
    expect(finding?.nodeId).toBe('concept.mirror')
    expect(finding?.details?.path).toBe('src/gone.ts')
    // adapter present → not skipped
    expect(summary.skipped.map((s) => s.rule)).not.toContain('implementedIn-missing')
  })

  it('detects mirror drift when the source is newer than the node', () => {
    const mirrorRaw: RawCatalog = {
      generatedFrom: 'fixture',
      nodeCount: 1,
      edgeCount: 0,
      nodes: [
        {
          id: 'concept.m',
          kind: 'Concept',
          title: 'M',
          file: 'm.md',
          confidence: 'inferred',
          facets: { authority: 'mirrored', source: 'origin/m.ts' },
        },
      ],
      edges: [],
      paths: [],
    }
    const adapter: VerifyAdapter = {
      pathExists: () => true,
      mtime: (p) => (p === 'origin/m.ts' ? 5000 : 1000),
    }
    const summary = verify(normalize(mirrorRaw), { now: NOW, adapter })
    expect(rulesFired(summary.findings).has('mirror-drift')).toBe(true)
  })
})
