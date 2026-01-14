/**
 * Text component styles (Text, Title, Link)
 */

export function generateTextStyles(prefix: string): string {
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

/* Remove bottom margin when title is in a row (inline with other elements) */
.${prefix}-row .${prefix}-title {
  margin-bottom: 0;
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
