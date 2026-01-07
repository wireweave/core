/**
 * Parser Tests for wireweave
 *
 * Tests parser wrapper, error handling, and AST utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parse,
  tryParse,
  isValid,
  getErrors,
  type ParseError,
  type WireframeDocument,
} from '../src';
import {
  walk,
  walkDocument,
  find,
  findAll,
  findByType,
  countNodes,
  getMaxDepth,
  getAncestors,
  cloneNode,
  contains,
  getNodeTypes,
  type AnyNode,
} from '../src/ast';
import {
  isContainerNode,
  isLeafNode,
  hasChildren,
  isPageNode,
  isRowNode,
  isColNode,
  isTextNode,
  isButtonNode,
  isCardNode,
  isInputNode,
  isNodeType,
} from '../src/ast/guards';

describe('Parser', () => {
  describe('parse()', () => {
    it('should parse valid wireframe code', () => {
      const source = 'page "Hello" { text "World" }';
      const result = parse(source);

      expect(result.type).toBe('Document');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].type).toBe('Page');
    });

    it('should throw ParseError for invalid code', () => {
      const source = 'invalid { }';

      expect(() => parse(source)).toThrow();

      try {
        parse(source);
      } catch (error) {
        const parseError = error as ParseError;
        expect(parseError.name).toBe('ParseError');
        expect(parseError.message).toContain('Syntax error');
        expect(parseError.location).toBeDefined();
      }
    });

    it('should include line and column in error message', () => {
      const source = `page {
  text "hello"
  invalid stuff
}`;

      try {
        parse(source);
      } catch (error) {
        const parseError = error as ParseError;
        expect(parseError.message).toMatch(/line \d+/);
        expect(parseError.message).toMatch(/column \d+/);
      }
    });

    it('should parse empty page', () => {
      const result = parse('page { }');
      expect(result.children[0].children).toHaveLength(0);
    });

    it('should parse page with nested content', () => {
      const source = `
        page "Main Page" {
          header { title "Header" }
          main { text "Content" }
          footer { text "Footer" }
        }
      `;
      const result = parse(source);
      expect(result.children[0].children).toHaveLength(3);
    });
  });

  describe('tryParse()', () => {
    it('should return success for valid code', () => {
      const source = 'page { text "Hello" }';
      const result = tryParse(source);

      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid code', () => {
      const source = 'not valid code';
      const result = tryParse(source);

      expect(result.success).toBe(false);
      expect(result.document).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Syntax error');
    });

    it('should include location in errors', () => {
      const source = 'page { unknown }';
      const result = tryParse(source);

      if (!result.success && result.errors[0].location) {
        expect(result.errors[0].location.line).toBeGreaterThan(0);
        expect(result.errors[0].location.column).toBeGreaterThan(0);
      }
    });
  });

  describe('isValid()', () => {
    it('should return true for valid code', () => {
      expect(isValid('page { text "Hello" }')).toBe(true);
    });

    it('should return false for invalid code', () => {
      expect(isValid('invalid')).toBe(false);
    });
  });

  describe('getErrors()', () => {
    it('should return empty array for valid code', () => {
      expect(getErrors('page { }')).toHaveLength(0);
    });

    it('should return errors for invalid code', () => {
      const errors = getErrors('invalid code');
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Type Guards', () => {
  const doc = parse(`
    page "Test" {
      row {
        col {
          text "Hello"
          button "Click"
        }
      }
      card {
        input "Email"
      }
    }
  `);
  const page = doc.children[0];

  describe('isContainerNode()', () => {
    it('should return true for container nodes', () => {
      expect(isContainerNode(page)).toBe(true);
      expect(isContainerNode(page.children[0])).toBe(true); // Row
    });

    it('should return false for leaf nodes', () => {
      const text = findByType(page, 'Text')[0];
      expect(isContainerNode(text)).toBe(false);
    });
  });

  describe('isLeafNode()', () => {
    it('should return true for leaf nodes', () => {
      const text = findByType(page, 'Text')[0];
      expect(isLeafNode(text)).toBe(true);
    });

    it('should return false for container nodes', () => {
      expect(isLeafNode(page)).toBe(false);
    });
  });

  describe('hasChildren()', () => {
    it('should return true for nodes with children', () => {
      expect(hasChildren(page)).toBe(true);
    });

    it('should return false for nodes without children', () => {
      const text = findByType(page, 'Text')[0];
      expect(hasChildren(text)).toBe(false);
    });
  });

  describe('specific type guards', () => {
    it('should identify Page nodes', () => {
      expect(isPageNode(page)).toBe(true);
    });

    it('should identify Row nodes', () => {
      const row = findByType(page, 'Row')[0];
      expect(isRowNode(row)).toBe(true);
    });

    it('should identify Col nodes', () => {
      const col = findByType(page, 'Col')[0];
      expect(isColNode(col)).toBe(true);
    });

    it('should identify Text nodes', () => {
      const text = findByType(page, 'Text')[0];
      expect(isTextNode(text)).toBe(true);
    });

    it('should identify Button nodes', () => {
      const button = findByType(page, 'Button')[0];
      expect(isButtonNode(button)).toBe(true);
    });

    it('should identify Card nodes', () => {
      const card = findByType(page, 'Card')[0];
      expect(isCardNode(card)).toBe(true);
    });

    it('should identify Input nodes', () => {
      const input = findByType(page, 'Input')[0];
      expect(isInputNode(input)).toBe(true);
    });
  });

  describe('isNodeType()', () => {
    it('should work with generic type checking', () => {
      const text = findByType(page, 'Text')[0];
      expect(isNodeType(text, 'Text')).toBe(true);
      expect(isNodeType(text, 'Button')).toBe(false);
    });
  });
});

describe('AST Utilities', () => {
  const doc = parse(`
    page "Test" {
      header {
        title "Header Title"
      }
      main {
        row {
          col {
            text "Column 1"
          }
          col {
            text "Column 2"
            button "Submit"
          }
        }
      }
      footer {
        text "Footer"
      }
    }
  `);
  const page = doc.children[0];

  describe('walk()', () => {
    it('should visit all nodes', () => {
      const visited: string[] = [];
      walk(page, (node) => {
        visited.push(node.type);
      });

      expect(visited).toContain('Page');
      expect(visited).toContain('Header');
      expect(visited).toContain('Main');
      expect(visited).toContain('Footer');
      expect(visited).toContain('Row');
      expect(visited).toContain('Col');
      expect(visited).toContain('Text');
      expect(visited).toContain('Button');
    });

    it('should provide parent node', () => {
      const parentTypes: (string | undefined)[] = [];
      walk(page, (node, parent) => {
        if (node.type === 'Text') {
          parentTypes.push(parent?.type);
        }
      });

      expect(parentTypes).toContain('Col');
      expect(parentTypes).toContain('Footer');
    });

    it('should provide depth', () => {
      let maxDepth = 0;
      walk(page, (_node, _parent, depth) => {
        if (depth !== undefined && depth > maxDepth) {
          maxDepth = depth;
        }
      });

      expect(maxDepth).toBeGreaterThan(0);
    });

    it('should stop traversal when returning false', () => {
      const visited: string[] = [];
      walk(page, (node) => {
        visited.push(node.type);
        if (node.type === 'Main') {
          return false;
        }
      });

      expect(visited).toContain('Page');
      expect(visited).toContain('Main');
      // Should not visit children of Main
      expect(visited.filter((t) => t === 'Row')).toHaveLength(0);
    });
  });

  describe('walkDocument()', () => {
    it('should walk through document', () => {
      const visited: string[] = [];
      walkDocument(doc, (node) => {
        visited.push(node.type);
      });

      expect(visited).toContain('Page');
    });
  });

  describe('find()', () => {
    it('should find first matching node', () => {
      const button = find(page, (n) => n.type === 'Button');
      expect(button).toBeDefined();
      expect(button?.type).toBe('Button');
    });

    it('should return undefined if not found', () => {
      const notFound = find(page, (n) => n.type === 'Modal');
      expect(notFound).toBeUndefined();
    });
  });

  describe('findAll()', () => {
    it('should find all matching nodes', () => {
      const texts = findAll(page, (n) => n.type === 'Text');
      expect(texts).toHaveLength(3); // Column 1, Column 2, Footer (Header has Title)
    });

    it('should return empty array if none found', () => {
      const notFound = findAll(page, (n) => n.type === 'Modal');
      expect(notFound).toHaveLength(0);
    });
  });

  describe('findByType()', () => {
    it('should find nodes by type', () => {
      const cols = findByType(page, 'Col');
      expect(cols).toHaveLength(2);
    });
  });

  describe('countNodes()', () => {
    it('should count all nodes', () => {
      const count = countNodes(page);
      expect(count).toBeGreaterThan(10);
    });
  });

  describe('getMaxDepth()', () => {
    it('should return max depth', () => {
      const depth = getMaxDepth(page);
      expect(depth).toBeGreaterThan(2);
    });
  });

  describe('getAncestors()', () => {
    it('should return path to target node', () => {
      const button = find(page, (n) => n.type === 'Button');
      if (button) {
        const ancestors = getAncestors(page, button);
        expect(ancestors.map((n) => n.type)).toEqual(['Page', 'Main', 'Row', 'Col']);
      }
    });

    it('should return empty array if not found', () => {
      const fakeNode = { type: 'Fake' } as AnyNode;
      const ancestors = getAncestors(page, fakeNode);
      expect(ancestors).toHaveLength(0);
    });
  });

  describe('cloneNode()', () => {
    it('should deep clone a node', () => {
      const clone = cloneNode(page);
      expect(clone).toEqual(page);
      expect(clone).not.toBe(page);
    });
  });

  describe('contains()', () => {
    it('should return true if target is descendant', () => {
      const button = find(page, (n) => n.type === 'Button');
      if (button) {
        expect(contains(page, button)).toBe(true);
      }
    });

    it('should return false if target is not descendant', () => {
      const fakeNode = { type: 'Fake' } as AnyNode;
      expect(contains(page, fakeNode)).toBe(false);
    });
  });

  describe('getNodeTypes()', () => {
    it('should return all node types', () => {
      const types = getNodeTypes(page);
      expect(types.has('Page')).toBe(true);
      expect(types.has('Header')).toBe(true);
      expect(types.has('Main')).toBe(true);
      expect(types.has('Footer')).toBe(true);
      expect(types.has('Row')).toBe(true);
      expect(types.has('Col')).toBe(true);
      expect(types.has('Text')).toBe(true);
      expect(types.has('Button')).toBe(true);
    });
  });
});

describe('Error Messages', () => {
  it('should provide clear error for unexpected token', () => {
    try {
      parse('page { @ }');
    } catch (error) {
      const msg = (error as Error).message;
      expect(msg).toContain('Syntax error');
      expect(msg).toContain('line');
      expect(msg).toContain('column');
    }
  });

  it('should provide clear error for unclosed block', () => {
    try {
      parse('page { text "Hello"');
    } catch (error) {
      const msg = (error as Error).message;
      expect(msg).toContain('Syntax error');
    }
  });

  it('should provide clear error for missing quotes', () => {
    try {
      parse('page { text Hello }');
    } catch (error) {
      const msg = (error as Error).message;
      expect(msg).toContain('Syntax error');
    }
  });
});
