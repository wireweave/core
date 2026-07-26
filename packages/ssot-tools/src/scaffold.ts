// Scaffold a new SSOT node file from the ssot-core skeleton.
//
// Replaces the authored-node branch of ssot-studio's `coverage.mjs --scaffold`. The code-surface
// TSV comparison and the "recipes" surface are intentionally not ported (scenario A7): this is the
// single, focused "create an empty node to fill" entry point.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { renderSkeletonMarkdown, type SsotKind } from '@wireweave/ssot-core'
import { nodeFilePath } from './fs-store.js'

export interface ScaffoldParams {
  kind: SsotKind
  id: string
  title: string
}

export interface ScaffoldResult {
  path: string
  content: string
}

/**
 * Create `<ssotDir>/<kindDir>/<slug>.md` from the kind's skeleton. Throws if the file already
 * exists (never clobbers an authored node). Returns the written path and content.
 */
export function scaffoldNode(ssotDir: string, params: ScaffoldParams): ScaffoldResult {
  const { kind, id, title } = params
  const path = nodeFilePath(ssotDir, kind, id)
  if (existsSync(path)) {
    throw new Error(`node already exists: ${path}`)
  }
  const content = renderSkeletonMarkdown(kind, { id, title })
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  return { path, content }
}
