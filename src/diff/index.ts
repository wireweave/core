/**
 * Wireframe Diff Engine
 *
 * Compares two wireframe ASTs and identifies differences.
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import type { DiffResult, DiffSummary, NodeChange, DiffOptions } from './types';
import { countNodes } from './utils';
import { compareNodes, flattenChanges } from './compare';
import { generateDescription } from './description';

// Re-export types
export * from './types';

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
  const oldNodeCount = oldPages.reduce(
    (sum, page) => sum + countNodes(page as unknown as AnyNode),
    0
  );
  const newNodeCount = newPages.reduce(
    (sum, page) => sum + countNodes(page as unknown as AnyNode),
    0
  );

  const summary: DiffSummary = {
    oldNodeCount,
    newNodeCount,
    addedCount: significantChanges.filter(c => c.type === 'added').length,
    removedCount: significantChanges.filter(c => c.type === 'removed').length,
    changedCount: significantChanges.filter(c => c.type === 'changed').length,
    movedCount: significantChanges.filter(c => c.type === 'moved').length,
    unchangedCount: Math.max(
      0,
      oldNodeCount - significantChanges.filter(c => c.type !== 'added').length
    ),
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
