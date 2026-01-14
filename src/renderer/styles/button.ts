/**
 * Button component styles
 */

import type { ThemeConfig } from '../types';

export function generateButtonStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Button Components */
.${prefix}-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  background: var(--${prefix}-bg);
  color: var(--${prefix}-fg);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.${prefix}-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.${prefix}-button:active:not(:disabled) {
  transform: translateY(1px);
}

.${prefix}-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2);
}

.${prefix}-button-primary {
  background: var(--${prefix}-fg);
  color: var(--${prefix}-bg);
  border-color: var(--${prefix}-fg);
}

.${prefix}-button-primary:hover:not(:disabled) {
  opacity: 0.9;
  background: var(--${prefix}-fg);
}

.${prefix}-button-secondary {
  background: var(--${prefix}-muted);
  color: var(--${prefix}-bg);
  border-color: var(--${prefix}-muted);
}

.${prefix}-button-outline {
  background: transparent;
}

.${prefix}-button-outline:hover:not(:disabled) {
  background: var(--${prefix}-fg);
  color: var(--${prefix}-bg);
}

.${prefix}-button-ghost {
  border-color: transparent;
  background: transparent;
}

.${prefix}-button-ghost:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.${prefix}-button-danger {
  color: var(--${prefix}-danger);
  border-color: var(--${prefix}-danger);
}

.${prefix}-button-danger:hover:not(:disabled) {
  background: var(--${prefix}-danger);
  color: white;
}

.${prefix}-button-xs { padding: 4px 8px; font-size: 12px; }
.${prefix}-button-sm { padding: 6px 12px; font-size: 13px; }
.${prefix}-button-md { padding: 8px 16px; font-size: 14px; }
.${prefix}-button-lg { padding: 10px 20px; font-size: 16px; }
.${prefix}-button-xl { padding: 12px 24px; font-size: 18px; }

/* Icon-only button (square padding) */
.${prefix}-button-icon-only { padding: 8px; }
.${prefix}-button-icon-only.${prefix}-button-xs { padding: 4px; }
.${prefix}-button-icon-only.${prefix}-button-sm { padding: 6px; }
.${prefix}-button-icon-only.${prefix}-button-md { padding: 8px; }
.${prefix}-button-icon-only.${prefix}-button-lg { padding: 10px; }
.${prefix}-button-icon-only.${prefix}-button-xl { padding: 12px; }

/* Button icon sizes - scale icon based on button size */
.${prefix}-button svg.${prefix}-icon { width: 16px; height: 16px; }
.${prefix}-button-xs svg.${prefix}-icon { width: 12px; height: 12px; }
.${prefix}-button-sm svg.${prefix}-icon { width: 14px; height: 14px; }
.${prefix}-button-md svg.${prefix}-icon { width: 16px; height: 16px; }
.${prefix}-button-lg svg.${prefix}-icon { width: 20px; height: 20px; }
.${prefix}-button-xl svg.${prefix}-icon { width: 24px; height: 24px; }

.${prefix}-button-disabled,
.${prefix}-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.${prefix}-button-loading {
  position: relative;
  color: transparent;
}

.${prefix}-button-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${prefix}-spin 0.6s linear infinite;
}

/* Button justify overrides - higher specificity to override default center */
.${prefix}-button.${prefix}-justify-start { justify-content: flex-start; }
.${prefix}-button.${prefix}-justify-end { justify-content: flex-end; }
.${prefix}-button.${prefix}-justify-between { justify-content: space-between; }`;
}
