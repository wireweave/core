/**
 * Accessibility UX Rules
 *
 * Rules for ensuring wireframes are accessible.
 */

import type { AnyNode } from '@wireweave/core'
import type { UXRule, UXRuleContext, UXIssue } from '../types'
import { GENERIC_LINK_TEXTS } from '../constants'
import { getNodeText, getNodeLocation } from '../utils'

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
    const hasLabel = 'label' in node && node.label
    const hasPlaceholder = 'placeholder' in node && node.placeholder

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
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

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
    const hasAlt = 'alt' in node && node.alt

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
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Read an explicit accessible-name attribute off a node.
 *
 * A button's accessible name (WCAG 4.1.2) can come from an `aria` / `aria-label`
 * attribute or, at lower priority, a `title`. These are first-class on
 * `ButtonNode` in `@wireweave/core` and are rendered as `aria-label` / `title`.
 */
function getAccessibleNameAttr(node: AnyNode): string {
  const record = node as unknown as Record<string, unknown>
  const candidates = [record.aria, record['aria-label'], record.title]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/**
 * Check if icon-only button has an accessible name.
 *
 * Recalibrated for wireframes (default severity `warning`, not `error`): a
 * wireframe is a low-fidelity sketch and a missing accessible name on an
 * icon-only placeholder should not hard-fail the document's `valid` gate.
 *
 * - An icon-only button WITH an accessible-name attribute (`aria` / `aria-label`
 *   / `title`) — or with visible text — passes (no issue).
 * - An icon-only button with NO accessible name is reported as a `warning`
 *   (an improvement to make, not a blocking defect for a wireframe).
 */
export const iconButtonRequiresLabel: UXRule = {
  id: 'a11y-icon-button-label',
  category: 'accessibility',
  severity: 'warning',
  name: 'Icon-only button should have an accessible name',
  description: 'Buttons with only an icon should have an accessible name (aria-label or title)',
  appliesTo: ['Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const hasIcon = 'icon' in node && node.icon
    const hasContent = getNodeText(node).trim()
    const hasAccessibleName = getAccessibleNameAttr(node)

    if (hasIcon && !hasContent && !hasAccessibleName) {
      return {
        ruleId: 'a11y-icon-button-label',
        category: 'accessibility',
        severity: 'warning',
        message: 'Icon-only button is missing an accessible name',
        description: 'Screen readers cannot describe icon-only buttons without an accessible name',
        suggestion:
          'Add an aria attribute (e.g. button "" icon="search" aria="Search") or text content',
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

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
    const content = getNodeText(node).toLowerCase()

    if (GENERIC_LINK_TEXTS.includes(content.trim())) {
      return {
        ruleId: 'a11y-link-text',
        category: 'accessibility',
        severity: 'warning',
        message: 'Link has generic text that is not descriptive',
        description:
          'Screen reader users often navigate by links, and generic text like "click here" is not helpful',
        suggestion: `Replace "${content}" with descriptive text that indicates the link destination`,
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

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
    const level = 'level' in node ? Number(node.level) : 1

    // Find previous heading in siblings
    let prevHeadingLevel = 0
    for (let i = 0; i < context.index; i++) {
      const sibling = context.siblings[i]
      if (sibling && sibling.type === 'Title') {
        prevHeadingLevel = 'level' in sibling ? Number(sibling.level) : 1
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
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * All accessibility rules
 */
export const accessibilityRules: UXRule[] = [
  inputRequiresLabel,
  imageRequiresAlt,
  iconButtonRequiresLabel,
  linkRequiresDescriptiveText,
  headingHierarchy,
]
