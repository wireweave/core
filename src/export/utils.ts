/**
 * Utility functions for export module
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import type { ExportOptions } from './types';
import { SKIP_ATTRIBUTES } from './constants';

/**
 * Get content from a node
 */
export function getNodeContent(node: AnyNode): string | undefined {
  if ('title' in node && typeof node.title === 'string') return node.title;
  if ('content' in node && typeof node.content === 'string') return node.content;
  if ('label' in node && typeof node.label === 'string') return node.label;
  if ('name' in node && node.type === 'Icon' && typeof node.name === 'string')
    return node.name;
  return undefined;
}

/**
 * Extract attributes from a node
 */
export function extractAttributes(
  node: AnyNode,
  options: ExportOptions
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(node)) {
    if (SKIP_ATTRIBUTES.has(key)) continue;

    // Skip content-like attributes (they go in content field)
    if (['title', 'content', 'label'].includes(key) && typeof value === 'string') {
      continue;
    }

    // Skip empty values unless requested
    if (!options.includeEmptyAttributes) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
    }

    attrs[key] = value;
  }

  return attrs;
}

/**
 * Count all nodes in a document
 */
export function countNodes(doc: WireframeDocument): number {
  let count = 0;

  function walk(node: AnyNode) {
    count++;
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child && typeof child === 'object' && 'type' in child) {
          walk(child as AnyNode);
        }
      }
    }
  }

  for (const page of doc.children || []) {
    walk(page as unknown as AnyNode);
  }

  return count;
}

/**
 * Get unique component types in a document
 */
export function getComponentTypes(doc: WireframeDocument): string[] {
  const types = new Set<string>();

  function walk(node: AnyNode) {
    types.add(node.type.toLowerCase());
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child && typeof child === 'object' && 'type' in child) {
          walk(child as AnyNode);
        }
      }
    }
  }

  for (const page of doc.children || []) {
    walk(page as unknown as AnyNode);
  }

  return Array.from(types).sort();
}
