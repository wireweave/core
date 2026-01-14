/**
 * Diff Types
 *
 * Types for comparing two wireframe ASTs.
 */

import type { AnyNode } from '../ast/types';

/**
 * Type of change
 */
export type DiffChangeType = 'added' | 'removed' | 'changed' | 'moved' | 'unchanged';

/**
 * Change to a specific attribute
 */
export interface AttributeChange {
  name: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'changed';
}

/**
 * Change to a node
 */
export interface NodeChange {
  /** Type of change */
  type: DiffChangeType;
  /** Path in the old tree */
  oldPath?: string;
  /** Path in the new tree */
  newPath?: string;
  /** Node type */
  nodeType: string;
  /** Content/label of the node (for identification) */
  label?: string;
  /** Changed attributes (if type is 'changed') */
  attributeChanges?: AttributeChange[];
  /** Child changes (nested) */
  childChanges?: NodeChange[];
  /** Old node (if removed or changed) */
  oldNode?: AnyNode;
  /** New node (if added or changed) */
  newNode?: AnyNode;
}

/**
 * Diff result summary
 */
export interface DiffSummary {
  /** Total nodes in old tree */
  oldNodeCount: number;
  /** Total nodes in new tree */
  newNodeCount: number;
  /** Number of added nodes */
  addedCount: number;
  /** Number of removed nodes */
  removedCount: number;
  /** Number of changed nodes */
  changedCount: number;
  /** Number of moved nodes */
  movedCount: number;
  /** Number of unchanged nodes */
  unchangedCount: number;
}

/**
 * Complete diff result
 */
export interface DiffResult {
  /** Whether the trees are identical */
  identical: boolean;
  /** Summary statistics */
  summary: DiffSummary;
  /** List of all changes */
  changes: NodeChange[];
  /** Human-readable description of changes */
  description: string;
}

/**
 * Diff options
 */
export interface DiffOptions {
  /** Ignore attribute changes */
  ignoreAttributes?: boolean;
  /** Specific attributes to ignore */
  ignoreAttributeNames?: string[];
  /** Ignore node order changes */
  ignoreOrder?: boolean;
  /** Maximum depth to compare */
  maxDepth?: number;
}
