// Verify runner — the fs port of ssot-studio's verify.mjs.
//
// Pipeline: buildCatalog → normalize → hydrate node bodies (for section checks) → ssot-core
// `verify` with a fs-backed VerifyAdapter and the raw node list → render `_gaps.md`.
// Every deterministic rule lives in ssot-core; this module only supplies IO and the report layout.

import { existsSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  mergeBodyIntoNode,
  normalize,
  parseNodeBody,
  verify,
  type VerifyAdapter,
  type VerifyFinding,
  type VerifySummary,
} from '@wireweave/ssot-core'
import { buildCatalog, type Catalog } from './catalog.js'
import { readNodeFile } from './fs-store.js'

export interface RunVerifyOptions {
  /** lastVerified staleness threshold in days. Default 90. */
  cadenceDays?: number
  /** Base directory for `implementedIn` / mirror `source` paths (multi-repo → workspace root). */
  root?: string
  /** Injected clock (epoch-ms) for deterministic staleness. Default Date.now(). */
  now?: number
}

export interface RunVerifyResult {
  findings: VerifyFinding[]
  summary: VerifySummary
  reportPath: string
}

/**
 * Filesystem adapter for verify's IO-dependent checks.
 * `pathExists` is only ever called with root-relative paths (mirror `source`, `implementedIn`
 * tokens). `mtime` is called with both root-relative source paths and ssotDir-relative `node.file`
 * paths, so it resolves against `root` first and falls back to `ssotDir`.
 */
function makeFsAdapter(ssotDir: string, root: string): VerifyAdapter {
  return {
    pathExists: (p) => existsSync(join(root, p)),
    mtime: (p) => {
      for (const base of [root, ssotDir]) {
        try {
          return statSync(join(base, p)).mtimeMs
        } catch {
          /* try the next base */
        }
      }
      return undefined
    },
  }
}

interface ReportSection {
  rules: string[]
  title: string
  cls: '치명' | '결함' | '정보'
}

// Report categories in the original verify.mjs order. Each maps one or more ssot-core rule ids to a
// summary-table row and a detail section.
const REPORT_SECTIONS: ReportSection[] = [
  {
    rules: ['schema-error', 'invalid-id', 'unknown-kind', 'malformed-frontmatter', 'parse-error'],
    title: '스키마 위반',
    cls: '치명',
  },
  { rules: ['kind-prefix-mismatch'], title: 'id-prefix↔kind 불일치', cls: '치명' },
  { rules: ['duplicate-id'], title: 'id 중복', cls: '치명' },
  { rules: ['dangling-edge'], title: '끊긴 엣지 — 연결 완전성', cls: '치명' },
  { rules: ['invalid-relates-to'], title: 'relatesTo 형식 오류', cls: '치명' },
  {
    rules: ['missing-facet'],
    title: '측면 누락 — high-confidence인데 필수 측면이 빔',
    cls: '결함',
  },
  { rules: ['pending-facet'], title: '측면 미완 — 진행중(low-confidence)', cls: '정보' },
  { rules: ['missing-section'], title: '본문 섹션 누락 — high-confidence', cls: '결함' },
  { rules: ['pending-section'], title: '본문 섹션 미완 — 진행중(low-confidence)', cls: '정보' },
  { rules: ['implementedIn-missing'], title: '코드 drift — implementedIn 경로 부재', cls: '결함' },
  { rules: ['mirror-drift'], title: 'mirror-drift — 미러가 원본과 어긋남/부재', cls: '결함' },
  { rules: ['nonstandard-edge-type'], title: '비표준 엣지 type — 표준 어휘집 밖', cls: '정보' },
  { rules: ['bad-tag'], title: '비통제 tags — 네임스페이스/형식 위반', cls: '정보' },
  { rules: ['active-without-code'], title: 'active인데 코드 provenance 없음', cls: '정보' },
  { rules: ['stale'], title: 'cadence 만료 — 재검증 필요', cls: '정보' },
  { rules: ['orphan-owner'], title: '고아 owner — owner:TBD', cls: '정보' },
]

function findingLine(f: VerifyFinding): string {
  const file = f.details && typeof f.details.file === 'string' ? ` (\`${f.details.file}\`)` : ''
  const id = f.nodeId ? `\`${f.nodeId}\`${file} — ` : ''
  return `- ${id}${f.message}`
}

export interface RenderGapsParams {
  summary: VerifySummary
  catalog: Catalog
  cadenceDays: number
}

/** Render the `_gaps.md` report body from a verify summary + the catalog it ran over. Pure. */
export function renderGapsReport(params: RenderGapsParams): string {
  const { summary, catalog, cadenceDays } = params
  const byRule = new Map<string, VerifyFinding[]>()
  for (const f of summary.findings) {
    const arr = byRule.get(f.rule) ?? []
    arr.push(f)
    byRule.set(f.rule, arr)
  }
  const countFor = (s: ReportSection): number =>
    s.rules.reduce((n, r) => n + (byRule.get(r)?.length ?? 0), 0)

  const L: string[] = []
  L.push('# SSOT 완전성 검증 리포트 (_gaps.md)')
  L.push('')
  L.push(
    '> 이 파일은 검증 러너가 생성한 결정적 검증 결과다. 직접 편집하지 말 것. 빈칸은 에러가 아니라 채워야 할 작업 목록이다.',
  )
  L.push('')
  L.push(
    `- 대상(노드): **${catalog.nodeCount}** · 엣지: **${catalog.edgeCount}** · 코드링크: **${catalog.paths.length}**`,
  )
  L.push(`- cadence 기준: ${cadenceDays}일`)
  L.push('')

  L.push('## 요약')
  L.push('')
  L.push('| 검사 | 분류 | 건수 |')
  L.push('|------|------|------|')
  L.push(`| frontmatter 파싱 오류 | 치명 | ${catalog.parseErrors.length} |`)
  for (const s of REPORT_SECTIONS) L.push(`| ${s.title} | ${s.cls} | ${countFor(s)} |`)
  L.push('')

  const section = (title: string, lines: string[]): void => {
    L.push(`## ${title} (${lines.length})`)
    L.push('')
    if (lines.length === 0) {
      L.push('_없음_')
    } else {
      L.push(...lines)
    }
    L.push('')
  }

  if (catalog.parseErrors.length) {
    section(
      'frontmatter 파싱 오류 (치명)',
      catalog.parseErrors.map((e) => `- \`${e.file}\` — ${e.reason}`),
    )
  }
  for (const s of REPORT_SECTIONS) {
    const lines = s.rules.flatMap((r) => byRule.get(r) ?? []).map(findingLine)
    section(`${s.title} (${s.cls})`, lines)
  }

  if (summary.skipped.length) {
    section(
      '건너뛴 검사 (입력 부재)',
      summary.skipped.map((s) => `- \`${s.rule}\` — ${s.reason}`),
    )
  }

  return L.join('\n')
}

/**
 * Run the full verification over `ssotDir` and write `_gaps.md`. Returns the findings, the raw
 * verify summary, and the report path.
 */
export function runVerify(ssotDir: string, options: RunVerifyOptions = {}): RunVerifyResult {
  const { cadenceDays = 90, root = process.cwd(), now = Date.now() } = options

  const catalog = buildCatalog(ssotDir)
  const graph = normalize(catalog)

  // Hydrate bodies so section-completeness checks run (verify reads node.body.sections).
  for (const node of [...graph.nodes.values()]) {
    const md = readNodeFile(join(ssotDir, node.file))
    const body = parseNodeBody(md)
    const errors = graph.parseErrors
    graph.nodes.set(node.id, mergeBodyIntoNode(node, body, errors))
  }

  const summary = verify(graph, {
    cadenceDays,
    now,
    adapter: makeFsAdapter(ssotDir, root),
    rawNodes: catalog.nodes,
  })

  const report = renderGapsReport({ summary, catalog, cadenceDays })
  const reportPath = join(ssotDir, '_gaps.md')
  writeFileSync(reportPath, report)

  return { findings: summary.findings, summary, reportPath }
}
