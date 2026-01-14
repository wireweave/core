/**
 * Utility functions for diff engine
 */

import type { AnyNode } from '../ast/types';
import type { AttributeChange, DiffOptions } from './types';
import { SKIP_ATTRIBUTES } from './constants';

/**
 * Get a node identifier for matching
 */
export function getNodeIdentifier(node: AnyNode): string {
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
export function getAttributeKeys(node: AnyNode): string[] {
  return Object.keys(node).filter(k => !SKIP_ATTRIBUTES.has(k));
}

/**
 * Compare two attribute values
 */
export function areValuesEqual(a: unknown, b: unknown): boolean {
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
    return aKeys.every(k =>
      areValuesEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k]
      )
    );
  }
  return false;
}

/**
 * Compare attributes between two nodes
 */
export function compareAttributes(
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
export function countNodes(node: AnyNode): number {
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
