// Propose — the library port of ssot-studio's propose.mjs.
//
// Classifies a change descriptor, computes the routed artifacts (planned node files, ADR, impact
// report) and the git/gh command text, and — unlike the original — NEVER executes git/gh. With
// `apply: true` it writes the planned-node / ADR / impact-report FILES only; the branch/PR/issue
// commands are always returned as text for the consumer to run (deterministic boundary, scenario A8).

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { normalize, serializeNode, type SsotGraph, type SsotKind } from '@wireweave/ssot-core'
import { buildCatalog } from './catalog.js'
import { nodeFilePath } from './fs-store.js'
import {
  classifyChange,
  ghIssueCmd,
  ghPrCmd,
  gitBranchCmds,
  impactReportMd,
  routePlan,
  type ChangeSignals,
  type Classification,
  type Route,
} from './governance.js'

export interface ProposedNode {
  id: string
  kind: SsotKind
  title: string
  frontmatter?: Record<string, unknown>
  body?: string
}

export interface ChangeDescriptor {
  title?: string
  summary?: string
  signals?: ChangeSignals
  seedIds?: string[]
  newNodes?: ProposedNode[]
  conflictTargets?: string[]
  confidence?: string
}

export interface ProposeOptions {
  repo?: string
  base?: string
  /** Write the planned-node / ADR / impact-report files. git/gh are never executed. */
  apply?: boolean
}

export interface FileArtifact {
  path: string
  content: string
}

export interface ProposeResult {
  classification: Classification
  route: Route
  plannedNodeFiles: FileArtifact[]
  adrFile: FileArtifact | null
  impactReport: string
  commands: string[]
  /** Non-fatal warnings (e.g. seed/conflict ids missing from the graph). */
  warnings: string[]
  /** Files actually written (apply mode); paths skipped because they already existed. */
  written: string[]
  skippedExisting: string[]
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'change'
  )
}

function buildNodeFile(node: ProposedNode, change: ChangeDescriptor): string {
  const fm: Record<string, unknown> = { ...(node.frontmatter ?? {}) }
  fm.id = node.id
  fm.kind = node.kind
  fm.title = node.title
  // Proposal stage has no code yet → planned. Preserve any author-supplied values.
  if (!fm.lifecycle) fm.lifecycle = 'planned'
  if (!fm.confidence) fm.confidence = change.confidence ?? 'unverified'
  if (!fm.owner) fm.owner = 'TBD'
  const body = node.body ?? '## 미확정 (OPEN)\n- [ ] OPEN: 제안 단계 — 내용 보강 필요.\n'
  return serializeNode({ frontmatter: fm, body: `\n${body}\n` })
}

function buildAdrFile(
  adrId: string,
  title: string,
  change: ChangeDescriptor,
  seedIds: string[],
  impactMd: string,
): string {
  const fm: Record<string, unknown> = {
    id: adrId,
    kind: 'Decision',
    title,
    purpose: change.summary ?? '',
    definition: '',
    relatesTo: seedIds.map((to) => ({ to, type: 'relates-to' })),
    supersedes: [],
    owner: 'TBD',
    lifecycle: 'active',
    confidence: change.confidence ?? 'inferred',
    lastVerified: '',
  }
  const body = [
    '> Decision은 append-only다. 바뀌면 새 Decision을 supersedes로 잇는다.',
    '',
    '## 맥락 (Context)',
    change.summary || '- [ ] OPEN: 맥락 서술 필요.',
    '',
    '## 결정 (Decision)',
    '- [ ] OPEN: 결정 내용 작성 필요.',
    '',
    '## 근거와 결과 (Consequences)',
    impactMd || '- [ ] OPEN: 영향/결과 서술 필요.',
    '',
  ].join('\n')
  return serializeNode({ frontmatter: fm, body: `\n${body}\n` })
}

function prBody(
  title: string,
  change: ChangeDescriptor,
  classification: Classification,
  newNodes: ProposedNode[],
  conflictTargets: string[],
  impactMd: string,
): string {
  const L: string[] = []
  L.push(`## 제안: ${title}`, '', change.summary ?? '', '')
  L.push(`- 분류(route): **${classification.route}** — ${classification.reasons.join('; ')}`)
  L.push(`- confidence: ${change.confidence ?? 'unverified'}`)
  if (newNodes.length)
    L.push(`- 신규 planned 노드: ${newNodes.map((n) => `\`${n.id}\``).join(', ')}`)
  if (conflictTargets.length)
    L.push(`- 충돌 대상(검토 필수): ${conflictTargets.map((id) => `\`${id}\``).join(', ')}`)
  L.push('')
  if (impactMd) L.push(impactMd, '')
  L.push('---', '_ai-proposed: 사람이 검토·머지한다. main 직접 push 금지._')
  return L.join('\n')
}

function issueBody(
  title: string,
  change: ChangeDescriptor,
  classification: Classification,
  conflictTargets: string[],
  unknownConflicts: string[],
  impactMd: string,
): string {
  const { route, reasons } = classification
  const heading =
    route === 'out-of-scope' ? '제안 거부' : route === 'conflict' ? 'SSOT 충돌' : '근간 변경 검토'
  const L: string[] = []
  L.push(`## ${heading}: ${title}`, '')
  L.push(change.summary ?? '', '')
  L.push(`- 분류(route): **${route}** — ${reasons.join('; ')}`)
  if (route === 'out-of-scope')
    L.push('- 사유: SSOT 4축(제품/도메인/시스템/거버넌스) 비대상. SSOT 변경으로 받지 않음.')
  if (conflictTargets.length)
    L.push(`- 충돌/관련 대상: ${conflictTargets.map((id) => `\`${id}\``).join(', ')}`)
  if (unknownConflicts.length) L.push(`- ⚠ 그래프에 없는 충돌 대상: ${unknownConflicts.join(', ')}`)
  L.push('')
  if (impactMd) L.push(impactMd)
  return L.join('\n')
}

/** Classify a change and compute its routed artifacts + command text. Writes files only if apply. */
export function proposeChange(
  ssotDir: string,
  change: ChangeDescriptor,
  options: ProposeOptions = {},
): ProposeResult {
  const { repo = '', base = '', apply = false } = options
  const graph: SsotGraph = normalize(buildCatalog(ssotDir))

  const title = change.title || '(제목 없음)'
  const slug = slugify(change.title ?? 'change')
  const seedIds = Array.isArray(change.seedIds) ? change.seedIds : []
  const newNodes = Array.isArray(change.newNodes) ? change.newNodes : []
  const conflictTargets = (
    Array.isArray(change.conflictTargets) ? change.conflictTargets : []
  ).filter(Boolean)

  const classification = classifyChange(change.signals ?? {})
  const { route } = classification
  const plan = routePlan(route)

  const warnings: string[] = []
  const unknownSeeds = seedIds.filter((id) => !graph.nodes.has(id))
  if (unknownSeeds.length) warnings.push(`그래프에 없는 seedId: ${unknownSeeds.join(', ')}`)
  const unknownConflicts = conflictTargets.filter((id) => !graph.nodes.has(id))

  const impactMd =
    plan.impactReport && seedIds.length ? impactReportMd(graph, seedIds, { maxDepth: 5 }) : ''

  // ── artifacts ──
  const branch = `ssot/propose/${slug}`
  const plannedNodeFiles: FileArtifact[] = []
  let adrFile: FileArtifact | null = null

  if (plan.branch) {
    for (const node of newNodes) {
      plannedNodeFiles.push({
        path: nodeFilePath(ssotDir, node.kind, node.id),
        content: buildNodeFile(node, change),
      })
    }
    if (plan.adr) {
      adrFile = {
        path: join(ssotDir, 'decisions', `${slug}.md`),
        content: buildAdrFile(`decision.${slug}`, title, change, seedIds, impactMd),
      }
    }
  }

  // ── command text (never executed) ──
  const commands: string[] = []
  if (plan.branch) commands.push(gitBranchCmds(branch, base))
  if (plan.pr)
    commands.push(
      ghPrCmd({
        title: `[ssot] ${title}`,
        body: prBody(title, change, classification, newNodes, conflictTargets, impactMd),
        base,
        head: branch,
        labels: plan.prLabels,
        draft: plan.pr === 'draft',
        repo,
      }),
    )
  if (plan.issue)
    commands.push(
      ghIssueCmd({
        title: `[ssot:${route}] ${title}`,
        body: issueBody(title, change, classification, conflictTargets, unknownConflicts, impactMd),
        labels: plan.prLabels.filter((l) => l !== 'ai-proposed' || route === 'aligned'),
        repo,
      }),
    )

  // ── apply: write FILES only ──
  const written: string[] = []
  const skippedExisting: string[] = []
  if (apply) {
    const toWrite: FileArtifact[] = [...plannedNodeFiles]
    if (adrFile) toWrite.push(adrFile)
    if (plan.impactReport && impactMd) {
      toWrite.push({
        path: join(ssotDir, `_impact-${slug}.md`),
        content: `# 영향 리포트 — ${title}\n\n${impactMd}\n`,
      })
    }
    for (const w of toWrite) {
      if (existsSync(w.path)) {
        skippedExisting.push(w.path)
        continue
      }
      mkdirSync(dirname(w.path), { recursive: true })
      writeFileSync(w.path, w.content)
      written.push(w.path)
    }
  }

  return {
    classification,
    route,
    plannedNodeFiles,
    adrFile,
    impactReport: impactMd,
    commands,
    warnings,
    written,
    skippedExisting,
  }
}
