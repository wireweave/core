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
 *   duplicate titles the first page in document order wins. When no title
 *   matches, URL-shaped targets (`navigate="/dashboard"`, `https://…`) are
 *   reported as {@link ScreenTransitionGraph.external | external}; unmatched
 *   plain names remain {@link ScreenTransitionGraph.dangling | dangling}.
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
    const key = target.trim()
    const targetIndex = idToIndex.get(key) ?? titleToIndex.get(key)
    if (targetIndex !== undefined) {
      edge.to = pageDescriptor(targetIndex, pages[targetIndex])
      edge.resolved = true
      return { edge, isDangling: false }
    }
    // Resolve document names before classifying by shape so an unusual page
    // title such as "/docs" remains addressable.
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
  const pages = documentPages(doc)
  const screens: TransitionScreen[] = pages.map((page, index) => {
    const screen: TransitionScreen = { index }
    const id = pageId(page)
    if (id !== undefined) screen.id = id
    if (page.title != null) screen.title = page.title
    if (page.loc) screen.loc = page.loc
    return screen
  })

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

  for (const interaction of collectInteractions(doc).interactions) {
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
