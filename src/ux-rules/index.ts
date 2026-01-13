/**
 * UX Rules Validation Engine
 *
 * Validates wireframe AST against UX best practices.
 * Provides actionable feedback for improving user experience.
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import type {
  UXIssue,
  UXValidationResult,
  UXValidationOptions,
  UXRule,
  UXRuleContext,
  UXRuleCategory,
  UXIssueSeverity,
} from './types';
import { allRules, getRulesForCategories, resetConsistencyTrackers } from './rules';

// Re-export types
export * from './types';
export { allRules, rulesByCategory, getRulesForCategories } from './rules';

/**
 * Severity order for filtering
 */
const SEVERITY_ORDER: Record<UXIssueSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

/**
 * Validate a wireframe document against UX rules
 *
 * @param ast - The parsed AST document
 * @param options - Validation options
 * @returns Validation result with issues and score
 */
export function validateUX(
  ast: WireframeDocument,
  options: UXValidationOptions = {}
): UXValidationResult {
  const {
    categories = [],
    minSeverity = 'info',
    maxIssues = 100,
    customRules = [],
    disabledRules = [],
  } = options;

  // Reset any stateful trackers
  resetConsistencyTrackers();

  // Get applicable rules
  let rules = categories.length > 0
    ? getRulesForCategories(categories)
    : allRules;

  // Add custom rules
  rules = [...rules, ...customRules];

  // Filter out disabled rules
  if (disabledRules.length > 0) {
    const disabledSet = new Set(disabledRules);
    rules = rules.filter(r => !disabledSet.has(r.id));
  }

  // Collect issues
  const issues: UXIssue[] = [];
  const minSeverityOrder = SEVERITY_ORDER[minSeverity];

  // Category tracking for summary
  const categoryStats = new Map<UXRuleCategory, { passed: number; failed: number; warnings: number }>();

  /**
   * Initialize category stats
   */
  function initCategoryStats(category: UXRuleCategory) {
    if (!categoryStats.has(category)) {
      categoryStats.set(category, { passed: 0, failed: 0, warnings: 0 });
    }
  }

  /**
   * Record a check result
   */
  function recordCheck(rule: UXRule, issue: UXIssue | null) {
    initCategoryStats(rule.category);
    const stats = categoryStats.get(rule.category)!;

    if (issue === null) {
      stats.passed++;
    } else if (issue.severity === 'error') {
      stats.failed++;
    } else {
      stats.warnings++;
    }
  }

  /**
   * Add issue if it meets severity threshold
   */
  function addIssue(issue: UXIssue): boolean {
    if (SEVERITY_ORDER[issue.severity] > minSeverityOrder) {
      return true; // Skip but continue
    }

    if (issues.length >= maxIssues) {
      return false; // Stop collecting
    }

    issues.push(issue);
    return true;
  }

  /**
   * Walk the AST and apply rules
   */
  function walkNode(
    node: AnyNode,
    path: string,
    parent: AnyNode | null,
    siblings: AnyNode[],
    index: number,
    depth: number
  ): boolean {
    const context: UXRuleContext = {
      path,
      parent,
      root: ast.children[0] as unknown as AnyNode,
      siblings,
      index,
      depth,
    };

    // Apply rules that match this node type
    for (const rule of rules) {
      // Check if rule applies to this node type
      if (rule.appliesTo.length > 0 && !rule.appliesTo.includes(node.type)) {
        continue;
      }

      try {
        const result = rule.check(node, context);

        if (result === null) {
          recordCheck(rule, null);
        } else if (Array.isArray(result)) {
          for (const issue of result) {
            recordCheck(rule, issue);
            if (!addIssue(issue)) return false;
          }
        } else {
          recordCheck(rule, result);
          if (!addIssue(result)) return false;
        }
      } catch (err) {
        // Rule threw an error, log and continue
        console.warn(`UX rule ${rule.id} threw error:`, err);
      }
    }

    // Recursively check children
    if ('children' in node && Array.isArray(node.children)) {
      const children = node.children as AnyNode[];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child && typeof child === 'object' && 'type' in child) {
          const shouldContinue = walkNode(
            child,
            `${path}.children[${i}]`,
            node,
            children,
            i,
            depth + 1
          );
          if (!shouldContinue) return false;
        }
      }
    }

    return true;
  }

  // Validate each page
  if (ast.children) {
    for (let i = 0; i < ast.children.length; i++) {
      const page = ast.children[i] as unknown as AnyNode;
      const children = ast.children as unknown as AnyNode[];
      walkNode(page, `pages[${i}]`, null, children, i, 0);
    }
  }

  // Calculate score (0-100)
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  // Score calculation: errors have high impact, warnings medium, info low
  const errorPenalty = errorCount * 10;
  const warningPenalty = warningCount * 3;
  const infoPenalty = infoCount * 1;
  const totalPenalty = errorPenalty + warningPenalty + infoPenalty;
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  // Build summary
  const summary = Array.from(categoryStats.entries()).map(([category, stats]) => ({
    category,
    passed: stats.passed,
    failed: stats.failed,
    warnings: stats.warnings,
  }));

  return {
    valid: errorCount === 0,
    score,
    issues,
    summary,
    severityCounts: {
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
    },
  };
}

/**
 * Quick UX validation - returns true if no errors
 *
 * @param ast - The parsed AST document
 * @returns true if no UX errors found
 */
export function isUXValid(ast: WireframeDocument): boolean {
  const result = validateUX(ast, { minSeverity: 'error', maxIssues: 1 });
  return result.valid;
}

/**
 * Get UX issues from an AST
 *
 * @param ast - The parsed AST document
 * @param options - Validation options
 * @returns Array of UX issues
 */
export function getUXIssues(
  ast: WireframeDocument,
  options?: UXValidationOptions
): UXIssue[] {
  return validateUX(ast, options).issues;
}

/**
 * Get UX score for a wireframe (0-100)
 *
 * @param ast - The parsed AST document
 * @returns UX score from 0 to 100
 */
export function getUXScore(ast: WireframeDocument): number {
  return validateUX(ast).score;
}

/**
 * Format UX validation result as human-readable string
 */
export function formatUXResult(result: UXValidationResult): string {
  const lines: string[] = [];

  lines.push(`UX Validation Score: ${result.score}/100`);
  lines.push(`Status: ${result.valid ? 'PASSED' : 'FAILED'}`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('Issues:');
    lines.push('');

    for (const issue of result.issues) {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`${icon} [${issue.ruleId}] ${issue.message}`);
      lines.push(`   Path: ${issue.path}`);
      lines.push(`   ${issue.suggestion}`);
      lines.push('');
    }
  } else {
    lines.push('No issues found.');
  }

  lines.push('Summary by category:');
  for (const cat of result.summary) {
    lines.push(`  ${cat.category}: ${cat.passed} passed, ${cat.failed} errors, ${cat.warnings} warnings`);
  }

  return lines.join('\n');
}
