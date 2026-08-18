/**
 * `when=` filtering — dropping the elements a board does not draw.
 *
 * ## What `when` says, and why it is not a guard
 *
 * `visibleWhen` already answers "should this be on screen right now": the
 * element is rendered onto every board, carries `data-wf-visible-when`, and the
 * site runtime shows and hides it as state changes. `when` answers a different
 * question — *which boards is this element part of at all* — and it answers it
 * before anything renders. An element scoped to `loading` is not hidden on the
 * `ready` board; it is absent from it, so no state change can bring it back and
 * nothing in that board's markup refers to it.
 *
 * The two are therefore orthogonal, not alternatives, and this pass is careful
 * to leave guards alone: it deletes `when` from the nodes it keeps and touches
 * no other property, so `when=ready visibleWhen={…}` survives as a guard on the
 * ready board. Collapsing them would lose the case the feature exists for.
 *
 * ## Why disjunction is the point
 *
 * A guard compares one state to one value, so a block belonging to two
 * conditions could only be written twice. That is not a stylistic cost: the two
 * copies are edited separately and drift, and a reviewer reading the sheet
 * cannot tell whether a difference between them is intentional. `when=[loading,
 * empty]` is the same block, authored once, drawn on both boards — the header
 * shared by three states is one header, and it stays one.
 *
 * ## Why it runs inside variant expansion
 *
 * Filtering needs to know which board it is filtering *for*, and that fact
 * exists only after `expandVariants` has turned one authored page into one page
 * per name and stamped each with `page.variant`. Running as a separate pass
 * afterwards would have to rediscover the same association by walking the
 * document again; running before expansion would have no board to ask about.
 * So the board is filtered at the moment it is cloned, while the name is in
 * hand — see `expand-variants.ts`.
 *
 * ## The rule, stated once
 *
 * An element is drawn on a board **iff its `when` set contains that board's
 * variant**. Everything else follows from that one sentence rather than from a
 * list of cases:
 *
 * - No `when` at all → drawn on every board. This is what keeps every document
 *   written before the attribute existed rendering byte-for-byte as it did.
 * - A board with no variant (a page that declared no `variants=`) matches no
 *   name, so *any* `when` filters the element out. That is the honest reading
 *   rather than a convenient one: the element declares membership in a board
 *   this page never declared, and drawing it anyway would make `when` mean
 *   "sometimes nothing", which is the silently-dropped-value failure the spec
 *   gates exist to prevent. `validate()` reports the same document, so the
 *   author is told rather than left to discover an empty board.
 * - A parent that is filtered out takes its children with it, whatever they
 *   say. A child scoped to `ready` inside a parent scoped to `loading` cannot
 *   be drawn on either board — there is no board where both are present — and
 *   the contradiction is reported by `validate()` rather than resolved here.
 */

import type { AnyNode, WireframeDocument } from './types'

/**
 * The variant names an element declares, trimmed, blanks and duplicates dropped.
 *
 * Both spellings collapse to the same set, because `when=loading` and
 * `when=[loading]` denote the same membership and nothing downstream should
 * have to know which the author typed.
 *
 * A `when` that is present but names nothing — `when=[]`, or a blank string —
 * yields an empty set, which matches no board. It is deliberately not treated
 * as "no `when`": the author wrote the attribute, and answering an empty list
 * with "every board" would make the emptiest possible scope the widest one.
 */
export function variantScope(node: AnyNode): string[] | undefined {
  const declared = (node as { when?: unknown }).when
  if (declared === undefined) return undefined
  const raw = Array.isArray(declared) ? declared : [declared]
  const seen = new Set<string>()
  const names: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const name = item.trim()
    if (name.length === 0 || seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

/**
 * The `children` array of anything that has one, as a list of unknowns.
 *
 * Typed as `unknown[]` rather than `AnyNode[]` because a child list is walked
 * before it is known to hold nodes — a `ComponentUse` fill and a block node both
 * arrive here — and narrowing each element at the point of use is what keeps the
 * traversal from asserting a shape it has not checked.
 */
function childList(value: unknown): readonly unknown[] | undefined {
  const children = (value as { children?: readonly unknown[] } | undefined)?.children
  return Array.isArray(children) ? (children as readonly unknown[]) : undefined
}

/** The element, if it is a node; `undefined` for anything else in a child list. */
function asNode(value: unknown): AnyNode | undefined {
  return value !== null && typeof value === 'object' && 'type' in value
    ? (value as AnyNode)
    : undefined
}

/** Filter one child list for `variant`, keeping non-node entries as they are. */
function filterChildList(children: readonly unknown[], variant: string | undefined): unknown[] {
  return children.flatMap((child) => {
    const node = asNode(child)
    if (node === undefined) return [child]
    const kept = filterNode(node, variant)
    return kept === undefined ? [] : [kept]
  })
}

/** Does any node in this subtree carry a `when`? */
function containsScope(node: AnyNode): boolean {
  if ((node as { when?: unknown }).when !== undefined) return true
  for (const child of childList(node) ?? []) {
    const nested = asNode(child)
    if (nested !== undefined && containsScope(nested)) return true
  }
  const fills = (node as { fills?: readonly unknown[] }).fills
  if (Array.isArray(fills)) {
    for (const fill of fills as readonly unknown[]) {
      for (const child of childList(fill) ?? []) {
        const nested = asNode(child)
        if (nested !== undefined && containsScope(nested)) return true
      }
    }
  }
  return false
}

/**
 * Keep this node on `variant`'s board, or drop it.
 *
 * Returns the node itself when nothing in the subtree is scoped, so an unscoped
 * document is never rebuilt — the identity-preserving property `expandVariants`
 * and `expandRepeats` both rely on to leave existing documents untouched.
 */
function filterNode(node: AnyNode, variant: string | undefined): AnyNode | undefined {
  const scope = variantScope(node)
  if (scope !== undefined) {
    // The rule, applied. `undefined` variant is a board with no name, which no
    // scope can contain.
    if (variant === undefined || !scope.includes(variant)) return undefined
  }
  const nested = containsScope(node)
  if (scope === undefined && !nested) return node

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node as unknown as Record<string, unknown>)) {
    // `when` has been consumed by this pass. Leaving it on the kept node would
    // let a second application filter again — harmless today, but it would also
    // print back out of an expanded document as a scope on a board that is
    // already the board it names.
    if (key === 'when') continue
    result[key] = value
  }
  const children = childList(node)
  if (children !== undefined) {
    result.children = filterChildList(children, variant)
  }
  const fills = (node as { fills?: readonly unknown[] }).fills
  if (Array.isArray(fills)) {
    result.fills = (fills as readonly unknown[]).map((fill) => {
      const fillChildren = childList(fill)
      if (fillChildren === undefined) return fill
      return {
        ...(fill as Record<string, unknown>),
        children: filterChildList(fillChildren, variant),
      }
    })
  }
  return result as unknown as AnyNode
}

/**
 * Drop from `children` everything not drawn on `variant`'s board.
 *
 * Identity-preserving: a subtree carrying no `when` anywhere is returned as the
 * same array, so a board of a document that uses no scoping costs one scan.
 *
 * @param children - The board's children, already cloned by variant expansion
 * @param variant - The board's variant name, or `undefined` for an unnamed board
 * @returns The children this board draws
 * @internal
 */
export function filterVariantScope(children: AnyNode[], variant: string | undefined): AnyNode[] {
  if (!children.some((child) => containsScope(child))) return children
  return children.flatMap((child) => {
    const kept = filterNode(child, variant)
    return kept === undefined ? [] : [kept]
  })
}

/**
 * Apply `when` filtering to every page of a document that expansion did not.
 *
 * Variant-bearing pages are filtered as they are cloned, inside
 * `expandVariants`, because that is where the board's name exists. This covers
 * the rest: a page that declared no `variants=` is still a board, an unnamed
 * one, and an element scoped to a name it never declared is not drawn on it.
 *
 * Layout and component definitions are filtered through the pages that use
 * them, not here — a definition has no board of its own, and scoping inside one
 * resolves against whichever page pulled it in.
 *
 * @param document - A document whose variant-bearing pages are already expanded
 * @returns The document with unnamed boards filtered
 * @internal
 */
export function filterUnscopedPages(document: WireframeDocument): WireframeDocument {
  type TopLevel = WireframeDocument['children'][number]
  let changed = false
  const children = document.children.map((child): TopLevel => {
    if (child.type !== 'Page' || child.variant !== undefined) return child
    const filtered = filterVariantScope(child.children, undefined)
    if (filtered === child.children) return child
    changed = true
    return { ...child, children: filtered }
  })
  return changed ? { ...document, children } : document
}
