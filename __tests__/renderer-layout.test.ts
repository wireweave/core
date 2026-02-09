/**
 * Layout Renderer Tests for wireweave
 *
 * Tests 12-column grid, responsive breakpoints, and flexbox rendering
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../src';
import { render } from '../src/renderer';

describe('Grid Layout Rendering', () => {
  describe('12-Column Grid', () => {
    it('should render row with col span', () => {
      const doc = parse(`
        page {
          row {
            col span=4 { text "One Third" }
            col span=8 { text "Two Thirds" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-row');
      expect(result.html).toContain('wf-col-4');
      expect(result.html).toContain('wf-col-8');
    });

    it('should render equal columns', () => {
      const doc = parse(`
        page {
          row {
            col span=6 { text "Left" }
            col span=6 { text "Right" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html.match(/wf-col-6/g)).toHaveLength(2);
    });

    it('should render 12 equal columns', () => {
      const doc = parse(`
        page {
          row {
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
            col span=1 { }
          }
        }
      `);
      const result = render(doc);

      expect(result.html.match(/wf-col-1/g)).toHaveLength(12);
    });
  });

  // Note: Responsive breakpoints intentionally not implemented
  // Wireframes use fixed layouts with scale mode for preview
  describe('Fixed Layout (No Responsive Breakpoints)', () => {
    it('should render fixed column spans only', () => {
      const doc = parse(`
        page {
          row {
            col span=6 { text "Fixed Column" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-col-6');
      // Responsive classes should not exist
      expect(result.html).not.toContain('wf-col-sm-');
      expect(result.html).not.toContain('wf-col-md-');
    });

    it('should render multiple fixed columns', () => {
      const doc = parse(`
        page {
          row {
            col span=6 { text "Left" }
            col span=6 { text "Right" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html.match(/wf-col-6/g)).toHaveLength(2);
    });
  });

  describe('Flexbox Properties', () => {
    it('should render row with flex justify=between align=center', () => {
      const doc = parse(`
        page {
          row justify=between align=center {
            col { text "Left" }
            col { text "Right" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-justify-between');
      expect(result.html).toContain('wf-align-center');
    });

    it('should render row with flex direction', () => {
      const doc = parse(`
        page {
          row direction=column {
            col { text "Top" }
            col { text "Bottom" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-flex-col');
    });

    it('should render row with flex wrap', () => {
      const doc = parse(`
        page {
          row wrap {
            col span=6 { text "1" }
            col span=6 { text "2" }
            col span=6 { text "3" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-flex-wrap');
    });

    it('should render row with gap', () => {
      const doc = parse(`
        page {
          row gap=1 {
            col { text "1" }
            col { text "2" }
          }
        }
      `);
      const result = render(doc);

      // Gap is now rendered as inline style (spacing token 1 = 4px)
      expect(result.html).toContain('gap: 4px');
    });

    it('should render all justify values', () => {
      const justifyValues = ['start', 'center', 'end', 'between', 'around', 'evenly'];

      for (const value of justifyValues) {
        const doc = parse(`page { row justify=${value} { col { } } }`);
        const result = render(doc);
        expect(result.html).toContain(`wf-justify-${value}`);
      }
    });

    it('should render all align values', () => {
      const alignValues = ['start', 'center', 'end', 'stretch', 'baseline'];

      for (const value of alignValues) {
        const doc = parse(`page { row align=${value} { col { } } }`);
        const result = render(doc);
        expect(result.html).toContain(`wf-align-${value}`);
      }
    });
  });

  describe('Spacing Styles (px-accurate)', () => {
    it('should render card with p=4 m=2 as inline styles', () => {
      // Spacing tokens: 2=8px, 4=16px
      const doc = parse(`
        page {
          card p=4 m=2 {
            text "Content"
          }
        }
      `);
      const result = render(doc);

      // Spacing tokens: 4=16px, 2=8px
      expect(result.html).toContain('padding: 16px');
      expect(result.html).toContain('margin: 8px');
    });

    it('should render all padding as inline styles', () => {
      // Spacing tokens: 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px
      const doc = parse(`
        page {
          card p=4 pt=1 pr=2 pb=3 pl=4 px=5 py=6 {
            text "Padding"
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('padding: 16px');
      expect(result.html).toContain('padding-top: 4px');
      expect(result.html).toContain('padding-right: 8px');
      expect(result.html).toContain('padding-bottom: 12px');
      expect(result.html).toContain('padding-left: 16px');
      // px and py set both sides
      expect(result.html).toContain('padding-left: 20px');
      expect(result.html).toContain('padding-right: 20px');
      expect(result.html).toContain('padding-top: 24px');
      expect(result.html).toContain('padding-bottom: 24px');
    });

    it('should render all margin as inline styles', () => {
      // Spacing tokens: 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px
      const doc = parse(`
        page {
          card m=4 mt=1 mr=2 mb=3 ml=4 mx=5 my=6 {
            text "Margin"
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('margin: 16px');
      expect(result.html).toContain('margin-top: 4px');
      expect(result.html).toContain('margin-right: 8px');
      expect(result.html).toContain('margin-bottom: 12px');
      expect(result.html).toContain('margin-left: 16px');
      // mx and my set both sides
      expect(result.html).toContain('margin-left: 20px');
      expect(result.html).toContain('margin-right: 20px');
      expect(result.html).toContain('margin-top: 24px');
      expect(result.html).toContain('margin-bottom: 24px');
    });
  });

  describe('Semantic Layout Tags', () => {
    it('should render header as <header>', () => {
      const doc = parse(`
        page {
          header { text "Logo" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('<header');
      expect(result.html).toContain('</header>');
      expect(result.html).toContain('wf-header');
    });

    it('should render main as <main>', () => {
      const doc = parse(`
        page {
          main { text "Content" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('<main');
      expect(result.html).toContain('</main>');
      expect(result.html).toContain('wf-main');
    });

    it('should render footer as <footer>', () => {
      const doc = parse(`
        page {
          footer { text "Copyright" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('<footer');
      expect(result.html).toContain('</footer>');
      expect(result.html).toContain('wf-footer');
    });

    it('should render sidebar as <aside>', () => {
      const doc = parse(`
        page {
          sidebar { text "Menu" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('<aside');
      expect(result.html).toContain('</aside>');
      expect(result.html).toContain('wf-sidebar');
    });

    it('should render section as <section>', () => {
      const doc = parse(`
        page {
          section "Features" { text "Feature 1" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('<section');
      expect(result.html).toContain('</section>');
      expect(result.html).toContain('wf-section');
      expect(result.html).toContain('Features');
    });

    it('should render complete page layout', () => {
      const doc = parse(`
        page {
          header { title "Header" }
          row {
            sidebar { nav ["Home", "About"] }
            main { text "Content" }
          }
          footer { text "Footer" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('<header');
      expect(result.html).toContain('<aside');
      expect(result.html).toContain('<main');
      expect(result.html).toContain('<footer');
    });
  });

  describe('Sidebar Variations', () => {
    it('should render left sidebar (default)', () => {
      const doc = parse(`
        page {
          sidebar { text "Left" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-sidebar');
      expect(result.html).not.toContain('wf-sidebar-right');
    });

    it('should render right sidebar', () => {
      const doc = parse(`
        page {
          sidebar position=right { text "Right" }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-sidebar');
      expect(result.html).toContain('wf-sidebar-right');
    });
  });

  describe('Nested Layout', () => {
    it('should render nested rows and columns', () => {
      const doc = parse(`
        page {
          row {
            col span=6 {
              row {
                col span=6 { text "Nested 1" }
                col span=6 { text "Nested 2" }
              }
            }
            col span=6 { text "Right" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html.match(/wf-row/g)!.length).toBeGreaterThanOrEqual(2);
      expect(result.html.match(/wf-col-6/g)!.length).toBeGreaterThanOrEqual(3);
    });

    it('should render card inside column', () => {
      const doc = parse(`
        page {
          row {
            col span=4 {
              card { text "Card 1" }
            }
            col span=4 {
              card { text "Card 2" }
            }
            col span=4 {
              card { text "Card 3" }
            }
          }
        }
      `);
      const result = render(doc);

      expect(result.html.match(/class="wf-card/g)).toHaveLength(3);
      expect(result.html.match(/wf-col-4/g)).toHaveLength(3);
    });
  });

  describe('Column Order', () => {
    it('should render col with order', () => {
      const doc = parse(`
        page {
          row {
            col order=2 { text "Second" }
            col order=1 { text "First" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('order: 2');
      expect(result.html).toContain('order: 1');
    });
  });

  describe('Size Properties', () => {
    it('should render col with numeric width', () => {
      const doc = parse(`
        page {
          row {
            col w=200 { text "Fixed Width" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('width: 200px');
    });

    it('should render col with full width class', () => {
      const doc = parse(`
        page {
          row {
            col w=full { text "Full Width" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-w-full');
    });

    it('should render col with auto width class', () => {
      const doc = parse(`
        page {
          row {
            col w=auto { text "Auto Width" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-w-auto');
    });

    it('should render element with height', () => {
      const doc = parse(`
        page {
          row {
            col h=100 { text "Fixed Height" }
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('height: 100px');
    });
  });
});

describe('Layout Overflow Prevention', () => {
  it('should include flex-shrink: 0 for header to prevent shrinking', () => {
    const doc = parse('page { header { text "Logo" } }');
    const result = render(doc);

    expect(result.css).toContain('.wf-header');
    expect(result.css).toMatch(/\.wf-header\s*\{[^}]*flex-shrink:\s*0/);
  });

  it('should include background and z-index on header/footer to paint over overflow', () => {
    const doc = parse('page { header { text "Logo" } main { text "Content" } footer { text "Footer" } }');
    const result = render(doc);

    // Header and footer should have background + position: relative + z-index to paint over main overflow
    expect(result.css).toMatch(/\.wf-header\s*\{[^}]*background:\s*var\(--wf-bg\)/);
    expect(result.css).toMatch(/\.wf-header\s*\{[^}]*z-index:\s*1/);
    expect(result.css).toMatch(/\.wf-footer\s*\{[^}]*background:\s*var\(--wf-bg\)/);
    expect(result.css).toMatch(/\.wf-footer\s*\{[^}]*z-index:\s*1/);
    // Main should NOT have overflow: hidden (allows overlay components to render)
    expect(result.css).not.toMatch(/\.wf-main\s*\{[^}]*overflow:\s*hidden/);
  });

  it('should include flex-shrink: 0 for footer to prevent shrinking', () => {
    const doc = parse('page { footer { text "Footer" } }');
    const result = render(doc);

    expect(result.css).toContain('.wf-footer');
    expect(result.css).toMatch(/\.wf-footer\s*\{[^}]*flex-shrink:\s*0/);
  });

  it('should override main overflow with scroll when scroll attribute is set', () => {
    const doc = parse('page { main scroll { text "Scrollable" } }');
    const result = render(doc);

    // scroll class should add overflow-y: auto
    expect(result.css).toMatch(/\.wf-main\.wf-scroll\s*\{[^}]*overflow-y:\s*auto/);
    expect(result.html).toContain('wf-scroll');
  });
});

describe('CSS Grid Classes Generation', () => {
  it('should generate all 12 column classes', () => {
    const doc = parse('page { }');
    const result = render(doc);

    for (let i = 1; i <= 12; i++) {
      expect(result.css).toContain(`.wf-col-${i}`);
    }
  });

  // Note: Responsive breakpoints intentionally not implemented
  // Wireframes use fixed layouts with scale mode for preview
  it('should NOT generate responsive column classes (fixed layout design)', () => {
    const doc = parse('page { }');
    const result = render(doc);

    // Responsive classes should not exist
    expect(result.css).not.toContain('.wf-col-sm-');
    expect(result.css).not.toContain('@media (min-width:');
  });

  it('should generate flex utility classes', () => {
    const doc = parse('page { }');
    const result = render(doc);

    expect(result.css).toContain('.wf-flex');
    expect(result.css).toContain('.wf-flex-row');
    expect(result.css).toContain('.wf-flex-col');
    expect(result.css).toContain('.wf-justify-center');
    expect(result.css).toContain('.wf-justify-between');
    expect(result.css).toContain('.wf-align-center');
  });

  it('should generate spacing utility classes', () => {
    const doc = parse('page { }');
    const result = render(doc);

    expect(result.css).toContain('.wf-p-');
    expect(result.css).toContain('.wf-m-');
    expect(result.css).toContain('.wf-pt-');
    expect(result.css).toContain('.wf-mx-auto');
  });

  it('should generate gap utility classes', () => {
    const doc = parse('page { }');
    const result = render(doc);

    expect(result.css).toContain('.wf-gap-');
  });
});
