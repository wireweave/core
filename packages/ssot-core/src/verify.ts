// Deterministic completeness/conformance verification over a normalized SsotGraph.
//
// A faithful port of the ssot-studio verify.mjs checks, expressed as pure functions:
//   - the structural checks run over the normalized model (nodes/edges/facets/body sections),
//   - filesystem-dependent checks (implementedIn existence, mirror drift) are delegated to an
//     injected VerifyAdapter, so the pure/browser call path works with no IO,
//   - duplicate-id and raw-scalar-missing checks read the pre-normalization node list (the Map
//     collapses duplicates and defaults missing scalars away), passed via options.rawNodes.
//
// Every finding carries a stable `rule` name and a severity: 'error' = defect/structural,
// 'warn' = informational/pending. Adapter/raw-dependent checks that cannot run report themselves
// in `summary.skipped` rather than silently passing.

import { ID_PREFIX_TO_KIND } from './types.js'
import {
  EDGE_TYPES,
  EDGE_TYPE_NORMALIZATION,
  REQUIRED_FACETS_BY_KIND,
  REQUIRED_SECTIONS_BY_KIND,
  TAG_NAMESPACES,
} from './generated/constants.js'
import type { RawCatalogNode } from './catalog.js'
import type { SsotGraph, SsotNode } from './types.js'

/** Injected IO for filesystem-dependent checks. Absent → those checks are skipped. */
export interface VerifyAdapter {
  /** True when the given (root-relative) path exists. */
  pathExists(path: string): boolean
  /** Modification time in epoch-ms, or undefined when unknown. Enables mirror-drift timing. */
  mtime?(path: string): number | undefined
}

export interface VerifyOptions {
  /** lastVerified staleness threshold in days. Default 90. */
  cadenceDays?: number
  /** Injected clock (epoch-ms) for deterministic staleness tests. Default Date.now(). */
  now?: number
  /** Filesystem adapter for implementedIn-existence and mirror-drift. */
  adapter?: VerifyAdapter
  /** Pre-normalization node list — enables duplicate-id and missing-scalar detection. */
  rawNodes?: readonly RawCatalogNode[]
}

export type VerifySeverity = 'error' | 'warn'

export interface VerifyFinding {
  /** Stable rule identifier (e.g. 'dangling-edge', 'missing-facet'). */
  rule: string
  severity: VerifySeverity
  /** The related node id, when the finding is node-scoped. */
  nodeId?: string
  message: string
  /** Structured payload for programmatic consumers (fields, sections, suggestions, …). */
  details?: Record<string, unknown>
}

export interface VerifySkip {
  rule: string
  reason: string
}

export interface VerifySummary {
  findings: VerifyFinding[]
  errorCount: number
  warnCount: number
  /** Checks that could not run because their input (adapter/rawNodes) was absent. */
  skipped: VerifySkip[]
}

const ID_PATTERN =
  /^(platform|persona|domain|concept|capability|component|integration|invariant|decision|screen|endpoint|flow)\.[a-z0-9][a-z0-9-]*$/
const TAG_PATTERN = /^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/
const STD_EDGE_TYPES = new Set<string>(EDGE_TYPES)
const TAG_NS = new Set<string>(TAG_NAMESPACES)
const MS_PER_DAY = 86_400_000

function isEmptyValue(v: unknown): boolean {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
}

/** Resolve a flat required-facet field name to its value in the normalized 4-axis facets. */
function facetValue(node: SsotNode, field: string): unknown {
  const f = node.facets
  switch (field) {
    case 'purpose':
      return f.purpose.purpose
    case 'value':
      return f.purpose.value
    case 'servesPersona':
      return f.purpose.servesPersona
    case 'definition':
      return f.semantics.definition
    case 'relatesTo':
      return f.semantics.relatesTo
    case 'governedBy':
      return f.semantics.governedBy
    case 'governs':
      return f.semantics.governs
    case 'realizedBy':
      return f.realization.realizedBy
    case 'implementedIn':
      return f.realization.implementedIn
    case 'dependsOn':
      return f.realization.dependsOn
    case 'consumesApi':
      return f.realization.consumesApi
    case 'providesApi':
      return f.realization.providesApi
    case 'impacts':
      return f.realization.impacts
    case 'integratesWith':
      return f.realization.integratesWith
    case 'owner':
      return f.meta.owner
    case 'decidedBy':
      return f.meta.decidedBy
    case 'lifecycle':
      return f.meta.lifecycle
    case 'confidence':
      return f.meta.confidence
    case 'lastVerified':
      return f.meta.lastVerified
    default:
      return undefined
  }
}

/** Lift the graph's own parse errors into findings (they are already-detected structural defects). */
function liftParseErrors(graph: SsotGraph, out: VerifyFinding[]): void {
  const ruleByKind: Record<string, string> = {
    danglingEdge: 'dangling-edge',
    invalidRelatesTo: 'invalid-relates-to',
    unknownKind: 'unknown-kind',
    invalidId: 'invalid-id',
    malformedFrontmatter: 'malformed-frontmatter',
  }
  for (const pe of graph.parseErrors) {
    const finding: VerifyFinding = {
      rule: ruleByKind[pe.kind] ?? 'parse-error',
      severity: 'error',
      message: pe.message,
    }
    if (pe.nodeId !== undefined) finding.nodeId = pe.nodeId
    if (pe.raw !== undefined) finding.details = { raw: pe.raw }
    out.push(finding)
  }
}

/** Duplicate ids + missing/invalid required scalars — only detectable from the raw node list. */
function checkRawNodes(rawNodes: readonly RawCatalogNode[], out: VerifyFinding[]): void {
  const counts = new Map<string, number>()
  for (const n of rawNodes) {
    if (n.id) counts.set(n.id, (counts.get(n.id) ?? 0) + 1)
    const errors: string[] = []
    if (!n.id) errors.push('id missing')
    else if (!ID_PATTERN.test(n.id)) errors.push(`id pattern violation: ${n.id}`)
    if (!n.kind) errors.push('kind missing')
    if (!n.title) errors.push('title missing')
    if (n.confidence !== undefined && !['high', 'inferred', 'unverified'].includes(n.confidence)) {
      errors.push(`confidence enum violation: ${n.confidence}`)
    }
    if (errors.length > 0) {
      const finding: VerifyFinding = {
        rule: 'schema-error',
        severity: 'error',
        message: errors.join('; '),
        details: { file: n.file, errors },
      }
      if (n.id) finding.nodeId = n.id
      out.push(finding)
    }
  }
  for (const [id, count] of counts) {
    if (count > 1) {
      out.push({
        rule: 'duplicate-id',
        severity: 'error',
        nodeId: id,
        message: `duplicate id: ${id} (${count}×)`,
        details: { count },
      })
    }
  }
}

/** id-prefix ↔ kind consistency: the prefix's kind must match the declared kind. */
function checkKindPrefix(node: SsotNode, out: VerifyFinding[]): void {
  const prefix = node.id.split('.', 1)[0] ?? ''
  const expected = ID_PREFIX_TO_KIND[prefix]
  if (expected && node.kind !== expected) {
    out.push({
      rule: 'kind-prefix-mismatch',
      severity: 'error',
      nodeId: node.id,
      message: `kind '${node.kind}' but id prefix '${prefix}' implies '${expected}'`,
      details: { kind: node.kind, expected },
    })
  }
}

/** Required-facet completeness. high-confidence ⇒ defect (error); otherwise pending (warn). */
function checkFacets(node: SsotNode, out: VerifyFinding[]): void {
  const req = REQUIRED_FACETS_BY_KIND[node.kind] ?? []
  const empty = req.filter((field) => isEmptyValue(facetValue(node, field)))
  if (empty.length === 0) return
  const high = node.facets.meta.confidence === 'high'
  out.push({
    rule: high ? 'missing-facet' : 'pending-facet',
    severity: high ? 'error' : 'warn',
    nodeId: node.id,
    message: `${high ? 'missing' : 'pending'} required facets: ${empty.join(', ')}`,
    details: { fields: empty, confidence: node.facets.meta.confidence },
  })
}

/** Required-section completeness (needs the loaded body). high-confidence ⇒ defect. */
function checkSections(node: SsotNode, out: VerifyFinding[]): boolean {
  const req = REQUIRED_SECTIONS_BY_KIND[node.kind]
  if (!req || req.length === 0) return true
  if (!node.body) return false // caller reports the skip
  const have = new Set(node.body.sections.map((s) => s.heading))
  const missing = req.filter((s) => !have.has(s))
  if (missing.length === 0) return true
  const high = node.facets.meta.confidence === 'high'
  out.push({
    rule: high ? 'missing-section' : 'pending-section',
    severity: high ? 'error' : 'warn',
    nodeId: node.id,
    message: `${high ? 'missing' : 'pending'} required sections: ${missing.join(', ')}`,
    details: { sections: missing, confidence: node.facets.meta.confidence },
  })
  return true
}

/** Tag vocabulary: 'namespace:value' shape + allowed namespace. */
function checkTags(node: SsotNode, out: VerifyFinding[]): void {
  const bad: string[] = []
  for (const tag of node.tags) {
    if (!TAG_PATTERN.test(tag)) {
      bad.push(`${tag} (not 'namespace:value')`)
      continue
    }
    const ns = tag.split(':', 1)[0] ?? ''
    if (!TAG_NS.has(ns)) bad.push(`${tag} (namespace '${ns}' not allowed)`)
  }
  if (bad.length > 0) {
    out.push({
      rule: 'bad-tag',
      severity: 'warn',
      nodeId: node.id,
      message: `non-standard tags: ${bad.join(', ')}`,
      details: { tags: bad },
    })
  }
}

/** lastVerified older than cadenceDays. */
function checkStale(node: SsotNode, cadenceDays: number, now: number, out: VerifyFinding[]): void {
  const lv = node.facets.meta.lastVerified
  if (!lv) return
  const t = new Date(lv).getTime()
  if (Number.isNaN(t)) return
  const ageDays = Math.floor((now - t) / MS_PER_DAY)
  if (ageDays > cadenceDays) {
    out.push({
      rule: 'stale',
      severity: 'warn',
      nodeId: node.id,
      message: `lastVerified ${lv} is ${ageDays}d old (cadence ${cadenceDays}d)`,
      details: { lastVerified: lv, ageDays },
    })
  }
}

/** owner missing or the placeholder 'TBD'. */
function checkOrphanOwner(node: SsotNode, out: VerifyFinding[]): void {
  const owner = node.facets.meta.owner
  if (!owner || owner === 'TBD') {
    out.push({ rule: 'orphan-owner', severity: 'warn', nodeId: node.id, message: 'owner is TBD' })
  }
}

/** lifecycle=active but a code-bearing kind has no implementedIn. */
function checkActiveWithoutCode(node: SsotNode, out: VerifyFinding[]): void {
  if (node.facets.meta.lifecycle !== 'active') return
  if (!(REQUIRED_FACETS_BY_KIND[node.kind] ?? []).includes('implementedIn')) return
  if (node.facets.realization.implementedIn.length === 0) {
    out.push({
      rule: 'active-without-code',
      severity: 'warn',
      nodeId: node.id,
      message: 'lifecycle=active but implementedIn is empty',
    })
  }
}

/** relatesTo edge types outside the controlled vocabulary, with a normalization suggestion. */
function checkEdgeTypes(graph: SsotGraph, out: VerifyFinding[]): void {
  const seen = new Map<string, string[]>()
  for (const e of graph.edges) {
    if (e.rel !== 'relatesTo') continue
    const t = e.relationType
    if (!t || t === '?' || STD_EDGE_TYPES.has(t)) continue
    const froms = seen.get(t) ?? []
    froms.push(e.from)
    seen.set(t, froms)
  }
  for (const [type, froms] of seen) {
    const suggestion = EDGE_TYPE_NORMALIZATION[type]
    out.push({
      rule: 'nonstandard-edge-type',
      severity: 'warn',
      message: `relatesTo:${type} is not a standard edge type${
        suggestion ? ` (suggest '${suggestion}')` : ''
      }`,
      details: { type, count: froms.length, sample: froms[0], suggestion },
    })
  }
}

const PATH_TAIL = /[)\].,]+$/

/** implementedIn provenance paths that do not exist on disk. Requires the adapter. */
function checkImplementedInPaths(
  graph: SsotGraph,
  adapter: VerifyAdapter,
  out: VerifyFinding[],
): void {
  for (const p of graph.paths) {
    if (p.field !== 'implementedIn') continue
    const token = (p.raw.split(/\s+/)[0] ?? '').replace(PATH_TAIL, '')
    if (!token) continue
    if (!adapter.pathExists(token)) {
      const finding: VerifyFinding = {
        rule: 'implementedIn-missing',
        severity: 'error',
        message: `implementedIn path does not exist: ${token}`,
        details: { path: token },
      }
      if (p.from !== undefined) finding.nodeId = p.from
      out.push(finding)
    }
  }
}

/** mirrored nodes: source must exist and not be newer than the mirror (drift). Requires adapter. */
function checkMirrorDrift(graph: SsotGraph, adapter: VerifyAdapter, out: VerifyFinding[]): void {
  for (const node of graph.nodes.values()) {
    if (node.authority !== 'mirrored') continue
    const src = node.source
    if (!src) {
      out.push({
        rule: 'mirror-drift',
        severity: 'error',
        nodeId: node.id,
        message: 'mirrored node has no source',
      })
      continue
    }
    if (!adapter.pathExists(src)) {
      out.push({
        rule: 'mirror-drift',
        severity: 'error',
        nodeId: node.id,
        message: `mirror source missing: ${src}`,
        details: { source: src },
      })
      continue
    }
    if (adapter.mtime) {
      const srcM = adapter.mtime(src)
      const nodeM = adapter.mtime(node.file)
      if (srcM !== undefined && nodeM !== undefined && srcM > nodeM + 1000) {
        out.push({
          rule: 'mirror-drift',
          severity: 'error',
          nodeId: node.id,
          message: `mirror source is newer than the node — re-sync needed (${src})`,
          details: { source: src },
        })
      }
    }
  }
}

/**
 * Run every deterministic verification check over the normalized graph.
 * Pure and isomorphic: filesystem-dependent checks run only when an adapter is injected, and
 * duplicate/raw-scalar checks run only when rawNodes are supplied — otherwise they are reported
 * as skipped so a caller never mistakes an un-run check for a pass.
 */
export function verify(graph: SsotGraph, options: VerifyOptions = {}): VerifySummary {
  const { cadenceDays = 90, now = Date.now(), adapter, rawNodes } = options
  const findings: VerifyFinding[] = []
  const skipped: VerifySkip[] = []

  liftParseErrors(graph, findings)

  if (rawNodes) checkRawNodes(rawNodes, findings)
  else skipped.push({ rule: 'duplicate-id', reason: 'options.rawNodes not provided' })

  let sectionsSkipped = false
  for (const node of graph.nodes.values()) {
    checkKindPrefix(node, findings)
    checkFacets(node, findings)
    if (!checkSections(node, findings)) sectionsSkipped = true
    checkTags(node, findings)
    checkStale(node, cadenceDays, now, findings)
    checkOrphanOwner(node, findings)
    checkActiveWithoutCode(node, findings)
  }
  if (sectionsSkipped) {
    skipped.push({ rule: 'section-completeness', reason: 'node body not loaded for some nodes' })
  }

  checkEdgeTypes(graph, findings)

  if (adapter) {
    checkImplementedInPaths(graph, adapter, findings)
    checkMirrorDrift(graph, adapter, findings)
  } else {
    skipped.push({ rule: 'implementedIn-missing', reason: 'no VerifyAdapter injected' })
    skipped.push({ rule: 'mirror-drift', reason: 'no VerifyAdapter injected' })
  }

  let errorCount = 0
  let warnCount = 0
  for (const f of findings) {
    if (f.severity === 'error') errorCount++
    else warnCount++
  }
  return { findings, errorCount, warnCount, skipped }
}
