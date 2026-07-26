// @wireweave/ssot-tools — the SSOT filesystem & orchestration layer.
//
// Node-only. All graph/parse/verify logic is delegated to @wireweave/ssot-core (the single graph
// home); this package supplies filesystem IO, catalog assembly, report layouts, and the
// deterministic governance/propose/flag surface. Its only runtime dependency is @wireweave/ssot-core.

// ── filesystem node store ────────────────────────────────────────
export {
  KIND_DIR,
  kindDir,
  nodeFilePath,
  listNodeFiles,
  readNodeFile,
  writeNodeFile,
  relNodePath,
} from './fs-store.js'

// ── catalog build (_catalog.json) ────────────────────────────────
export { buildCatalog, writeCatalog } from './catalog.js'
export type { Catalog, CatalogNode, CatalogParseError } from './catalog.js'

// ── scaffold ─────────────────────────────────────────────────────
export { scaffoldNode } from './scaffold.js'
export type { ScaffoldParams, ScaffoldResult } from './scaffold.js'

// ── verify runner (_gaps.md) ─────────────────────────────────────
export { runVerify, renderGapsReport } from './verify-runner.js'
export type { RunVerifyOptions, RunVerifyResult, RenderGapsParams } from './verify-runner.js'

// ── mirror sync ──────────────────────────────────────────────────
export { listMirroredNodes, syncMirrors } from './mirror-sync.js'
export type { MirroredNode, SyncMirrorsOptions, SyncMirrorsReport } from './mirror-sync.js'

// ── lifecycle sync (_lifecycle.md) ───────────────────────────────
export {
  detectLifecycleTransitions,
  applyLifecycleTransitions,
  renderLifecycleReport,
} from './lifecycle-sync.js'
export type {
  LifecycleCandidate,
  DetectLifecycleOptions,
  ApplyLifecycleReport,
} from './lifecycle-sync.js'

// ── auto-tag ─────────────────────────────────────────────────────
export { autoTag } from './auto-tag.js'
export type { AutoTagOptions, AutoTagReport } from './auto-tag.js'

// ── fill-version ─────────────────────────────────────────────────
export { fillVersion } from './fill-version.js'
export type { FillVersionOptions, FillVersionReport } from './fill-version.js'

// ── governance (classify / route / command text / impact report) ─
export {
  ROUTES,
  classifyChange,
  routePlan,
  ghIssueCmd,
  ghPrCmd,
  gitBranchCmds,
  impactReportMd,
} from './governance.js'
export type {
  Route,
  ChangeSignals,
  Classification,
  RoutePlan,
  GhIssueParams,
  GhPrParams,
  ImpactReportOptions,
} from './governance.js'

// ── propose (change → routed artifacts + command text) ───────────
export { proposeChange } from './propose.js'
export type {
  ProposedNode,
  ChangeDescriptor,
  ProposeOptions,
  ProposeResult,
  FileArtifact,
} from './propose.js'

// ── flag / capture issue construction ────────────────────────────
export { buildFlagIssue } from './flag.js'
export type { FlagType, FlagInput, FlagIssue } from './flag.js'
