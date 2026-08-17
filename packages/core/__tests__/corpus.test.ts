/**
 * Grammar regression harness over the frozen `.wf` corpus.
 *
 * The corpus in `__tests__/corpus/` is real authored wireframe source written
 * against the grammar as it stands today. This file freezes what the current
 * parser and printer do with it, so that a later grammar extension can be
 * measured against a fixed point instead of against nobody's memory.
 *
 * Two laws:
 *
 * - **L1 (backwards compatibility)** — every corpus file parses to exactly the
 *   AST recorded in `__tests__/corpus-baseline/ast/`, and the set of files that
 *   fail to parse is exactly the one recorded in `parse-failures.snap`. A
 *   grammar change that alters either is a backwards-compatibility break; the
 *   snapshot diff shows precisely what changed.
 * - **L2 (round-trip)** — `parse(print(parse(src)))` is structurally equal to
 *   `parse(src)`. Files that break this today are pinned in
 *   `roundtrip-failures.snap` with a cause classification rather than fixed;
 *   an accurate inventory of existing bugs is the useful artifact here.
 *
 * Snapshot policy: `loc` is stripped and object keys are sorted before
 * serialization (see `helpers/ast.ts`). `loc` is byte-offset data, so keeping
 * it would make a single re-indent of a corpus file diff every node in that
 * file and bury the real grammar signal in noise; it is also derived data the
 * printer never emits, so it cannot encode a behaviour difference that the
 * content does not already show.
 *
 * Run the harness:
 *   pnpm --filter @wireweave/core test corpus
 *
 * Regenerate every baseline after an intentional, reviewed grammar change
 * (never to make a red test go green — read the diff first):
 *   pnpm --filter @wireweave/core test corpus -u
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse, printWireframe } from '../src'
import type { WireframeDocument } from '../src'
import { canonicalJson, firstDifference, stripLoc, walkFiles } from './helpers/ast'

const CORPUS_DIR = path.resolve(import.meta.dirname, 'corpus')
const BASELINE_DIR = path.resolve(import.meta.dirname, 'corpus-baseline')

/** Number of `.wf` files imported by T0-BASELINE — floor guard against silent loss. */
const CORPUS_FLOOR = 70

interface CorpusEntry {
  /** POSIX-style path relative to `__tests__/corpus/`. */
  rel: string
  source: string
  /** Parsed document, or `null` when the current parser rejects the file. */
  ast: WireframeDocument | null
  /** First line of the parse error, or `null` when the file parses. */
  parseError: string | null
}

function collectCorpus(): CorpusEntry[] {
  const files: string[] = []
  walkFiles(CORPUS_DIR, '.wf', files)
  return files
    .map((file) => path.relative(CORPUS_DIR, file).split(path.sep).join('/'))
    .sort()
    .map((rel) => {
      const source = fs.readFileSync(path.join(CORPUS_DIR, rel), 'utf8')
      try {
        return { rel, source, ast: parse(source), parseError: null }
      } catch (error) {
        return { rel, source, ast: null, parseError: String(error).split('\n')[0] ?? 'unknown' }
      }
    })
}

const CORPUS = collectCorpus()

// ---------------------------------------------------------------------------
// L1 — backwards compatibility
// ---------------------------------------------------------------------------

describe('L1 — corpus parses to the frozen AST', () => {
  it('corpus inventory is unchanged', async () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(CORPUS_FLOOR)
    await expect(`${CORPUS.map((entry) => entry.rel).join('\n')}\n`).toMatchFileSnapshot(
      path.join(BASELINE_DIR, 'inventory.snap'),
    )
  })

  it('the set of files the parser rejects is unchanged', async () => {
    const failures: Record<string, string> = {}
    for (const entry of CORPUS) {
      if (entry.parseError !== null) failures[entry.rel] = entry.parseError
    }
    await expect(canonicalJson(failures)).toMatchFileSnapshot(
      path.join(BASELINE_DIR, 'parse-failures.snap'),
    )
  })

  for (const entry of CORPUS) {
    // Files that do not parse are owned by the parse-failure ledger above.
    if (entry.ast === null) continue
    it(`AST is unchanged: ${entry.rel}`, async () => {
      await expect(canonicalJson(stripLoc(entry.ast))).toMatchFileSnapshot(
        path.join(BASELINE_DIR, 'ast', `${entry.rel}.snap`),
      )
    })
  }
})

// ---------------------------------------------------------------------------
// L2 — round-trip through the canonical printer
// ---------------------------------------------------------------------------

type RoundTripFailure =
  /** `printWireframe` refused to serialize the parsed AST. */
  | { kind: 'print-throws'; detail: string }
  /** The printed text is not parseable — the printer emitted invalid `.wf`. */
  | { kind: 'reparse-fails'; detail: string }
  /** The reparsed AST differs from the original — information was lost. */
  | { kind: 'ast-mismatch'; detail: string }

function roundTrip(entry: CorpusEntry): RoundTripFailure | null {
  if (entry.ast === null) return null

  let printed: string
  try {
    printed = printWireframe(entry.ast)
  } catch (error) {
    return { kind: 'print-throws', detail: String(error).split('\n')[0] ?? 'unknown' }
  }

  let reparsed: WireframeDocument
  try {
    reparsed = parse(printed)
  } catch (error) {
    return { kind: 'reparse-fails', detail: String(error).split('\n')[0] ?? 'unknown' }
  }

  const difference = firstDifference(stripLoc(reparsed), stripLoc(entry.ast))
  if (difference !== null) return { kind: 'ast-mismatch', detail: difference }
  return null
}

// Both ledgers are empty today. An empty ledger is only meaningful if the
// comparison behind it can actually fail, so the detector is pinned here —
// otherwise a silently broken `firstDifference` would read as "no bugs".
describe('L2 — difference detector self-check', () => {
  it('reports the path of a changed leaf value', () => {
    const left = parse('page "A" { text "x" }')
    const right = parse('page "A" { text "y" }')
    expect(firstDifference(stripLoc(left), stripLoc(right))).toMatch(/"x" vs "y"/)
  })

  it('reports a differing child count', () => {
    const left = parse('page { text "x" }')
    const right = parse('page { text "x" button "b" }')
    expect(firstDifference(stripLoc(left), stripLoc(right))).toMatch(/array length 1 vs 2/)
  })

  it('reports a differing attribute key set', () => {
    const left = parse('page { text "x" }')
    const right = parse('page { text "x" muted }')
    expect(firstDifference(stripLoc(left), stripLoc(right))).toMatch(/keys \[/)
  })

  it('returns null for structurally equal documents that differ only in `loc`', () => {
    const left = parse('page { text "x" }')
    const right = parse('page {\n  text "x"\n}\n')
    expect(firstDifference(stripLoc(left), stripLoc(right))).toBeNull()
  })
})

describe('L2 — parse(print(parse(src))) equals parse(src)', () => {
  // One ledger, one law: the on-disk snapshot is the frozen expectation, so a
  // newly broken file and a newly fixed file both surface as a ledger diff
  // naming the file and its cause. Per-file assertions would only re-derive
  // this same map and could not fail independently of it.
  it('the set of files that fail round-trip is unchanged', async () => {
    const failures: Record<string, string> = {}
    for (const entry of CORPUS) {
      const failure = roundTrip(entry)
      if (failure !== null) failures[entry.rel] = `${failure.kind}: ${failure.detail}`
    }
    await expect(canonicalJson(failures)).toMatchFileSnapshot(
      path.join(BASELINE_DIR, 'roundtrip-failures.snap'),
    )
  })
})
