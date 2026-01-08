/**
 * Component-specific CSS styles for wireweave
 *
 * Detailed styles for all UI components with:
 * - Wireframe aesthetic (black/white/gray)
 * - Accessibility considerations
 * - Responsive design
 */

import type { ThemeConfig } from './types';

/**
 * Generate all component-specific CSS styles
 */
export function generateComponentStyles(_theme: ThemeConfig, prefix: string = 'wf'): string {
  const parts: string[] = [
    generateContainerStyles(prefix),
    generateTextStyles(prefix),
    generateInputStyles(_theme, prefix),
    generateButtonStyles(_theme, prefix),
    generateDisplayStyles(_theme, prefix),
    generateDataStyles(_theme, prefix),
    generateFeedbackStyles(_theme, prefix),
    generateOverlayStyles(_theme, prefix),
    generateNavigationStyles(_theme, prefix),
    generateSemanticMarkerStyles(_theme, prefix),
    generateAccessibilityStyles(prefix),
  ];

  return parts.join('\n\n');
}

/**
 * Container component styles (Card, Modal, Drawer, Accordion)
 */
function generateContainerStyles(prefix: string): string {
  return `/* Container Components */
.${prefix}-card {
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  background: var(--${prefix}-bg);
  padding: 16px;
}

/* Cards in flex rows should expand equally */
.${prefix}-row > .${prefix}-card {
  flex: 1 1 0%;
  min-width: 0;
}

.${prefix}-card-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.${prefix}-card-shadow-sm { box-shadow: var(--${prefix}-shadow-sm); }
.${prefix}-card-shadow-md { box-shadow: var(--${prefix}-shadow-md); }
.${prefix}-card-shadow-lg { box-shadow: var(--${prefix}-shadow-lg); }
.${prefix}-card-shadow-xl { box-shadow: var(--${prefix}-shadow-xl); }

.${prefix}-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.${prefix}-modal {
  background: var(--${prefix}-bg);
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  box-shadow: var(--${prefix}-shadow-xl);
  padding: 24px;
  min-width: 320px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.${prefix}-modal-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.${prefix}-drawer {
  position: fixed;
  background: var(--${prefix}-bg);
  border: 1px solid var(--${prefix}-border);
  box-shadow: var(--${prefix}-shadow-xl);
  padding: 16px;
  overflow: auto;
  z-index: 1000;
}

.${prefix}-drawer-left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  border-right: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  border-left: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-top {
  top: 0;
  left: 0;
  right: 0;
  height: auto;
  max-height: 50vh;
  border-bottom: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: auto;
  max-height: 50vh;
  border-top: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.${prefix}-accordion {
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
}

.${prefix}-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--${prefix}-border);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}

.${prefix}-accordion-header:hover {
  background: rgba(0, 0, 0, 0.02);
}

.${prefix}-accordion-content {
  padding: 16px;
}`;
}

/**
 * Text component styles
 */
function generateTextStyles(prefix: string): string {
  return `/* Text Components */
.${prefix}-text {
  margin: 0;
  line-height: 1.5;
}

.${prefix}-text-xs { font-size: 12px; }
.${prefix}-text-sm { font-size: 14px; }
.${prefix}-text-base { font-size: 16px; }
.${prefix}-text-md { font-size: 16px; }
.${prefix}-text-lg { font-size: 18px; }
.${prefix}-text-xl { font-size: 20px; }
.${prefix}-text-2xl { font-size: 24px; }
.${prefix}-text-3xl { font-size: 30px; }

.${prefix}-text-normal { font-weight: 400; }
.${prefix}-text-medium { font-weight: 500; }
.${prefix}-text-semibold { font-weight: 600; }
.${prefix}-text-bold { font-weight: 700; }

.${prefix}-text-left { text-align: left; }
.${prefix}-text-center { text-align: center; }
.${prefix}-text-right { text-align: right; }
.${prefix}-text-justify { text-align: justify; }

.${prefix}-text-muted { color: var(--${prefix}-muted); }

.${prefix}-title {
  margin: 0 0 8px 0;
  font-weight: 600;
  line-height: 1.25;
}

h1.${prefix}-title { font-size: 36px; }
h2.${prefix}-title { font-size: 30px; }
h3.${prefix}-title { font-size: 24px; }
h4.${prefix}-title { font-size: 20px; }
h5.${prefix}-title { font-size: 18px; }
h6.${prefix}-title { font-size: 16px; }

.${prefix}-link {
  color: var(--${prefix}-fg);
  text-decoration: underline;
  cursor: pointer;
}

.${prefix}-link:hover {
  opacity: 0.7;
}`;
}

/**
 * Input component styles
 */
function generateInputStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Input Components */
.${prefix}-form-field {
  margin-bottom: 16px;
}

.${prefix}-input-label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
}

.${prefix}-input,
.${prefix}-textarea,
.${prefix}-select {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  font-family: inherit;
  font-size: 14px;
  background: var(--${prefix}-bg);
  color: var(--${prefix}-fg);
  transition: border-color 0.15s ease;
}

/* Inputs in flex rows should not take full width */
.${prefix}-row > .${prefix}-input,
.${prefix}-row > .${prefix}-select {
  width: auto;
  flex: 1 1 auto;
  min-width: 120px;
}

.${prefix}-input:focus,
.${prefix}-textarea:focus,
.${prefix}-select:focus {
  outline: none;
  border-color: var(--${prefix}-fg);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.${prefix}-input:disabled,
.${prefix}-textarea:disabled,
.${prefix}-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.03);
}

.${prefix}-input::placeholder,
.${prefix}-textarea::placeholder {
  color: var(--${prefix}-muted);
}

.${prefix}-input-error {
  border-color: var(--${prefix}-danger);
}

/* Input with icon */
.${prefix}-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.${prefix}-input-wrapper .${prefix}-input {
  padding-left: 36px;
}

.${prefix}-input-icon {
  position: absolute;
  left: 12px;
  color: var(--${prefix}-muted);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.${prefix}-input-icon svg {
  width: 16px;
  height: 16px;
}

/* Input wrapper in flex rows */
.${prefix}-row > .${prefix}-input-wrapper {
  flex: 1 1 auto;
  min-width: 120px;
}

.${prefix}-textarea {
  min-height: 80px;
  resize: vertical;
}

.${prefix}-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.${prefix}-checkbox,
.${prefix}-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.${prefix}-checkbox input,
.${prefix}-radio input {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

.${prefix}-checkbox-label,
.${prefix}-radio-label {
  font-size: 14px;
}

.${prefix}-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.${prefix}-switch input[type="checkbox"] {
  appearance: none;
  width: 40px;
  height: 22px;
  background: var(--${prefix}-muted);
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.${prefix}-switch input[type="checkbox"]::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.${prefix}-switch input[type="checkbox"]:checked {
  background: var(--${prefix}-fg);
}

.${prefix}-switch input[type="checkbox"]:checked::after {
  transform: translateX(18px);
}

.${prefix}-switch-label {
  font-size: 14px;
}

.${prefix}-slider {
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--${prefix}-border);
  border-radius: 3px;
  outline: none;
}

.${prefix}-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--${prefix}-fg);
  border-radius: 50%;
  cursor: pointer;
}

.${prefix}-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--${prefix}-fg);
  border: none;
  border-radius: 50%;
  cursor: pointer;
}`;
}

/**
 * Button component styles
 */
function generateButtonStyles(_theme: ThemeConfig, prefix: string): string {
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

/**
 * Display component styles
 */
function generateDisplayStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Display Components */
.${prefix}-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 120px;
  max-width: 100%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(128, 128, 128, 0.05) 10px,
    rgba(128, 128, 128, 0.05) 20px
  );
  border: 1px dashed var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  color: var(--${prefix}-muted);
  font-size: 14px;
}

.${prefix}-image svg {
  opacity: 0.5;
}

img.${prefix}-image {
  display: block;
  border-style: solid;
  background: none;
}

.${prefix}-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0, 0, 0, 0.03) 10px,
    rgba(0, 0, 0, 0.03) 20px
  );
  border: 1px dashed var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  color: var(--${prefix}-muted);
  font-size: 14px;
}

.${prefix}-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--${prefix}-fg);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: var(--${prefix}-bg);
  overflow: hidden;
}

.${prefix}-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.${prefix}-avatar-xs { width: 24px; height: 24px; font-size: 10px; }
.${prefix}-avatar-sm { width: 32px; height: 32px; font-size: 12px; }
.${prefix}-avatar-md { width: 40px; height: 40px; font-size: 14px; }
.${prefix}-avatar-lg { width: 48px; height: 48px; font-size: 16px; }
.${prefix}-avatar-xl { width: 64px; height: 64px; font-size: 20px; }

.${prefix}-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  background: var(--${prefix}-bg);
}

.${prefix}-badge-pill {
  border-radius: 9999px;
}

/* Dot badge - circular status indicator (for empty badges) */
.${prefix}-badge-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
  background: var(--${prefix}-border);
}
.${prefix}-badge-dot.${prefix}-badge-success { background: var(--${prefix}-success); border-color: var(--${prefix}-success); }
.${prefix}-badge-dot.${prefix}-badge-warning { background: var(--${prefix}-warning); border-color: var(--${prefix}-warning); }
.${prefix}-badge-dot.${prefix}-badge-danger { background: var(--${prefix}-danger); border-color: var(--${prefix}-danger); }
.${prefix}-badge-dot.${prefix}-badge-primary { background: var(--${prefix}-primary); border-color: var(--${prefix}-primary); }

.${prefix}-badge-default { }
.${prefix}-badge-primary { background: var(--${prefix}-primary); color: white; border-color: var(--${prefix}-primary); }
.${prefix}-badge-secondary { background: var(--${prefix}-muted); color: white; border-color: var(--${prefix}-muted); }
.${prefix}-badge-success { border-color: var(--${prefix}-success); }
.${prefix}-badge-warning { border-color: var(--${prefix}-warning); }
.${prefix}-badge-danger { border-color: var(--${prefix}-danger); }
.${prefix}-badge-info { border-color: var(--${prefix}-primary); }

/* Icon badge - circular background with icon */
.${prefix}-badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  color: var(--${prefix}-fg);
}

.${prefix}-badge-icon svg {
  width: 20px;
  height: 20px;
}

/* Icon badge sizes - use higher specificity to override svg.wf-icon */
.${prefix}-badge-icon-xs { width: 24px; height: 24px; }
.${prefix}-badge-icon-xs svg.${prefix}-icon { width: 12px; height: 12px; }
.${prefix}-badge-icon-sm { width: 32px; height: 32px; }
.${prefix}-badge-icon-sm svg.${prefix}-icon { width: 16px; height: 16px; }
.${prefix}-badge-icon-md { width: 40px; height: 40px; }
.${prefix}-badge-icon-md svg.${prefix}-icon { width: 20px; height: 20px; }
.${prefix}-badge-icon-lg { width: 48px; height: 48px; }
.${prefix}-badge-icon-lg svg.${prefix}-icon { width: 24px; height: 24px; }
.${prefix}-badge-icon-xl { width: 64px; height: 64px; }
.${prefix}-badge-icon-xl svg.${prefix}-icon { width: 32px; height: 32px; }

.${prefix}-badge-icon-primary,
.${prefix}-badge-icon-success,
.${prefix}-badge-icon-warning,
.${prefix}-badge-icon-danger {
  background: rgba(0, 0, 0, 0.05);
  color: var(--${prefix}-fg);
}

.${prefix}-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  vertical-align: middle;
  flex-shrink: 0;
}

/* SVG icons - size is controlled by CSS, not HTML attributes */
svg.${prefix}-icon {
  width: 16px;
  height: 16px;
  display: block;
}

/* Icon size tokens - matches SVG renderer */
svg.${prefix}-icon-xs { width: 12px; height: 12px; }
svg.${prefix}-icon-sm { width: 16px; height: 16px; }
svg.${prefix}-icon-md { width: 20px; height: 20px; }
svg.${prefix}-icon-lg { width: 24px; height: 24px; }
svg.${prefix}-icon-xl { width: 32px; height: 32px; }

.${prefix}-icon svg {
  display: block;
}

.${prefix}-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}`;
}

/**
 * Data component styles
 */
function generateDataStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Data Components */
.${prefix}-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--${prefix}-border);
  font-size: 14px;
}

.${prefix}-table th,
.${prefix}-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--${prefix}-border);
}

.${prefix}-table th {
  background: rgba(0, 0, 0, 0.02);
  font-weight: 600;
}

.${prefix}-table-bordered th,
.${prefix}-table-bordered td {
  border: 1px solid var(--${prefix}-border);
}

.${prefix}-table-striped tbody tr:nth-child(odd) {
  background: rgba(0, 0, 0, 0.02);
}

.${prefix}-table-hover tbody tr:hover {
  background: rgba(0, 0, 0, 0.04);
}

.${prefix}-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.${prefix}-list-ordered {
  list-style: decimal;
  padding-left: 24px;
}

.${prefix}-list-none {
  list-style: none;
}

.${prefix}-list-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--${prefix}-border);
}

.${prefix}-list-item:last-child {
  border-bottom: none;
}`;
}

/**
 * Feedback component styles
 */
function generateFeedbackStyles(_theme: ThemeConfig, prefix: string): string {
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

.${prefix}-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 18px;
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

.${prefix}-progress {
  height: 8px;
  background: var(--${prefix}-border);
  border-radius: 4px;
  overflow: hidden;
}

.${prefix}-progress-bar {
  height: 100%;
  background: var(--${prefix}-fg);
  border-radius: 4px;
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
}`;
}

/**
 * Overlay component styles
 */
function generateOverlayStyles(_theme: ThemeConfig, prefix: string): string {
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

/**
 * Navigation component styles
 */
function generateNavigationStyles(_theme: ThemeConfig, prefix: string): string {
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

/**
 * Semantic marker styles
 *
 * Styles for [component:variant] placeholders in table cells and text
 * These help visualize semantic meaning while being readable by LLMs
 */
function generateSemanticMarkerStyles(_theme: ThemeConfig, prefix: string): string {
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

/**
 * Accessibility utility styles
 */
function generateAccessibilityStyles(prefix: string): string {
  return `/* Accessibility Utilities */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus visible for keyboard navigation */
.${prefix}-button:focus-visible,
.${prefix}-input:focus-visible,
.${prefix}-select:focus-visible,
.${prefix}-textarea:focus-visible,
.${prefix}-nav-link:focus-visible,
.${prefix}-tab:focus-visible {
  outline: 2px solid var(--${prefix}-fg);
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`;
}
