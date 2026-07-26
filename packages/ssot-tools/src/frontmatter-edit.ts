// Targeted frontmatter text edits for tag/version stamping.
//
// auto-tag and fill-version rewrite only the `tags:` block (and optionally insert one scalar), and
// must preserve every other frontmatter line verbatim — including axis comments and hand-authored
// formatting. ssot-core's `serializeNode` would reflow the whole block and drop comments, so these
// stampers use a line-level replacement instead (stated choice; see each module's header).

/** The `--- ... ---` frontmatter block, capturing (open, inner, close). */
const FM_RE = /^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/

/** Serialize a tag set as a deterministically-sorted block list. */
function serializeTags(tags: readonly string[]): string {
  const sorted = [...tags].sort()
  return 'tags:\n' + sorted.map((t) => `  - ${t}`).join('\n')
}

/**
 * Rewrite the inner frontmatter text: drop the existing top-level `tags:` block (inline flow or
 * block list), keep every other line, then append any `prependScalars` and the merged tags block.
 */
function rewriteFrontmatterTags(
  fmRaw: string,
  mergedTags: readonly string[],
  prependScalars: readonly string[] = [],
): string {
  const lines = fmRaw.split('\n')
  const kept: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (/^tags\s*:/.test(line)) {
      const after = line.slice(line.indexOf(':') + 1).trim()
      i++
      if (after === '') {
        while (i < lines.length && /^\s+-\s/.test(lines[i] ?? '')) i++
      }
      continue
    }
    kept.push(line)
    i++
  }
  while (kept.length && (kept[kept.length - 1] ?? '').trim() === '') kept.pop()
  for (const s of prependScalars) kept.push(s)
  kept.push(serializeTags(mergedTags))
  return kept.join('\n')
}

/**
 * Apply a frontmatter-inner rewrite to a full document. Returns the new content, or null when the
 * document has no frontmatter block to edit.
 */
export function applyFrontmatterRewrite(
  content: string,
  mergedTags: readonly string[],
  prependScalars: readonly string[] = [],
): string | null {
  const m = content.match(FM_RE)
  if (!m) return null
  const inner = rewriteFrontmatterTags(m[2] ?? '', mergedTags, prependScalars)
  return content.replace(FM_RE, `${m[1] ?? ''}${inner}${m[3] ?? ''}`)
}
