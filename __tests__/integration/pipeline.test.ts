/**
 * Integration tests for the full wireframe pipeline
 */

import { describe, it, expect } from 'vitest';
import { parse, render, renderToSvg } from '../../src';

describe('Pipeline Integration', () => {
  describe('Full Pipeline', () => {
    it('should process complete dashboard wireframe', () => {
      const source = `
        page "Dashboard" {
          header p=4 {
            row justify=between align=center {
              title "MyApp" level=1
              avatar "JD"
            }
          }

          row {
            sidebar span=3 p=4 {
              nav ["Overview", "Analytics", "Reports"] vertical
            }

            main span=9 p=6 {
              row gap=4 mb=6 {
                col span=4 {
                  card p=4 {
                    text "Total Users" muted
                    title "12,345"
                  }
                }
                col span=4 {
                  card p=4 {
                    text "Revenue" muted
                    title "$45,678"
                  }
                }
                col span=4 {
                  card p=4 {
                    text "Orders" muted
                    title "1,234"
                  }
                }
              }

              card p=4 {
                title "Recent Orders" level=2 mb=4
                table {
                  columns ["Order ID", "Customer", "Amount", "Status"]
                  row ["#001", "Alice", "$100", "Shipped"]
                  row ["#002", "Bob", "$200", "Pending"]
                }
              }
            }
          }

          footer p=4 {
            text "© 2025 MyApp" muted
          }
        }
      `;

      // Parse
      const doc = parse(source);
      expect(doc.children).toHaveLength(1);
      expect(doc.children[0].type).toBe('Page');
      expect(doc.children[0].title).toBe('Dashboard');

      // Render HTML
      const { html, css } = render(doc);
      expect(html).toContain('class="wf-page"');
      expect(html).toContain('Dashboard');
      expect(css).toContain('--wf-primary');

      // Render SVG
      const { svg, width, height } = renderToSvg(doc);
      expect(svg).toContain('<svg');
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it('should process login form wireframe', () => {
      const source = `
        page "Login" {
          main p=8 {
            row justify=center {
              col span=4 {
                card p=6 {
                  title "Sign In" level=2 mb=6

                  input "Email" placeholder="user@example.com" type=email required mb=4
                  input "Password" type=password required mb=4

                  row justify=between align=center mb=4 {
                    checkbox "Remember me"
                    link "Forgot password?" href="/forgot"
                  }

                  button "Sign In" primary mb=4

                  row justify=center {
                    text "Don't have an account?"
                    link "Sign up" href="/signup"
                  }
                }
              }
            }
          }
        }
      `;

      const doc = parse(source);
      const { html } = render(doc);

      expect(html).toContain('type="email"');
      expect(html).toContain('type="password"');
      expect(html).toContain('wf-button-primary');
    });

    it('should process e-commerce product page', () => {
      const source = `
        page "Product" {
          header p=4 {
            row justify=between {
              title "Shop" level=1
              row gap=4 {
                input placeholder="Search..." type=search
                button "Cart"
              }
            }
          }

          main p=6 {
            row gap=6 {
              col span=6 {
                image alt="Product" w=400 h=300
              }
              col span=6 {
                badge "New" variant=success mb=2
                title "Product Name" level=2 mb=2
                text "$99.99" mb=4
                text "Product description goes here..." muted mb=4

                row gap=4 mb=4 {
                  select "Size" ["S", "M", "L", "XL"]
                  select "Color" ["Black", "White", "Blue"]
                }

                row gap=4 {
                  col { button "Add to Cart" primary }
                  col { button "Buy Now" secondary }
                }
              }
            }
          }
        }
      `;

      const doc = parse(source);
      const { html } = render(doc);

      expect(html).toContain('wf-badge');
      expect(html).toContain('wf-col-6');
      expect(html).toContain('wf-button-primary');
      expect(html).toContain('wf-button-secondary');
    });

    it('should process settings page with forms', () => {
      const source = `
        page "Settings" {
          main p=6 {
            title "Account Settings" level=1 mb=6

            card p=4 mb=4 {
              title "Profile" level=3 mb=4
              row gap=4 {
                col span=6 {
                  input "First Name" placeholder="John"
                }
                col span=6 {
                  input "Last Name" placeholder="Doe"
                }
              }
              input "Email" type=email placeholder="john@example.com" mb=4
              textarea "Bio" placeholder="Tell us about yourself" rows=4 mb=4
              button "Save Changes" primary
            }

            card p=4 mb=4 {
              title "Preferences" level=3 mb=4
              row { switch "Dark mode" }
              row { switch "Email notifications" checked }
              row { slider "Volume" min=0 max=100 value=50 }
            }

            card p=4 {
              title "Danger Zone" level=3 mb=4
              alert "This action cannot be undone" variant=danger
              button "Delete Account" danger
            }
          }
        }
      `;

      const doc = parse(source);
      const { html } = render(doc);

      expect(html).toContain('wf-card');
      expect(html).toContain('wf-input');
      expect(html).toContain('wf-switch');
      expect(html).toContain('wf-slider');
      expect(html).toContain('wf-alert');
      expect(html).toContain('wf-button-danger');
    });
  });

  describe('Theme Integration', () => {
    it('should render with dark theme', () => {
      const source = 'page { card { text "Dark Mode" } }';
      const doc = parse(source);
      const { css } = render(doc, { theme: 'dark' });

      // Dark theme uses CSS variables
      expect(css).toContain('--wf-bg');
      expect(css).toContain('--wf-fg');
    });

    it('should render with light theme', () => {
      const source = 'page { card { text "Light Mode" } }';
      const doc = parse(source);
      const { css } = render(doc, { theme: 'light' });

      // Light theme uses CSS variables
      expect(css).toContain('--wf-bg');
      expect(css).toContain('--wf-fg');
    });
  });

  // Note: Responsive breakpoints intentionally not implemented
  // Wireframes use fixed layouts with scale mode for preview
  describe('Fixed Layout (No Responsive)', () => {
    it('should NOT generate responsive CSS', () => {
      const source = `
        page {
          row {
            col span=6 {
              card { text "Item" }
            }
          }
        }
      `;

      const doc = parse(source);
      const { html, css } = render(doc);

      expect(html).toContain('wf-col-6');
      // Responsive classes should not exist
      expect(html).not.toContain('wf-col-sm-');
      expect(css).not.toContain('@media (min-width: 576px)');
      expect(css).not.toContain('@media (min-width: 768px)');
    });

    it('should handle flex layout', () => {
      const source = `
        page {
          row flex justify=between align=center gap=4 {
            button "Left"
            button "Right"
          }
        }
      `;

      const doc = parse(source);
      const { html } = render(doc);

      expect(html).toContain('wf-row');
      expect(html).toContain('wf-button');
    });
  });

  describe('Component Nesting', () => {
    it('should handle deeply nested components', () => {
      const source = `
        page {
          card {
            accordion "Section 1" {
              card {
                row {
                  col span=6 {
                    text "Nested content"
                  }
                  col span=6 {
                    button "Action"
                  }
                }
              }
            }
          }
        }
      `;

      const doc = parse(source);
      const { html } = render(doc);

      expect(html).toContain('wf-card');
      expect(html).toContain('wf-accordion');
      expect(html).toContain('wf-row');
      expect(html).toContain('wf-col-6');
    });

    it('should handle modal with form', () => {
      const source = `
        page {
          modal "Edit Profile" {
            input "Name" placeholder="Enter name" mb=4
            input "Email" type=email mb=4
            row justify=end gap=2 {
              button "Cancel"
              button "Save" primary
            }
          }
        }
      `;

      const doc = parse(source);
      const { html } = render(doc);

      expect(html).toContain('wf-modal');
      expect(html).toContain('wf-input');
      expect(html).toContain('wf-button-primary');
    });
  });

  describe('SVG Export', () => {
    it('should export complex page to SVG', () => {
      const source = `
        page "SVG Test" {
          header {
            title "Header"
          }
          main {
            card {
              text "Card content"
              button "Click me" primary
            }
          }
          footer {
            text "Footer"
          }
        }
      `;

      const doc = parse(source);
      const { svg, width, height } = renderToSvg(doc);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Header');
      expect(svg).toContain('Footer');
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it('should respect SVG options', () => {
      const source = 'page { text "Test" }';
      const doc = parse(source);

      const { svg, width, height } = renderToSvg(doc, {
        width: 800,
        padding: 20,
      });

      expect(width).toBe(800);
      expect(height).toBeGreaterThan(0);
      expect(svg).toContain('width="800"');
    });
  });
});
