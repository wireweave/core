/**
 * Component utilities for wireweave renderer
 */

import type { ValueWithUnit } from '../../ast/types';

/**
 * Build CSS class string from an array
 */
export function buildClassString(classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Type guard to check if a value is a ValueWithUnit object
 */
function isValueWithUnit(value: unknown): value is ValueWithUnit {
  return typeof value === 'object' && value !== null && 'value' in value && 'unit' in value;
}

/**
 * Size token definitions for each component type
 * Maps token strings (xs, sm, md, lg, xl) to pixel values
 *
 * Components with width/height sizing (Icon, Avatar, Spinner):
 * - Custom size applies as width/height
 *
 * Components with font-size based sizing (Button, Badge):
 * - Custom size applies as font-size
 */
const SIZE_TOKENS = {
  icon: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 },
  spinner: { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 },
  button: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
  badge: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 },
} as const;

/**
 * Components that use font-size for custom sizing (vs width/height)
 */
const FONT_SIZED_COMPONENTS = ['button', 'badge'] as const;

type SizeTokenType = keyof typeof SIZE_TOKENS;

/**
 * Resolve size value to either a CSS class name or inline style
 * Supports token strings (xs, sm, md, lg, xl), numbers (px), and ValueWithUnit
 *
 * @param size - Size value (token string, number in px, or ValueWithUnit)
 * @param componentType - Component type for token lookup and style generation
 * @param prefix - CSS class prefix
 * @returns Object with className and style for the component
 */
export function resolveSizeValue(
  size: string | number | ValueWithUnit | undefined,
  componentType: SizeTokenType,
  prefix: string
): { className?: string; style?: string } {
  if (size === undefined) {
    return {};
  }

  // ValueWithUnit object: use inline style
  if (isValueWithUnit(size)) {
    const cssValue = `${size.value}${size.unit}`;
    if ((FONT_SIZED_COMPONENTS as readonly string[]).includes(componentType)) {
      return { style: `font-size: ${cssValue}` };
    }
    return { style: `width: ${cssValue}; height: ${cssValue}` };
  }

  // If it's a known token string, use CSS class
  if (typeof size === 'string') {
    const tokens = SIZE_TOKENS[componentType];
    if (size in tokens) {
      return { className: `${prefix}-${componentType}-${size}` };
    }
    // Unknown string, try to parse as number
    const parsed = parseInt(size, 10);
    if (!isNaN(parsed)) {
      if ((FONT_SIZED_COMPONENTS as readonly string[]).includes(componentType)) {
        return { style: `font-size: ${parsed}px` };
      }
      return { style: `width: ${parsed}px; height: ${parsed}px` };
    }
    return {};
  }

  // If it's a number, use inline style
  if (typeof size === 'number') {
    if ((FONT_SIZED_COMPONENTS as readonly string[]).includes(componentType)) {
      return { style: `font-size: ${size}px` };
    }
    return { style: `width: ${size}px; height: ${size}px` };
  }

  return {};
}
