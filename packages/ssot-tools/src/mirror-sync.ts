// Mirror sync — the fs port of ssot-studio's sync.mjs.
//
// A mirrored node = [SSOT-owned frontmatter] + [source body cloned between MIRROR markers]. Sync
// regenerates only the marker span from the current `source` file, preserves the frontmatter (incl.
// human-added edges) and any notes outside the markers, bumps `lastVerified`, and lifts the node
// mtime past the source to clear verify's mirror-drift. Source is never touched (source → SSOT only).
//
// Frontmatter is rewritten with a targeted single-scalar replacement rather than ssot-core's
// `serializeNode`: the whole point of a mirror is to preserve the author's frontmatter and any
// out-of-marker notes verbatim, which a full re-serialize (comment loss, reflow) would destroy.

import { existsSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildCatalog } from './catalog.js'

const MARK_START = '<!--SSOT:MIRROR-START-->'
const MARK_END = '<!--SSOT:MIRROR-END-->'

export interface MirroredNode {
  id: string
  file: string
  source: string
}

export interface SyncMirrorsOptions {
  /** Base directory for `source` paths (multi-repo → workspace root). Default cwd. */
  root?: string
  /** Report drift only, write nothing. */
  check?: boolean
  /** Restrict to a single node id. */
  id?: string
}

export interface SyncMirrorsReport {
  /** Total mirrored nodes considered. */
  mirrors: number
  /** Nodes regenerated (write mode). */
  synced: MirroredNode[]
  /** Drifted nodes needing sync (check mode). */
  needSync: MirroredNode[]
  /** Nodes that could not be processed (missing/absent source, stat failure). */
  problems: { id: string; issue: string }[]
}

/** List mirrored nodes (`authority: mirrored`) with their declared source paths. */
export function listMirroredNodes(ssotDir: string): MirroredNode[] {
  const cat = buildCatalog(ssotDir)
  const out: MirroredNode[] = []
  for (const n of cat.nodes) {
    if (n.facets.authority !== 'mirrored') continue
    out.push({
      id: n.id,
      file: n.file,
      source: typeof n.facets.source === 'string' ? n.facets.source : '',
    })
  }
  return out
}

/** Replace/insert one top-level scalar key inside the frontmatter block only. */
function setFrontmatterScalar(content: string, key: string, value: string): string {
  if (!content.startsWith('---')) return content
  const end = content.indexOf('\n---', 3)
  if (end === -1) return content
  const fm = content.slice(0, end)
  const rest = content.slice(end)
  const re = new RegExp(`^(${key}):.*$`, 'm')
  if (re.test(fm)) return fm.replace(re, `$1: ${value}`) + rest
  return fm.replace(/\n*$/, `\n${key}: ${value}`) + rest
}

/** Replace the MIRROR-marker span (or normalize a marker-less legacy mirror) with the source body. */
function replaceMirrorBody(content: string, mirrorBlock: string): string {
  const wrapped = `${MARK_START}\n${mirrorBlock}\n${MARK_END}`
  const s = content.indexOf(MARK_START)
  const e = content.indexOf(MARK_END)
  if (s !== -1 && e !== -1 && e > s) {
    return content.slice(0, s) + wrapped + content.slice(e + MARK_END.length)
  }
  const fmEnd = content.indexOf('\n---', 3)
  const head = fmEnd === -1 ? content : content.slice(0, fmEnd + 4)
  return `${head}\n\n${wrapped}\n`
}

function buildMirrorBlock(source: string, orig: string): string {
  return `> 이 노드는 \`${source}\` 의 **미러**다. SSOT에서 직접 편집 금지 — 원본을 고치고 \`sync\`로 갱신한다.\n\n${orig}`
}

/**
 * Regenerate mirrored node bodies whose source is newer than the node (drift). In `check` mode it
 * reports drift without writing. Returns a structured drift/sync report.
 */
export function syncMirrors(ssotDir: string, options: SyncMirrorsOptions = {}): SyncMirrorsReport {
  const { root = process.cwd(), check = false, id: onlyId } = options
  const today = new Date().toISOString().slice(0, 10)

  const mirrors = listMirroredNodes(ssotDir).filter((n) => !onlyId || n.id === onlyId)
  const synced: MirroredNode[] = []
  const needSync: MirroredNode[] = []
  const problems: { id: string; issue: string }[] = []

  for (const n of mirrors) {
    const nodePath = join(ssotDir, n.file)
    if (!n.source) {
      problems.push({ id: n.id, issue: 'mirrored 인데 source 없음 — 수동 확인 필요' })
      continue
    }
    const srcAbs = join(root, n.source)
    if (!existsSync(srcAbs)) {
      problems.push({ id: n.id, issue: `source 부재: ${n.source}` })
      continue
    }

    let srcM: number
    let nodeM: number
    try {
      srcM = statSync(srcAbs).mtimeMs
      nodeM = statSync(nodePath).mtimeMs
    } catch (err) {
      problems.push({
        id: n.id,
        issue: `stat 실패: ${err instanceof Error ? err.message : String(err)}`,
      })
      continue
    }

    // drift = source is newer than the mirror. 1s slack ignores ties (matches verify).
    if (!(srcM > nodeM + 1000)) continue

    if (check) {
      needSync.push(n)
      continue
    }

    const orig = readFileSync(srcAbs, 'utf8')
    let content = readFileSync(nodePath, 'utf8')
    content = replaceMirrorBody(content, buildMirrorBlock(n.source, orig))
    content = setFrontmatterScalar(content, 'lastVerified', today)
    writeFileSync(nodePath, content)
    const after = new Date(srcM + 2000)
    try {
      utimesSync(nodePath, after, after)
    } catch {
      /* utimes failure is non-fatal */
    }
    synced.push(n)
  }

  return { mirrors: mirrors.length, synced, needSync, problems }
}
