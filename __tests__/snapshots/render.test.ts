/**
 * Snapshot tests for HTML and SVG rendering
 */

import { describe, it, expect } from 'vitest';
import { parse, render, renderToSvg, renderToHtml } from '../../src';

describe('Render Snapshots', () => {
  describe('HTML Snapshots', () => {
    it('should render empty page', () => {
      const doc = parse('page { }');
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render page with title', () => {
      const doc = parse('page "Home" { }');
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render basic layout', () => {
      const doc = parse(`
        page {
          header { title "Header" }
          main { text "Content" }
          footer { text "Footer" }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render grid layout', () => {
      const doc = parse(`
        page {
          row {
            col span=4 { text "Column 1" }
            col span=4 { text "Column 2" }
            col span=4 { text "Column 3" }
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render card with content', () => {
      const doc = parse(`
        page {
          card p=4 {
            title "Card Title" level=2
            text "Card content goes here"
            button "Action" primary
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render form elements', () => {
      const doc = parse(`
        page {
          card p=4 {
            row { input "Email" type=email placeholder="Enter email" required }
            row { input "Password" type=password required }
            row { checkbox "Remember me" }
            button "Submit" primary
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render navigation', () => {
      const doc = parse(`
        page {
          nav ["Home", "About", "Contact"] vertical
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render table', () => {
      const doc = parse(`
        page {
          table {
            columns ["Name", "Email", "Role"]
            row ["Alice", "alice@example.com", "Admin"]
            row ["Bob", "bob@example.com", "User"]
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render feedback components', () => {
      const doc = parse(`
        page {
          alert "Success message" variant=success
          progress value=75 max=100
          spinner
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render modal', () => {
      const doc = parse(`
        page {
          modal "Confirm Action" {
            text "Are you sure you want to proceed?"
            row justify=end gap=2 {
              button "Cancel"
              button "Confirm" primary
            }
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    // Note: Responsive breakpoints intentionally not implemented
    // Wireframes use fixed layouts with scale mode for preview
    it('should render fixed layout (no responsive classes)', () => {
      const doc = parse(`
        page {
          row {
            col span=6 { card { text "Item" } }
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });
  });

  describe('CSS Snapshots', () => {
    it('should generate light theme CSS', () => {
      const doc = parse('page { }');
      const { css } = render(doc, { theme: 'light' });
      expect(css).toMatchSnapshot();
    });

    it('should generate dark theme CSS', () => {
      const doc = parse('page { }');
      const { css } = render(doc, { theme: 'dark' });
      expect(css).toMatchSnapshot();
    });

    // Note: Responsive breakpoints intentionally not implemented
    it('should NOT include responsive breakpoints (fixed layout design)', () => {
      const doc = parse('page { row { col span=6 { } } }');
      const { css } = render(doc);
      expect(css).not.toContain('@media (min-width: 576px)');
      expect(css).not.toContain('@media (min-width: 768px)');
    });
  });

  describe('Full HTML Document Snapshots', () => {
    it('should render complete HTML document', () => {
      const doc = parse('page "Test" { text "Hello" }');
      const html = renderToHtml(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render complete HTML with dark theme', () => {
      const doc = parse('page "Dark" { card { text "Dark mode" } }');
      const html = renderToHtml(doc, { theme: 'dark' });
      expect(html).toMatchSnapshot();
    });
  });

  describe('SVG Snapshots', () => {
    it('should render simple text to SVG', () => {
      const doc = parse('page { text "Hello World" }');
      const { svg } = renderToSvg(doc);
      expect(svg).toMatchSnapshot();
    });

    it('should render card to SVG', () => {
      const doc = parse(`
        page {
          card {
            title "Card Title"
            text "Card content"
          }
        }
      `);
      const { svg } = renderToSvg(doc);
      expect(svg).toMatchSnapshot();
    });

    it('should render layout to SVG', () => {
      const doc = parse(`
        page {
          header { title "Header" }
          main { text "Content" }
          footer { text "Footer" }
        }
      `);
      const { svg } = renderToSvg(doc);
      expect(svg).toMatchSnapshot();
    });

    it('should render buttons to SVG', () => {
      const doc = parse(`
        page {
          row {
            button "Primary" primary
          }
        }
      `);
      const { svg } = renderToSvg(doc);
      expect(svg).toMatchSnapshot();
    });

    it('should render form to SVG', () => {
      const doc = parse(`
        page {
          card {
            input "Name" placeholder="Enter name"
            button "Submit" primary
          }
        }
      `);
      const { svg } = renderToSvg(doc);
      expect(svg).toMatchSnapshot();
    });

    it('should respect width option', () => {
      const doc = parse('page { text "Test" }');
      const { svg, width } = renderToSvg(doc, { width: 800 });
      expect(width).toBe(800);
      expect(svg).toContain('width="800"');
    });

    it('should respect padding option', () => {
      const doc = parse('page { text "Test" }');
      const { svg } = renderToSvg(doc, { padding: 40 });
      expect(svg).toMatchSnapshot();
    });
  });

  describe('Complex Page Snapshots', () => {
    it('should render login page', () => {
      const doc = parse(`
        page "Login" {
          main p=8 {
            row justify=center {
              col span=4 {
                card p=6 {
                  title "Sign In" level=2 mb=6
                  input "Email" type=email required mb=4
                  input "Password" type=password required mb=4
                  button "Sign In" primary
                }
              }
            }
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });

    it('should render dashboard page', () => {
      const doc = parse(`
        page "Dashboard" {
          header p=4 {
            row justify=between align=center {
              title "Dashboard" level=1
              avatar "JD"
            }
          }
          row {
            sidebar span=3 p=4 {
              nav ["Overview", "Analytics"] vertical
            }
            main span=9 p=4 {
              row gap=4 {
                col span=6 {
                  card { title "Users" text "1,234" }
                }
                col span=6 {
                  card { title "Revenue" text "$5,678" }
                }
              }
            }
          }
        }
      `);
      const { html } = render(doc);
      expect(html).toMatchSnapshot();
    });
  });
});
