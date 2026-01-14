/**
 * JSON export functionality
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import type { JsonNode, JsonExportResult, ExportOptions } from './types';
import { getNodeContent, extractAttributes, countNodes, getComponentTypes } from './utils';

/**
 * Convert AST node to JSON node
 */
function nodeToJson(node: AnyNode, options: ExportOptions): JsonNode {
  const jsonNode: JsonNode = {
    type: node.type.toLowerCase(),
    attributes: extractAttributes(node, options),
    children: [],
  };

  // Add content if present
  const content = getNodeContent(node);
  if (content) {
    jsonNode.content = content;
  }

  // Add location if requested
  if (options.includeLocations && node.loc) {
    jsonNode.location = {
      line: node.loc.start.line,
      column: node.loc.start.column,
    };
  }

  // Process children
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child === 'object' && 'type' in child) {
        jsonNode.children.push(nodeToJson(child as AnyNode, options));
      }
    }
  }

  return jsonNode;
}

/**
 * Export wireframe to JSON format
 *
 * @param doc - The parsed wireframe document
 * @param options - Export options
 * @returns JSON export result
 */
export function exportToJson(
  doc: WireframeDocument,
  options: ExportOptions = {}
): JsonExportResult {
  const pages: JsonNode[] = [];

  for (const page of doc.children || []) {
    pages.push(nodeToJson(page as unknown as AnyNode, options));
  }

  return {
    version: '1.0.0',
    format: 'json',
    pages,
    metadata: {
      exportedAt: new Date().toISOString(),
      sourceFormat: 'wireweave',
      nodeCount: countNodes(doc),
      componentTypes: getComponentTypes(doc),
    },
  };
}

/**
 * Export wireframe to JSON string
 *
 * @param doc - The parsed wireframe document
 * @param options - Export options
 * @returns JSON string
 */
export function exportToJsonString(
  doc: WireframeDocument,
  options: ExportOptions = {}
): string {
  const result = exportToJson(doc, options);
  return options.prettyPrint
    ? JSON.stringify(result, null, 2)
    : JSON.stringify(result);
}

/**
 * Import from JSON format back to simplified structure
 *
 * @param json - JSON export result
 * @returns Simplified page array
 */
export function importFromJson(json: JsonExportResult): JsonNode[] {
  return json.pages;
}
