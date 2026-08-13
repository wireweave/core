/** CSS needed to switch composed screens inside a rendered site. */
export function generateSiteStyles(prefix: string): string {
  return `
/* ===== Site composition (renderSite) ===== */

.${prefix}-site {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

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

.${prefix}-site .${prefix}-page {
  overflow: auto !important;
}

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

.${prefix}-site .${prefix}-screen > .${prefix}-col {
  flex: 1;
  min-height: 0;
}

.${prefix}-site .${prefix}-closed {
  display: none;
}
`
}
