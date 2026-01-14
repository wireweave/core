/**
 * Container component styles (Card, Modal, Drawer, Accordion)
 */

export function generateContainerStyles(prefix: string): string {
  return `/* Container Components */
.${prefix}-card {
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  background: var(--${prefix}-bg);
  padding: 16px;
}

/* Cards in flex rows: respect explicit width, shrink if needed */
.${prefix}-row > .${prefix}-card {
  flex: 0 1 auto;
  min-width: 0;
}

/* Cards without explicit width should expand to fill space */
.${prefix}-row > .${prefix}-card-flex {
  flex: 1 1 0%;
}

.${prefix}-card-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.${prefix}-card-shadow-sm { box-shadow: var(--${prefix}-shadow-sm); }
.${prefix}-card-shadow-md { box-shadow: var(--${prefix}-shadow-md); }
.${prefix}-card-shadow-lg { box-shadow: var(--${prefix}-shadow-lg); }
.${prefix}-card-shadow-xl { box-shadow: var(--${prefix}-shadow-xl); }

.${prefix}-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.${prefix}-modal {
  background: var(--${prefix}-bg);
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  box-shadow: var(--${prefix}-shadow-xl);
  padding: 24px;
  min-width: 320px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.${prefix}-modal-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.${prefix}-drawer {
  position: fixed;
  background: var(--${prefix}-bg);
  border: 1px solid var(--${prefix}-border);
  box-shadow: var(--${prefix}-shadow-xl);
  padding: 16px;
  overflow: auto;
  z-index: 1000;
}

.${prefix}-drawer-left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  border-right: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  border-left: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-top {
  top: 0;
  left: 0;
  right: 0;
  height: auto;
  max-height: 50vh;
  border-bottom: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: auto;
  max-height: 50vh;
  border-top: 1px solid var(--${prefix}-border);
}

.${prefix}-drawer-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.${prefix}-accordion {
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
}

.${prefix}-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--${prefix}-border);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}

.${prefix}-accordion-header:hover {
  background: rgba(0, 0, 0, 0.02);
}

.${prefix}-accordion-content {
  padding: 16px;
}`;
}
