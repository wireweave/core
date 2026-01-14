/**
 * Tree structure metrics calculation
 */

import type { WireframeDocument, AnyNode } from '../../types';
import type { TreeMetrics } from '../types';
import { getChildren } from '../utils';

/**
 * Calculate tree structure metrics
 */
export function calculateTreeMetrics(
  doc: WireframeDocument,
  allNodes: AnyNode[]
): TreeMetrics {
  let maxDepth = 0;
  let totalDepth = 0;
  let leafNodes = 0;
  let containerNodes = 0;

  // Calculate depths
  for (const page of doc.children) {
    calculateDepthRecursive(page as AnyNode, 1, (depth, hasChildren) => {
      totalDepth += depth;
      if (depth > maxDepth) maxDepth = depth;
      if (hasChildren) {
        containerNodes++;
      } else {
        leafNodes++;
      }
    });
  }

  const totalNodes = allNodes.length;
  const avgDepth = totalNodes > 0 ? Math.round((totalDepth / totalNodes) * 10) / 10 : 0;

  return {
    totalNodes,
    maxDepth,
    avgDepth,
    leafNodes,
    containerNodes,
  };
}

/**
 * Recursively calculate depth
 */
function calculateDepthRecursive(
  node: AnyNode,
  currentDepth: number,
  callback: (depth: number, hasChildren: boolean) => void
): void {
  const children = getChildren(node);
  callback(currentDepth, children.length > 0);

  for (const child of children) {
    calculateDepthRecursive(child, currentDepth + 1, callback);
  }
}
