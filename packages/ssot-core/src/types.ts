// Normalized domain types — the single source of truth for the SSOT node model.
//
// Design notes:
// - The schema (ssot-v1.schema.json) labels facets by [axis ①–④], so we promote those axes to
//   types: a viewer can then reason about per-axis completeness/gaps at compile time.
// - The authority for relatesTo is the node body frontmatter (an object) — single source of truth.
//   normalizeRelatesToValue restores both object and string forms (string is legacy-catalog defense).
//
// kind / id-prefix / edge-relation constants come from src/generated/constants.ts, which is
// generated from ssot-v1.schema.json. There is no hand-maintained duplicate to keep in sync
// (scenario A1-SCHEMA) — the original core kept a "must stay in sync with schema" comment here;
// that defect is removed by deriving the constants.

import { SSOT_KINDS, ID_PREFIX_TO_KIND, EDGE_RELS } from './generated/constants.js'
import type { SsotKind, EdgeRel } from './generated/constants.js'

export { SSOT_KINDS, ID_PREFIX_TO_KIND, EDGE_RELS }
export type { SsotKind, EdgeRel }

export type Confidence = 'high' | 'inferred' | 'unverified'
export type Authority = 'authored' | 'mirrored'
export type Lifecycle = 'planned' | 'active' | 'deprecated'

/** [axis ①] Purpose, value, and the personas served. */
export interface FacetPurpose {
  purpose?: string
  value?: string
  servesPersona: string[]
}

/** A relatesTo object (restored form). The authoritative shape in body frontmatter. */
export interface RelatesEdge {
  to: string
  type: string
  note?: string
}

/** [axis ②] Definition, conceptual relations, governance. */
export interface FacetSemantics {
  definition?: string
  relatesTo: RelatesEdge[]
  governedBy: string[]
  governs: string[]
}

/**
 * An implementedIn provenance path.
 * Optionally carries the existence-check result (exists) from verify.
 */
export interface ProvenancePath {
  from?: string
  raw: string
  field: 'implementedIn'
  exists?: boolean
}

/** [axis ③] Realization, implementation, dependency, propagation. */
export interface FacetRealization {
  realizedBy: string[]
  implementedIn: ProvenancePath[]
  dependsOn: string[]
  consumesApi: string[]
  providesApi: string[]
  impacts: string[]
  integratesWith: string[]
}

/** [axis ④] Authority meta: owner, decisions, lifecycle, confidence. */
export interface FacetAuthorityMeta {
  owner: string
  decidedBy: string[]
  lifecycle: Lifecycle
  confidence: Confidence
  lastVerified: string | null
}

export interface SsotFacets {
  purpose: FacetPurpose
  semantics: FacetSemantics
  realization: FacetRealization
  meta: FacetAuthorityMeta
}

/** A normalized node. */
export interface SsotNode {
  id: string
  kind: SsotKind
  title: string
  /** Body .md path (relative to catalog generatedFrom). */
  file: string
  /** Defaults to 'authored' when absent. */
  authority: Authority
  /** mirrored-only — the origin file path. */
  source?: string
  /** Classification tags — "namespace:value" (e.g. 'domain:auth', 'status:active'). */
  tags: string[]
  facets: SsotFacets
  /** Count of unresolved (OPEN) items. */
  openCount: number
  /** Filled after lazy body load. */
  body?: SsotNodeBody
}

export interface SsotEdge {
  from: string
  to: string
  rel: EdgeRel
  /** When rel='relatesTo', the <type> of 'relatesTo:<type>'. */
  relationType?: string
}

export type ParseErrorKind =
  | 'danglingEdge'
  | 'invalidRelatesTo'
  | 'unknownKind'
  | 'invalidId'
  | 'malformedFrontmatter'

export interface ParseError {
  kind: ParseErrorKind
  /** The related node id (when known). */
  nodeId?: string
  message: string
  /** The raw value (for debugging). */
  raw?: string
}

/** The normalized graph — the single model a viewer consumes. */
export interface SsotGraph {
  generatedFrom: string
  nodes: Map<string, SsotNode>
  edges: SsotEdge[]
  paths: ProvenancePath[]
  parseErrors: ParseError[]
}

// ── body model ───────────────────────────────────────────────────

export interface CodeBlock {
  lang?: string
  text: string
}

export interface MarkdownSection {
  heading: string
  level: number
  content: string
  codeBlocks: CodeBlock[]
}

/** A '- [ ] OPEN:' line. */
export interface OpenItem {
  checked: boolean
  text: string
}

export interface SsotNodeBody {
  frontmatter: Record<string, unknown>
  markdown: string
  sections: MarkdownSection[]
  openItems: OpenItem[]
}
