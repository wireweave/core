/**
 * Render Context Interface
 *
 * Provides common utilities and state needed by renderer functions
 */

import type { AnyNode, CommonProps } from '../../../ast/types';

/**
 * Common style props type (excludes 'align' for compatibility)
 */
export type StyleProps = Omit<Partial<CommonProps>, 'align'> & { align?: string };

/**
 * Context object passed to renderer functions
 */
export interface RenderContext {
  /** CSS class prefix (e.g., 'wf') */
  prefix: string;

  /** Escape HTML special characters */
  escapeHtml: (text: string) => string;

  /** Build CSS class string from array */
  buildClassString: (classes: (string | undefined | false)[]) => string;

  /** Build HTML attributes string */
  buildAttrsString: (attrs: Record<string, string | boolean | undefined>) => string;

  /** Build common inline styles */
  buildCommonStyles: (props: StyleProps) => string;

  /** Get common CSS classes from props */
  getCommonClasses: (props: StyleProps) => string[];

  /** Render child nodes */
  renderChildren: (children: AnyNode[]) => string;

  /** Render single node (for nested content like table cells) */
  renderNode: (node: AnyNode) => string;
}
