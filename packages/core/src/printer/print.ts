/**
 * Node/document-level canonical `.wf` printing.
 *
 * See `src/printer/index.ts` for the canonical-form rules and the documented
 * non-round-trippable cases. Every branch here mirrors one element rule in
 * `src/grammar/wireframe.peggy`; printed output is always valid parser input.
 */

import type { AnyNode, WireframeDocument } from '../ast/types'
import { parse } from '../parser'
import {
  assertAttributeName,
  isPlainObject,
  printArray,
  printAttributeValue,
  printError,
  printString,
} from './values'

const INDENT = '  '

type Rec = Record<string, unknown>

/** Props that are structural, never printed as attributes. */
const STRUCTURAL_PROPS = new Set(['type', 'loc', 'children'])

function rec(node: AnyNode | Rec): Rec {
  return node as unknown as Rec
}

function ind(depth: number): string {
  return INDENT.repeat(depth)
}

/**
 * Collect the node's printable attributes: every own enumerable prop except
 * structural props and the element-specific `consumed` props, sorted
 * byte-wise by name. `undefined` values are skipped (absent attribute).
 */
function attrSegments(
  node: AnyNode | Rec,
  consumed: readonly string[],
  context: string,
  extra: ReadonlyArray<readonly [string, unknown]> = [],
): string[] {
  const source = rec(node)
  const pairs: Array<readonly [string, unknown]> = []
  for (const key of Object.keys(source)) {
    if (STRUCTURAL_PROPS.has(key) || consumed.includes(key)) continue
    const value = source[key]
    if (value === undefined) continue
    pairs.push([key, value])
  }
  pairs.push(...extra.filter(([, value]) => value !== undefined))
  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return pairs.map(([name, value]) => {
    assertAttributeName(name, context)
    if (value === true) return name
    if (value === null) {
      printError(context, `attribute ${JSON.stringify(name)} is null and cannot be expressed`)
    }
    return `${name}=${printAttributeValue(value, context)}`
  })
}

/** Required string label (`content` / `name`) — always printed, quoted. */
function requiredLabel(node: AnyNode, prop: string): string {
  const value = rec(node)[prop]
  if (typeof value !== 'string') {
    printError(node.type, `required ${JSON.stringify(prop)} must be a string`)
  }
  return printString(value)
}

/**
 * Optional string label — omitted for `null`/`""` (the grammar folds an
 * empty label to `null`, so both print to the same canonical form).
 */
function optionalLabel(node: AnyNode, prop: string): string | null {
  const value = rec(node)[prop]
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') {
    printError(node.type, `optional ${JSON.stringify(prop)} must be a string or null`)
  }
  return printString(value)
}

/** Non-negative integer segment (grammar `Integer`, used by marker / item). */
function integerSegment(node: AnyNode, prop: string): string {
  const value = rec(node)[prop]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    printError(node.type, `${JSON.stringify(prop)} must be a non-negative integer`)
  }
  return String(value)
}

function headLine(depth: number, segments: ReadonlyArray<string | null>): string {
  return ind(depth) + segments.filter((s): s is string => s !== null && s !== '').join(' ')
}

/**
 * Element with a `{ ... }` block. `required` blocks print `{}` when empty;
 * `optional` blocks are omitted when empty.
 */
function blockLines(
  depth: number,
  segments: ReadonlyArray<string | null>,
  contentLines: readonly string[],
  mode: 'required' | 'optional',
): string[] {
  const head = headLine(depth, segments)
  if (contentLines.length === 0) {
    return mode === 'required' ? [`${head} {}`] : [head]
  }
  return [`${head} {`, ...contentLines, `${ind(depth)}}`]
}

function childrenOf(node: AnyNode | Rec): AnyNode[] {
  const children = rec(node).children
  if (children === undefined) return []
  if (!Array.isArray(children)) {
    printError(String(rec(node).type), '"children" must be an array')
  }
  return children as AnyNode[]
}

function childrenLines(node: AnyNode, depth: number): string[] {
  return childrenOf(node).flatMap((child) => printNodeLines(child, depth + 1))
}

/** Container element: `keyword ["label"] attrs { children }` (block required). */
function containerLines(
  node: AnyNode,
  keyword: string,
  labelProp: string | null,
  depth: number,
): string[] {
  const consumed = labelProp ? [labelProp] : []
  const segments = [
    keyword,
    labelProp ? optionalLabel(node, labelProp) : null,
    ...attrSegments(node, consumed, node.type),
  ]
  return blockLines(depth, segments, childrenLines(node, depth), 'required')
}

/** Leaf element line: `keyword [label] attrs`. */
function leafLine(
  node: AnyNode,
  keyword: string,
  label: string | null,
  consumed: readonly string[],
  depth: number,
  extra: ReadonlyArray<readonly [string, unknown]> = [],
): string[] {
  return [headLine(depth, [keyword, label, ...attrSegments(node, consumed, node.type, extra)])]
}

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

interface ListItemShape extends Rec {
  content: string
  children: ListItemShape[]
}

/** Block-form list item: `{ content, ...attrs, children: ListItemShape[] }`. */
function isListItemShape(value: unknown): value is ListItemShape {
  if (!isPlainObject(value)) return false
  if (typeof value.content !== 'string') return false
  if (!Array.isArray(value.children)) return false
  return value.children.every(isListItemShape)
}

function listItemLines(item: ListItemShape, depth: number): string[] {
  const segments = [
    'item',
    printString(item.content),
    ...attrSegments(item, ['content'], 'List item'),
  ]
  const nested = item.children.flatMap((child) => listItemLines(child, depth + 1))
  return blockLines(depth, segments, nested, 'optional')
}

function listLines(node: AnyNode, depth: number): string[] {
  const items = (rec(node).items ?? []) as unknown[]
  const attrs = attrSegments(node, ['items'], node.type)
  if (items.length > 0 && items.every(isListItemShape)) {
    const content = items.flatMap((item) => listItemLines(item, depth + 1))
    return blockLines(depth, ['list', ...attrs], content, 'required')
  }
  const arraySegment = items.length > 0 ? printArray(items, node.type) : null
  return [headLine(depth, ['list', arraySegment, ...attrs])]
}

// ---------------------------------------------------------------------------
// table
// ---------------------------------------------------------------------------

function tableLines(node: AnyNode, depth: number): string[] {
  const source = rec(node)
  const columns = (source.columns ?? []) as unknown[]
  const tableRows = (source.rows ?? []) as unknown[]
  const content: string[] = []
  if (columns.length > 0) {
    content.push(`${ind(depth + 1)}columns ${printArray(columns, node.type)}`)
  }
  for (const row of tableRows) {
    if (!Array.isArray(row)) {
      printError(node.type, 'each table row must be an array of cells')
    }
    content.push(`${ind(depth + 1)}row ${printArray(row, node.type)}`)
  }
  const segments = ['table', ...attrSegments(node, ['columns', 'rows'], node.type)]
  return blockLines(depth, segments, content, 'required')
}

// ---------------------------------------------------------------------------
// dropdown
// ---------------------------------------------------------------------------

function dropdownLines(node: AnyNode, depth: number): string[] {
  const items = (rec(node).items ?? []) as unknown[]
  const content = items.map((item) => {
    if (isPlainObject(item) && item.type === 'divider') return `${ind(depth + 1)}divider`
    if (isPlainObject(item) && typeof item.label === 'string') {
      return headLine(depth + 1, [
        'item',
        printString(item.label),
        ...attrSegments(item, ['label'], 'Dropdown item'),
      ])
    }
    printError(node.type, 'each item must be a divider or have a string "label"')
  })
  const segments = ['dropdown', ...attrSegments(node, ['items'], node.type)]
  return blockLines(depth, segments, content, 'required')
}

// ---------------------------------------------------------------------------
// nav
// ---------------------------------------------------------------------------

function navChildLines(child: unknown, depth: number, inGroup: boolean): string[] {
  if (!isPlainObject(child)) {
    printError('Nav', 'block children must be item / group / divider objects')
  }
  if (child.type === 'divider') return [`${ind(depth)}divider`]
  if (child.type === 'item') {
    if (typeof child.label !== 'string') {
      printError('Nav', 'nav item must have a string "label"')
    }
    return [
      headLine(depth, [
        'item',
        printString(child.label),
        ...attrSegments(child, ['label'], 'Nav item'),
      ]),
    ]
  }
  if (child.type === 'group') {
    if (inGroup) {
      printError('Nav', 'the grammar does not allow a group inside a group')
    }
    if (typeof child.label !== 'string') {
      printError('Nav', 'nav group must have a string "label"')
    }
    const groupItems = (child.items ?? []) as unknown[]
    const content = groupItems.flatMap((item) => navChildLines(item, depth + 1, true))
    const segments = [
      'group',
      printString(child.label),
      ...attrSegments(child, ['label', 'items'], 'Nav group'),
    ]
    return blockLines(depth, segments, content, 'required')
  }
  printError('Nav', `unknown nav block child type ${JSON.stringify(child.type)}`)
}

function navLines(node: AnyNode, depth: number): string[] {
  const items = (rec(node).items ?? []) as unknown[]
  const segments = [
    'nav',
    items.length > 0 ? printArray(items, node.type) : null,
    ...attrSegments(node, ['items'], node.type),
  ]
  const content = childrenOf(node).flatMap((child) => navChildLines(child, depth + 1, false))
  return blockLines(depth, segments, content, 'optional')
}

// ---------------------------------------------------------------------------
// tabs
// ---------------------------------------------------------------------------

function tabsLines(node: AnyNode, depth: number): string[] {
  const items = (rec(node).items ?? []) as unknown[]
  const segments = [
    'tabs',
    items.length > 0 ? printArray(items, node.type) : null,
    ...attrSegments(node, ['items'], node.type),
  ]
  const content = childrenOf(node).flatMap((tab) => {
    const tabRec = rec(tab)
    if (typeof tabRec.label !== 'string') {
      printError(node.type, 'each tab must have a string "label"')
    }
    const tabSegments = [
      'tab',
      printString(tabRec.label),
      ...attrSegments(tabRec, ['label'], 'Tab'),
    ]
    const tabChildren = childrenOf(tabRec).flatMap((child) => printNodeLines(child, depth + 2))
    return blockLines(depth + 1, tabSegments, tabChildren, 'required')
  })
  return blockLines(depth, segments, content, 'optional')
}

// ---------------------------------------------------------------------------
// annotations
// ---------------------------------------------------------------------------

function annotationItemLines(node: AnyNode, depth: number): string[] {
  if (node.type !== 'AnnotationItem') {
    printError('Annotations', 'children must be AnnotationItem nodes')
  }
  const segments = [
    'item',
    integerSegment(node, 'number'),
    requiredLabel(node, 'title'),
    ...attrSegments(node, ['number', 'title'], node.type),
  ]
  return blockLines(depth, segments, childrenLines(node, depth), 'optional')
}

function annotationsLines(node: AnyNode, depth: number): string[] {
  const segments = ['annotations', ...attrSegments(node, [], node.type)]
  const content = childrenOf(node).flatMap((item) => annotationItemLines(item, depth + 1))
  return blockLines(depth, segments, content, 'required')
}

// ---------------------------------------------------------------------------
// node dispatch
// ---------------------------------------------------------------------------

function printNodeLines(node: AnyNode, depth: number): string[] {
  switch (node.type) {
    // -- containers with an optional label ---------------------------------
    case 'Page':
      return containerLines(node, 'page', 'title', depth)
    case 'Card':
      return containerLines(node, 'card', 'title', depth)
    case 'Modal':
      return containerLines(node, 'modal', 'title', depth)
    case 'Drawer':
      return containerLines(node, 'drawer', 'title', depth)
    case 'Accordion':
      return containerLines(node, 'accordion', 'title', depth)
    case 'Section':
      return containerLines(node, 'section', 'title', depth)
    case 'Popover':
      return containerLines(node, 'popover', 'title', depth)

    // -- containers without a label ----------------------------------------
    case 'Header':
    case 'Main':
    case 'Footer':
    case 'Sidebar':
    case 'Row':
    case 'Col':
    case 'Stack':
    case 'Relative':
      return containerLines(node, node.type.toLowerCase(), null, depth)

    // -- leaves with required content --------------------------------------
    case 'Text':
    case 'Title':
    case 'Link':
    case 'Button':
    case 'Badge':
    case 'Alert':
    case 'Toast':
      return leafLine(
        node,
        node.type.toLowerCase(),
        requiredLabel(node, 'content'),
        ['content'],
        depth,
      )
    case 'Tooltip':
      if (childrenOf(node).length > 0) {
        printError(node.type, 'the grammar has no tooltip block; children cannot be expressed')
      }
      return leafLine(node, 'tooltip', requiredLabel(node, 'content'), ['content'], depth)
    case 'Icon':
      return leafLine(node, 'icon', requiredLabel(node, 'name'), ['name'], depth)

    // -- leaves with optional labels ---------------------------------------
    case 'Avatar':
      return leafLine(node, 'avatar', optionalLabel(node, 'name'), ['name'], depth)
    case 'Image':
      return leafLine(node, 'image', optionalLabel(node, 'src'), ['src'], depth)
    case 'Textarea':
    case 'Checkbox':
    case 'Radio':
    case 'Switch':
    case 'Slider':
    case 'Spinner':
      return leafLine(node, node.type.toLowerCase(), optionalLabel(node, 'label'), ['label'], depth)
    case 'Input':
      // The grammar spells the AST `inputType` prop as the `type` attribute.
      return leafLine(node, 'input', optionalLabel(node, 'label'), ['label', 'inputType'], depth, [
        ['type', rec(node).inputType],
      ])
    case 'Progress':
    case 'Divider':
      return leafLine(node, node.type.toLowerCase(), null, [], depth)
    case 'Marker':
      return leafLine(node, 'marker', integerSegment(node, 'number'), ['number'], depth)

    case 'Placeholder': {
      // A bare `placeholder` keyword would be captured as a flag attribute of
      // a preceding sibling (it is not a grammar ChildKeyword), so a missing
      // label always prints as an explicit `""` — the parser folds it back to
      // `null`.
      const label = optionalLabel(node, 'label') ?? printString('')
      const segments = ['placeholder', label, ...attrSegments(node, ['label'], node.type)]
      return blockLines(depth, segments, childrenLines(node, depth), 'optional')
    }

    case 'Select': {
      const options = (rec(node).options ?? []) as unknown[]
      return [
        headLine(depth, [
          'select',
          optionalLabel(node, 'label'),
          options.length > 0 ? printArray(options, node.type) : null,
          ...attrSegments(node, ['label', 'options'], node.type),
        ]),
      ]
    }

    case 'Breadcrumb': {
      // The grammar requires the array, so an empty one prints as `[]`.
      const items = (rec(node).items ?? []) as unknown[]
      return [
        headLine(depth, [
          'breadcrumb',
          printArray(items, node.type),
          ...attrSegments(node, ['items'], node.type),
        ]),
      ]
    }

    case 'List':
      return listLines(node, depth)
    case 'Table':
      return tableLines(node, depth)
    case 'Dropdown':
      return dropdownLines(node, depth)
    case 'Nav':
      return navLines(node, depth)
    case 'Tabs':
      return tabsLines(node, depth)
    case 'Annotations':
      return annotationsLines(node, depth)
    case 'AnnotationItem':
      return annotationItemLines(node, depth)

    default:
      printError('printer', `unknown node type ${JSON.stringify((node as { type: string }).type)}`)
  }
}

// ---------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------

/**
 * Print a parsed {@link WireframeDocument} to canonical `.wf` DSL text.
 *
 * The output is deterministic (a pure function of the AST structure), is
 * always valid `parse` input, and satisfies the round-trip laws documented in
 * `src/printer/index.ts`. An empty document prints as an empty string;
 * otherwise the text ends with exactly one trailing newline.
 *
 * @public
 * @example
 * ```ts
 * const doc = parse('page "Login" { button "Sign in" primary }')
 * const canonical = printWireframe(doc)
 * // 'page "Login" {\n  button "Sign in" primary\n}\n'
 * ```
 */
export function printWireframe(doc: WireframeDocument): string {
  const pages = (doc.children ?? []).map((page) => printNodeLines(page, 0).join('\n'))
  if (pages.length === 0) return ''
  return `${pages.join('\n\n')}\n`
}

/**
 * Parse `.wf` source and reprint it in canonical form.
 *
 * Comments are discarded (the parser drops them before the AST). Reformatting
 * already-canonical text is the identity.
 *
 * @public
 * @throws {ParseError} When `source` contains syntax errors.
 */
export function formatWireframeCode(source: string): string {
  return printWireframe(parse(source))
}
