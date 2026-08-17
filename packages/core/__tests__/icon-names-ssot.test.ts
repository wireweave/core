/**
 * The icon vocabulary has exactly one source: the icon dataset.
 *
 * `LUCIDE_ICON_NAMES` is what the spec promises an author may write; the keys of
 * `lucideIcons` are what `getIconData` can actually resolve. They are two files,
 * so they can disagree, and the disagreement is invisible at the point of use —
 * a name in the list but not the dataset renders the unknown-icon placeholder
 * while every checker says the source is fine.
 *
 * These tests close that gap from both ends. The generator is re-run in
 * `--check` mode to catch a stale committed list, and the list is compared
 * against the dataset *imported as a module*, not re-parsed as text. That second
 * check is what makes this a verification rather than a re-run: the generator
 * reads the dataset with a regex, so a regex that is subtly wrong would produce
 * a wrong list and then agree with itself. Loading the real object is the
 * independent path.
 */

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

import { lucideIcons } from '../src/icons/lucide-icons.js'
import { LUCIDE_ICON_NAMES } from '../src/spec/icon-names.generated.js'
import { extractIconNames } from '../scripts/extract-icon-names.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const extractScript = fileURLToPath(new URL('../scripts/extract-icon-names.mjs', import.meta.url))

describe('icon name SSoT', () => {
  it('the committed generated module is up to date with the dataset', () => {
    // Throws (non-zero exit) when `pnpm build:icon-names` has not been re-run.
    expect(() =>
      execFileSync('node', [extractScript, '--check'], { cwd: packageRoot, stdio: 'pipe' }),
    ).not.toThrow()
  })

  it('lists exactly the names the renderer can resolve, in dataset order', () => {
    expect(LUCIDE_ICON_NAMES).toEqual(Object.keys(lucideIcons))
  })

  it('holds a vocabulary at all', () => {
    // Guards the two assertions above against passing on an empty pair of sets:
    // `[]` equals `[]`, and a generator that extracted nothing would satisfy
    // both while the spec silently promised no icons exist.
    expect(LUCIDE_ICON_NAMES.length).toBeGreaterThan(1000)
  })

  it('rejects a dataset it cannot read rather than returning a short list', () => {
    // The failure mode a regex extractor has is silence: an emitter change that
    // stops matching yields fewer names, not an error. Everything the script
    // gives up on throws instead.
    expect(() => extractIconNames('export const somethingElse = {}\n')).toThrow(
      /no `lucideIcons` record declaration/,
    )
    expect(() =>
      extractIconNames('export const lucideIcons: Record<string, IconData> = {\n'),
    ).toThrow(/never closed/)
    expect(() =>
      extractIconNames('export const lucideIcons: Record<string, IconData> = {\n}\n'),
    ).toThrow(/holds no icons/)
    expect(() =>
      extractIconNames(
        "export const lucideIcons: Record<string, IconData> = {\n  'x': [\n  ],\n  'x': [\n  ],\n}\n",
      ),
    ).toThrow(/repeats icon names/)
  })

  it('reads both key spellings the dataset emitter produces', () => {
    // `'a-arrow-down'` needs quoting, `activity` does not, and the emitter picks
    // per name. An extractor that handled only one spelling would drop roughly
    // a third of the vocabulary and still look plausible.
    expect(
      extractIconNames(
        'export const lucideIcons: Record<string, IconData> = {\n' +
          "  'a-arrow-down': [\n  ],\n" +
          '  activity: [\n  ],\n' +
          '}\n',
      ),
    ).toEqual(['a-arrow-down', 'activity'])
  })
})
