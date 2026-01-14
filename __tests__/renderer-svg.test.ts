/**
 * SVG Renderer Tests
 *
 * Tests for the SVG rendering functionality (foreignObject-based)
 */

import { describe, it, expect } from 'vitest';
import { renderToSvg } from '../src/renderer';
import type { WireframeDocument, PageNode } from '../src/ast/types';

// Helper to create a minimal document
function createDocument(children: PageNode['children'] = []): WireframeDocument {
  return {
    type: 'Document',
    children: [
      {
        type: 'Page',
        title: 'Test Page',
        children,
      },
    ],
  };
}

describe('SVG Renderer', () => {
  describe('Basic Rendering (foreignObject)', () => {
    it('should render an empty document with foreignObject', () => {
      const doc = createDocument([]);
      const result = renderToSvg(doc);

      expect(result.svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox="0 0 800 600"');
      expect(result.svg).toContain('<foreignObject');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should render with custom dimensions', () => {
      const doc = createDocument([]);
      const result = renderToSvg(doc, { width: 1024, height: 768 });

      expect(result.svg).toContain('viewBox="0 0 1024 768"');
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
    });

    it('should render with custom background color', () => {
      const doc = createDocument([]);
      const result = renderToSvg(doc, { background: '#f0f0f0' });

      expect(result.svg).toContain('fill="#f0f0f0"');
    });

    it('should include page title', () => {
      const doc = createDocument([]);
      const result = renderToSvg(doc);

      expect(result.svg).toContain('Test Page');
    });

    it('should include HTML and CSS in foreignObject', () => {
      const doc = createDocument([]);
      const result = renderToSvg(doc);

      expect(result.svg).toContain('<style type="text/css">');
      expect(result.svg).toContain('class="wf-page"');
    });
  });
});
