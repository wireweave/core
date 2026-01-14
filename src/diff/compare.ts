/**
 * Core comparison logic for diff engine
 */

import type { AnyNode } from '../ast/types';
import type { NodeChange, DiffOptions } from './types';
import { getNodeIdentifier, compareAttributes } from './utils';

/**
 * Compare two nodes and their children
 */
export function compareNodes(
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
        { name: 'type', oldValue: oldNode.type, newValue: newNode.type, type: 'changed' },
      ],
    };
  }

  // Compare attributes
  const attributeChanges = options.ignoreAttributes
    ? []
    : compareAttributes(oldNode, newNode, options);

  // Compare children
  const childChanges: NodeChange[] = [];

  const oldChildren =
    'children' in oldNode && Array.isArray(oldNode.children)
      ? (oldNode.children as AnyNode[]).filter(c => c && typeof c === 'object' && 'type' in c)
      : [];
  const newChildren =
    'children' in newNode && Array.isArray(newNode.children)
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
export function flattenChanges(change: NodeChange): NodeChange[] {
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
