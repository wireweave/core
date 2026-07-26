/**
 * Content UX Rules
 *
 * Rules for ensuring good content quality and text UX.
 */

import type { AnyNode } from '@wireweave/core'
import { getIconData } from '@wireweave/core'
import type { UXRule, UXRuleContext, UXIssue } from '../types'
import { MAX_BUTTON_TEXT_LENGTH, MAX_TITLE_LENGTH, PLACEHOLDER_PATTERNS } from '../constants'
import { getNodeText, hasChildren, getChildren, getNodeLocation, hasChildMatching } from '../utils'

/**
 * Check for empty text content
 */
export const emptyTextContent: UXRule = {
  id: 'content-empty-text',
  category: 'content',
  severity: 'warning',
  name: 'Avoid empty text content',
  description: 'Text elements should have meaningful content',
  appliesTo: ['Text', 'Title', 'Label'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const trimmed = getNodeText(node).trim()

    if (trimmed === '' || trimmed === '...' || trimmed === 'Lorem ipsum') {
      return {
        ruleId: 'content-empty-text',
        category: 'content',
        severity: 'warning',
        message: `${node.type} has placeholder or empty content`,
        description: 'Placeholder text should be replaced with meaningful content',
        suggestion: 'Replace with actual content or remove if not needed',
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Check for button text that is too long
 */
export const buttonTextLength: UXRule = {
  id: 'content-button-text-length',
  category: 'content',
  severity: 'info',
  name: 'Button text should be concise',
  description: 'Button labels should be short and action-oriented',
  appliesTo: ['Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = getNodeText(node)

    if (content.length > MAX_BUTTON_TEXT_LENGTH) {
      return {
        ruleId: 'content-button-text-length',
        category: 'content',
        severity: 'info',
        message: `Button text is ${content.length} characters (recommended max: ${MAX_BUTTON_TEXT_LENGTH})`,
        description: 'Long button text can be hard to read and may not fit on smaller screens',
        suggestion:
          'Use concise, action-oriented text (e.g., "Save" instead of "Click here to save your changes")',
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Check for title/heading that is too long
 */
export const titleLength: UXRule = {
  id: 'content-title-length',
  category: 'content',
  severity: 'info',
  name: 'Title should be concise',
  description: 'Titles should be short and descriptive',
  appliesTo: ['Title'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = getNodeText(node)

    if (content.length > MAX_TITLE_LENGTH) {
      return {
        ruleId: 'content-title-length',
        category: 'content',
        severity: 'info',
        message: `Title is ${content.length} characters (recommended max: ${MAX_TITLE_LENGTH})`,
        description: 'Long titles can be hard to scan and may get truncated on smaller screens',
        suggestion: 'Shorten the title and move details to a subtitle or description',
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Check for page without a title
 */
export const pageHasTitle: UXRule = {
  id: 'content-page-title',
  category: 'content',
  severity: 'warning',
  name: 'Page should have a title',
  description: 'Every page should have a clear title to orient users',
  appliesTo: ['Page'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    if (!hasChildren(node)) {
      return null
    }

    // Look for a Title component anywhere in the page
    const hasTitleElement = hasChildMatching(node, (child) => child.type === 'Title')

    if (!hasTitleElement) {
      return {
        ruleId: 'content-page-title',
        category: 'content',
        severity: 'warning',
        message: 'Page has no title',
        description: 'Users need a clear title to understand the page purpose',
        suggestion: 'Add a Title component to identify the page',
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Check for link with URL but no text
 */
export const linkHasText: UXRule = {
  id: 'content-link-text',
  category: 'content',
  severity: 'error',
  name: 'Link should have text',
  description: 'Links must have visible text for users to understand where they lead',
  appliesTo: ['Link'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = getNodeText(node).trim()
    const hasChildElements = hasChildren(node) && getChildren(node).length > 0

    if (!content && !hasChildElements) {
      return {
        ruleId: 'content-link-text',
        category: 'content',
        severity: 'error',
        message: 'Link has no visible text or content',
        description: 'Users cannot understand or interact with links that have no text',
        suggestion: 'Add descriptive text to the link',
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Check for placeholder text used as content
 */
export const noPlaceholderContent: UXRule = {
  id: 'content-no-placeholder',
  category: 'content',
  severity: 'warning',
  name: 'Avoid placeholder content',
  description: 'Placeholder text like "Lorem ipsum" should be replaced',
  appliesTo: ['Text', 'Title', 'Label', 'Button'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const content = getNodeText(node).toLowerCase()

    for (const placeholder of PLACEHOLDER_PATTERNS) {
      if (content.includes(placeholder)) {
        return {
          ruleId: 'content-no-placeholder',
          category: 'content',
          severity: 'warning',
          message: `${node.type} contains placeholder text "${placeholder}"`,
          description: 'Placeholder text should be replaced before production',
          suggestion: 'Replace with actual content',
          path: context.path,
          nodeType: node.type,
          location: getNodeLocation(node),
        }
      }
    }
    return null
  },
}

/**
 * Check that a referenced icon name resolves to a real Lucide glyph.
 *
 * Icon names come from the author: a `button`/`input` `icon=` attribute or an
 * `Icon` node's `name`. An unresolved name (typo or an invented alias like
 * `more-vertical` before it was mapped) renders as a generic "?" placeholder
 * instead of the intended glyph — a real authoring error, but not a hard
 * structural failure, so it is a `warning` (matching the icon-button a11y
 * precedent). Resolution is delegated to core's `getIconData` (exact name,
 * alias map, camelCase→kebab) so this rule never drifts from the renderer.
 */
export const unknownIcon: UXRule = {
  id: 'content-unknown-icon',
  category: 'content',
  severity: 'warning',
  name: 'Icon name should resolve to a known icon',
  description: 'Icon names must reference a valid Lucide icon so they render as a real glyph',
  appliesTo: ['Button', 'Input', 'Icon'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    // `Icon` nodes carry the name on `name`; `Button`/`Input` on `icon`.
    const iconName =
      node.type === 'Icon'
        ? 'name' in node && typeof node.name === 'string'
          ? node.name
          : undefined
        : 'icon' in node && typeof node.icon === 'string'
          ? node.icon
          : undefined

    if (!iconName || !iconName.trim()) {
      return null
    }

    if (getIconData(iconName) === undefined) {
      return {
        ruleId: 'content-unknown-icon',
        category: 'content',
        severity: 'warning',
        message: `Unknown icon name "${iconName}"`,
        description:
          'The icon name does not resolve to a known Lucide icon and will render as a "?" placeholder',
        suggestion: `Use a valid lucide kebab-case icon name (e.g. the overflow menu is "ellipsis-vertical", not "${iconName}")`,
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Check that a slider/progress `value` lies within its declared range.
 *
 * A range control whose `value` falls outside `[min, max]` renders a thumb /
 * bar pinned at an edge while still announcing the literal out-of-range number
 * (`slider "Temperature" min=0 max=1 value=70` paints a full bar but says 70) —
 * a semantic data-validity defect the parser accepts and geometry cannot see.
 *
 * Range defaults mirror the renderer (the single source of truth for how the
 * box paints), not invented numbers:
 *   - Slider: an HTML `<input type="range">` defaults `min=0`, `max=100`.
 *   - Progress: `min` is always `0`; `max` defaults to `100`
 *     (`renderProgress`: `node.max || 100`).
 * An unset `value` is not validated (nothing to fault). `warning`, matching the
 * other authoring-correctness content rules.
 */
export const controlValueRange: UXRule = {
  id: 'content-control-value-range',
  category: 'content',
  severity: 'warning',
  name: 'Control value should lie within its range',
  description: 'Slider/Progress values must fall within their declared min..max',
  appliesTo: ['Slider', 'Progress'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    let min: number
    let max: number
    let value: number

    if (node.type === 'Slider') {
      if (typeof node.value !== 'number') return null
      min = typeof node.min === 'number' ? node.min : 0
      max = typeof node.max === 'number' ? node.max : 100
      value = node.value
    } else if (node.type === 'Progress') {
      if (typeof node.value !== 'number') return null
      min = 0
      max = typeof node.max === 'number' ? node.max : 100
      value = node.value
    } else {
      return null
    }

    if (value < min || value > max) {
      const label =
        'label' in node && typeof node.label === 'string' && node.label.trim()
          ? node.label
          : node.type
      return {
        ruleId: 'content-control-value-range',
        category: 'content',
        severity: 'warning',
        message: `${node.type} "${label}" value ${value} is outside its range [${min}, ${max}]`,
        description:
          'A value outside the declared range renders a misleading control position and announces an impossible value',
        suggestion: `Set value within [${min}, ${max}], or widen min/max to include ${value}`,
        path: context.path,
        nodeType: node.type,
        location: getNodeLocation(node),
      }
    }
    return null
  },
}

/**
 * Check that a control does not duplicate an adjacent sibling text label.
 *
 * The "Temperature appears twice" defect: an explicit `text "Temperature"`
 * immediately next to a `slider "Temperature" …` renders the same label twice
 * in a row. The control already prints its own label, so the standalone text is
 * redundant noise. Matching is restricted to the control's *adjacent* siblings
 * (`index ± 1`) within the *same* parent container so unrelated repeats
 * elsewhere on the screen (a section heading reused far away) are not flagged.
 * Comparison is trimmed + case-insensitive. `warning`, like the other
 * content-correctness rules.
 */
export const duplicateControlLabel: UXRule = {
  id: 'content-duplicate-control-label',
  category: 'content',
  severity: 'warning',
  name: 'Control label should not duplicate an adjacent text',
  description: "A control's own label should not be repeated by an adjacent sibling text node",
  appliesTo: ['Slider', 'Input'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const ownLabel =
      'label' in node && typeof node.label === 'string' ? node.label.trim().toLowerCase() : ''
    if (!ownLabel) return null

    const { siblings, index } = context
    const adjacent = [siblings[index - 1], siblings[index + 1]]

    for (const sib of adjacent) {
      if (!sib || sib.type !== 'Text') continue
      const sibText = getNodeText(sib).trim().toLowerCase()
      if (sibText && sibText === ownLabel) {
        return {
          ruleId: 'content-duplicate-control-label',
          category: 'content',
          severity: 'warning',
          message: `${node.type} label duplicates an adjacent text "${getNodeText(sib).trim()}"`,
          description:
            'The control already renders this label, so the adjacent text node repeats it verbatim',
          suggestion:
            'Remove the standalone text and rely on the control label, or differentiate the two strings',
          path: context.path,
          nodeType: node.type,
          location: getNodeLocation(node),
        }
      }
    }
    return null
  },
}

/**
 * All content rules
 */
export const contentRules: UXRule[] = [
  emptyTextContent,
  buttonTextLength,
  titleLength,
  pageHasTitle,
  linkHasText,
  noPlaceholderContent,
  unknownIcon,
  controlValueRange,
  duplicateControlLabel,
]
