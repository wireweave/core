// Governance — the port of ssot-studio's governance.mjs, minus the duplicated graph traversal.
//
// The original re-implemented an adjacency index + impact closure; here impact analysis is
// delegated to ssot-core's `impactClosure` over the normalized `SsotGraph` (single graph home,
// scenario A3). This module keeps only the deterministic change-classification / routing rules and
// the git/gh command-text builders. Commands are returned as text — never executed (scenario A8).

import { impactClosure, type SsotGraph } from '@wireweave/ssot-core'

// ── change classification / routing ──────────────────────────────

export const ROUTES = ['aligned', 'conflict', 'foundational', 'out-of-scope'] as const
export type Route = (typeof ROUTES)[number]

/** LLM-supplied signals (filled from SSOT lookups) that deterministically pick a route. */
export interface ChangeSignals {
  touchesInvariant?: boolean
  contradictsDecision?: boolean
  isArchitectural?: boolean
  affectedDomains?: string[]
  inFourAxes?: boolean
}

export interface Classification {
  route: Route
  reasons: string[]
}

/**
 * Deterministic route selection. Conservative — the heavier route wins on ambiguity
 * (foundational > conflict > aligned). Ported verbatim from governance.mjs.
 */
export function classifyChange(signals: ChangeSignals = {}): Classification {
  const reasons: string[] = []
  if (signals.inFourAxes === false) {
    reasons.push('4축(제품/도메인/시스템/거버넌스) 비대상')
    return { route: 'out-of-scope', reasons }
  }
  const domains = Array.isArray(signals.affectedDomains) ? signals.affectedDomains : []
  if (signals.isArchitectural || domains.length >= 3) {
    reasons.push(
      signals.isArchitectural ? '아키텍처 근간 변경' : `다수 도메인(${domains.length}) 파급`,
    )
    return { route: 'foundational', reasons }
  }
  if (signals.touchesInvariant || signals.contradictsDecision) {
    reasons.push(signals.touchesInvariant ? '불변식(invariant) 저촉' : 'Decision 모순')
    return { route: 'conflict', reasons }
  }
  reasons.push('기존 그래프와 정합(신규/보강)')
  return { route: 'aligned', reasons }
}

export interface RoutePlan {
  branch: boolean
  pr: 'normal' | 'draft' | false
  issue: boolean
  adr: boolean
  impactReport: boolean
  prLabels: string[]
}

/** Deterministic artifact spec per route. */
export function routePlan(route: Route): RoutePlan {
  switch (route) {
    case 'aligned':
      return {
        branch: true,
        pr: 'normal',
        issue: false,
        adr: false,
        impactReport: false,
        prLabels: ['ai-proposed'],
      }
    case 'conflict':
      return {
        branch: true,
        pr: 'draft',
        issue: true,
        adr: false,
        impactReport: true,
        prLabels: ['ai-proposed', 'ssot-conflict'],
      }
    case 'foundational':
      return {
        branch: true,
        pr: 'draft',
        issue: true,
        adr: true,
        impactReport: true,
        prLabels: ['ai-proposed', 'ssot-foundational'],
      }
    case 'out-of-scope':
      return {
        branch: false,
        pr: false,
        issue: true,
        adr: false,
        impactReport: false,
        prLabels: ['ssot-rejected'],
      }
  }
}

// ── git / gh command-text builders (never executed) ──────────────

/** Single-quote escape for shell. */
const sh = (s: string): string => `'${String(s).replace(/'/g, `'\\''`)}'`

export interface GhIssueParams {
  title: string
  body: string
  labels?: string[]
  repo?: string
}

export function ghIssueCmd({ title, body, labels = [], repo }: GhIssueParams): string {
  const parts = ['gh', 'issue', 'create', '--title', sh(title), '--body', sh(body)]
  for (const l of labels) parts.push('--label', sh(l))
  if (repo) parts.push('--repo', sh(repo))
  return parts.join(' ')
}

export interface GhPrParams {
  title: string
  body: string
  base?: string
  head?: string
  labels?: string[]
  draft?: boolean
  repo?: string
}

export function ghPrCmd({
  title,
  body,
  base,
  head,
  labels = [],
  draft = false,
  repo,
}: GhPrParams): string {
  const parts = ['gh', 'pr', 'create', '--title', sh(title), '--body', sh(body)]
  if (base) parts.push('--base', sh(base))
  if (head) parts.push('--head', sh(head))
  if (draft) parts.push('--draft')
  for (const l of labels) parts.push('--label', sh(l))
  if (repo) parts.push('--repo', sh(repo))
  return parts.join(' ')
}

export function gitBranchCmds(branch: string, base?: string): string {
  return base ? `git switch -c ${sh(branch)} ${sh(base)}` : `git switch -c ${sh(branch)}`
}

// ── impact report ────────────────────────────────────────────────

export interface ImpactReportOptions {
  maxDepth?: number
}

/** Human-readable impact report (markdown) from the normalized graph + seed nodes. */
export function impactReportMd(
  graph: SsotGraph,
  seedIds: readonly string[],
  options: ImpactReportOptions = {},
): string {
  const { maxDepth = 5 } = options
  const { impacted } = impactClosure(graph, seedIds, { maxDepth })
  const L: string[] = []
  L.push('## 영향 리포트 (impact)')
  L.push('')
  L.push(`- 시작 노드: ${seedIds.map((s) => `\`${s}\``).join(', ')}`)
  L.push(
    `- 파급 도달 노드: **${impacted.length}** (깊이 ≤ ${maxDepth}, impacts/governs/relatesTo/decidedBy)`,
  )
  L.push('')
  if (impacted.length === 0) {
    L.push('_파급 없음 — 고립 변경_')
    return L.join('\n')
  }

  const byKind = new Map<string, { id: string; title: string; lifecycle: string; conf: string }[]>()
  for (const id of impacted) {
    const n = graph.nodes.get(id)
    const k = n?.kind ?? '(미상)'
    const arr = byKind.get(k) ?? []
    arr.push({
      id,
      title: n?.title ?? '',
      lifecycle: n?.facets.meta.lifecycle ?? '',
      conf: n?.facets.meta.confidence ?? '',
    })
    byKind.set(k, arr)
  }
  for (const [kind, arr] of [...byKind].sort((a, b) => a[0].localeCompare(b[0]))) {
    L.push(`### ${kind} (${arr.length})`)
    for (const x of arr.sort((a, b) => a.id.localeCompare(b.id))) {
      L.push(
        `- \`${x.id}\` — ${x.title}${x.lifecycle ? ` [${x.lifecycle}]` : ''}${x.conf ? ` (${x.conf})` : ''}`,
      )
    }
    L.push('')
  }
  return L.join('\n')
}
