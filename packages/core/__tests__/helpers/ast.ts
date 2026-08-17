/**
 * Shared test helpers for AST comparison and fixture discovery.
 *
 * `stripLoc` defines what "the same AST" means across the whole test suite:
 * source locations are derived data (see `src/printer/index.ts` — `loc` is
 * never printed), so two ASTs are equal when their content is equal. Keeping
 * one definition here means the printer round-trip laws and the corpus
 * regression laws cannot drift apart.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

/** Deep-copy with every `loc` removed (source locations are not content). */
export function stripLoc(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripLoc)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'loc') continue
      out[key] = stripLoc(entry)
    }
    return out
  }
  return value
}

/** Deep-copy with object keys sorted byte-wise at every level. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    const source: Record<string, unknown> = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) {
      out[key] = sortKeys(source[key])
    }
    return out
  }
  return value
}

/**
 * Serialize a value to a byte-stable JSON form: keys sorted, 2-space indent,
 * one trailing newline. Key order carries no meaning in the AST, so sorting
 * keeps committed snapshots free of churn when grammar actions are reordered.
 */
export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`
}

/**
 * First structural difference between two values, as a `$.a.b[0]` path plus a
 * short description — or `null` when they are structurally equal. Used to keep
 * failure ledgers small and diffable instead of dumping whole ASTs.
 */
export function firstDifference(actual: unknown, expected: unknown, at = '$'): string | null {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return `${at}: ${describe(actual)} vs ${describe(expected)}`
    }
    if (actual.length !== expected.length) {
      return `${at}: array length ${actual.length} vs ${expected.length}`
    }
    for (let index = 0; index < actual.length; index += 1) {
      const diff = firstDifference(actual[index], expected[index], `${at}[${index}]`)
      if (diff) return diff
    }
    return null
  }

  const actualIsObject = actual !== null && typeof actual === 'object'
  const expectedIsObject = expected !== null && typeof expected === 'object'
  if (actualIsObject || expectedIsObject) {
    if (!actualIsObject || !expectedIsObject) {
      return `${at}: ${describe(actual)} vs ${describe(expected)}`
    }
    const actualObject: Record<string, unknown> = actual as Record<string, unknown>
    const expectedObject: Record<string, unknown> = expected as Record<string, unknown>
    const actualKeys = Object.keys(actualObject).sort()
    const expectedKeys = Object.keys(expectedObject).sort()
    if (actualKeys.join(',') !== expectedKeys.join(',')) {
      return `${at}: keys [${actualKeys.join(', ')}] vs [${expectedKeys.join(', ')}]`
    }
    for (const key of actualKeys) {
      const diff = firstDifference(actualObject[key], expectedObject[key], `${at}.${key}`)
      if (diff) return diff
    }
    return null
  }

  if (!Object.is(actual, expected)) return `${at}: ${describe(actual)} vs ${describe(expected)}`
  return null
}

function describe(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `array(${value.length})`
  if (typeof value === 'object') return `object{${Object.keys(value).sort().join(',')}}`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return typeof value
}

/** Recursively collect files under `dir` whose name ends with `extension`. */
export function walkFiles(dir: string, extension: string, out: string[]): void {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(full, extension, out)
    else if (entry.name.endsWith(extension)) out.push(full)
  }
}
