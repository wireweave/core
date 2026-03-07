/**
 * Divider styles
 *
 * Horizontal and vertical separator lines
 */

export function generateDividerStyles(prefix: string = 'wf'): string {
  return `
/* Divider */
.${prefix}-divider {
  margin: 8px 0;
  border: none;
  border-top: 1px solid var(--${prefix}-border);
  flex-shrink: 0;
}

/* Vertical Divider */
.${prefix}-divider.${prefix}-divider-vertical {
  margin: 0 8px;
  border-top: none;
  border-left: 1px solid var(--${prefix}-border);
  align-self: stretch;
  width: 0;
  height: auto;
}

/* Auto vertical in row context */
.${prefix}-row > .${prefix}-divider {
  margin: 0 8px;
  border-top: none;
  border-left: 1px solid var(--${prefix}-border);
  align-self: stretch;
  width: 0;
  height: auto;
}
  `.trim();
}
