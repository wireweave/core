// Generated-artifact freshness gate — the post-Build half.
//
// Run the generators, then assert the working tree is unchanged. If a generator
// produces something different from what is committed, the commit is stale.
//
// The judgement is `git status`, not `git diff`, and the difference is the whole
// point. `git diff` compares the index and the working tree, so it is blind to
// files git does not track — a generator can emit a brand-new artifact and
// `git diff --exit-code` stays silent forever. That is not hypothetical: every
// artifact this gate currently sees is untracked, so its predecessor
// (`git diff --exit-code -- '*.tmLanguage.generated.json'`) could not fail no
// matter what the generators wrote. A gate that cannot observe its subject is
// worse than no gate, because it also reports success.
//
// So the four ways a generated artifact can be wrong are checked separately,
// each with its own diagnosis:
//
//   untracked  the artifact exists but git has never been told about it — the
//              blind spot above, and the reason this file replaced a diff
//   ignored    .gitignore excludes it, so it can never be committed; the gate
//              and .gitignore are asserting opposite things about the same file
//   modified   regenerating produced different bytes — the classic stale commit
//   deleted    the committed artifact is gone from the tree
//
// The set is derived, never listed. `*.generated.*` is the repo's naming
// convention for a committed build artifact, and git enumerates what matches;
// adding a generator therefore needs no edit here. A second hand-maintained
// list is the defect this whole task is removing, not a tool to reach for.
//
// Two artifacts sit outside the convention and are deliberately not in scope:
// packages/core/src/parser/generated-parser.js has its own dedicated gate
// (packages/core/scripts/check-generated-parser.mjs) which re-runs Peggy and
// compares bytes, and reports a missing artifact explicitly — it must run
// BEFORE Build, since Build overwrites it. Everything under node_modules/ and
// dist/ is third-party or ignored build output that no one commits.
//
// Paths are relative to the repository root; callers run from there.

import { execFileSync } from 'node:child_process'

// Pathspecs, passed verbatim to git. `*` matches `/` in a pathspec, so the
// convention glob is depth-independent and the exclusions cover every nesting
// level of node_modules/ and dist/ without naming a single package.
const SCOPE = ['*.generated.*', ':!*node_modules/*', ':!*/dist/*', ':!dist/*']

/**
 * @param {string[]} args
 * @returns {string[]} one entry per output line, empty lines dropped
 */
function git(args) {
  const stdout = execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return stdout.split('\n').filter((line) => line.length > 0)
}

/**
 * @param {string[]} paths
 * @returns {string}
 */
function bullets(paths) {
  return paths.map((path) => `    ${path}`).join('\n')
}

const tracked = git(['ls-files', '--', ...SCOPE])
const untracked = git(['ls-files', '--others', '--exclude-standard', '--', ...SCOPE])
const ignored = git(['ls-files', '--others', '--ignored', '--exclude-standard', '--', ...SCOPE])

// Tracked artifacts whose content changed or that vanished. Porcelain v1 lines
// are `XY <path>`; the status letters are what distinguish a rewrite from a
// deletion, so they are kept for the report rather than stripped.
const changed = git(['status', '--porcelain=v1', '--', ...SCOPE]).filter(
  (line) => !line.startsWith('??'),
)
const modified = changed.filter((line) => !/^.?D/.test(line)).map((line) => line.slice(3))
const deleted = changed.filter((line) => /^.?D/.test(line)).map((line) => line.slice(3))

if (tracked.length === 0 && untracked.length === 0 && ignored.length === 0) {
  console.error(
    '✖ No files matched the generated-artifact convention (*.generated.*).\n\n' +
      '  Either the generators did not run before this gate, or the naming\n' +
      '  convention changed and this gate is now watching an empty set. A gate\n' +
      '  with nothing to observe passes unconditionally, which is the failure\n' +
      '  mode it exists to prevent, so it refuses to report success.',
  )
  process.exit(1)
}

/** @type {string[]} */
const failures = []

if (untracked.length > 0) {
  failures.push(
    '✖ Generated artifacts are not tracked by git:\n\n' +
      bullets(untracked) +
      '\n\n' +
      '  They are on disk but were never added, so nothing compares them against\n' +
      '  anything — a stale or wrong artifact ships silently. Committed build\n' +
      '  artifacts are the premise of this gate (the docs site reads the TextMate\n' +
      '  grammar at config time, the .vsix ships its copy, and the test suite\n' +
      '  imports the extracted spec directly), so the fix is to commit them.',
  )
}

if (ignored.length > 0) {
  failures.push(
    '✖ Generated artifacts are excluded by .gitignore:\n\n' +
      bullets(ignored) +
      '\n\n' +
      '  .gitignore says these must never be committed; this gate says they must\n' +
      '  be committed and kept fresh. Both cannot hold. Decide which is right and\n' +
      '  change the losing side — either drop the ignore rule, or rename the\n' +
      '  artifact out of the *.generated.* convention because it really is\n' +
      '  disposable build output.',
  )
}

if (modified.length > 0) {
  failures.push(
    '✖ Generated artifacts are stale:\n\n' +
      bullets(modified) +
      '\n\n' +
      '  Re-running the generators produced different bytes than what is\n' +
      '  committed, so the committed copy no longer reflects its source. Run the\n' +
      '  build locally and commit the regenerated files.',
  )
}

if (deleted.length > 0) {
  failures.push(
    '✖ Generated artifacts are missing from the working tree:\n\n' +
      bullets(deleted) +
      '\n\n' +
      '  They are committed but the generators did not recreate them, so either\n' +
      '  a generator no longer emits them or it failed silently.',
  )
}

if (failures.length > 0) {
  console.error(`\n${failures.join('\n\n')}\n`)
  process.exit(1)
}

console.log(
  `✓ ${tracked.length} generated artifact(s) tracked and in sync:\n` +
    tracked.map((path) => `    ${path}`).join('\n'),
)
