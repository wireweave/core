/**
 * Figma export functionality
 *
 * Converts Wireweave AST to Figma Plugin API compatible format.
 * The output can be directly used by a Figma plugin to create nodes.
 */

import type { WireframeDocument, AnyNode, SpacingValue, ValueWithUnit } from '../ast/types';
import type {
  FigmaNode,
  FigmaExportResult,
  FigmaNodeType,
  FigmaLayoutMode,
  FigmaSizingMode,
  FigmaPrimaryAxisAlign,
  FigmaCounterAxisAlign,
  FigmaTextAlign,
  FigmaAutoLayout,
  FigmaSize,
  FigmaTextStyle,
  FigmaColor,
  FigmaSolidFill,
  FigmaStroke,
} from './types';
import { getNodeContent, extractAttributes, getComponentTypes } from './utils';

// ===========================================
// Constants
// ===========================================

/**
 * Spacing scale (Tailwind-like): token -> px
 */
const SPACING_SCALE: Record<number, number> = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
};

/**
 * Text size scale: token -> px
 */
const TEXT_SIZE_SCALE: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

/**
 * Font weight scale: token -> numeric
 */
const FONT_WEIGHT_SCALE: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

/**
 * Predefined colors
 */
const COLORS: Record<string, FigmaColor> = {
  muted: { r: 0.96, g: 0.96, b: 0.96, a: 1 },
  primary: { r: 0.22, g: 0.52, b: 0.96, a: 1 },
  secondary: { r: 0.4, g: 0.4, b: 0.45, a: 1 },
  border: { r: 0.9, g: 0.9, b: 0.9, a: 1 },
  text: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
  textMuted: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
};

// ===========================================
// ID Generator
// ===========================================

let figmaIdCounter = 0;

function generateFigmaId(): string {
  return `node-${++figmaIdCounter}`;
}

export function resetFigmaIdCounter(): void {
  figmaIdCounter = 0;
}

// ===========================================
// Value Converters
// ===========================================

/**
 * Convert spacing value to pixels
 */
function spacingToPx(value: SpacingValue | undefined): number {
  if (value === undefined) return 0;

  if (typeof value === 'number') {
    return SPACING_SCALE[value] ?? value * 4;
  }

  // ValueWithUnit
  const unit = value.unit;
  if (unit === 'px') return value.value;
  if (unit === 'rem') return value.value * 16;
  if (unit === 'em') return value.value * 16;

  return value.value;
}

/**
 * Convert text size to pixels
 */
function textSizeToPx(size: string | ValueWithUnit | undefined): number {
  if (size === undefined) return 16;

  if (typeof size === 'string') {
    return TEXT_SIZE_SCALE[size] ?? 16;
  }

  // ValueWithUnit
  if (size.unit === 'px') return size.value;
  if (size.unit === 'rem') return size.value * 16;

  return size.value;
}

/**
 * Convert font weight to numeric
 */
function fontWeightToNumeric(weight: string | undefined): number {
  if (weight === undefined) return 400;
  return FONT_WEIGHT_SCALE[weight] ?? 400;
}

/**
 * Convert width/height value to Figma size
 */
function sizeValueToPx(
  value: number | ValueWithUnit | 'full' | 'auto' | 'screen' | 'fit' | undefined,
  defaultValue: number = 0
): { value: number; sizing: FigmaSizingMode } {
  if (value === undefined) {
    return { value: defaultValue, sizing: 'HUG' };
  }

  if (value === 'full' || value === 'screen') {
    return { value: defaultValue, sizing: 'FILL' };
  }

  if (value === 'auto' || value === 'fit') {
    return { value: defaultValue, sizing: 'HUG' };
  }

  if (typeof value === 'number') {
    return { value, sizing: 'FIXED' };
  }

  // ValueWithUnit
  if (value.unit === 'px') {
    return { value: value.value, sizing: 'FIXED' };
  }
  if (value.unit === '%') {
    return { value: 0, sizing: 'FILL' };
  }

  return { value: value.value, sizing: 'FIXED' };
}

// ===========================================
// Type Mappers
// ===========================================

/**
 * Map Wireweave type to Figma type
 */
function mapToFigmaType(type: string): FigmaNodeType {
  const typeMap: Record<string, FigmaNodeType> = {
    page: 'CANVAS',
    text: 'TEXT',
    title: 'TEXT',
    link: 'TEXT',
    image: 'RECTANGLE',
    placeholder: 'RECTANGLE',
    divider: 'RECTANGLE',
  };

  return typeMap[type.toLowerCase()] || 'FRAME';
}

/**
 * Map Wireweave justify to Figma primary axis alignment
 */
function mapJustify(justify: string | undefined): FigmaPrimaryAxisAlign {
  const map: Record<string, FigmaPrimaryAxisAlign> = {
    start: 'MIN',
    center: 'CENTER',
    end: 'MAX',
    between: 'SPACE_BETWEEN',
    around: 'SPACE_BETWEEN', // Figma doesn't have SPACE_AROUND
    evenly: 'SPACE_BETWEEN', // Figma doesn't have SPACE_EVENLY
  };
  return map[justify || 'start'] || 'MIN';
}

/**
 * Map Wireweave align to Figma counter axis alignment
 */
function mapAlign(align: string | undefined): FigmaCounterAxisAlign {
  const map: Record<string, FigmaCounterAxisAlign> = {
    start: 'MIN',
    center: 'CENTER',
    end: 'MAX',
    stretch: 'STRETCH',
    baseline: 'BASELINE',
  };
  return map[align || 'stretch'] || 'STRETCH';
}

/**
 * Map Wireweave text align to Figma text alignment
 */
function mapTextAlign(align: string | undefined): FigmaTextAlign {
  const map: Record<string, FigmaTextAlign> = {
    left: 'LEFT',
    center: 'CENTER',
    right: 'RIGHT',
    justify: 'JUSTIFIED',
  };
  return map[align || 'left'] || 'LEFT';
}

// ===========================================
// Property Extractors
// ===========================================

/**
 * Get attribute from node safely
 */
function getAttr<T>(node: AnyNode, key: string): T | undefined {
  return (node as unknown as Record<string, T>)[key];
}

/**
 * Extract Auto Layout properties from node
 */
function extractAutoLayout(node: AnyNode): FigmaAutoLayout {
  // Determine layout mode
  let layoutMode: FigmaLayoutMode = 'VERTICAL'; // Default for containers
  const direction = getAttr<string>(node, 'direction');

  if (direction === 'row' || direction === 'row-reverse') {
    layoutMode = 'HORIZONTAL';
  } else if (direction === 'column' || direction === 'column-reverse') {
    layoutMode = 'VERTICAL';
  }

  // Special cases: Row is horizontal, Col/Stack is vertical
  const type = node.type.toLowerCase();
  if (type === 'row') layoutMode = 'HORIZONTAL';
  if (type === 'col' || type === 'stack') layoutMode = 'VERTICAL';

  // Extract padding
  const p = spacingToPx(getAttr<SpacingValue>(node, 'p'));
  const pxVal = getAttr<SpacingValue>(node, 'px');
  const pyVal = getAttr<SpacingValue>(node, 'py');
  const px = pxVal !== undefined ? spacingToPx(pxVal) : p;
  const py = pyVal !== undefined ? spacingToPx(pyVal) : p;
  const ptVal = getAttr<SpacingValue>(node, 'pt');
  const prVal = getAttr<SpacingValue>(node, 'pr');
  const pbVal = getAttr<SpacingValue>(node, 'pb');
  const plVal = getAttr<SpacingValue>(node, 'pl');
  const pt = ptVal !== undefined ? spacingToPx(ptVal) : py;
  const pr = prVal !== undefined ? spacingToPx(prVal) : px;
  const pb = pbVal !== undefined ? spacingToPx(pbVal) : py;
  const pl = plVal !== undefined ? spacingToPx(plVal) : px;

  // Extract sizing
  const wResult = sizeValueToPx(getAttr(node, 'w'), 0);
  const hResult = sizeValueToPx(getAttr(node, 'h'), 0);

  return {
    layoutMode,
    layoutSizingHorizontal: wResult.sizing,
    layoutSizingVertical: hResult.sizing,
    primaryAxisAlignItems: mapJustify(getAttr<string>(node, 'justify')),
    counterAxisAlignItems: mapAlign(getAttr<string>(node, 'align')),
    paddingTop: pt,
    paddingRight: pr,
    paddingBottom: pb,
    paddingLeft: pl,
    itemSpacing: spacingToPx(getAttr<SpacingValue>(node, 'gap')),
    layoutWrap: getAttr(node, 'wrap') ? 'WRAP' : 'NO_WRAP',
  };
}

/**
 * Extract size properties from node
 */
function extractSize(node: AnyNode, defaultWidth: number = 100, defaultHeight: number = 100): FigmaSize {
  const wResult = sizeValueToPx(getAttr(node, 'w'), defaultWidth);
  const hResult = sizeValueToPx(getAttr(node, 'h'), defaultHeight);

  const size: FigmaSize = {
    width: wResult.value || defaultWidth,
    height: hResult.value || defaultHeight,
  };

  const minW = getAttr<SpacingValue>(node, 'minW');
  const maxW = getAttr<SpacingValue>(node, 'maxW');
  const minH = getAttr<SpacingValue>(node, 'minH');
  const maxH = getAttr<SpacingValue>(node, 'maxH');

  if (minW !== undefined) size.minWidth = spacingToPx(minW);
  if (maxW !== undefined) size.maxWidth = spacingToPx(maxW);
  if (minH !== undefined) size.minHeight = spacingToPx(minH);
  if (maxH !== undefined) size.maxHeight = spacingToPx(maxH);

  return size;
}

/**
 * Extract text style properties from node
 */
function extractTextStyle(node: AnyNode): FigmaTextStyle {
  const content = getNodeContent(node) || '';

  return {
    fontSize: textSizeToPx(getAttr(node, 'size')),
    fontWeight: fontWeightToNumeric(getAttr<string>(node, 'weight')),
    textAlignHorizontal: mapTextAlign(getAttr<string>(node, 'align')),
    characters: content,
  };
}

/**
 * Extract fills from node
 */
function extractFills(node: AnyNode): FigmaSolidFill[] | undefined {
  const bg = getAttr<string>(node, 'bg');

  if (!bg) return undefined;

  const color = COLORS[bg];
  if (!color) return undefined;

  return [{ type: 'SOLID', color }];
}

/**
 * Extract strokes from node
 */
function extractStrokes(node: AnyNode): { strokes: FigmaStroke[]; strokeWeight: number } | undefined {
  if (!getAttr(node, 'border')) return undefined;

  return {
    strokes: [{ type: 'SOLID', color: COLORS.border }],
    strokeWeight: 1,
  };
}

// ===========================================
// Node Converter
// ===========================================

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

  // Add original attributes for reference
  const attrs = extractAttributes(node, { includeEmptyAttributes: false });
  if (Object.keys(attrs).length > 0) {
    figmaNode.wireweaveAttributes = attrs;
  }

  // Add type-specific properties
  if (figmaType === 'FRAME') {
    figmaNode.autoLayout = extractAutoLayout(node);
    figmaNode.size = extractSize(node);

    const fills = extractFills(node);
    if (fills) figmaNode.fills = fills;

    const strokeInfo = extractStrokes(node);
    if (strokeInfo) {
      figmaNode.strokes = strokeInfo.strokes;
      figmaNode.strokeWeight = strokeInfo.strokeWeight;
    }

    // Card specific: corner radius
    if (node.type.toLowerCase() === 'card') {
      figmaNode.cornerRadius = 8;
    }
  } else if (figmaType === 'TEXT') {
    figmaNode.textStyle = extractTextStyle(node);

    // Muted text color
    if (getAttr(node, 'muted')) {
      figmaNode.fills = [{ type: 'SOLID', color: COLORS.textMuted }];
    }
  } else if (figmaType === 'RECTANGLE') {
    figmaNode.size = extractSize(node, 200, 150);

    const fills = extractFills(node);
    if (fills) {
      figmaNode.fills = fills;
    } else {
      // Default placeholder/image background
      figmaNode.fills = [{ type: 'SOLID', color: COLORS.muted }];
    }
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

// ===========================================
// Public API
// ===========================================

/**
 * Export wireframe to Figma-compatible format
 *
 * The output is designed to be directly usable by a Figma plugin.
 * Each node includes:
 * - Auto Layout properties (layoutMode, padding, gap, alignment)
 * - Size properties (width, height, constraints)
 * - Text properties (fontSize, fontWeight, alignment)
 * - Visual properties (fills, strokes, cornerRadius)
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
    version: '2.0.0',
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
