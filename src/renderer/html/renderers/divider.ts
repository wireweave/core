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
  const verticalClass = node.vertical ? ` ${ctx.prefix}-divider-vertical` : '';

  return `<hr class="${ctx.prefix}-divider${verticalClass}"${styleAttr} />`;
}
