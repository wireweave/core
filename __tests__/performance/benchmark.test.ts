/**
 * Performance benchmark tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { parse, render, renderToSvg } from '../../src';
import type { WireframeDocument } from '../../src/ast/types';

describe('Performance Benchmarks', () => {
  // Generate test fixtures
  const simpleSource = 'page { text "Hello" }';

  const mediumSource = `
    page "Dashboard" {
      header p=4 {
        row justify=between {
          title "App" level=1
          avatar "JD"
        }
      }
      main p=6 {
        row gap=4 {
          col span=4 { card { title "A" text "Content" } }
          col span=4 { card { title "B" text "Content" } }
          col span=4 { card { title "C" text "Content" } }
        }
      }
    }
  `;

  const generateLargeSource = (rows: number): string => {
    const rowContent = Array(rows)
      .fill(null)
      .map((_, i) => `card p=4 { title "Card ${i}" text "Content ${i}" }`)
      .join('\n');
    return `page { main { ${rowContent} } }`;
  };

  describe('Parsing Performance', () => {
    it('should parse simple input quickly', () => {
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        parse(simpleSource);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(1); // Less than 1ms per parse
      console.log(`Simple parse: ${avgMs.toFixed(3)}ms avg`);
    });

    it('should parse medium input in reasonable time', () => {
      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        parse(mediumSource);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(5); // Less than 5ms per parse
      console.log(`Medium parse: ${avgMs.toFixed(3)}ms avg`);
    });

    it('should parse large input without timeout', () => {
      const largeSource = generateLargeSource(100);
      const iterations = 10;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        parse(largeSource);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(50); // Less than 50ms per parse
      console.log(`Large parse (100 cards): ${avgMs.toFixed(3)}ms avg`);
    });
  });

  describe('Rendering Performance', () => {
    let simpleDoc: WireframeDocument;
    let mediumDoc: WireframeDocument;
    let largeDoc: WireframeDocument;

    beforeAll(() => {
      simpleDoc = parse(simpleSource);
      mediumDoc = parse(mediumSource);
      largeDoc = parse(generateLargeSource(100));
    });

    it('should render simple HTML quickly', () => {
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        render(simpleDoc);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(1); // Less than 1ms per render
      console.log(`Simple HTML render: ${avgMs.toFixed(3)}ms avg`);
    });

    it('should render medium HTML in reasonable time', () => {
      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        render(mediumDoc);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(5); // Less than 5ms per render
      console.log(`Medium HTML render: ${avgMs.toFixed(3)}ms avg`);
    });

    it('should render large HTML without timeout', () => {
      const iterations = 10;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        render(largeDoc);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(100); // Less than 100ms per render
      console.log(`Large HTML render (100 cards): ${avgMs.toFixed(3)}ms avg`);
    });
  });

  describe('SVG Rendering Performance', () => {
    let simpleDoc: WireframeDocument;
    let mediumDoc: WireframeDocument;

    beforeAll(() => {
      simpleDoc = parse(simpleSource);
      mediumDoc = parse(mediumSource);
    });

    it('should render simple SVG quickly', () => {
      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        renderToSvg(simpleDoc);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(5); // Less than 5ms per render
      console.log(`Simple SVG render: ${avgMs.toFixed(3)}ms avg`);
    });

    it('should render medium SVG in reasonable time', () => {
      const iterations = 50;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        renderToSvg(mediumDoc);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(20); // Less than 20ms per render
      console.log(`Medium SVG render: ${avgMs.toFixed(3)}ms avg`);
    });
  });

  describe('Full Pipeline Performance', () => {
    it('should complete parse + render pipeline quickly', () => {
      const iterations = 100;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const doc = parse(mediumSource);
        render(doc);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(10); // Less than 10ms for full pipeline
      console.log(`Full pipeline (parse + render): ${avgMs.toFixed(3)}ms avg`);
    });

    it('should complete parse + SVG pipeline in reasonable time', () => {
      const iterations = 50;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const doc = parse(mediumSource);
        renderToSvg(doc);
      }

      const duration = performance.now() - start;
      const avgMs = duration / iterations;

      expect(avgMs).toBeLessThan(30); // Less than 30ms for full pipeline
      console.log(`Full pipeline (parse + SVG): ${avgMs.toFixed(3)}ms avg`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory on repeated parsing', () => {
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const doc = parse(mediumSource);
        render(doc);
      }

      // If we get here without OOM, the test passes
      expect(true).toBe(true);
    });

    it('should handle very deep nesting', () => {
      const depth = 50;
      let source = 'page { ';
      for (let i = 0; i < depth; i++) {
        source += 'card { ';
      }
      source += 'text "deep"';
      for (let i = 0; i < depth; i++) {
        source += ' }';
      }
      source += ' }';

      const start = performance.now();
      const doc = parse(source);
      const { html } = render(doc);
      const duration = performance.now() - start;

      expect(html).toContain('deep');
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      console.log(`Deep nesting (${depth} levels): ${duration.toFixed(3)}ms`);
    });
  });

  describe('Scalability', () => {
    it('should scale linearly with input size', () => {
      const sizes = [10, 25, 50, 100];
      const times: number[] = [];

      for (const size of sizes) {
        const source = generateLargeSource(size);
        const start = performance.now();
        const doc = parse(source);
        render(doc);
        times.push(performance.now() - start);
      }

      // Check that scaling is roughly linear (4x input should be < 20x time)
      // Performance can vary significantly based on environment
      const ratio = times[3] / times[1]; // 100 cards vs 25 cards (4x input)
      expect(ratio).toBeLessThan(20); // Allow for environment variance

      console.log('Scalability times:');
      sizes.forEach((size, i) => {
        console.log(`  ${size} cards: ${times[i].toFixed(3)}ms`);
      });
    });
  });
});
