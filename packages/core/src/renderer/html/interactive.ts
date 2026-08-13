/**
 * Shared interaction intent emitted by HTML renderers.
 *
 * Anchor renderers have two destination channels (`href` and
 * `data-navigate`), so the choice between them must have one owner. Consumers
 * such as Studio import {@link anchorIntent} to observe the same decision as
 * the renderer instead of reimplementing it.
 */

import type { InteractiveProps } from '../../ast/types'
import { isUrlTarget } from '../../interaction/target'

const EXTERNAL_NAVIGATE_ATTR = 'data-navigate-external' as const

export type InteractiveAttrs = {
  'data-navigate': string | undefined
  'data-navigate-external': true | undefined
  'data-opens': string | undefined
  'data-toggles': string | undefined
  'data-action': string | undefined
}

function interactiveAttrs(node: Partial<InteractiveProps>): InteractiveAttrs {
  return {
    'data-navigate': node.navigate,
    [EXTERNAL_NAVIGATE_ATTR]: isUrlTarget(node.navigate) ? true : undefined,
    'data-opens': node.opens,
    'data-toggles': node.toggles,
    'data-action': node.action,
  }
}

/**
 * Resolve the attributes emitted for a node rendered as an anchor.
 *
 * An authored `href` wins. Otherwise a URL-shaped `navigate` becomes the real
 * `href`; a page-name target remains in `data-navigate` and the anchor receives
 * an inert `#` href. Other interaction intents are preserved in every branch.
 */
export function anchorIntent(node: Partial<InteractiveProps> & { href?: string }): {
  href: string
  attrs: InteractiveAttrs
} {
  const attrs = interactiveAttrs(node)
  if (node.href) return { href: node.href, attrs }
  if (isUrlTarget(node.navigate)) {
    return {
      href: node.navigate.trim(),
      attrs: {
        ...attrs,
        'data-navigate': undefined,
        [EXTERNAL_NAVIGATE_ATTR]: undefined,
      },
    }
  }
  return { href: '#', attrs }
}

/** Internal helper for non-anchor variants of otherwise anchor-based widgets. */
export function nonAnchorIntent(node: Partial<InteractiveProps>): InteractiveAttrs {
  return interactiveAttrs(node)
}
