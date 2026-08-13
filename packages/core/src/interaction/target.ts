/**
 * Whether a `navigate` target is a URL rather than the name of a page.
 *
 * The renderer and transition extractor share this predicate so an outbound
 * target cannot be rendered as a URL while simultaneously being reported as a
 * broken page reference. Whitespace-bearing values are treated as page names;
 * valid URLs must encode spaces, while page titles commonly contain them.
 */
export function isUrlTarget(target: string | undefined): target is string {
  if (target === undefined) return false
  const value = target.trim()
  if (value.length === 0 || /\s/.test(value)) return false
  if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) return true
  return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)
}
