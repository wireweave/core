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
 *
 * `id` is the page's declared identifier — a stable slug an author opted into —
 * and `title` is its display heading. They are separate namespaces: `id` is what
 * a `navigate` target should key off, `title` is what a reader sees. Either can
 * be absent.
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
   *
   * `id` / `title` mirror {@link TransitionScreen}: present when the page
   * declares them, so a consumer can address the destination by its stable slug
   * rather than by display text.
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
   * Whether `target` names a concrete destination for its kind:
   * - `navigate`: a page whose `id` matches `target`, or — failing that — whose
   *   `title` matches it. Identifiers are consulted before display text; see
   *   `extract/transitions.ts` for why. Also `true` for an `external` target: a
   *   URL is a complete destination, it is simply not one of this document's
   *   pages, which is why `to` is `null` there.
   * - `opens` / `toggles`: a `Modal` / `Drawer` with `id === target` in the
   *   source page.
   * - `action`: always `false` (an opaque handler id has no structural target).
   */
  resolved: boolean
  /**
   * Present, and always `true`, when a `navigate` target is a URL rather than
   * the name of a page (see `interaction/target.ts`). Such an edge leaves the
   * document: `to` is `null` because there is no page to point at, and it is
   * never {@link ScreenTransitionGraph.dangling | dangling} — an outbound link
   * is a destination the author meant, not a reference that failed to resolve.
   *
   * This is what separates an external link from an `action`: both have
   * `to === null`, but an `action` is an opaque handler with `resolved: false`,
   * while an external link is a real destination the browser can follow.
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
   * The subset of `navigate` edges whose target matched neither a page `id` nor
   * a page title and is not a URL (`resolved === false`, `to === null`) — a name
   * that was meant to be a screen and found none. This is the defect list: a
   * consumer reporting "broken transitions" counts exactly these. Intra-page
   * `opens` / `toggles` and opaque `action` edges are not page transitions and
   * never appear here, and neither do `external` links.
   */
  dangling: TransitionEdge[]
  /**
   * The subset of `navigate` edges leaving the document — targets that are URLs
   * rather than page names ({@link TransitionEdge.external}). Kept apart from
   * `dangling` so a consumer can show outbound links without counting correct
   * authoring as breakage.
   */
  external: TransitionEdge[]
}
