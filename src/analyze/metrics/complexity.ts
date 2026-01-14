/**
 * Complexity metrics calculation
 */

import type { AnyNode } from '../../types';
import type { ComplexityMetrics, TreeMetrics } from '../types';
import {
  INTERACTIVE_COMPONENTS,
  FORM_COMPONENTS,
  NAVIGATION_COMPONENTS,
  DATA_DISPLAY_COMPONENTS,
  FEEDBACK_COMPONENTS,
  LAYOUT_COMPONENTS,
} from '../constants';

/**
 * Calculate complexity metrics
 */
export function calculateComplexityMetrics(
  nodes: AnyNode[],
  tree: TreeMetrics
): ComplexityMetrics {
  let interactiveElements = 0;
  let formElements = 0;
  let navigationElements = 0;
  let dataDisplayElements = 0;
  let feedbackElements = 0;
  let layoutContainers = 0;

  for (const node of nodes) {
    const type = node.type;

    if (INTERACTIVE_COMPONENTS.includes(type)) interactiveElements++;
    if (FORM_COMPONENTS.includes(type)) formElements++;
    if (NAVIGATION_COMPONENTS.includes(type)) navigationElements++;
    if (DATA_DISPLAY_COMPONENTS.includes(type)) dataDisplayElements++;
    if (FEEDBACK_COMPONENTS.includes(type)) feedbackElements++;
    if (LAYOUT_COMPONENTS.includes(type)) layoutContainers++;
  }

  // Calculate complexity score (1-10)
  let score = 1;

  // Component count factor
  if (tree.totalNodes > 50) score += 2;
  else if (tree.totalNodes > 20) score += 1;

  // Depth factor
  if (tree.maxDepth > 6) score += 2;
  else if (tree.maxDepth > 4) score += 1;

  // Interactive elements factor
  if (interactiveElements > 15) score += 2;
  else if (interactiveElements > 5) score += 1;

  // Form complexity
  if (formElements > 10) score += 1;

  // Navigation complexity
  if (navigationElements > 5) score += 1;

  // Data display complexity
  if (dataDisplayElements > 3) score += 1;

  score = Math.min(10, score);

  // Determine level
  let level: 'simple' | 'moderate' | 'complex' | 'very-complex';
  if (score <= 2) level = 'simple';
  else if (score <= 4) level = 'moderate';
  else if (score <= 7) level = 'complex';
  else level = 'very-complex';

  return {
    score,
    level,
    interactiveElements,
    formElements,
    navigationElements,
    dataDisplayElements,
    feedbackElements,
    layoutContainers,
  };
}

/**
 * Create empty complexity metrics
 */
export function createEmptyComplexityMetrics(): ComplexityMetrics {
  return {
    score: 1,
    level: 'simple',
    interactiveElements: 0,
    formElements: 0,
    navigationElements: 0,
    dataDisplayElements: 0,
    feedbackElements: 0,
    layoutContainers: 0,
  };
}
