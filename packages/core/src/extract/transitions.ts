/**
 * E1 — Screen transition graph derivation.
 *
 * `extractScreenTransitions(doc)` derives the page-to-page navigation graph from
 * every interactive node in a multi-page document. Purely deterministic.
 *
 * ## Trigger sources
 *
 * A transition can be fired by a component node (a `Button`, `Link`, `Card`…)
 * or by a **menu item** inside a nav / dropdown / breadcrumb container. Nav
 * menus are the primary transition source in a multi-screen wireframe, so both
 * `nav ["…"]` array items and `nav { item … group { item … } }` block items
 * (including grouped items), plus dropdown and breadcrumb items, are extracted.
 * Item triggers carry the container's type in `trigger.nodeType` and the item's
 * position in `trigger.item.index`. `Tabs` items are plain strings without
 * `InteractiveProps` and contribute no transition; their panel content is
 * reached by normal node traversal.
 *
 * ## Resolution semantics
 *
 * - **`navigate`** is a page transition. Its target resolves to a page when the
 *   target string, trimmed, exactly matches a page `title` (case-sensitive). On
 *   duplicate titles the first page in document order wins. URL-style targets
 *   (`navigate="/dashboard"`) do not match a title and are reported as
 *   {@link ScreenTransitionGraph.dangling | dangling}. This mirrors the DSL,
 *   where `navigate` is documented as a "URL or page" target.
 * - **`opens` / `toggles`** target an overlay *within the source page*, not
 *   another page, so their `to` is always `null`. They resolve when a `Modal`
 *   or `Drawer` in the same page has `id === target` (the only nodes that carry
 *   an `id`). Being intra-page, they never appear in `dangling`.
 * - **`action`** is an opaque handler id with no structural destination:
 *   `to === null`, `resolved === false`, and it is not `dangling`.
 *
 * Item `href` is a raw anchor, not a declared `navigate` intent, and is
 * excluded — consistent with node-level extraction.
 */

import type { AnyNode, PageNode, WireframeDocument } from '../ast'
import { walk } from '../ast'
import { categoryOf, getInteractiveLabel, getInteractions, getItemInteractions } from './node-info'
import type {
  InteractionKind,
  ScreenTransitionGraph,
  TransitionEdge,
  TransitionScreen,
} from './types'

/** Collect `id`s of overlay containers (Modal / Drawer) declared within a page. */
function collectOverlayIds(page: PageNode): Set<string> {
  const ids = new Set<string>()
  for (const child of page.children) {
    walk(child, (node: AnyNode) => {
      if (node.type === 'Modal' || node.type === 'Drawer') {
        const id = node.id
        if (typeof id === 'string' && id.length > 0) ids.add(id)
      }
    })
  }
  return ids
}

/**
 * Build one transition edge and classify it, applying the resolution semantics
 * uniformly to both node-level and item-level triggers.
 */
function resolveEdge(
  from: TransitionEdge['from'],
  kind: InteractionKind,
  target: string,
  trigger: TransitionEdge['trigger'],
  titleToIndex: ReadonlyMap<string, number>,
  overlayIds: ReadonlySet<string>,
  pages: readonly PageNode[],
): { edge: TransitionEdge; isDangling: boolean } {
  const edge: TransitionEdge = { from, to: null, target, kind, trigger, resolved: false }

  if (kind === 'navigate') {
    const targetIndex = titleToIndex.get(target.trim())
    if (targetIndex !== undefined) {
      edge.to = toDescriptor(targetIndex, pages[targetIndex])
      edge.resolved = true
      return { edge, isDangling: false }
    }
    return { edge, isDangling: true }
  }

  if (kind === 'opens' || kind === 'toggles') {
    edge.resolved = overlayIds.has(target)
  }
  return { edge, isDangling: false }
}

/**
 * Derive the screen-transition graph for a whole document.
 */
export function extractScreenTransitions(doc: WireframeDocument): ScreenTransitionGraph {
  const screens: TransitionScreen[] = doc.children.map((page, index) => {
    const screen: TransitionScreen = { index }
    if (page.title != null) screen.title = page.title
    if (page.loc) screen.loc = page.loc
    return screen
  })

  // Title → page index (trimmed, first occurrence wins).
  const titleToIndex = new Map<string, number>()
  doc.children.forEach((page, index) => {
    if (page.title != null) {
      const key = page.title.trim()
      if (!titleToIndex.has(key)) titleToIndex.set(key, index)
    }
  })

  const edges: TransitionEdge[] = []
  const dangling: TransitionEdge[] = []

  doc.children.forEach((page, pageIndex) => {
    const overlayIds = collectOverlayIds(page)
    const from = fromDescriptor(pageIndex, page)

    const push = (
      kind: InteractionKind,
      target: string,
      trigger: TransitionEdge['trigger'],
    ): void => {
      const { edge, isDangling } = resolveEdge(
        from,
        kind,
        target,
        trigger,
        titleToIndex,
        overlayIds,
        doc.children,
      )
      edges.push(edge)
      if (isDangling) dangling.push(edge)
    }

    for (const child of page.children) {
      walk(child, (node: AnyNode) => {
        // Only real component nodes emit interactions; pseudo item/group/tab
        // nodes reached by traversal are handled via their container below.
        if (categoryOf(node) === undefined) return

        const label = getInteractiveLabel(node)
        for (const { kind, target } of getInteractions(node)) {
          const trigger: TransitionEdge['trigger'] = { nodeType: node.type }
          if (label !== undefined) trigger.label = label
          if (node.loc) trigger.loc = node.loc
          push(kind, target, trigger)
        }

        for (const item of getItemInteractions(node)) {
          const trigger: TransitionEdge['trigger'] = {
            nodeType: item.container,
            item: { index: item.itemIndex },
          }
          if (item.itemLabel !== undefined) trigger.label = item.itemLabel
          if (node.loc) trigger.loc = node.loc
          push(item.kind, item.target, trigger)
        }
      })
    }
  })

  return { screens, edges, dangling }
}

function fromDescriptor(pageIndex: number, page: PageNode): TransitionEdge['from'] {
  return page.title != null ? { pageIndex, title: page.title } : { pageIndex }
}

function toDescriptor(
  pageIndex: number,
  page: PageNode | undefined,
): { pageIndex: number; title?: string } {
  return page?.title != null ? { pageIndex, title: page.title } : { pageIndex }
}
