/**
 * Touch Target UX Rules
 *
 * Rules for ensuring interactive elements are large enough for touch.
 * Based on WCAG 2.5.5 (AAA) and Apple/Google HIG guidelines.
 */

import type { AnyNode } from '../../ast/types';
import type { UXRule, UXRuleContext, UXIssue } from '../types';

// Minimum touch target size (44x44 per WCAG AAA, 48x48 per Material Design)
const MIN_TOUCH_TARGET = 44;
// const RECOMMENDED_TOUCH_TARGET = 48; // Reserved for future AAA compliance checks

// Size presets mapping
const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
};

/**
 * Get numeric size from size attribute
 */
function getSizeValue(node: AnyNode): number | null {
  if (!('size' in node)) return null;

  const size = node.size;
  if (typeof size === 'number') return size;
  if (typeof size === 'string' && size in SIZE_MAP) return SIZE_MAP[size];

  return null;
}

/**
 * Check button touch target size
 */
export const buttonTouchTarget: UXRule = {
  id: 'touch-button-size',
  category: 'touch-target',
  severity: 'warning',
  name: 'Button touch target size',
  description: 'Buttons should be at least 44x44px for comfortable touch interaction',
  appliesTo: ['Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const size = getSizeValue(node);

    // xs and sm buttons are below minimum touch target
    if (size !== null && size < MIN_TOUCH_TARGET) {
      return {
        ruleId: 'touch-button-size',
        category: 'touch-target',
        severity: 'warning',
        message: `Button size (${size}px) is below minimum touch target (${MIN_TOUCH_TARGET}px)`,
        description: 'Small touch targets are difficult to tap on mobile devices',
        suggestion: `Use size="md" or larger for better touch accessibility`,
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check icon button touch target size
 */
export const iconButtonTouchTarget: UXRule = {
  id: 'touch-icon-button-size',
  category: 'touch-target',
  severity: 'warning',
  name: 'Icon button touch target size',
  description: 'Icon-only buttons should have adequate padding for touch',
  appliesTo: ['Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const hasIcon = 'icon' in node && node.icon;
    const hasContent = 'content' in node && node.content && String(node.content).trim();

    // Only check icon-only buttons
    if (!hasIcon || hasContent) return null;

    const size = getSizeValue(node);
    const padding = 'p' in node ? Number(node.p) * 4 : 0; // 4px base scale

    // Icon-only buttons with small size need extra attention
    if (size !== null && size < MIN_TOUCH_TARGET && padding < 8) {
      return {
        ruleId: 'touch-icon-button-size',
        category: 'touch-target',
        severity: 'warning',
        message: 'Icon-only button may have insufficient touch target',
        description: 'Icon buttons need adequate padding to meet touch target requirements',
        suggestion: 'Add padding (p=2 or more) or use a larger size',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check checkbox/radio touch target
 */
export const checkboxRadioTouchTarget: UXRule = {
  id: 'touch-checkbox-radio-size',
  category: 'touch-target',
  severity: 'info',
  name: 'Checkbox/Radio touch target',
  description: 'Checkboxes and radio buttons should be easy to tap',
  appliesTo: ['Checkbox', 'Radio'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    // Default checkbox/radio inputs are typically 16-20px
    // If there's no label, touch target is just the input itself
    const hasLabel = 'label' in node && node.label;

    if (!hasLabel) {
      return {
        ruleId: 'touch-checkbox-radio-size',
        category: 'touch-target',
        severity: 'info',
        message: `${node.type} without label has small touch target`,
        description: 'The label extends the touch target area for checkboxes and radio buttons',
        suggestion: 'Add a label to increase the touch target area',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check link touch target spacing
 */
export const linkSpacing: UXRule = {
  id: 'touch-link-spacing',
  category: 'touch-target',
  severity: 'info',
  name: 'Link spacing for touch',
  description: 'Links in close proximity can be difficult to tap accurately',
  appliesTo: ['Link'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    // Check if there are multiple links as siblings
    const siblingLinks = context.siblings.filter(s => s.type === 'Link');

    if (siblingLinks.length > 1) {
      // Check if links are in a row without adequate gap
      const parent = context.parent;
      if (parent && parent.type === 'Row') {
        const gap = 'gap' in parent ? Number(parent.gap) : 0;
        if (gap < 2) { // gap=2 = 8px minimum
          return {
            ruleId: 'touch-link-spacing',
            category: 'touch-target',
            severity: 'info',
            message: 'Multiple links in row may be too close together',
            description: 'Adjacent tap targets should have adequate spacing',
            suggestion: 'Add gap=2 or more to the parent row for better touch separation',
            path: context.path,
            nodeType: node.type,
            location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
          };
        }
      }
    }
    return null;
  },
};

/**
 * Check avatar as button touch target
 */
export const avatarTouchTarget: UXRule = {
  id: 'touch-avatar-size',
  category: 'touch-target',
  severity: 'info',
  name: 'Avatar touch target size',
  description: 'Clickable avatars should meet touch target requirements',
  appliesTo: ['Avatar'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const size = getSizeValue(node);

    // xs and sm avatars are below minimum
    if (size !== null && size < MIN_TOUCH_TARGET) {
      return {
        ruleId: 'touch-avatar-size',
        category: 'touch-target',
        severity: 'info',
        message: `Avatar size (${size}px) may be too small if clickable`,
        description: 'If this avatar is interactive, it should meet minimum touch target size',
        suggestion: 'Use size="md" or larger for clickable avatars',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * All touch target rules
 */
export const touchTargetRules: UXRule[] = [
  buttonTouchTarget,
  iconButtonTouchTarget,
  checkboxRadioTouchTarget,
  linkSpacing,
  avatarTouchTarget,
];
