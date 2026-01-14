/**
 * Content analysis
 */

import type { AnyNode } from '../../types';
import type { ContentAnalysis } from '../types';

/**
 * Analyze content
 */
export function analyzeContent(
  _nodes: AnyNode[],
  typeCounts: Map<string, number>
): ContentAnalysis {
  const textElements = typeCounts.get('Text') || 0;
  const titleElements = typeCounts.get('Title') || 0;
  const linkElements = typeCounts.get('Link') || 0;
  const imageElements = typeCounts.get('Image') || 0;
  const placeholderCount = typeCounts.get('Placeholder') || 0;

  return {
    textElements,
    titleElements,
    linkElements,
    imageElements,
    hasPlaceholders: placeholderCount > 0,
    placeholderCount,
  };
}

/**
 * Create empty content analysis
 */
export function createEmptyContentAnalysis(): ContentAnalysis {
  return {
    textElements: 0,
    titleElements: 0,
    linkElements: 0,
    imageElements: 0,
    hasPlaceholders: false,
    placeholderCount: 0,
  };
}
