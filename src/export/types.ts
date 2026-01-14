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
 * Figma-compatible node structure
 * Based on Figma's REST API structure
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
  /** Node-specific properties */
  [key: string]: unknown;
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
