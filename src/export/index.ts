/**
 * Wireframe Export Module
 *
 * Exports wireframe AST to various formats.
 */

// Re-export types
export * from './types';

// JSON export functions
export { exportToJson, exportToJsonString, importFromJson } from './json';

// Figma export functions
export {
  exportToFigma,
  exportToFigmaString,
  resetFigmaIdCounter,
} from './figma';
