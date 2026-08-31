/**
 * The single post-generation formatter for Core's tracked generated sources.
 *
 * The repository-level formatter intentionally ignores generated files, while
 * Core's package-local format gate checks them. Generators therefore own the
 * normalization at the point where their output is created, using the same
 * Prettier config and filepath resolution as the rest of the repository.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import prettier from 'prettier'

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Format generated source with the repository's canonical Prettier config.
 *
 * @param {string} source
 * @param {string} filePath Absolute output path, used for config and parser resolution.
 * @returns {Promise<string>}
 */
export async function formatGeneratedSource(source, filePath) {
  const config = await prettier.resolveConfig(filePath)
  return prettier.format(source, { ...config, filepath: filePath })
}

/**
 * Format one generated file in place.
 *
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export async function formatGeneratedFile(filePath) {
  const absolutePath = resolve(PACKAGE_ROOT, filePath)
  const formatted = await formatGeneratedSource(readFileSync(absolutePath, 'utf8'), absolutePath)
  writeFileSync(absolutePath, formatted)
}

async function main() {
  const [filePath] = process.argv.slice(2)
  if (filePath === undefined || process.argv.length !== 3) {
    throw new Error('usage: node scripts/format-generated.mjs <package-relative-file>')
  }
  await formatGeneratedFile(filePath)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[format-generated] ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  })
}
