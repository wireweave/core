// Single source of truth for "which workspace packages reach npm".
//
// Three consumers need this set and must never disagree: the changeset guard
// (which source changes require a version bump), the packaging-gate coverage
// check, and CI's pack smoke. Hand-copying the list into each — the state this
// repo was in, where ci.yml's pack step listed five of ten packages under a
// comment claiming lockstep with a publish.yml list that does not exist — makes
// divergence the default outcome rather than an accident.
//
// The set is derived from what changesets actually publishes: a directory under
// packages/ whose manifest is not `private: true` and whose name is not in
// .changeset/config.json `ignore`. Both filters matter. `private` alone would
// keep publishing a package that was withdrawn from the release train via
// `ignore`; `ignore` alone would pick up a private package that was never a
// changesets target to begin with. docs/ is a workspace project but sits
// outside packages/, so it is out of scope here by construction.
//
// Paths are relative to the repository root; callers run from there (both CI
// steps and `node scripts/…` invocations do).

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGES_DIR = 'packages'
const CHANGESET_CONFIG = '.changeset/config.json'

function ignoredPackageNames() {
  if (!existsSync(CHANGESET_CONFIG)) return new Set()
  const config = JSON.parse(readFileSync(CHANGESET_CONFIG, 'utf8'))
  return new Set(config.ignore ?? [])
}

/**
 * Every package under packages/ that changesets publishes to npm.
 *
 * @returns {Array<{ name: string, dir: string, path: string, manifest: object }>}
 *   sorted by directory name so callers get a stable, diff-friendly order.
 */
export function publishedPackages() {
  const ignored = ignoredPackageNames()
  const packages = []

  for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const manifestPath = join(PACKAGES_DIR, entry.name, 'package.json')
    if (!existsSync(manifestPath)) continue

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (manifest.private === true) continue
    if (ignored.has(manifest.name)) continue

    packages.push({
      name: manifest.name,
      dir: entry.name,
      path: join(PACKAGES_DIR, entry.name),
      manifest,
    })
  }

  return packages.sort((a, b) => a.dir.localeCompare(b.dir))
}
