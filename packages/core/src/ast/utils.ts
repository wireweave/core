/**
 * AST utility functions for wireweave
 *
 * Provides traversal and search utilities for AST nodes
 */

import type { AnyNode, DefinitionNode, PageNode, WireframeDocument, NodeType } from './types'
import { hasChildren } from './guards'

/**
 * Callback function for AST traversal
 */
export type WalkCallback = (node: AnyNode, parent?: AnyNode, depth?: number) => void | boolean

/**
 * Predicate function for finding nodes
 */
export type NodePredicate = (node: AnyNode) => boolean

/**
 * Walk through all nodes in the AST
 *
 * @param node - The starting node
 * @param callback - Function called for each node. Return false to stop traversal.
 * @param parent - Parent node (used internally)
 * @param depth - Current depth (used internally)
 */
export function walk(
  node: AnyNode,
  callback: WalkCallback,
  parent?: AnyNode,
  depth: number = 0,
): void {
  const result = callback(node, parent, depth)

  // Stop traversal if callback returns false
  if (result === false) {
    return
  }

  if (hasChildren(node)) {
    for (const child of node.children) {
      walk(child, callback, node, depth + 1)
    }
  }
}

/**
 * Walk through a document's AST
 *
 * @param document - The wireframe document
 * @param callback - Function called for each node
 */
export function walkDocument(document: WireframeDocument, callback: WalkCallback): void {
  for (const child of document.children) {
    walk(child, callback)
  }
}

/**
 * Return only the document's pages, in source order.
 *
 * Layout definitions share the document's top-level list with pages but are
 * not screens. Page-indexed consumers must use this helper so a definition
 * never becomes an accidental page.
 */
export function documentPages(document: WireframeDocument): PageNode[] {
  return document.children.filter((child): child is PageNode => child.type === 'Page')
}

/** Return the document's named layout definitions, in source order. */
export function documentDefinitions(document: WireframeDocument): DefinitionNode[] {
  return document.children.filter((child): child is DefinitionNode => child.type === 'Layout')
}

/**
 * Find the first node matching a predicate
 *
 * @param node - The starting node
 * @param predicate - Function to test each node
 * @returns The first matching node, or undefined
 */
export function find(node: AnyNode, predicate: NodePredicate): AnyNode | undefined {
  if (predicate(node)) {
    return node
  }

  if (hasChildren(node)) {
    for (const child of node.children) {
      const found = find(child, predicate)
      if (found) {
        return found
      }
    }
  }

  return undefined
}

/**
 * Find all nodes matching a predicate
 *
 * @param node - The starting node
 * @param predicate - Function to test each node
 * @returns Array of matching nodes
 */
export function findAll(node: AnyNode, predicate: NodePredicate): AnyNode[] {
  const results: AnyNode[] = []

  walk(node, (n) => {
    if (predicate(n)) {
      results.push(n)
    }
  })

  return results
}

/**
 * Find all nodes of a specific type
 *
 * @param node - The starting node
 * @param type - The node type to find
 * @returns Array of matching nodes
 */
export function findByType<T extends AnyNode>(node: AnyNode, type: NodeType): T[] {
  return findAll(node, (n) => n.type === type) as T[]
}

/**
 * Count all nodes in the AST
 *
 * @param node - The starting node
 * @returns Total number of nodes
 */
export function countNodes(node: AnyNode): number {
  let count = 0
  walk(node, () => {
    count++
  })
  return count
}

/**
 * Get the maximum depth of the AST
 *
 * @param node - The starting node
 * @returns Maximum depth
 */
export function getMaxDepth(node: AnyNode): number {
  let maxDepth = 0
  walk(node, (_n, _p, depth) => {
    if (depth !== undefined && depth > maxDepth) {
      maxDepth = depth
    }
  })
  return maxDepth
}

/**
 * Get ancestors of a node (path from root to node)
 *
 * @param root - The root node
 * @param target - The target node to find
 * @returns Array of ancestor nodes, or empty array if not found
 */
export function getAncestors(root: AnyNode, target: AnyNode): AnyNode[] {
  const path: AnyNode[] = []

  function findPath(node: AnyNode, ancestors: AnyNode[]): boolean {
    if (node === target) {
      path.push(...ancestors)
      return true
    }

    if (hasChildren(node)) {
      for (const child of node.children) {
        if (findPath(child, [...ancestors, node])) {
          return true
        }
      }
    }

    return false
  }

  findPath(root, [])
  return path
}

/**
 * Map over all nodes in the AST
 *
 * @param node - The starting node
 * @param mapper - Function to transform each node
 * @returns New AST with transformed nodes
 */
export function mapNodes<T>(node: AnyNode, mapper: (node: AnyNode) => T): T[] {
  const results: T[] = []
  walk(node, (n) => {
    results.push(mapper(n))
  })
  return results
}

/**
 * Clone an AST node (deep clone)
 *
 * @param node - The node to clone
 * @returns A deep clone of the node
 */
export function cloneNode<T extends AnyNode>(node: T): T {
  return JSON.parse(JSON.stringify(node)) as T
}

/**
 * Check if a node contains a specific child (at any depth)
 *
 * @param node - The parent node
 * @param target - The target node to find
 * @returns True if the target is found
 */
export function contains(node: AnyNode, target: AnyNode): boolean {
  if (node === target) {
    return true
  }

  if (hasChildren(node)) {
    for (const child of node.children) {
      if (contains(child, target)) {
        return true
      }
    }
  }

  return false
}

/**
 * Get all node types present in the AST
 *
 * @param node - The starting node
 * @returns Set of node types
 */
export function getNodeTypes(node: AnyNode): Set<NodeType> {
  const types = new Set<NodeType>()
  walk(node, (n) => {
    types.add(n.type)
  })
  return types
}
