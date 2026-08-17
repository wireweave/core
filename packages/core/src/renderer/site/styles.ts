/**
 * The stylesheet a `renderSite` document adds on top of the component styles.
 *
 * It is small on purpose. Everything a screen looks like already comes from
 * `generateStyles`; the only thing missing from a document holding many screens
 * is which one you are looking at. These rules answer that, and they are
 * appended after the component styles so that where they overlap (an overlay's
 * `display`, a shell's frame) they win on document order rather than on
 * `!important`. The single exception is the page frame's overflow, which the
 * page renderer writes as an inline style — the one thing document order cannot
 * outrank. See the rule for why a site document has to override it.
 *
 * ## Why a shell is not repeated
 *
 * A layout's markup is emitted once and every screen that uses it is hosted
 * inside that one copy. Hiding a per-screen duplicate of the shell would show
 * the same picture while keeping the cost the composition exists to remove, so
 * the shell is structurally shared and only the *screens* are switched. The
 * rules below are therefore about screens, never about shells duplicating.
 */

/**
 * Site-level CSS, scoped under `.<prefix>-site` so a host page embedding the
 * output keeps its own layout.
 */
export function generateSiteStyles(prefix: string): string {
  return `
/* ===== Site composition (renderSite) ===== */

.${prefix}-site {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* A shell and a standalone screen are both top-level frames: exactly one of
   them is on at a time. Screens inside a shell switch within it. */
.${prefix}-site > .${prefix}-shell,
.${prefix}-site > .${prefix}-screen {
  display: none;
}

.${prefix}-site > .${prefix}-shell.${prefix}-on {
  display: flex;
  flex-direction: column;
}

.${prefix}-site > .${prefix}-screen.${prefix}-on {
  display: block;
}

/* A site document is a running prototype, not a canvas thumbnail. The page
   renderer sizes a page to its authored viewport and clips what runs past it
   with an inline \`overflow: hidden\` — right for a thumbnail, where a page is a
   picture, and wrong here, where it is a screen someone is using: a settings
   page authored 14x taller than its viewport would keep 93% of itself
   unreachable. The frame stays exactly as authored and only the overflow
   becomes reachable. \`!important\` is unavoidable and confined to this rule:
   the declaration being overridden is inline. */
.${prefix}-site .${prefix}-page {
  overflow: auto !important;
}

/* The slot is where a layout hands its frame over to page content, so it takes
   the space a page's own root would have taken. */
.${prefix}-site .${prefix}-slot {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.${prefix}-site .${prefix}-slot > .${prefix}-screen {
  display: none;
}

.${prefix}-site .${prefix}-slot > .${prefix}-screen.${prefix}-on {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* Page-root layout rules key off \`.${prefix}-page > …\`. A screen composed into
   a shell is one level further in, so the same rules are restated for it —
   otherwise a sidebar row would stop filling its frame the moment a page
   started using a layout. */
.${prefix}-site .${prefix}-screen > .${prefix}-col {
  flex: 1;
  min-height: 0;
}

.${prefix}-site .${prefix}-screen > .${prefix}-row:has(.${prefix}-sidebar),
.${prefix}-site .${prefix}-screen > .${prefix}-row:has(.${prefix}-main),
.${prefix}-site .${prefix}-screen > .${prefix}-col > .${prefix}-row:has(.${prefix}-sidebar),
.${prefix}-site .${prefix}-screen > .${prefix}-col > .${prefix}-row:has(.${prefix}-main) {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

/* Overlays something opens start closed; overlays nothing opens are part of
   the screen as drawn and never get this class. Two class selectors so the
   rule outranks \`.${prefix}-modal-backdrop\` / \`.${prefix}-drawer\` on
   specificity, not only on order. */
.${prefix}-site .${prefix}-closed {
  display: none;
}

/* State guards use the native hidden/disabled semantics. Component display
   rules can be more specific than the browser stylesheet, so hidden is held at
   the site boundary explicitly. */
.${prefix}-site [hidden] {
  display: none !important;
}
`
}
