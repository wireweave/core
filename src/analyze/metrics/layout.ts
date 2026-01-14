/**
 * Layout analysis
 */

import type { AnyNode } from '../../types';
import type { LayoutAnalysis } from '../types';

/**
 * Analyze layout structure
 */
export function analyzeLayout(
  _nodes: AnyNode[],
  typeCounts: Map<string, number>
): LayoutAnalysis {
  const hasHeader = typeCounts.has('Header');
  const hasFooter = typeCounts.has('Footer');
  const hasSidebar = typeCounts.has('Sidebar');
  const hasMain = typeCounts.has('Main');
  const hasNavigation =
    typeCounts.has('Nav') || typeCounts.has('Tabs') || typeCounts.has('Breadcrumb');

  const pageCount = typeCounts.get('Page') || 0;
  const modalCount = typeCounts.get('Modal') || 0;
  const sectionCount = typeCounts.get('Section') || 0;

  // Detect layout pattern
  let layoutPattern = 'custom';
  if (hasHeader && hasMain && hasFooter) {
    if (hasSidebar) {
      layoutPattern = 'holy-grail'; // Header + Sidebar + Main + Footer
    } else {
      layoutPattern = 'standard'; // Header + Main + Footer
    }
  } else if (hasHeader && hasMain) {
    if (hasSidebar) {
      layoutPattern = 'dashboard'; // Header + Sidebar + Main
    } else {
      layoutPattern = 'simple-header'; // Header + Main
    }
  } else if (hasSidebar && hasMain) {
    layoutPattern = 'sidebar-layout'; // Sidebar + Main
  } else if (hasMain) {
    layoutPattern = 'single-column'; // Just Main
  }

  return {
    hasHeader,
    hasFooter,
    hasSidebar,
    hasMain,
    hasNavigation,
    pageCount,
    modalCount,
    sectionCount,
    layoutPattern,
  };
}

/**
 * Create empty layout analysis
 */
export function createEmptyLayoutAnalysis(): LayoutAnalysis {
  return {
    hasHeader: false,
    hasFooter: false,
    hasSidebar: false,
    hasMain: false,
    hasNavigation: false,
    pageCount: 0,
    modalCount: 0,
    sectionCount: 0,
    layoutPattern: 'unknown',
  };
}
