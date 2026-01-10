/**
 * Wireweave DSL Validation
 *
 * Validates AST nodes against the DSL specification.
 * Checks that all attributes are valid for their respective components.
 */

import type { WireframeDocument, AnyNode } from '../ast/types';
import { NODE_TYPE_MAP } from '../spec/components';
import { VALID_ATTRIBUTE_NAMES } from '../spec/attributes';

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error message */
  message: string;
  /** Path to the invalid node (e.g., "pages[0].children[1]") */
  path: string;
  /** Node type where error occurred */
  nodeType: string;
  /** Invalid attribute name (if applicable) */
  attribute?: string;
  /** Source location (if available) */
  location?: {
    line: number;
    column: number;
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the AST is valid */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
  /** Summary error message (if invalid) */
  errorSummary?: string;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** If true, stop at first error */
  stopOnFirstError?: boolean;
  /** Maximum number of errors to collect */
  maxErrors?: number;
}

// Meta attributes that are not user-facing (internal AST properties)
const META_ATTRIBUTES = new Set(['type', 'loc', 'children', 'content', 'items', 'columns', 'rows', 'options']);

/**
 * Validate a Wireweave AST document
 *
 * @param ast - The parsed AST document
 * @param options - Validation options
 * @returns Validation result with errors if invalid
 */
export function validate(ast: WireframeDocument, options: ValidationOptions = {}): ValidationResult {
  const errors: ValidationError[] = [];
  const maxErrors = options.maxErrors ?? 100;

  function addError(error: ValidationError): boolean {
    errors.push(error);
    if (options.stopOnFirstError || errors.length >= maxErrors) {
      return false; // Stop validation
    }
    return true; // Continue validation
  }

  function validateNode(node: AnyNode, path: string): boolean {
    const nodeType = node.type;
    const spec = NODE_TYPE_MAP.get(nodeType);

    if (!spec) {
      // Unknown node type - this shouldn't happen if parser is correct
      return addError({
        message: `Unknown component type: ${nodeType}`,
        path,
        nodeType,
        location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
      });
    }

    // Check all attributes on this node
    const validAttrs = new Set(spec.attributes);

    for (const key of Object.keys(node)) {
      // Skip meta attributes
      if (META_ATTRIBUTES.has(key)) continue;

      // Check if attribute is valid for this component
      if (!validAttrs.has(key)) {
        // Check if it's a valid attribute at all (might be on wrong component)
        const isKnownAttr = VALID_ATTRIBUTE_NAMES.has(key);
        const message = isKnownAttr
          ? `Attribute "${key}" is not valid on ${spec.name}. Valid attributes: ${spec.attributes.slice(0, 10).join(', ')}${spec.attributes.length > 10 ? '...' : ''}`
          : `Unknown attribute "${key}" on ${spec.name}`;

        const shouldContinue = addError({
          message,
          path,
          nodeType,
          attribute: key,
          location: node.loc ? { line: node.loc.start.line, column: node.loc.start.column } : undefined,
        });

        if (!shouldContinue) return false;
      }
    }

    // Recursively validate children
    if ('children' in node && Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as AnyNode;
        if (child && typeof child === 'object' && 'type' in child) {
          const shouldContinue = validateNode(child, `${path}.children[${i}]`);
          if (!shouldContinue) return false;
        }
      }
    }

    return true;
  }

  // Validate each page in the document
  if (ast.children) {
    for (let i = 0; i < ast.children.length; i++) {
      const page = ast.children[i];
      const shouldContinue = validateNode(page as unknown as AnyNode, `pages[${i}]`);
      if (!shouldContinue) break;
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    errorSummary: valid ? undefined : formatErrorSummary(errors),
  };
}

/**
 * Format a summary of validation errors
 */
function formatErrorSummary(errors: ValidationError[]): string {
  if (errors.length === 0) return '';

  if (errors.length === 1) {
    return errors[0].message;
  }

  const uniqueMessages = [...new Set(errors.map(e => e.message))];
  const shown = uniqueMessages.slice(0, 3);
  const remaining = errors.length - shown.length;

  let summary = shown.join('; ');
  if (remaining > 0) {
    summary += ` (and ${remaining} more error${remaining > 1 ? 's' : ''})`;
  }

  return summary;
}

/**
 * Quick validation check - returns true if AST has valid attributes
 *
 * @param ast - The parsed AST document
 * @returns true if all attributes are valid
 */
export function isValidAst(ast: WireframeDocument): boolean {
  return validate(ast, { stopOnFirstError: true }).valid;
}

/**
 * Get all validation errors from an AST
 *
 * @param ast - The parsed AST document
 * @returns Array of validation errors
 */
export function getValidationErrors(ast: WireframeDocument): ValidationError[] {
  return validate(ast).errors;
}
