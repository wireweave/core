/**
 * Figma export functionality
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import type { FigmaNode, FigmaExportResult, FigmaNodeType } from './types';
import { getNodeContent, extractAttributes, getComponentTypes } from './utils';

/**
 * Generate unique ID for Figma nodes
 */
let figmaIdCounter = 0;

function generateFigmaId(): string {
  return `node-${++figmaIdCounter}`;
}

/**
 * Reset Figma ID counter
 */
export function resetFigmaIdCounter(): void {
  figmaIdCounter = 0;
}

/**
 * Map Wireweave type to Figma type
 */
function mapToFigmaType(type: string): FigmaNodeType {
  const typeMap: Record<string, FigmaNodeType> = {
    page: 'CANVAS',
    header: 'FRAME',
    main: 'FRAME',
    footer: 'FRAME',
    sidebar: 'FRAME',
    section: 'FRAME',
    row: 'FRAME',
    col: 'FRAME',
    card: 'FRAME',
    modal: 'FRAME',
    drawer: 'FRAME',
    accordion: 'FRAME',
    text: 'TEXT',
    title: 'TEXT',
    link: 'TEXT',
    button: 'FRAME',
    input: 'FRAME',
    textarea: 'FRAME',
    select: 'FRAME',
    checkbox: 'FRAME',
    radio: 'FRAME',
    switch: 'FRAME',
    slider: 'FRAME',
    image: 'RECTANGLE',
    placeholder: 'RECTANGLE',
    avatar: 'FRAME',
    badge: 'FRAME',
    icon: 'FRAME',
    table: 'FRAME',
    list: 'FRAME',
    alert: 'FRAME',
    toast: 'FRAME',
    progress: 'FRAME',
    spinner: 'FRAME',
    tooltip: 'FRAME',
    popover: 'FRAME',
    dropdown: 'FRAME',
    nav: 'FRAME',
    tabs: 'FRAME',
    breadcrumb: 'FRAME',
    divider: 'RECTANGLE',
  };

  return typeMap[type.toLowerCase()] || 'FRAME';
}

/**
 * Convert AST node to Figma-compatible node
 */
function nodeToFigma(node: AnyNode): FigmaNode {
  const figmaType = mapToFigmaType(node.type);
  const content = getNodeContent(node);

  const figmaNode: FigmaNode = {
    id: generateFigmaId(),
    name: content || node.type,
    type: figmaType,
    visible: true,
    wireweaveType: node.type.toLowerCase(),
  };

  // Add attributes
  const attrs = extractAttributes(node, { includeEmptyAttributes: false });
  if (Object.keys(attrs).length > 0) {
    figmaNode.wireweaveAttributes = attrs;
  }

  // Process children
  if ('children' in node && Array.isArray(node.children)) {
    const children: FigmaNode[] = [];
    for (const child of node.children) {
      if (child && typeof child === 'object' && 'type' in child) {
        children.push(nodeToFigma(child as AnyNode));
      }
    }
    if (children.length > 0) {
      figmaNode.children = children;
    }
  }

  return figmaNode;
}

/**
 * Export wireframe to Figma-compatible format
 *
 * Note: This creates a structure inspired by Figma's format,
 * but is not directly importable to Figma. It's designed to be
 * used with Figma plugins or as a reference for manual recreation.
 *
 * @param doc - The parsed wireframe document
 * @returns Figma export result
 */
export function exportToFigma(doc: WireframeDocument): FigmaExportResult {
  resetFigmaIdCounter();

  const documentNode: FigmaNode = {
    id: generateFigmaId(),
    name: 'Wireweave Document',
    type: 'DOCUMENT',
    visible: true,
    children: [],
  };

  for (const page of doc.children || []) {
    (documentNode.children as FigmaNode[]).push(
      nodeToFigma(page as unknown as AnyNode)
    );
  }

  // Build component mappings
  const componentMappings: Record<string, string> = {};
  const types = getComponentTypes(doc);
  for (const type of types) {
    componentMappings[type] = mapToFigmaType(type);
  }

  return {
    version: '1.0.0',
    format: 'figma',
    document: documentNode,
    componentMappings,
  };
}

/**
 * Export wireframe to Figma-compatible JSON string
 *
 * @param doc - The parsed wireframe document
 * @param prettyPrint - Whether to pretty print the output
 * @returns JSON string
 */
export function exportToFigmaString(
  doc: WireframeDocument,
  prettyPrint: boolean = true
): string {
  const result = exportToFigma(doc);
  return prettyPrint
    ? JSON.stringify(result, null, 2)
    : JSON.stringify(result);
}
