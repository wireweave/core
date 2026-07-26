// Filesystem node store — the KIND→directory layout and node-file IO for an SSOT directory.
//
// This is the Node-only edge of ssot-tools: everything graph/parse-shaped is delegated to
// @wireweave/ssot-core; here we only walk directories and read/write `.md` node files.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { SsotKind } from '@wireweave/ssot-core'

/**
 * Kind → directory under the SSOT root. `Platform` lives at the root (`.`).
 * Ported from the ssot-studio scripts' KIND_DIR, minus the dropped `EngineeringRule`/`rules`
 * (12 kinds per the wireweave schema).
 */
export const KIND_DIR: Record<SsotKind, string> = {
  Platform: '.',
  Persona: 'personas',
  Domain: 'domains',
  Concept: 'concepts',
  Capability: 'capabilities',
  SystemComponent: 'components',
  Integration: 'integrations',
  Invariant: 'invariants',
  Decision: 'decisions',
  Screen: 'screens',
  Endpoint: 'endpoints',
  Flow: 'flows',
}

/** Absolute directory for a kind's nodes within `ssotDir`. */
export function kindDir(ssotDir: string, kind: SsotKind): string {
  const dir = KIND_DIR[kind]
  return dir === '.' ? ssotDir : join(ssotDir, dir)
}

/** Absolute path for a node id's `.md` file (slug = id after the kind prefix). */
export function nodeFilePath(ssotDir: string, kind: SsotKind, id: string): string {
  const slug = id.split('.')[1] ?? id
  return join(kindDir(ssotDir, kind), `${slug}.md`)
}

function isNodeFileName(name: string): boolean {
  return name.endsWith('.md') && name.toLowerCase() !== 'readme.md'
}

/**
 * All node `.md` files under `ssotDir`, absolute paths.
 * Recurses into subdirectories, skipping `_*` / `.*` names (generated reports, hidden dirs) and
 * `readme.md`. The root-level `platform.md` is included. Faithful to the scripts' `collect()`.
 */
export function listNodeFiles(ssotDir: string): string[] {
  const acc: string[] = []
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('_') || name.startsWith('.')) continue
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (isNodeFileName(name)) acc.push(full)
    }
  }
  walk(ssotDir)
  return acc
}

/** Read a node file's raw markdown. */
export function readNodeFile(absPath: string): string {
  return readFileSync(absPath, 'utf8')
}

/** Write a node file's raw markdown. */
export function writeNodeFile(absPath: string, content: string): void {
  writeFileSync(absPath, content)
}

/** `ssotDir`-relative POSIX-ish path for a node file (matches the `_catalog.json` `file` field). */
export function relNodePath(ssotDir: string, absPath: string): string {
  return relative(ssotDir, absPath)
}
