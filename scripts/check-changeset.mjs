// Release-hygiene guard. Fails a pull request that changes publishable
// package source without an accompanying changeset, so feature work can
// never merge to main and then silently publish nothing (the gap that
// shipped 0.5.0 from one PR while a later PR's features never reached npm
// because it carried no changeset). Docs-only, CI-only, and test-only
// changes do not require one; an intentional no-release change can still
// bypass the guard with an empty changeset (`pnpm changeset --empty`),
// which writes a `.changeset/*.md` this check accepts.
//
// Base resolution: BASE_SHA (set from the pull_request base on CI) when
// present, otherwise origin/main for local runs. The diff uses the
// three-dot form so it reflects only the branch's own changes since it
// diverged from the base.
//
// Which packages count as publishable comes from published-packages.mjs, the
// same derivation the packaging gates and CI's pack step use — see that file
// for why the set is derived rather than listed.

import { execFileSync } from 'node:child_process'

import { publishedPackages } from './published-packages.mjs'

function changedFiles(base) {
  const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`], {
    encoding: 'utf8',
  })
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const isTestOrDoc = (file) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || file.includes('/__tests__/') || file.endsWith('.md')

const base = process.env.BASE_SHA || 'origin/main'
const publishable = new Set(publishedPackages().map((pkg) => pkg.dir))
const files = changedFiles(base)

const sourceChanges = files.filter((file) => {
  const match = /^packages\/([^/]+)\/src\//.exec(file)
  return match && publishable.has(match[1]) && !isTestOrDoc(file)
})

const hasChangeset = files.some(
  (file) => /^\.changeset\/.+\.md$/.test(file) && file !== '.changeset/README.md',
)

if (sourceChanges.length > 0 && !hasChangeset) {
  console.error(
    'Missing changeset. This pull request changes publishable package source:\n' +
      sourceChanges.map((file) => `  - ${file}`).join('\n') +
      '\n\nAdd one with `pnpm changeset` so the next release publishes these ' +
      'changes. For an intentional no-release change, run `pnpm changeset --empty`.',
  )
  process.exit(1)
}

console.log(
  sourceChanges.length > 0
    ? `Changeset present for ${sourceChanges.length} publishable source change(s).`
    : 'No publishable source changes; changeset not required.',
)
