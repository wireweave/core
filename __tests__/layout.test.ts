/**
 * Layout Grammar Tests for wireweave
 *
 * Tests 12-column grid, Flexbox, spacing, and size systems
 * Note: Responsive breakpoints (sm, md, lg, xl) are excluded from v1.0
 */

import { describe, it, expect } from 'vitest';
// @ts-expect-error - generated parser has no types
import { parse } from '../src/parser/generated-parser.js';

describe('Layout Grammar', () => {
  describe('12-Column Grid System', () => {
    it('should parse col with span attribute', () => {
      const result = parse('page { row { col span=4 { } col span=8 { } } }');
      const row = result.children[0].children[0];
      expect(row.type).toBe('Row');
      expect(row.children).toHaveLength(2);
      expect(row.children[0].type).toBe('Col');
      expect(row.children[0].span).toBe(4);
      expect(row.children[1].span).toBe(8);
    });

    it('should parse col without span (defaults to auto)', () => {
      const result = parse('page { row { col { text "Auto width" } } }');
      const col = result.children[0].children[0].children[0];
      expect(col.type).toBe('Col');
      expect(col.span).toBeUndefined();
    });

    it('should parse nested row/col layout', () => {
      const result = parse(`
        page {
          row {
            col span=6 {
              row {
                col span=12 { text "Nested full width" }
              }
            }
            col span=6 {
              text "Right half"
            }
          }
        }
      `);
      const outerRow = result.children[0].children[0];
      expect(outerRow.children).toHaveLength(2);
      const nestedRow = outerRow.children[0].children[0];
      expect(nestedRow.type).toBe('Row');
    });

    it('should parse 3-column equal layout', () => {
      const result = parse(`
        page {
          row {
            col span=4 { text "Column 1" }
            col span=4 { text "Column 2" }
            col span=4 { text "Column 3" }
          }
        }
      `);
      const row = result.children[0].children[0];
      expect(row.children).toHaveLength(3);
      expect(row.children[0].span).toBe(4);
      expect(row.children[1].span).toBe(4);
      expect(row.children[2].span).toBe(4);
    });

    it('should parse sidebar + main layout', () => {
      const result = parse(`
        page {
          row {
            sidebar span=3 { nav ["Home", "About"] }
            main span=9 { text "Content" }
          }
        }
      `);
      const row = result.children[0].children[0];
      expect(row.children[0].type).toBe('Sidebar');
      expect(row.children[0].span).toBe(3);
      expect(row.children[1].type).toBe('Main');
      expect(row.children[1].span).toBe(9);
    });
  });

  describe('Flexbox Attributes', () => {
    it('should parse flex boolean attribute', () => {
      const result = parse('page { row flex { } }');
      const row = result.children[0].children[0];
      expect(row.flex).toBe(true);
    });

    it('should parse justify attribute', () => {
      const result = parse('page { row flex justify=between { } }');
      const row = result.children[0].children[0];
      expect(row.justify).toBe('between');
    });

    it('should parse all justify values', () => {
      const justifyValues = ['start', 'end', 'center', 'between', 'around', 'evenly'];
      for (const value of justifyValues) {
        const result = parse(`page { row flex justify=${value} { } }`);
        expect(result.children[0].children[0].justify).toBe(value);
      }
    });

    it('should parse align attribute', () => {
      const result = parse('page { row flex align=center { } }');
      const row = result.children[0].children[0];
      expect(row.align).toBe('center');
    });

    it('should parse all align values', () => {
      const alignValues = ['start', 'end', 'center', 'baseline', 'stretch'];
      for (const value of alignValues) {
        const result = parse(`page { row flex align=${value} { } }`);
        expect(result.children[0].children[0].align).toBe(value);
      }
    });

    it('should parse direction attribute', () => {
      const result = parse('page { row flex direction=column { } }');
      const row = result.children[0].children[0];
      expect(row.direction).toBe('column');
    });

    it('should parse all direction values', () => {
      const directionValues = ['row', 'column', 'row-reverse', 'column-reverse'];
      for (const value of directionValues) {
        const result = parse(`page { row flex direction=${value} { } }`);
        expect(result.children[0].children[0].direction).toBe(value);
      }
    });

    it('should parse wrap attribute', () => {
      const result = parse('page { row flex wrap { } }');
      const row = result.children[0].children[0];
      expect(row.wrap).toBe(true);
    });

    it('should parse wrap=nowrap', () => {
      const result = parse('page { row flex wrap=nowrap { } }');
      const row = result.children[0].children[0];
      expect(row.wrap).toBe('nowrap');
    });

    it('should parse gap attribute', () => {
      const result = parse('page { row flex gap=4 { } }');
      const row = result.children[0].children[0];
      expect(row.gap).toBe(4);
    });

    it('should parse combined flex attributes', () => {
      const result = parse('page { row flex justify=between align=center gap=4 { } }');
      const row = result.children[0].children[0];
      expect(row.flex).toBe(true);
      expect(row.justify).toBe('between');
      expect(row.align).toBe('center');
      expect(row.gap).toBe(4);
    });

    it('should parse flex on col elements', () => {
      const result = parse('page { row { col flex direction=column justify=center { } } }');
      const col = result.children[0].children[0].children[0];
      expect(col.flex).toBe(true);
      expect(col.direction).toBe('column');
      expect(col.justify).toBe('center');
    });
  });

  describe('Spacing System', () => {
    describe('Padding', () => {
      it('should parse p (all sides padding)', () => {
        const result = parse('page { card p=4 { } }');
        expect(result.children[0].children[0].p).toBe(4);
      });

      it('should parse px (horizontal padding)', () => {
        const result = parse('page { card px=4 { } }');
        expect(result.children[0].children[0].px).toBe(4);
      });

      it('should parse py (vertical padding)', () => {
        const result = parse('page { card py=4 { } }');
        expect(result.children[0].children[0].py).toBe(4);
      });

      it('should parse pt (top padding)', () => {
        const result = parse('page { card pt=4 { } }');
        expect(result.children[0].children[0].pt).toBe(4);
      });

      it('should parse pr (right padding)', () => {
        const result = parse('page { card pr=4 { } }');
        expect(result.children[0].children[0].pr).toBe(4);
      });

      it('should parse pb (bottom padding)', () => {
        const result = parse('page { card pb=4 { } }');
        expect(result.children[0].children[0].pb).toBe(4);
      });

      it('should parse pl (left padding)', () => {
        const result = parse('page { card pl=4 { } }');
        expect(result.children[0].children[0].pl).toBe(4);
      });

      it('should parse combined padding attributes', () => {
        const result = parse('page { card px=4 py=2 { } }');
        const card = result.children[0].children[0];
        expect(card.px).toBe(4);
        expect(card.py).toBe(2);
      });
    });

    describe('Margin', () => {
      it('should parse m (all sides margin)', () => {
        const result = parse('page { card m=4 { } }');
        expect(result.children[0].children[0].m).toBe(4);
      });

      it('should parse mx (horizontal margin)', () => {
        const result = parse('page { card mx=auto { } }');
        expect(result.children[0].children[0].mx).toBe('auto');
      });

      it('should parse my (vertical margin)', () => {
        const result = parse('page { card my=4 { } }');
        expect(result.children[0].children[0].my).toBe(4);
      });

      it('should parse mt (top margin)', () => {
        const result = parse('page { card mt=4 { } }');
        expect(result.children[0].children[0].mt).toBe(4);
      });

      it('should parse mr (right margin)', () => {
        const result = parse('page { card mr=4 { } }');
        expect(result.children[0].children[0].mr).toBe(4);
      });

      it('should parse mb (bottom margin)', () => {
        const result = parse('page { card mb=4 { } }');
        expect(result.children[0].children[0].mb).toBe(4);
      });

      it('should parse ml (left margin)', () => {
        const result = parse('page { card ml=4 { } }');
        expect(result.children[0].children[0].ml).toBe(4);
      });

      it('should parse negative margin', () => {
        const result = parse('page { card mt=-2 { } }');
        expect(result.children[0].children[0].mt).toBe(-2);
      });
    });

    it('should parse combined spacing on multiple elements', () => {
      const result = parse('page { card p=4 m=2 { text "Content" mt=2 } }');
      const card = result.children[0].children[0];
      expect(card.p).toBe(4);
      expect(card.m).toBe(2);
      const text = card.children[0];
      expect(text.mt).toBe(2);
    });
  });

  describe('Size System', () => {
    describe('Width', () => {
      it('should parse w with number', () => {
        const result = parse('page { card w=400 { } }');
        expect(result.children[0].children[0].w).toBe(400);
      });

      it('should parse w=full', () => {
        const result = parse('page { card w=full { } }');
        expect(result.children[0].children[0].w).toBe('full');
      });

      it('should parse w=auto', () => {
        const result = parse('page { card w=auto { } }');
        expect(result.children[0].children[0].w).toBe('auto');
      });

      it('should parse w=screen', () => {
        const result = parse('page { card w=screen { } }');
        expect(result.children[0].children[0].w).toBe('screen');
      });

      it('should parse w=fit', () => {
        const result = parse('page { card w=fit { } }');
        expect(result.children[0].children[0].w).toBe('fit');
      });
    });

    describe('Height', () => {
      it('should parse h with number', () => {
        const result = parse('page { card h=300 { } }');
        expect(result.children[0].children[0].h).toBe(300);
      });

      it('should parse h=full', () => {
        const result = parse('page { card h=full { } }');
        expect(result.children[0].children[0].h).toBe('full');
      });

      it('should parse h=auto', () => {
        const result = parse('page { card h=auto { } }');
        expect(result.children[0].children[0].h).toBe('auto');
      });

      it('should parse h=screen', () => {
        const result = parse('page { card h=screen { } }');
        expect(result.children[0].children[0].h).toBe('screen');
      });
    });

    it('should parse combined width and height', () => {
      const result = parse('page { card w=full h=auto { } }');
      const card = result.children[0].children[0];
      expect(card.w).toBe('full');
      expect(card.h).toBe('auto');
    });
  });

  describe('Complex Layout Examples', () => {
    it('should parse responsive card layout', () => {
      const result = parse(`
        page {
          row flex wrap gap=4 {
            col span=4 {
              card p=4 {
                title "Card 1" level=3
                text "Content"
              }
            }
            col span=4 {
              card p=4 {
                title "Card 2" level=3
                text "Content"
              }
            }
            col span=4 {
              card p=4 {
                title "Card 3" level=3
                text "Content"
              }
            }
          }
        }
      `);
      const row = result.children[0].children[0];
      expect(row.flex).toBe(true);
      expect(row.wrap).toBe(true);
      expect(row.gap).toBe(4);
      expect(row.children).toHaveLength(3);
    });

    it('should parse centered card layout', () => {
      const result = parse(`
        page {
          main flex justify=center align=center h=screen {
            card w=400 p=6 {
              title "Login" level=2
              input "Email" type=email
              input "Password" type=password
              button "Sign In" w=full mt=4
            }
          }
        }
      `);
      const main = result.children[0].children[0];
      expect(main.type).toBe('Main');
      expect(main.flex).toBe(true);
      expect(main.justify).toBe('center');
      expect(main.align).toBe('center');
      expect(main.h).toBe('screen');
      const card = main.children[0];
      expect(card.w).toBe(400);
      expect(card.p).toBe(6);
    });

    it('should parse dashboard layout with sidebar', () => {
      const result = parse(`
        page "Dashboard" {
          row h=screen {
            sidebar w=250 p=4 {
              title "Menu" level=3
              nav ["Home", "Settings", "Profile"] vertical
            }
            main flex=1 p=4 {
              row gap=4 mb=4 {
                col span=3 { card p=4 { text "Stats 1" } }
                col span=3 { card p=4 { text "Stats 2" } }
                col span=3 { card p=4 { text "Stats 3" } }
                col span=3 { card p=4 { text "Stats 4" } }
              }
              card p=4 {
                title "Main Content" level=2
                table {
                  columns ["Name", "Status", "Action"]
                  row ["Item 1", "Active", "Edit"]
                  row ["Item 2", "Pending", "Edit"]
                }
              }
            }
          }
        }
      `);
      expect(result.children[0].title).toBe('Dashboard');
      const row = result.children[0].children[0];
      expect(row.h).toBe('screen');
      const sidebar = row.children[0];
      expect(sidebar.type).toBe('Sidebar');
      expect(sidebar.w).toBe(250);
    });

    it('should parse header-main-footer layout', () => {
      const result = parse(`
        page {
          col h=screen {
            header p=4 {
              row flex justify=between align=center {
                title "Logo" level=1
                nav ["Home", "About", "Contact"]
              }
            }
            main flex=1 p=4 {
              text "Main content area"
            }
            footer p=4 {
              text "© 2024 Company"
            }
          }
        }
      `);
      const col = result.children[0].children[0];
      expect(col.h).toBe('screen');
      expect(col.children).toHaveLength(3);
      expect(col.children[0].type).toBe('Header');
      expect(col.children[1].type).toBe('Main');
      expect(col.children[2].type).toBe('Footer');
    });
  });
});
