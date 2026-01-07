/**
 * Parser module for wireweave
 *
 * Provides parse function to convert wireframe DSL to AST
 */

import type { WireframeDocument, SourceLocation } from '../ast/types';
// @ts-expect-error - generated parser has no type declarations
import { parse as peggyParse } from './generated-parser.js';

/**
 * Parse options
 */
export interface ParseOptions {
  /** Starting rule (defaults to 'Document') */
  startRule?: string;
  /** Include source location in error messages */
  includeLocation?: boolean;
}

/**
 * Expected token description from Peggy
 */
export interface ExpectedToken {
  type: string;
  description?: string;
  text?: string;
}

/**
 * Parse error with location information
 */
export interface ParseError extends Error {
  name: 'ParseError';
  message: string;
  location: SourceLocation;
  expected: ExpectedToken[];
  found: string | null;
}

/**
 * Peggy error structure
 */
interface PeggyError {
  message: string;
  location: SourceLocation;
  expected: ExpectedToken[];
  found: string | null;
}

/**
 * Parse result for tryParse
 */
export interface ParseResult {
  success: boolean;
  document: WireframeDocument | null;
  errors: ParseErrorInfo[];
}

/**
 * Simplified error info
 */
export interface ParseErrorInfo {
  message: string;
  location: {
    line: number;
    column: number;
    offset?: number;
  } | null;
  expected?: string[];
  found?: string | null;
}

/**
 * Parse wireframe DSL source code into AST
 *
 * @param source - wireweave source code
 * @param options - Parse options
 * @returns Parsed AST document
 * @throws {ParseError} When source contains syntax errors
 */
export function parse(source: string, options?: ParseOptions): WireframeDocument {
  try {
    return peggyParse(source, options) as WireframeDocument;
  } catch (error: unknown) {
    throw enhanceError(error);
  }
}

/**
 * Parse wireframe DSL with error recovery
 *
 * @param source - wireweave source code
 * @param options - Parse options
 * @returns Parse result with AST or errors
 */
export function tryParse(source: string, options?: ParseOptions): ParseResult {
  try {
    const document = parse(source, options);
    return { success: true, document, errors: [] };
  } catch (error) {
    const parseError = error as ParseError;
    return {
      success: false,
      document: null,
      errors: [
        {
          message: parseError.message,
          location: parseError.location
            ? {
                line: parseError.location.start.line,
                column: parseError.location.start.column,
                offset: parseError.location.start.offset,
              }
            : null,
          expected: parseError.expected?.map((e) => e.description || e.text || String(e)),
          found: parseError.found,
        },
      ],
    };
  }
}

/**
 * Enhance Peggy error with better formatting
 */
function enhanceError(error: unknown): ParseError {
  if (error && typeof error === 'object' && 'location' in error) {
    const pegError = error as PeggyError;
    const enhanced = new Error(formatErrorMessage(pegError)) as ParseError;
    enhanced.name = 'ParseError';
    enhanced.location = pegError.location;
    enhanced.expected = pegError.expected || [];
    enhanced.found = pegError.found;
    return enhanced;
  }

  // Re-throw non-Peggy errors
  throw error;
}

/**
 * Format error message for better readability
 */
function formatErrorMessage(error: PeggyError): string {
  const { location, expected, found } = error;
  const line = location?.start?.line ?? '?';
  const column = location?.start?.column ?? '?';

  // Format expected tokens
  let expectedDesc = 'something';
  if (expected && expected.length > 0) {
    const descriptions = expected
      .map((e) => e.description || e.text || String(e))
      .filter((d, i, arr) => arr.indexOf(d) === i) // unique
      .slice(0, 5); // limit to 5

    if (descriptions.length === 1) {
      expectedDesc = descriptions[0];
    } else if (descriptions.length === 2) {
      expectedDesc = `${descriptions[0]} or ${descriptions[1]}`;
    } else {
      const last = descriptions.pop();
      expectedDesc = `${descriptions.join(', ')}, or ${last}`;
    }

    if (expected.length > 5) {
      expectedDesc += ` (and ${expected.length - 5} more)`;
    }
  }

  // Format found token
  const foundDesc = found === null ? 'end of input' : `"${escapeString(found)}"`;

  return `Syntax error at line ${line}, column ${column}: Expected ${expectedDesc} but found ${foundDesc}`;
}

/**
 * Escape special characters in string for display
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');
}

/**
 * Validate source code without throwing
 *
 * @param source - wireweave source code
 * @returns true if valid, false otherwise
 */
export function isValid(source: string): boolean {
  try {
    parse(source);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get syntax errors from source code
 *
 * @param source - wireweave source code
 * @returns Array of error info, empty if valid
 */
export function getErrors(source: string): ParseErrorInfo[] {
  const result = tryParse(source);
  return result.errors;
}
