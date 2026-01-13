/**
 * Accessibility UX Rules
 *
 * Rules for ensuring wireframes are accessible.
 */

import type { AnyNode } from '../../ast/types';
import type { UXRule, UXRuleContext, UXIssue } from '../types';

/**
 * Check if input has a label
 */
export const inputRequiresLabel: UXRule = {
  id: 'a11y-input-label',
  category: 'accessibility',
  severity: 'error',
  name: 'Input requires label',
  description: 'All input fields must have a label for screen reader users',
  appliesTo: ['Input', 'Textarea', 'Select'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const hasLabel = 'label' in node && node.label;
    const hasPlaceholder = 'placeholder' in node && node.placeholder;

    if (!hasLabel) {
      return {
        ruleId: 'a11y-input-label',
        category: 'accessibility',
        severity: hasPlaceholder ? 'warning' : 'error',
        message: `${node.type} is missing a label`,
        description: 'Screen readers rely on labels to describe form fields to users',
        suggestion: hasPlaceholder
          ? 'Add a label attribute. Placeholder alone is not sufficient for accessibility'
          : 'Add a label attribute to describe this field',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check if image has alt text
 */
export const imageRequiresAlt: UXRule = {
  id: 'a11y-image-alt',
  category: 'accessibility',
  severity: 'warning',
  name: 'Image requires alt text',
  description: 'Images should have alt text for screen reader users',
  appliesTo: ['Image'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const hasAlt = 'alt' in node && node.alt;

    if (!hasAlt) {
      return {
        ruleId: 'a11y-image-alt',
        category: 'accessibility',
        severity: 'warning',
        message: 'Image is missing alt text',
        description: 'Screen readers use alt text to describe images to users',
        suggestion: 'Add an alt attribute describing the image content',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check if icon-only button has accessible label
 */
export const iconButtonRequiresLabel: UXRule = {
  id: 'a11y-icon-button-label',
  category: 'accessibility',
  severity: 'error',
  name: 'Icon-only button requires label',
  description: 'Buttons with only an icon must have an accessible label',
  appliesTo: ['Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const hasIcon = 'icon' in node && node.icon;
    const hasContent = 'content' in node && node.content && String(node.content).trim();

    if (hasIcon && !hasContent) {
      return {
        ruleId: 'a11y-icon-button-label',
        category: 'accessibility',
        severity: 'error',
        message: 'Icon-only button is missing accessible text',
        description: 'Screen readers cannot describe icon-only buttons without text',
        suggestion: 'Add text content or aria-label to describe the button action',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check if link has descriptive text
 */
export const linkRequiresDescriptiveText: UXRule = {
  id: 'a11y-link-text',
  category: 'accessibility',
  severity: 'warning',
  name: 'Link requires descriptive text',
  description: 'Links should have descriptive text that indicates where they lead',
  appliesTo: ['Link'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = 'content' in node ? String(node.content || '').toLowerCase() : '';
    const genericTexts = ['click here', 'here', 'read more', 'more', 'link'];

    if (genericTexts.includes(content.trim())) {
      return {
        ruleId: 'a11y-link-text',
        category: 'accessibility',
        severity: 'warning',
        message: 'Link has generic text that is not descriptive',
        description: 'Screen reader users often navigate by links, and generic text like "click here" is not helpful',
        suggestion: `Replace "${content}" with descriptive text that indicates the link destination`,
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check heading hierarchy
 */
export const headingHierarchy: UXRule = {
  id: 'a11y-heading-hierarchy',
  category: 'accessibility',
  severity: 'warning',
  name: 'Heading hierarchy should be sequential',
  description: 'Heading levels should not skip (e.g., h1 to h3)',
  appliesTo: ['Title'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const level = 'level' in node ? Number(node.level) : 1;

    // Find previous heading in siblings
    let prevHeadingLevel = 0;
    for (let i = 0; i < context.index; i++) {
      const sibling = context.siblings[i];
      if (sibling && sibling.type === 'Title') {
        prevHeadingLevel = 'level' in sibling ? Number(sibling.level) : 1;
      }
    }

    if (prevHeadingLevel > 0 && level > prevHeadingLevel + 1) {
      return {
        ruleId: 'a11y-heading-hierarchy',
        category: 'accessibility',
        severity: 'warning',
        message: `Heading level skipped from h${prevHeadingLevel} to h${level}`,
        description: 'Screen reader users rely on heading hierarchy to understand page structure',
        suggestion: `Use h${prevHeadingLevel + 1} instead of h${level}, or add intermediate headings`,
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * All accessibility rules
 */
export const accessibilityRules: UXRule[] = [
  inputRequiresLabel,
  imageRequiresAlt,
  iconButtonRequiresLabel,
  linkRequiresDescriptiveText,
  headingHierarchy,
];
