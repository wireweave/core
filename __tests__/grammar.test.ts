/**
 * Grammar Tests for wireweave
 *
 * Tests core parsing functionality
 */

import { describe, it, expect } from 'vitest';
// @ts-expect-error - generated parser has no types
import { parse } from '../src/parser/generated-parser.js';

describe('wireweave Grammar', () => {
  describe('Basic Structure', () => {
    it('should parse empty page', () => {
      const result = parse('page { }');
      expect(result.type).toBe('Document');
      expect(result.children).toHaveLength(1);
      expect(result.children[0].type).toBe('Page');
      expect(result.children[0].title).toBeNull();
      expect(result.children[0].children).toHaveLength(0);
    });

    it('should parse page with title', () => {
      const result = parse('page "My Page" { }');
      expect(result.children[0].type).toBe('Page');
      expect(result.children[0].title).toBe('My Page');
    });

    it('should parse page with single-quoted title', () => {
      const result = parse("page 'My Page' { }");
      expect(result.children[0].title).toBe('My Page');
    });

    it('should include location info', () => {
      const result = parse('page { }');
      expect(result.loc).toBeDefined();
      expect(result.loc.start).toBeDefined();
      expect(result.loc.end).toBeDefined();
    });
  });

  describe('Comments', () => {
    it('should handle line comments', () => {
      const result = parse(`
        // This is a comment
        page {
          // Another comment
        }
      `);
      expect(result.children).toHaveLength(1);
      expect(result.children[0].type).toBe('Page');
    });

    it('should handle block comments', () => {
      const result = parse(`
        /* Block comment */
        page {
          /* Multi-line
             comment */
        }
      `);
      expect(result.children).toHaveLength(1);
    });
  });

  describe('Attributes', () => {
    it('should parse boolean attributes', () => {
      const result = parse('page { row flex { } }');
      const row = result.children[0].children[0];
      expect(row.flex).toBe(true);
    });

    it('should parse key-value attributes', () => {
      const result = parse('page { row gap=4 { } }');
      const row = result.children[0].children[0];
      expect(row.gap).toBe(4);
    });

    it('should parse string attributes', () => {
      const result = parse('page { input placeholder="Enter text" }');
      const input = result.children[0].children[0];
      expect(input.placeholder).toBe('Enter text');
    });

    it('should parse multiple attributes', () => {
      const result = parse('page { row flex justify=between align=center gap=4 { } }');
      const row = result.children[0].children[0];
      expect(row.flex).toBe(true);
      expect(row.justify).toBe('between');
      expect(row.align).toBe('center');
      expect(row.gap).toBe(4);
    });

    it('should parse identifier values', () => {
      const result = parse('page { button "Click" variant=primary }');
      const button = result.children[0].children[0];
      expect(button.variant).toBe('primary');
    });
  });

  describe('Layout Elements', () => {
    it('should parse header', () => {
      const result = parse('page { header { } }');
      expect(result.children[0].children[0].type).toBe('Header');
    });

    it('should parse main', () => {
      const result = parse('page { main { } }');
      expect(result.children[0].children[0].type).toBe('Main');
    });

    it('should parse footer', () => {
      const result = parse('page { footer { } }');
      expect(result.children[0].children[0].type).toBe('Footer');
    });

    it('should parse sidebar', () => {
      const result = parse('page { sidebar { } }');
      expect(result.children[0].children[0].type).toBe('Sidebar');
    });

    it('should parse row with children', () => {
      const result = parse(`
        page {
          row {
            col { text "Column 1" }
            col { text "Column 2" }
          }
        }
      `);
      const row = result.children[0].children[0];
      expect(row.type).toBe('Row');
      expect(row.children).toHaveLength(2);
      expect(row.children[0].type).toBe('Col');
      expect(row.children[1].type).toBe('Col');
    });

    it('should parse col with span attribute', () => {
      const result = parse('page { row { col span=6 { } } }');
      const col = result.children[0].children[0].children[0];
      expect(col.type).toBe('Col');
      expect(col.span).toBe(6);
    });
  });

  describe('Container Elements', () => {
    it('should parse card with title', () => {
      const result = parse('page { card "My Card" p=4 { } }');
      const card = result.children[0].children[0];
      expect(card.type).toBe('Card');
      expect(card.title).toBe('My Card');
      expect(card.p).toBe(4);
    });

    it('should parse modal', () => {
      const result = parse('page { modal "Confirm" { text "Are you sure?" } }');
      const modal = result.children[0].children[0];
      expect(modal.type).toBe('Modal');
      expect(modal.title).toBe('Confirm');
      expect(modal.children).toHaveLength(1);
    });

    it('should parse drawer', () => {
      const result = parse('page { drawer "Menu" position=left { } }');
      const drawer = result.children[0].children[0];
      expect(drawer.type).toBe('Drawer');
      expect(drawer.title).toBe('Menu');
      expect(drawer.position).toBe('left');
    });

    it('should parse accordion', () => {
      const result = parse('page { accordion { section "Section 1" { } } }');
      const accordion = result.children[0].children[0];
      expect(accordion.type).toBe('Accordion');
    });
  });

  describe('UI Elements', () => {
    it('should parse text', () => {
      const result = parse('page { text "Hello World" }');
      const text = result.children[0].children[0];
      expect(text.type).toBe('Text');
      expect(text.content).toBe('Hello World');
    });

    it('should parse title with level', () => {
      const result = parse('page { title "Heading" level=2 }');
      const title = result.children[0].children[0];
      expect(title.type).toBe('Title');
      expect(title.content).toBe('Heading');
      expect(title.level).toBe(2);
    });

    it('should parse link', () => {
      const result = parse('page { link "Click here" href="https://example.com" }');
      const link = result.children[0].children[0];
      expect(link.type).toBe('Link');
      expect(link.content).toBe('Click here');
      expect(link.href).toBe('https://example.com');
    });

    it('should parse button with variant', () => {
      const result = parse('page { button "Submit" primary }');
      const button = result.children[0].children[0];
      expect(button.type).toBe('Button');
      expect(button.content).toBe('Submit');
      expect(button.primary).toBe(true);
    });

    it('should parse input', () => {
      const result = parse('page { input "Email" placeholder="user@example.com" type=email }');
      const input = result.children[0].children[0];
      expect(input.type).toBe('Input');
      expect(input.label).toBe('Email');
      expect(input.placeholder).toBe('user@example.com');
    });

    it('should parse checkbox', () => {
      const result = parse('page { checkbox "I agree" checked }');
      const checkbox = result.children[0].children[0];
      expect(checkbox.type).toBe('Checkbox');
      expect(checkbox.label).toBe('I agree');
      expect(checkbox.checked).toBe(true);
    });

    it('should parse select with options', () => {
      const result = parse('page { select "Country" ["USA", "Korea", "Japan"] }');
      const select = result.children[0].children[0];
      expect(select.type).toBe('Select');
      expect(select.label).toBe('Country');
      expect(select.options).toEqual(['USA', 'Korea', 'Japan']);
    });
  });

  describe('Arrays and Objects', () => {
    it('should parse array of strings', () => {
      const result = parse('page { nav ["Home", "About", "Contact"] }');
      const nav = result.children[0].children[0];
      expect(nav.items).toEqual(['Home', 'About', 'Contact']);
    });

    it('should parse array with objects', () => {
      const result = parse(`
        page {
          nav [
            { label="Home" active }
            { label="About" }
          ]
        }
      `);
      const nav = result.children[0].children[0];
      expect(nav.items).toHaveLength(2);
      expect(nav.items[0].label).toBe('Home');
      expect(nav.items[0].active).toBe(true);
      expect(nav.items[1].label).toBe('About');
    });

    it('should parse breadcrumb', () => {
      const result = parse('page { breadcrumb ["Home", "Products", "Phones"] }');
      const breadcrumb = result.children[0].children[0];
      expect(breadcrumb.type).toBe('Breadcrumb');
      expect(breadcrumb.items).toEqual(['Home', 'Products', 'Phones']);
    });
  });

  describe('Table', () => {
    it('should parse table with columns and rows', () => {
      const result = parse(`
        page {
          table {
            columns ["Name", "Email", "Status"]
            row ["John", "john@example.com", "Active"]
            row ["Jane", "jane@example.com", "Pending"]
          }
        }
      `);
      const table = result.children[0].children[0];
      expect(table.type).toBe('Table');
      expect(table.columns).toEqual(['Name', 'Email', 'Status']);
      expect(table.rows).toHaveLength(2);
    });
  });

  describe('Tabs', () => {
    it('should parse tabs with content', () => {
      const result = parse(`
        page {
          tabs {
            tab "Overview" active {
              text "Overview content"
            }
            tab "Details" {
              text "Details content"
            }
          }
        }
      `);
      const tabs = result.children[0].children[0];
      expect(tabs.type).toBe('Tabs');
      expect(tabs.children).toHaveLength(2);
      expect(tabs.children[0].label).toBe('Overview');
      expect(tabs.children[0].active).toBe(true);
    });
  });

  describe('Dropdown', () => {
    it('should parse dropdown with items', () => {
      const result = parse(`
        page {
          dropdown {
            item "Edit" icon=edit
            divider
            item "Delete" danger
          }
        }
      `);
      const dropdown = result.children[0].children[0];
      expect(dropdown.type).toBe('Dropdown');
      expect(dropdown.items).toHaveLength(3);
      expect(dropdown.items[0].label).toBe('Edit');
      expect(dropdown.items[1].type).toBe('divider');
      expect(dropdown.items[2].danger).toBe(true);
    });
  });

  describe('Feedback Components', () => {
    it('should parse alert', () => {
      const result = parse('page { alert "Success!" variant=success }');
      const alert = result.children[0].children[0];
      expect(alert.type).toBe('Alert');
      expect(alert.content).toBe('Success!');
      expect(alert.variant).toBe('success');
    });

    it('should parse progress', () => {
      const result = parse('page { progress value=75 }');
      const progress = result.children[0].children[0];
      expect(progress.type).toBe('Progress');
      expect(progress.value).toBe(75);
    });

    it('should parse spinner', () => {
      const result = parse('page { spinner size=lg }');
      const spinner = result.children[0].children[0];
      expect(spinner.type).toBe('Spinner');
      expect(spinner.size).toBe('lg');
    });
  });

  describe('Complex Examples', () => {
    it('should parse login page example', () => {
      const source = `
        page "Login" {
          main p=8 {
            card p=6 w=400 {
              title "Sign In" level=2
              input "Email" placeholder="user@example.com" type=email
              input "Password" type=password
              row flex justify=between align=center mt=4 {
                checkbox "Remember me"
                link "Forgot password?"
              }
              button "Sign In" primary w=full mt=4
            }
          }
        }
      `;
      const result = parse(source);
      expect(result.children[0].title).toBe('Login');
      const main = result.children[0].children[0];
      expect(main.type).toBe('Main');
      expect(main.p).toBe(8);
    });

    it('should parse dashboard layout', () => {
      const source = `
        page "Dashboard" {
          header p=4 {
            row flex justify=between align=center {
              title "Dashboard" level=1
              avatar "JD"
            }
          }
          row {
            sidebar span=2 {
              nav ["Home", "Settings"] vertical
            }
            main span=10 p=4 {
              row gap=4 {
                col span=6 { card { text "Card 1" } }
                col span=6 { card { text "Card 2" } }
              }
            }
          }
          footer p=4 {
            text "2024 Company Inc." align=center
          }
        }
      `;
      const result = parse(source);
      expect(result.children[0].title).toBe('Dashboard');
      expect(result.children[0].children).toHaveLength(3); // header, row, footer
    });
  });

  describe('Numbers', () => {
    it('should parse integer numbers', () => {
      const result = parse('page { progress value=75 }');
      expect(result.children[0].children[0].value).toBe(75);
    });

    it('should parse decimal numbers', () => {
      const result = parse('page { slider value=0.5 }');
      expect(result.children[0].children[0].value).toBe(0.5);
    });

    it('should parse negative numbers', () => {
      const result = parse('page { text "test" mt=-2 }');
      expect(result.children[0].children[0].mt).toBe(-2);
    });
  });

  describe('Escape Sequences', () => {
    it('should handle escaped quotes', () => {
      const result = parse('page { text "Say \\"Hello\\"" }');
      expect(result.children[0].children[0].content).toBe('Say "Hello"');
    });

    it('should handle newlines in strings', () => {
      const result = parse('page { text "Line 1\\nLine 2" }');
      expect(result.children[0].children[0].content).toBe('Line 1\nLine 2');
    });
  });
});
