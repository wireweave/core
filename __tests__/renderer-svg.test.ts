/**
 * SVG Renderer Tests
 *
 * Tests for the SVG rendering functionality
 */

import { describe, it, expect } from 'vitest';
import { renderToSvg, renderToPureSvg, SvgRenderer, createSvgRenderer } from '../src/renderer';
import type { WireframeDocument, PageNode, TextNode, TitleNode, ButtonNode, CardNode, InputNode, TableNode, CheckboxNode, ProgressNode, BadgeNode, AlertNode, ListNode, NavNode, BreadcrumbNode } from '../src/ast/types';

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

  describe('Pure SVG Rendering', () => {
    it('should render with scale transform', () => {
      const doc = createDocument([]);
      const result = renderToPureSvg(doc, { scale: 2 });

      expect(result.svg).toContain('scale(2)');
    });
  });

  describe('Text Rendering (Pure SVG)', () => {
    it('should render text node', () => {
      const textNode: TextNode = {
        type: 'Text',
        content: 'Hello World',
      };
      const doc = createDocument([textNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Hello World');
      expect(result.svg).toContain('<text');
    });

    it('should render text with muted style', () => {
      const textNode: TextNode = {
        type: 'Text',
        content: 'Muted text',
        muted: true,
      };
      const doc = createDocument([textNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('fill="#888888"');
    });

    it('should render title node', () => {
      const titleNode: TitleNode = {
        type: 'Title',
        content: 'Page Title',
        level: 1,
      };
      const doc = createDocument([titleNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Page Title');
      expect(result.svg).toContain('font-weight="600"');
    });
  });

  describe('Button Rendering (Pure SVG)', () => {
    it('should render primary button', () => {
      const buttonNode: ButtonNode = {
        type: 'Button',
        content: 'Click Me',
        primary: true,
      };
      const doc = createDocument([buttonNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Click Me');
      expect(result.svg).toContain('<rect');
      expect(result.svg).toContain('rx="4"');
    });

    it('should render outline button', () => {
      const buttonNode: ButtonNode = {
        type: 'Button',
        content: 'Outline',
        outline: true,
      };
      const doc = createDocument([buttonNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Outline');
      expect(result.svg).toContain('stroke=');
    });
  });

  describe('Input Rendering (Pure SVG)', () => {
    it('should render input with label', () => {
      const inputNode: InputNode = {
        type: 'Input',
        label: 'Email',
        placeholder: 'Enter your email',
      };
      const doc = createDocument([inputNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Email');
      expect(result.svg).toContain('Enter your email');
    });

    it('should render checkbox', () => {
      const checkboxNode: CheckboxNode = {
        type: 'Checkbox',
        label: 'Accept terms',
        checked: true,
      };
      const doc = createDocument([checkboxNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Accept terms');
      expect(result.svg).toContain('<path'); // Checkmark
    });
  });

  describe('Card Rendering (Pure SVG)', () => {
    it('should render card with title', () => {
      const cardNode: CardNode = {
        type: 'Card',
        title: 'Card Title',
        children: [],
      };
      const doc = createDocument([cardNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Card Title');
      expect(result.svg).toContain('rx="8"'); // Rounded corners
    });

    it('should render card with children', () => {
      const cardNode: CardNode = {
        type: 'Card',
        children: [
          { type: 'Text', content: 'Card content' } as TextNode,
        ],
      };
      const doc = createDocument([cardNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Card content');
    });
  });

  describe('Table Rendering (Pure SVG)', () => {
    it('should render table with columns', () => {
      const tableNode: TableNode = {
        type: 'Table',
        columns: ['Name', 'Email', 'Status'],
        rows: [],
      };
      const doc = createDocument([tableNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Name');
      expect(result.svg).toContain('Email');
      expect(result.svg).toContain('Status');
    });
  });

  describe('Feedback Components (Pure SVG)', () => {
    it('should render progress bar', () => {
      const progressNode: ProgressNode = {
        type: 'Progress',
        value: 50,
        max: 100,
        label: 'Loading',
      };
      const doc = createDocument([progressNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Loading');
      expect(result.svg).toContain('<rect'); // Progress track and fill
    });

    it('should render alert', () => {
      const alertNode: AlertNode = {
        type: 'Alert',
        content: 'This is an alert',
      };
      const doc = createDocument([alertNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('This is an alert');
    });

    it('should render badge', () => {
      const badgeNode: BadgeNode = {
        type: 'Badge',
        content: 'New',
      };
      const doc = createDocument([badgeNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('New');
      expect(result.svg).toContain('rx="11"'); // Pill shape
    });
  });

  describe('Navigation Components (Pure SVG)', () => {
    it('should render nav items', () => {
      const navNode: NavNode = {
        type: 'Nav',
        items: [
          { label: 'Home', active: true },
          { label: 'About' },
          { label: 'Contact' },
        ],
      };
      const doc = createDocument([navNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Home');
      expect(result.svg).toContain('About');
      expect(result.svg).toContain('Contact');
    });

    it('should render breadcrumb', () => {
      const breadcrumbNode: BreadcrumbNode = {
        type: 'Breadcrumb',
        items: [
          { label: 'Home' },
          { label: 'Products' },
          { label: 'Details' },
        ],
      };
      const doc = createDocument([breadcrumbNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Home');
      expect(result.svg).toContain('Products');
      expect(result.svg).toContain('Details');
      expect(result.svg).toContain('/'); // Separator
    });
  });

  describe('List Rendering (Pure SVG)', () => {
    it('should render unordered list', () => {
      const listNode: ListNode = {
        type: 'List',
        items: [
          { content: 'Item 1' },
          { content: 'Item 2' },
          { content: 'Item 3' },
        ],
      };
      const doc = createDocument([listNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('Item 1');
      expect(result.svg).toContain('Item 2');
      expect(result.svg).toContain('Item 3');
    });

    it('should render ordered list with numbers', () => {
      const listNode: ListNode = {
        type: 'List',
        items: [
          { content: 'First' },
          { content: 'Second' },
        ],
        ordered: true,
      };
      const doc = createDocument([listNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('1.');
      expect(result.svg).toContain('2.');
    });
  });

  describe('XML Escaping (Pure SVG)', () => {
    it('should escape special XML characters in text', () => {
      const textNode: TextNode = {
        type: 'Text',
        content: 'Test <script> & "quotes"',
      };
      const doc = createDocument([textNode]);
      const result = renderToPureSvg(doc);

      expect(result.svg).toContain('&lt;script&gt;');
      expect(result.svg).toContain('&amp;');
      expect(result.svg).toContain('&quot;quotes&quot;');
    });
  });

  describe('Pure SVG Validity', () => {
    it('should produce valid SVG structure', () => {
      const doc = createDocument([
        { type: 'Title', content: 'Test', level: 1 } as TitleNode,
        { type: 'Text', content: 'Content' } as TextNode,
        { type: 'Button', content: 'Click' } as ButtonNode,
      ]);
      const result = renderToPureSvg(doc);

      // Check SVG structure
      expect(result.svg).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(result.svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('<defs>');
      expect(result.svg).toContain('</defs>');
      expect(result.svg).toContain('</svg>');
    });

    it('should include font-family in styles', () => {
      const doc = createDocument([]);
      const result = renderToPureSvg(doc, { fontFamily: 'Arial, sans-serif' });

      expect(result.svg).toContain('font-family: Arial, sans-serif');
    });
  });

  describe('Factory Functions', () => {
    it('should create renderer with createSvgRenderer', () => {
      const renderer = createSvgRenderer({ width: 640, height: 480 });
      const doc = createDocument([]);
      const result = renderer.render(doc);

      expect(result.width).toBe(640);
      expect(result.height).toBe(480);
    });

    it('should create renderer instance directly', () => {
      const renderer = new SvgRenderer({ scale: 1.5 });
      const doc = createDocument([]);
      const result = renderer.render(doc);

      expect(result.svg).toContain('scale(1.5)');
    });
  });
});
