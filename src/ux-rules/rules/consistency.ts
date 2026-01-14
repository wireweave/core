/**
 * Consistency UX Rules
 *
 * Rules for ensuring consistent UI patterns across the wireframe.
 */

import type { AnyNode } from '../../ast/types';
import type { UXRule, UXRuleContext, UXIssue } from '../types';

/**
 * Track button styles across the document
 */
const buttonStyleTracker = new Map<string, { style: string; path: string }[]>();

/**
 * Reset tracker (call before validating a new document)
 */
export function resetConsistencyTrackers() {
  buttonStyleTracker.clear();
}

/**
 * Get button style
 */
function getButtonStyle(node: AnyNode): string {
  if ('primary' in node && node.primary) return 'primary';
  if ('secondary' in node && node.secondary) return 'secondary';
  if ('outline' in node && node.outline) return 'outline';
  if ('ghost' in node && node.ghost) return 'ghost';
  if ('danger' in node && node.danger) return 'danger';
  return 'default';
}

/**
 * Check for mixed button styles in same context
 */
export const consistentButtonStyles: UXRule = {
  id: 'consistency-button-styles',
  category: 'consistency',
  severity: 'info',
  name: 'Consistent button styles',
  description: 'Action buttons in the same context should use consistent styling',
  appliesTo: ['Row', 'Col', 'Card', 'Modal'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    if (!('children' in node) || !Array.isArray(node.children)) {
      return null;
    }

    // Find all direct button children
    const buttons = (node.children as AnyNode[]).filter(c => c.type === 'Button');
    if (buttons.length < 2) return null;

    // Check for primary/secondary pattern (common and expected)
    const styles = buttons.map(b => getButtonStyle(b));
    const uniqueStyles = [...new Set(styles)];

    // Primary + outline/ghost is a common pattern (primary action + secondary action)
    const hasCommonPattern =
      (uniqueStyles.length === 2 &&
        uniqueStyles.includes('primary') &&
        (uniqueStyles.includes('outline') || uniqueStyles.includes('ghost'))) ||
      (uniqueStyles.length === 2 &&
        uniqueStyles.includes('primary') &&
        uniqueStyles.includes('secondary'));

    if (hasCommonPattern) return null;

    // Multiple different styles might indicate inconsistency
    if (uniqueStyles.length > 2) {
      return {
        ruleId: 'consistency-button-styles',
        category: 'consistency',
        severity: 'info',
        message: `Multiple button styles (${uniqueStyles.join(', ')}) in same container`,
        description: 'Using many different button styles can confuse users about action hierarchy',
        suggestion: 'Use primary for main action, outline/ghost for secondary actions',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for consistent spacing
 */
export const consistentSpacing: UXRule = {
  id: 'consistency-spacing',
  category: 'consistency',
  severity: 'info',
  name: 'Consistent spacing',
  description: 'Spacing should be consistent across similar elements',
  appliesTo: ['Row', 'Col'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    // Check if siblings have varying gap values
    const siblingRows = context.siblings.filter(s => s.type === node.type);
    if (siblingRows.length < 2) return null;

    const gaps = siblingRows.map(r => 'gap' in r ? Number(r.gap) : null).filter(g => g !== null);
    const uniqueGaps = [...new Set(gaps)];

    if (uniqueGaps.length > 2) {
      return {
        ruleId: 'consistency-spacing',
        category: 'consistency',
        severity: 'info',
        message: 'Sibling containers have inconsistent gap values',
        description: 'Consistent spacing creates visual harmony and rhythm',
        suggestion: 'Use the same gap value for sibling containers',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for consistent card styling
 */
export const consistentCardStyling: UXRule = {
  id: 'consistency-card-styling',
  category: 'consistency',
  severity: 'info',
  name: 'Consistent card styling',
  description: 'Cards in the same context should have consistent visual treatment',
  appliesTo: ['Card'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const siblingCards = context.siblings.filter(s => s.type === 'Card');
    if (siblingCards.length < 2) return null;

    // Compare shadow, border, padding
    const hasShadow = 'shadow' in node && node.shadow;
    const hasBorder = 'border' in node && node.border;
    const padding = 'p' in node ? Number(node.p) : null;

    let inconsistencies: string[] = [];

    for (const sibling of siblingCards) {
      if (sibling === node) continue;

      const sibShadow = 'shadow' in sibling && sibling.shadow;
      const sibBorder = 'border' in sibling && sibling.border;
      const sibPadding = 'p' in sibling ? Number(sibling.p) : null;

      if (!!hasShadow !== !!sibShadow) inconsistencies.push('shadow');
      if (!!hasBorder !== !!sibBorder) inconsistencies.push('border');
      if (padding !== sibPadding) inconsistencies.push('padding');
    }

    if (inconsistencies.length > 0) {
      const uniqueIssues = [...new Set(inconsistencies)];
      return {
        ruleId: 'consistency-card-styling',
        category: 'consistency',
        severity: 'info',
        message: `Cards have inconsistent ${uniqueIssues.join(', ')}`,
        description: 'Consistent card styling helps users understand that cards are related',
        suggestion: 'Apply the same visual treatment to sibling cards',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for consistent alert/feedback styling
 */
export const consistentAlertVariants: UXRule = {
  id: 'consistency-alert-variants',
  category: 'consistency',
  severity: 'warning',
  name: 'Consistent alert variants',
  description: 'Alerts should use appropriate variants for their purpose',
  appliesTo: ['Alert'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = 'content' in node ? String(node.content || '').toLowerCase() : '';
    const variant = 'variant' in node ? String(node.variant || '') : '';

    // Check if variant matches content
    const errorWords = ['error', 'fail', 'invalid', 'wrong', 'denied'];
    const successWords = ['success', 'saved', 'created', 'updated', 'complete'];
    const warningWords = ['warning', 'caution', 'attention', 'note'];

    if (errorWords.some(w => content.includes(w)) && variant !== 'danger') {
      return {
        ruleId: 'consistency-alert-variants',
        category: 'consistency',
        severity: 'warning',
        message: 'Error message should use danger variant',
        description: 'Users expect error messages to be visually distinct (usually red)',
        suggestion: 'Add variant=danger to this error alert',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }

    if (successWords.some(w => content.includes(w)) && variant !== 'success') {
      return {
        ruleId: 'consistency-alert-variants',
        category: 'consistency',
        severity: 'warning',
        message: 'Success message should use success variant',
        description: 'Users expect success messages to be visually distinct (usually green)',
        suggestion: 'Add variant=success to this success alert',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }

    if (warningWords.some(w => content.includes(w)) && variant !== 'warning') {
      return {
        ruleId: 'consistency-alert-variants',
        category: 'consistency',
        severity: 'info',
        message: 'Warning message should use warning variant',
        description: 'Users expect warning messages to be visually distinct (usually yellow/orange)',
        suggestion: 'Add variant=warning to this warning alert',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }

    return null;
  },
};

/**
 * All consistency rules
 */
export const consistencyRules: UXRule[] = [
  consistentButtonStyles,
  consistentSpacing,
  consistentCardStyling,
  consistentAlertVariants,
];
