/**
 * Wireframe Export Module
 *
 * Exports wireframe AST to various formats.
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import type {
  JsonNode,
  JsonExportResult,
  FigmaNode,
  FigmaExportResult,
  FigmaNodeType,
  ExportOptions,
} from './types';

// Re-export types
export * from './types';

/**
 * Attributes to skip when exporting (internal AST properties)
 */
const SKIP_ATTRIBUTES = new Set(['type', 'loc', 'children']);

/**
 * Get content from a node
 */
function getNodeContent(node: AnyNode): string | undefined {
  if ('title' in node && typeof node.title === 'string') return node.title;
  if ('content' in node && typeof node.content === 'string') return node.content;
  if ('label' in node && typeof node.label === 'string') return node.label;
  if ('name' in node && node.type === 'Icon' && typeof node.name === 'string') return node.name;
  return undefined;
}

/**
 * Extract attributes from a node
 */
function extractAttributes(
  node: AnyNode,
  options: ExportOptions
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(node)) {
    if (SKIP_ATTRIBUTES.has(key)) continue;

    // Skip content-like attributes (they go in content field)
    if (['title', 'content', 'label'].includes(key) && typeof value === 'string') {
      continue;
    }

    // Skip empty values unless requested
    if (!options.includeEmptyAttributes) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
    }

    attrs[key] = value;
  }

  return attrs;
}

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
 * Count all nodes in a document
 */
function countNodes(doc: WireframeDocument): number {
  let count = 0;

  function walk(node: AnyNode) {
    count++;
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child && typeof child === 'object' && 'type' in child) {
          walk(child as AnyNode);
        }
      }
    }
  }

  for (const page of doc.children || []) {
    walk(page as unknown as AnyNode);
  }

  return count;
}

/**
 * Get unique component types in a document
 */
function getComponentTypes(doc: WireframeDocument): string[] {
  const types = new Set<string>();

  function walk(node: AnyNode) {
    types.add(node.type.toLowerCase());
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child && typeof child === 'object' && 'type' in child) {
          walk(child as AnyNode);
        }
      }
    }
  }

  for (const page of doc.children || []) {
    walk(page as unknown as AnyNode);
  }

  return Array.from(types).sort();
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

/**
 * Import from JSON format back to simplified structure
 *
 * @param json - JSON export result
 * @returns Simplified page array
 */
export function importFromJson(json: JsonExportResult): JsonNode[] {
  return json.pages;
}
