/**
 * Annotation component styles (Marker, Annotations, AnnotationItem)
 *
 * These styles create a visually distinct documentation panel
 * that is clearly separate from the wireframe UI.
 */

import type { ThemeConfig } from '../types';

export function generateAnnotationStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Annotation Components */

/* Marker - Number marker for referencing */
.${prefix}-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #2563eb;
  color: white;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  z-index: 10;
}

/* Page Wrapper - Contains page + annotations outside viewport overflow */
.${prefix}-page-wrapper {
  display: flex;
  flex-direction: column;
}

/* Annotations Panel - Documentation container */
.${prefix}-annotations {
  margin-top: 16px;
  background: #fafafa;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.${prefix}-annotations-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.${prefix}-annotations-icon {
  font-size: 16px;
}

.${prefix}-annotations-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Annotation Item - Individual entry */
.${prefix}-annotation-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.${prefix}-annotation-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.${prefix}-annotation-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.${prefix}-annotation-item-title {
  font-weight: 500;
  font-size: 13px;
  color: #374151;
}

.${prefix}-annotation-item-content {
  padding-left: 26px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.${prefix}-annotation-item-content p,
.${prefix}-annotation-item-content .${prefix}-text {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}`;
}
