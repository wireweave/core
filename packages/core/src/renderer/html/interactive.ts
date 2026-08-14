/**
 * Interaction intent → HTML attributes.
 *
 * `navigate` / `opens` / `toggles` / `action` are the declared interaction
 * intent of a wireframe element (see {@link InteractiveProps}). They are the
 * only structural link between screens, so every consumer of rendered
 * output — the studio runtime, the transition graph, a prototype harness —
 * finds them by these four `data-*` names.
 *
 * This module is their single owner. The attribute names are written down
 * exactly once, here; renderers ask for the record and never spell the names
 * themselves. Before this existed the block was copy-pasted into five
 * renderers, and the sixth (`navigation.ts`) simply never got a copy — nav,
 * tab and breadcrumb items parsed their interaction intent and then dropped it
 * on the floor, which is the failure mode this module exists to make
 * impossible to repeat.
 *
 * `__tests__/renderer-interactive.test.ts` enforces the single-owner property:
 * it fails if any other file under `src/renderer/` spells one of these names.
 */

import type { GuardedOutcomeProps, InteractiveProps } from '../../ast/types'
import {
  interactionSignature,
  normalizeInteractionHandlers,
  normalizeStateGuard,
} from '../../interaction/model'
import { isUrlTarget } from '../../interaction/target'

/** The `data-*` attribute name carrying each interaction kind. */
export const INTERACTIVE_ATTR_NAMES = [
  'data-navigate',
  'data-opens',
  'data-toggles',
  'data-action',
] as const

/** Internal: the shape of {@link InteractiveAttrs}'s keys. Consumers use that. */
type InteractiveAttrName = (typeof INTERACTIVE_ATTR_NAMES)[number]

/**
 * Marks a `data-navigate` whose target is a URL rather than a page name.
 *
 * Only elements that are not anchors ever carry it: an anchor puts a URL in its
 * `href` and emits no `data-navigate` at all, so there is nothing left to
 * qualify. A button or a current-page `<span>` has no `href` to move the target
 * into, so the URL travels in the data attribute — and without this marker every
 * consumer would have to re-derive, from the string, the thing the renderer
 * already worked out.
 *
 * That re-derivation is the point. {@link isUrlTarget} is a TypeScript predicate;
 * the site runtime is generated JavaScript. A second copy of the rule over there
 * is a drift surface by construction, and the two copies disagreeing means the
 * runtime starts hunting for a screen named `https://…`. So the judgment is made
 * once, here, at render time, and shipped as a fact the runtime only reads.
 *
 * The single-owner gate in `__tests__/renderer-interactive.test.ts` covers this
 * name for free: it contains `data-navigate`, so any other file under
 * `src/renderer/` that spells it is already an offender.
 */
export const EXTERNAL_NAVIGATE_ATTR = 'data-navigate-external'

/** Typed runtime markers, owned beside the legacy interaction attributes. */
export const TYPED_INTERACTION_ATTR = 'data-wf-on'
export const VISIBLE_GUARD_ATTR = 'data-wf-visible-when'
export const ENABLED_GUARD_ATTR = 'data-wf-enabled-when'

/**
 * The `href` an anchor gets when it has no destination of its own.
 *
 * An anchor must have an `href` to be a link — focusable, keyboard-activatable,
 * announced as a link — but a wireframe anchor usually has nowhere to go: its
 * intent, if any, travels as `data-navigate` and names a screen, not a URL.
 * `#` is the standard inert stand-in, and it is a *statement by the renderer*:
 * this element's `href` carries no destination.
 *
 * It is exported because the site runtime needs to read that statement back.
 * The browser's default action for `#` is a same-document navigation, and inside
 * the `srcdoc` frame consumers mount the wireframe in, `#` resolves against the
 * *embedder's* URL — so an unhandled click walks the frame out of the wireframe
 * and loads the host app inside it. Measured on a 20-screen demo: 44 such
 * anchors, frame URL `about:srcdoc` → `<host page>#`, host assets refetched.
 *
 * The runtime must therefore distinguish "inert" from "a real link the author
 * asked for", and re-deriving that from the string over there is the drift
 * surface {@link EXTERNAL_NAVIGATE_ATTR} exists to avoid. So the value is owned
 * here and embedded into the generated script, like the attribute names.
 */
export const INERT_HREF = '#'

/**
 * Attribute record for one element; absent intents stay `undefined`.
 *
 * The marker is boolean because it carries no value of its own — it qualifies
 * the target next to it. `buildAttrsString` renders `true` as `name="name"`,
 * which is the form that survives the XML parsing of an SVG `foreignObject`.
 */
export type InteractiveAttrs = Record<InteractiveAttrName, string | undefined> &
  Record<typeof EXTERNAL_NAVIGATE_ATTR, true | undefined> &
  Record<
    typeof TYPED_INTERACTION_ATTR | typeof VISIBLE_GUARD_ATTR | typeof ENABLED_GUARD_ATTR,
    string | undefined
  >

/** Guard attributes accepted by ordinary nodes that do not carry events. */
export function guardedOutcomeAttrs(
  node: Partial<GuardedOutcomeProps>,
): Record<typeof VISIBLE_GUARD_ATTR | typeof ENABLED_GUARD_ATTR, string | undefined> {
  const visible = normalizeStateGuard(node.visibleWhen)
  const enabled = normalizeStateGuard(node.enabledWhen)
  return {
    [VISIBLE_GUARD_ATTR]: visible === undefined ? undefined : JSON.stringify(visible),
    [ENABLED_GUARD_ATTR]: enabled === undefined ? undefined : JSON.stringify(enabled),
  }
}

/**
 * The interaction attributes of any node carrying {@link InteractiveProps}.
 *
 * The result is spread into a renderer's attribute record, or passed straight
 * to `buildAttrsString` — which drops `undefined` entries, so an element with
 * no declared intent emits nothing at all.
 *
 * Emission order is fixed (navigate, opens, toggles, action) so that rendered
 * HTML stays byte-stable across runs; the marker sits next to the target it
 * qualifies.
 */
export function interactiveAttrs(node: Partial<InteractiveProps>): InteractiveAttrs {
  const handlers = normalizeInteractionHandlers(node.on)
  return {
    'data-navigate': node.navigate,
    [EXTERNAL_NAVIGATE_ATTR]: isUrlTarget(node.navigate) ? true : undefined,
    'data-opens': node.opens,
    'data-toggles': node.toggles,
    'data-action': node.action,
    [TYPED_INTERACTION_ATTR]:
      handlers.length === 0
        ? undefined
        : JSON.stringify(handlers.map((handler) => interactionSignature(handler))),
    ...guardedOutcomeAttrs(node),
  }
}

/**
 * The `href` and interaction attributes of an element rendered as an `<a>`.
 *
 * An anchor is the one element with two channels that can carry a destination,
 * so it is the one element where they can contradict each other — and it is the
 * only place the choice between them has to be made. Both halves of that choice
 * are decided here so a renderer never has to know the rule:
 *
 * - An authored `href` is the anchor and is left exactly as written.
 * - Otherwise a URL-shaped `navigate` (see {@link isUrlTarget}) becomes the
 *   `href`, and no `data-navigate` goes out beside it. A URL is not a screen:
 *   emitting both would hand a consumer two destinations for one element and
 *   send a runtime hunting for a screen named `https://…`.
 * - Otherwise the `navigate` target names a page. The anchor stays inert `#` —
 *   `href="교환소 지도"` is a broken relative link — and the intent travels as
 *   `data-navigate` for the consumer that knows what pages are.
 *
 * When an `href` *and* a URL-shaped `navigate` are both authored, both are
 * emitted unchanged: the element already has its destination, and quietly
 * dropping the second one would hide a contradiction only the author can settle.
 * Naming that conflict belongs to validation, not to rendering.
 *
 * Elements that are not anchors keep {@link interactiveAttrs}: with no `href` to
 * move it into, a URL-shaped target has only the data attribute to travel in,
 * and dropping it there would discard what the author wrote. Those are the
 * elements {@link EXTERNAL_NAVIGATE_ATTR} exists for.
 */
export function anchorIntent(node: Partial<InteractiveProps> & { href?: string }): {
  href: string
  attrs: InteractiveAttrs
} {
  const attrs = interactiveAttrs(node)
  if (node.href) return { href: node.href, attrs }
  if (isUrlTarget(node.navigate)) {
    // The target left in the `href`, so the data attribute goes — and the marker
    // with it. A marker beside no `data-navigate` would qualify nothing.
    return {
      href: node.navigate.trim(),
      attrs: { ...attrs, 'data-navigate': undefined, [EXTERNAL_NAVIGATE_ATTR]: undefined },
    }
  }
  return { href: INERT_HREF, attrs }
}

/** Internal helper for non-anchor variants of otherwise anchor-based widgets. */
export function nonAnchorIntent(node: Partial<InteractiveProps>): InteractiveAttrs {
  return interactiveAttrs(node)
}
