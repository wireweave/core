/**
 * The corpus validation count may only go down.
 *
 * `validate()` derives its answers from the attribute and component registries
 * this package projects into the editors, so a registry change moves this number
 * — which is why the gate lives here rather than beside the corpus.
 *
 * The corpus itself is core's test fixture; this reads it without owning it. If
 * the fixtures move, `files` drops to zero and the guard below fails loudly
 * rather than reporting a spurious improvement.
 *
 * Severity for the remaining errors is deliberately not decided here. Most of
 * them are core defects, so failing the build on them would blame authors for
 * something they did not write, and downgrading them to warnings would make that
 * misattribution permanent. Holding the number monotonic keeps the state honest
 * while the classes are fixed one at a time.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'
import { parse, validate } from '@wireweave/core'

import { CORPUS_VALIDATE_BASELINE as BASELINE } from './corpus-validate-baseline.js'

const CORPUS_DIR = fileURLToPath(new URL('../../core/__tests__/corpus', import.meta.url))

interface Measurement {
  files: number
  failingFiles: number
  errors: number
}

function measureCorpus(dir: string): Measurement {
  let names: string[]
  try {
    names = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((name) =>
      name.endsWith('.wf'),
    )
  } catch {
    return { files: 0, failingFiles: 0, errors: 0 }
  }

  let failingFiles = 0
  let errors = 0
  for (const name of names) {
    const source = readFileSync(join(dir, name), 'utf8')
    try {
      const result = validate(parse(source))
      if (!result.valid) {
        failingFiles += 1
        errors += result.errors.length
      }
    } catch {
      // A file that no longer parses is a failure too, with no error list to add.
      failingFiles += 1
    }
  }
  return { files: names.length, failingFiles, errors }
}

/**
 * A count that may only fall. Both directions fail, with different instructions:
 * a rise is a regression to fix, a fall is an improvement to lock in.
 */
function expectRatchet(metric: string, measured: number, baseline: number): void {
  if (measured > baseline) {
    expect.fail(
      `${metric} rose to ${measured}, above the recorded ${baseline}. ` +
        `Something added ${measured - baseline}. Fix the cause — do not raise the baseline.`,
    )
  }
  if (measured < baseline) {
    expect.fail(
      `${metric} fell to ${measured}, below the recorded ${baseline}. ` +
        `Set ${metric} to ${measured} in __tests__/corpus-validate-baseline.ts to lock the improvement in.`,
    )
  }
}

describe('corpus validation ratchet', () => {
  const measured = measureCorpus(CORPUS_DIR)

  it('finds the corpus', () => {
    // Without this, a moved or renamed fixture directory measures zero errors
    // and every assertion below reads as a clean sweep.
    expect(measured.files, `no .wf files found under ${CORPUS_DIR}`).toBeGreaterThan(0)
    expect(
      measured.files,
      'the corpus shrank — a smaller corpus lowers the counts below without anything being fixed',
    ).toBeGreaterThanOrEqual(BASELINE.files)
  })

  it('holds the number of failing files at its recorded baseline', () => {
    expectRatchet('failingFiles', measured.failingFiles, BASELINE.failingFiles)
  })

  it('holds the number of validation errors at its recorded baseline', () => {
    expectRatchet('errors', measured.errors, BASELINE.errors)
  })
})
