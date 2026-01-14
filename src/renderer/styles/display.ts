/**
 * Display component styles (Image, Placeholder, Avatar, Badge, Icon)
 */

import type { ThemeConfig } from '../types';

export function generateDisplayStyles(_theme: ThemeConfig, prefix: string): string {
  return `/* Display Components */
.${prefix}-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 120px;
  max-width: 100%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(128, 128, 128, 0.05) 10px,
    rgba(128, 128, 128, 0.05) 20px
  );
  border: 1px dashed var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  color: var(--${prefix}-muted);
  font-size: 14px;
}

.${prefix}-image svg {
  opacity: 0.5;
}

img.${prefix}-image {
  display: block;
  border-style: solid;
  background: none;
}

.${prefix}-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0, 0, 0, 0.03) 10px,
    rgba(0, 0, 0, 0.03) 20px
  );
  border: 1px dashed var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  color: var(--${prefix}-muted);
  font-size: 14px;
}

.${prefix}-placeholder-with-children {
  position: relative;
}

.${prefix}-placeholder-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.${prefix}-placeholder-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.${prefix}-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--${prefix}-fg);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: var(--${prefix}-bg);
  overflow: hidden;
}

.${prefix}-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.${prefix}-avatar-xs { width: 24px; height: 24px; font-size: 10px; }
.${prefix}-avatar-sm { width: 32px; height: 32px; font-size: 12px; }
.${prefix}-avatar-md { width: 40px; height: 40px; font-size: 14px; }
.${prefix}-avatar-lg { width: 48px; height: 48px; font-size: 16px; }
.${prefix}-avatar-xl { width: 64px; height: 64px; font-size: 20px; }

.${prefix}-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--${prefix}-border);
  border-radius: var(--${prefix}-radius);
  background: var(--${prefix}-bg);
}

.${prefix}-badge-pill {
  border-radius: 9999px;
}

/* Dot badge - circular status indicator (for empty badges) */
.${prefix}-badge-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
  background: var(--${prefix}-border);
}
.${prefix}-badge-dot.${prefix}-badge-success { background: var(--${prefix}-success); border-color: var(--${prefix}-success); }
.${prefix}-badge-dot.${prefix}-badge-warning { background: var(--${prefix}-warning); border-color: var(--${prefix}-warning); }
.${prefix}-badge-dot.${prefix}-badge-danger { background: var(--${prefix}-danger); border-color: var(--${prefix}-danger); }
.${prefix}-badge-dot.${prefix}-badge-primary { background: var(--${prefix}-primary); border-color: var(--${prefix}-primary); }

.${prefix}-badge-default { }
.${prefix}-badge-primary { background: var(--${prefix}-primary); color: white; border-color: var(--${prefix}-primary); }
.${prefix}-badge-secondary { background: var(--${prefix}-muted); color: white; border-color: var(--${prefix}-muted); }
.${prefix}-badge-success { border-color: var(--${prefix}-success); }
.${prefix}-badge-warning { border-color: var(--${prefix}-warning); }
.${prefix}-badge-danger { border-color: var(--${prefix}-danger); }
.${prefix}-badge-info { border-color: var(--${prefix}-primary); }

/* Icon badge - circular background with icon */
.${prefix}-badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  color: var(--${prefix}-fg);
}

.${prefix}-badge-icon svg {
  width: 20px;
  height: 20px;
}

/* Icon badge sizes - use higher specificity to override svg.wf-icon */
.${prefix}-badge-icon-xs { width: 24px; height: 24px; }
.${prefix}-badge-icon-xs svg.${prefix}-icon { width: 12px; height: 12px; }
.${prefix}-badge-icon-sm { width: 32px; height: 32px; }
.${prefix}-badge-icon-sm svg.${prefix}-icon { width: 16px; height: 16px; }
.${prefix}-badge-icon-md { width: 40px; height: 40px; }
.${prefix}-badge-icon-md svg.${prefix}-icon { width: 20px; height: 20px; }
.${prefix}-badge-icon-lg { width: 48px; height: 48px; }
.${prefix}-badge-icon-lg svg.${prefix}-icon { width: 24px; height: 24px; }
.${prefix}-badge-icon-xl { width: 64px; height: 64px; }
.${prefix}-badge-icon-xl svg.${prefix}-icon { width: 32px; height: 32px; }

.${prefix}-badge-icon-primary,
.${prefix}-badge-icon-success,
.${prefix}-badge-icon-warning,
.${prefix}-badge-icon-danger {
  background: rgba(0, 0, 0, 0.05);
  color: var(--${prefix}-fg);
}

.${prefix}-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  vertical-align: middle;
  flex-shrink: 0;
}

/* SVG icons - size is controlled by CSS, not HTML attributes */
svg.${prefix}-icon {
  width: 16px;
  height: 16px;
  display: block;
}

/* Icon size tokens - matches SVG renderer */
svg.${prefix}-icon-xs { width: 12px; height: 12px; }
svg.${prefix}-icon-sm { width: 16px; height: 16px; }
svg.${prefix}-icon-md { width: 20px; height: 20px; }
svg.${prefix}-icon-lg { width: 24px; height: 24px; }
svg.${prefix}-icon-xl { width: 32px; height: 32px; }

.${prefix}-icon svg {
  display: block;
}

.${prefix}-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}`;
}
