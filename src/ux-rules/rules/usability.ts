/**
 * Usability UX Rules
 *
 * General usability rules for better user experience.
 */

import type { AnyNode } from '../../ast/types';
import type { UXRule, UXRuleContext, UXIssue } from '../types';

/**
 * Check for empty containers
 */
export const noEmptyContainers: UXRule = {
  id: 'usability-empty-container',
  category: 'usability',
  severity: 'warning',
  name: 'Avoid empty containers',
  description: 'Containers without content may confuse users or indicate missing content',
  appliesTo: ['Card', 'Section', 'Modal', 'Drawer'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    if (!('children' in node) || !Array.isArray(node.children) || node.children.length === 0) {
      return {
        ruleId: 'usability-empty-container',
        category: 'usability',
        severity: 'warning',
        message: `${node.type} has no content`,
        description: 'Empty containers may represent incomplete design or confuse users',
        suggestion: 'Add content to this container or use a placeholder to indicate intended content',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for clear CTA (Call to Action)
 */
export const clearCTA: UXRule = {
  id: 'usability-clear-cta',
  category: 'usability',
  severity: 'info',
  name: 'Clear call to action',
  description: 'Pages should have a clear primary action for users',
  appliesTo: ['Page'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    if (!('children' in node) || !Array.isArray(node.children)) {
      return null;
    }

    // Look for a primary button anywhere in the page
    let hasPrimaryButton = false;

    function findPrimaryButton(children: AnyNode[]) {
      for (const child of children) {
        if (child.type === 'Button' && 'primary' in child && child.primary) {
          hasPrimaryButton = true;
          return;
        }
        if ('children' in child && Array.isArray(child.children)) {
          findPrimaryButton(child.children as AnyNode[]);
        }
      }
    }

    findPrimaryButton(node.children as AnyNode[]);

    if (!hasPrimaryButton) {
      return {
        ruleId: 'usability-clear-cta',
        category: 'usability',
        severity: 'info',
        message: 'Page has no primary button (CTA)',
        description: 'A clear call-to-action helps guide users to the main action',
        suggestion: 'Add a primary button for the main action on this page',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for loading states
 */
export const loadingStates: UXRule = {
  id: 'usability-loading-states',
  category: 'usability',
  severity: 'info',
  name: 'Consider loading states',
  description: 'Actions that may take time should have loading indicators',
  appliesTo: ['Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = 'content' in node ? String(node.content || '').toLowerCase() : '';
    const hasLoading = 'loading' in node;
    const isPrimary = 'primary' in node && node.primary;

    // Actions that typically involve async operations
    const asyncActions = ['submit', 'save', 'send', 'upload', 'download', 'export', 'import', 'sync', 'load'];

    if (isPrimary && asyncActions.some(a => content.includes(a)) && !hasLoading) {
      return {
        ruleId: 'usability-loading-states',
        category: 'usability',
        severity: 'info',
        message: `Button "${content}" may need a loading state`,
        description: 'Async actions should show progress to prevent double-clicks and inform users',
        suggestion: 'Consider adding a loading variant for this button when action is in progress',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for destructive action confirmation
 */
export const destructiveActionConfirmation: UXRule = {
  id: 'usability-destructive-confirm',
  category: 'usability',
  severity: 'warning',
  name: 'Destructive actions need confirmation',
  description: 'Destructive actions should have clear warning styling',
  appliesTo: ['Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = 'content' in node ? String(node.content || '').toLowerCase() : '';
    const isDanger = 'danger' in node && node.danger;

    // Destructive actions
    const destructiveWords = ['delete', 'remove', 'destroy', 'clear', 'reset', 'revoke', 'terminate'];

    if (destructiveWords.some(w => content.includes(w)) && !isDanger) {
      return {
        ruleId: 'usability-destructive-confirm',
        category: 'usability',
        severity: 'warning',
        message: `Destructive action "${content}" should use danger styling`,
        description: 'Users should be visually warned about destructive actions',
        suggestion: 'Add the danger attribute to this button',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check modal has close mechanism
 */
export const modalCloseButton: UXRule = {
  id: 'usability-modal-close',
  category: 'usability',
  severity: 'warning',
  name: 'Modal should have close mechanism',
  description: 'Users should be able to close modals easily',
  appliesTo: ['Modal'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    if (!('children' in node) || !Array.isArray(node.children)) {
      return null;
    }

    // Look for a close button or cancel button
    let hasCloseButton = false;

    function findCloseButton(children: AnyNode[]) {
      for (const child of children) {
        if (child.type === 'Button') {
          const content = 'content' in child ? String(child.content || '').toLowerCase() : '';
          const icon = 'icon' in child ? String(child.icon || '').toLowerCase() : '';
          if (['close', 'cancel', 'dismiss', 'x'].some(w => content.includes(w) || icon.includes(w))) {
            hasCloseButton = true;
            return;
          }
        }
        if (child.type === 'Icon') {
          const name = 'name' in child ? String(child.name || '').toLowerCase() : '';
          if (name === 'x' || name === 'close') {
            hasCloseButton = true;
            return;
          }
        }
        if ('children' in child && Array.isArray(child.children)) {
          findCloseButton(child.children as AnyNode[]);
        }
      }
    }

    findCloseButton(node.children as AnyNode[]);

    if (!hasCloseButton) {
      return {
        ruleId: 'usability-modal-close',
        category: 'usability',
        severity: 'warning',
        message: 'Modal has no visible close button',
        description: 'Users should have a clear way to dismiss the modal',
        suggestion: 'Add a close button (icon "x") or a "Cancel" button',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for excessive nesting depth
 */
export const maxNestingDepth: UXRule = {
  id: 'usability-nesting-depth',
  category: 'usability',
  severity: 'warning',
  name: 'Avoid excessive nesting',
  description: 'Deeply nested layouts can be confusing and hard to maintain',
  appliesTo: ['Row', 'Col', 'Card', 'Section'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const MAX_DEPTH = 6;

    if (context.depth > MAX_DEPTH) {
      return {
        ruleId: 'usability-nesting-depth',
        category: 'usability',
        severity: 'warning',
        message: `Component is nested ${context.depth} levels deep (max recommended: ${MAX_DEPTH})`,
        description: 'Excessive nesting makes layouts harder to understand and maintain',
        suggestion: 'Consider flattening the layout or breaking into separate sections',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * All usability rules
 */
export const usabilityRules: UXRule[] = [
  noEmptyContainers,
  clearCTA,
  loadingStates,
  destructiveActionConfirmation,
  modalCloseButton,
  maxNestingDepth,
];
