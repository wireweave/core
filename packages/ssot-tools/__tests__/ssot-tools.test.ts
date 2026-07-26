import { afterEach, describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  utimesSync,
  existsSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { normalize } from '@wireweave/ssot-core'
import {
  applyLifecycleTransitions,
  autoTag,
  buildCatalog,
  buildFlagIssue,
  classifyChange,
  detectLifecycleTransitions,
  fillVersion,
  listMirroredNodes,
  proposeChange,
  renderLifecycleReport,
  routePlan,
  runVerify,
  scaffoldNode,
  syncMirrors,
  writeCatalog,
} from '../src/index.js'

// ── temp fixture helpers ─────────────────────────────────────────

const roots: string[] = []
afterEach(() => {
  while (roots.length) {
    const r = roots.pop()
    if (r) rmSync(r, { recursive: true, force: true })
  }
})

/** Create a temp workspace, write `files` (keys relative to root), return { root, ssotDir }. */
function makeWorkspace(files: Record<string, string>): { root: string; ssotDir: string } {
  const root = mkdtempSync(join(tmpdir(), 'ssot-tools-'))
  roots.push(root)
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content)
  }
  return { root, ssotDir: join(root, 'ssot') }
}

const node = (fm: string, body = '## 정의\n내용\n'): string => `---\n${fm}\n---\n\n${body}`

// A small valid SSOT used by several tests.
function baseFiles(): Record<string, string> {
  return {
    'ssot/platform.md': node(
      'id: platform.app\nkind: Platform\ntitle: App\npurpose: 목적\nvalue: 가치\nservesPersona: [persona.user]\nowner: me\nconfidence: high',
    ),
    'ssot/personas/user.md': node(
      'id: persona.user\nkind: Persona\ntitle: User\npurpose: 사용자\ndefinition: 최종 사용자\nowner: me\nconfidence: high',
    ),
    'ssot/domains/auth.md': node(
      'id: domain.auth\nkind: Domain\ntitle: Auth\npurpose: 인증\ndefinition: 인증 도메인\nservesPersona: [persona.user]\nrealizedBy: [concept.session]\nowner: me\nconfidence: high\nrelatesTo:\n  - to: concept.session\n    type: contains',
    ),
    'ssot/concepts/session.md': node(
      'id: concept.session\nkind: Concept\ntitle: Session\ndefinition: 세션\ngovernedBy: [domain.auth]\nowner: me\nconfidence: inferred\nrelatesTo:\n  - to: domain.auth\n    type: belongs-to',
    ),
  }
}

// ── catalog ──────────────────────────────────────────────────────

describe('buildCatalog', () => {
  it('produces a RawCatalog-compatible object that normalizes to a valid SsotGraph', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const catalog = buildCatalog(ssotDir)

    expect(catalog.nodeCount).toBe(4)
    expect(catalog.nodes.map((n) => n.id).sort()).toEqual([
      'concept.session',
      'domain.auth',
      'persona.user',
      'platform.app',
    ])
    // relatesTo edge carries the type suffix; id-list edge carries the field name.
    expect(catalog.edges).toContainEqual({
      from: 'concept.session',
      to: 'domain.auth',
      rel: 'relatesTo:belongs-to',
    })
    expect(catalog.edges).toContainEqual({
      from: 'concept.session',
      to: 'domain.auth',
      rel: 'governedBy',
    })

    const graph = normalize(catalog)
    expect(graph.nodes.size).toBe(4)
    expect(graph.parseErrors.filter((e) => e.kind === 'danglingEdge')).toHaveLength(0)
    expect(graph.nodes.get('concept.session')?.facets.semantics.relatesTo[0]?.to).toBe(
      'domain.auth',
    )
  })

  it('writeCatalog emits _catalog.json with trailing newline and 2-space indent', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const catalog = buildCatalog(ssotDir)
    const out = writeCatalog(ssotDir, catalog)
    const raw = readFileSync(out, 'utf8')
    expect(raw.endsWith('\n')).toBe(true)
    expect(raw).toContain('  "nodeCount": 4')
    expect(JSON.parse(raw).edgeCount).toBe(catalog.edgeCount)
  })

  it('records a parse error for a file with no frontmatter', () => {
    const files = baseFiles()
    files['ssot/concepts/broken.md'] = '# no frontmatter here\njust text'
    const { ssotDir } = makeWorkspace(files)
    const catalog = buildCatalog(ssotDir)
    expect(catalog.parseErrors).toHaveLength(1)
    expect(catalog.parseErrors[0]?.file).toContain('broken.md')
  })
})

// ── scaffold ─────────────────────────────────────────────────────

describe('scaffoldNode', () => {
  it('creates a node file from the skeleton at the kind directory', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const { path, content } = scaffoldNode(ssotDir, {
      kind: 'Concept',
      id: 'concept.new-thing',
      title: 'New Thing',
    })
    expect(path).toBe(join(ssotDir, 'concepts', 'new-thing.md'))
    expect(existsSync(path)).toBe(true)
    expect(content).toContain('id: concept.new-thing')
    expect(content).toContain('kind: Concept')
  })

  it('throws when the node already exists (never clobbers)', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    expect(() =>
      scaffoldNode(ssotDir, { kind: 'Concept', id: 'concept.session', title: 'x' }),
    ).toThrow(/already exists/)
  })
})

// ── verify runner ────────────────────────────────────────────────

describe('runVerify', () => {
  it('writes _gaps.md and reports dangling edge, duplicate id, and missing facet', () => {
    const files = baseFiles()
    // dangling edge: governedBy → non-existent node.
    files['ssot/invariants/rule.md'] = node(
      'id: invariant.rule\nkind: Invariant\ntitle: Rule\ndefinition: 규칙\ngoverns: [concept.session]\nimplementedIn: [src/rule.ts]\ndecidedBy: [decision.ghost]\ngovernedBy: [concept.ghost]\nowner: me\nconfidence: high',
    )
    // duplicate id: second file with an already-used id.
    files['ssot/concepts/dup.md'] = node(
      'id: concept.session\nkind: Concept\ntitle: Dup\ndefinition: 중복\nowner: me\nconfidence: inferred',
    )
    // high-confidence node missing a required facet (Persona missing definition).
    files['ssot/personas/admin.md'] = node(
      'id: persona.admin\nkind: Persona\ntitle: Admin\npurpose: 관리\nowner: me\nconfidence: high',
      '내용\n',
    )
    const { ssotDir, root } = makeWorkspace(files)

    const { findings, reportPath } = runVerify(ssotDir, { root })
    const rules = new Set(findings.map((f) => f.rule))
    expect(rules.has('dangling-edge')).toBe(true)
    expect(rules.has('duplicate-id')).toBe(true)
    expect(rules.has('missing-facet')).toBe(true)
    // implementedIn path missing → drift (adapter injected).
    expect(rules.has('implementedIn-missing')).toBe(true)

    const report = readFileSync(reportPath, 'utf8')
    expect(report).toContain('# SSOT 완전성 검증 리포트 (_gaps.md)')
    expect(report).toContain('## 요약')
    expect(report).toContain('id 중복')
  })

  it('does not report implementedIn-missing when the path exists', () => {
    const files = baseFiles()
    files['ssot/capabilities/login.md'] = node(
      'id: capability.login\nkind: Capability\ntitle: Login\npurpose: 로그인\nservesPersona: [persona.user]\nrealizedBy: [concept.session]\nimplementedIn: [src/login.ts]\nowner: me\nconfidence: high',
    )
    files['src/login.ts'] = 'export const login = 1\n'
    const { ssotDir, root } = makeWorkspace(files)
    const { findings } = runVerify(ssotDir, { root })
    expect(findings.some((f) => f.rule === 'implementedIn-missing')).toBe(false)
  })
})

// ── mirror sync ──────────────────────────────────────────────────

function mirrorFiles(): Record<string, string> {
  const files = baseFiles()
  files['src/widget.ts'] = 'export const widget = "v1"\n'
  files['ssot/components/widget.md'] = node(
    'id: component.widget\nkind: SystemComponent\ntitle: Widget\nauthority: mirrored\nsource: src/widget.ts\ndefinition: 미러\npurpose: 위젯\nrealizedBy: [concept.session]\nimplementedIn: [src/widget.ts]\nowner: me\nlifecycle: active\nconfidence: high\nlastVerified: 2020-01-01',
    '<!--SSOT:MIRROR-START-->\n> old mirror note\nexport const widget = "OLD"\n<!--SSOT:MIRROR-END-->\n',
  )
  return files
}

describe('syncMirrors', () => {
  it('lists mirrored nodes', () => {
    const { ssotDir } = makeWorkspace(mirrorFiles())
    const mirrors = listMirroredNodes(ssotDir)
    expect(mirrors).toHaveLength(1)
    expect(mirrors[0]?.id).toBe('component.widget')
    expect(mirrors[0]?.source).toBe('src/widget.ts')
  })

  it('check mode detects drift; sync regenerates the marker body from source', () => {
    const { ssotDir, root } = makeWorkspace(mirrorFiles())
    const nodePath = join(ssotDir, 'components', 'widget.md')
    const srcPath = join(root, 'src', 'widget.ts')
    // Make the source newer than the node by > 1s.
    const old = new Date(Date.now() - 60_000)
    const now = new Date()
    utimesSync(nodePath, old, old)
    utimesSync(srcPath, now, now)

    const check = syncMirrors(ssotDir, { root, check: true })
    expect(check.needSync.map((n) => n.id)).toEqual(['component.widget'])
    expect(check.synced).toHaveLength(0)

    const applied = syncMirrors(ssotDir, { root })
    expect(applied.synced.map((n) => n.id)).toEqual(['component.widget'])
    const regenerated = readFileSync(nodePath, 'utf8')
    expect(regenerated).toContain('export const widget = "v1"')
    expect(regenerated).not.toContain('export const widget = "OLD"')
    // frontmatter preserved, lastVerified bumped.
    expect(regenerated).toContain('id: component.widget')
    expect(regenerated).not.toContain('lastVerified: 2020-01-01')

    // After sync the node is newer → check reports clean.
    const recheck = syncMirrors(ssotDir, { root, check: true })
    expect(recheck.needSync).toHaveLength(0)
  })
})

// ── lifecycle sync ───────────────────────────────────────────────

describe('lifecycle sync', () => {
  function plannedFiles(): Record<string, string> {
    const files = baseFiles()
    files['src/feature.ts'] = 'export const feature = 1\n'
    files['ssot/capabilities/feature.md'] = node(
      'id: capability.feature\nkind: Capability\ntitle: Feature\npurpose: 기능\nservesPersona: [persona.user]\nrealizedBy: [concept.session]\nimplementedIn: [src/feature.ts]\nlifecycle: planned\nowner: me\nconfidence: inferred',
    )
    return files
  }

  it('detects planned nodes whose implementedIn paths exist', () => {
    const { ssotDir, root } = makeWorkspace(plannedFiles())
    const candidates = detectLifecycleTransitions(ssotDir, { root })
    expect(candidates.map((c) => c.id)).toEqual(['capability.feature'])
    expect(candidates[0]?.paths).toEqual(['src/feature.ts'])
    expect(renderLifecycleReport(candidates)).toContain('capability.feature')
  })

  it('does not detect planned nodes whose implementedIn paths are absent', () => {
    const files = plannedFiles()
    delete files['src/feature.ts']
    const { ssotDir, root } = makeWorkspace(files)
    expect(detectLifecycleTransitions(ssotDir, { root })).toHaveLength(0)
  })

  it('apply flips lifecycle planned → active', () => {
    const { ssotDir, root } = makeWorkspace(plannedFiles())
    const candidates = detectLifecycleTransitions(ssotDir, { root })
    const { applied, failed } = applyLifecycleTransitions(ssotDir, candidates)
    expect(applied).toEqual(['capability.feature'])
    expect(failed).toHaveLength(0)
    const content = readFileSync(join(ssotDir, 'capabilities', 'feature.md'), 'utf8')
    expect(content).toContain('lifecycle: active')
    expect(content).not.toContain('lifecycle: planned')
  })
})

// ── auto-tag ─────────────────────────────────────────────────────

describe('autoTag', () => {
  it('derives type/status/domain tags and is idempotent', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const first = autoTag(ssotDir)
    expect(first.changed).toBeGreaterThan(0)

    const session = readFileSync(join(ssotDir, 'concepts', 'session.md'), 'utf8')
    // concept.session: kind + a domain.auth relatesTo target, but no lifecycle → no status tag.
    expect(session).toContain('type:concept')
    expect(session).toContain('domain:auth')
    expect(session).not.toContain('status:')

    const second = autoTag(ssotDir)
    expect(second.changed).toBe(0)
  })

  it('dry mode computes changes without writing', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const before = readFileSync(join(ssotDir, 'concepts', 'session.md'), 'utf8')
    const report = autoTag(ssotDir, { dry: true })
    expect(report.changed).toBeGreaterThan(0)
    expect(readFileSync(join(ssotDir, 'concepts', 'session.md'), 'utf8')).toBe(before)
  })
})

// ── fill-version ─────────────────────────────────────────────────

describe('fillVersion', () => {
  it('stamps introducedIn + version tag on snapshot members and is idempotent', () => {
    const files = baseFiles()
    files['ssot/capabilities/planned.md'] = node(
      'id: capability.later\nkind: Capability\ntitle: Later\npurpose: 미래\nservesPersona: [persona.user]\nrealizedBy: [concept.session]\nimplementedIn: [src/later.ts]\nlifecycle: planned\nowner: me\nconfidence: inferred',
    )
    const { ssotDir } = makeWorkspace(files)

    const first = fillVersion(ssotDir, { version: 'v1.2.3' })
    expect(first.changed).toBeGreaterThan(0)
    expect(first.skippedPlanned).toBe(1)
    expect(first.plannedIds).toEqual(['capability.later'])

    const platform = readFileSync(join(ssotDir, 'platform.md'), 'utf8')
    expect(platform).toContain('introducedIn: v1.2.3')
    expect(platform).toContain('version:v1-2-3')

    const planned = readFileSync(join(ssotDir, 'capabilities', 'planned.md'), 'utf8')
    expect(planned).not.toContain('introducedIn')

    const second = fillVersion(ssotDir, { version: 'v1.2.3' })
    expect(second.changed).toBe(0)
  })

  it('rejects a version that violates the schema pattern', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    expect(() => fillVersion(ssotDir, { version: '1.2' })).toThrow(/introducedIn pattern/)
  })
})

// ── governance classify matrix ───────────────────────────────────

describe('classifyChange', () => {
  it('routes out-of-scope when not in the four axes', () => {
    expect(classifyChange({ inFourAxes: false }).route).toBe('out-of-scope')
  })
  it('routes foundational for architectural or ≥3 domains', () => {
    expect(classifyChange({ isArchitectural: true }).route).toBe('foundational')
    expect(classifyChange({ affectedDomains: ['a', 'b', 'c'] }).route).toBe('foundational')
  })
  it('routes conflict for invariant/decision collisions', () => {
    expect(classifyChange({ touchesInvariant: true }).route).toBe('conflict')
    expect(classifyChange({ contradictsDecision: true }).route).toBe('conflict')
  })
  it('routes aligned by default', () => {
    expect(classifyChange({ affectedDomains: ['a'] }).route).toBe('aligned')
    expect(classifyChange({}).route).toBe('aligned')
  })
  it('routePlan matches each route', () => {
    expect(routePlan('aligned').pr).toBe('normal')
    expect(routePlan('conflict').pr).toBe('draft')
    expect(routePlan('foundational').adr).toBe(true)
    expect(routePlan('out-of-scope').issue).toBe(true)
  })
})

// ── propose ──────────────────────────────────────────────────────

describe('proposeChange', () => {
  it('returns git/gh command text without executing or writing (no apply)', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const before = readdirSync(join(ssotDir, 'concepts')).sort()
    const result = proposeChange(
      ssotDir,
      {
        title: 'Role Delegation',
        summary: '역할 위임',
        signals: { affectedDomains: ['auth'], inFourAxes: true },
        seedIds: ['domain.auth', 'concept.session'],
        newNodes: [{ id: 'concept.role-delegation', kind: 'Concept', title: 'Role Delegation' }],
      },
      { repo: 'wireweave/x' },
    )
    expect(result.route).toBe('aligned')
    expect(result.commands.some((c) => c.startsWith('git switch -c'))).toBe(true)
    expect(result.commands.some((c) => c.startsWith('gh pr create'))).toBe(true)
    expect(result.plannedNodeFiles).toHaveLength(1)
    expect(result.written).toHaveLength(0)
    // no file written to disk
    expect(readdirSync(join(ssotDir, 'concepts')).sort()).toEqual(before)
  })

  it('apply writes planned node files only (lifecycle: planned)', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const result = proposeChange(
      ssotDir,
      {
        title: 'Role Delegation',
        signals: { affectedDomains: ['auth'], inFourAxes: true },
        seedIds: ['domain.auth'],
        newNodes: [{ id: 'concept.role-delegation', kind: 'Concept', title: 'Role Delegation' }],
      },
      { apply: true },
    )
    expect(result.written).toHaveLength(1)
    const written = readFileSync(join(ssotDir, 'concepts', 'role-delegation.md'), 'utf8')
    expect(written).toContain('lifecycle: planned')
    expect(written).toContain('id: concept.role-delegation')
  })

  it('foundational route produces an ADR + impact report', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const result = proposeChange(ssotDir, {
      title: 'Architecture Shift',
      signals: { isArchitectural: true, inFourAxes: true },
      seedIds: ['domain.auth'],
    })
    expect(result.route).toBe('foundational')
    expect(result.adrFile).not.toBeNull()
    expect(result.adrFile?.content).toContain('kind: Decision')
    expect(result.impactReport).toContain('영향 리포트')
  })

  it('out-of-scope route yields an issue command but no branch', () => {
    const { ssotDir } = makeWorkspace(baseFiles())
    const result = proposeChange(ssotDir, { title: 'Off Topic', signals: { inFourAxes: false } })
    expect(result.route).toBe('out-of-scope')
    expect(result.commands.some((c) => c.startsWith('gh issue create'))).toBe(true)
    expect(result.commands.some((c) => c.startsWith('git switch'))).toBe(false)
    expect(result.plannedNodeFiles).toHaveLength(0)
  })
})

// ── flag ─────────────────────────────────────────────────────────

describe('buildFlagIssue', () => {
  it('builds a flag issue with prefix, labels, and gh command', () => {
    const issue = buildFlagIssue({
      type: 'dangling',
      title: 'Broken edge',
      detail: '세부',
      nodes: ['concept.x'],
      repo: 'wireweave/x',
    })
    expect(issue.family).toBe('flag')
    expect(issue.title).toBe('[ssot:flag] Broken edge')
    expect(issue.labels).toEqual(['ssot-flag', 'ssot-dangling'])
    expect(issue.body).toContain('## SSOT flag: dangling')
    expect(issue.ghCommand.startsWith('gh issue create')).toBe(true)
  })

  it('builds a capture issue for competency-gap with default confidence', () => {
    const issue = buildFlagIssue({ type: 'competency-gap', title: 'Unanswered', question: '왜?' })
    expect(issue.family).toBe('capture')
    expect(issue.title).toBe('[ssot:capture] Unanswered')
    expect(issue.body).toContain('confidence: **unverified**')
  })

  it('throws without a title', () => {
    expect(() => buildFlagIssue({ title: '' })).toThrow(/title required/)
  })
})

// ── negative assertions (scenario A7 boundary) ───────────────────

describe('public API boundary', () => {
  it('exposes no coverage / recipe / TSV surface', async () => {
    const api = (await import('../src/index.js')) as Record<string, unknown>
    for (const key of Object.keys(api)) {
      expect(key.toLowerCase()).not.toContain('coverage')
      expect(key.toLowerCase()).not.toContain('recipe')
      expect(key.toLowerCase()).not.toContain('surface')
      expect(key.toLowerCase()).not.toContain('tsv')
    }
  })

  it('no src module imports node:child_process (git/gh are text, never executed)', () => {
    const srcDir = join(process.cwd(), 'src')
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.ts')) files.push(full)
      }
    }
    walk(srcDir)
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      expect(readFileSync(f, 'utf8')).not.toContain('child_process')
    }
  })
})
