// Auto-tag — the fs port of ssot-studio's auto-tag.mjs.
//
// Derives controlled-vocabulary tags from each node's frontmatter with deterministic rules only
// (no inference), union-merges them with existing tags (idempotent), and rewrites the `tags:` block.
// Frontmatter is edited line-level (see frontmatter-edit.ts), never re-serialized, so axis comments
// and author formatting survive.
//
// Derivation:
//   type:{kind-lowercase}        — every node.
//   status:{lifecycle}           — when lifecycle is set.
//   domain:{slug}                — (a) domain nodes → own slug; (b) others → any `domain.*` target
//                                  in an id-reference field or relatesTo[].to.

import { EDGE_RELS, splitFrontmatter } from '@wireweave/ssot-core'
import { listNodeFiles, readNodeFile, relNodePath, writeNodeFile } from './fs-store.js'
import { applyFrontmatterRewrite } from './frontmatter-edit.js'

const ID_LIST_FIELDS = EDGE_RELS.filter((r) => r !== 'relatesTo')
const TAG_PATTERN = /^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/

type Frontmatter = Record<string, unknown>

function slugOf(id: string): string {
  const i = id.indexOf('.')
  return i === -1 ? '' : id.slice(i + 1)
}

/** Collect `domain.*` target slugs (a domain node contributes only its own slug). */
function deriveDomains(fm: Frontmatter): Set<string> {
  const out = new Set<string>()
  if (typeof fm.id === 'string' && fm.id.startsWith('domain.')) {
    out.add(slugOf(fm.id))
    return out
  }
  const consider = (target: unknown): void => {
    if (typeof target === 'string' && target.startsWith('domain.')) out.add(slugOf(target))
  }
  for (const f of ID_LIST_FIELDS) {
    const v = fm[f]
    if (Array.isArray(v)) for (const t of v) consider(t)
  }
  const rel = fm.relatesTo
  if (Array.isArray(rel)) {
    for (const o of rel) {
      if (o && typeof o === 'object' && 'to' in o) consider((o as { to: unknown }).to)
    }
  }
  return out
}

function deriveTags(fm: Frontmatter): string[] {
  const tags: string[] = []
  if (typeof fm.kind === 'string' && fm.kind.trim())
    tags.push(`type:${fm.kind.trim().toLowerCase()}`)
  if (typeof fm.lifecycle === 'string' && fm.lifecycle.trim())
    tags.push(`status:${fm.lifecycle.trim()}`)
  for (const d of deriveDomains(fm)) if (d) tags.push(`domain:${d}`)
  return tags
}

export interface AutoTagOptions {
  /** Compute changes without writing. */
  dry?: boolean
}

export interface AutoTagReport {
  nodes: number
  changed: number
  skippedNoFrontmatter: number
  /** Node counts per derived namespace. */
  namespaceCounts: { type: number; status: number; domain: number }
  /** Derived tags that violate the controlled `namespace:value` format (should never happen). */
  badProduced: { file: string; tag: string }[]
}

/** Stamp derived tags onto every node under `ssotDir`. Idempotent. */
export function autoTag(ssotDir: string, options: AutoTagOptions = {}): AutoTagReport {
  const { dry = false } = options
  const namespaceCounts = { type: 0, status: 0, domain: 0 }
  const badProduced: { file: string; tag: string }[] = []
  let nodes = 0
  let changed = 0
  let skippedNoFrontmatter = 0

  for (const file of listNodeFiles(ssotDir)) {
    const content = readNodeFile(file)
    const { frontmatter: fm, hasFrontmatter } = splitFrontmatter(content)
    if (!hasFrontmatter) {
      skippedNoFrontmatter++
      continue
    }
    nodes++

    const derived = deriveTags(fm)
    const existing = Array.isArray(fm.tags) ? fm.tags.map(String) : []
    const merged = [...new Set([...existing, ...derived])]

    for (const t of derived)
      if (!TAG_PATTERN.test(t)) badProduced.push({ file: relNodePath(ssotDir, file), tag: t })

    if (merged.some((t) => t.startsWith('type:'))) namespaceCounts.type++
    if (merged.some((t) => t.startsWith('status:'))) namespaceCounts.status++
    if (merged.some((t) => t.startsWith('domain:'))) namespaceCounts.domain++

    const sameAsExisting =
      merged.length === existing.length && merged.every((t) => existing.includes(t))
    if (sameAsExisting) continue

    const rewritten = applyFrontmatterRewrite(content, merged)
    if (rewritten === null) continue
    if (!dry) writeNodeFile(file, rewritten)
    changed++
  }

  return { nodes, changed, skippedNoFrontmatter, namespaceCounts, badProduced }
}
