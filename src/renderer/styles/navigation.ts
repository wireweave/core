/**
 * Navigation component styles (Nav, Tabs, Breadcrumb)
 */

import type { ThemeConfig } from '../types';

export function generateNavigationStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Navigation Components */
.${prefix}-nav {
  display: flex;
  gap: 4px;
}

.${prefix}-nav-vertical {
  flex-direction: column;
}

.${prefix}-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: var(--${prefix}-fg);
  text-decoration: none;
  border-radius: var(--${prefix}-radius);
  font-size: 14px;
  transition: background-color 0.15s ease;
}

.${prefix}-nav-link:hover {
  background: rgba(0, 0, 0, 0.05);
}

.${prefix}-nav-link-active {
  background: rgba(0, 0, 0, 0.08);
  font-weight: 500;
}

.${prefix}-nav-link-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.${prefix}-nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.${prefix}-nav-group-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--${prefix}-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 16px 4px;
}

.${prefix}-nav-divider {
  margin: 8px 0;
  border: none;
  border-top: 1px solid var(--${prefix}-border);
}

.${prefix}-tabs {
  border-bottom: 1px solid var(--${prefix}-border);
}

.${prefix}-tab-list {
  display: flex;
  gap: 0;
  margin-bottom: -1px;
}

.${prefix}-tab {
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 14px;
  color: var(--${prefix}-fg);
  cursor: pointer;
  transition: all 0.15s ease;
}

.${prefix}-tab:hover {
  background: rgba(128, 128, 128, 0.1);
}

.${prefix}-tab-active {
  border-bottom-color: var(--${prefix}-fg);
  font-weight: 500;
}

.${prefix}-breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.${prefix}-breadcrumb-item {
  color: var(--${prefix}-fg);
  text-decoration: none;
}

.${prefix}-breadcrumb-item:hover {
  text-decoration: underline;
}

.${prefix}-breadcrumb-item[aria-current="page"] {
  color: var(--${prefix}-muted);
}

.${prefix}-breadcrumb-separator {
  margin: 0 8px;
  color: var(--${prefix}-muted);
}`;
}
