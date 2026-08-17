// Fails when a package's build output no longer corresponds to its sources.
//
// The hazard this closes is narrow and was observed, not imagined. Inside the
// workspace @wireweave/core now resolves to source, so TypeScript, ESLint and
// Vitest never read dist. Plain Node does: it has no `development` condition,
// so `import '@wireweave/core/spec'` from a .mjs script falls through to
// dist/spec.js. The two TextMate generators are exactly that shape, and so is
// any `node -e "require('./dist/index.cjs')"` a person types while debugging.
//
// When dist is stale those readers get a coherent, confident, wrong answer.
// One measurement of the same corpus returned 70 files / 23 failing / 138
// errors through dist and 70 files / 18 failing / 74 errors through source,
// eighteen minutes apart, because dist predated the source. Neither number
// announced itself as stale. That is the defect: not a crash, a quiet
// disagreement between two readers of the same repository.
//
// ORACLE. mtime is the obvious comparison and it is the wrong one. `git
// checkout`, `git stash`, rsync and container copies all rewrite mtimes
// wholesale, so a tree can be freshly checked out with dist newer than every
// source and still be stale; the reverse is just as easy to produce. Content
// is compared instead: each build records a hash of the inputs it was built
// from, and this gate rehashes them. A hash cannot be reordered by a file
// copy, so the answer survives the operations that break mtime.
//
// SCOPE is derived twice over, because a hand-written list is the thing that
// rots. Which projects are in scope comes from the resolution fields of each
// manifest — anything main/module/types/exports/publishConfig point at that
// is not source. A package that starts shipping a `./spec` subpath, or a new
// package entirely, enters scope by existing, exactly as the generated-artifact
// gate picks up a new *.generated.* file without being told.
//
// INPUTS are deliberately over-approximated: everything under src/ except
// files the repository's own conventions mark as non-shipping (*.test.*,
// *.spec.*, *.stories.*), plus the build config, plus the build-relevant
// projection of the manifest. The asymmetry is the point. Over-approximating
// costs a rebuild that was not strictly required; under-approximating declares
// a stale dist fresh, which is the failure this gate exists to prevent. Tests
// and stories are excluded because 21 test files and 13 stories live under
// src/ in this repository and are edited constantly while never reaching a
// bundle — including them would fire the gate on work that cannot invalidate
// dist, and a gate that cries wolf is one people learn to skip.
//
// The manifest contributes a projection rather than its bytes so that
// `changeset version` does not invalidate every fingerprint in the repository
// at release time. `exports` changing genuinely changes what is built; the
// version field does not.
//
// WHERE THIS BITES. Every dist/ in this repository is gitignored and no dist
// file is tracked, so a CI checkout has no build output until the Build step
// creates it. CI therefore cannot have a stale dist, and this gate is honest
// about that rather than pretending: --check reports how many projects it
// verified and how many it skipped, so a CI log that reads "verified 0,
// skipped 11" says plainly that it observed nothing there. Its teeth are
// local, where dist survives across sessions and across agents working in the
// same tree. It is wired into CI ahead of Build anyway, so that the day build
// output is cached between runs the gate is already in the only position that
// could catch it — after Build it would be green by construction, which is the
// vacuous shape this repository has been removing all round.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { workspaceProjects } from './workspace-projects.mjs'

const FINGERPRINT_FILENAME = '.build-fingerprint.json'
const FINGERPRINT_VERSION = 1

// Build configuration that changes what a bundle contains.
const BUILD_CONFIG_FILENAMES = [
  'tsup.config.ts',
  'tsup.config.mjs',
  'tsup.config.js',
  'tsconfig.json',
]

// Repository conventions for source files that never reach a bundle.
const NON_SHIPPING_PATTERNS = [/\.test\./, /\.spec\./, /\.stories\./]

// Manifest fields that decide what gets built, projected so unrelated edits
// (version bumps above all) do not invalidate an otherwise-current build.
const MANIFEST_BUILD_FIELDS = [
  'main',
  'module',
  'types',
  'exports',
  'files',
  'dependencies',
  'peerDependencies',
]

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

/**
 * Directories a manifest's resolution fields point into — the build output.
 *
 * Derived rather than assumed to be `dist`: a package that emits to `lib/` or
 * adds a second output directory is covered without editing this file.
 */
export function buildOutputDirs(manifest) {
  const fields = JSON.stringify([
    manifest.main,
    manifest.module,
    manifest.types,
    manifest.exports,
    manifest.publishConfig,
  ])

  const dirs = new Set()
  for (const [, dir] of fields.matchAll(/"\.\/([^"/]+)\//g)) {
    if (dir !== 'src') dirs.add(dir)
  }
  return [...dirs].sort()
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path, out)
    else if (entry.isFile()) out.push(path)
  }
  return out
}

/**
 * Every file whose content can change what a build emits, hashed.
 *
 * @returns {Record<string, string>} repo-relative path -> content hash,
 *   with the manifest projection under a synthetic key so it cannot collide
 *   with a real file.
 */
export function hashInputs(projectPath) {
  const inputs = {}

  const srcDir = join(projectPath, 'src')
  if (existsSync(srcDir)) {
    for (const file of walk(srcDir)) {
      const name = file.split(sep).pop()
      if (NON_SHIPPING_PATTERNS.some((pattern) => pattern.test(name))) continue
      inputs[relative(projectPath, file).split(sep).join('/')] = sha256(readFileSync(file))
    }
  }

  for (const filename of BUILD_CONFIG_FILENAMES) {
    const path = join(projectPath, filename)
    if (existsSync(path)) inputs[filename] = sha256(readFileSync(path))
  }

  const manifest = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf8'))
  const projection = Object.fromEntries(
    MANIFEST_BUILD_FIELDS.filter((field) => manifest[field] !== undefined).map((field) => [
      field,
      manifest[field],
    ]),
  )
  inputs['package.json::build-fields'] = sha256(JSON.stringify(projection))

  return inputs
}

const fingerprintOf = (inputs) =>
  sha256(
    Object.keys(inputs)
      .sort()
      .map((path) => `${path}:${inputs[path]}`)
      .join('\n'),
  )

/** Projects that declare build output, and therefore can go stale. */
function projectsInScope() {
  return workspaceProjects()
    .map((project) => ({ ...project, outputDirs: buildOutputDirs(project.manifest) }))
    .filter((project) => project.outputDirs.length > 0)
}

function write(projectPath) {
  const inputs = hashInputs(projectPath)
  const payload = {
    version: FINGERPRINT_VERSION,
    builtAt: new Date().toISOString(),
    fingerprint: fingerprintOf(inputs),
    inputs,
  }
  writeFileSync(join(projectPath, FINGERPRINT_FILENAME), `${JSON.stringify(payload, null, 2)}\n`)
  return payload.fingerprint
}

function describeDrift(recorded, current) {
  const added = Object.keys(current).filter((path) => !(path in recorded))
  const removed = Object.keys(recorded).filter((path) => !(path in current))
  const changed = Object.keys(current).filter(
    (path) => path in recorded && recorded[path] !== current[path],
  )
  return { added, removed, changed }
}

/**
 * The workspace packages a directory depends on, from its own manifest.
 *
 * Derived rather than named so the caller cannot drift from what it actually
 * imports: a generator that gains a workspace dependency starts asserting that
 * dependency's freshness by adding nothing anywhere.
 */
function workspaceDependenciesOf(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const declared = { ...manifest.dependencies, ...manifest.devDependencies }
  return new Set(
    Object.keys(declared).filter((name) => String(declared[name]).startsWith('workspace:')),
  )
}

/**
 * @param scope         projects to examine; defaults to everything that builds.
 * @param requireOutput when true, absent build output is a failure rather than
 *                      a skip. A repo-wide sweep is right to skip a package
 *                      that has not been built — but a consumer about to read
 *                      that output has no such luxury, and "skipped" there
 *                      would be the observe-nothing shape this gate exists to
 *                      remove.
 */
function check({ scope = projectsInScope(), requireOutput = false, context = null } = {}) {
  const failures = []
  let verified = 0
  const skipped = []

  for (const project of scope) {
    const { path, name, manifest, outputDirs } = project

    // Coverage: a project that builds must record what it built from, or the
    // gate silently has nothing to compare and reports success for a package
    // it never examined.
    if (
      manifest.scripts?.build &&
      !manifest.scripts?.postbuild?.includes('dist-freshness-gate.mjs')
    ) {
      failures.push(
        `${name} (${path}) builds but has no postbuild fingerprint hook.\n` +
          `      Add:  "postbuild": "node ../../scripts/dist-freshness-gate.mjs --write ."`,
      )
      continue
    }

    const present = outputDirs.filter((dir) => existsSync(join(path, dir)))
    if (present.length === 0) {
      if (requireOutput) {
        failures.push(
          `${name} (${path}) has no ${outputDirs.join('/')} on disk, and ${context} is ` +
            `about to read it.\n      Run: pnpm --filter ${name} build`,
        )
        continue
      }
      skipped.push(`${name} (no ${outputDirs.join('/')} on disk)`)
      continue
    }

    const fingerprintPath = join(path, FINGERPRINT_FILENAME)
    if (!existsSync(fingerprintPath)) {
      failures.push(
        `${name} (${path}) has ${present.join(', ')} but no ${FINGERPRINT_FILENAME}.\n` +
          `      That output was produced by a build that did not record its inputs,\n` +
          `      so nothing can attest it matches the current source. Run: pnpm --filter ${name} build`,
      )
      continue
    }

    const recorded = JSON.parse(readFileSync(fingerprintPath, 'utf8'))
    const current = hashInputs(path)

    if (recorded.version !== FINGERPRINT_VERSION) {
      failures.push(
        `${name} (${path}) fingerprint is format v${recorded.version}; rebuild to refresh.`,
      )
      continue
    }

    if (recorded.fingerprint !== fingerprintOf(current)) {
      const { added, removed, changed } = describeDrift(recorded.inputs ?? {}, current)
      const detail = [
        ...changed.map((path) => `changed  ${path}`),
        ...added.map((path) => `added    ${path}`),
        ...removed.map((path) => `removed  ${path}`),
      ]
      failures.push(
        `${name} (${path}) build output is stale — sources changed since it was built` +
          `${recorded.builtAt ? ` (${recorded.builtAt})` : ''}:\n` +
          detail.map((line) => `        ${line}`).join('\n') +
          `\n      Run: pnpm --filter ${name} build`,
      )
      continue
    }

    verified += 1
  }

  if (failures.length > 0) {
    console.error('\n✖ Build output does not match sources:\n')
    for (const failure of failures) console.error(`    ${failure}\n`)
    console.error(
      context
        ? `  ${context} reads this output to produce a committed artifact. A\n` +
            '  generator fed stale input does not fail — it faithfully reproduces the\n' +
            '  stale input, and the artifact it writes then passes its own --check,\n' +
            '  because that check compares the output against itself.\n'
        : '  Stale build output is read by every plain-Node consumer in this repo\n' +
            '  (the TextMate generators, the CLI, any ad-hoc require of dist). Those\n' +
            '  readers do not fail on stale input; they return a confident wrong answer.\n',
    )
    process.exit(1)
  }

  console.log(
    `Build output matches sources: ${verified} verified, ${skipped.length} skipped of ${scope.length} in scope` +
      `${context ? ` (required by ${context})` : ''}.`,
  )
  for (const entry of skipped) console.log(`  skipped: ${entry}`)
}

const [mode, target] = process.argv.slice(2)

if (mode === '--write') {
  if (!target) {
    console.error('--write requires a project path, e.g. --write .')
    process.exit(1)
  }
  write(target)
} else if (mode === '--check') {
  check()
} else if (mode === '--require-deps') {
  // Run from the consuming package's directory, before it reads dist.
  const consumer = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
  const required = workspaceDependenciesOf(process.cwd())
  const scope = projectsInScope().filter((project) => required.has(project.name))

  // Coverage, same shape as the postbuild assertion above: if the intersection
  // is empty the run would pass while examining nothing, and the caller would
  // read that as verification.
  if (scope.length === 0) {
    console.error(
      `${consumer.name} declares no workspace dependency that produces build output, ` +
        'so this assertion would verify nothing. Remove it, or fix the dependency ' +
        'it was meant to cover.',
    )
    process.exit(1)
  }

  check({ scope, requireOutput: true, context: `${consumer.name}'s build:syntax` })
} else if (mode === '--list') {
  for (const project of projectsInScope())
    console.log(`${project.path}\t${project.outputDirs.join(',')}`)
} else {
  console.error(
    'usage: dist-freshness-gate.mjs (--check | --require-deps | --write <projectPath> | --list)',
  )
  process.exit(1)
}
