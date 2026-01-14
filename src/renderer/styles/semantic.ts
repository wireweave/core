/**
 * Semantic marker styles
 *
 * Styles for [component:variant] placeholders in table cells and text
 * These help visualize semantic meaning while being readable by LLMs
 */

import type { ThemeConfig } from '../types';

export function generateSemanticMarkerStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Semantic Markers */

/* Avatar marker - small circle placeholder */
.${prefix}-semantic-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--${prefix}-muted);
  color: var(--${prefix}-bg);
  font-size: 10px;
  font-weight: 600;
  vertical-align: middle;
  margin-right: 8px;
}

.${prefix}-semantic-avatar-xs { width: 16px; height: 16px; }
.${prefix}-semantic-avatar-sm { width: 24px; height: 24px; }
.${prefix}-semantic-avatar-md { width: 32px; height: 32px; }
.${prefix}-semantic-avatar-lg { width: 40px; height: 40px; }

/* Badge marker - inline status indicator (wireframe style: black/white only) */
.${prefix}-semantic-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 9999px;
  vertical-align: middle;
  background: var(--${prefix}-fg);
  color: var(--${prefix}-bg);
}

/* Dot marker - status dot (wireframe style: black/gray only) */
.${prefix}-semantic-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 6px;
  background: var(--${prefix}-fg);
}

/* Inactive/default state uses gray */
.${prefix}-semantic-dot-default { background: var(--${prefix}-muted); }

/* Icon marker placeholder */
.${prefix}-semantic-icon {
  display: inline-block;
  font-size: 12px;
  color: var(--${prefix}-muted);
  vertical-align: middle;
}

/* Unknown marker - fallback */
.${prefix}-semantic-unknown {
  display: inline-block;
  font-size: 11px;
  color: var(--${prefix}-muted);
  font-style: italic;
}

/* Avatar + text layout in table cells */
.${prefix}-cell-avatar-layout {
  display: flex;
  align-items: center;
  gap: 10px;
}

.${prefix}-cell-avatar-text {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.${prefix}-cell-avatar-text span:first-child {
  font-weight: 500;
}

.${prefix}-cell-avatar-text span:last-child:not(:first-child) {
  font-size: 12px;
  color: var(--${prefix}-muted);
}`;
}
