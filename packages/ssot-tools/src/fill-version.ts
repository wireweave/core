// Fill-version — the fs port of ssot-studio's fill-version.mjs.
//
// Stamps the current product version onto snapshot-member nodes (everything except `planned`):
//   introducedIn: vX.Y.Z   (preserved if already present — never overwrites an earlier version)
//   tags += version:vX-Y-Z  (kebab form; dotted tags violate the schema tag pattern)
// Idempotent. Frontmatter is edited line-level (see frontmatter-edit.ts), never re-serialized.

import { splitFrontmatter } from '@wireweave/ssot-core'
import { listNodeFiles, readNodeFile, writeNodeFile } from './fs-store.js'
import { applyFrontmatterRewrite } from './frontmatter-edit.js'

const VERSION_FIELD_PATTERN = /^v\d+\.\d+\.\d+$/
const TAG_PATTERN = /^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/

export interface FillVersionOptions {
  /** The snapshot version, e.g. `v2.5.4` (schema `introducedIn` pattern). Required. */
  version: string
  /** Compute changes without writing. */
  dry?: boolean
}

export interface FillVersionReport {
  version: string
  versionTag: string
  nodes: number
  changed: number
  skippedPlanned: number
  skippedNoFrontmatter: number
  introducedFilled: number
  introducedPreserved: number
  versionTagFilled: number
  plannedIds: string[]
}

/** Snapshot member = not `planned`. Absent lifecycle is treated as active (schema default). */
function isSnapshotMember(fm: Record<string, unknown>): boolean {
  const lc = typeof fm.lifecycle === 'string' ? fm.lifecycle.trim() : ''
  return lc !== 'planned'
}

/** Stamp `introducedIn` + a `version:` tag onto snapshot members under `ssotDir`. Idempotent. */
export function fillVersion(ssotDir: string, options: FillVersionOptions): FillVersionReport {
  const { version, dry = false } = options
  if (!VERSION_FIELD_PATTERN.test(version)) {
    throw new Error(`version violates introducedIn pattern (^v\\d+\\.\\d+\\.\\d+$): ${version}`)
  }
  const versionTag = `version:${version.replace(/\./g, '-')}`
  if (!TAG_PATTERN.test(versionTag)) {
    throw new Error(`version tag violates schema tag pattern: ${versionTag}`)
  }

  const report: FillVersionReport = {
    version,
    versionTag,
    nodes: 0,
    changed: 0,
    skippedPlanned: 0,
    skippedNoFrontmatter: 0,
    introducedFilled: 0,
    introducedPreserved: 0,
    versionTagFilled: 0,
    plannedIds: [],
  }

  for (const file of listNodeFiles(ssotDir)) {
    const content = readNodeFile(file)
    const { frontmatter: fm, hasFrontmatter } = splitFrontmatter(content)
    if (!hasFrontmatter) {
      report.skippedNoFrontmatter++
      continue
    }
    report.nodes++

    if (!isSnapshotMember(fm)) {
      report.skippedPlanned++
      if (typeof fm.id === 'string') report.plannedIds.push(fm.id)
      continue
    }

    const existing = Array.isArray(fm.tags) ? fm.tags.map(String) : []
    const merged = [...new Set([...existing, versionTag])]
    const tagsChanged = !(
      merged.length === existing.length && merged.every((t) => existing.includes(t))
    )

    const hasIntroduced = typeof fm.introducedIn === 'string' && fm.introducedIn.trim() !== ''
    const needIntroducedIn = !hasIntroduced
    if (hasIntroduced) report.introducedPreserved++

    if (!tagsChanged && !needIntroducedIn) continue

    if (needIntroducedIn) report.introducedFilled++
    if (tagsChanged) report.versionTagFilled++

    const prepend = needIntroducedIn ? [`introducedIn: ${version}`] : []
    const rewritten = applyFrontmatterRewrite(content, merged, prepend)
    if (rewritten === null) continue
    if (!dry) writeNodeFile(file, rewritten)
    report.changed++
  }

  return report
}
