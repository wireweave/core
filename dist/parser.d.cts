import { a3 as SourceLocation, a1 as WireframeDocument } from './types-DtovIYS6.cjs';

/**
 * Parser module for wireweave
 *
 * Provides parse function to convert wireframe DSL to AST
 */

/**
 * Parse options
 */
interface ParseOptions {
    /** Starting rule (defaults to 'Document') */
    startRule?: string;
    /** Include source location in error messages */
    includeLocation?: boolean;
}
/**
 * Expected token description from Peggy
 */
interface ExpectedToken {
    type: string;
    description?: string;
    text?: string;
}
/**
 * Parse error with location information
 */
interface ParseError extends Error {
    name: 'ParseError';
    message: string;
    location: SourceLocation;
    expected: ExpectedToken[];
    found: string | null;
}
/**
 * Parse result for tryParse
 */
interface ParseResult {
    success: boolean;
    document: WireframeDocument | null;
    errors: ParseErrorInfo[];
}
/**
 * Simplified error info
 */
interface ParseErrorInfo {
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
declare function parse(source: string, options?: ParseOptions): WireframeDocument;
/**
 * Parse wireframe DSL with error recovery
 *
 * @param source - wireweave source code
 * @param options - Parse options
 * @returns Parse result with AST or errors
 */
declare function tryParse(source: string, options?: ParseOptions): ParseResult;
/**
 * Validate source code without throwing
 *
 * @param source - wireweave source code
 * @returns true if valid, false otherwise
 */
declare function isValid(source: string): boolean;
/**
 * Get syntax errors from source code
 *
 * @param source - wireweave source code
 * @returns Array of error info, empty if valid
 */
declare function getErrors(source: string): ParseErrorInfo[];

export { type ExpectedToken, type ParseError, type ParseErrorInfo, type ParseOptions, type ParseResult, getErrors, isValid, parse, tryParse };
