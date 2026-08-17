// Packaging-gate coverage guard, and the list emitter CI's packaging steps
// iterate over.
//
// The defect this exists to stop is not a wrong `main` field; it is that the
// packaging checks were opt-in and invisible. Nine packages carried a `publint`
// script, no workflow ever called any of them, and the one package missing the
// script — @wireweave/core, which every other package depends on — was also the
// one shipping `module: dist/index.mjs` pointing at a file tsup never emits.
// Nothing reported the omission because nothing knew the set of packages that
// were supposed to be covered.
//
// So coverage is asserted against the published set (published-packages.mjs)
// rather than inferred from whoever happened to add a script: adding a package
// to the release train without wiring its gate fails CI by default. The same
// derivation drives which packages CI runs publint and pack against, so the
// checked set and the executed set cannot drift apart.
//
// Usage (from the repository root):
//   node scripts/packaging-gate.mjs --check   assert coverage, exit 1 on a gap
//   node scripts/packaging-gate.mjs --list    print one package path per line
//   node scripts/packaging-gate.mjs --check-tarballs
//                                            pack each published package and
//                                            assert what is inside (after Build)
//   node scripts/packaging-gate.mjs --check-side-effects
//                                            evaluate every entry of every
//                                            package claiming `sideEffects:
//                                            false` and assert the claim
//                                            (after Build)

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { publishedPackages } from './published-packages.mjs'
import { workspaceProjects } from './workspace-projects.mjs'

// ---------------------------------------------------------------------------
// `--probe`: evaluate one entry and report what evaluating it did.
//
// Handled before anything else in this file runs so the observed realm holds as
// little of this gate's own machinery as possible. It is an internal mode —
// checkSideEffects() spawns it once per entry because the question is "what
// happens the first time this module is evaluated", and a module evaluates once
// per process. Ten entries in one process would measure nine cached no-ops.
//
// Effects are split by whether dropping the module would change the program:
//
//   MUTATION   writes, spawns, network, timers, env, added or redefined
//              globals. `sideEffects: false` tells a bundler it may delete the
//              module when no export of it is used; if evaluating it mutates
//              something, deleting it silently removes that mutation. This is
//              the class that fails.
//   READ       fs reads at import time. A read whose result only feeds an
//              export is safe to drop — dropping it skips work nobody wanted —
//              so this does not fail the gate. It is still reported, because a
//              package that reads from disk to construct its exports has a
//              fragility a bundler will not warn about either.
//
// Prototype mutation is checked explicitly rather than left to the globals
// diff: the textbook reason `sideEffects: false` is wrong is a polyfill, and a
// polyfill adds no global — it edits Array.prototype in place.
//
// Two detectors, because they fail in different directions:
//
//   STATE      globals, builtin prototypes and process.env are compared before
//              and after evaluation. This sees the mutation itself, so it holds
//              however the module caused it.
//   INTERCEPT  fs / network / child_process / timers are observed by replacing
//              methods on the builtin module objects. Best-effort by
//              construction: a bundle that does `import { writeFileSync } from
//              "fs"` binds the export before this replaces it and slips past.
//              Kept because it names the offending call when it does fire, and
//              because the effects it would miss are the ones STATE and the
//              parent's stdio capture already catch by their consequences.
//
// Written output is not instrumented here at all. The parent captures this
// child's stdout and stderr, so anything the module prints is observed from
// outside the realm it could tamper with — see checkSideEffects(). That is why
// the report below goes to a file rather than to stdout.
if (process.argv[2] === '--probe') {
  const { createRequire } = await import('node:module')
  const { pathToFileURL } = await import('node:url')
  const [, , , entry, reportPath] = process.argv

  const fsSync = await import('node:fs')
  const fsAsync = await import('node:fs/promises')

  // Taken before the wrapping below, so writing the report is not itself one of
  // the effects the report describes.
  const writeReport = (fsSync.default ?? fsSync).writeFileSync

  const effects = []
  const note = (kind, channel, detail) => effects.push({ kind, channel, detail })

  const wrap = (object, name, kind, channel) => {
    const original = object[name]
    if (typeof original !== 'function') return
    object[name] = function (...args) {
      note(kind, channel, `${name}(${String(args[0]).slice(0, 120)})`)
      return original.apply(this, args)
    }
  }

  for (const namespace of [fsSync.default ?? fsSync, fsAsync.default ?? fsAsync]) {
    for (const name of ['writeFileSync', 'appendFileSync', 'mkdirSync', 'rmSync', 'unlinkSync'])
      wrap(namespace, name, 'MUTATION', 'fs:write')
    for (const name of ['writeFile', 'mkdir', 'rm', 'unlink'])
      wrap(namespace, name, 'MUTATION', 'fs:write')
    for (const name of ['readFileSync', 'readdirSync', 'statSync'])
      wrap(namespace, name, 'READ', 'fs:read')
    for (const name of ['readFile', 'readdir', 'stat']) wrap(namespace, name, 'READ', 'fs:read')
  }

  for (const name of ['setTimeout', 'setInterval', 'setImmediate'])
    wrap(globalThis, name, 'MUTATION', 'timer')

  const probeRequire = createRequire(import.meta.url)
  for (const id of ['node:http', 'node:https']) {
    const lib = probeRequire(id)
    for (const name of ['request', 'get']) wrap(lib, name, 'MUTATION', 'network')
  }
  const childProcess = probeRequire('node:child_process')
  for (const name of ['exec', 'execSync', 'spawn', 'spawnSync', 'execFileSync'])
    wrap(childProcess, name, 'MUTATION', 'process')

  const PROTOTYPES = { Array, Object, String, Number, Promise, Function }
  const shapeOf = () =>
    Object.fromEntries(
      Object.entries(PROTOTYPES).map(([name, constructor]) => [
        name,
        Object.getOwnPropertyNames(constructor.prototype).sort().join(','),
      ]),
    )

  const globalsBefore = new Set(Reflect.ownKeys(globalThis))
  const prototypesBefore = shapeOf()
  const environmentBefore = JSON.stringify(process.env)

  let failure = null
  try {
    await import(pathToFileURL(entry).href)
  } catch (error) {
    // The code carries the permission model's verdict; name and message alone
    // render a denied write as an anonymous crash.
    failure = [error.code, `${error.name}: ${error.message}`].filter(Boolean).join(' ')
  }

  for (const name of Reflect.ownKeys(globalThis).filter((key) => !globalsBefore.has(key)))
    note('MUTATION', 'global', `added ${String(name)}`)

  const prototypesAfter = shapeOf()
  for (const [name, before] of Object.entries(prototypesBefore))
    if (prototypesAfter[name] !== before) note('MUTATION', 'prototype', `${name}.prototype edited`)

  if (JSON.stringify(process.env) !== environmentBefore)
    note('MUTATION', 'env', 'process.env mutated')

  writeReport(reportPath, JSON.stringify({ failure, effects }))
  process.exit(0)
}

// Scripts every published package must define, and the exact command each must
// run. CI invokes each package's own script rather than a root-level binary,
// matching how the rest of this repo's tooling is wired (per-package
// eslint.config.mjs, knip.json, tsup.config.ts) — which also keeps
// `pnpm --filter <pkg> publint` reproducing a CI failure locally, in the
// package where it has to be fixed.
//
// The command is pinned, not just the script name, because a per-package script
// is also a per-package opportunity to weaken the check. Dropping `--strict`
// from one manifest would silently drop that package back to error-only
// linting while CI still reported ten gates running — the same "declared but
// not doing anything" shape as the ungated scripts this guard replaced. Pinning
// makes the level a property of the published set rather than of whoever last
// edited a manifest.
//
// knip is absent on purpose. Every published package declares a `knip` script
// and nothing calls it, which is precisely the defect this file exists to
// close — but enabling it today lands a red gate (ux-rules' 73 unused exports
// are an API-surface decision, and core's unused renderer type sits in a file
// under active edit), and silencing findings to reach green would rebuild the
// same blind gate in a new place. It joins this map once those two are settled.
const REQUIRED_SCRIPTS = { publint: 'publint --strict' }

// The engines floor is checked here because publint structurally cannot check
// it. A missing `engines` is a publint *Suggestion*, and suggestions stay
// advisory even under --strict — verified by running it, not by reading the
// docs. So the one packaging fact with a runtime consequence for consumers
// (npm warns, and increasingly refuses, on an unsatisfied engines range) was
// the one fact no gate could ever fail on. Eight of the ten packages declared
// nothing at all and CI reported ten green packaging gates.
//
// Expected value is read from the root manifest rather than written here: the
// floor is one deliberate decision, and a copy in this file would be a second
// place to update. Equality, not compatibility, is asserted — "every published
// package makes the same claim" is checkable without a semver library, whereas
// "this range is compatible with that range" is not.
const ROOT_MANIFEST = 'package.json'
const NVMRC = '.nvmrc'

function expectedEnginesNode() {
  const root = JSON.parse(readFileSync(ROOT_MANIFEST, 'utf8'))
  const declared = root.engines?.node
  if (declared === undefined) {
    console.error(
      `The root ${ROOT_MANIFEST} declares no engines.node, so there is nothing ` +
        'for the published packages to agree with. Declare the floor there first.',
    )
    process.exit(1)
  }
  return declared
}

// The floor the packages advertise and the version CI actually runs are two
// separate claims, and only the second one is ever exercised. Tying them means
// a runtime nobody tests cannot be advertised as supported. Only the `>=x.y.z`
// form is understood: if the range is rewritten to something richer, this gate
// says so and fails rather than quietly checking nothing — which is the exact
// failure mode the whole step exists to remove.
function nvmrcMismatch(expected) {
  const pinned = readFileSync(NVMRC, 'utf8').trim().replace(/^v/, '')
  const floor = /^>=(\d+\.\d+\.\d+)$/.exec(expected)

  if (floor === null) {
    return (
      `The root engines.node is "${expected}", which this gate cannot compare ` +
      `against ${NVMRC} — it only understands ">=x.y.z". Either restore that ` +
      'form or teach this check the new one; leaving it unreadable means the ' +
      'advertised floor stops being verified against the version CI runs.'
    )
  }

  if (floor[1] !== pinned) {
    return (
      `The root engines.node floor is ${floor[1]} but ${NVMRC} pins ${pinned}. ` +
      'The published packages would advertise support for a runtime nothing in ' +
      'this repository builds or tests against.'
    )
  }

  return null
}

// Lint coverage is asserted here because the root config stopped claiming the
// workspaces. That was the right fix — each package already lints itself with
// its own tsconfigRootDir, and root claiming them made typescript-eslint see
// twelve candidate project roots and refuse to parse anything. But it moves
// coverage from "one config sweeps everything" to "every project covers
// itself", and nothing checked that the second arrangement holds. A package
// added without a config would be ignored by root and unexamined by itself:
// no error, no output, just a directory nobody lints. `pnpm -r run lint` skips
// a project with no `lint` script silently, so the omission cannot surface at
// run time either.
//
// Both halves are required because either alone is uncovered: a config with no
// script is never invoked, a script with no config makes eslint search upward
// and lint the project under someone else's rules.
//
// The filenames are ESLint's own flat-config names, not a house convention —
// this list changes when ESLint changes, not when this repository does.
// .eslintrc* is absent deliberately: ESLint 10 does not read it, so accepting
// one would certify a project that is not actually linted.
const LINT_CONFIG_FILENAMES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
]

// ---------------------------------------------------------------------------
// Tarball contents — the axis every other check in this file is blind to.
//
// Everything above reasons about the manifest: does a field point at dist, does
// the floor agree with .nvmrc. None of it opens the artifact. publint has the
// same shape — it resolves `main` against the working directory, where
// packages/core/src/index.ts genuinely exists, so it passes. The question
// "what did the packer actually put in the tarball" was asked by nothing.
//
// It is not hypothetical. `pnpm pack` and `npm pack` disagree on this repo:
//
//   pnpm pack   21 entries, no package/src/*   (publishConfig substituted in)
//   npm  pack   22 entries, package/src/index.ts included
//
// npm does not apply publishConfig's field overrides, so `main` stays
// src/index.ts, and npm-packlist force-includes whatever `main` names
// regardless of `files`. The stray file is not the damage: src/index.ts is a
// barrel re-exporting twelve sibling directories, none of which are packed, and
// npm leaves main/module/types all pointing at it. An npm-published core would
// have a legacy entry point and a types entry point that resolve to a file
// whose every import is missing, while exports-aware consumers read dist and
// notice nothing.
//
// Real releases go through pnpm — publish.yml runs `pnpm exec changeset
// publish`, and changesets spawns `pnpm publish` when it detects a pnpm
// workspace — so what ships today is the clean tarball. That makes this gate
// sound only as long as the publishing packer stays the packer verified here,
// which is why publishPathIsPnpm() below asserts it rather than assuming it.
//
// Three assertions, all derived from the manifest rather than listed here —
// and deliberately NOT derived from `files`, see shippableDirs():
//
//   CONTAINMENT   every entry sits under a directory some resolution field
//                 points into, or is metadata the packer always adds. A package
//                 that starts shipping src/, a stray .env, or a fixtures
//                 directory fails.
//   RESOLVABILITY every path the PACKED manifest points at exists inside that
//                 same tarball. This is publint's question asked one layer
//                 later, where the answer can differ — and it is the layer that
//                 catches a dist whose declarations never got emitted, since a
//                 file missing from the tarball is missing no matter what the
//                 working directory looks like.
//   SUBSTANCE     every resolved path also has content. Presence and
//                 completeness are different questions: an interrupted or
//                 out-of-space build leaves a zero-byte dist/index.d.ts behind,
//                 and every presence check in this repo — publint included —
//                 passes it, because the file is right there. A consumer then
//                 imports the package and gets no types at all, silently, which
//                 is the failure mode types exist to prevent.
//
// SUBSTANCE's oracle is blankness and nothing more, which is narrower than it
// first looks like it should be. The obvious sharper rule — a .d.ts must
// declare or export something — was written, run, and withdrawn, because it
// fails @wireweave/mcp-server, whose dist/index.d.ts is exactly the 20-byte
// shebang tsup copies from a source entry with zero exports. That file is
// correct: the module really does export nothing. Telling "empty because the
// build broke" apart from "empty because there was nothing to declare" needs
// the source's export surface, not the tarball, so it does not belong on this
// axis. What stays is decidable and cannot false-red. A file truncated mid-way
// through real content also still passes; both residues are stated here rather
// than implied by silence.

// Files a packer includes whatever `files` says, so they cannot be treated as
// violations. Derived from the npm spec's always-included set, not from what
// this repo happens to contain today.
const ALWAYS_PACKED = /^(package\.json|README|LICENCE|LICENSE|NOTICE|CHANGELOG)(\.[^/]+)?$/i

// Generous enough that a normal bundle is read in full; overflow is handled
// where it is read rather than by picking a number nothing can exceed.
const EXTRACT_BUFFER = 64 * 1024 * 1024

// Source is never shippable, whatever a manifest field says. A resolution
// field pointing into src/ is the defect itself, not a licence to ship src/.
const SOURCE_DIR = 'src'

/**
 * Directories this package is allowed to ship, derived from where its
 * resolution fields point.
 *
 * The first version of this check derived the allowlist from `files`, and was
 * almost unfalsifiable: `files` is also what tells the packer what to pack, so
 * widening it widened the packed set and the permitted set in lockstep and the
 * two could never disagree. Deriving an expectation from the same field that
 * drives the behaviour deletes the test. The resolution fields are an
 * independent statement of intent — "this is what consumers load" — so contents
 * checked against them can actually disagree, and a package that ships a
 * directory nothing resolves into has to say why.
 */
function shippableDirs(manifest) {
  const dirs = new Set()
  for (const target of resolutionTargets(manifest)) {
    const [head, ...rest] = target.split('/')
    if (rest.length > 0 && head !== SOURCE_DIR) dirs.add(head)
  }
  return dirs
}

/** Every relative path a manifest's resolution fields point at. */
function resolutionTargets(manifest) {
  const targets = new Set()

  const collect = (value) => {
    if (typeof value === 'string') {
      if (value.startsWith('./')) targets.add(value.slice(2))
      return
    }
    if (value && typeof value === 'object')
      for (const nested of Object.values(value)) collect(nested)
  }

  for (const field of ['main', 'module', 'types', 'typings']) {
    const value = manifest[field]
    if (typeof value === 'string') targets.add(value.replace(/^\.\//, ''))
  }
  collect(manifest.exports)
  collect(manifest.bin)
  if (typeof manifest.bin === 'string') targets.add(manifest.bin.replace(/^\.\//, ''))

  return [...targets]
}

/**
 * The packer whose output this gate verifies has to be the packer that
 * publishes, or the verification describes an artifact nobody ships.
 *
 * Only the automated paths are checkable: a person typing `npm publish` in a
 * terminal is outside the reach of any gate in this repository, and this one
 * does not pretend otherwise.
 */
function publishPathIsPnpm() {
  const offenders = []

  // Comments are stripped before matching. The first draft of this check
  // reported publish.yml:14 — a sentence explaining which packages are *not*
  // changesets npm publish targets. A gate that fails on its own documentation
  // trains people to ignore it, which costs more than the check is worth. `#`
  // opens a comment in YAML and in the shell inside a `run:` block, so one rule
  // covers both.
  const stripComment = (line) => line.replace(/(^|\s)#.*$/, '')
  const INVOKES_NPM_PUBLISH = /(^|[^-\w])npm\s+publish\b/

  const workflowDir = '.github/workflows'
  if (existsSync(workflowDir)) {
    for (const file of readdirSync(workflowDir).filter((name) => /\.ya?ml$/.test(name))) {
      const path = join(workflowDir, file)
      for (const [index, line] of readFileSync(path, 'utf8').split('\n').entries()) {
        if (INVOKES_NPM_PUBLISH.test(stripComment(line))) offenders.push(`${path}:${index + 1}`)
      }
    }
  }

  for (const project of workspaceProjects()) {
    for (const [script, command] of Object.entries(project.manifest.scripts ?? {})) {
      if (typeof command === 'string' && INVOKES_NPM_PUBLISH.test(stripComment(command))) {
        offenders.push(`${project.path} package.json scripts.${script}`)
      }
    }
  }

  if (offenders.length === 0) return null

  return (
    'The publish path invokes npm directly:\n' +
    offenders.map((where) => `  - ${where}`).join('\n') +
    '\n\nThis gate verifies `pnpm pack` output, and pnpm is what changeset ' +
    'publish spawns today. npm does not apply publishConfig field overrides, so ' +
    'an npm-published package carries the workspace-facing main/module/types — ' +
    'which point at src/ and resolve to files that are not in the tarball. ' +
    'Publish through pnpm, or make the manifests safe under both packers.'
  )
}

function checkTarballs() {
  const failures = []
  const destination = mkdtempSync(join(tmpdir(), 'wireweave-pack-'))

  try {
    for (const pkg of packages) {
      let packed
      try {
        packed = execFileSync('pnpm', ['pack', '--pack-destination', destination], {
          cwd: pkg.path,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      } catch (error) {
        failures.push(`${pkg.name}: pnpm pack failed\n${error.stderr || error.message}`)
        continue
      }

      const tarball = packed.trim().split('\n').pop().trim()
      const path = existsSync(tarball) ? tarball : join(destination, tarball.split('/').pop())

      const entries = execFileSync('tar', ['-tzf', path], { encoding: 'utf8' })
        .split('\n')
        .filter((line) => line.length > 0 && !line.endsWith('/'))
        .map((line) => line.replace(/^package\//, ''))

      const manifest = JSON.parse(
        execFileSync('tar', ['-xzOf', path, 'package/package.json'], { encoding: 'utf8' }),
      )

      const shippable = shippableDirs(manifest)
      if (shippable.size === 0) {
        failures.push(
          `${pkg.name}: no resolution field points into a directory, so there is ` +
            'nothing to check the tarball contents against. A published package ' +
            'whose main/module/types/exports all sit at the root is either wrong ' +
            'or a case this gate has never seen — say which before publishing it.',
        )
        continue
      }

      const unexpected = entries.filter(
        (entry) =>
          !ALWAYS_PACKED.test(entry) && ![...shippable].some((dir) => entry.startsWith(`${dir}/`)),
      )

      if (unexpected.length > 0) {
        failures.push(
          `${pkg.name}: tarball ships paths that no resolution field points into ` +
            `(shippable: ${[...shippable].join(', ')}):\n` +
            unexpected.map((entry) => `      package/${entry}`).join('\n') +
            '\n      Either a consumer never loads these and they are dead weight in ' +
            'every install, or something loads them and the manifest does not say so.',
        )
      }

      const targets = resolutionTargets(manifest)
      const missing = targets.filter((target) => !entries.includes(target))
      if (missing.length > 0) {
        failures.push(
          `${pkg.name}: the packed manifest points at paths that are not in its own tarball:\n` +
            missing.map((target) => `      ${target}`).join('\n') +
            '\n      Consumers installing this package would resolve these to nothing.',
        )
      }

      // Presence is not completeness — see SUBSTANCE in the header. Only the
      // targets that are actually in the tarball are read; a missing one is
      // already reported above and extracting it would just fail differently.
      const hollow = []
      for (const target of targets.filter((target) => entries.includes(target))) {
        let content
        try {
          content = execFileSync('tar', ['-xzOf', path, `package/${target}`], {
            encoding: 'utf8',
            maxBuffer: EXTRACT_BUFFER,
          })
        } catch (error) {
          // A file too large to buffer is, by construction, not the defect this
          // looks for. core's dist/index.cjs is over a megabyte and overflowed
          // the default 1 MB buffer on the first run of this check — treating
          // that overflow as anything but "not hollow" would make the gate fail
          // on the healthiest package in the repo. Anything else is a real
          // error and still propagates.
          if (error.code !== 'ENOBUFS') throw error
          continue
        }

        if (content.trim().length === 0) {
          hollow.push(`${target} — ${content.length} bytes, no content`)
        }
      }

      if (hollow.length > 0) {
        failures.push(
          `${pkg.name}: the packed manifest resolves to files that carry nothing:\n` +
            hollow.map((entry) => `      ${entry}`).join('\n') +
            '\n      These exist, so every presence check passes; a consumer still ' +
            'gets an empty module or no types.',
        )
      }
    }
  } finally {
    rmSync(destination, { recursive: true, force: true })
  }

  const publishPath = publishPathIsPnpm()
  if (publishPath !== null) failures.push(publishPath)

  if (failures.length > 0) {
    console.error('Tarball contents check failed:\n\n' + failures.join('\n\n'))
    process.exit(1)
  }

  console.log(
    `Tarball contents verified for all ${packages.length} published packages: ` +
      'every entry sits under a directory a resolution field points into or is ' +
      'packer-added metadata, and every ' +
      'path the packed manifest resolves to is present in its own tarball and ' +
      'carries content.',
  )
  process.exit(0)
}

// ---------------------------------------------------------------------------
// sideEffects — a promise made to bundlers that nothing verifies.
//
// `sideEffects: false` licenses a bundler to delete any module of the package
// whose exports the application does not use, without evaluating it. Three
// packages here make that promise. Nothing has ever checked it, and nothing
// would notice it becoming false: the field is read by webpack and rollup in
// someone else's build, so the damage surfaces as a missing registration or an
// absent polyfill in a consumer's application, at which point the cause is
// several repositories away from the effect.
//
// Scope is derived from the promise, not from a list: every published package
// whose manifest sets `sideEffects: false`, and within it every entry its
// exports map resolves to. A package that adds the field is covered the moment
// it adds it, and one that adds an export path is covered the moment it adds
// that. Packages that make no claim are deliberately not checked — absent means
// "assume side effects", which is the safe reading and not a promise anyone can
// break. Verifying a claim nobody made would be this gate inventing policy.
const ENTRY_CONDITIONS = ['import', 'module', 'default']

// The probe is this same file re-entered with --probe, so the instrumentation
// and the checker cannot drift apart into two files that disagree.
const PROBE_SCRIPT = fileURLToPath(import.meta.url)

/**
 * The name of Node's permission-model flag on the running Node, or null.
 *
 * The probe's method patching is genuinely bypassable and this closes the gap
 * for the class that matters most. It was not a theoretical hole: a fixture
 * doing `import { writeFileSync } from "node:fs"` at import time passed the
 * gate green, because the named ESM export of a builtin is bound before this
 * script can replace the property. Under the permission model the same fixture
 * is denied by Node itself, below the layer any binding can dodge, and it also
 * covers process spawning and worker threads for free.
 *
 * The flag is detected rather than hardcoded because it was renamed:
 * --experimental-permission on Node 22, --permission from Node 23. This repo's
 * engines floor is 22.13, so both are reachable and neither can be assumed.
 * When neither works the gate still runs with its other detectors and says so,
 * rather than silently narrowing.
 */
let permissionFlagCache
function permissionFlag() {
  if (permissionFlagCache !== undefined) return permissionFlagCache

  for (const flag of ['--permission', '--experimental-permission']) {
    try {
      execFileSync(process.execPath, [flag, '--allow-fs-read=*', '-e', ''], { stdio: 'ignore' })
      permissionFlagCache = flag
      return permissionFlagCache
    } catch {
      // Unsupported on this Node; try the older spelling.
    }
  }

  permissionFlagCache = null
  return permissionFlagCache
}

/**
 * Every distinct file this package's exports map resolves to.
 *
 * The ESM conditions are preferred because `sideEffects` is consumed by
 * bundlers resolving the ESM graph; `main` is the fallback for a manifest with
 * no exports map at all.
 */
function entryPoints(manifest) {
  const entries = new Set()

  const collect = (value) => {
    if (typeof value === 'string') {
      if (value.endsWith('.js') || value.endsWith('.mjs')) entries.add(value.replace(/^\.\//, ''))
      return
    }
    if (!value || typeof value !== 'object') return
    for (const condition of ENTRY_CONDITIONS)
      if (condition in value) {
        collect(value[condition])
        return
      }
    for (const nested of Object.values(value)) collect(nested)
  }

  collect(manifest.exports)
  if (entries.size === 0)
    for (const field of ['module', 'main'])
      if (typeof manifest[field] === 'string') entries.add(manifest[field].replace(/^\.\//, ''))

  return [...entries]
}

function checkSideEffects() {
  const claimants = packages.filter((pkg) => pkg.manifest.sideEffects === false)

  if (claimants.length === 0) {
    console.error(
      'No published package declares `sideEffects: false`, so this check verifies ' +
        'nothing and would report success forever. Three packages declared it when ' +
        'this was written. Either the declarations were dropped — in which case ' +
        'restore them or say why here — or this mode has outlived its subject and ' +
        'should be deleted rather than left passing.',
    )
    process.exit(1)
  }

  const failures = []
  const reads = []
  const destination = mkdtempSync(join(tmpdir(), 'wireweave-effects-'))
  let verified = 0

  try {
    for (const pkg of claimants) {
      const entries = entryPoints(pkg.manifest)

      if (entries.length === 0) {
        failures.push(
          `${pkg.name}: declares sideEffects: false but no exports condition ` +
            'resolves to a JavaScript file, so the claim covers nothing this gate ' +
            'can evaluate.',
        )
        continue
      }

      for (const entry of entries) {
        const absolute = join(pkg.path, entry)
        if (!existsSync(absolute)) {
          failures.push(
            `${pkg.name}: ${entry} does not exist, so its sideEffects claim is ` +
              'unverifiable. Build the package before running this check.',
          )
          continue
        }

        const reportPath = join(destination, `${verified}.json`)
        const sandbox = permissionFlag()
        const nodeArgs = sandbox
          ? // Reads stay open so the entry and its dependency graph load
            // normally; writes are narrowed to the one file the probe reports
            // through, so any other write is denied by Node rather than by a
            // patch the module could have bound around.
            [sandbox, '--allow-fs-read=*', `--allow-fs-write=${reportPath}`]
          : []

        let stdio
        try {
          stdio = execFileSync(
            process.execPath,
            [...nodeArgs, PROBE_SCRIPT, '--probe', absolute, reportPath],
            // The probe reports through a file; whatever reaches these streams
            // was printed by the module itself.
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: process.cwd() },
          )
        } catch (error) {
          failures.push(
            `${pkg.name}: evaluating ${entry} crashed the probe.\n${error.stderr || error.message}`,
          )
          continue
        }

        if (!existsSync(reportPath)) {
          failures.push(
            `${pkg.name}: the probe for ${entry} produced no report, so nothing was ` +
              'measured. Treated as a failure rather than a pass — a check that ' +
              'cannot run has not succeeded.',
          )
          continue
        }

        const report = JSON.parse(readFileSync(reportPath, 'utf8'))
        verified += 1

        if (report.failure !== null) {
          // Under the permission model a denied write, spawn or worker surfaces
          // as this error rather than as an intercepted call. Reporting it as a
          // generic crash would name the symptom and hide the cause.
          const denied = report.failure.includes('ERR_ACCESS_DENIED')
          failures.push(
            denied
              ? `${pkg.name}: evaluating ${entry} tried to touch the filesystem, spawn ` +
                  `a process or start a worker — ${report.failure}\n` +
                  '      Denied by Node rather than observed by a patch, so this holds ' +
                  'however the module reached for it.'
              : `${pkg.name}: importing ${entry} threw — ${report.failure}\n` +
                  '      A published entry that cannot be evaluated is a defect on its ' +
                  'own, whatever it claims about side effects.',
          )
          continue
        }

        const printed = stdio.trim()
        if (printed.length > 0) {
          failures.push(
            `${pkg.name}: evaluating ${entry} wrote to stdout/stderr:\n` +
              printed
                .split('\n')
                .slice(0, 5)
                .map((line) => `      ${line}`)
                .join('\n'),
          )
        }

        const mutations = report.effects.filter((effect) => effect.kind === 'MUTATION')
        if (mutations.length > 0) {
          failures.push(
            `${pkg.name}: evaluating ${entry} changed observable state:\n` +
              mutations.map((effect) => `      ${effect.channel} — ${effect.detail}`).join('\n') +
              '\n      sideEffects: false lets a bundler delete this module when no ' +
              'export of it is used, which would delete the change above with it.',
          )
        }

        for (const effect of report.effects.filter((effect) => effect.kind === 'READ'))
          reads.push(`${pkg.name} ${entry}: ${effect.channel} — ${effect.detail}`)
      }
    }
  } finally {
    rmSync(destination, { recursive: true, force: true })
  }

  if (failures.length > 0) {
    console.error('sideEffects check failed:\n\n' + failures.join('\n\n'))
    process.exit(1)
  }

  const sandbox = permissionFlag()
  console.log(
    `sideEffects: false verified for ${claimants.length} packages ` +
      `(${verified} entries evaluated): ` +
      claimants.map((pkg) => pkg.name).join(', ') +
      '\nNo entry printed, mutated a global, edited a builtin prototype, wrote to ' +
      'disk, spawned a process, opened a socket or scheduled a timer at import time.' +
      (sandbox
        ? `\nFilesystem, process and worker access were enforced by Node (${sandbox}), ` +
          'not only observed by patching.'
        : '\nThis Node supports neither --permission nor --experimental-permission, so ' +
          'writes and spawns were only observed by method patching, which a module ' +
          'binding builtins directly can bypass. Re-run on Node >= 22.13 for the ' +
          'enforced check.'),
  )
  if (reads.length > 0)
    console.log(
      '\nRead from disk at import time (allowed — a read that only feeds an export ' +
        'is safe for a bundler to drop — but reported):\n' +
        reads.map((entry) => `  ${entry}`).join('\n'),
    )
  process.exit(0)
}

const mode = process.argv[2]
const packages = publishedPackages()

if (packages.length === 0) {
  console.error(
    'No published packages found under packages/. Either the workspace layout ' +
      'changed or this script is running outside the repository root.',
  )
  process.exit(1)
}

if (mode === '--list') {
  console.log(packages.map((pkg) => pkg.path).join('\n'))
  process.exit(0)
}

if (mode === '--check-tarballs') checkTarballs()

if (mode === '--check-side-effects') checkSideEffects()

if (mode === '--check') {
  // Both checks run before anything is reported. Failing on the first one would
  // hide the second behind a fix-and-rerun cycle, and these are exactly the
  // manifest facts a new package gets wrong all at once.
  const failures = []

  const gaps = packages.flatMap((pkg) =>
    Object.entries(REQUIRED_SCRIPTS)
      .filter(([script, command]) => pkg.manifest.scripts?.[script] !== command)
      .map(([script, command]) => ({
        pkg,
        script,
        command,
        actual: pkg.manifest.scripts?.[script],
      })),
  )

  if (gaps.length > 0) {
    failures.push(
      'Published packages are missing packaging gates:\n' +
        gaps
          .map(({ pkg, script, command, actual }) =>
            actual === undefined
              ? `  - ${pkg.name}: no "${script}" script (expected "${command}")`
              : `  - ${pkg.name}: "${script}" is "${actual}", expected "${command}"`,
          )
          .join('\n') +
        '\n\nEvery package changesets publishes must run the packaging checks at ' +
        'the same level, or CI validates a subset of what ships while reporting ' +
        'that it validated everything. Set the script (and add its devDependency) ' +
        'in each package listed above.',
    )
  }

  const expectedEngines = expectedEnginesNode()
  const drift = nvmrcMismatch(expectedEngines)
  if (drift !== null) failures.push(drift)

  const wrongEngines = packages.filter((pkg) => pkg.manifest.engines?.node !== expectedEngines)

  if (wrongEngines.length > 0) {
    failures.push(
      `Published packages disagree with the root engines.node ("${expectedEngines}"):\n` +
        wrongEngines
          .map((pkg) =>
            pkg.manifest.engines?.node === undefined
              ? `  - ${pkg.name}: no engines.node`
              : `  - ${pkg.name}: engines.node is "${pkg.manifest.engines.node}"`,
          )
          .join('\n') +
        '\n\nAn undeclared floor installs onto any runtime without a warning, and ' +
        'a floor lower than the one CI runs advertises support that was never ' +
        'built or tested. publint reports this as a Suggestion, which never fails ' +
        'even under --strict, so it is asserted here instead.',
    )
  }

  const projects = workspaceProjects()
  const unlinted = projects
    .map((project) => ({
      project,
      config: LINT_CONFIG_FILENAMES.some((filename) => existsSync(join(project.path, filename))),
      script: typeof project.manifest.scripts?.lint === 'string',
    }))
    .filter(({ config, script }) => !config || !script)

  if (unlinted.length > 0) {
    failures.push(
      'Workspace projects are not covered by lint:\n' +
        unlinted
          .map(({ project, config, script }) => {
            const missing = [
              config ? null : `no ${LINT_CONFIG_FILENAMES[1]}`,
              script ? null : 'no "lint" script',
            ].filter((item) => item !== null)
            return `  - ${project.path} (${project.name}): ${missing.join(', ')}`
          })
          .join('\n') +
        '\n\nThe root config lints only root-owned files, so a project without ' +
        'its own config and script is linted by nobody — and `pnpm -r run lint` ' +
        'reports that as success because it skips projects that declare no such ' +
        'script. Add both to each project listed above.',
    )
  }

  if (failures.length > 0) {
    console.error(failures.join('\n\n'))
    process.exit(1)
  }

  console.log(
    `Packaging gates and engines.node ("${expectedEngines}") present on all ` +
      `${packages.length} published packages: ` +
      packages.map((pkg) => pkg.name).join(', ') +
      `\nLint coverage present on all ${projects.length} workspace projects.`,
  )
  process.exit(0)
}

console.error(
  'Usage: node scripts/packaging-gate.mjs --check | --check-tarballs | ' +
    '--check-side-effects | --list',
)
process.exit(1)
