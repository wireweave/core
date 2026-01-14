/**
 * Node collection utilities for analysis
 */

import type { WireframeDocument, AnyNode } from '../types';

/**
 * Collect all nodes from a document
 */
export function collectNodes(doc: WireframeDocument, nodes: AnyNode[]): void {
  for (const page of doc.children) {
    collectNodeRecursive(page as AnyNode, nodes);
  }
}

/**
 * Recursively collect nodes
 */
export function collectNodeRecursive(node: AnyNode, nodes: AnyNode[]): void {
  nodes.push(node);

  const children = getChildren(node);
  for (const child of children) {
    collectNodeRecursive(child, nodes);
  }
}

/**
 * Get children of a node
 */
export function getChildren(node: AnyNode): AnyNode[] {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children as AnyNode[];
  }
  if ('items' in node && Array.isArray(node.items)) {
    return node.items as AnyNode[];
  }
  if ('tabs' in node && Array.isArray(node.tabs)) {
    return node.tabs as AnyNode[];
  }
  return [];
}
