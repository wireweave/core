// Generated-parser staleness gate.
//
// src/grammar/wireframe.peggy is the single source of truth for the DSL, but
// what actually runs is the committed Peggy output at
// src/parser/generated-parser.js. Nothing structurally ties the two together:
// TypeScript cannot see through the `// @ts-expect-error` import in
// src/parser/index.ts, and three test files (__tests__/grammar.test.ts,
// __tests__/components.test.ts, __tests__/layout.test.ts) import the generated
// artifact *directly*. So editing the grammar without regenerating leaves the
// entire suite passing against the previous parser — a silent false green that
// gets worse the moment the grammar starts growing.
//
// This gate re-runs the generator and compares bytes. It is a pure check: it
// writes nothing, anywhere. Auto-regenerating on mismatch would defeat the
// point, which is to make a divergence visible to a human before it is trusted.
//
// Byte comparison is viable because Peggy's output was measured to be
// deterministic for this grammar — identical across repeated runs, across the
// invoking cwd, across relative vs absolute grammar paths, and between
// `-o <file>` and `-o -`. It is also strictly stronger than hashing the grammar
// into the artifact: bytes additionally catch a hand-edited artifact and a
// toolchain bump (the Peggy version is stamped into the output header), both of
// which a grammar-only hash would wave through. The converse also holds and is
// intentional — a grammar edit that compiles to identical output (a comment
// outside any action block, say) is correctly reported as in sync, because the
// committed artifact really is what the grammar produces.
//
// The peggy invocation is derived from the package's own `build:grammar`
// script rather than duplicated here, so the gate cannot itself drift out of
// sync with the build it is guarding. If that script ever takes a shape this
// parser does not understand, the gate fails loudly instead of quietly
// verifying the wrong thing.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST_PATH = join(PACKAGE_ROOT, 'package.json')
const BUILD_SCRIPT = 'build:grammar'

/** Shell syntax that would make naive token splitting a lie. */
const SHELL_METACHARACTER = /[&|;<>$`(){}\n]/

/**
 * @typedef {object} Manifest
 * @property {string} name
 * @property {Record<string, string>} [scripts]
 */

/**
 * @typedef {object} PeggyManifest
 * @property {string | Record<string, string>} bin
 */

/**
 * @typedef {object} BuildContract
 * @property {string} command Verbatim `build:grammar` command line, for diagnostics.
 * @property {string[]} generatorArgs Peggy arguments with the `-o <file>` target stripped out.
 * @property {string} artifact Package-relative path of the committed parser.
 * @property {string} packageName Package name, used to spell out the fix command.
 */

/**
 * Report why the gate cannot make a judgement, and stop. Never returns — an
 * inconclusive gate must not degrade into a passing one.
 *
 * @param {string} reason
 * @param {string} [detail]
 * @returns {never}
 */
function abort(reason, detail) {
  console.error(`\n✖ generated-parser gate could not run: ${reason}\n`)
  if (detail) console.error(`${detail}\n`)
  process.exit(1)
}

/**
 * @param {string} path
 * @returns {unknown}
 */
function readJson(path) {
  return /** @type {unknown} */ (JSON.parse(readFileSync(path, 'utf8')))
}

/**
 * Split a simple command line into argv, honouring single and double quotes.
 * Rejects anything with shell control syntax — this gate only understands a
 * single plain command invocation.
 *
 * @param {string} command
 * @returns {string[]}
 */
function tokenize(command) {
  /** @type {string[]} */
  const tokens = []
  let current = ''
  let started = false
  /** @type {string | null} */
  let quote = null

  for (const char of command) {
    if (quote) {
      if (char === quote) quote = null
      else current += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      started = true
      continue
    }
    if (/\s/.test(char)) {
      if (started) tokens.push(current)
      current = ''
      started = false
      continue
    }
    if (SHELL_METACHARACTER.test(char)) {
      abort(
        `\`${BUILD_SCRIPT}\` uses shell syntax this gate cannot interpret (found \`${char}\`)`,
        `  ${BUILD_SCRIPT}: ${command}\n\n` +
          '  Reduce it to a single plain `peggy ...` invocation, or teach\n' +
          '  scripts/check-generated-parser.mjs the new shape. Passing a check\n' +
          '  it does not actually understand is the failure mode this gate exists\n' +
          '  to prevent, so it refuses to guess.',
      )
    }
    current += char
    started = true
  }

  if (quote) abort(`\`${BUILD_SCRIPT}\` has an unterminated ${quote} quote`, `  ${command}`)
  if (started) tokens.push(current)
  return tokens
}

/**
 * Read `build:grammar` and split it into generator args plus the artifact it writes.
 *
 * @returns {BuildContract}
 */
function readBuildContract() {
  const manifest = /** @type {Manifest} */ (readJson(MANIFEST_PATH))
  const command = manifest.scripts?.[BUILD_SCRIPT]
  if (!command) {
    abort(
      `package.json has no \`${BUILD_SCRIPT}\` script`,
      '  The gate derives its peggy invocation from that script so the two cannot drift apart.',
    )
  }

  const tokens = tokenize(command)
  if (tokens[0] !== 'peggy') {
    abort(`\`${BUILD_SCRIPT}\` does not start with \`peggy\``, `  ${BUILD_SCRIPT}: ${command}`)
  }

  /** @type {string[]} */
  const generatorArgs = []
  /** @type {string | undefined} */
  let artifact
  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token === '-o' || token === '--output') {
      artifact = tokens[i + 1]
      i += 1
      continue
    }
    if (token.startsWith('--output=')) {
      artifact = token.slice('--output='.length)
      continue
    }
    generatorArgs.push(token)
  }

  if (!artifact) {
    abort(
      `\`${BUILD_SCRIPT}\` has no \`-o <file>\` output target`,
      `  ${BUILD_SCRIPT}: ${command}\n` +
        '  Without it the gate cannot tell which committed file to compare against.',
    )
  }

  return { command, generatorArgs, artifact, packageName: manifest.name }
}

/**
 * Absolute path to peggy's CLI entry, resolved through this package's dependency tree.
 *
 * @returns {string}
 */
function resolvePeggyBin() {
  try {
    const pkgPath = createRequire(MANIFEST_PATH).resolve('peggy/package.json')
    const pkg = /** @type {PeggyManifest} */ (readJson(pkgPath))
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.peggy
    return resolve(dirname(pkgPath), bin)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    abort('peggy is not installed', `  ${message}\n\n  Run \`pnpm install\` first.`)
  }
}

/**
 * Generate the parser to stdout and return its exact bytes. Touches no files.
 *
 * @param {string} peggyBin
 * @param {string[]} generatorArgs
 * @returns {Buffer}
 */
function generate(peggyBin, generatorArgs) {
  try {
    return execFileSync(process.execPath, [peggyBin, ...generatorArgs, '-o', '-'], {
      cwd: PACKAGE_ROOT,
      encoding: 'buffer',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'inherit'],
    })
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error ? String(error.status) : 'unknown'
    abort('peggy failed on the current grammar (see its output above)', `  exit code: ${status}`)
  }
}

/**
 * Human-readable summary of where committed and freshly generated output part ways.
 *
 * @param {Buffer} committed
 * @param {Buffer} fresh
 * @returns {string}
 */
function describeDivergence(committed, fresh) {
  const committedLines = committed.toString('utf8').split('\n')
  const freshLines = fresh.toString('utf8').split('\n')
  const limit = Math.max(committedLines.length, freshLines.length)

  const lines = [
    `  size:  committed ${committed.length} B (${committedLines.length} lines)`,
    `         expected  ${fresh.length} B (${freshLines.length} lines)`,
  ]

  /**
   * @param {string | undefined} value
   * @returns {string}
   */
  const clip = (value) => {
    if (value === undefined) return '<end of file>'
    const trimmed = value.trim()
    if (trimmed.length > 100) return `${trimmed.slice(0, 100)}…`
    return trimmed || '<blank line>'
  }

  for (let i = 0; i < limit; i += 1) {
    if (committedLines[i] === freshLines[i]) continue
    lines.push(
      '',
      `  first difference at line ${i + 1}:`,
      `    committed: ${clip(committedLines[i])}`,
      `    expected:  ${clip(freshLines[i])}`,
    )
    break
  }

  return lines.join('\n')
}

function main() {
  const { command, generatorArgs, artifact, packageName } = readBuildContract()
  const artifactPath = join(PACKAGE_ROOT, artifact)
  const fixCommand = `pnpm --filter ${packageName} ${BUILD_SCRIPT}`

  const fresh = generate(resolvePeggyBin(), generatorArgs)

  if (!existsSync(artifactPath)) {
    console.error(
      `\n✖ generated parser is missing: ${artifact}\n\n` +
        `  The parser is a committed build artifact, not a gitignored one.\n\n` +
        `  Fix:\n\n    ${fixCommand}\n`,
    )
    process.exit(1)
  }

  const committed = readFileSync(artifactPath)
  if (committed.equals(fresh)) {
    console.log(`✓ ${artifact} is in sync with the grammar`)
    return
  }

  console.error(
    `\n✖ generated parser is stale: ${artifact}\n\n` +
      `  It does not match what \`${command}\` produces from the current grammar.\n\n` +
      `${describeDivergence(committed, fresh)}\n\n` +
      `  This matters more than a normal build-artifact drift: the test suite\n` +
      `  imports ${artifact} directly, so a stale artifact means the\n` +
      `  tests pass against the OLD parser and report green for grammar changes\n` +
      `  that were never actually compiled in.\n\n` +
      `  Fix — regenerate, then review the resulting diff:\n\n` +
      `    ${fixCommand}\n\n` +
      `  (This gate only checks. It will not regenerate for you: a divergence\n` +
      `  has to reach a human, not be papered over on the way to green.)\n`,
  )
  process.exit(1)
}

main()
