/**
 * Extract the icon-name vocabulary from the icon dataset.
 *
 * `src/icons/lucide-icons.generated.ts` is the single source of truth for which
 * icons this build can draw: `getIconData(name)` looks the name up in it, and a
 * name it does not hold renders the unknown-icon placeholder. So "which icon
 * names are legal" has to be answered from that file and nowhere else — a
 * second, hand-kept list would let the two drift and make the spec promise
 * glyphs the renderer cannot produce.
 *
 * The dataset used to share a file with the lookup and rendering code; the
 * record moved to its own generated module when the two were split. Names that
 * resolve only through `iconAliases` in lucide-icons.ts are deliberately not
 * picked up — they render, but they are a compatibility layer, not vocabulary
 * the spec advertises.
 *
 * The names are extracted into their own module rather than read from the
 * dataset at runtime. `src/spec` is the vocabulary layer — what may be written
 * and what values are legal — and it is bundled as its own entry point
 * (`dist/spec.js`) for editor tooling that never draws anything. Importing the
 * dataset there would pull ~660 KB of SVG path geometry into that entry to
 * learn 1.6k strings, and would point the description of the language at the
 * machinery that executes it. The names are the vocabulary; the paths are not.
 *
 * Usage: node scripts/extract-icon-names.mjs [--check]
 *   --check  exit non-zero if the committed module is stale (no write)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const ICONS_PATH = join(PACKAGE_ROOT, 'src/icons/lucide-icons.generated.ts')
export const OUTPUT_PATH = join(PACKAGE_ROOT, 'src/spec/icon-names.generated.ts')

/** The line that opens the icon record. */
const RECORD_OPEN_RE = /^export const lucideIcons: Record<string, IconData> = \{$/
/** The line that closes it: a lone `}` at column 0. */
const RECORD_CLOSE_RE = /^\}$/
/**
 * A key of the record: one indent, the name either quoted or bare depending on
 * whether it is a valid identifier, then the array of path elements.
 */
const ICON_KEY_RE = /^ {2}(?:'((?:[^'\\]|\\.)*)'|([A-Za-z_$][A-Za-z0-9_$]*)): \[$/

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  throw new Error(`[extract-icon-names] ${message}`)
}

/**
 * Extract every icon name from the dataset source, in file order.
 *
 * Scanning stays bounded to the record literal. That mattered when the lookup
 * and rendering functions shared this file, since their bodies contain
 * indented lines the key pattern would otherwise match; the generated module
 * holds only the record now, so the bound is belt-and-braces rather than
 * load-bearing.
 *
 * @param {string} source
 * @returns {string[]}
 */
export function extractIconNames(source) {
  const lines = source.split('\n')
  const start = lines.findIndex((line) => RECORD_OPEN_RE.test(line))
  if (start === -1) fail('no `lucideIcons` record declaration found')

  const end = lines.findIndex((line, index) => index > start && RECORD_CLOSE_RE.test(line))
  if (end === -1) fail('the `lucideIcons` record is never closed')

  /** @type {string[]} */
  const names = []
  for (const line of lines.slice(start + 1, end)) {
    const key = ICON_KEY_RE.exec(line)
    if (key) names.push(key[1] ?? key[2])
  }

  if (names.length === 0) fail('the `lucideIcons` record holds no icons')
  const duplicated = names.filter((name, index) => names.indexOf(name) !== index)
  if (duplicated.length > 0) fail(`the dataset repeats icon names: ${duplicated.join(', ')}`)

  return names
}

/**
 * Render the generated TypeScript module for a name list.
 *
 * The list is typed `readonly string[]` rather than a `as const` tuple on
 * purpose: a 1.6k-member literal union costs every consumer of `spec` real
 * typecheck time, and buys nothing that `AttributeSpec.values` — itself
 * `readonly string[]` — could carry.
 *
 * @param {string[]} names
 * @returns {string}
 */
export function renderModule(names) {
  const iconsRef = relative(PACKAGE_ROOT, ICONS_PATH)
  const scriptRef = 'scripts/extract-icon-names.mjs'

  return `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Derived from \`${iconsRef}\` by \`${scriptRef}\`
 * (\`pnpm build:icon-names\`). The dataset is the single source of truth for
 * which glyphs exist; regenerate from it, never edit this file.
 */

/**
 * Every icon name the renderer can draw.
 *
 * Read this through \`attributeFor(element, attribute)\`, which is the only
 * consumer that knows an icon-valued attribute from any other string-valued
 * one. The flat attribute registry deliberately does not carry these values —
 * see \`attribute-overrides.ts\`.
 */
export const LUCIDE_ICON_NAMES: readonly string[] = [
${names.map((name) => `  '${name}',`).join('\n')}
]
`
}

function main() {
  const check = process.argv.includes('--check')
  const generated = renderModule(extractIconNames(readFileSync(ICONS_PATH, 'utf8')))

  if (check) {
    const committed = readFileSync(OUTPUT_PATH, 'utf8')
    if (committed !== generated) {
      console.error(
        `[extract-icon-names] ${relative(PACKAGE_ROOT, OUTPUT_PATH)} is stale — run \`pnpm build:icon-names\``,
      )
      process.exit(1)
    }
    return
  }

  writeFileSync(OUTPUT_PATH, generated)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
