/**
 * Deterministic source-anchor path scheme.
 *
 * A single implementation of "which node sits at which path" that BOTH the
 * renderer's anchor injection and the extract module's anchor index share, so
 * the DOM attributes and the AST index can never drift apart.
 *
 * ## Path scheme
 *
 * A path is a dot-joined chain of zero-based indices whose first segment is the
 * page's index in the document (`0`, `1`, …) and whose remaining segments are
 * child ordinals within {@link anchorChildNodes}. Example: page `0`, its 3rd
 * child's 2nd child → `0.2.1`.
 *
 * ## Anchor children
 *
 * Only the structural container types whose HTML renderer dispatches their
 * `AnyNode[]` `children` back through `renderNode` are descended into. This is
 * the exact set that receives an anchor attribute during rendering; leaf and
 * custom-traversal nodes (Table cells, List items, Nav/Tabs/Breadcrumb entries,
 * Annotation items) are not part of the anchor tree. Keeping the walk in lock
 * step with `renderNode` dispatch is what makes the anchor count in the HTML
 * equal to the size of the index for any document.
 */

import type { AnyNode, SourceLocation, WireframeDocument } from './types'
import { documentPages } from './utils'

/** DOM attribute carrying a node's page-relative index path. */
export const ANCHOR_PATH_ATTR = 'data-wf-path'

/** DOM attribute carrying a node's source offset range (`start-end`). */
export const ANCHOR_LOC_ATTR = 'data-wf-loc'

/**
 * Container node types whose renderer dispatches their `children` through
 * `renderNode` (via `renderChildren`). This is the single authority for which
 * nodes carry anchors and appear in the anchor index.
 */
const ANCHOR_CONTAINER_TYPES: ReadonlySet<string> = new Set([
  'Page',
  'Header',
  'Main',
  'Footer',
  'Sidebar',
  'Section',
  'Row',
  'Col',
  'Stack',
  'Relative',
  'Card',
  'Modal',
  'Drawer',
  'Accordion',
  'Tooltip',
  'Popover',
])

/**
 * The anchored children of a node — its `AnyNode[]` children when it is one of
 * the structural containers the renderer descends into, otherwise `[]`.
 */
export function anchorChildNodes(node: AnyNode): AnyNode[] {
  if (!ANCHOR_CONTAINER_TYPES.has(node.type)) return []
  const children = (node as { children?: unknown }).children
  return Array.isArray(children) ? (children as AnyNode[]) : []
}

/** Format a source location as the `start-end` offset range used by anchors. */
export function formatAnchorLoc(loc: SourceLocation): string {
  return `${loc.start.offset}-${loc.end.offset}`
}

/**
 * Visit every anchored node in a document in deterministic pre-order, calling
 * `visit` with the node and its path.
 *
 * @param pageIndexBase - Offset added to each page's document index, so a page
 *   rendered in isolation (canvas per-page composition) keeps its true index.
 */
export function walkAnchorPaths(
  doc: WireframeDocument,
  visit: (node: AnyNode, path: string) => void,
  pageIndexBase = 0,
): void {
  documentPages(doc).forEach((page, i) => {
    visitAnchorNode(page, String(pageIndexBase + i), visit)
  })
}

function visitAnchorNode(
  node: AnyNode,
  path: string,
  visit: (node: AnyNode, path: string) => void,
): void {
  visit(node, path)
  anchorChildNodes(node).forEach((child, i) => {
    visitAnchorNode(child, `${path}.${i}`, visit)
  })
}

/**
 * Build a node → path map for a document. Keyed by node identity, so the
 * renderer can look up a node's path at injection time without re-deriving it.
 */
export function buildAnchorPathMap(
  doc: WireframeDocument,
  pageIndexBase = 0,
): Map<AnyNode, string> {
  const map = new Map<AnyNode, string>()
  walkAnchorPaths(doc, (node, path) => map.set(node, path), pageIndexBase)
  return map
}

/**
 * Resolve a path back to its node by walking the same child scheme. Returns
 * `undefined` for a malformed or out-of-range path.
 */
export function resolveAnchorPath(
  doc: WireframeDocument,
  path: string,
  pageIndexBase = 0,
): AnyNode | undefined {
  if (!path) return undefined
  const segments = path.split('.')
  const indices: number[] = []
  for (const segment of segments) {
    if (!/^\d+$/.test(segment)) return undefined
    indices.push(Number(segment))
  }

  const [pageSegment, ...childSegments] = indices as [number, ...number[]]
  let node: AnyNode | undefined = documentPages(doc)[pageSegment - pageIndexBase]
  for (const childIndex of childSegments) {
    if (!node) return undefined
    node = anchorChildNodes(node)[childIndex]
  }
  return node
}
