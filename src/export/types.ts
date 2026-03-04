/**
 * Export Types
 *
 * Types for exporting wireframes to various formats.
 */

/**
 * Simplified JSON node structure
 */
export interface JsonNode {
  /** Node type (e.g., 'page', 'button', 'input') */
  type: string;
  /** Node content or label */
  content?: string;
  /** Node attributes */
  attributes: Record<string, unknown>;
  /** Child nodes */
  children: JsonNode[];
  /** Source location (optional) */
  location?: {
    line: number;
    column: number;
  };
}

/**
 * JSON export result
 */
export interface JsonExportResult {
  /** Export format version */
  version: string;
  /** Export format */
  format: 'json';
  /** Exported pages */
  pages: JsonNode[];
  /** Metadata */
  metadata: {
    exportedAt: string;
    sourceFormat: 'wireweave';
    nodeCount: number;
    componentTypes: string[];
  };
}

/**
 * Figma node types that we can map to
 */
export type FigmaNodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'TEXT'
  | 'RECTANGLE'
  | 'INSTANCE'
  | 'COMPONENT';

/**
 * Figma Auto Layout mode
 */
export type FigmaLayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';

/**
 * Figma sizing mode for Auto Layout
 */
export type FigmaSizingMode = 'FIXED' | 'HUG' | 'FILL';

/**
 * Figma primary axis alignment (justify)
 */
export type FigmaPrimaryAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';

/**
 * Figma counter axis alignment (align)
 */
export type FigmaCounterAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'BASELINE';

/**
 * Figma text alignment
 */
export type FigmaTextAlign = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';

/**
 * Figma color (RGBA, 0-1 range)
 */
export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Figma solid fill
 */
export interface FigmaSolidFill {
  type: 'SOLID';
  color: FigmaColor;
  opacity?: number;
}

/**
 * Figma stroke
 */
export interface FigmaStroke {
  type: 'SOLID';
  color: FigmaColor;
}

/**
 * Figma Auto Layout properties
 */
export interface FigmaAutoLayout {
  layoutMode: FigmaLayoutMode;
  layoutSizingHorizontal: FigmaSizingMode;
  layoutSizingVertical: FigmaSizingMode;
  primaryAxisAlignItems: FigmaPrimaryAxisAlign;
  counterAxisAlignItems: FigmaCounterAxisAlign;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  itemSpacing: number;
  layoutWrap?: 'NO_WRAP' | 'WRAP';
}

/**
 * Figma size properties
 */
export interface FigmaSize {
  width: number;
  height: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

/**
 * Figma text properties
 */
export interface FigmaTextStyle {
  fontSize: number;
  fontWeight: number;
  textAlignHorizontal: FigmaTextAlign;
  characters: string;
}

/**
 * Figma-compatible node structure
 * Based on Figma's Plugin API structure
 */
export interface FigmaNode {
  /** Unique identifier */
  id: string;
  /** Node name */
  name: string;
  /** Node type */
  type: FigmaNodeType;
  /** Visibility */
  visible: boolean;
  /** Original Wireweave type */
  wireweaveType?: string;
  /** Original Wireweave attributes */
  wireweaveAttributes?: Record<string, unknown>;
  /** Child nodes */
  children?: FigmaNode[];
  /** Auto Layout properties (for FRAME) */
  autoLayout?: FigmaAutoLayout;
  /** Size properties */
  size?: FigmaSize;
  /** Text properties (for TEXT) */
  textStyle?: FigmaTextStyle;
  /** Background fills */
  fills?: FigmaSolidFill[];
  /** Border strokes */
  strokes?: FigmaStroke[];
  /** Stroke weight */
  strokeWeight?: number;
  /** Corner radius */
  cornerRadius?: number;
}

/**
 * Figma export result
 */
export interface FigmaExportResult {
  /** Export format version */
  version: string;
  /** Export format */
  format: 'figma';
  /** Document structure */
  document: FigmaNode;
  /** Component mappings for reference */
  componentMappings: Record<string, string>;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Include source locations */
  includeLocations?: boolean;
  /** Pretty print JSON (with indentation) */
  prettyPrint?: boolean;
  /** Include empty attributes */
  includeEmptyAttributes?: boolean;
}
