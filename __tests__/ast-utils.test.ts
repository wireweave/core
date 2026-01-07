/**
 * AST Utility functions tests
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';
import {
  walk,
  walkDocument,
  find,
  findAll,
  findByType,
  countNodes,
  getMaxDepth,
  getAncestors,
  mapNodes,
  cloneNode,
  contains,
  getNodeTypes,
} from '../src/ast/utils';
import type { PageNode, TextNode, ButtonNode, RowNode, ColNode } from '../src/ast/types';

describe('AST Utils', () => {
  describe('walk', () => {
    it('should visit all nodes', () => {
      const doc = parse(`
        page {
          row {
            col { text "A" }
            col { text "B" }
          }
        }
      `);

      const visited: string[] = [];
      walk(doc.children[0], (node) => {
        visited.push(node.type);
      });

      expect(visited).toContain('Page');
      expect(visited).toContain('Row');
      expect(visited).toContain('Col');
      expect(visited).toContain('Text');
      expect(visited.length).toBe(6); // Page, Row, Col, Text, Col, Text
    });

    it('should provide parent and depth', () => {
      const doc = parse('page { row { text "Test" } }');

      const depths: Record<string, number> = {};
      walk(doc.children[0], (node, parent, depth) => {
        depths[node.type] = depth!;
      });

      expect(depths['Page']).toBe(0);
      expect(depths['Row']).toBe(1);
      expect(depths['Text']).toBe(2);
    });

    it('should stop subtree traversal when callback returns false', () => {
      // When returning false on a node, it stops that node's children from being visited
      const doc = parse('page { card { text "Inner" } text "Outer" }');

      const visited: string[] = [];
      walk(doc.children[0], (node) => {
        visited.push(node.type);
        if (node.type === 'Card') {
          return false; // Stop traversal of card's children
        }
      });

      expect(visited).toContain('Page');
      expect(visited).toContain('Card');
      expect(visited).toContain('Text'); // Outer text is still visited
      // Note: "Inner" text is not visited because we stopped Card subtree
      expect(visited.filter(t => t === 'Text').length).toBe(1);
    });
  });

  describe('walkDocument', () => {
    it('should walk through all pages', () => {
      const doc = parse('page { text "Page 1" }');

      const visited: string[] = [];
      walkDocument(doc, (node) => {
        visited.push(node.type);
      });

      expect(visited).toContain('Page');
      expect(visited).toContain('Text');
    });
  });

  describe('find', () => {
    it('should find first matching node', () => {
      const doc = parse('page { text "A" text "B" text "C" }');
      const found = find(doc.children[0], (n) => n.type === 'Text');

      expect(found).toBeDefined();
      expect((found as TextNode).content).toBe('A');
    });

    it('should return undefined when no match', () => {
      const doc = parse('page { text "Hello" }');
      const found = find(doc.children[0], (n) => n.type === 'Button');

      expect(found).toBeUndefined();
    });

    it('should find nested nodes', () => {
      const doc = parse('page { card { row { button "Deep" } } }');
      const found = find(doc.children[0], (n) => n.type === 'Button');

      expect(found).toBeDefined();
      expect((found as ButtonNode).content).toBe('Deep');
    });
  });

  describe('findAll', () => {
    it('should find all matching nodes', () => {
      const doc = parse('page { button "A" text "B" button "C" }');
      const buttons = findAll(doc.children[0], (n) => n.type === 'Button');

      expect(buttons).toHaveLength(2);
      expect((buttons[0] as ButtonNode).content).toBe('A');
      expect((buttons[1] as ButtonNode).content).toBe('C');
    });

    it('should return empty array when no match', () => {
      const doc = parse('page { text "Hello" }');
      const found = findAll(doc.children[0], (n) => n.type === 'Table');

      expect(found).toEqual([]);
    });

    it('should find deeply nested nodes', () => {
      const doc = parse(`
        page {
          row {
            col { button "1" }
            col { button "2" }
          }
          button "3"
        }
      `);
      const buttons = findAll(doc.children[0], (n) => n.type === 'Button');

      expect(buttons).toHaveLength(3);
    });
  });

  describe('findByType', () => {
    it('should find all nodes of a specific type', () => {
      const doc = parse('page { text "A" text "B" button "C" }');
      const texts = findByType<TextNode>(doc.children[0], 'Text');

      expect(texts).toHaveLength(2);
      expect(texts[0].content).toBe('A');
      expect(texts[1].content).toBe('B');
    });

    it('should find layout nodes', () => {
      const doc = parse('page { row { col { } col { } } row { } }');
      const rows = findByType<RowNode>(doc.children[0], 'Row');
      const cols = findByType<ColNode>(doc.children[0], 'Col');

      expect(rows).toHaveLength(2);
      expect(cols).toHaveLength(2);
    });
  });

  describe('countNodes', () => {
    it('should count all nodes', () => {
      const doc = parse('page { text "A" text "B" }');
      const count = countNodes(doc.children[0]);

      expect(count).toBe(3); // page + 2 text nodes
    });

    it('should count nested nodes', () => {
      const doc = parse('page { row { col { text "A" } col { text "B" } } }');
      const count = countNodes(doc.children[0]);

      expect(count).toBe(6); // page, row, col, text, col, text
    });

    it('should count single node', () => {
      const doc = parse('page { }');
      const count = countNodes(doc.children[0]);

      expect(count).toBe(1);
    });
  });

  describe('getMaxDepth', () => {
    it('should return 0 for single node', () => {
      const doc = parse('page { }');
      const depth = getMaxDepth(doc.children[0]);

      expect(depth).toBe(0);
    });

    it('should calculate correct depth', () => {
      const doc = parse('page { row { col { text "Deep" } } }');
      const depth = getMaxDepth(doc.children[0]);

      expect(depth).toBe(3); // page=0, row=1, col=2, text=3
    });

    it('should find maximum depth among branches', () => {
      const doc = parse(`
        page {
          text "Shallow"
          row { col { card { button "Deep" } } }
        }
      `);
      const depth = getMaxDepth(doc.children[0]);

      expect(depth).toBe(4); // page=0, row=1, col=2, card=3, button=4
    });
  });

  describe('getAncestors', () => {
    it('should return path to target node', () => {
      const doc = parse('page { row { text "Target" } }');
      const page = doc.children[0] as PageNode;
      const row = page.children[0] as RowNode;
      const text = row.children[0];

      const ancestors = getAncestors(page, text);

      expect(ancestors).toHaveLength(2);
      expect(ancestors[0].type).toBe('Page');
      expect(ancestors[1].type).toBe('Row');
    });

    it('should return empty array when target is root', () => {
      const doc = parse('page { }');
      const page = doc.children[0];

      const ancestors = getAncestors(page, page);

      expect(ancestors).toHaveLength(0);
    });

    it('should return empty array when target not found', () => {
      const doc = parse('page { text "A" }');
      const doc2 = parse('page { text "B" }');
      const page = doc.children[0];
      const otherText = doc2.children[0];

      const ancestors = getAncestors(page, otherText);

      expect(ancestors).toHaveLength(0);
    });
  });

  describe('mapNodes', () => {
    it('should transform all nodes', () => {
      const doc = parse('page { text "A" text "B" }');
      const types = mapNodes(doc.children[0], (node) => node.type);

      expect(types).toContain('Page');
      expect(types).toContain('Text');
      expect(types).toHaveLength(3);
    });

    it('should apply custom mapping function', () => {
      const doc = parse('page { button "A" button "B" }');
      const labels = mapNodes(doc.children[0], (node) => {
        if (node.type === 'Button') {
          return (node as ButtonNode).content;
        }
        return node.type;
      });

      expect(labels).toContain('Page');
      expect(labels).toContain('A');
      expect(labels).toContain('B');
    });
  });

  describe('cloneNode', () => {
    it('should create a deep copy', () => {
      const doc = parse('page { text "Original" }');
      const original = doc.children[0] as PageNode;
      const clone = cloneNode(original);

      expect(clone).not.toBe(original);
      expect(clone.type).toBe(original.type);
      expect(clone.children).toHaveLength(original.children.length);
    });

    it('should not share references with original', () => {
      const doc = parse('page { text "Original" }');
      const original = doc.children[0] as PageNode;
      const clone = cloneNode(original);

      // Modify clone
      (clone.children[0] as TextNode).content = 'Modified';

      // Original should be unchanged
      expect((original.children[0] as TextNode).content).toBe('Original');
    });
  });

  describe('contains', () => {
    it('should return true when node contains target', () => {
      const doc = parse('page { row { text "Nested" } }');
      const page = doc.children[0] as PageNode;
      const row = page.children[0] as RowNode;
      const text = row.children[0];

      expect(contains(page, text)).toBe(true);
    });

    it('should return true when target is the node itself', () => {
      const doc = parse('page { }');
      const page = doc.children[0];

      expect(contains(page, page)).toBe(true);
    });

    it('should return false when target is not contained', () => {
      const doc = parse('page { text "A" }');
      const doc2 = parse('page { text "B" }');
      const page = doc.children[0];
      const otherText = (doc2.children[0] as PageNode).children[0];

      expect(contains(page, otherText)).toBe(false);
    });
  });

  describe('getNodeTypes', () => {
    it('should return all unique node types', () => {
      const doc = parse('page { text "A" button "B" text "C" }');
      const types = getNodeTypes(doc.children[0]);

      expect(types.has('Page')).toBe(true);
      expect(types.has('Text')).toBe(true);
      expect(types.has('Button')).toBe(true);
      expect(types.size).toBe(3); // Only unique types
    });

    it('should include layout types', () => {
      const doc = parse('page { header { } main { } footer { } }');
      const types = getNodeTypes(doc.children[0]);

      expect(types.has('Page')).toBe(true);
      expect(types.has('Header')).toBe(true);
      expect(types.has('Main')).toBe(true);
      expect(types.has('Footer')).toBe(true);
    });

    it('should work with nested structures', () => {
      const doc = parse(`
        page {
          row {
            col { card { input "Email" } }
            col { card { button "Submit" } }
          }
        }
      `);
      const types = getNodeTypes(doc.children[0]);

      expect(types.has('Page')).toBe(true);
      expect(types.has('Row')).toBe(true);
      expect(types.has('Col')).toBe(true);
      expect(types.has('Card')).toBe(true);
      expect(types.has('Input')).toBe(true);
      expect(types.has('Button')).toBe(true);
    });
  });
});
