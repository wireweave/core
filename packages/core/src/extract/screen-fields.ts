/**
 * E3 — Screen field extraction.
 *
 * `extractScreenFields(page)` walks a single parsed page and structures its
 * contents into the SSOT Screen skeleton slots (title / UI 요소·입력 필드 /
 * 표시 데이터 / 전이). Purely deterministic — no prose generation.
 */

import type { AnyNode, PageNode, SelectNode, SelectOption, WireframeDocument } from '../ast'
import { isInputComponentNode, walk } from '../ast'
import type { ComponentCategory } from '../spec'
import {
  categoryOf,
  getContent,
  getInteractiveLabel,
  getInteractions,
  getItemInteractions,
  getLabel,
} from './node-info'
import type {
  ScreenAction,
  ScreenDisplay,
  ScreenElement,
  ScreenFields,
  ScreenFieldsSummary,
  ScreenInput,
} from './types'

const ALL_CATEGORIES: readonly ComponentCategory[] = [
  'layout',
  'grid',
  'container',
  'text',
  'input',
  'display',
  'data',
  'feedback',
  'overlay',
  'navigation',
  'annotation',
]

/** Node types treated as overlay containers for the `hasOverlay` rollup. */
const OVERLAY_TYPES = new Set(['Modal', 'Drawer', 'Popover', 'Tooltip', 'Dropdown'])

/** Categories whose nodes count as read-only "표시 데이터". */
const DISPLAY_CATEGORIES = new Set<ComponentCategory>(['display', 'data', 'text'])

function normaliseOptions(options: SelectNode['options']): string[] {
  return options.map((o: string | SelectOption) => (typeof o === 'string' ? o : o.label))
}

function toInput(node: AnyNode): ScreenInput {
  const input: ScreenInput = { nodeType: node.type }
  const label = getLabel(node)
  if (label !== undefined) input.label = label
  if (node.type === 'Input' && typeof node.inputType === 'string') {
    input.inputType = node.inputType
  }
  if ('placeholder' in node && typeof node.placeholder === 'string') {
    input.placeholder = node.placeholder
  }
  if ('required' in node && typeof node.required === 'boolean') input.required = node.required
  if ('disabled' in node && typeof node.disabled === 'boolean') input.disabled = node.disabled
  if (node.type === 'Select') input.options = normaliseOptions(node.options)
  if (node.loc) input.loc = node.loc
  return input
}

/**
 * Extract the structured field set from a single page.
 *
 * Iterates every real component node below the page (the page node itself is
 * excluded), classifying each by its {@link ComponentCategory}. Pseudo-nodes
 * that are not real AST components (e.g. nav block `item` / `group` entries)
 * are skipped.
 */
export function extractScreenFields(page: PageNode): ScreenFields {
  const elements: ScreenElement[] = []
  const inputs: ScreenInput[] = []
  const displayData: ScreenDisplay[] = []
  const actions: ScreenAction[] = []

  const byCategory = Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0])) as Record<
    ComponentCategory,
    number
  >
  let hasNavigation = false
  let hasOverlay = false

  for (const child of page.children) {
    walk(child, (node) => {
      const category = categoryOf(node)
      if (category === undefined) return // skip pseudo-nodes (not real components)

      byCategory[category] += 1
      if (category === 'navigation') hasNavigation = true
      if (OVERLAY_TYPES.has(node.type)) hasOverlay = true

      const label = getLabel(node)
      const content = getContent(node)

      const element: ScreenElement = { nodeType: node.type, category }
      if (label !== undefined) element.label = label
      if (content !== undefined) element.content = content
      if (node.loc) element.loc = node.loc
      elements.push(element)

      if (isInputComponentNode(node)) {
        inputs.push(toInput(node))
      }

      if (DISPLAY_CATEGORIES.has(category)) {
        const display: ScreenDisplay = { nodeType: node.type, category }
        if (content !== undefined) display.content = content
        if (label !== undefined) display.label = label
        if (node.loc) display.loc = node.loc
        displayData.push(display)
      }

      const interactiveLabel = getInteractiveLabel(node)
      for (const { kind, target } of getInteractions(node)) {
        const action: ScreenAction = { nodeType: node.type, kind, target }
        if (interactiveLabel !== undefined) action.label = interactiveLabel
        if (node.loc) action.loc = node.loc
        actions.push(action)
      }

      // Item-level actions from nav/dropdown/breadcrumb menu items.
      for (const item of getItemInteractions(node)) {
        const action: ScreenAction = {
          nodeType: item.container,
          kind: item.kind,
          target: item.target,
          item: { index: item.itemIndex },
        }
        if (item.itemLabel !== undefined) action.label = item.itemLabel
        if (node.loc) action.loc = node.loc
        actions.push(action)
      }
    })
  }

  const summary: ScreenFieldsSummary = {
    total: elements.length,
    byCategory,
    inputCount: inputs.length,
    displayCount: displayData.length,
    actionCount: actions.length,
    hasForm: inputs.length > 0,
    hasNavigation,
    hasOverlay,
  }

  const fields: ScreenFields = { elements, inputs, displayData, actions, summary }
  if (page.title != null) fields.title = page.title
  if (page.viewport !== undefined) fields.viewport = page.viewport
  if (page.device !== undefined) fields.device = page.device
  if (page.loc) fields.loc = page.loc
  return fields
}

/**
 * Extract {@link ScreenFields} for every page in a document, in document order.
 */
export function extractAllScreenFields(doc: WireframeDocument): ScreenFields[] {
  return doc.children.map((page) => extractScreenFields(page))
}
