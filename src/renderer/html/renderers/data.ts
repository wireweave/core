/**
 * Data Renderers (Table, List)
 */

import type {
  TableNode,
  ListNode,
} from '../../../ast/types';
import type { RenderContext } from './types';
import { renderTableCellContent } from '../semantic';

/**
 * Render Table node
 */
export function renderTable(node: TableNode, ctx: RenderContext): string {
  const classes = ctx.buildClassString([
    `${ctx.prefix}-table`,
    node.striped ? `${ctx.prefix}-table-striped` : undefined,
    node.bordered ? `${ctx.prefix}-table-bordered` : undefined,
    node.hover ? `${ctx.prefix}-table-hover` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const thead = `<thead><tr>${node.columns
    .map((col) => `<th>${ctx.escapeHtml(col)}</th>`)
    .join('')}</tr></thead>`;

  const tbody = `<tbody>${node.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => {
            if (typeof cell === 'string') {
              // Support semantic markers and newlines in table cells
              return `<td>${renderTableCellContent(cell, ctx.prefix, ctx.escapeHtml)}</td>`;
            }
            return `<td>${ctx.renderNode(cell)}</td>`;
          })
          .join('')}</tr>`
    )
    .join('')}</tbody>`;

  return `<table class="${classes}"${styleAttr}>\n${thead}\n${tbody}\n</table>`;
}

/**
 * Render List node
 */
export function renderList(node: ListNode, ctx: RenderContext): string {
  const tag = node.ordered ? 'ol' : 'ul';
  const classes = ctx.buildClassString([
    `${ctx.prefix}-list`,
    node.ordered ? `${ctx.prefix}-list-ordered` : undefined,
    node.none ? `${ctx.prefix}-list-none` : undefined,
    ...ctx.getCommonClasses(node),
  ]);

  const styles = ctx.buildCommonStyles(node);
  const styleAttr = styles ? ` style="${styles}"` : '';

  const items = node.items
    .map((item) => {
      if (typeof item === 'string') {
        return `<li class="${ctx.prefix}-list-item">${ctx.escapeHtml(item)}</li>`;
      }
      return `<li class="${ctx.prefix}-list-item">${ctx.escapeHtml(item.content)}</li>`;
    })
    .join('\n');

  return `<${tag} class="${classes}"${styleAttr}>\n${items}\n</${tag}>`;
}
