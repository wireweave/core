/**
 * Component utilities for wireweave renderer
 */

/**
 * Build CSS class string from an array
 */
export function buildClassString(classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Size token definitions for each component type
 * Maps token strings (xs, sm, md, lg, xl) to pixel values
 */
const SIZE_TOKENS = {
  icon: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 },
  spinner: { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 },
} as const;

type SizeTokenType = keyof typeof SIZE_TOKENS;

/**
 * Resolve size value to either a CSS class name or inline style
 * Supports both token strings (xs, sm, md, lg, xl) and custom px numbers
 *
 * @param size - Size value (token string or number in px)
 * @param componentType - Component type for token lookup
 * @param prefix - CSS class prefix
 * @returns Object with className and style for the component
 */
export function resolveSizeValue(
  size: string | number | undefined,
  componentType: SizeTokenType,
  prefix: string
): { className?: string; style?: string } {
  if (size === undefined) {
    return {};
  }

  // If it's a known token, use CSS class
  if (typeof size === 'string') {
    const tokens = SIZE_TOKENS[componentType];
    if (size in tokens) {
      return { className: `${prefix}-${componentType}-${size}` };
    }
    // Unknown string, try to parse as number
    const parsed = parseInt(size, 10);
    if (!isNaN(parsed)) {
      return { style: `width: ${parsed}px; height: ${parsed}px;` };
    }
    return {};
  }

  // If it's a number, use inline style
  if (typeof size === 'number') {
    return { style: `width: ${size}px; height: ${size}px;` };
  }

  return {};
}
