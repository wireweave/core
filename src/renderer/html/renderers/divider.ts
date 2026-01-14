/**
 * Divider Renderer
 */

import type { DividerComponentNode } from '../../../ast/types';
import type { RenderContext } from './types';

/**
 * Render Divider node
 */
export function renderDivider(node: DividerComponentNode, ctx: RenderContext): string {
  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  return `<hr class="${ctx.prefix}-divider"${styleAttr} />`;
}
