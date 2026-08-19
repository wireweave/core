/**
 * The screen model behind `renderSite` — which pages become screens, which
 * shell each one is drawn inside, and what names address it.
 *
 * Nothing here renders. It answers three questions the site renderer and its
 * inline runtime both need the *same* answer to, so the answer is computed once
 * and handed to both.
 *
 * ## Totality
 *
 * A wireframe document can name a layout that does not exist, declare two pages
 * with the same `id`, or use a layout with no `slot`. None of those is a parse
 * error (see the note on `WireframeDocument`), so none of them may stop a
 * render either: every function here is total. Where a document is ambiguous
 * the rule is always **first-wins in document order** — the same rule
 * `extract/transitions.ts` already applies to titles — and the loser is not
 * dropped silently: it is rendered with a `data-wf-*` marker naming what went
 * unmet, so a reader of the output can see it and `validation/` can report it
 * with a source location.
 */

import type { AnyNode, LayoutDefinitionNode, PageNode, WireframeDocument } from '../../ast/types'
import { documentDefinitions, documentPages, walk } from '../../ast/utils'
import { resolvePageDimensions } from '../page-renderer'

/** Why a page that declared `uses=` is not composed into a shell after all. */
export type ShellMiss =
  /** No `layout` in the document carries that name. */
  | 'unknown-layout'
  /** The layout exists but has no `slot`, so it has nowhere to put a page. */
  | 'slotless-layout'

/** One page, as a screen of the composed document. */
export interface SiteScreen {
  /** Position in `documentPages(doc)`. This is the screen's DOM key. */
  index: number
  page: PageNode
  /**
   * The variant this screen draws, when its page came from a `variants=` list.
   *
   * Read off the page rather than derived here: `expandVariants` has already
   * turned one variant-bearing page into one page per variant by the time a
   * model is built, so each of those pages is a screen like any other and this
   * only records which one it is.
   */
  variant?: string
  /** Name of the shell this screen is composed into, when it has one. */
  shell?: string
  /** Set when `uses=` was declared and could not be honoured. */
  miss?: { uses: string; reason: ShellMiss }
  /**
   * The public name this screen *owns* — the name that resolves to it.
   *
   * Absent when the page declared no name, and also when every name it declared
   * is already owned by an earlier page. A screen without a name is still
   * reachable: its index addresses it.
   */
  name?: string
}

/** One layout, emitted once, hosting every screen that uses it. */
export interface SiteShell {
  /** The `layout <name>` identifier, which `uses=` addresses. */
  name: string
  layout: LayoutDefinitionNode
  /** Screens composed into this shell, in document order. */
  screens: SiteScreen[]
  /**
   * Frame size of the shell, resolved from its first screen's page.
   *
   * A layout has no viewport of its own — it is the pages that declare one — so
   * the first page to use it fixes the frame. A later page resolving to a
   * different size is a conflict the author has to settle; it is marked on that
   * screen rather than resized, because silently stretching one page's frame to
   * another's is the kind of change that is invisible until a screenshot.
   */
  width: number
  height: number
}

export interface SiteModel {
  screens: SiteScreen[]
  /** Shells in first-use order — the order pages first reference them. */
  shells: SiteShell[]
  /**
   * Every name that addresses a screen → that screen's index.
   *
   * Built exactly like `extract/transitions.ts` resolves `navigate`: the `id`
   * namespace is consulted before the `title` namespace, and within each
   * namespace the first page in document order wins. A `navigate` target and a
   * URL fragment therefore land on the same screen the transition graph says
   * they do — one resolution rule, two consumers.
   */
  names: Map<string, number>
  /** Screen shown when no fragment selects one. `-1` for a document with no pages. */
  entry: number
}

/** A page's `id`, trimmed, or `undefined` when absent or blank. */
function pageId(page: PageNode): string | undefined {
  const id = page.id?.trim()
  return id !== undefined && id.length > 0 ? id : undefined
}

/** A page's `title`, trimmed, or `undefined` when absent or blank. */
function pageTitle(page: PageNode): string | undefined {
  const title = page.title?.trim()
  return title !== undefined && title.length > 0 ? title : undefined
}

/**
 * The separator between a screen's name and the variant of it — `home#loading`.
 *
 * `#` rather than `.` or `-` because a variant address is already a URL
 * fragment: `location.hash` is how the site runtime addresses screens, so a
 * variant name written into a link is spelled the same way there as here. It
 * also cannot appear in a bare `Identifier`, so `navigate=home#loading` does
 * not parse and the quoted form is the only way to write one — which keeps a
 * variant address visibly deliberate rather than something a `navigate=home`
 * turns into by accident.
 */
export const VARIANT_SEPARATOR = '#'

/** The public address of one variant of a named screen. */
export const variantName = (name: string, variant: string): string =>
  `${name}${VARIANT_SEPARATOR}${variant}`

/** Does this layout contain a `slot` anywhere in its body? */
function hasSlot(layout: LayoutDefinitionNode): boolean {
  let found = false
  for (const child of layout.children) {
    walk(child, (node: AnyNode) => {
      if (node.type === 'Slot') found = true
      return !found
    })
    if (found) return true
  }
  return false
}

/** Layouts by name, first declaration winning a duplicate. */
function layoutsByName(doc: WireframeDocument): Map<string, LayoutDefinitionNode> {
  const layouts = new Map<string, LayoutDefinitionNode>()
  for (const definition of documentDefinitions(doc)) {
    if (definition.type !== 'Layout') continue
    const name = definition.name.trim()
    if (name.length > 0 && !layouts.has(name)) layouts.set(name, definition)
  }
  return layouts
}

/**
 * Resolve `uses=` for one page: the layout it is composed into, or the reason
 * it is not.
 */
function resolveShell(
  page: PageNode,
  layouts: ReadonlyMap<string, LayoutDefinitionNode>,
): { layout: LayoutDefinitionNode; name: string } | { miss: SiteScreen['miss'] } | undefined {
  const uses = page.uses?.trim()
  if (uses === undefined || uses.length === 0) return undefined

  const layout = layouts.get(uses)
  if (layout === undefined) return { miss: { uses, reason: 'unknown-layout' } }
  // A shell with no slot has nowhere to put the page. Rendering the shell
  // anyway would hide the page inside an empty frame; appending the page after
  // the shell's last element would invent a slot position the author did not
  // write. The page is drawn on its own instead, and the unmet `uses=` is
  // marked on it.
  if (!hasSlot(layout)) return { miss: { uses, reason: 'slotless-layout' } }
  return { layout, name: uses }
}

/**
 * Derive the screen model of a document.
 *
 * Pure and deterministic: same document in, same model out, whatever the
 * document contains.
 */
export function buildSiteModel(doc: WireframeDocument): SiteModel {
  // Screens come from pages only. A `layout` reaches the output through the
  // pages that say `uses=`, and a `component` reaches it through `use` inside
  // one of those pages — never as a screen of its own. Drawing one anyway
  // would put a screen on the canvas the author never wrote a page for. So a
  // component-bearing page is not different from any other page here:
  // expansion happens below this model (in the linker, which binds the
  // invocation's inputs, and then in the node renderer), and the screen model
  // still counts pages.
  const pages = documentPages(doc)
  const layouts = layoutsByName(doc)

  // One screen per page, still — a page declaring `variants=` has already been
  // expanded into one page per variant by `expandVariants` before the model is
  // built, so what arrives here is the board list and this stays a 1:1 map.
  // The variant is read off the page rather than derived, which is what keeps
  // this model and the canvas counting the same boards.
  const screens: SiteScreen[] = pages.map((page, index) => {
    const variant = page.variant?.trim()
    return variant !== undefined && variant.length > 0 ? { index, page, variant } : { index, page }
  })

  const shells: SiteShell[] = []
  const shellByName = new Map<string, SiteShell>()

  screens.forEach((screen) => {
    const resolved = resolveShell(screen.page, layouts)
    if (resolved === undefined) return
    if ('miss' in resolved) {
      screen.miss = resolved.miss
      return
    }

    let shell = shellByName.get(resolved.name)
    if (shell === undefined) {
      const { width, height } = resolvePageDimensions(screen.page)
      shell = { name: resolved.name, layout: resolved.layout, screens: [], width, height }
      shellByName.set(resolved.name, shell)
      shells.push(shell)
    }
    shell.screens.push(screen)
    screen.shell = shell.name
  })

  // Two namespaces, each first-wins, ids consulted before titles.
  const names = new Map<string, number>()
  for (const screen of screens) {
    const title = pageTitle(screen.page)
    if (title !== undefined && !names.has(title)) names.set(title, screen.index)
  }
  for (const screen of screens) {
    const id = pageId(screen.page)
    if (id === undefined) continue
    const owner = names.get(id)
    // An id outranks a title, so it takes the name even when a title claimed it
    // first — but never from an earlier declaration of the same id, which keeps
    // duplicate ids first-wins among themselves.
    if (owner === undefined || pageId(screens[owner].page) !== id) {
      names.set(id, screen.index)
    }
  }

  // Variant addresses, layered on top of the two namespaces rather than mixed
  // into them. A page's bare name is claimed above by the *first* of its
  // variant screens, because that loop runs in screen order and is first-wins —
  // so `navigate=dashboards` lands on the first variant with no rule of its own,
  // which is the intended default: a variant is a state of one screen, not a
  // separate destination, and the first one declared is the one the author put
  // first. `dashboards#loading` is what addresses the rest.
  //
  // Set only when the qualified name is free, and only for a name whose bare
  // form this screen's own group won. A page whose bare name was taken by an
  // earlier page's duplicate id would otherwise publish `taken#loading` and
  // hand out an address pointing into a page that never declared that variant.
  //
  // Ownership is tested by comparing the *name* the winning screen declares,
  // not by object identity: `expandVariants` gives every variant a distinct
  // clone of the page (it must — the anchor map is keyed by identity), so the
  // siblings of the first variant are different objects that declare the same
  // id and title, and an identity test would publish an address for the first
  // variant only and leave the rest unaddressable.
  for (const screen of screens) {
    if (screen.variant === undefined) continue
    for (const declared of [pageId(screen.page), pageTitle(screen.page)]) {
      if (declared === undefined) continue
      const owner = names.get(declared)
      if (owner === undefined) continue
      const winner = screens[owner].page
      if (pageId(winner) !== pageId(screen.page) || pageTitle(winner) !== pageTitle(screen.page)) {
        continue
      }
      const qualified = variantName(declared, screen.variant)
      if (!names.has(qualified)) names.set(qualified, screen.index)
    }
  }

  // A screen's own name is the first of its declared names that resolves back
  // to it. Anything else would hand out a name that navigates elsewhere.
  //
  // A variant screen prefers its qualified name over the bare one, because the
  // qualified name addresses exactly it while the bare name addresses whichever
  // variant came first. Only the first variant of a page can own the bare name,
  // and the `names.get(name) === screen.index` test is what enforces that — the
  // later variants fail it and fall through to their own qualified name.
  for (const screen of screens) {
    const bare = [pageId(screen.page), pageTitle(screen.page)]
    const variant = screen.variant
    const declared =
      variant === undefined
        ? bare
        : [
            ...bare.map((name) => (name === undefined ? undefined : variantName(name, variant))),
            ...bare,
          ]
    screen.name = declared.find(
      (name): name is string => name !== undefined && names.get(name) === screen.index,
    )
  }

  return { screens, shells, names, entry: screens.length > 0 ? 0 : -1 }
}
