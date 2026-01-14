/**
 * Analysis Types for wireweave
 *
 * Type definitions for wireframe analysis and statistics
 */

/**
 * Component usage statistics
 */
export interface ComponentStats {
  /** Component type name */
  type: string;
  /** Number of occurrences */
  count: number;
  /** Percentage of total components */
  percentage: number;
}

/**
 * Tree structure metrics
 */
export interface TreeMetrics {
  /** Total number of nodes */
  totalNodes: number;
  /** Maximum nesting depth */
  maxDepth: number;
  /** Average nesting depth */
  avgDepth: number;
  /** Number of leaf nodes (no children) */
  leafNodes: number;
  /** Number of container nodes (have children) */
  containerNodes: number;
}

/**
 * Accessibility metrics
 */
export interface AccessibilityMetrics {
  /** Overall accessibility score (0-100) */
  score: number;
  /** Number of images with alt text */
  imagesWithAlt: number;
  /** Total number of images */
  totalImages: number;
  /** Number of form inputs with labels */
  inputsWithLabels: number;
  /** Total number of form inputs */
  totalInputs: number;
  /** Number of buttons with accessible text */
  buttonsWithText: number;
  /** Total number of buttons */
  totalButtons: number;
  /** Has proper heading hierarchy */
  hasProperHeadingHierarchy: boolean;
  /** List of accessibility issues found */
  issues: string[];
}

/**
 * Complexity metrics
 */
export interface ComplexityMetrics {
  /** Overall complexity score (1-10, higher = more complex) */
  score: number;
  /** Complexity level description */
  level: 'simple' | 'moderate' | 'complex' | 'very-complex';
  /** Number of interactive elements */
  interactiveElements: number;
  /** Number of form elements */
  formElements: number;
  /** Number of navigation elements */
  navigationElements: number;
  /** Number of data display elements (tables, lists) */
  dataDisplayElements: number;
  /** Number of feedback elements (alerts, toasts, progress) */
  feedbackElements: number;
  /** Number of layout containers */
  layoutContainers: number;
}

/**
 * Layout analysis
 */
export interface LayoutAnalysis {
  /** Has header */
  hasHeader: boolean;
  /** Has footer */
  hasFooter: boolean;
  /** Has sidebar */
  hasSidebar: boolean;
  /** Has main content area */
  hasMain: boolean;
  /** Has navigation */
  hasNavigation: boolean;
  /** Number of pages */
  pageCount: number;
  /** Number of modals */
  modalCount: number;
  /** Number of sections */
  sectionCount: number;
  /** Layout pattern detected */
  layoutPattern: string;
}

/**
 * Content analysis
 */
export interface ContentAnalysis {
  /** Total text elements */
  textElements: number;
  /** Total title elements */
  titleElements: number;
  /** Total link elements */
  linkElements: number;
  /** Total image elements */
  imageElements: number;
  /** Has placeholder content */
  hasPlaceholders: boolean;
  /** Number of placeholder elements */
  placeholderCount: number;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  /** Whether analysis was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Summary statistics */
  summary: {
    /** Total component count */
    totalComponents: number;
    /** Number of unique component types */
    uniqueTypes: number;
    /** Most used component type */
    mostUsedType: string;
    /** Complexity level */
    complexityLevel: string;
    /** Accessibility score */
    accessibilityScore: number;
  };
  /** Component usage breakdown */
  components: ComponentStats[];
  /** Tree structure metrics */
  tree: TreeMetrics;
  /** Accessibility metrics */
  accessibility: AccessibilityMetrics;
  /** Complexity metrics */
  complexity: ComplexityMetrics;
  /** Layout analysis */
  layout: LayoutAnalysis;
  /** Content analysis */
  content: ContentAnalysis;
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  /** Include detailed component breakdown */
  includeComponentBreakdown?: boolean;
  /** Include accessibility analysis */
  includeAccessibility?: boolean;
  /** Include complexity analysis */
  includeComplexity?: boolean;
  /** Include layout analysis */
  includeLayout?: boolean;
  /** Include content analysis */
  includeContent?: boolean;
}
