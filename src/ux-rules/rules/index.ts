/**
 * UX Rules Index
 *
 * Exports all UX rules organized by category.
 */

export { accessibilityRules } from './accessibility';
export { formRules } from './form';
export { touchTargetRules } from './touch-target';
export { consistencyRules, resetConsistencyTrackers } from './consistency';
export { usabilityRules } from './usability';
export { navigationRules } from './navigation';

import { accessibilityRules } from './accessibility';
import { formRules } from './form';
import { touchTargetRules } from './touch-target';
import { consistencyRules } from './consistency';
import { usabilityRules } from './usability';
import { navigationRules } from './navigation';
import type { UXRule } from '../types';

/**
 * All built-in UX rules
 */
export const allRules: UXRule[] = [
  ...accessibilityRules,
  ...formRules,
  ...touchTargetRules,
  ...consistencyRules,
  ...usabilityRules,
  ...navigationRules,
];

/**
 * Rules organized by category
 */
export const rulesByCategory = {
  accessibility: accessibilityRules,
  form: formRules,
  'touch-target': touchTargetRules,
  consistency: consistencyRules,
  usability: usabilityRules,
  navigation: navigationRules,
};

/**
 * Get rules for specific categories
 */
export function getRulesForCategories(categories: string[]): UXRule[] {
  if (categories.length === 0) return allRules;

  return categories.flatMap(cat => {
    const rules = rulesByCategory[cat as keyof typeof rulesByCategory];
    return rules || [];
  });
}
