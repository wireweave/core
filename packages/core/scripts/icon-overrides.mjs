/**
 * Icon names this build keeps beyond the ones lucide currently ships.
 *
 * This file is hand-authored and is an INPUT to scripts/generate-icons.mjs.
 * That is the whole point: the dataset it feeds is regenerated from lucide, so
 * anything recorded only in the dataset is destroyed the next time the
 * generator runs. A local addition survives regeneration only by being stated
 * here.
 *
 * That is not hypothetical. `circle-help` was added directly to the generated
 * dataset in dd7de8e (2026-03-04) as a 22-line insertion, and from that moment
 * running the generator would have deleted it without a word.
 */

/**
 * Names lucide has renamed, kept pointing at the glyph's current name.
 *
 * The generator copies the CURRENT vendor geometry to the old name, so these
 * are aliases resolved at generation time, not a second copy of the artwork
 * that can drift from upstream. If lucide redraws the glyph, the old name
 * follows on the next regeneration. If lucide deletes the target outright, the
 * generator fails loudly rather than silently emitting a dead name.
 *
 * These stay in the dataset rather than moving to `iconAliases` in
 * lucide-icons.ts because dataset keys are what `LUCIDE_ICON_NAMES` is derived
 * from — see scripts/extract-icon-names.mjs. A name demoted to `iconAliases`
 * keeps rendering but disappears from the vocabulary the spec offers authors,
 * which for a name already published is a silent narrowing.
 *
 * @type {Record<string, string>}
 */
export const RENAMED_GLYPHS = {
  // lucide 0.562.0 ships this glyph as `circle-question-mark`. `circle-help`
  // was its name in earlier lucide releases and is the spelling already
  // published in LUCIDE_ICON_NAMES, so it is retained. Verified identical
  // geometry: the two names render the same three elements.
  'circle-help': 'circle-question-mark',
}
