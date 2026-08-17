/**
 * Icon lookup and SVG rendering.
 *
 * HAND-WRITTEN. The dataset this reads is generated -- see
 * `./lucide-icons.generated.ts` and `scripts/generate-icons.mjs`. The two were
 * a single file until the split: it carried an "Auto-generated ... Do not edit
 * manually" header while the alias table, the alias branches in `getIconData`,
 * the `renderIconSvg` signature and all of `renderUnknownIconSvg` below were
 * added by hand, so running the generator would have destroyed working code
 * that four renderers import. Data and code now have one owner each.
 *
 * The dataset's exports are re-exported here so `src/index.ts` can keep
 * re-exporting this module and the public surface is unchanged.
 */

import type { IconData } from './lucide-icons.generated'
import { lucideIcons } from './lucide-icons.generated'

export type { IconElement, IconData } from './lucide-icons.generated'
export { lucideIcons } from './lucide-icons.generated'

/**
 * Names that are not dataset keys but should still resolve.
 *
 * Deliberately not exported, and deliberately not part of the dataset: these
 * are a compatibility layer over names lucide has retired or that authors
 * reach for out of habit, while `LUCIDE_ICON_NAMES` -- the vocabulary the spec
 * offers -- is derived from dataset keys only. So an entry here keeps
 * rendering without claiming to be a name the spec advertises.
 */
const iconAliases: Record<string, string> = {
  home: 'house',
  'plus-square': 'square-plus',
  'minus-square': 'square-minus',
  'x-square': 'square-x',
  'check-square': 'square-check',
  edit: 'pencil',
  'edit-2': 'pencil',
  'edit-3': 'pencil-line',
  trash: 'trash-2',
  delete: 'trash-2',
  close: 'x',
  menu: 'menu',
  hamburger: 'menu',
  // Lucide renamed the overflow/kebab-menu glyphs to `ellipsis` /
  // `ellipsis-vertical`; map the legacy `more-*` names (and the `dots-*`
  // shorthands) onto the real keys so none of them dead-end.
  'more-horizontal': 'ellipsis',
  'more-vertical': 'ellipsis-vertical',
  dots: 'ellipsis',
  'dots-vertical': 'ellipsis-vertical',
  cog: 'settings',
  gear: 'settings',
  // `help-circle` is the Feather-era spelling, and it is what this repo's own
  // examples use -- packages/language-data/src/components.ts documents
  // `tooltip ... { icon "help-circle" }` and the discord-server corpus file
  // uses it twice -- but it has never been a dataset key, so every one of them
  // rendered the unknown-icon placeholder. lucide's current name for the glyph
  // is `circle-question-mark`.
  'help-circle': 'circle-question-mark',
}

/**
 * Get icon data by name.
 *
 * Resolution order is exact key, then alias, then camelCase folded to
 * kebab-case, then that folded name through the aliases. A name that survives
 * all four is not drawable, and the caller renders the placeholder below.
 */
export function getIconData(name: string): IconData | undefined {
  // Try exact match first
  if (lucideIcons[name]) {
    return lucideIcons[name]
  }

  // Try alias lookup
  if (iconAliases[name] && lucideIcons[iconAliases[name]]) {
    return lucideIcons[iconAliases[name]]
  }

  // Try converting camelCase to kebab-case
  const kebabName = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  if (lucideIcons[kebabName]) {
    return lucideIcons[kebabName]
  }

  // Try alias with kebab-case
  if (iconAliases[kebabName] && lucideIcons[iconAliases[kebabName]]) {
    return lucideIcons[iconAliases[kebabName]]
  }

  // Try converting kebab-case to exact icon name format
  return undefined
}

/**
 * Render icon data to SVG string
 */
export function renderIconSvg(
  data: IconData,
  _size: number = 24, // size is now controlled by CSS, this param is kept for API compatibility
  strokeWidth: number = 2,
  className: string = '',
  styleAttr: string = '', // Optional inline style for custom px sizes
): string {
  const elements = data
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
      return `<${tag} ${attrStr} />`
    })
    .join('')

  // Size is controlled by CSS classes (.wf-icon-xs, .wf-icon-sm, etc.)
  // or inline style for custom px sizes
  // This ensures CSS rules can override the size reliably
  // (especially important in VSCode markdown preview's foreignObject environment)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}"${styleAttr}>${elements}</svg>`
}

/**
 * Render the canonical "unknown icon" placeholder SVG — a dashed circle with a
 * `?` glyph. Shared by every renderer (icon node, button, input) so an
 * unresolved icon name always produces the SAME visual placeholder and never
 * leaks the raw DSL name as literal text. Callers add a
 * `title="Unknown icon: <name>"` on the wrapping element for hover context.
 */
export function renderUnknownIconSvg(
  className: string = '',
  size: number = 24,
  styleAttr: string = '',
): string {
  return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"${styleAttr}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" fill="none" opacity="0.5"/>
      <text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">?</text>
    </svg>`
}
