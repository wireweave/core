# @wireweave/ssot-tools

The SSOT filesystem & orchestration layer — catalog build, node scaffold, verify runner, mirror /
lifecycle sync, tag / version stamping, and the deterministic governance / propose / flag surface.

Node-only. Its **only runtime dependency is `@wireweave/ssot-core`**: every graph, parse, and verify
rule lives there, and this package supplies the filesystem IO, catalog assembly, report layouts, and
command-text generation on top. There is no reimplementation of frontmatter parsing, edge extraction,
impact traversal, or verify rules here.

## API surface

| Area             | Exports                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Filesystem store | `KIND_DIR`, `kindDir`, `nodeFilePath`, `listNodeFiles`, `readNodeFile`, `writeNodeFile`             |
| Catalog          | `buildCatalog`, `writeCatalog` (`Catalog`, `CatalogNode`)                                           |
| Scaffold         | `scaffoldNode`                                                                                      |
| Verify runner    | `runVerify`, `renderGapsReport` → `_gaps.md`                                                        |
| Mirror sync      | `listMirroredNodes`, `syncMirrors`                                                                  |
| Lifecycle sync   | `detectLifecycleTransitions`, `applyLifecycleTransitions`, `renderLifecycleReport`                  |
| Tag / version    | `autoTag`, `fillVersion`                                                                            |
| Governance       | `classifyChange`, `routePlan`, `ROUTES`, `impactReportMd`, `ghIssueCmd`, `ghPrCmd`, `gitBranchCmds` |
| Propose          | `proposeChange`                                                                                     |
| Flag / capture   | `buildFlagIssue`                                                                                    |

### Catalog

`buildCatalog(ssotDir)` walks the node `.md` files and returns a `Catalog` that is shape-compatible
with ssot-core's `RawCatalog` — feed it straight to `normalize` for a typed `SsotGraph`.
`writeCatalog` emits `_catalog.json` in the original 2-space / trailing-newline format.

### Verify runner

`runVerify(ssotDir, { cadenceDays?, root? })` builds the catalog, normalizes it, hydrates node bodies
(so section-completeness runs), and calls ssot-core `verify` with a filesystem `VerifyAdapter`
(`implementedIn` / mirror-drift IO) and the raw node list (duplicate-id detection). It writes the
`_gaps.md` report (summary table + per-rule sections) and returns `{ findings, summary, reportPath }`.

### Mirror & lifecycle sync

`syncMirrors` regenerates a mirrored node's `<!--SSOT:MIRROR-START/END-->` body from its `source`
file (frontmatter and out-of-marker notes preserved, `lastVerified` bumped); `check: true` reports
drift only. `detectLifecycleTransitions` finds `planned` nodes whose `implementedIn` paths now exist;
`applyLifecycleTransitions` flips them to `active`.

### Governance / propose / flag — the deterministic boundary

`classifyChange` maps a change descriptor to `aligned` / `conflict` / `foundational` / `out-of-scope`
with the same deterministic rules as the original scripts; `routePlan` gives the per-route artifact
spec. **git / gh are never executed** — `proposeChange` (and the `gh*` / `git*` builders) return the
branch / PR / issue commands as text for the consumer to run. `proposeChange({ apply: true })` writes
the planned-node / ADR / impact-report **files** only. `buildFlagIssue` builds the issue title / body
/ labels + `gh` command for an SSOT flag or JIT capture.

## Provenance

Ports the ssot-studio `ssot/scripts/*.mjs` fs layer to a typed library over `@wireweave/ssot-core`.
Changes: graph / parse / verify logic is delegated to ssot-core (the scripts duplicated it); the
`coverage` code-surface TSV comparison and recipes are dropped (scaffold is the surviving entry
point); and git / gh are never executed — commands are returned as text (deterministic boundary).

## Build / test

```bash
pnpm build       # tsup (esm + cjs + dts)
pnpm typecheck
pnpm lint
pnpm test
pnpm knip
pnpm publint
```
