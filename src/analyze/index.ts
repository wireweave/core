/**
 * Analysis Engine for wireweave
 *
 * Provides comprehensive analysis and statistics for wireframe documents
 */

import type { WireframeDocument, AnyNode } from '../types';
import type {
  AnalysisResult,
  AnalysisOptions,
  ComponentStats,
} from './types';
import { collectNodes } from './utils';
import {
  calculateTreeMetrics,
  calculateAccessibilityMetrics,
  createEmptyAccessibilityMetrics,
  calculateComplexityMetrics,
  createEmptyComplexityMetrics,
  analyzeLayout,
  createEmptyLayoutAnalysis,
  analyzeContent,
  createEmptyContentAnalysis,
} from './metrics/index';

// Re-export types
export * from './types';

/**
 * Analyze a wireframe document
 */
export function analyze(
  doc: WireframeDocument,
  options: AnalysisOptions = {}
): AnalysisResult {
  const {
    includeComponentBreakdown = true,
    includeAccessibility = true,
    includeComplexity = true,
    includeLayout = true,
    includeContent = true,
  } = options;

  // Collect all nodes
  const allNodes: AnyNode[] = [];
  collectNodes(doc, allNodes);

  // Count components by type
  const typeCounts = new Map<string, number>();
  for (const node of allNodes) {
    const type = node.type;
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  }

  // Build component stats
  const totalComponents = allNodes.length;
  const components: ComponentStats[] = [];

  if (includeComponentBreakdown) {
    for (const [type, count] of typeCounts.entries()) {
      components.push({
        type,
        count,
        percentage: Math.round((count / totalComponents) * 100 * 10) / 10,
      });
    }
    // Sort by count descending
    components.sort((a, b) => b.count - a.count);
  }

  // Tree metrics
  const tree = calculateTreeMetrics(doc, allNodes);

  // Accessibility metrics
  const accessibility = includeAccessibility
    ? calculateAccessibilityMetrics(allNodes)
    : createEmptyAccessibilityMetrics();

  // Complexity metrics
  const complexity = includeComplexity
    ? calculateComplexityMetrics(allNodes, tree)
    : createEmptyComplexityMetrics();

  // Layout analysis
  const layout = includeLayout
    ? analyzeLayout(allNodes, typeCounts)
    : createEmptyLayoutAnalysis();

  // Content analysis
  const content = includeContent
    ? analyzeContent(allNodes, typeCounts)
    : createEmptyContentAnalysis();

  // Find most used type
  let mostUsedType = '';
  let maxCount = 0;
  for (const [type, count] of typeCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostUsedType = type;
    }
  }

  return {
    success: true,
    summary: {
      totalComponents,
      uniqueTypes: typeCounts.size,
      mostUsedType,
      complexityLevel: complexity.level,
      accessibilityScore: accessibility.score,
    },
    components,
    tree,
    accessibility,
    complexity,
    layout,
    content,
  };
}
