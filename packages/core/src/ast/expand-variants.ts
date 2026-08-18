/**
 * `page … variants=[a, b, c]` expansion — one page turned into the screens it denotes.
 *
 * ## What a variant is, and why it is not a state
 *
 * A wireframe usually has to show a screen in several conditions: loading,
 * empty, populated, failed. The language already has `states` for that, and it
 * is the wrong tool: a `state` is a runtime value the site runtime flips and
 * `visibleWhen` guards read, so *something in the wireframe has to flip it*.
 * That something is a control the product does not have — a reviewer opening
 * the artifact sees state-switching buttons among the real UI and cannot tell
 * which is which. It also produces one board, so the conditions are only
 * visible one at a time, and any block common to two conditions is written
 * twice because a guard has no disjunction.
 *
 * A variant moves the same information from a toggle inside the screen to an
 * axis of the document: `variants=[loading, empty, ready]` draws the page three
 * times, side by side, with no switching UI in any of them. The artifact
 * becomes the sheet of state-by-state boards a reviewer reads top to bottom,
 * and the common blocks are shared because they are one authored body.
 *
 * ## Why this is a document pass, like `repeat`
 *
 * For the reason spelled out at length in `expand-repeats.ts`: the renderer
 * builds `buildAnchorPathMap(document)` up front and keys it by **node object
 * identity**. Two variant boards sharing one child tree would be two boards the
 * map has seen once, so the second would render without `data-wf-path` and the
 * anchor count would stop matching the index. Every variant is therefore a
 * fresh deep clone, and `loc` is deliberately shared: all three boards really do
 * originate at one span of source.
 *
 * Doing it here rather than in each renderer is also what keeps the surfaces
 * agreeing. `render`'s canvas counts pages and `renderSite` builds a screen
 * model; if each expanded on its own, a variant would be a canvas board and a
 * site screen by two separate rules that could drift. They both run this pass
 * and then count what it produced.
 *
 * And, as with `repeat`, this is deliberately **not** in the parser: the AST
 * keeps `variants` so the printer writes it back out, and expanding at parse
 * time would break the `parse(print(parse(src)))` round-trip law the corpus
 * harness pins.
 */

import { filterUnscopedPages, filterVariantScope } from './filter-variant-scope'

import type { PageNode, WireframeDocument } from './types'

/**
 * Deep-clone a node so each variant board is a distinct object identity.
 *
 * `loc` is immutable positional data shared by every copy on purpose — see the
 * identity note above.
 */
function cloneNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneNode)
  if (value === null || typeof value !== 'object') return value
  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(source)) {
    result[key] = key === 'loc' ? item : cloneNode(item)
  }
  return result
}

/**
 * The variant names a page declares, trimmed, blanks and duplicates dropped.
 *
 * A blank or repeated name is dropped rather than drawn: it would produce a
 * second board at the same address as the first, and the first-wins name
 * resolution would then hide it — a board on the canvas that nothing can
 * navigate to and no reader can tell apart from its twin.
 */
function variantNames(page: PageNode): string[] {
  const declared = page.variants
  if (!Array.isArray(declared)) return []
  const seen = new Set<string>()
  const names: string[] = []
  for (const raw of declared) {
    if (typeof raw !== 'string') continue
    const name = raw.trim()
    if (name.length === 0 || seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

/** Does this document declare any variant that expansion would materialise? */
function hasVariants(document: WireframeDocument): boolean {
  return document.children.some((child) => child.type === 'Page' && variantNames(child).length > 0)
}

/**
 * Replace every page declaring `variants=` with one page per variant.
 *
 * Each produced page carries `variant` naming which one it is and no longer
 * carries `variants`, so the result declares none and a second application is a
 * no-op. A document with no variants is returned as-is, identity included, so
 * the common case costs one scan and no allocation — the property every
 * existing document relies on to render exactly as it did before.
 *
 * @param document - Parsed wireframe document
 * @returns The document with all variant-bearing pages expanded
 * @public
 * @example
 * `const drawable = expandVariants(parse(source))`
 */
export function expandVariants(document: WireframeDocument): WireframeDocument {
  // A document with no `variants=` still has boards — unnamed ones — and an
  // element scoped to a name none of them declares is not drawn on them. That
  // filtering happens here rather than in a pass of its own so that `when` has
  // exactly one implementation and one place it can be reasoned about, whether
  // or not the page it sits on declares variants. Identity-preserving when
  // nothing is scoped, so the untouched-document property still holds.
  if (!hasVariants(document)) return filterUnscopedPages(document)
  type TopLevel = WireframeDocument['children'][number]
  return {
    ...document,
    children: document.children.flatMap((child): TopLevel[] => {
      if (child.type !== 'Page') return [child]
      const names = variantNames(child)
      // A page declaring no variants is an unnamed board, and shares the
      // document with pages that do. It is filtered on the same rule as the
      // rest rather than skipped — otherwise `when` would mean one thing in a
      // document that happens to contain a variant page and another in a
      // document that does not.
      if (names.length === 0) {
        const filtered = filterVariantScope(child.children, undefined)
        return [filtered === child.children ? child : { ...child, children: filtered }]
      }
      return names.map((variant, position) => {
        const clone = cloneNode(child) as PageNode
        delete clone.variants
        clone.variant = variant
        // `states` is a *document*-scoped declaration that a page contributes,
        // not a per-board property, so it must not be contributed once per
        // board. Copying it onto all of them declares the same state N times
        // and `collectStates` reports N-1 duplicates — a diagnostic about a
        // document the author did not write, since they declared it once. The
        // first board keeps the declaration and the rest drop it, which leaves
        // exactly one contribution, and the state stays shared because its
        // scope was never the page to begin with.
        if (position > 0) delete clone.states
        // Filtered here, where the board's name is in hand and the tree is
        // already a private clone — so dropping a node costs nothing shared and
        // no later pass has to rediscover which board it is looking at.
        clone.children = filterVariantScope(clone.children, variant)
        return clone
      })
    }),
  }
}
