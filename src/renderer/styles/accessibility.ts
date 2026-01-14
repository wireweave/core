/**
 * Accessibility utility styles
 */

export function generateAccessibilityStyles(prefix: string): string {
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
