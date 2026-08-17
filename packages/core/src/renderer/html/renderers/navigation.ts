/**
 * Navigation Renderers (Nav, Tabs, Breadcrumb)
 */

import type {
  NavNode,
  TabsNode,
  BreadcrumbNode,
  NavChild,
  NavItem,
  NavBlockItem,
} from '../../../ast/types'
import type { RenderContext } from './types'
import { anchorIntent, interactiveAttrs, INERT_HREF } from '../interactive'

/**
 * Render helper icon HTML
 */
function renderIconHtml(iconName: string, prefix: string): string {
  return `<span class="${prefix}-icon" data-icon="${iconName}"></span>`
}

/**
 * Render a single nav item — array syntax (`nav ["…"]`) and block syntax
 * (`nav { item … }`) produce identical markup, so both go through here.
 *
 * `href` and the interaction attributes are two different layers: `href` is the
 * anchor a browser follows, while `data-navigate` and friends are the *declared*
 * screen-transition intent that the transition graph and the studio runtime
 * consume. Collapsing one into the other would lose the distinction
 * `extract/transitions.ts` relies on, so `anchorIntent` owns the single rule
 * deciding which channel a destination travels in.
 */
function renderNavItem(item: NavItem | NavBlockItem, ctx: RenderContext): string {
  const linkClasses = ctx.buildClassString([
    `${ctx.prefix}-nav-link`,
    item.active ? `${ctx.prefix}-nav-link-active` : undefined,
    item.disabled ? `${ctx.prefix}-nav-link-disabled` : undefined,
  ])
  const iconHtml = item.icon ? renderIconHtml(item.icon, ctx.prefix) + ' ' : ''
  const { href, attrs } = anchorIntent(item)
  const intentAttrs = ctx.buildAttrsString(attrs)
  return `<a class="${linkClasses}" href="${ctx.escapeHtml(href)}"${intentAttrs}>${iconHtml}${ctx.escapeHtml(item.label)}</a>`
}

/**
 * Render nav children (groups, items, dividers)
 */
function renderNavChildren(children: NavChild[], ctx: RenderContext): string {
  return children
    .map((child) => {
      if (child.type === 'Divider') {
        return `<hr class="${ctx.prefix}-nav-divider" />`
      }
      if (child.type === 'NavGroup') {
        const groupItems = child.items
          .map((item) => {
            if (item.type === 'Divider') {
              return `<hr class="${ctx.prefix}-nav-divider" />`
            }
            return renderNavItem(item, ctx)
          })
          .join('\n')
        return `<div class="${ctx.prefix}-nav-group">
  <div class="${ctx.prefix}-nav-group-label">${ctx.escapeHtml(child.label)}</div>
${groupItems}
</div>`
      }
      if (child.type === 'NavItem') {
        return renderNavItem(child, ctx)
      }
      return ''
    })
    .join('\n')
}

/**
 * Render Nav node
 */
export function renderNav(node: NavNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-nav`,
    node.vertical ? `${ctx.prefix}-nav-vertical` : undefined,
    ...ctx.getCommonClasses(node),
  ])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  // If block syntax (children), render children
  if (node.children && node.children.length > 0) {
    const content = renderNavChildren(node.children, ctx)
    return `<nav class="${classes}"${styleAttr}>\n${content}\n</nav>`
  }

  // Array syntax (items)
  const items = node.items
    .map((item) => {
      if (typeof item === 'string') {
        // Bare label: no href, no declared intent, nothing to carry.
        return `<a class="${ctx.prefix}-nav-link" href="${INERT_HREF}">${ctx.escapeHtml(item)}</a>`
      }
      return renderNavItem(item, ctx)
    })
    .join('\n')

  return `<nav class="${classes}"${styleAttr}>\n${items}\n</nav>`
}

/**
 * Render Tabs node
 *
 * Tab items are plain strings in the AST (`TabsNode.items: string[]`) and carry
 * no {@link InteractiveProps}, so there is no declared intent to emit — the
 * same reason `extract/transitions.ts` derives no transition from them. A tab's
 * panel content is reached by normal traversal instead. Giving tabs their own
 * `navigate` would be a grammar and AST change, not a renderer one.
 */
export function renderTabs(node: TabsNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([`${ctx.prefix}-tabs`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const tabList = node.items
    .map((label, idx) => {
      const isActive = idx === (node.active || 0)
      const tabClasses = `${ctx.prefix}-tab${isActive ? ` ${ctx.prefix}-tab-active` : ''}`
      return `<button class="${tabClasses}" role="tab" aria-selected="${isActive}">${ctx.escapeHtml(label)}</button>`
    })
    .join('\n')

  return `<div class="${classes}"${styleAttr}>
  <div class="${ctx.prefix}-tab-list" role="tablist">
${tabList}
  </div>
</div>`
}

/**
 * Render Breadcrumb node
 */
export function renderBreadcrumb(node: BreadcrumbNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([`${ctx.prefix}-breadcrumb`, ...ctx.getCommonClasses(node)])

  const styles = ctx.buildCommonStyles(node)
  const styleAttr = styles ? ` style="${styles}"` : ''

  const separator = `<span class="${ctx.prefix}-breadcrumb-separator" aria-hidden="true">|</span>`

  const items = node.items
    .map((item, idx) => {
      const isLast = idx === node.items.length - 1
      if (typeof item === 'string') {
        return isLast
          ? `<span class="${ctx.prefix}-breadcrumb-item" aria-current="page">${ctx.escapeHtml(item)}</span>`
          : `<a class="${ctx.prefix}-breadcrumb-item" href="${INERT_HREF}">${ctx.escapeHtml(item)}</a>`
      }
      // The trailing crumb is the current page, so it stays a non-anchor
      // `<span aria-current="page">` (WCAG 2.2 — the current location must not
      // present itself as a link). Declared intent is still carried: it is data
      // the author wrote and `extract/transitions.ts` already emits an edge for
      // it, so dropping it here would put renderer and extractor out of step.
      // A `data-*` attribute on a `<span>` adds no role and no tab stop. Having
      // no `href`, that crumb also keeps a URL-shaped target in the attribute —
      // there is no anchor to move it into.
      if (isLast) {
        const spanAttrs = ctx.buildAttrsString(interactiveAttrs(item))
        return `<span class="${ctx.prefix}-breadcrumb-item" aria-current="page"${spanAttrs}>${ctx.escapeHtml(item.label)}</span>`
      }
      const { href, attrs } = anchorIntent(item)
      const intentAttrs = ctx.buildAttrsString(attrs)
      return `<a class="${ctx.prefix}-breadcrumb-item" href="${ctx.escapeHtml(href)}"${intentAttrs}>${ctx.escapeHtml(item.label)}</a>`
    })
    .join(separator)

  return `<nav class="${classes}"${styleAttr} aria-label="Breadcrumb">${items}</nav>`
}
