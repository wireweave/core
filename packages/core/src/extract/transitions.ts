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
 * position in `trigger.item.index`. That position counts only elements that can
 * hold an intent — dividers and group headings are skipped, in every container
 * alike — because the index is the handle that points back at an edge's origin,
 * and an element incapable of producing an edge must not shift what the handle
 * addresses. `Tabs` items are plain strings without
 * `InteractiveProps` and contribute no transition; their panel content is
 * reached by normal node traversal.
 *
 * ## Resolution semantics
 *
 * - **`navigate`** is a page transition. Its trimmed target is matched, exactly
 *   and case-sensitively, against **page `id` first and page `title` second**.
 *
 *   Identifiers are how this DSL names a target: `opens` / `toggles` already
 *   address a `Modal` or `Drawer` by its `id`, so a page addressed by `id` is
 *   the same rule reaching the one container that had been left out — an author
 *   learns one way to point at something, not two.
 *
 *   The two are different kinds of name. An `id` is a stable identifier the
 *   author opted into (`page "결제 내역" id=billing`); a `title` is display text
 *   that is optional, need not be unique, and is expected to change as copy is
 *   edited. Resolving identifiers first means rewording a heading cannot
 *   silently turn every edge pointing at that screen into a dangling one. Title
 *   matching stays as the fallback because it is how the corpus is written
 *   today, and dropping it would strand every existing document.
 *
 *   Consequences of that order, all deterministic:
 *   - When one page's `id` equals another page's `title`, the `id` wins and the
 *     title-named page is not reachable by that string. Identifiers always beat
 *     labels; there is no positional tie-break to reason about.
 *   - Within each namespace, duplicates resolve to the first page in document
 *     order — the same rule the title namespace has always used.
 *   - A target matching neither namespace is read by shape (see `isUrlTarget`).
 *     A URL-shaped one — `navigate="/reset"`, `navigate="https://…"` — is an
 *     {@link ScreenTransitionGraph.external | external} destination, not a
 *     defect: the DSL documents `navigate` as a "URL or page" target, so the
 *     author wrote something the DSL allows and there is no page to find.
 *     Anything else is a name that should have matched a page and did not, and
 *     only that is {@link ScreenTransitionGraph.dangling | dangling}. Counting
 *     external links as dangling would report every correct outbound link as a
 *     broken screen transition.
 * - **`opens` / `toggles`** target an overlay *within the source page*, not
 *   another page, so their `to` is always `null`. They resolve when a `Modal`
 *   or `Drawer` in the same page has `id === target` — the overlay containers
 *   are the only nodes these two kinds can address. Being intra-page, they
 *   never appear in `dangling`.
 * - **`action`** is an opaque handler id with no structural destination:
 *   `to === null`, `resolved === false`, and it is not `dangling`.
 *
 * Item `href` is a raw anchor, not a declared `navigate` intent, and is
 * excluded — consistent with node-level extraction. The HTML renderer draws the
 * same line: it emits the authored `href` and the declared intent side by side
 * as `data-navigate` / `data-opens` / `data-toggles` / `data-action`, so every
 * edge derived here has a counterpart a consumer of the markup can act on.
 */

import type { AnyNode, PageNode, WireframeDocument } from '../ast'
import { documentPages, walk } from '../ast'
import { collectInteractions } from '../interaction/model'
import { isUrlTarget } from '../interaction/target'
import { buildSiteModel } from '../renderer/site/model'
import type {
  InteractionKind,
  ScreenTransitionGraph,
  TransitionEdge,
  TransitionScreen,
} from './types'

/**
 * The declared `id` of a page, trimmed, or `undefined` when absent or blank.
 *
 * Blank normalises to absent: `id=""` names nothing, and letting it into the
 * lookup would make every page without an id collide on the empty string.
 */
function pageId(page: PageNode): string | undefined {
  const id = page.id?.trim()
  return id !== undefined && id.length > 0 ? id : undefined
}

/** Collect `id`s of overlay containers (Modal / Drawer) declared within a page. */
function collectOverlayIds(page: PageNode): Set<string> {
  return collectOverlayIdsFrom(page.children)
}

function collectOverlayIdsFrom(children: readonly AnyNode[]): Set<string> {
  const ids = new Set<string>()
  for (const child of children) {
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
  idToIndex: ReadonlyMap<string, number>,
  titleToIndex: ReadonlyMap<string, number>,
  overlayIds: ReadonlySet<string>,
  pages: readonly PageNode[],
): { edge: TransitionEdge; isDangling: boolean } {
  const edge: TransitionEdge = { from, to: null, target, kind, trigger, resolved: false }

  if (kind === 'navigate') {
    // Identifier namespace first, display-text namespace second.
    const key = target.trim()
    const targetIndex = idToIndex.get(key) ?? titleToIndex.get(key)
    if (targetIndex !== undefined) {
      edge.to = pageDescriptor(targetIndex, pages[targetIndex])
      edge.resolved = true
      return { edge, isDangling: false }
    }
    // Names in this document are consulted before shape, so a page can still be
    // reached by a name that happens to look like a URL.
    if (isUrlTarget(target)) {
      edge.external = true
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
  // A document's top level also holds `layout` / `component` definitions. They
  // are reusable fragments, not screens, so they take no place in the graph and
  // no page index — `index` and `pageIndex` count pages, and both address the
  // same position in `screens`.
  const pages = documentPages(doc)

  const screens: TransitionScreen[] = pages.map((page, index) => {
    const screen: TransitionScreen = { index }
    const id = pageId(page)
    if (id !== undefined) screen.id = id
    if (page.title != null) screen.title = page.title
    if (page.loc) screen.loc = page.loc
    return screen
  })

  // Two lookup namespaces, each trimmed and first-occurrence-wins. They are kept
  // separate so `navigate` can consult identifiers before display text.
  const idToIndex = new Map<string, number>()
  const titleToIndex = new Map<string, number>()
  pages.forEach((page, index) => {
    const id = pageId(page)
    if (id !== undefined && !idToIndex.has(id)) idToIndex.set(id, index)
    if (page.title != null) {
      const key = page.title.trim()
      if (!titleToIndex.has(key)) titleToIndex.set(key, index)
    }
  })

  const edges: TransitionEdge[] = []
  const dangling: TransitionEdge[] = []
  const external: TransitionEdge[] = []

  const site = buildSiteModel(doc)
  const shellLayouts = new Map(site.shells.map((shell) => [shell.name, shell.layout] as const))
  const overlayIds = pages.map((page, pageIndex) => {
    const ids = collectOverlayIds(page)
    const shell = site.screens[pageIndex]?.shell
    const layout = shell === undefined ? undefined : shellLayouts.get(shell)
    if (layout !== undefined) {
      for (const id of collectOverlayIdsFrom(layout.children)) ids.add(id)
    }
    return ids
  })

  const normalized = collectInteractions(doc)
  for (const interaction of normalized.interactions) {
    const page = pages[interaction.screenIndex]
    if (page === undefined) continue
    const from = pageDescriptor(interaction.screenIndex, page)

    for (const effect of interaction.handler.effects) {
      let kind: InteractionKind
      let target: string
      switch (effect.kind) {
        case 'navigate':
          kind = 'navigate'
          target = effect.target
          break
        case 'open':
          kind = 'opens'
          target = effect.target
          break
        case 'toggle-overlay':
          kind = 'toggles'
          target = effect.target
          break
        case 'legacy-action':
          kind = 'action'
          target = effect.action
          break
        case 'set':
        case 'reset':
        case 'toggle':
          kind = 'action'
          target = effect.state
          break
        case 'close':
          kind = 'action'
          target = effect.target
          break
      }

      const resolved = resolveEdge(
        from,
        kind,
        target,
        interaction.trigger,
        idToIndex,
        titleToIndex,
        overlayIds[interaction.screenIndex] ?? new Set<string>(),
        pages,
      )
      const { edge } = resolved
      if (interaction.legacyKind === undefined) {
        edge.event = interaction.handler.event
        if (interaction.handler.guard !== undefined) edge.guard = interaction.handler.guard
        edge.effect = effect
      }
      if (interaction.source === 'layout') edge.source = 'layout'

      edges.push(edge)
      if (resolved.isDangling) dangling.push(edge)
      if (edge.external) external.push(edge)
    }
  }

  return { screens, edges, dangling, external }
}

/**
 * Describe a page as an edge endpoint. Both names are carried when declared, so
 * a consumer can address the page by its stable `id` and label it with `title`.
 */
function pageDescriptor(
  pageIndex: number,
  page: PageNode | undefined,
): { pageIndex: number; id?: string; title?: string } {
  const descriptor: { pageIndex: number; id?: string; title?: string } = { pageIndex }
  if (page === undefined) return descriptor
  const id = pageId(page)
  if (id !== undefined) descriptor.id = id
  if (page.title != null) descriptor.title = page.title
  return descriptor
}
