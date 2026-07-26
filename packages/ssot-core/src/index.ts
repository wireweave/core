// @wireweave/ssot-core — the single source of truth for the SSOT domain
// (parser · normalized model · graph traversal · structure detection).
// Framework-agnostic, isomorphic TypeScript. Runs in Node (cli/daemon) and the browser.
// Zero runtime dependencies, bottom of the graph — nothing else here is imported.

// ── generated constants (derived from ssot-v1.schema.json) ───────
export {
  SSOT_KINDS,
  ID_PREFIX_TO_KIND,
  EDGE_RELS,
  EDGE_TYPES,
  EDGE_TYPE_NORMALIZATION,
  TAG_NAMESPACES,
  REQUIRED_FACETS_BY_KIND,
  REQUIRED_SECTIONS_BY_KIND,
} from './generated/constants.js'
export type { SsotKind, EdgeRel, EdgeType, TagNamespace } from './generated/constants.js'

// ── normalized domain types ──────────────────────────────────────
export type {
  Confidence,
  Authority,
  Lifecycle,
  FacetPurpose,
  FacetSemantics,
  FacetRealization,
  FacetAuthorityMeta,
  SsotFacets,
  RelatesEdge,
  ProvenancePath,
  SsotNode,
  SsotEdge,
  SsotGraph,
  ParseError,
  ParseErrorKind,
  CodeBlock,
  MarkdownSection,
  OpenItem,
  SsotNodeBody,
} from './types.js'

// ── YAML frontmatter parser ──────────────────────────────────────
export { parseYaml, splitFrontmatter } from './yaml.js'
export type { YamlValue, FrontmatterSplit } from './yaml.js'

// ── facet coercion / relatesTo restoration ───────────────────────
export {
  parseRelatesString,
  normalizeRelatesToValue,
  asStringArray,
  asString,
  asConfidence,
  asLifecycle,
  asLastVerified,
} from './facet-coerce.js'

// ── catalog load / normalization ─────────────────────────────────
export { normalize, splitEdgeRel } from './catalog.js'
export type { RawCatalog, RawCatalogNode, RawCatalogEdge, RawCatalogPath } from './catalog.js'

// ── body parser / authority merge ────────────────────────────────
export { parseMarkdownBody, parseNodeBody, mergeBodyIntoNode } from './body.js'

// ── node round-trip (parse ⇄ serialize) ──────────────────────────
export { parseNode, serializeNode } from './node-io.js'
export type { ParsedNode, SerializableNode } from './node-io.js'

// ── loader interface ─────────────────────────────────────────────
export { DefaultCatalogLoader, loadBody, hydrateNodeBody } from './loader.js'
export type { SsotCatalogLoader, SsotNodeBodyLoader, LoadBodyResult } from './loader.js'

// ── relation traversal + impact analysis ─────────────────────────
export {
  outgoingEdges,
  incomingEdges,
  neighbors,
  reverseNeighbors,
  buildAdjacencyIndex,
  inducedSubgraph,
  reachable,
  impactClosure,
  IMPACT_RELS,
  getNode,
} from './traversal.js'
export type {
  EdgeFilter,
  AdjacencyIndex,
  InducedSubgraph,
  TraverseOptions,
  ImpactOptions,
  ImpactClosureResult,
} from './traversal.js'

// ── tag classification / filter ──────────────────────────────────
export {
  parseTag,
  collectTagGroups,
  nodeMatchesTags,
  filterNodeIds,
  NAMESPACE_LABELS,
} from './tags.js'
export type { HasTags, ParsedTag, TagNamespaceGroup } from './tags.js'

// ── structure detection ──────────────────────────────────────────
export {
  classify,
  classifyStructure,
  computeSignals,
  detectStateSignals,
  isTreeShaped,
  DEFAULT_THRESHOLDS,
} from './structure.js'
export type {
  StructureKind,
  StructureSignals,
  ClassifyThresholds,
  ClassifyInput,
  ClassifyResult,
} from './structure.js'

// ── verify (deterministic completeness/conformance rules, A4) ─────
export { verify } from './verify.js'
export type {
  VerifyAdapter,
  VerifyOptions,
  VerifySeverity,
  VerifyFinding,
  VerifySkip,
  VerifySummary,
} from './verify.js'

// ── skeleton single-source + interview slots (A5) ─────────────────
export {
  SKELETONS,
  getSkeleton,
  OPEN_HEADING,
  renderSkeletonMarkdown,
  getInterviewSlots,
  getOpenSlots,
} from './skeleton/index.js'
export type {
  SkeletonAxis,
  FieldValueKind,
  FieldSlot,
  SectionSlot,
  SkeletonDef,
  InterviewSlot,
  RenderSkeletonParams,
} from './skeleton/index.js'

// ── graph-view derivation (2D/3D, A6) ─────────────────────────────
export { deriveGraphView, DEFAULT_KIND_LAYERS } from './graph-view.js'
export type { GraphViewNode, GraphViewLink, GraphView, GraphViewOptions } from './graph-view.js'
