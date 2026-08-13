import type { AnyNode, LayoutDefinitionNode, PageNode, WireframeDocument } from '../../ast/types'
import { documentDefinitions, documentPages, walk } from '../../ast/utils'
import { resolvePageDimensions } from '../page-renderer'

/** Why a page that declared `uses=` was not composed into a layout. */
export type ShellMiss = 'unknown-layout' | 'slotless-layout'

export interface SiteScreen {
  /** Position in documentPages(document), used as the stable screen key. */
  index: number
  page: PageNode
  shell?: string
  miss?: { uses: string; reason: ShellMiss }
  /** The first declared id or title that resolves back to this screen. */
  name?: string
}

export interface SiteShell {
  name: string
  layout: LayoutDefinitionNode
  screens: SiteScreen[]
  width: number
  height: number
}

export interface SiteModel {
  screens: SiteScreen[]
  shells: SiteShell[]
  names: Map<string, number>
  entry: number
}

function pageId(page: PageNode): string | undefined {
  const id = page.id?.trim()
  return id && id.length > 0 ? id : undefined
}

function pageTitle(page: PageNode): string | undefined {
  const title = page.title?.trim()
  return title && title.length > 0 ? title : undefined
}

function hasSlot(layout: LayoutDefinitionNode): boolean {
  for (const child of layout.children) {
    let found = false
    walk(child, (node: AnyNode) => {
      if (node.type === 'Slot') found = true
      return !found
    })
    if (found) return true
  }
  return false
}

function layoutsByName(doc: WireframeDocument): Map<string, LayoutDefinitionNode> {
  const layouts = new Map<string, LayoutDefinitionNode>()
  for (const definition of documentDefinitions(doc)) {
    const name = definition.name.trim()
    if (name.length > 0 && !layouts.has(name)) layouts.set(name, definition)
  }
  return layouts
}

function resolveShell(
  page: PageNode,
  layouts: ReadonlyMap<string, LayoutDefinitionNode>,
):
  | { layout: LayoutDefinitionNode; name: string }
  | { miss: { uses: string; reason: ShellMiss } }
  | undefined {
  const uses = page.uses?.trim()
  if (!uses) return undefined

  const layout = layouts.get(uses)
  if (!layout) return { miss: { uses, reason: 'unknown-layout' } }
  if (!hasSlot(layout)) return { miss: { uses, reason: 'slotless-layout' } }
  return { layout, name: uses }
}

/** Build the page/shell/name model shared by the site renderer and runtime. */
export function buildSiteModel(doc: WireframeDocument): SiteModel {
  const screens: SiteScreen[] = documentPages(doc).map((page, index) => ({ index, page }))
  const layouts = layoutsByName(doc)
  const shells: SiteShell[] = []
  const shellByName = new Map<string, SiteShell>()

  for (const screen of screens) {
    const resolved = resolveShell(screen.page, layouts)
    if (!resolved) continue
    if ('miss' in resolved) {
      screen.miss = resolved.miss
      continue
    }

    let shell = shellByName.get(resolved.name)
    if (!shell) {
      const { width, height } = resolvePageDimensions(screen.page)
      shell = { name: resolved.name, layout: resolved.layout, screens: [], width, height }
      shellByName.set(resolved.name, shell)
      shells.push(shell)
    }
    shell.screens.push(screen)
    screen.shell = shell.name
  }

  // Titles are collected first for compatibility. Page ids then overwrite a
  // title collision, while duplicate ids remain first-wins among themselves.
  const names = new Map<string, number>()
  for (const screen of screens) {
    const title = pageTitle(screen.page)
    if (title !== undefined && !names.has(title)) names.set(title, screen.index)
  }
  for (const screen of screens) {
    const id = pageId(screen.page)
    if (id === undefined) continue
    const owner = names.get(id)
    if (owner === undefined || pageId(screens[owner].page) !== id) {
      names.set(id, screen.index)
    }
  }

  for (const screen of screens) {
    screen.name = [pageId(screen.page), pageTitle(screen.page)].find(
      (name): name is string => name !== undefined && names.get(name) === screen.index,
    )
  }

  return { screens, shells, names, entry: screens.length > 0 ? 0 : -1 }
}
