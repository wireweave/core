/**
 * `repeat N { … }` expansion — folding syntax turned into the tree it denotes.
 *
 * ## Why this is a pass over the document, not a case in the renderer
 *
 * `repeat` has to disappear before anything *measures* the tree, not merely
 * before something draws it. The renderer builds its anchor index up front:
 * `HtmlRenderer.render` calls `buildAnchorPathMap(document)` before emitting a
 * byte, and that map is keyed by **node object identity**. A `Repeat` expanded
 * lazily inside `renderNode` would hand back copies the map has never seen, so
 * every copy but the first would render without a `data-wf-path` and the anchor
 * count would stop matching the index — the exact drift `anchor-path.ts` exists
 * to prevent. Expanding the whole document first means the map, the markup, the
 * DOM map and the UX rules all see one identical tree.
 *
 * It is equally deliberate that this is **not** in the parser. The AST keeps the
 * `Repeat` node so the printer can write `repeat 6` back out; expanding at parse
 * time would make `parse(print(parse(src)))` return six bodies where the source
 * had one, breaking the round-trip law the corpus harness pins.
 *
 * ## Identity and source anchors
 *
 * Every copy is a fresh deep clone, never a shared reference — see above for why
 * identity matters. Clones intentionally keep the `loc` of the body they came
 * from: all six copies of `repeat 6 { … }` really do originate at one span of
 * source, so pointing back at it is accurate, and it is the same thing component
 * expansion already does. Uniqueness comes from position instead — anchor paths
 * are child indices (`0.2.1`), so the copies land at distinct sibling indices
 * automatically and no two share a path.
 */

import type { AnyNode, RepeatNode, WireframeDocument } from './types'

/**
 * Total node budget for one expansion.
 *
 * Nesting multiplies — `repeat 100 { repeat 100 { … } }` is ten thousand bodies
 * — so a per-`repeat` cap on `N` would not bound the result. The budget is
 * therefore on the **expanded total**, which is the quantity that actually costs
 * anything, and it is checked as the tree is built so a runaway document stops
 * early instead of being materialised and then rejected.
 *
 * The number is the page-complexity ceiling `ux-rules` already applies
 * (`MAX_PAGE_ELEMENTS`, 50) times ten. Tying it to that constant rather than
 * inventing a figure keeps one notion of "too big for a wireframe" in the
 * codebase; the multiplier is headroom, so that a document merely worth warning
 * about still renders — `tooManyPageElements` reports at 50 and this refuses at
 * 500, leaving an order of magnitude in which a document is complained about
 * but still drawn, and only past that is it refused outright.
 */
export const REPEAT_EXPANSION_BUDGET = 500

/** Thrown when an expansion would exceed {@link REPEAT_EXPANSION_BUDGET}. */
export class RepeatBudgetError extends Error {
  constructor(budget: number) {
    super(
      `repeat expansion exceeds ${budget} nodes — nesting multiplies, so check the ` +
        `nested counts rather than the outermost one`,
    )
    this.name = 'RepeatBudgetError'
  }
}

/** Deep-clone a node so each expanded copy is a distinct object identity. */
function cloneNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneNode)
  if (value === null || typeof value !== 'object') return value
  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(source)) {
    // `loc` is immutable positional data shared by every copy on purpose.
    result[key] = key === 'loc' ? item : cloneNode(item)
  }
  return result
}

/** Whether a subtree contains a `Repeat` anywhere, so untouched trees are shared. */
function containsRepeat(node: AnyNode): boolean {
  if (node.type === 'Repeat') return true
  const children = (node as { children?: unknown }).children
  if (Array.isArray(children)) {
    for (const child of children as AnyNode[]) if (containsRepeat(child)) return true
  }
  const fills = (node as { fills?: unknown }).fills
  if (Array.isArray(fills)) {
    for (const fill of fills as { children?: AnyNode[] }[]) {
      for (const child of fill.children ?? []) if (containsRepeat(child)) return true
    }
  }
  return false
}

interface Budget {
  remaining: number
}

/**
 * Expand one node into the nodes that replace it.
 *
 * Returns an array because `Repeat` is the one node type whose expansion is not
 * one-to-one: it disappears and contributes `count` copies of its body in its
 * own place, so the copies become siblings of whatever surrounded the `repeat`.
 */
function expandOne(node: AnyNode, budget: Budget): AnyNode[] {
  if (node.type === 'Repeat') {
    const repeat: RepeatNode = node
    // Grammar `Integer` already rejects negatives and non-integers, so the only
    // remaining degenerate count is 0 — which draws nothing, exactly as written.
    const count = Number.isInteger(repeat.count) && repeat.count > 0 ? repeat.count : 0
    const result: AnyNode[] = []
    for (let i = 0; i < count; i++) {
      for (const child of repeat.children) {
        // Expand first, then clone: an inner `repeat` must resolve before the
        // copy is taken, or nested counts would not multiply.
        for (const expanded of expandOne(child, budget)) {
          budget.remaining -= 1
          if (budget.remaining < 0) throw new RepeatBudgetError(REPEAT_EXPANSION_BUDGET)
          result.push(cloneNode(expanded) as AnyNode)
        }
      }
    }
    return result
  }

  if (!containsRepeat(node)) return [node]

  const clone = { ...(node as unknown as Record<string, unknown>) }
  const children = clone.children
  if (Array.isArray(children)) {
    clone.children = (children as AnyNode[]).flatMap((child) => expandOne(child, budget))
  }
  const fills = clone.fills
  if (Array.isArray(fills)) {
    clone.fills = (fills as { children?: AnyNode[] }[]).map((fill) => ({
      ...fill,
      children: (fill.children ?? []).flatMap((child) => expandOne(child, budget)),
    }))
  }
  return [clone as unknown as AnyNode]
}

/**
 * Replace every `repeat N { … }` in a document with `N` copies of its body.
 *
 * Idempotent by construction — the result contains no `Repeat` nodes, so a
 * second application is a no-op. A document with no `repeat` is returned as-is,
 * identity included, so the common case costs one traversal and no allocation.
 *
 * @param document - Parsed wireframe document
 * @returns The document with all `repeat` nodes expanded
 * @throws {RepeatBudgetError} when expansion exceeds {@link REPEAT_EXPANSION_BUDGET}
 * @public
 * @example
 * `const drawable = expandRepeats(parse(source))`
 */
export function expandRepeats(document: WireframeDocument): WireframeDocument {
  if (!document.children.some((child) => containsRepeat(child))) return document
  const budget: Budget = { remaining: REPEAT_EXPANSION_BUDGET }
  return {
    ...document,
    children: document.children.flatMap(
      (child) => expandOne(child, budget) as WireframeDocument['children'],
    ),
  }
}
