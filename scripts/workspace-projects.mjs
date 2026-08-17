// Single source of truth for "which directories are workspace projects".
//
// Distinct from published-packages.mjs on purpose. That set answers "what
// reaches npm" and is derived from the filesystem alone, because the changeset
// job runs it with Node and no pnpm on PATH. This set answers "what does
// `pnpm -r run <script>` iterate over", which is a question only pnpm can
// answer: the membership comes from pnpm-workspace.yaml globs, and
// reimplementing glob semantics here would put a second, subtly different
// answer in the repository.
//
// So pnpm is asked. Same principle as letting git enumerate the generated
// artifacts rather than keeping a list beside them — the tool that owns the
// concept is the one that reports it. Callers must run from the repository
// root, with dependencies installed.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Every project pnpm treats as part of this workspace, including the root.
 *
 * The root is deliberately included: it owns source of its own (scripts/,
 * config files) and is as capable of losing lint coverage as any package.
 *
 * @returns {Array<{ name: string, path: string, manifest: object }>}
 *   `path` is relative to the repository root ('.' for the root project),
 *   sorted so callers get a stable, diff-friendly order.
 */
export function workspaceProjects() {
  const stdout = execFileSync('pnpm', ['list', '--recursive', '--depth', '-1', '--json'], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })

  const root = process.cwd()

  return JSON.parse(stdout)
    .map((project) => {
      const path = relative(root, project.path) || '.'
      return {
        name: project.name,
        path,
        manifest: JSON.parse(readFileSync(join(path, 'package.json'), 'utf8')),
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
}
