/**
 * Viewport module tests
 */
import { describe, it, expect } from 'vitest';
import {
  DEVICE_PRESETS,
  DEFAULT_VIEWPORT,
  parseViewportString,
  resolveViewport,
  getDevicePresets,
  isValidDevicePreset,
  calculateViewportScale,
  wrapInPreviewContainer,
} from '../src/viewport';
import { parse, render, renderToSvg } from '../src';

describe('Viewport Module', () => {
  describe('DEVICE_PRESETS', () => {
    it('should have desktop presets', () => {
      expect(DEVICE_PRESETS['desktop']).toEqual({
        width: 1440,
        height: 900,
        label: 'Desktop',
        category: 'desktop',
      });
      expect(DEVICE_PRESETS['desktop-lg']).toEqual({
        width: 1920,
        height: 1080,
        label: 'Full HD',
        category: 'desktop',
      });
    });

    it('should have tablet presets', () => {
      expect(DEVICE_PRESETS['ipad']).toEqual({
        width: 1024,
        height: 768,
        label: 'iPad (Landscape)',
        category: 'tablet',
      });
      expect(DEVICE_PRESETS['ipad-portrait']).toEqual({
        width: 768,
        height: 1024,
        label: 'iPad (Portrait)',
        category: 'tablet',
      });
    });

    it('should have mobile presets', () => {
      expect(DEVICE_PRESETS['iphone14']).toEqual({
        width: 390,
        height: 844,
        label: 'iPhone 14',
        category: 'mobile',
      });
      expect(DEVICE_PRESETS['android']).toEqual({
        width: 360,
        height: 800,
        label: 'Android',
        category: 'mobile',
      });
    });
  });

  describe('DEFAULT_VIEWPORT', () => {
    it('should be desktop preset', () => {
      expect(DEFAULT_VIEWPORT).toEqual(DEVICE_PRESETS['desktop']);
    });
  });

  describe('parseViewportString', () => {
    it('should parse "widthxheight" format', () => {
      expect(parseViewportString('1920x1080')).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it('should parse width-only format', () => {
      expect(parseViewportString('1440')).toEqual({
        width: 1440,
      });
    });

    it('should handle number input', () => {
      expect(parseViewportString(1920)).toEqual({
        width: 1920,
      });
    });

    it('should return null for invalid format', () => {
      expect(parseViewportString('invalid')).toBeNull();
      expect(parseViewportString('100%')).toBeNull();
      expect(parseViewportString('auto')).toBeNull();
    });
  });

  describe('resolveViewport', () => {
    it('should resolve device preset', () => {
      const viewport = resolveViewport(undefined, 'iphone14');
      expect(viewport).toEqual(DEVICE_PRESETS['iphone14']);
    });

    it('should resolve explicit viewport string', () => {
      const viewport = resolveViewport('1920x1080');
      expect(viewport.width).toBe(1920);
      expect(viewport.height).toBe(1080);
      expect(viewport.category).toBe('desktop');
    });

    it('should resolve width-only viewport', () => {
      const viewport = resolveViewport('1440');
      expect(viewport.width).toBe(1440);
      expect(viewport.height).toBe(DEFAULT_VIEWPORT.height);
    });

    it('should resolve numeric viewport', () => {
      const viewport = resolveViewport(375);
      expect(viewport.width).toBe(375);
      expect(viewport.category).toBe('mobile');
    });

    it('should categorize viewports correctly', () => {
      // Mobile: <= 430px
      expect(resolveViewport(375).category).toBe('mobile');
      expect(resolveViewport(430).category).toBe('mobile');

      // Tablet: 431-1024px
      expect(resolveViewport(768).category).toBe('tablet');
      expect(resolveViewport(1024).category).toBe('tablet');

      // Desktop: > 1024px
      expect(resolveViewport(1025).category).toBe('desktop');
      expect(resolveViewport(1920).category).toBe('desktop');
    });

    it('should prioritize device over viewport', () => {
      const viewport = resolveViewport('1920x1080', 'iphone14');
      expect(viewport).toEqual(DEVICE_PRESETS['iphone14']);
    });

    it('should return default for undefined inputs', () => {
      expect(resolveViewport()).toEqual(DEFAULT_VIEWPORT);
    });
  });

  describe('getDevicePresets', () => {
    it('should return a copy of all presets', () => {
      const presets = getDevicePresets();
      expect(presets).toEqual(DEVICE_PRESETS);
      expect(presets).not.toBe(DEVICE_PRESETS); // Should be a copy
    });
  });

  describe('isValidDevicePreset', () => {
    it('should return true for valid presets', () => {
      expect(isValidDevicePreset('desktop')).toBe(true);
      expect(isValidDevicePreset('iphone14')).toBe(true);
      expect(isValidDevicePreset('ipad')).toBe(true);
    });

    it('should return false for invalid presets', () => {
      expect(isValidDevicePreset('invalid')).toBe(false);
      expect(isValidDevicePreset('')).toBe(false);
      expect(isValidDevicePreset('DESKTOP')).toBe(false); // Case sensitive
    });
  });

  describe('calculateViewportScale', () => {
    it('should calculate scale to fit width', () => {
      const viewport = { width: 1440, height: 900, label: 'Desktop', category: 'desktop' as const };
      const scale = calculateViewportScale(viewport, 720);
      expect(scale).toBe(0.5);
    });

    it('should calculate scale to fit both dimensions', () => {
      const viewport = { width: 1440, height: 900, label: 'Desktop', category: 'desktop' as const };
      const scale = calculateViewportScale(viewport, 720, 450);
      expect(scale).toBe(0.5);
    });

    it('should not exceed maxScale', () => {
      const viewport = { width: 400, height: 300, label: 'Custom', category: 'mobile' as const };
      const scale = calculateViewportScale(viewport, 800, 600, 1);
      expect(scale).toBe(1);
    });

    it('should allow scale > 1 if maxScale is higher', () => {
      const viewport = { width: 400, height: 300, label: 'Custom', category: 'mobile' as const };
      const scale = calculateViewportScale(viewport, 800, 600, 2);
      expect(scale).toBe(2);
    });

    it('should round to 3 decimal places', () => {
      const viewport = { width: 1000, height: 800, label: 'Custom', category: 'tablet' as const };
      const scale = calculateViewportScale(viewport, 333);
      expect(scale).toBe(0.333);
    });
  });

  describe('wrapInPreviewContainer', () => {
    const viewport = { width: 1440, height: 900, label: 'Desktop', category: 'desktop' as const };
    const html = '<div class="wf-page">Content</div>';

    it('should wrap HTML in preview container', () => {
      const wrapped = wrapInPreviewContainer(html, viewport);
      expect(wrapped).toContain('wf-viewport-preview');
      expect(wrapped).toContain('wf-viewport-wrapper');
      expect(wrapped).toContain(html);
    });

    it('should apply dark mode class', () => {
      const wrapped = wrapInPreviewContainer(html, viewport, { darkMode: true });
      expect(wrapped).toContain('wf-viewport-preview dark');
    });

    it('should apply custom scale', () => {
      const wrapped = wrapInPreviewContainer(html, viewport, { scale: 0.5 });
      expect(wrapped).toContain('transform: scale(0.5)');
    });

    it('should calculate scale from container width', () => {
      const wrapped = wrapInPreviewContainer(html, viewport, { containerWidth: 720 });
      expect(wrapped).toContain('transform: scale(0.5)');
    });

    it('should use custom prefix', () => {
      const wrapped = wrapInPreviewContainer(html, viewport, { prefix: 'custom' });
      expect(wrapped).toContain('custom-viewport-preview');
      expect(wrapped).toContain('custom-viewport-wrapper');
    });

    it('should set correct wrapper dimensions', () => {
      const wrapped = wrapInPreviewContainer(html, viewport);
      expect(wrapped).toContain(`width: ${viewport.width}px`);
      expect(wrapped).toContain(`height: ${viewport.height}px`);
    });
  });
});

describe('Viewport Integration', () => {
  describe('Parser with viewport', () => {
    it('should parse viewport attribute as number', () => {
      const doc = parse('page viewport=1920 { text "Hello" }');
      expect(doc.children[0].viewport).toBe(1920);
    });

    it('should parse viewport attribute as string', () => {
      const doc = parse('page viewport="1920x1080" { text "Hello" }');
      expect(doc.children[0].viewport).toBe('1920x1080');
    });

    it('should parse device attribute', () => {
      const doc = parse('page device="iphone14" { text "Hello" }');
      expect(doc.children[0].device).toBe('iphone14');
    });

    it('should parse both viewport and device (device takes precedence)', () => {
      const doc = parse('page viewport=1920 device="iphone14" { text "Hello" }');
      expect(doc.children[0].viewport).toBe(1920);
      expect(doc.children[0].device).toBe('iphone14');
    });
  });

  describe('HTML Renderer with viewport', () => {
    it('should render page with viewport dimensions', () => {
      const doc = parse('page viewport=1920 { text "Hello" }');
      const { html } = render(doc);
      expect(html).toContain('width: 1920px');
      expect(html).toContain('data-viewport-width="1920"');
    });

    it('should render page with device preset dimensions', () => {
      const doc = parse('page device="iphone14" { text "Hello" }');
      const { html } = render(doc);
      expect(html).toContain('width: 390px');
      expect(html).toContain('height: 844px');
      expect(html).toContain('data-viewport-label="iPhone 14"');
    });

    it('should render default viewport when none specified', () => {
      const doc = parse('page { text "Hello" }');
      const { html } = render(doc);
      expect(html).toContain('width: 1440px');
      expect(html).toContain('height: 900px');
      expect(html).toContain('data-viewport-label="Desktop"');
    });
  });

  describe('SVG Renderer with viewport', () => {
    it('should use viewport dimensions for SVG size', () => {
      const doc = parse('page viewport="800x600" { text "Hello" }');
      const { svg, width, height } = renderToSvg(doc);
      expect(width).toBe(800);
      expect(height).toBe(600);
      expect(svg).toContain('width="800"');
      expect(svg).toContain('height="600"');
    });

    it('should use device preset dimensions for SVG', () => {
      const doc = parse('page device="iphone14" { text "Hello" }');
      const { width, height } = renderToSvg(doc);
      expect(width).toBe(390);
      expect(height).toBe(844);
    });

    it('should use explicit options when no viewport specified', () => {
      const doc = parse('page { text "Hello" }');
      const { width, height } = renderToSvg(doc, { width: 640, height: 480 });
      expect(width).toBe(640);
      expect(height).toBe(480);
    });
  });

  describe('CSS includes viewport preview styles', () => {
    it('should include viewport preview classes', () => {
      const doc = parse('page { text "Test" }');
      const { css } = render(doc);
      expect(css).toContain('.wf-viewport-preview');
      expect(css).toContain('.wf-viewport-wrapper');
      expect(css).toContain('transform-origin: top center');
    });
  });
});
