/**
 * Generate the icon dataset from the installed lucide package.
 *
 * This generator must stay wired to a script someone runs (`build:icons`, and
 * `check:icons-sync` in `pretest`). A generator that is declared but never
 * called cannot corrupt anything, which is exactly why it rots unnoticed: the
 * file it claims to own drifts under hand edits while still carrying a "do not
 * edit manually" header, and the damage lands on whoever finally wires it up.
 * If this is ever unhooked, delete it rather than leaving it declared.
 *
 * Three properties make running it on every build safe:
 *
 *   1. It imports each icon module and takes its default export, which is
 *      lucide's published contract (`export { X as default }`). Recovering the
 *      data by matching source text instead — e.g. a non-greedy capture up to
 *      the first `];` — truncates any icon whose data contains that sequence,
 *      and turns a change in lucide's dist formatting into wrong artwork rather
 *      than an error. Importing has no format to break against.
 *
 *   2. Keys are sorted. `readdirSync` order is filesystem dependent — it
 *      differs from a plain sort at 1042 of 1666 positions on this machine — so
 *      emitting in directory order makes committed output and CI output
 *      disagree for reasons having nothing to do with the data. Sorting is what
 *      lets `--check` mean something.
 *
 *   3. `--check` exists, so the committed dataset drifting from the installed
 *      lucide version is observable rather than merely possible.
 *
 * Local additions are NOT written here; they come from icon-overrides.mjs, so
 * regeneration cannot drop them. See that file for why.
 *
 * Usage: node scripts/generate-icons.mjs [--check]
 *   --check  exit non-zero if the committed dataset is stale (no write)
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import prettier from 'prettier'

import { RENAMED_GLYPHS } from './icon-overrides.mjs'

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const LUCIDE_ICONS_DIR = join(PACKAGE_ROOT, 'node_modules/lucide/dist/esm/icons')
export const OUTPUT_PATH = join(PACKAGE_ROOT, 'src/icons/lucide-icons.generated.ts')

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`[generate-icons] ${message}`)
  process.exit(1)
}

/**
 * Read every icon lucide ships, keyed by its module name.
 *
 * The key is the filename rather than the exported identifier because the
 * filename is already kebab-case and is what authors write in `.wf` source;
 * deriving it from the PascalCase export would mean re-implementing lucide's
 * own casing rules and getting them subtly wrong for names like `a-arrow-down`.
 *
 * @returns {Promise<Record<string, unknown>>}
 */
async function readVendorIcons() {
  let files
  try {
    files = readdirSync(LUCIDE_ICONS_DIR)
  } catch {
    fail(
      `cannot read ${relative(PACKAGE_ROOT, LUCIDE_ICONS_DIR)}.\n` +
        'The `lucide` devDependency provides it -- run `pnpm install`.',
    )
  }

  const names = files.filter((file) => file.endsWith('.js')).map((file) => file.slice(0, -3))
  if (names.length === 0) fail('lucide shipped no icon modules; refusing to emit an empty dataset')

  /** @type {Record<string, unknown>} */
  const icons = {}
  for (const name of names.sort()) {
    // A dynamic specifier types the namespace `any`, so it is contained as
    // `unknown` and narrowed explicitly rather than trusted. lucide's published
    // contract is `export { X as default }`; anything else fails loudly here
    // instead of emitting a broken glyph.
    /** @type {unknown} */
    const module = await import(pathToFileURL(join(LUCIDE_ICONS_DIR, `${name}.js`)).href)
    if (typeof module !== 'object' || module === null || !('default' in module))
      fail(`lucide icon "${name}" has no default export`)
    const data = module.default
    if (!Array.isArray(data) || data.length === 0)
      fail(`lucide icon "${name}" has no default-exported element array`)
    icons[name] = data
  }
  return icons
}

/**
 * Add the retained names from icon-overrides.mjs, resolved against the vendor
 * data so no artwork is stored twice.
 *
 * @param {Record<string, unknown>} vendor
 * @returns {Record<string, unknown>}
 */
function applyOverrides(vendor) {
  const merged = { ...vendor }
  for (const [name, target] of Object.entries(RENAMED_GLYPHS)) {
    if (name in vendor)
      fail(
        `icon-overrides.mjs retains "${name}", but lucide now ships it. ` +
          'Remove the entry -- the vendor data should win.',
      )
    if (!(target in vendor))
      fail(
        `icon-overrides.mjs maps "${name}" to "${target}", which lucide no longer ships. ` +
          "Point it at the glyph's current name.",
      )
    merged[name] = vendor[target]
  }
  return Object.fromEntries(
    Object.keys(merged)
      .sort()
      .map((name) => [name, merged[name]]),
  )
}

/**
 * @param {Record<string, unknown>} icons
 * @returns {Promise<string>}
 */
async function renderModule(icons) {
  const source = `/**
 * GENERATED FILE -- DO NOT EDIT.
 *
 * The icon dataset, generated from the installed \`lucide\` package by
 * \`scripts/generate-icons.mjs\` (\`pnpm build:icons\`). Names kept beyond what
 * lucide ships come from \`scripts/icon-overrides.mjs\`; add them there, never
 * here, or the next regeneration deletes them.
 *
 * Total icons: ${Object.keys(icons).length}
 *
 * The lookup, alias and rendering code that consumes this lives in
 * \`./lucide-icons.ts\` and is hand-written.
 *
 * @license ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023
 * as part of Feather (MIT). All other copyright (c) for Lucide are held
 * by Lucide Contributors 2025.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * @see https://lucide.dev
 */

export type IconElement = [string, Record<string, string>]
export type IconData = IconElement[]

export const lucideIcons: Record<string, IconData> = ${JSON.stringify(icons, null, 2)}
`

  // Formatted with the repo's own prettier config rather than emitted
  // pre-formatted. Two reasons: the pre-commit hook would reformat it anyway
  // and leave --check permanently red, and scripts/extract-icon-names.mjs
  // parses this file line by line expecting prettier's exact key style.
  const config = await prettier.resolveConfig(OUTPUT_PATH)
  return prettier.format(source, { ...config, filepath: OUTPUT_PATH })
}

async function main() {
  const check = process.argv.includes('--check')
  const icons = applyOverrides(await readVendorIcons())
  const generated = await renderModule(icons)
  const relativeOutput = relative(PACKAGE_ROOT, OUTPUT_PATH)

  if (check) {
    let committed
    try {
      committed = readFileSync(OUTPUT_PATH, 'utf8')
    } catch {
      fail(`${relativeOutput} is missing -- run \`pnpm build:icons\``)
    }
    if (committed !== generated) fail(`${relativeOutput} is stale -- run \`pnpm build:icons\``)
    return
  }

  writeFileSync(OUTPUT_PATH, generated)
  console.log(`[generate-icons] wrote ${relativeOutput} (${Object.keys(icons).length} icons)`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
