/**
 * Accessibility metrics calculation
 */

import type { AnyNode } from '../../types';
import type { AccessibilityMetrics } from '../types';
import { FORM_COMPONENTS } from '../constants';

/**
 * Calculate accessibility metrics
 */
export function calculateAccessibilityMetrics(nodes: AnyNode[]): AccessibilityMetrics {
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
 * Create empty accessibility metrics
 */
export function createEmptyAccessibilityMetrics(): AccessibilityMetrics {
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
