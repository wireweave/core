/**
 * Renderer type definitions for wireweave
 *
 * Provides types for rendering options, themes, and context
 */

// ===========================================
// Render Options
// ===========================================

/** Annotation presentation used by the renderer. */
export type AnnotationStyle = 'legacy' | 'neutral'

export interface RenderOptions {
  /** Theme variant */
  theme?: 'light' | 'dark'
  /** Scale factor for sizing */
  scale?: number
  /** Include CSS styles in output */
  includeStyles?: boolean
  /** Minify output (no indentation/newlines) */
  minify?: boolean
  /** CSS class prefix for scoping */
  classPrefix?: string
  /** Background color (e.g., '#ffffff', 'transparent') */
  background?: string
  /**
   * Annotation presentation. Defaults to `legacy` so existing render output
   * stays unchanged; use `neutral` for deterministic grayscale annotations.
   */
  annotationStyle?: AnnotationStyle
  /**
   * Emit source-anchor attributes (`data-wf-path` / `data-wf-loc`) on each
   * rendered component element, enabling DOM ↔ AST ↔ source mapping. Default
   * `false` — output is byte-identical to non-anchored rendering when off.
   */
  sourceAnchors?: boolean
  /**
   * Prefix prepended to every DOM `id` this render emits.
   *
   * An authored `id` is unique inside the page that declares it and nowhere
   * else, which is all a page needs while it is a document of its own. Compose
   * several pages into one document and that stops being true: two screens
   * declaring `confirm` produce two elements with the same id, and a duplicate
   * id is not a rendering bug — the picture is right — but it is a lie told to
   * every reader of the DOM. Devtools resolve it to the first match, the
   * accessibility tree treats `aria-*` references as pointing at one element,
   * and any external tool doing `#confirm` gets an arbitrary one of them.
   *
   * Default `''` — no prefix, so output is byte-identical to unscoped
   * rendering when unset, which is what every existing entry point does.
   * `renderSite` sets it per screen and per shell, because it is the one
   * renderer that puts pages of different origin in the same document.
   *
   * Authored intent is not rewritten: the interaction attributes that point at
   * an overlay keep the name their author wrote, and their consumer composes
   * the scope back on. The prefix belongs to identity, not to intent.
   */
  idScope?: string
}

export interface RenderResult {
  /** Rendered HTML content */
  html: string
  /** Generated CSS styles */
  css: string
}

/**
 * Result of rendering a single page in isolation (`renderPage`).
 * Carries the resolved pixel dimensions so callers (export pipelines, hosts)
 * can size their wrapper without re-resolving viewport/device themselves.
 */
export interface PageRenderResult extends RenderResult {
  width: number
  height: number
}

export interface CanvasOptions extends RenderOptions {
  /** Gap between auto-laid-out pages, in pixels. Default `64`. */
  gap?: number
}

export interface CanvasRenderResult extends RenderResult {
  /** Total canvas width — bounding box of all pages. */
  width: number
  /** Total canvas height — bounding box of all pages. */
  height: number
}

export interface SvgRenderOptions {
  /** Width of the SVG viewport */
  width?: number
  /** Height of the SVG viewport */
  height?: number
  /** Padding around content */
  padding?: number
  /** Scale factor */
  scale?: number
  /** Background color */
  background?: string
  /** Font family */
  fontFamily?: string
  /** Theme variant */
  theme?: 'light' | 'dark'
}

export interface SvgRenderResult {
  /** Rendered SVG content */
  svg: string
  /** Actual width */
  width: number
  /** Actual height */
  height: number
}

// ===========================================
// Render Context
// ===========================================

export interface RenderContext {
  /** Resolved render options */
  options: Required<RenderOptions>
  /** Theme configuration */
  theme: ThemeConfig
  /** Current nesting depth for indentation */
  depth: number
}

// ===========================================
// Theme Configuration
// ===========================================

export interface ThemeColors {
  /** Primary action color */
  primary: string
  /** Secondary/muted action color */
  secondary: string
  /** Success state color */
  success: string
  /** Warning state color */
  warning: string
  /** Danger/error state color */
  danger: string
  /** Muted/disabled color */
  muted: string
  /** Background color */
  background: string
  /** Foreground/text color */
  foreground: string
  /** Border color */
  border: string
}

export interface ThemeConfig {
  /** Color palette */
  colors: ThemeColors
  /** Spacing scale (number -> px value) */
  spacing: Record<number, string>
  /** Border radius */
  radius: string
  /** Font family */
  fontFamily: string
  /** Shadow styles */
  shadows: Record<string, string>
}

// ===========================================
// Default Theme (Wireframe Style - Black/White/Gray)
// ===========================================

/**
 * Default wireframe theme using black/white/gray palette
 * Follows wireweave design principles for sketch-like appearance
 */
export const defaultTheme: ThemeConfig = {
  colors: {
    // Wireframe uses minimal colors - black/white/gray
    primary: '#000000',
    secondary: '#888888',
    success: '#888888',
    warning: '#888888',
    danger: '#888888',
    muted: '#888888',
    background: '#FFFFFF',
    foreground: '#000000',
    border: '#000000',
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },
  radius: '4px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.15)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
  },
}

/**
 * Dark theme configuration
 * Inverts colors for dark mode display
 */
export const darkTheme: ThemeConfig = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: '#1A1A1A',
    foreground: '#FFFFFF',
    border: '#FFFFFF',
    primary: '#FFFFFF',
    muted: '#888888',
  },
}

/**
 * Get theme configuration by name
 */
export function getTheme(name: 'light' | 'dark'): ThemeConfig {
  return name === 'dark' ? darkTheme : defaultTheme
}
