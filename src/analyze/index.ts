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
  TreeMetrics,
  AccessibilityMetrics,
  ComplexityMetrics,
  LayoutAnalysis,
  ContentAnalysis,
} from './types';

// Re-export types
export * from './types';

// Component categories for analysis
const INTERACTIVE_COMPONENTS = ['Button', 'Link', 'Input', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider', 'Textarea'];
const FORM_COMPONENTS = ['Input', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider', 'Textarea'];
const NAVIGATION_COMPONENTS = ['Nav', 'NavItem', 'Tabs', 'Tab', 'Breadcrumb'];
const DATA_DISPLAY_COMPONENTS = ['Table', 'List', 'ListItem'];
const FEEDBACK_COMPONENTS = ['Alert', 'Toast', 'Progress', 'Spinner', 'Tooltip', 'Popover'];
const LAYOUT_COMPONENTS = ['Header', 'Footer', 'Sidebar', 'Main', 'Section', 'Row', 'Col', 'Card', 'Modal', 'Drawer', 'Accordion'];

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

/**
 * Collect all nodes from a document
 */
function collectNodes(doc: WireframeDocument, nodes: AnyNode[]): void {
  for (const page of doc.children) {
    collectNodeRecursive(page as AnyNode, nodes);
  }
}

/**
 * Recursively collect nodes
 */
function collectNodeRecursive(node: AnyNode, nodes: AnyNode[]): void {
  nodes.push(node);

  const children = getChildren(node);
  for (const child of children) {
    collectNodeRecursive(child, nodes);
  }
}

/**
 * Get children of a node
 */
function getChildren(node: AnyNode): AnyNode[] {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children as AnyNode[];
  }
  if ('items' in node && Array.isArray(node.items)) {
    return node.items as AnyNode[];
  }
  if ('tabs' in node && Array.isArray(node.tabs)) {
    return node.tabs as AnyNode[];
  }
  return [];
}

/**
 * Calculate tree structure metrics
 */
function calculateTreeMetrics(doc: WireframeDocument, allNodes: AnyNode[]): TreeMetrics {
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

/**
 * Calculate accessibility metrics
 */
function calculateAccessibilityMetrics(nodes: AnyNode[]): AccessibilityMetrics {
  let imagesWithAlt = 0;
  let totalImages = 0;
  let inputsWithLabels = 0;
  let totalInputs = 0;
  let buttonsWithText = 0;
  let totalButtons = 0;
  const issues: string[] = [];
  const headingLevels: number[] = [];

  for (const node of nodes) {
    const nodeAny = node as unknown as Record<string, unknown>;

    // Check images
    if (node.type === 'Image' || node.type === 'Placeholder') {
      totalImages++;
      if (nodeAny.alt && typeof nodeAny.alt === 'string' && nodeAny.alt.trim()) {
        imagesWithAlt++;
      } else if (node.type === 'Image') {
        issues.push('Image without alt text');
      }
    }

    // Check form inputs
    if (FORM_COMPONENTS.includes(node.type)) {
      totalInputs++;
      if (nodeAny.label && typeof nodeAny.label === 'string' && nodeAny.label.trim()) {
        inputsWithLabels++;
      } else {
        issues.push(`${node.type} without label`);
      }
    }

    // Check buttons
    if (node.type === 'Button') {
      totalButtons++;
      if (nodeAny.text && typeof nodeAny.text === 'string' && nodeAny.text.trim()) {
        buttonsWithText++;
      } else if (nodeAny.icon && typeof nodeAny.icon === 'string') {
        // Icon-only button - should have aria-label
        buttonsWithText++; // Count as ok if has icon
      } else {
        issues.push('Button without text or icon');
      }
    }

    // Check heading hierarchy
    if (node.type === 'Title') {
      const level = typeof nodeAny.level === 'number' ? nodeAny.level : 1;
      headingLevels.push(level);
    }
  }

  // Check heading hierarchy
  let hasProperHeadingHierarchy = true;
  if (headingLevels.length > 0) {
    const sorted = [...headingLevels].sort((a, b) => a - b);
    // Should start with h1 or h2 at minimum
    if (sorted[0] > 2) {
      hasProperHeadingHierarchy = false;
      issues.push('No h1 or h2 heading found');
    }
    // Check for skipped levels
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        hasProperHeadingHierarchy = false;
        issues.push('Heading levels are skipped');
        break;
      }
    }
  }

  // Calculate score (0-100)
  let score = 100;
  const weights = {
    images: 25,
    inputs: 30,
    buttons: 25,
    headings: 20,
  };

  if (totalImages > 0) {
    score -= weights.images * (1 - imagesWithAlt / totalImages);
  }
  if (totalInputs > 0) {
    score -= weights.inputs * (1 - inputsWithLabels / totalInputs);
  }
  if (totalButtons > 0) {
    score -= weights.buttons * (1 - buttonsWithText / totalButtons);
  }
  if (!hasProperHeadingHierarchy) {
    score -= weights.headings;
  }

  return {
    score: Math.max(0, Math.round(score)),
    imagesWithAlt,
    totalImages,
    inputsWithLabels,
    totalInputs,
    buttonsWithText,
    totalButtons,
    hasProperHeadingHierarchy,
    issues: [...new Set(issues)], // Remove duplicates
  };
}

/**
 * Calculate complexity metrics
 */
function calculateComplexityMetrics(nodes: AnyNode[], tree: TreeMetrics): ComplexityMetrics {
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
 * Analyze layout structure
 */
function analyzeLayout(_nodes: AnyNode[], typeCounts: Map<string, number>): LayoutAnalysis {
  const hasHeader = typeCounts.has('Header');
  const hasFooter = typeCounts.has('Footer');
  const hasSidebar = typeCounts.has('Sidebar');
  const hasMain = typeCounts.has('Main');
  const hasNavigation = typeCounts.has('Nav') || typeCounts.has('Tabs') || typeCounts.has('Breadcrumb');

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
 * Analyze content
 */
function analyzeContent(_nodes: AnyNode[], typeCounts: Map<string, number>): ContentAnalysis {
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
 * Create empty accessibility metrics
 */
function createEmptyAccessibilityMetrics(): AccessibilityMetrics {
  return {
    score: 0,
    imagesWithAlt: 0,
    totalImages: 0,
    inputsWithLabels: 0,
    totalInputs: 0,
    buttonsWithText: 0,
    totalButtons: 0,
    hasProperHeadingHierarchy: true,
    issues: [],
  };
}

/**
 * Create empty complexity metrics
 */
function createEmptyComplexityMetrics(): ComplexityMetrics {
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

/**
 * Create empty layout analysis
 */
function createEmptyLayoutAnalysis(): LayoutAnalysis {
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

/**
 * Create empty content analysis
 */
function createEmptyContentAnalysis(): ContentAnalysis {
  return {
    textElements: 0,
    titleElements: 0,
    linkElements: 0,
    imageElements: 0,
    hasPlaceholders: false,
    placeholderCount: 0,
  };
}
