# @wireweave/ssot-core

Core logic for the SSOT (Single Source of Truth) node model — frontmatter/body parsing, a
normalized relation graph, traversal + impact analysis, and structure detection.

Pure functions, **zero runtime dependencies**, isomorphic (runs identically in Node and the
browser). It knows nothing about UI, runtime, or data source: callers inject IO.

## What it is

The SSOT model is a set of product-definition markdown nodes (Platform / Persona / Domain /
Concept / Capability / SystemComponent / Integration / Invariant / Decision / Screen / Endpoint /
Flow — 12 kinds). Each node is a `.md` file with a YAML frontmatter (facets across 4 axes) and a
body of standard sections. This package turns those files, and the `_catalog.json` index built from
them, into a typed graph and the operations over it.

## API surface

| Area               | Exports                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constants (schema) | `SSOT_KINDS`, `ID_PREFIX_TO_KIND`, `EDGE_RELS`, `EDGE_TYPES`, `EDGE_TYPE_NORMALIZATION`, `TAG_NAMESPACES`, `REQUIRED_FACETS_BY_KIND`, `REQUIRED_SECTIONS_BY_KIND` |
| Domain types       | `SsotNode`, `SsotEdge`, `SsotGraph`, `SsotFacets`, `RelatesEdge`, `SsotKind`, `EdgeRel`, …                                                                        |
| YAML frontmatter   | `parseYaml`, `splitFrontmatter`                                                                                                                                   |
| Node round-trip    | `parseNode`, `serializeNode`                                                                                                                                      |
| Catalog            | `normalize`, `splitEdgeRel`                                                                                                                                       |
| Body / merge       | `parseNodeBody`, `parseMarkdownBody`, `mergeBodyIntoNode`                                                                                                         |
| Loader             | `DefaultCatalogLoader`, `loadBody`, `hydrateNodeBody`                                                                                                             |
| Traversal / impact | `neighbors`, `reverseNeighbors`, `reachable`, `impactClosure`, `buildAdjacencyIndex`, `inducedSubgraph`, `IMPACT_RELS`                                            |
| Tags               | `parseTag`, `collectTagGroups`, `nodeMatchesTags`, `filterNodeIds`                                                                                                |
| Structure          | `classify`, `classifyStructure`, `computeSignals`, `detectStateSignals`, `isTreeShaped`                                                                           |
| Coercion           | `asString`, `asStringArray`, `asConfidence`, `asLifecycle`, `asLastVerified`, `parseRelatesString`, `normalizeRelatesToValue`                                     |
| Verify             | `verify`, `VerifyAdapter`, `VerifyFinding`, `VerifySummary`, `VerifyOptions`                                                                                      |
| Skeleton / slots   | `getSkeleton`, `SKELETONS`, `renderSkeletonMarkdown`, `getInterviewSlots`, `getOpenSlots`, `FieldSlot`, `SectionSlot`, `SkeletonDef`, `InterviewSlot`             |
| Graph view         | `deriveGraphView`, `DEFAULT_KIND_LAYERS`, `GraphViewNode`, `GraphViewLink`, `GraphView`                                                                           |

### Verify

`verify(graph, { cadenceDays?, now?, adapter?, rawNodes? })` runs every deterministic
completeness/conformance check over a normalized `SsotGraph` and returns a `VerifySummary`
(`{ findings, errorCount, warnCount, skipped }`). Each finding carries a stable `rule` and a
severity (`error` = structural/high-confidence defect, `warn` = pending/informational). It stays
pure and isomorphic: filesystem checks (`implementedIn-missing`, `mirror-drift`) run only when a
`VerifyAdapter` (`pathExists` / optional `mtime`) is injected, and duplicate-id / raw-scalar checks
run only when the pre-normalization `rawNodes` are supplied — otherwise those checks are reported in
`summary.skipped` rather than silently passing.

### Skeleton single-source + interview slots

The 12 kind skeletons are authored once as structured `SkeletonDef`s (`getSkeleton(kind)`). Both the
markdown skeleton (`renderSkeletonMarkdown(kind, { id, title })`) and the structured interview slots
derive from them. `getInterviewSlots(kind)` returns the full template (every field, section, and
OPEN seed); `getOpenSlots(markdownOrParsed)` returns only the still-unfilled slots (fields at their
placeholder default, sections missing or empty after stripping HTML comments, unchecked `OPEN`
items). Slot detection is deterministic — question-sentence generation is left to the LLM downstream.

### Graph view

`deriveGraphView(graph, options?)` produces `{ nodes, links, dangling }` consumable directly by
graph UIs: `nodes` carry a per-kind `layer` (see `DEFAULT_KIND_LAYERS`), `lifecycle`, `confidence`,
`tags`, `degree`, and a `cluster` (first `domain:*` tag). `links` use `{ source, target, rel }`
(plus `type` / `note` for `relatesTo`) — the shape `react-force-graph-3d` consumes natively, while
`@xyflow` consumers use `layer` as a layout hint. Dangling links are dropped by default and reported
in `dangling` (keep them in `links` with `includeDangling: true`); override layering via
`layerByKind`.

### Impact analysis

`impactClosure(graph, seedIds, { maxDepth })` walks the conceptual-propagation relations
(`impacts` / `governs` / `governedBy` / `decidedBy` / any `relatesTo`) in both directions from the
seed nodes and returns the reached set plus traversed edges. This is the single home for that graph
logic — the ssot-studio scripts (`governance.mjs`, `build-graph.mjs`) each re-implemented it; here
it exists exactly once over the normalized `SsotGraph`.

## Schema-derived constants

`SSOT_KINDS`, `ID_PREFIX_TO_KIND`, edge relations/types, tag namespaces, and the per-kind required
facets/sections are **generated** from `src/schema/ssot-v1.schema.json` into
`src/generated/constants.ts` by `scripts/generate-constants.mjs`. There is no hand-maintained
duplicate: change the schema, run `pnpm build:schema`, and the constants follow. `build` runs
`build:schema` before `tsup`.

## Build / test

```bash
pnpm build       # build:schema (generate constants) → tsup (esm + cjs + dts)
pnpm typecheck
pnpm lint
pnpm test
pnpm knip
pnpm publint
```

## Provenance

Ported and improved from `ssot-studio/ssot-core` (the reference implementation). Changes in this
port: constants are derived from the schema instead of hand-listed; the `EngineeringRule` kind is
dropped (12 kinds per `decision.release-2-0`); the graph/impact logic that the ssot-studio scripts
duplicated is unified here; a `parseNode`/`serializeNode` round-trip is added; and everything is
adapted to the monorepo's strict tsconfig (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax`).
