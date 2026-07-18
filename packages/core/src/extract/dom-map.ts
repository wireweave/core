/**
 * DOM ↔ AST ↔ source mapping.
 *
 * The rendered HTML carries `data-wf-path` / `data-wf-loc` anchors (opt-in via
 * the renderer's `sourceAnchors` option). This module is the inverse: it turns
 * an anchor path back into its AST node and its DSL source slice, so a host
 * (dashboard editor) can implement "click a rendered element → select its
 * source" and "render a DOM-tree panel" without re-parsing.
 *
 * The path scheme is shared with the renderer (`ast/anchor-path`), so an index
 * built here is guaranteed to line up with the anchors the renderer emitted.
 */

import type { AnyNode, NodeType, SourceLocation, WireframeDocument } from '../ast'
import { anchorChildNodes, resolveAnchorPath, walkAnchorPaths } from '../ast/anchor-path'
import type { ComponentCategory } from '../spec'
import { categoryOf, getLabel } from './node-info'

export { ANCHOR_PATH_ATTR, ANCHOR_LOC_ATTR } from '../ast/anchor-path'

/** An entry in the anchor index: a node, its path, and its source location. */
export interface AnchorEntry {
  path: string
  node: AnyNode
  loc?: SourceLocation
}

/** A slice of the original DSL source, both raw and trimmed. */
export interface SourceSlice {
  /** The exact substring spanned by the node/page location. */
  text: string
  /** `text` with surrounding whitespace removed. */
  trimmed: string
  loc: SourceLocation
}

/** A node in the panel-ready DOM tree, mirroring the anchored render tree. */
export interface DomTreeNode {
  path: string
  nodeType: NodeType
  category?: ComponentCategory
  label?: string
  children: DomTreeNode[]
}

/**
 * Build a `path → { node, loc }` index for every anchored node in the document.
 * The keys are exactly the `data-wf-path` values the renderer emits.
 */
export function buildAnchorIndex(
  doc: WireframeDocument,
  pageIndexBase = 0,
): Map<string, AnchorEntry> {
  const index = new Map<string, AnchorEntry>()
  walkAnchorPaths(
    doc,
    (node, path) => {
      const entry: AnchorEntry = { path, node }
      if (node.loc) entry.loc = node.loc
      index.set(path, entry)
    },
    pageIndexBase,
  )
  return index
}

/**
 * Resolve an anchor path (a `data-wf-path` value) to its AST node, or
 * `undefined` if the path is malformed or out of range.
 */
export function resolveAnchor(
  doc: WireframeDocument,
  path: string,
  pageIndexBase = 0,
): AnyNode | undefined {
  return resolveAnchorPath(doc, path, pageIndexBase)
}

function sliceSource(source: string, loc: SourceLocation): SourceSlice {
  const text = source.slice(loc.start.offset, loc.end.offset)
  return { text, trimmed: text.trim(), loc }
}

/**
 * The DSL source slice for a page, by its document index. `undefined` if the
 * index is out of range or the page carries no location (unparsed input).
 */
export function getPageSource(
  source: string,
  doc: WireframeDocument,
  pageIndex: number,
): SourceSlice | undefined {
  const page = doc.children[pageIndex]
  if (!page?.loc) return undefined
  return sliceSource(source, page.loc)
}

/**
 * The DSL source slice for any anchored node, by its path. `undefined` if the
 * path does not resolve or the node carries no location.
 */
export function getNodeSource(
  source: string,
  doc: WireframeDocument,
  path: string,
  pageIndexBase = 0,
): SourceSlice | undefined {
  const node = resolveAnchor(doc, path, pageIndexBase)
  if (!node?.loc) return undefined
  return sliceSource(source, node.loc)
}

/**
 * Build a panel-ready DOM tree — one root per page — mirroring the anchored
 * render tree. Each node carries its anchor path so a host can cross-highlight
 * between the tree panel and the rendered canvas.
 */
export function buildDomTree(doc: WireframeDocument, pageIndexBase = 0): DomTreeNode[] {
  return doc.children.map((page, i) => buildDomTreeNode(page, String(pageIndexBase + i)))
}

function buildDomTreeNode(node: AnyNode, path: string): DomTreeNode {
  const treeNode: DomTreeNode = {
    path,
    nodeType: node.type,
    children: anchorChildNodes(node).map((child, i) => buildDomTreeNode(child, `${path}.${i}`)),
  }
  const category = categoryOf(node)
  if (category) treeNode.category = category
  const label = getLabel(node)
  if (label !== undefined) treeNode.label = label
  return treeNode
}
