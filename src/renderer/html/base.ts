/**
 * Base HTML Renderer for wireweave
 *
 * Provides abstract base class for HTML rendering with theme support
 */

import type { WireframeDocument, AnyNode } from '../../ast/types';
import type { RenderOptions, RenderResult, RenderContext, ThemeConfig } from '../types';
import { defaultTheme, darkTheme } from '../types';
import { generateStyles } from '../styles';

/**
 * Default render options
 */
const DEFAULT_OPTIONS: Required<RenderOptions> = {
  theme: 'light',
  scale: 1,
  includeStyles: true,
  minify: false,
  classPrefix: 'wf',
};

/**
 * Abstract base renderer class
 *
 * Provides core infrastructure for HTML rendering:
 * - Theme management
 * - Indentation and formatting
 * - Depth tracking for nested elements
 */
export abstract class BaseRenderer {
  protected context: RenderContext;

  constructor(options: RenderOptions = {}) {
    const resolvedOptions: Required<RenderOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.context = {
      options: resolvedOptions,
      theme: this.buildTheme(resolvedOptions),
      depth: 0,
    };
  }

  /**
   * Build theme configuration based on options
   */
  protected buildTheme(options: Required<RenderOptions>): ThemeConfig {
    return options.theme === 'dark' ? { ...darkTheme } : { ...defaultTheme };
  }

  /**
   * Render a wireframe document to HTML and CSS
   */
  render(document: WireframeDocument): RenderResult {
    const html = this.renderDocument(document);
    const css = this.context.options.includeStyles
      ? generateStyles(this.context.theme, this.context.options.classPrefix)
      : '';

    return {
      html: this.context.options.minify ? this.minifyHtml(html) : html,
      css: this.context.options.minify ? this.minifyCss(css) : css,
    };
  }

  /**
   * Render a complete wireframe document
   */
  protected renderDocument(document: WireframeDocument): string {
    const pages = document.children
      .map((page) => this.renderPage(page))
      .join(this.context.options.minify ? '' : '\n');

    return pages;
  }

  /**
   * Render a page node (to be implemented by subclasses)
   */
  protected abstract renderPage(node: AnyNode): string;

  /**
   * Render any AST node (to be implemented by subclasses)
   */
  protected abstract renderNode(node: AnyNode): string;

  /**
   * Get the CSS class prefix
   */
  protected get prefix(): string {
    return this.context.options.classPrefix;
  }

  /**
   * Add indentation based on current depth
   */
  protected indent(content: string): string {
    if (this.context.options.minify) {
      return content;
    }

    const spaces = '  '.repeat(this.context.depth);
    return content
      .split('\n')
      .map((line) => (line.trim() ? spaces + line : line))
      .join('\n');
  }

  /**
   * Execute a function with increased depth
   */
  protected withDepth<T>(fn: () => T): T {
    this.context.depth++;
    const result = fn();
    this.context.depth--;
    return result;
  }

  /**
   * Escape HTML special characters
   */
  protected escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
  }

  /**
   * Build a CSS class string from an array of class names
   */
  protected buildClassString(classes: (string | undefined | false)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  /**
   * Build HTML attributes string
   */
  protected buildAttrsString(attrs: Record<string, string | undefined | boolean>): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === false) {
        continue;
      }

      if (value === true) {
        parts.push(key);
      } else {
        parts.push(`${key}="${this.escapeHtml(value)}"`);
      }
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  /**
   * Simple HTML minification
   */
  private minifyHtml(html: string): string {
    return html
      .replace(/\n\s*/g, '')
      .replace(/>\s+</g, '><')
      .trim();
  }

  /**
   * Simple CSS minification
   */
  private minifyCss(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
  }
}
