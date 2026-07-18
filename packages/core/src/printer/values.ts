/**
 * Value-level canonical printing for the `.wf` printer.
 *
 * Prints attribute values, array items, and object literals in the single
 * canonical form defined by `src/printer/index.ts`. Every emitted token is
 * valid input for the corresponding grammar rule in
 * `src/grammar/wireframe.peggy` (`AttributeValue`, `ArrayItem`, `Object`).
 */

import type { ValueWithUnit } from '../ast/types'

/** Grammar `Identifier`: `[a-zA-Z_][a-zA-Z0-9_-]*` */
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_-]*$/

/** Grammar `ValueWithUnit` unit set. */
const UNITS = new Set(['px', '%', 'em', 'rem', 'vh', 'vw'])

/**
 * Grammar `ChildKeyword` set — these cannot be used as attribute names
 * (`AttributeName = !ChildKeyword Identifier`).
 */
const CHILD_KEYWORDS = new Set([
  'page',
  'header',
  'main',
  'footer',
  'sidebar',
  'row',
  'col',
  'stack',
  'relative',
  'card',
  'modal',
  'drawer',
  'accordion',
  'section',
  'text',
  'link',
  'button',
  'input',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'image',
  'avatar',
  'badge',
  'table',
  'columns',
  'list',
  'item',
  'alert',
  'toast',
  'progress',
  'spinner',
  'tooltip',
  'popover',
  'dropdown',
  'divider',
  'nav',
  'tabs',
  'tab',
  'breadcrumb',
  'group',
  'marker',
  'annotations',
])

/** Error thrown when a value or name cannot be expressed in the grammar. */
export function printError(context: string, message: string): never {
  throw new Error(`[wf-printer] ${context}: ${message}`)
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** `{ value, unit }` shape produced by the grammar `ValueWithUnit` rule. */
function isValueWithUnit(value: unknown): value is ValueWithUnit {
  if (!isPlainObject(value)) return false
  const keys = Object.keys(value)
  return (
    keys.length === 2 &&
    typeof value.value === 'number' &&
    typeof value.unit === 'string' &&
    UNITS.has(value.unit)
  )
}

/**
 * Assert that `name` is printable as a grammar `AttributeName`
 * (an `Identifier` that is not a `ChildKeyword`).
 */
export function assertAttributeName(name: string, context: string): void {
  if (!IDENTIFIER_RE.test(name)) {
    printError(context, `attribute name ${JSON.stringify(name)} is not a grammar identifier`)
  }
  if (CHILD_KEYWORDS.has(name)) {
    printError(
      context,
      `attribute name ${JSON.stringify(name)} collides with a child keyword and cannot be parsed back`,
    )
  }
}

/** Canonical double-quoted string literal with the grammar's five escapes. */
export function printString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `"${escaped}"`
}

/**
 * Canonical decimal number. Throws on values the grammar cannot express
 * (non-finite, or magnitudes that JS serializes in exponent notation).
 */
function printNumber(value: number, context: string): string {
  if (!Number.isFinite(value)) {
    printError(context, `number ${String(value)} is not finite`)
  }
  if (Object.is(value, -0)) return '-0'
  const text = String(value)
  if (text.includes('e') || text.includes('E')) {
    printError(context, `number ${text} has no decimal grammar representation`)
  }
  return text
}

/**
 * String in attribute/object-value position: unquoted when it parses back as
 * the same string via the grammar `Identifier` rule. Strings starting with
 * `true`/`false` are always quoted — the grammar `Boolean` rule has no
 * identifier-boundary lookahead and would truncate them.
 */
function printValueString(value: string): string {
  if (IDENTIFIER_RE.test(value) && !value.startsWith('true') && !value.startsWith('false')) {
    return value
  }
  return printString(value)
}

/**
 * Canonical `AttributeValue` / object-property value.
 * `{ value, unit }` shapes print as unit literals (`16px`).
 */
export function printAttributeValue(value: unknown, context: string): string {
  if (typeof value === 'string') return printValueString(value)
  if (typeof value === 'number') return printNumber(value, context)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return printArray(value, context)
  if (isValueWithUnit(value)) return `${printNumber(value.value, context)}${value.unit}`
  if (isPlainObject(value)) return printObject(value, context)
  printError(context, `value of type ${typeof value} cannot be expressed in the grammar`)
}

/**
 * Canonical `ArrayItem`. Strings are always quoted here; the grammar's
 * `ArrayItem` rule has no `ValueWithUnit` alternative and no nested arrays,
 * so `{ value, unit }` shapes print as object literals and nested arrays
 * throw.
 */
function printArrayItem(value: unknown, context: string): string {
  if (typeof value === 'string') return printString(value)
  if (typeof value === 'number') return printNumber(value, context)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) {
    printError(context, 'nested arrays cannot be expressed as grammar array items')
  }
  if (isPlainObject(value)) return printObject(value, context)
  printError(context, `array item of type ${typeof value} cannot be expressed in the grammar`)
}

/** Canonical `Array` literal: `["a", "b"]`, empty prints `[]`. */
export function printArray(items: readonly unknown[], context: string): string {
  if (items.length === 0) return '[]'
  return `[${items.map((item) => printArrayItem(item, context)).join(', ')}]`
}

/**
 * Canonical `Object` literal: `{ a=1, b="x" }` with byte-wise sorted keys,
 * `key` bare for `true` values, empty prints `{}`.
 */
function printObject(value: Record<string, unknown>, context: string): string {
  const entries = Object.keys(value)
    .filter((key) => value[key] !== undefined)
    .sort()
    .map((key) => {
      if (!IDENTIFIER_RE.test(key)) {
        printError(context, `object key ${JSON.stringify(key)} is not a grammar identifier`)
      }
      const propValue = value[key]
      if (propValue === true) return key
      return `${key}=${printAttributeValue(propValue, context)}`
    })
  if (entries.length === 0) return '{}'
  return `{ ${entries.join(', ')} }`
}
