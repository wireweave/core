/**
 * Overlay component styles (Tooltip, Popover, Dropdown)
 */

import type { ThemeConfig } from '../types';

export function generateOverlayStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Overlay Components */
.${prefix}-tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.${prefix}-tooltip {
  position: absolute;
  padding: 6px 10px;
  background: var(--${prefix}-fg);
  color: var(--${prefix}-bg);
  font-size: 12px;
  border-radius: var(--${prefix}-radius);
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
}

.${prefix}-tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.${prefix}-tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.${prefix}-tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

.${prefix}-tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}

.${prefix}-popover {
  background: var(--${prefix}-bg);
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  box-shadow: var(--${prefix}-shadow-lg);
  min-width: 200px;
}

.${prefix}-popover-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--${prefix}-border);
  font-weight: 600;
}

.${prefix}-popover-body {
  padding: 16px;
}

.${prefix}-dropdown {
  background: var(--${prefix}-bg);
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  box-shadow: var(--${prefix}-shadow-md);
  min-width: 160px;
  padding: 4px 0;
}

.${prefix}-dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
}

.${prefix}-dropdown-item:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.${prefix}-dropdown-item-danger {
  color: var(--${prefix}-danger);
}

.${prefix}-dropdown-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}`;
}
