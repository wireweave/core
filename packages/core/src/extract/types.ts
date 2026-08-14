/**
 * Types for the deterministic extraction module.
 *
 * These shapes mirror the SSOT (single-source-of-truth) Screen skeleton slots —
 * title / UI 요소·입력 필드 / 표시 데이터 / 전이 — so a downstream SSOT authoring
 * step can map a parsed `WireframeDocument` onto Screen nodes without any prose
 * generation. Everything here is derived structurally from the AST; there is no
 * heuristic text synthesis.
 */

import type { ComponentCategory } from '../spec'
import type { InputType, NodeType, SourceLocation, StateGuard } from '../ast'
import type { NormalizedInteractionEffect } from '../interaction/model'

/**
 * The kind of interaction an interactive node triggers, taken directly from the
 * DSL `InteractiveProps` (`navigate` / `opens` / `toggles` / `action`).
 */
export type InteractionKind = 'navigate' | 'opens' | 'toggles' | 'action'

/**
 * A meaningful UI node on a screen (any real AST component node below the page).
 */
export interface ScreenElement {
  nodeType: NodeType
  category: ComponentCategory
  /** Short caption: form label, card/section title, avatar/icon name, etc. */
  label?: string
  /** Textual body for content-bearing nodes (text/title/link/button/badge…). */
  content?: string
  loc?: SourceLocation
}

/**
 * A form input field (the 7 `InputComponentNode` types — excludes Button, which
 * the spec files under the `input` category but is an action, not a field).
 */
export interface ScreenInput {
  nodeType: NodeType
  label?: string
  /** Present on `Input` only. */
  inputType?: InputType
  placeholder?: string
  required?: boolean
  disabled?: boolean
  /** Present on `Select` — option labels, normalised to strings. */
  options?: string[]
  loc?: SourceLocation
}

/**
 * A display / data / text node — the read-only "표시 데이터" of a screen.
 */
export interface ScreenDisplay {
  nodeType: NodeType
  category: ComponentCategory
  content?: string
  label?: string
  loc?: SourceLocation
}

/**
 * A single interaction emitted by a node. A node carrying more than one
 * `InteractiveProps` (e.g. `navigate` + `action`) yields one entry per prop, in
 * a fixed order (navigate, opens, toggles, action).
 */
export interface ScreenAction {
  nodeType: NodeType
  label?: string
  kind: InteractionKind
  /** The raw target string as written in the DSL. */
  target: string
  /**
   * Present when the action is a menu item inside a nav/dropdown/breadcrumb
   * container rather than a component node. `nodeType` is then the container's
   * type, `label` is the item's label, and `index` is its position within the
   * container's flattened item list.
   */
  item?: { index: number }
  /** The container node's location for item-level actions; items carry no `loc`. */
  loc?: SourceLocation
}

/**
 * Per-screen derived counts and boolean rollups.
 */
export interface ScreenFieldsSummary {
  /** Total meaningful component nodes below the page. */
  total: number
  /** Count of nodes per component category. */
  byCategory: Record<ComponentCategory, number>
  inputCount: number
  displayCount: number
  actionCount: number
  /** At least one form input field is present. */
  hasForm: boolean
  /** At least one navigation-category node (nav/tabs/breadcrumb) is present. */
  hasNavigation: boolean
  /** At least one overlay container (modal/drawer/popover/tooltip/dropdown). */
  hasOverlay: boolean
}

/**
 * The full structured field set extracted from one page.
 */
export interface ScreenFields {
  title?: string
  viewport?: string | number
  device?: string
  elements: ScreenElement[]
  inputs: ScreenInput[]
  displayData: ScreenDisplay[]
  actions: ScreenAction[]
  summary: ScreenFieldsSummary
  loc?: SourceLocation
}

/**
 * A node in the screen-transition graph.
 */
export interface TransitionScreen {
  id?: string
  title?: string
  index: number
  loc?: SourceLocation
}

/**
 * A resolved or dangling transition trigger.
 */
export interface TransitionEdge {
  from: { pageIndex: number; id?: string; title?: string }
  /**
   * The destination page for a resolved `navigate` edge. Always `null` for
   * `opens` / `toggles` / `action`, which are intra-page or opaque and never
   * cross a page boundary.
   */
  to: { pageIndex: number; id?: string; title?: string } | null
  /** The raw target string as written in the DSL. */
  target: string
  kind: InteractionKind
  /** Typed event metadata; absent for legacy scalar interaction attributes. */
  event?: 'click'
  guard?: StateGuard
  effect?: NormalizedInteractionEffect
  /** A shared-layout edge is expanded once for every screen using that layout. */
  source?: 'screen' | 'layout'
  /**
   * What fired the transition. For a component node, `nodeType` is that node's
   * type. For a menu item inside a nav/dropdown/breadcrumb, `nodeType` is the
   * container's type, `label` is the item's label, and `item.index` is the
   * item's position within the container — the presence of `item` marks an
   * item-level trigger.
   */
  trigger: { nodeType: NodeType; label?: string; loc?: SourceLocation; item?: { index: number } }
  /**
   * Whether `target` resolved to a concrete destination for its kind:
   * - `navigate`: a page whose title matches `target`, or a URL-shaped external
   *   destination outside this document.
   * - `opens` / `toggles`: a `Modal` / `Drawer` with `id === target` in the
   *   source page.
   * - `action`: always `false` (an opaque handler id has no structural target).
   */
  resolved: boolean
  /**
   * Present, and always `true`, when a `navigate` target is a URL rather than a
   * page name. External edges are resolved destinations outside this document,
   * so `to` remains `null` and they never appear in `dangling`.
   */
  external?: true
}

/**
 * The screen-transition graph derived from a whole document.
 */
export interface ScreenTransitionGraph {
  screens: TransitionScreen[]
  edges: TransitionEdge[]
  /**
   * The subset of `navigate` edges whose target matched no page title and was
   * not URL-shaped (`resolved === false`, `to === null`). Intra-page
   * `opens` / `toggles`, opaque `action` edges, and external URLs never appear
   * here.
   */
  dangling: TransitionEdge[]
  /** URL-shaped `navigate` edges that leave the current document. */
  external: TransitionEdge[]
}
