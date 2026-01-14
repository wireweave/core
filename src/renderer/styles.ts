/**
 * CSS Style Generator for wireweave
 *
 * Generates CSS classes for grid, spacing, and flex utilities
 */

import type { ThemeConfig } from './types';
import { generateComponentStyles } from './styles-components';

/**
 * Generate all CSS styles for wireframe rendering
 *
 * @param theme - Theme configuration
 * @param prefix - CSS class prefix (default: 'wf')
 * @returns Complete CSS string
 */
export function generateStyles(theme: ThemeConfig, prefix: string = 'wf'): string {
  const parts: string[] = [
    generateCssVariables(theme, prefix),
    generateBaseStyles(prefix),
    generateGridClasses(theme, prefix),
    generateSpacingClasses(theme, prefix),
    generateFlexClasses(prefix),
    generateSizeClasses(prefix),
    generateLayoutClasses(prefix),
    generateComponentStyles(theme, prefix),
  ];

  return parts.join('\n\n');
}

/**
 * Generate CSS custom properties (variables)
 */
function generateCssVariables(theme: ThemeConfig, prefix: string): string {
  return `/* wireweave CSS Variables */
:root {
  --${prefix}-primary: ${theme.colors.primary};
  --${prefix}-secondary: ${theme.colors.secondary};
  --${prefix}-success: ${theme.colors.success};
  --${prefix}-warning: ${theme.colors.warning};
  --${prefix}-danger: ${theme.colors.danger};
  --${prefix}-muted: ${theme.colors.muted};
  --${prefix}-bg: ${theme.colors.background};
  --${prefix}-fg: ${theme.colors.foreground};
  --${prefix}-border: ${theme.colors.border};
  --${prefix}-radius: ${theme.radius};
  --${prefix}-font: ${theme.fontFamily};
  --${prefix}-shadow-sm: ${theme.shadows.sm};
  --${prefix}-shadow-md: ${theme.shadows.md};
  --${prefix}-shadow-lg: ${theme.shadows.lg};
  --${prefix}-shadow-xl: ${theme.shadows.xl};
}`;
}

/**
 * Generate base page styles
 */
function generateBaseStyles(prefix: string): string {
  return `/* Base Styles */
.${prefix}-page {
  font-family: var(--${prefix}-font);
  color: var(--${prefix}-fg);
  background: var(--${prefix}-bg);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  /* Wireframe boundary visualization */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

/* Col direct child of page should fill page height */
.${prefix}-page > .${prefix}-col {
  flex: 1;
  min-height: 0;
}

/* Row containing sidebar should fill remaining space */
.${prefix}-page > .${prefix}-row:has(.${prefix}-sidebar),
.${prefix}-page > .${prefix}-row:has(.${prefix}-main),
.${prefix}-page > .${prefix}-col > .${prefix}-row:has(.${prefix}-sidebar),
.${prefix}-page > .${prefix}-col > .${prefix}-row:has(.${prefix}-main) {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.${prefix}-page *, .${prefix}-page *::before, .${prefix}-page *::after {
  box-sizing: inherit;
}

/* Page with flex layout - enables justify/align for centering content */
.${prefix}-page.${prefix}-flex,
.${prefix}-page[class*="${prefix}-justify-"],
.${prefix}-page[class*="${prefix}-align-"] {
  display: flex;
  flex-direction: column;
}

/* Page centered content (both horizontal and vertical) */
.${prefix}-page.${prefix}-page-centered {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Prevent direct children from stretching in centered pages */
.${prefix}-page.${prefix}-page-centered > * {
  flex: 0 0 auto;
}`;
}

/**
 * Generate 12-column grid classes
 */
function generateGridClasses(_theme: ThemeConfig, prefix: string): string {
  // No default gutters - use explicit gap for all spacing (px-based philosophy)
  let css = `/* Grid System - Explicit Gap Only */
.${prefix}-row {
  display: flex;
  flex-wrap: nowrap;
}

.${prefix}-col {
  display: flex;
  flex-direction: column;
  flex: 1 0 0%;
  box-sizing: border-box;
}

/* When explicit width is set, don't flex-grow */
.${prefix}-row[style*="width:"],
.${prefix}-col[style*="width:"] {
  flex: 0 0 auto;
}

`;

  // Generate column span classes (1-12)
  // Use flex-grow instead of fixed width to properly handle gaps
  for (let i = 1; i <= 12; i++) {
    css += `.${prefix}-col-${i} { flex: ${i} 0 0%; min-width: 0; }\n`;
  }

  // Note: Responsive breakpoints intentionally not implemented
  // Wireframes use fixed layouts with scale mode for preview

  return css;
}

/**
 * Generate spacing utility classes (margin and padding)
 */
function generateSpacingClasses(theme: ThemeConfig, prefix: string): string {
  const properties: Record<string, string> = {
    p: 'padding',
    pt: 'padding-top',
    pr: 'padding-right',
    pb: 'padding-bottom',
    pl: 'padding-left',
    px: 'padding-left',
    py: 'padding-top',
    m: 'margin',
    mt: 'margin-top',
    mr: 'margin-right',
    mb: 'margin-bottom',
    ml: 'margin-left',
    mx: 'margin-left',
    my: 'margin-top',
  };

  const multiAxisProps: Record<string, string[]> = {
    px: ['padding-left', 'padding-right'],
    py: ['padding-top', 'padding-bottom'],
    mx: ['margin-left', 'margin-right'],
    my: ['margin-top', 'margin-bottom'],
  };

  let css = '/* Spacing Utilities */\n';

  for (const [abbr, prop] of Object.entries(properties)) {
    for (const [value, size] of Object.entries(theme.spacing)) {
      if (multiAxisProps[abbr]) {
        const props = multiAxisProps[abbr];
        css += `.${prefix}-${abbr}-${value} { ${props.map((p) => `${p}: ${size}`).join('; ')}; }\n`;
      } else {
        css += `.${prefix}-${abbr}-${value} { ${prop}: ${size}; }\n`;
      }
    }
  }

  // Auto margin for centering
  css += `.${prefix}-mx-auto { margin-left: auto; margin-right: auto; }\n`;

  return css;
}

/**
 * Generate flexbox utility classes
 */
function generateFlexClasses(prefix: string): string {
  return `/* Flexbox Utilities */
.${prefix}-flex { display: flex; }
.${prefix}-inline-flex { display: inline-flex; }
.${prefix}-flex-row { flex-direction: row; }
.${prefix}-flex-col { flex-direction: column; }
.${prefix}-flex-row-reverse { flex-direction: row-reverse; }
.${prefix}-flex-col-reverse { flex-direction: column-reverse; }
.${prefix}-flex-wrap { flex-wrap: wrap; }
.${prefix}-flex-nowrap { flex-wrap: nowrap; }
.${prefix}-flex-1 { flex: 1 1 0%; }
.${prefix}-flex-auto { flex: 1 1 auto; }
.${prefix}-flex-none { flex: none; }
.${prefix}-justify-start { justify-content: flex-start; }
.${prefix}-justify-center { justify-content: center; }
.${prefix}-justify-end { justify-content: flex-end; }
.${prefix}-justify-between { justify-content: space-between; }
.${prefix}-justify-around { justify-content: space-around; }
.${prefix}-justify-evenly { justify-content: space-evenly; }
.${prefix}-align-start { align-items: flex-start; }
.${prefix}-align-center { align-items: center; }
.${prefix}-align-end { align-items: flex-end; }
.${prefix}-align-stretch { align-items: stretch; }
.${prefix}-align-baseline { align-items: baseline; }
.${prefix}-gap-0 { gap: 0; }
.${prefix}-gap-1 { gap: 4px; }
.${prefix}-gap-2 { gap: 8px; }
.${prefix}-gap-3 { gap: 12px; }
.${prefix}-gap-4 { gap: 16px; }
.${prefix}-gap-5 { gap: 20px; }
.${prefix}-gap-6 { gap: 24px; }
.${prefix}-gap-8 { gap: 32px; }`;
}

/**
 * Generate size utility classes
 */
function generateSizeClasses(prefix: string): string {
  return `/* Size Utilities */
.${prefix}-w-full { width: 100%; }
.${prefix}-w-auto { width: auto; }
.${prefix}-w-fit { width: fit-content; }
.${prefix}-w-screen { width: 100vw; }
.${prefix}-h-full { height: 100%; }
.${prefix}-h-auto { height: auto; }
.${prefix}-h-screen { height: 100vh; }

/* Viewport Preview Container */
.${prefix}-viewport-preview {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f4f4f5;
  border-radius: 8px;
}

/* Dark mode background for preview container */
.${prefix}-viewport-preview.dark {
  background: #18181b;
}

/* Inner wrapper for scaled viewport */
.${prefix}-viewport-wrapper {
  transform-origin: top center;
  transition: transform 0.2s ease;
}

/* Scrollable viewport (when content overflows) */
.${prefix}-page[data-scroll="true"] {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Viewport boundary indicator */
.${prefix}-viewport-preview::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  border-radius: inherit;
}

.${prefix}-viewport-preview.dark::after {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}`;
}

/**
 * Generate layout component classes
 */
function generateLayoutClasses(prefix: string): string {
  return `/* Layout Components */
.${prefix}-header {
  border-bottom: 1px solid var(--${prefix}-border);
  padding: 0 16px;
  display: flex;
  align-items: center;
  min-height: 56px;
}

.${prefix}-header > .${prefix}-row {
  flex: 1;
}

.${prefix}-header.${prefix}-no-border {
  border-bottom: none;
}

/* Header avatar - smaller size */
.${prefix}-header .${prefix}-avatar {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

/* Header icon buttons - smaller size */
.${prefix}-header .${prefix}-button-icon-only {
  padding: 6px;
}

.${prefix}-header .${prefix}-button-icon-only svg.${prefix}-icon {
  width: 18px;
  height: 18px;
}

.${prefix}-main {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Scrollable main content */
.${prefix}-main.${prefix}-scroll {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Col containing scrollable main needs min-height: 0 for scroll to work */
.${prefix}-col:has(> .${prefix}-main.${prefix}-scroll) {
  min-height: 0;
}

/* Main content should align to top, not stretch to fill */
/* But allow explicit flex=1 to override */
.${prefix}-main > .${prefix}-col:not(.${prefix}-flex-1) {
  flex: 0 0 auto;
}

.${prefix}-footer {
  border-top: 1px solid var(--${prefix}-border);
  padding: 16px;
}

.${prefix}-footer.${prefix}-no-border {
  border-top: none;
}

.${prefix}-sidebar {
  width: 256px;
  border-right: 1px solid var(--${prefix}-border);
  padding: 16px 16px 16px 20px;
  flex-shrink: 0;
  align-self: stretch;
}

.${prefix}-sidebar-right {
  border-right: none;
  border-left: 1px solid var(--${prefix}-border);
}

/* Sidebar logo area - first row with logo */
.${prefix}-sidebar > .${prefix}-row:first-child {
  margin-bottom: 24px;
}

/* Sidebar navigation links */
.${prefix}-sidebar .${prefix}-nav-link {
  font-size: 14px;
  padding: 8px 12px;
}

/* Sidebar nav link icons */
.${prefix}-sidebar .${prefix}-nav-link svg.${prefix}-icon {
  width: 18px;
  height: 18px;
}

.${prefix}-section {
  margin-bottom: 24px;
}

/* Section title in sidebar - smaller muted style */
.${prefix}-sidebar .${prefix}-section .${prefix}-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--${prefix}-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

/* Sidebar header text - prevent wrapping for logo text */
.${prefix}-sidebar .${prefix}-header .${prefix}-text {
  white-space: nowrap;
}`;
}

// Note: Component styles are now generated by styles-components.ts
