/**
 * Keywords and labels for Wireweave DSL
 *
 * `VALUE_KEYWORDS` is derived from the attribute specification: an enum value is
 * a value keyword because some attribute accepts it, so listing them separately
 * could only ever drift. Categories come from `@wireweave/core/spec` too — this
 * module supplies their display labels, nothing more.
 */

import { ATTRIBUTE_SPECS } from '@wireweave/core/spec'

import { PENDING_CORE_ATTRIBUTES } from './core-spec-gaps.js'
import type { ComponentCategory } from './types.js'

// Category labels for display
export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  structure: 'Structure',
  layout: 'Layout',
  container: 'Container',
  grid: 'Grid',
  text: 'Text',
  input: 'Input',
  display: 'Display',
  data: 'Data',
  feedback: 'Feedback',
  overlay: 'Overlay',
  navigation: 'Navigation',
  annotation: 'Annotation',
}

/**
 * Literals owned by the grammar rather than by any attribute: the `Boolean` rule
 * in `wireframe.peggy` accepts exactly these two as a bare attribute value.
 */
const BOOLEAN_LITERALS: readonly string[] = ['true', 'false']

/**
 * Value keywords used in the language — every value an attribute enumerates,
 * plus the grammar's boolean literals.
 *
 * Built from the core registry, deliberately not from this package's own
 * `ATTRIBUTES`. `core-spec-sync.test.ts` computes the same set from `ATTRIBUTES`
 * and asserts the two agree, which only means something while the two sides are
 * different expressions. Collapsing them onto one source would turn that
 * assertion into a restatement of this line and stop it catching anything.
 */
export const VALUE_KEYWORDS: string[] = [
  ...new Set([
    ...BOOLEAN_LITERALS,
    ...ATTRIBUTE_SPECS.flatMap((attr) => attr.values ?? []),
    ...PENDING_CORE_ATTRIBUTES.flatMap((attr) => attr.values ?? []),
  ]),
]

// Common number suggestions for attributes
export const COMMON_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64]

// Spacing scale (4px base)
export const SPACING_SCALE: Record<number, string> = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
}
