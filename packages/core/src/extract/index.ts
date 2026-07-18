/**
 * Deterministic extraction module.
 *
 * Structures a parsed `WireframeDocument` into SSOT-shaped derivations:
 * - {@link extractScreenFields} / {@link extractAllScreenFields} — E3 Screen fields.
 * - {@link extractScreenTransitions} — E1 screen-transition graph.
 * - {@link buildAnchorIndex} / {@link resolveAnchor} / {@link getPageSource} /
 *   {@link getNodeSource} / {@link buildDomTree} — E2 DOM ↔ AST ↔ source mapping.
 */

export * from './types'
export { extractScreenFields, extractAllScreenFields } from './screen-fields'
export { extractScreenTransitions } from './transitions'
export {
  buildAnchorIndex,
  resolveAnchor,
  getPageSource,
  getNodeSource,
  buildDomTree,
  ANCHOR_PATH_ATTR,
  ANCHOR_LOC_ATTR,
} from './dom-map'
export type { AnchorEntry, SourceSlice, DomTreeNode } from './dom-map'
