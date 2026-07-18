/**
 * Internal helpers for reading display text, interactions, and component
 * category off AST nodes.
 *
 * Not part of the public API — imported only by the extract module.
 */

import type { AnyNode, InteractiveProps, NodeType } from '../ast'
import { isBreadcrumbNode, isDropdownNode, isNavNode } from '../ast'
import type { ComponentCategory } from '../spec'
import { NODE_TYPE_MAP } from '../spec'
import type { InteractionKind } from './types'

/** Interaction props in a fixed emission order (deterministic output). */
const INTERACTION_KINDS: readonly InteractionKind[] = ['navigate', 'opens', 'toggles', 'action']

/**
 * The component category of a real AST node, or `undefined` for pseudo-nodes
 * that are not registered components (e.g. nav block `item` / `group` entries,
 * `tab` panels). A defined category is the single test for "this is a real
 * component node" across the extract module.
 */
export function categoryOf(node: AnyNode): ComponentCategory | undefined {
  return NODE_TYPE_MAP.get(node.type)?.category
}

/**
 * The short caption of a node: form `label`, `name` (avatar/icon), or container
 * `title`. Content text is deliberately excluded here — see {@link getContent}.
 */
export function getLabel(node: AnyNode): string | undefined {
  if ('label' in node && typeof node.label === 'string') return node.label
  if ('name' in node && typeof node.name === 'string') return node.name
  if ('title' in node && typeof node.title === 'string') return node.title
  return undefined
}

/** The textual body of a content-bearing node (text/title/link/button/badge…). */
export function getContent(node: AnyNode): string | undefined {
  if ('content' in node && typeof node.content === 'string') return node.content
  return undefined
}

/**
 * The best human-facing label for an interactive node: its visible content if
 * any (a button's text, a link's text), otherwise its caption.
 */
export function getInteractiveLabel(node: AnyNode): string | undefined {
  return getContent(node) ?? getLabel(node)
}

/** The interactions declared on any `InteractiveProps` carrier, in fixed order. */
function interactionsOf(
  props: Partial<InteractiveProps>,
): { kind: InteractionKind; target: string }[] {
  const out: { kind: InteractionKind; target: string }[] = []
  for (const kind of INTERACTION_KINDS) {
    const target = props[kind]
    if (typeof target === 'string' && target.length > 0) {
      out.push({ kind, target })
    }
  }
  return out
}

/**
 * The interactions declared on a node, in fixed prop order. A node may carry
 * several (e.g. `navigate` + `action`), each yielding one entry.
 */
export function getInteractions(node: AnyNode): { kind: InteractionKind; target: string }[] {
  return interactionsOf(node as Partial<InteractiveProps>)
}

/**
 * An interaction declared on a *menu item* inside a container (nav / dropdown /
 * breadcrumb), rather than on a component node itself. `container` is the owning
 * node's type and `itemIndex` is the item's position within that container's
 * flattened item sequence.
 */
export interface ItemInteraction {
  kind: InteractionKind
  target: string
  container: NodeType
  itemIndex: number
  itemLabel?: string
}

/**
 * The item-level interactions declared inside a container node.
 *
 * Nav (both array `nav [...]` and block `nav { item … group { item … } }`
 * syntax, including grouped items), Dropdown, and Breadcrumb carry
 * `InteractiveProps` on their items — the source of most transitions in a
 * multi-screen wireframe. This flattens them in deterministic document order.
 *
 * `Tabs` items are plain strings with no `InteractiveProps`, so tabs contribute
 * no item-level interactions; their panel content is captured by normal node
 * traversal instead. Item `href` is a raw anchor, not a declared `navigate`
 * intent, and is intentionally excluded — mirroring node-level extraction.
 *
 * Returns `[]` for any node that is not an interactive-item container.
 */
export function getItemInteractions(node: AnyNode): ItemInteraction[] {
  const out: ItemInteraction[] = []
  let index = 0
  const emit = (label: string | undefined, props: Partial<InteractiveProps>): void => {
    for (const { kind, target } of interactionsOf(props)) {
      const item: ItemInteraction = { kind, target, container: node.type, itemIndex: index }
      if (label !== undefined) item.itemLabel = label
      out.push(item)
    }
    index += 1
  }

  if (isNavNode(node)) {
    for (const it of node.items) {
      if (typeof it === 'string') {
        index += 1
        continue
      }
      emit(it.label, it)
    }
    for (const child of node.children) {
      if (child.type === 'item') {
        emit(child.label, child)
      } else if (child.type === 'group') {
        for (const groupItem of child.items) {
          if (groupItem.type === 'item') emit(groupItem.label, groupItem)
        }
      }
    }
  } else if (isDropdownNode(node)) {
    for (const it of node.items) {
      // Only `DropdownItemNode` carries a label; `DividerNode` does not.
      if (!('label' in it)) {
        index += 1
        continue
      }
      emit(it.label, it)
    }
  } else if (isBreadcrumbNode(node)) {
    for (const it of node.items) {
      if (typeof it === 'string') {
        index += 1
        continue
      }
      emit(it.label, it)
    }
  }

  return out
}
