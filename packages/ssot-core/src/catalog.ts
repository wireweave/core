// Catalog (_catalog.json) load + normalization.
//
// Key design facts:
// (1) The authority for relatesTo is the body .md frontmatter (a YAML object). Current catalogs
//     also serialize facets.relatesTo as proper objects ({to,type[,note]}); normalizeRelatesToValue
//     restores both object and string forms (the string path is legacy-catalog defense).
// (2) Catalog edges encode the relatesTo relation type as a 'relatesTo:owns' suffix — split on ':'
//     to recover relationType.

import {
  asConfidence,
  asLastVerified,
  asLifecycle,
  asString,
  asStringArray,
  normalizeRelatesToValue,
} from './facet-coerce.js'
import { ID_PREFIX_TO_KIND, SSOT_KINDS, EDGE_RELS } from './types.js'
import type {
  Authority,
  EdgeRel,
  ParseError,
  ProvenancePath,
  SsotEdge,
  SsotFacets,
  SsotGraph,
  SsotKind,
  SsotNode,
} from './types.js'

// ── Raw catalog shape (as read from the file) ────────────────────

export interface RawCatalogNode {
  id: string
  kind: string
  title: string
  file: string
  confidence?: string
  owner?: string
  lifecycle?: string
  lastVerified?: string
  openCount?: number
  /** Classification tags — "namespace:value". Catalog top-level. */
  tags?: unknown
  facets?: Record<string, unknown>
}

export interface RawCatalogEdge {
  from: string
  to: string
  rel: string
}

export interface RawCatalogPath {
  from: string
  field: string
  raw: string
}

export interface RawCatalog {
  generatedFrom: string
  nodeCount: number
  edgeCount: number
  nodes: RawCatalogNode[]
  edges: RawCatalogEdge[]
  paths: RawCatalogPath[]
  parseErrors?: unknown[]
}

function asAuthority(v: unknown): Authority {
  return v === 'mirrored' ? 'mirrored' : 'authored'
}

// ── edge rel decomposition ───────────────────────────────────────

/**
 * Normalize a catalog edge.rel. 'relatesTo:owns' → { rel:'relatesTo', relationType:'owns' }.
 * An unknown rel returns null (the caller records a parseError).
 */
export function splitEdgeRel(rel: string): { rel: EdgeRel; relationType?: string } | null {
  const colon = rel.indexOf(':')
  if (colon === -1) {
    return EDGE_RELS.includes(rel as EdgeRel) ? { rel: rel as EdgeRel } : null
  }
  const head = rel.slice(0, colon)
  const tail = rel.slice(colon + 1).trim()
  if (head === 'relatesTo') {
    return tail === '' ? { rel: 'relatesTo' } : { rel: 'relatesTo', relationType: tail }
  }
  return EDGE_RELS.includes(head as EdgeRel) ? { rel: head as EdgeRel } : null
}

// ── kind / id validation ─────────────────────────────────────────

const ID_PATTERN =
  /^(platform|persona|domain|concept|capability|component|integration|invariant|decision|screen|endpoint|flow)\.[a-z0-9][a-z0-9-]*$/

function asKind(v: unknown, id: string, errors: ParseError[]): SsotKind {
  if (typeof v === 'string' && (SSOT_KINDS as readonly string[]).includes(v)) {
    return v as SsotKind
  }
  // Try to recover from the id prefix.
  const prefix = id.split('.')[0] ?? ''
  const fromPrefix = ID_PREFIX_TO_KIND[prefix]
  if (fromPrefix) {
    return fromPrefix
  }
  errors.push({
    kind: 'unknownKind',
    nodeId: id,
    message: `unknown kind: ${String(v)}`,
    raw: String(v),
  })
  return 'Concept'
}

// ── facet group mapping ──────────────────────────────────────────

function buildFacets(
  raw: Record<string, unknown>,
  node: RawCatalogNode,
  errors: ParseError[],
): SsotFacets {
  // Optional string facets are set conditionally (exactOptionalPropertyTypes: absent, not undefined).
  const purpose: SsotFacets['purpose'] = { servesPersona: asStringArray(raw.servesPersona) }
  const purposeText = asString(raw.purpose)
  if (purposeText !== undefined) purpose.purpose = purposeText
  const valueText = asString(raw.value)
  if (valueText !== undefined) purpose.value = valueText

  const semantics: SsotFacets['semantics'] = {
    relatesTo: normalizeRelatesToValue(raw.relatesTo, node.id, errors),
    governedBy: asStringArray(raw.governedBy),
    governs: asStringArray(raw.governs),
  }
  const definition = asString(raw.definition)
  if (definition !== undefined) semantics.definition = definition

  return {
    purpose,
    semantics,
    realization: {
      realizedBy: asStringArray(raw.realizedBy),
      implementedIn: asStringArray(raw.implementedIn).map((rawPath) => ({
        from: node.id,
        raw: rawPath,
        field: 'implementedIn' as const,
      })),
      dependsOn: asStringArray(raw.dependsOn),
      consumesApi: asStringArray(raw.consumesApi),
      providesApi: asStringArray(raw.providesApi),
      impacts: asStringArray(raw.impacts),
      integratesWith: asStringArray(raw.integratesWith),
    },
    meta: {
      owner: asString(raw.owner) ?? asString(node.owner) ?? 'TBD',
      decidedBy: asStringArray(raw.decidedBy),
      lifecycle: asLifecycle(raw.lifecycle ?? node.lifecycle),
      confidence: asConfidence(raw.confidence ?? node.confidence),
      lastVerified: asLastVerified(raw.lastVerified ?? node.lastVerified),
    },
  }
}

function buildNode(raw: RawCatalogNode, errors: ParseError[]): SsotNode {
  if (!ID_PATTERN.test(raw.id)) {
    errors.push({
      kind: 'invalidId',
      nodeId: raw.id,
      message: `id pattern violation: ${raw.id}`,
      raw: raw.id,
    })
  }
  const facetsRaw: Record<string, unknown> = raw.facets ?? {}
  const node: SsotNode = {
    id: raw.id,
    kind: asKind(raw.kind ?? facetsRaw.kind, raw.id, errors),
    title: raw.title ?? asString(facetsRaw.title) ?? raw.id,
    file: raw.file,
    authority: asAuthority(facetsRaw.authority),
    // Tags: the catalog top-level is authoritative; fall back to facets.tags (legacy defense).
    tags: asStringArray(raw.tags ?? facetsRaw.tags),
    facets: buildFacets(facetsRaw, raw, errors),
    openCount: typeof raw.openCount === 'number' ? raw.openCount : 0,
  }
  const source = asString(facetsRaw.source)
  if (source) node.source = source
  return node
}

// ── normalize ────────────────────────────────────────────────────

/**
 * RawCatalog → SsotGraph.
 * (1) split edges[].rel on ':' → recover relationType.
 * (2) restore catalog facets.relatesTo strings (a hint later overwritten by the object form on load).
 * (3) map facets → the 4-axis groups.
 * (4) detect dangling edges (to/from missing nodes) and record parseErrors.
 */
export function normalize(raw: RawCatalog): SsotGraph {
  const errors: ParseError[] = []
  const nodes = new Map<string, SsotNode>()

  for (const rn of raw.nodes) {
    const node = buildNode(rn, errors)
    nodes.set(node.id, node)
  }

  const edges: SsotEdge[] = []
  for (const re of raw.edges) {
    const split = splitEdgeRel(re.rel)
    if (!split) {
      errors.push({
        kind: 'danglingEdge',
        message: `unknown edge rel: ${re.rel}`,
        raw: `${re.from} -> ${re.to} (${re.rel})`,
      })
      continue
    }
    const edge: SsotEdge = { from: re.from, to: re.to, rel: split.rel }
    if (split.relationType !== undefined) edge.relationType = split.relationType
    edges.push(edge)

    if (!nodes.has(re.from)) {
      errors.push({
        kind: 'danglingEdge',
        nodeId: re.from,
        message: `edge from-node missing: ${re.from}`,
        raw: `${re.from} -> ${re.to} (${re.rel})`,
      })
    }
    if (!nodes.has(re.to)) {
      errors.push({
        kind: 'danglingEdge',
        nodeId: re.to,
        message: `edge to-node missing: ${re.to}`,
        raw: `${re.from} -> ${re.to} (${re.rel})`,
      })
    }
  }

  const paths: ProvenancePath[] = raw.paths
    .filter((p) => p.field === 'implementedIn')
    .map((p) => ({ from: p.from, raw: p.raw, field: 'implementedIn' as const }))

  return {
    generatedFrom: raw.generatedFrom,
    nodes,
    edges,
    paths,
    parseErrors: errors,
  }
}
