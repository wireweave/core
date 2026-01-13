/**
 * Navigation UX Rules
 *
 * Rules for ensuring good navigation patterns.
 */

import type { AnyNode } from '../../ast/types';
import type { UXRule, UXRuleContext, UXIssue } from '../types';

/**
 * Check for navigation with too many items
 */
export const navItemCount: UXRule = {
  id: 'nav-item-count',
  category: 'navigation',
  severity: 'warning',
  name: 'Navigation item count',
  description: 'Navigation menus with too many items can overwhelm users',
  appliesTo: ['Nav'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const MAX_NAV_ITEMS = 7; // Miller's law

    const items = 'items' in node && Array.isArray(node.items) ? node.items : [];

    if (items.length > MAX_NAV_ITEMS) {
      return {
        ruleId: 'nav-item-count',
        category: 'navigation',
        severity: 'warning',
        message: `Navigation has ${items.length} items (recommended max: ${MAX_NAV_ITEMS})`,
        description: 'Too many navigation items can overwhelm users and slow decision-making',
        suggestion: 'Group related items into categories or use a hierarchical navigation',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check for active state in navigation
 */
export const navActiveState: UXRule = {
  id: 'nav-active-state',
  category: 'navigation',
  severity: 'info',
  name: 'Navigation should show active state',
  description: 'Users should know which page they are currently on',
  appliesTo: ['Nav'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const items = 'items' in node && Array.isArray(node.items) ? node.items : [];

    if (items.length === 0) return null;

    // Check if any item has active state
    const hasActiveItem = items.some((item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        return 'active' in item && (item as { active?: boolean }).active;
      }
      return false;
    });

    if (!hasActiveItem) {
      return {
        ruleId: 'nav-active-state',
        category: 'navigation',
        severity: 'info',
        message: 'Navigation has no active state indicated',
        description: 'Users should be able to see which page/section they are currently viewing',
        suggestion: 'Add active attribute to the current navigation item',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check breadcrumb has home
 */
export const breadcrumbHasHome: UXRule = {
  id: 'nav-breadcrumb-home',
  category: 'navigation',
  severity: 'info',
  name: 'Breadcrumb should start with home',
  description: 'Breadcrumbs typically start with a home or root link',
  appliesTo: ['Breadcrumb'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const items = 'items' in node && Array.isArray(node.items) ? node.items : [];

    if (items.length === 0) return null;

    const firstItem = items[0];
    const firstLabel = typeof firstItem === 'string'
      ? firstItem.toLowerCase()
      : (firstItem as { label?: string })?.label?.toLowerCase() || '';

    const homeWords = ['home', 'dashboard', 'main', 'start'];

    if (!homeWords.some(w => firstLabel.includes(w))) {
      return {
        ruleId: 'nav-breadcrumb-home',
        category: 'navigation',
        severity: 'info',
        message: 'Breadcrumb does not start with a home/root link',
        description: 'Users expect breadcrumbs to start from a known root location',
        suggestion: 'Add "Home" or equivalent as the first breadcrumb item',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check tabs have reasonable count
 */
export const tabCount: UXRule = {
  id: 'nav-tab-count',
  category: 'navigation',
  severity: 'warning',
  name: 'Tab count',
  description: 'Too many tabs can be overwhelming',
  appliesTo: ['Tabs'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const MAX_TABS = 5;

    const items = 'items' in node && Array.isArray(node.items) ? node.items : [];
    const children = 'children' in node && Array.isArray(node.children) ? node.children : [];

    // Count tabs - items array or children with type containing 'tab'
    const childTabCount = children.filter((c: unknown) => {
      if (typeof c === 'object' && c !== null && 'type' in c) {
        return String((c as { type: string }).type).toLowerCase().includes('tab');
      }
      return false;
    }).length;

    const tabCount = items.length || childTabCount;

    if (tabCount > MAX_TABS) {
      return {
        ruleId: 'nav-tab-count',
        category: 'navigation',
        severity: 'warning',
        message: `Tabs has ${tabCount} items (recommended max: ${MAX_TABS})`,
        description: 'Too many tabs can overwhelm users and may not fit on smaller screens',
        suggestion: 'Consider using a different navigation pattern or grouping related content',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * Check dropdown has items
 */
export const dropdownHasItems: UXRule = {
  id: 'nav-dropdown-items',
  category: 'navigation',
  severity: 'warning',
  name: 'Dropdown should have items',
  description: 'Dropdown menus need items to be functional',
  appliesTo: ['Dropdown'],
  check: (node: AnyNode, context: UXRuleContext): UXIssue | null => {
    const items = 'items' in node && Array.isArray(node.items) ? node.items : [];
    const children = 'children' in node && Array.isArray(node.children) ? node.children : [];

    if (items.length === 0 && children.length === 0) {
      return {
        ruleId: 'nav-dropdown-items',
        category: 'navigation',
        severity: 'warning',
        message: 'Dropdown has no items',
        description: 'An empty dropdown provides no value to users',
        suggestion: 'Add items to the dropdown menu',
        path: context.path,
        nodeType: node.type,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      };
    }
    return null;
  },
};

/**
 * All navigation rules
 */
export const navigationRules: UXRule[] = [
  navItemCount,
  navActiveState,
  breadcrumbHasHome,
  tabCount,
  dropdownHasItems,
];
