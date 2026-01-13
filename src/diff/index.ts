/**
 * Wireframe Diff Engine
 *
 * Compares two wireframe ASTs and identifies differences.
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import type {
  DiffResult,
  DiffSummary,
  NodeChange,
  AttributeChange,
  DiffOptions,
} from './types';

// Re-export types
export * from './types';

/**
 * Attributes to skip when comparing (internal AST properties)
 */
const SKIP_ATTRIBUTES = new Set(['type', 'loc', 'children']);

/**
 * Get a node identifier for matching
 */
function getNodeIdentifier(node: AnyNode): string {
  const type = node.type;
  const label =
    ('title' in node && node.title) ||
    ('content' in node && node.content) ||
    ('label' in node && node.label) ||
    ('name' in node && node.name) ||
    '';
  return `${type}:${label}`;
}

/**
 * Get all attribute keys from a node (excluding internal ones)
 */
function getAttributeKeys(node: AnyNode): string[] {
  return Object.keys(node).filter(k => !SKIP_ATTRIBUTES.has(k));
}

/**
 * Compare two attribute values
 */
function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => areValuesEqual(v, b[i]));
  }
  if (typeof a === 'object' && a !== null && b !== null) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(k => areValuesEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

/**
 * Compare attributes between two nodes
 */
function compareAttributes(
  oldNode: AnyNode,
  newNode: AnyNode,
  options: DiffOptions
): AttributeChange[] {
  const changes: AttributeChange[] = [];
  const ignoreSet = new Set(options.ignoreAttributeNames || []);

  const oldKeys = getAttributeKeys(oldNode).filter(k => !ignoreSet.has(k));
  const newKeys = getAttributeKeys(newNode).filter(k => !ignoreSet.has(k));

  const allKeys = new Set([...oldKeys, ...newKeys]);

  for (const key of allKeys) {
    const oldValue = (oldNode as unknown as Record<string, unknown>)[key];
    const newValue = (newNode as unknown as Record<string, unknown>)[key];

    if (oldValue === undefined && newValue !== undefined) {
      changes.push({ name: key, oldValue: undefined, newValue, type: 'added' });
    } else if (oldValue !== undefined && newValue === undefined) {
      changes.push({ name: key, oldValue, newValue: undefined, type: 'removed' });
    } else if (!areValuesEqual(oldValue, newValue)) {
      changes.push({ name: key, oldValue, newValue, type: 'changed' });
    }
  }

  return changes;
}

/**
 * Count all nodes in a tree
 */
function countNodes(node: AnyNode): number {
  let count = 1;
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child === 'object' && 'type' in child) {
        count += countNodes(child as AnyNode);
      }
    }
  }
  return count;
}

/**
 * Compare two nodes and their children
 */
function compareNodes(
  oldNode: AnyNode | null,
  newNode: AnyNode | null,
  oldPath: string,
  newPath: string,
  options: DiffOptions,
  depth: number
): NodeChange | null {
  // Check max depth
  if (options.maxDepth !== undefined && depth > options.maxDepth) {
    return null;
  }

  // Node was added
  if (oldNode === null && newNode !== null) {
    return {
      type: 'added',
      newPath,
      nodeType: newNode.type,
      label: getNodeIdentifier(newNode).split(':')[1] || undefined,
      newNode,
    };
  }

  // Node was removed
  if (oldNode !== null && newNode === null) {
    return {
      type: 'removed',
      oldPath,
      nodeType: oldNode.type,
      label: getNodeIdentifier(oldNode).split(':')[1] || undefined,
      oldNode,
    };
  }

  // Both null (shouldn't happen)
  if (oldNode === null || newNode === null) {
    return null;
  }

  // Different node types = removed + added
  if (oldNode.type !== newNode.type) {
    return {
      type: 'changed',
      oldPath,
      newPath,
      nodeType: `${oldNode.type} → ${newNode.type}`,
      oldNode,
      newNode,
      attributeChanges: [
        { name: 'type', oldValue: oldNode.type, newValue: newNode.type, type: 'changed' }
      ],
    };
  }

  // Compare attributes
  const attributeChanges = options.ignoreAttributes
    ? []
    : compareAttributes(oldNode, newNode, options);

  // Compare children
  const childChanges: NodeChange[] = [];

  const oldChildren = ('children' in oldNode && Array.isArray(oldNode.children))
    ? (oldNode.children as AnyNode[]).filter(c => c && typeof c === 'object' && 'type' in c)
    : [];
  const newChildren = ('children' in newNode && Array.isArray(newNode.children))
    ? (newNode.children as AnyNode[]).filter(c => c && typeof c === 'object' && 'type' in c)
    : [];

  // Match children by identifier for better diff
  const oldChildMap = new Map<string, { node: AnyNode; index: number }[]>();
  oldChildren.forEach((child, index) => {
    const id = getNodeIdentifier(child);
    if (!oldChildMap.has(id)) oldChildMap.set(id, []);
    oldChildMap.get(id)!.push({ node: child, index });
  });

  const newChildMap = new Map<string, { node: AnyNode; index: number }[]>();
  newChildren.forEach((child, index) => {
    const id = getNodeIdentifier(child);
    if (!newChildMap.has(id)) newChildMap.set(id, []);
    newChildMap.get(id)!.push({ node: child, index });
  });

  const processedOldIndices = new Set<number>();
  const processedNewIndices = new Set<number>();

  // Match by identifier
  for (const [id, newItems] of newChildMap) {
    const oldItems = oldChildMap.get(id) || [];

    for (let i = 0; i < newItems.length; i++) {
      const newItem = newItems[i];
      const oldItem = oldItems[i];

      if (oldItem && !processedOldIndices.has(oldItem.index)) {
        // Found a match
        processedOldIndices.add(oldItem.index);
        processedNewIndices.add(newItem.index);

        const childChange = compareNodes(
          oldItem.node,
          newItem.node,
          `${oldPath}.children[${oldItem.index}]`,
          `${newPath}.children[${newItem.index}]`,
          options,
          depth + 1
        );

        if (childChange && childChange.type !== 'unchanged') {
          // Check for moved
          if (!options.ignoreOrder && oldItem.index !== newItem.index) {
            childChange.type = 'moved';
          }
          childChanges.push(childChange);
        }
      } else {
        // New child
        processedNewIndices.add(newItem.index);
        childChanges.push({
          type: 'added',
          newPath: `${newPath}.children[${newItem.index}]`,
          nodeType: newItem.node.type,
          label: id.split(':')[1] || undefined,
          newNode: newItem.node,
        });
      }
    }
  }

  // Find removed children
  for (let i = 0; i < oldChildren.length; i++) {
    if (!processedOldIndices.has(i)) {
      const oldChild = oldChildren[i];
      childChanges.push({
        type: 'removed',
        oldPath: `${oldPath}.children[${i}]`,
        nodeType: oldChild.type,
        label: getNodeIdentifier(oldChild).split(':')[1] || undefined,
        oldNode: oldChild,
      });
    }
  }

  // Determine if node changed
  const hasChanges = attributeChanges.length > 0 || childChanges.length > 0;

  if (!hasChanges) {
    return {
      type: 'unchanged',
      oldPath,
      newPath,
      nodeType: oldNode.type,
    };
  }

  return {
    type: 'changed',
    oldPath,
    newPath,
    nodeType: oldNode.type,
    label: getNodeIdentifier(oldNode).split(':')[1] || undefined,
    attributeChanges: attributeChanges.length > 0 ? attributeChanges : undefined,
    childChanges: childChanges.length > 0 ? childChanges : undefined,
    oldNode,
    newNode,
  };
}

/**
 * Flatten changes into a list
 */
function flattenChanges(change: NodeChange): NodeChange[] {
  const result: NodeChange[] = [];

  if (change.type !== 'unchanged') {
    result.push(change);
  }

  if (change.childChanges) {
    for (const childChange of change.childChanges) {
      result.push(...flattenChanges(childChange));
    }
  }

  return result;
}

/**
 * Generate human-readable description of changes
 */
function generateDescription(changes: NodeChange[]): string {
  if (changes.length === 0) {
    return 'No changes detected.';
  }

  const parts: string[] = [];

  const added = changes.filter(c => c.type === 'added');
  const removed = changes.filter(c => c.type === 'removed');
  const changed = changes.filter(c => c.type === 'changed');
  const moved = changes.filter(c => c.type === 'moved');

  if (added.length > 0) {
    parts.push(`Added ${added.length} component(s): ${added.map(c => c.nodeType).join(', ')}`);
  }
  if (removed.length > 0) {
    parts.push(`Removed ${removed.length} component(s): ${removed.map(c => c.nodeType).join(', ')}`);
  }
  if (changed.length > 0) {
    parts.push(`Modified ${changed.length} component(s)`);
  }
  if (moved.length > 0) {
    parts.push(`Reordered ${moved.length} component(s)`);
  }

  return parts.join('. ') + '.';
}

/**
 * Compare two wireframe documents
 *
 * @param oldDoc - The original document
 * @param newDoc - The modified document
 * @param options - Comparison options
 * @returns Diff result with all changes
 */
export function diff(
  oldDoc: WireframeDocument,
  newDoc: WireframeDocument,
  options: DiffOptions = {}
): DiffResult {
  const oldPages = oldDoc.children || [];
  const newPages = newDoc.children || [];

  const allChanges: NodeChange[] = [];

  // Compare pages
  const maxPages = Math.max(oldPages.length, newPages.length);

  for (let i = 0; i < maxPages; i++) {
    const oldPage = oldPages[i] as unknown as AnyNode | undefined;
    const newPage = newPages[i] as unknown as AnyNode | undefined;

    const pageChange = compareNodes(
      oldPage || null,
      newPage || null,
      `pages[${i}]`,
      `pages[${i}]`,
      options,
      0
    );

    if (pageChange) {
      allChanges.push(...flattenChanges(pageChange));
    }
  }

  // Filter out unchanged entries for the flat list
  const significantChanges = allChanges.filter(c => c.type !== 'unchanged');

  // Calculate summary
  const oldNodeCount = oldPages.reduce((sum, page) => sum + countNodes(page as unknown as AnyNode), 0);
  const newNodeCount = newPages.reduce((sum, page) => sum + countNodes(page as unknown as AnyNode), 0);

  const summary: DiffSummary = {
    oldNodeCount,
    newNodeCount,
    addedCount: significantChanges.filter(c => c.type === 'added').length,
    removedCount: significantChanges.filter(c => c.type === 'removed').length,
    changedCount: significantChanges.filter(c => c.type === 'changed').length,
    movedCount: significantChanges.filter(c => c.type === 'moved').length,
    unchangedCount: Math.max(0, oldNodeCount - significantChanges.filter(c => c.type !== 'added').length),
  };

  return {
    identical: significantChanges.length === 0,
    summary,
    changes: significantChanges,
    description: generateDescription(significantChanges),
  };
}

/**
 * Quick check if two documents are identical
 */
export function areIdentical(
  oldDoc: WireframeDocument,
  newDoc: WireframeDocument
): boolean {
  return diff(oldDoc, newDoc).identical;
}

/**
 * Get a simple change summary string
 */
export function getChangeSummary(
  oldDoc: WireframeDocument,
  newDoc: WireframeDocument
): string {
  return diff(oldDoc, newDoc).description;
}
