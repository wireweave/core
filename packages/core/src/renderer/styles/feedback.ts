/**
 * Feedback component styles (Alert, Toast, Progress, Spinner)
 */

import type { ThemeConfig } from '../types'

export function generateFeedbackStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Feedback Components */
.${prefix}-alert {
  padding: 12px 16px;
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  margin-bottom: 16px;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.${prefix}-alert-info { border-left: 3px solid var(--${prefix}-primary); }
.${prefix}-alert-success { border-left: 3px solid var(--${prefix}-success); }
.${prefix}-alert-warning { border-left: 3px solid var(--${prefix}-warning); }
.${prefix}-alert-danger { border-left: 3px solid var(--${prefix}-danger); }

/* The alert box is already a flex row with a gap; the icon is its first item. */
.${prefix}-alert-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.${prefix}-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.5;
}

.${prefix}-alert-close:hover {
  opacity: 1;
}

.${prefix}-toast {
  padding: 12px 16px;
  background: var(--${prefix}-fg);
  color: var(--${prefix}-bg);
  border-radius: var(--${prefix}-radius);
  box-shadow: var(--${prefix}-shadow-lg);
  font-size: 14px;
}

.${prefix}-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.${prefix}-progress-wrapper .${prefix}-progress {
  flex: 1;
}

.${prefix}-progress {
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--${prefix}-border);
}

.${prefix}-progress-bar {
  height: 100%;
  background: var(--${prefix}-fg);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.${prefix}-progress-indeterminate .${prefix}-progress-bar {
  width: 30%;
  animation: ${prefix}-progress-indeterminate 1.5s ease-in-out infinite;
}

@keyframes ${prefix}-progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.${prefix}-progress-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--${prefix}-muted);
}

.${prefix}-progress-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--${prefix}-fg);
  white-space: nowrap;
  min-width: 32px;
  text-align: right;
}

.${prefix}-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--${prefix}-border);
  border-top-color: var(--${prefix}-fg);
  border-radius: 50%;
  animation: ${prefix}-spin 0.6s linear infinite;
}

.${prefix}-spinner-xs { width: 12px; height: 12px; border-width: 2px; }
.${prefix}-spinner-sm { width: 16px; height: 16px; border-width: 2px; }
.${prefix}-spinner-md { width: 24px; height: 24px; border-width: 2px; }
.${prefix}-spinner-lg { width: 32px; height: 32px; border-width: 3px; }
.${prefix}-spinner-xl { width: 48px; height: 48px; border-width: 4px; }

@keyframes ${prefix}-spin {
  to { transform: rotate(360deg); }
}`
}
