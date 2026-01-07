/**
 * Component Grammar Tests for wireweave
 *
 * Tests all UI components and their attributes per grammar-spec.md
 */

import { describe, it, expect } from 'vitest';
// @ts-expect-error - generated parser has no types
import { parse } from '../src/parser/generated-parser.js';

describe('Component Grammar', () => {
  // ===========================================
  // Container Components
  // ===========================================
  describe('Container Components', () => {
    describe('Card', () => {
      it('should parse card with title', () => {
        const result = parse('page { card "My Card" { } }');
        const card = result.children[0].children[0];
        expect(card.type).toBe('Card');
        expect(card.title).toBe('My Card');
      });

      it('should parse card with shadow attribute', () => {
        const result = parse('page { card shadow=lg { } }');
        const card = result.children[0].children[0];
        expect(card.shadow).toBe('lg');
      });

      it('should parse card with border attribute', () => {
        const result = parse('page { card border { } }');
        const card = result.children[0].children[0];
        expect(card.border).toBe(true);
      });

      it('should parse full card example', () => {
        const result = parse(`
          page {
            card "Card Title" p=4 shadow=md border {
              title "Header"
              text "Content"
              button "Action" primary
            }
          }
        `);
        const card = result.children[0].children[0];
        expect(card.title).toBe('Card Title');
        expect(card.p).toBe(4);
        expect(card.shadow).toBe('md');
        expect(card.border).toBe(true);
        expect(card.children).toHaveLength(3);
      });
    });

    describe('Modal', () => {
      it('should parse modal with title', () => {
        const result = parse('page { modal "Confirm Delete" { } }');
        const modal = result.children[0].children[0];
        expect(modal.type).toBe('Modal');
        expect(modal.title).toBe('Confirm Delete');
      });

      it('should parse modal with children', () => {
        const result = parse(`
          page {
            modal "Confirm Action" {
              text "Are you sure?"
              row flex justify=end gap=2 mt=4 {
                button "Cancel"
                button "Confirm" primary
              }
            }
          }
        `);
        const modal = result.children[0].children[0];
        expect(modal.children).toHaveLength(2);
      });
    });

    describe('Drawer', () => {
      it('should parse drawer with position', () => {
        const result = parse('page { drawer "Menu" position=left w=300 { } }');
        const drawer = result.children[0].children[0];
        expect(drawer.type).toBe('Drawer');
        expect(drawer.title).toBe('Menu');
        expect(drawer.position).toBe('left');
        expect(drawer.w).toBe(300);
      });

      it('should parse drawer with navigation', () => {
        const result = parse(`
          page {
            drawer "Navigation" position=right {
              nav ["Home", "Products", "About"] vertical
            }
          }
        `);
        const drawer = result.children[0].children[0];
        expect(drawer.position).toBe('right');
        expect(drawer.children).toHaveLength(1);
      });
    });

    describe('Accordion', () => {
      it('should parse accordion with sections', () => {
        const result = parse(`
          page {
            accordion {
              section "Section 1" expanded { text "Content 1" }
              section "Section 2" { text "Content 2" }
            }
          }
        `);
        const accordion = result.children[0].children[0];
        expect(accordion.type).toBe('Accordion');
        expect(accordion.children).toHaveLength(2);
        expect(accordion.children[0].title).toBe('Section 1');
        expect(accordion.children[0].expanded).toBe(true);
      });
    });

    describe('Section', () => {
      it('should parse section with title', () => {
        const result = parse('page { section "My Section" { text "Content" } }');
        const section = result.children[0].children[0];
        expect(section.type).toBe('Section');
        expect(section.title).toBe('My Section');
      });
    });
  });

  // ===========================================
  // Text Components
  // ===========================================
  describe('Text Components', () => {
    describe('Text', () => {
      it('should parse text with content', () => {
        const result = parse('page { text "Hello World" }');
        const text = result.children[0].children[0];
        expect(text.type).toBe('Text');
        expect(text.content).toBe('Hello World');
      });

      it('should parse text with size attribute', () => {
        // Sizes starting with number must be quoted
        const unquotedSizes = ['xs', 'sm', 'base', 'lg', 'xl'];
        for (const size of unquotedSizes) {
          const result = parse(`page { text "Test" size=${size} }`);
          expect(result.children[0].children[0].size).toBe(size);
        }
        // Sizes starting with number
        const quotedSizes = ['2xl', '3xl'];
        for (const size of quotedSizes) {
          const result = parse(`page { text "Test" size="${size}" }`);
          expect(result.children[0].children[0].size).toBe(size);
        }
      });

      it('should parse text with weight attribute', () => {
        const weights = ['normal', 'medium', 'semibold', 'bold'];
        for (const weight of weights) {
          const result = parse(`page { text "Test" weight=${weight} }`);
          expect(result.children[0].children[0].weight).toBe(weight);
        }
      });

      it('should parse text with muted attribute', () => {
        const result = parse('page { text "Hint text" muted }');
        expect(result.children[0].children[0].muted).toBe(true);
      });

      it('should parse text with align attribute', () => {
        const aligns = ['left', 'center', 'right', 'justify'];
        for (const align of aligns) {
          const result = parse(`page { text "Test" align=${align} }`);
          expect(result.children[0].children[0].align).toBe(align);
        }
      });
    });

    describe('Title', () => {
      it('should parse title with level', () => {
        for (let level = 1; level <= 6; level++) {
          const result = parse(`page { title "Heading" level=${level} }`);
          const title = result.children[0].children[0];
          expect(title.type).toBe('Title');
          expect(title.level).toBe(level);
        }
      });

      it('should parse title with size', () => {
        const result = parse('page { title "Big Title" size="2xl" }');
        expect(result.children[0].children[0].size).toBe('2xl');
      });
    });

    describe('Link', () => {
      it('should parse link with href', () => {
        const result = parse('page { link "Click here" href="https://example.com" }');
        const link = result.children[0].children[0];
        expect(link.type).toBe('Link');
        expect(link.content).toBe('Click here');
        expect(link.href).toBe('https://example.com');
      });

      it('should parse link with external attribute', () => {
        const result = parse('page { link "External" href="#" external }');
        expect(result.children[0].children[0].external).toBe(true);
      });
    });
  });

  // ===========================================
  // Input Components
  // ===========================================
  describe('Input Components', () => {
    describe('Input', () => {
      it('should parse input with label', () => {
        const result = parse('page { input "Email" }');
        const input = result.children[0].children[0];
        expect(input.type).toBe('Input');
        expect(input.label).toBe('Email');
      });

      it('should parse input types', () => {
        const types = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date'];
        for (const type of types) {
          const result = parse(`page { input "Field" type=${type} }`);
          expect(result.children[0].children[0].inputType).toBe(type);
        }
      });

      it('should parse input with placeholder', () => {
        const result = parse('page { input "Email" placeholder="user@example.com" }');
        expect(result.children[0].children[0].placeholder).toBe('user@example.com');
      });

      it('should parse input with required attribute', () => {
        const result = parse('page { input "Name" required }');
        expect(result.children[0].children[0].required).toBe(true);
      });

      it('should parse input with disabled attribute', () => {
        const result = parse('page { input "Name" disabled }');
        expect(result.children[0].children[0].disabled).toBe(true);
      });

      it('should parse input with value', () => {
        const result = parse('page { input "Name" value="John" }');
        expect(result.children[0].children[0].value).toBe('John');
      });

      it('should parse input with icon', () => {
        const result = parse('page { input "Search" type=search icon=search }');
        expect(result.children[0].children[0].icon).toBe('search');
      });
    });

    describe('Textarea', () => {
      it('should parse textarea with rows', () => {
        const result = parse('page { textarea "Message" rows=4 }');
        const textarea = result.children[0].children[0];
        expect(textarea.type).toBe('Textarea');
        expect(textarea.rows).toBe(4);
      });

      it('should parse textarea with placeholder', () => {
        const result = parse('page { textarea "Comments" placeholder="Enter comments..." }');
        expect(result.children[0].children[0].placeholder).toBe('Enter comments...');
      });
    });

    describe('Select', () => {
      it('should parse select with options', () => {
        const result = parse('page { select "Country" ["USA", "Korea", "Japan"] }');
        const select = result.children[0].children[0];
        expect(select.type).toBe('Select');
        expect(select.label).toBe('Country');
        expect(select.options).toEqual(['USA', 'Korea', 'Japan']);
      });

      it('should parse select with value', () => {
        const result = parse('page { select "Size" ["S", "M", "L"] value="M" }');
        expect(result.children[0].children[0].value).toBe('M');
      });

      it('should parse select with placeholder', () => {
        const result = parse('page { select "Category" ["A", "B", "C"] placeholder="Choose..." }');
        expect(result.children[0].children[0].placeholder).toBe('Choose...');
      });
    });

    describe('Checkbox', () => {
      it('should parse checkbox with label', () => {
        const result = parse('page { checkbox "I agree" }');
        const checkbox = result.children[0].children[0];
        expect(checkbox.type).toBe('Checkbox');
        expect(checkbox.label).toBe('I agree');
      });

      it('should parse checkbox with checked', () => {
        const result = parse('page { checkbox "Remember me" checked }');
        expect(result.children[0].children[0].checked).toBe(true);
      });

      it('should parse checkbox with disabled', () => {
        const result = parse('page { checkbox "Option" disabled }');
        expect(result.children[0].children[0].disabled).toBe(true);
      });
    });

    describe('Radio', () => {
      it('should parse radio with name group', () => {
        const result = parse('page { radio "Option A" name=choice checked }');
        const radio = result.children[0].children[0];
        expect(radio.type).toBe('Radio');
        expect(radio.label).toBe('Option A');
        expect(radio.name).toBe('choice');
        expect(radio.checked).toBe(true);
      });
    });

    describe('Switch', () => {
      it('should parse switch', () => {
        const result = parse('page { switch "Dark Mode" checked }');
        const sw = result.children[0].children[0];
        expect(sw.type).toBe('Switch');
        expect(sw.label).toBe('Dark Mode');
        expect(sw.checked).toBe(true);
      });
    });

    describe('Slider', () => {
      it('should parse slider with min/max/value', () => {
        const result = parse('page { slider "Volume" min=0 max=100 value=50 }');
        const slider = result.children[0].children[0];
        expect(slider.type).toBe('Slider');
        expect(slider.label).toBe('Volume');
        expect(slider.min).toBe(0);
        expect(slider.max).toBe(100);
        expect(slider.value).toBe(50);
      });

      it('should parse slider with step', () => {
        const result = parse('page { slider "Price" min=0 max=1000 step=10 }');
        expect(result.children[0].children[0].step).toBe(10);
      });
    });
  });

  // ===========================================
  // Button Component
  // ===========================================
  describe('Button Component', () => {
    it('should parse button with label', () => {
      const result = parse('page { button "Submit" }');
      const button = result.children[0].children[0];
      expect(button.type).toBe('Button');
      expect(button.content).toBe('Submit');
    });

    it('should parse button variants', () => {
      const variants = ['primary', 'secondary', 'danger', 'outline', 'ghost'];
      for (const variant of variants) {
        const result = parse(`page { button "Click" ${variant} }`);
        expect(result.children[0].children[0][variant]).toBe(true);
      }
    });

    it('should parse button with size', () => {
      const sizes = ['sm', 'md', 'lg'];
      for (const size of sizes) {
        const result = parse(`page { button "Click" size=${size} }`);
        expect(result.children[0].children[0].size).toBe(size);
      }
    });

    it('should parse button with icon', () => {
      const result = parse('page { button "Download" icon=download }');
      expect(result.children[0].children[0].icon).toBe('download');
    });

    it('should parse button with disabled', () => {
      const result = parse('page { button "Save" disabled }');
      expect(result.children[0].children[0].disabled).toBe(true);
    });

    it('should parse button with width', () => {
      const result = parse('page { button "Full Width" w=full }');
      expect(result.children[0].children[0].w).toBe('full');
    });

    it('should parse button with loading', () => {
      const result = parse('page { button "Processing" loading }');
      expect(result.children[0].children[0].loading).toBe(true);
    });
  });

  // ===========================================
  // Display Components
  // ===========================================
  describe('Display Components', () => {
    describe('Image', () => {
      it('should parse image with src', () => {
        const result = parse('page { image "photo.jpg" }');
        const image = result.children[0].children[0];
        expect(image.type).toBe('Image');
        expect(image.src).toBe('photo.jpg');
      });

      it('should parse image with alt', () => {
        const result = parse('page { image "photo.jpg" alt="Profile Photo" }');
        expect(result.children[0].children[0].alt).toBe('Profile Photo');
      });

      it('should parse image with size', () => {
        const result = parse('page { image "photo.jpg" w=200 h=150 }');
        const image = result.children[0].children[0];
        expect(image.w).toBe(200);
        expect(image.h).toBe(150);
      });
    });

    describe('Placeholder', () => {
      it('should parse placeholder', () => {
        const result = parse('page { placeholder w=200 h=150 }');
        const ph = result.children[0].children[0];
        expect(ph.type).toBe('Placeholder');
        expect(ph.w).toBe(200);
        expect(ph.h).toBe(150);
      });

      it('should parse placeholder with label', () => {
        const result = parse('page { placeholder "Image Area" w=full h=300 }');
        expect(result.children[0].children[0].label).toBe('Image Area');
      });
    });

    describe('Avatar', () => {
      it('should parse avatar with initials', () => {
        const result = parse('page { avatar "JD" }');
        const avatar = result.children[0].children[0];
        expect(avatar.type).toBe('Avatar');
        expect(avatar.name).toBe('JD');
      });

      it('should parse avatar with size', () => {
        const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
        for (const size of sizes) {
          const result = parse(`page { avatar "AB" size=${size} }`);
          expect(result.children[0].children[0].size).toBe(size);
        }
      });

      it('should parse avatar with src', () => {
        const result = parse('page { avatar "photo.jpg" src }');
        expect(result.children[0].children[0].src).toBe(true);
      });
    });

    describe('Badge', () => {
      it('should parse badge', () => {
        const result = parse('page { badge "New" }');
        const badge = result.children[0].children[0];
        expect(badge.type).toBe('Badge');
        expect(badge.content).toBe('New');
      });

      it('should parse badge with variant', () => {
        const variants = ['default', 'success', 'warning', 'danger', 'info'];
        for (const variant of variants) {
          const result = parse(`page { badge "Status" variant=${variant} }`);
          expect(result.children[0].children[0].variant).toBe(variant);
        }
      });

      it('should parse badge with pill', () => {
        const result = parse('page { badge "3" pill }');
        expect(result.children[0].children[0].pill).toBe(true);
      });
    });

    describe('Icon', () => {
      it('should parse icon', () => {
        const result = parse('page { icon "menu" }');
        const icon = result.children[0].children[0];
        expect(icon.type).toBe('Icon');
        expect(icon.name).toBe('menu');
      });

      it('should parse icon with size', () => {
        const result = parse('page { icon "search" size=24 }');
        expect(result.children[0].children[0].size).toBe(24);
      });
    });
  });

  // ===========================================
  // Data Components
  // ===========================================
  describe('Data Components', () => {
    describe('Table', () => {
      it('should parse table with columns and rows', () => {
        const result = parse(`
          page {
            table {
              columns ["ID", "Name", "Status"]
              row ["1", "John", "Active"]
              row ["2", "Jane", "Pending"]
            }
          }
        `);
        const table = result.children[0].children[0];
        expect(table.type).toBe('Table');
        expect(table.columns).toEqual(['ID', 'Name', 'Status']);
        expect(table.rows).toHaveLength(2);
      });

      it('should parse table with attributes', () => {
        const result = parse(`
          page {
            table striped bordered hover {
              columns ["A", "B"]
              row ["1", "2"]
            }
          }
        `);
        const table = result.children[0].children[0];
        expect(table.striped).toBe(true);
        expect(table.bordered).toBe(true);
        expect(table.hover).toBe(true);
      });
    });

    describe('List', () => {
      it('should parse simple list', () => {
        const result = parse('page { list ["Item 1", "Item 2", "Item 3"] }');
        const list = result.children[0].children[0];
        expect(list.type).toBe('List');
        expect(list.items).toEqual(['Item 1', 'Item 2', 'Item 3']);
      });

      it('should parse ordered list', () => {
        const result = parse('page { list ["First", "Second"] ordered }');
        expect(result.children[0].children[0].ordered).toBe(true);
      });

      it('should parse list with block items', () => {
        const result = parse(`
          page {
            list {
              item "Item 1" icon=check
              item "Item 2"
            }
          }
        `);
        const list = result.children[0].children[0];
        expect(list.items).toHaveLength(2);
        expect(list.items[0].content).toBe('Item 1');
        expect(list.items[0].icon).toBe('check');
      });

      it('should parse nested list', () => {
        const result = parse(`
          page {
            list {
              item "Parent" {
                item "Child 1"
                item "Child 2"
              }
            }
          }
        `);
        const list = result.children[0].children[0];
        expect(list.items[0].children).toHaveLength(2);
      });
    });
  });

  // ===========================================
  // Feedback Components
  // ===========================================
  describe('Feedback Components', () => {
    describe('Alert', () => {
      it('should parse alert with variants', () => {
        const variants = ['success', 'warning', 'danger', 'info'];
        for (const variant of variants) {
          const result = parse(`page { alert "Message" variant=${variant} }`);
          const alert = result.children[0].children[0];
          expect(alert.type).toBe('Alert');
          expect(alert.variant).toBe(variant);
        }
      });

      it('should parse alert with dismissible', () => {
        const result = parse('page { alert "Warning" dismissible }');
        expect(result.children[0].children[0].dismissible).toBe(true);
      });

      it('should parse alert with icon', () => {
        const result = parse('page { alert "Info" icon=info }');
        expect(result.children[0].children[0].icon).toBe('info');
      });
    });

    describe('Toast', () => {
      it('should parse toast with position', () => {
        const result = parse('page { toast "Saved!" position=top-right variant=success }');
        const toast = result.children[0].children[0];
        expect(toast.type).toBe('Toast');
        expect(toast.content).toBe('Saved!');
        expect(toast.position).toBe('top-right');
        expect(toast.variant).toBe('success');
      });
    });

    describe('Progress', () => {
      it('should parse progress with value', () => {
        const result = parse('page { progress value=75 }');
        const progress = result.children[0].children[0];
        expect(progress.type).toBe('Progress');
        expect(progress.value).toBe(75);
      });

      it('should parse progress with max', () => {
        const result = parse('page { progress value=30 max=200 }');
        expect(result.children[0].children[0].max).toBe(200);
      });

      it('should parse progress with label', () => {
        const result = parse('page { progress value=50 label="50%" }');
        expect(result.children[0].children[0].label).toBe('50%');
      });

      it('should parse indeterminate progress', () => {
        const result = parse('page { progress indeterminate }');
        expect(result.children[0].children[0].indeterminate).toBe(true);
      });
    });

    describe('Spinner', () => {
      it('should parse spinner', () => {
        const result = parse('page { spinner }');
        expect(result.children[0].children[0].type).toBe('Spinner');
      });

      it('should parse spinner with size', () => {
        const result = parse('page { spinner size=lg }');
        expect(result.children[0].children[0].size).toBe('lg');
      });

      it('should parse spinner with label', () => {
        const result = parse('page { spinner "Loading..." }');
        expect(result.children[0].children[0].label).toBe('Loading...');
      });
    });
  });

  // ===========================================
  // Overlay Components
  // ===========================================
  describe('Overlay Components', () => {
    describe('Tooltip', () => {
      it('should parse tooltip', () => {
        const result = parse('page { tooltip "Helpful tip" }');
        const tooltip = result.children[0].children[0];
        expect(tooltip.type).toBe('Tooltip');
        expect(tooltip.content).toBe('Helpful tip');
      });

      it('should parse tooltip with position', () => {
        const positions = ['top', 'right', 'bottom', 'left'];
        for (const position of positions) {
          const result = parse(`page { tooltip "Tip" position=${position} }`);
          expect(result.children[0].children[0].position).toBe(position);
        }
      });
    });

    describe('Popover', () => {
      it('should parse popover with children', () => {
        const result = parse(`
          page {
            popover "Popover Title" {
              text "Content"
              button "Action" primary
            }
          }
        `);
        const popover = result.children[0].children[0];
        expect(popover.type).toBe('Popover');
        expect(popover.title).toBe('Popover Title');
        expect(popover.children).toHaveLength(2);
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
        expect(dropdown.items[0].icon).toBe('edit');
        expect(dropdown.items[1].type).toBe('divider');
        expect(dropdown.items[2].danger).toBe(true);
      });
    });
  });

  // ===========================================
  // Navigation Components
  // ===========================================
  describe('Navigation Components', () => {
    describe('Nav', () => {
      it('should parse nav with array', () => {
        const result = parse('page { nav ["Home", "About", "Contact"] }');
        const nav = result.children[0].children[0];
        expect(nav.type).toBe('Nav');
        expect(nav.items).toEqual(['Home', 'About', 'Contact']);
      });

      it('should parse nav with vertical', () => {
        const result = parse('page { nav ["Dashboard", "Settings"] vertical }');
        expect(result.children[0].children[0].vertical).toBe(true);
      });

      it('should parse nav with objects', () => {
        const result = parse(`
          page {
            nav [
              { label="Home" icon=home active }
              { label="Settings" icon=settings }
            ]
          }
        `);
        const nav = result.children[0].children[0];
        expect(nav.items).toHaveLength(2);
        expect(nav.items[0].label).toBe('Home');
        expect(nav.items[0].icon).toBe('home');
        expect(nav.items[0].active).toBe(true);
      });
    });

    describe('Tabs', () => {
      it('should parse tabs with array', () => {
        const result = parse('page { tabs ["Tab 1", "Tab 2", "Tab 3"] active=0 }');
        const tabs = result.children[0].children[0];
        expect(tabs.type).toBe('Tabs');
        expect(tabs.items).toEqual(['Tab 1', 'Tab 2', 'Tab 3']);
        expect(tabs.active).toBe(0);
      });

      it('should parse tabs with content', () => {
        const result = parse(`
          page {
            tabs {
              tab "Overview" active { text "Overview content" }
              tab "Details" { text "Details content" }
            }
          }
        `);
        const tabs = result.children[0].children[0];
        expect(tabs.children).toHaveLength(2);
        expect(tabs.children[0].label).toBe('Overview');
        expect(tabs.children[0].active).toBe(true);
        expect(tabs.children[1].label).toBe('Details');
      });
    });

    describe('Breadcrumb', () => {
      it('should parse breadcrumb with array', () => {
        const result = parse('page { breadcrumb ["Home", "Products", "Phones"] }');
        const breadcrumb = result.children[0].children[0];
        expect(breadcrumb.type).toBe('Breadcrumb');
        expect(breadcrumb.items).toEqual(['Home', 'Products', 'Phones']);
      });

      it('should parse breadcrumb with objects', () => {
        const result = parse(`
          page {
            breadcrumb [
              { label="Home" href="/" }
              { label="Products" href="/products" }
              { label="Phones" }
            ]
          }
        `);
        const breadcrumb = result.children[0].children[0];
        expect(breadcrumb.items[0].label).toBe('Home');
        expect(breadcrumb.items[0].href).toBe('/');
        expect(breadcrumb.items[2].href).toBeUndefined();
      });
    });
  });

  // ===========================================
  // Divider Component
  // ===========================================
  describe('Divider Component', () => {
    it('should parse divider', () => {
      const result = parse('page { divider }');
      expect(result.children[0].children[0].type).toBe('Divider');
    });

    it('should parse divider with margin', () => {
      const result = parse('page { divider my=4 }');
      expect(result.children[0].children[0].my).toBe(4);
    });
  });

  // ===========================================
  // Complex Component Combinations
  // ===========================================
  describe('Complex Component Combinations', () => {
    it('should parse login form', () => {
      const result = parse(`
        page "Login" {
          main flex justify=center align=center h=screen {
            card p=6 w=400 shadow=lg {
              title "Sign In" level=2 mb=4
              input "Email" placeholder="user@example.com" type=email required mb=4
              input "Password" type=password required mb=4
              row flex justify=between align=center mb=4 {
                checkbox "Remember me"
                link "Forgot password?" href="#"
              }
              button "Sign In" primary w=full
            }
          }
        }
      `);
      expect(result.children[0].title).toBe('Login');
      const main = result.children[0].children[0];
      expect(main.flex).toBe(true);
      expect(main.h).toBe('screen');
    });

    it('should parse settings page', () => {
      const result = parse(`
        page "Settings" {
          header p=4 {
            row flex justify=between align=center {
              title "Settings" level=1
              button "Save" primary
            }
          }
          main p=6 {
            row gap=6 {
              col span=3 {
                nav ["Profile", "Account", "Security"] vertical
              }
              col span=9 {
                card p=6 {
                  title "Profile Settings" level=2 mb=4
                  input "Name" value="John Doe" mb=4
                  textarea "Bio" rows=4 mb=4
                }
              }
            }
          }
        }
      `);
      expect(result.children[0].children).toHaveLength(2);
    });

    it('should parse product card', () => {
      const result = parse(`
        page {
          card shadow=md {
            placeholder "Product Image" w=full h=200
            col p=4 {
              title "Product Name" level=3
              text "$99.99" weight=bold size=lg
              row flex gap=2 mt=4 {
                button "Add to Cart" primary
              }
            }
          }
        }
      `);
      const card = result.children[0].children[0];
      expect(card.children).toHaveLength(2);
    });
  });
});
