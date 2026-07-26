// Lifecycle sync — the fs port of ssot-studio's sync-lifecycle.mjs.
//
// Detects `lifecycle: planned` nodes whose `implementedIn` code paths now exist (code has landed) →
// `active` transition candidates. Transition is never automatic; `applyLifecycleTransitions` flips
// the frontmatter with a single-line replacement (preserving everything else), and the render helper
// produces the `_lifecycle.md` report. Any branch/PR is the consumer's call (deterministic boundary).

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildCatalog } from './catalog.js'

const PATH_TAIL = /[)\].,]+$/

/** First whitespace-delimited token of an implementedIn entry, comment tail stripped. */
function pathToken(raw: string): string {
  return (raw.split(/\s+/)[0] ?? '').replace(PATH_TAIL, '')
}

export interface LifecycleCandidate {
  id: string
  file: string
  title: string
  /** The existing code paths that qualify the node for `active`. */
  paths: string[]
}

export interface DetectLifecycleOptions {
  /** Base directory for `implementedIn` paths (multi-repo → workspace root). Default cwd. */
  root?: string
}

/** Find `planned` nodes whose `implementedIn` paths exist on disk → active-transition candidates. */
export function detectLifecycleTransitions(
  ssotDir: string,
  options: DetectLifecycleOptions = {},
): LifecycleCandidate[] {
  const { root = process.cwd() } = options
  const cat = buildCatalog(ssotDir)
  const candidates: LifecycleCandidate[] = []
  for (const n of cat.nodes) {
    if (n.lifecycle !== 'planned') continue
    const impl = Array.isArray(n.facets.implementedIn) ? n.facets.implementedIn : []
    const existing = impl
      .map((p) => (p ? pathToken(String(p)) : ''))
      .filter((token) => token && existsSync(join(root, token)))
    if (existing.length)
      candidates.push({ id: n.id, file: n.file, title: n.title, paths: existing })
  }
  return candidates
}

export interface ApplyLifecycleReport {
  applied: string[]
  failed: { id: string; reason: string }[]
}

/** Flip `lifecycle: planned → active` in each candidate's frontmatter (single-line replacement). */
export function applyLifecycleTransitions(
  ssotDir: string,
  candidates: readonly LifecycleCandidate[],
): ApplyLifecycleReport {
  const applied: string[] = []
  const failed: { id: string; reason: string }[] = []
  for (const c of candidates) {
    const p = join(ssotDir, c.file)
    const content = readFileSync(p, 'utf8')
    if (/^lifecycle:\s*planned\s*$/m.test(content)) {
      writeFileSync(p, content.replace(/^lifecycle:\s*planned\s*$/m, 'lifecycle: active'))
      applied.push(c.id)
    } else {
      failed.push({ id: c.id, reason: "'lifecycle: planned' 라인을 찾지 못함 (수동 확인)" })
    }
  }
  return { applied, failed }
}

/** Render the `_lifecycle.md` report body. Pure. */
export function renderLifecycleReport(candidates: readonly LifecycleCandidate[]): string {
  const L: string[] = []
  L.push('# SSOT lifecycle 전환 후보 (_lifecycle.md)')
  L.push('')
  L.push(
    '> `planned` 인데 코드 provenance(implementedIn)가 실존 → `active` 전환 후보. 자동 전환 금지 — 제안만.',
  )
  L.push('')
  L.push(`- 전환 후보(planned→active): **${candidates.length}**`)
  L.push('')
  if (candidates.length === 0) {
    L.push('_없음 — planned 노드 중 코드가 생긴 것 없음_')
  } else {
    for (const c of candidates) {
      L.push(
        `- \`${c.id}\` (\`${c.file}\`) — 코드 실존: ${c.paths.map((p) => `\`${p}\``).join(', ')}`,
      )
    }
  }
  L.push('')
  return L.join('\n')
}
