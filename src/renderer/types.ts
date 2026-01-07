/**
 * Renderer type definitions for wireweave
 *
 * Provides types for rendering options, themes, and context
 */

// ===========================================
// Render Options
// ===========================================

export interface RenderOptions {
  /** Theme variant */
  theme?: 'light' | 'dark';
  /** Scale factor for sizing */
  scale?: number;
  /** Include CSS styles in output */
  includeStyles?: boolean;
  /** Minify output (no indentation/newlines) */
  minify?: boolean;
  /** CSS class prefix for scoping */
  classPrefix?: string;
}

export interface RenderResult {
  /** Rendered HTML content */
  html: string;
  /** Generated CSS styles */
  css: string;
}

export interface SvgRenderOptions {
  /** Width of the SVG viewport */
  width?: number;
  /** Height of the SVG viewport */
  height?: number;
  /** Padding around content */
  padding?: number;
  /** Scale factor */
  scale?: number;
  /** Background color */
  background?: string;
  /** Font family */
  fontFamily?: string;
}

export interface SvgRenderResult {
  /** Rendered SVG content */
  svg: string;
  /** Actual width */
  width: number;
  /** Actual height */
  height: number;
}

// ===========================================
// Render Context
// ===========================================

export interface RenderContext {
  /** Resolved render options */
  options: Required<RenderOptions>;
  /** Theme configuration */
  theme: ThemeConfig;
  /** Current nesting depth for indentation */
  depth: number;
}

// ===========================================
// Theme Configuration
// ===========================================

export interface ThemeColors {
  /** Primary action color */
  primary: string;
  /** Secondary/muted action color */
  secondary: string;
  /** Success state color */
  success: string;
  /** Warning state color */
  warning: string;
  /** Danger/error state color */
  danger: string;
  /** Muted/disabled color */
  muted: string;
  /** Background color */
  background: string;
  /** Foreground/text color */
  foreground: string;
  /** Border color */
  border: string;
}

export interface ThemeConfig {
  /** Color palette */
  colors: ThemeColors;
  /** Spacing scale (number -> px value) */
  spacing: Record<number, string>;
  /** Border radius */
  radius: string;
  /** Font family */
  fontFamily: string;
  /** Shadow styles */
  shadows: Record<string, string>;
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
};

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
};

/**
 * Get theme configuration by name
 */
export function getTheme(name: 'light' | 'dark'): ThemeConfig {
  return name === 'dark' ? darkTheme : defaultTheme;
}
