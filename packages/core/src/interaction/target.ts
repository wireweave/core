/**
 * What a `navigate` target names.
 *
 * The DSL documents `navigate` as pointing at "a URL or a page", so every target
 * is read one of two ways, and the reading decides everything downstream. A page
 * name resolves against the document and travels to the consumer as declared
 * intent; a URL is a destination the browser already knows how to reach, so it
 * belongs in the anchor and the document graph has nothing to say about it.
 *
 * The renderer and the transition extractor must read a target identically — the
 * renderer decides whether the value belongs in `href`, the extractor decides
 * whether an unmatched value is an authoring mistake. Two copies of that rule
 * would drift, and the moment they disagree one of the two starts calling
 * correct authoring a defect. So the rule lives here, below both, and neither
 * layer has to depend on the other to reach it.
 */

/**
 * Whether a `navigate` target is a URL rather than the name of a page.
 *
 * A URL is recognised by shape, not by resolving it:
 * - a path or protocol-relative reference — `/reset`, `//cdn.example.com/x`
 * - an in-page fragment or bare query — `#terms`, `?tab=2`
 * - anything opening with an RFC 3986 scheme — `https:`, `mailto:`, `tel:`
 *
 * A target containing whitespace is never a URL: a URL carrying a space is
 * invalid until the space is percent-encoded, whereas page titles are written
 * as prose and routinely contain spaces. Screening on that first is what keeps
 * an English heading like `"Note: draft"` from reading as a scheme.
 *
 * The remaining ambiguities are decided in favour of "page", because a page name
 * is the common case and the cost of the two mistakes is not symmetric: calling
 * a page a URL yields a link that goes nowhere, while calling a URL a page
 * yields an edge reported as unresolved — visible, not silent. So a
 * schemeless host (`www.example.com`) is a page name; authors write the scheme.
 */
export function isUrlTarget(target: string | undefined): target is string {
  if (target === undefined) return false
  const value = target.trim()
  if (value.length === 0) return false
  if (/\s/.test(value)) return false
  if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) return true
  return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)
}
