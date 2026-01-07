/**
 * Component Renderer Tests for wireweave
 *
 * Tests component rendering, XSS prevention, and accessibility
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../src';
import { render, generateComponentStyles, defaultTheme } from '../src/renderer';

describe('Component Rendering', () => {
  describe('Container Components', () => {
    it('should render card with title', () => {
      const doc = parse('page { card "Card Title" { text "Content" } }');
      const result = render(doc);

      expect(result.html).toContain('wf-card');
      expect(result.html).toContain('Card Title');
      expect(result.html).toContain('Content');
    });

    it('should render card with shadow variant', () => {
      const doc = parse('page { card shadow=lg { text "Content" } }');
      const result = render(doc);

      expect(result.html).toContain('wf-card-shadow-lg');
    });

    it('should render modal with accessibility attributes', () => {
      const doc = parse('page { modal "Dialog Title" { text "Body" } }');
      const result = render(doc);

      expect(result.html).toContain('wf-modal');
      expect(result.html).toContain('role="dialog"');
      expect(result.html).toContain('aria-modal="true"');
      expect(result.html).toContain('Dialog Title');
    });

    it('should render drawer with position', () => {
      const doc = parse('page { drawer position=right { text "Sidebar" } }');
      const result = render(doc);

      expect(result.html).toContain('wf-drawer');
      expect(result.html).toContain('wf-drawer-right');
    });

    it('should render accordion', () => {
      const doc = parse('page { accordion "FAQ Item" { text "Answer" } }');
      const result = render(doc);

      expect(result.html).toContain('wf-accordion');
      expect(result.html).toContain('wf-accordion-header');
      expect(result.html).toContain('wf-accordion-content');
      expect(result.html).toContain('FAQ Item');
    });
  });

  describe('Text Components', () => {
    it('should render text with all variants', () => {
      const doc = parse('page { text "Body" size=lg weight=bold align=center }');
      const result = render(doc);

      expect(result.html).toContain('wf-text');
      expect(result.html).toContain('wf-text-lg');
      expect(result.html).toContain('wf-text-bold');
      expect(result.html).toContain('wf-text-center');
    });

    it('should render muted text', () => {
      const doc = parse('page { text "Muted text" muted }');
      const result = render(doc);

      expect(result.html).toContain('wf-text-muted');
    });

    it('should render title with correct heading level', () => {
      const levels = [1, 2, 3, 4, 5, 6];

      for (const level of levels) {
        const doc = parse(`page { title "Heading" level=${level} }`);
        const result = render(doc);

        expect(result.html).toContain(`<h${level}`);
        expect(result.html).toContain(`</h${level}>`);
      }
    });

    it('should render link with href', () => {
      const doc = parse('page { link "Click me" href="/page" }');
      const result = render(doc);

      expect(result.html).toContain('<a');
      expect(result.html).toContain('href="/page"');
      expect(result.html).toContain('Click me');
    });

    it('should render external link with security attributes', () => {
      const doc = parse('page { link "External" href="https://example.com" external }');
      const result = render(doc);

      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('rel="noopener noreferrer"');
    });
  });

  describe('Input Components', () => {
    it('should render input with label', () => {
      const doc = parse('page { input "Email Address" }');
      const result = render(doc);

      expect(result.html).toContain('wf-input');
      expect(result.html).toContain('Email Address');
      expect(result.html).toContain('<input');
    });

    it('should render input with placeholder', () => {
      const doc = parse('page { input "Name" placeholder="Enter your name" }');
      const result = render(doc);

      expect(result.html).toContain('placeholder="Enter your name"');
    });

    it('should render disabled input', () => {
      const doc = parse('page { input "Disabled" disabled }');
      const result = render(doc);

      expect(result.html).toContain('disabled');
    });

    it('should render required input', () => {
      const doc = parse('page { input "Required" required }');
      const result = render(doc);

      expect(result.html).toContain('required');
    });

    it('should render textarea', () => {
      const doc = parse('page { textarea "Description" rows=5 }');
      const result = render(doc);

      expect(result.html).toContain('<textarea');
      expect(result.html).toContain('rows="5"');
    });

    it('should render select with options', () => {
      const doc = parse('page { select "Country" ["USA", "UK", "Japan"] }');
      const result = render(doc);

      expect(result.html).toContain('<select');
      expect(result.html).toContain('<option');
      expect(result.html).toContain('USA');
      expect(result.html).toContain('UK');
      expect(result.html).toContain('Japan');
    });

    it('should render checkbox with label', () => {
      const doc = parse('page { checkbox "I agree to terms" }');
      const result = render(doc);

      expect(result.html).toContain('type="checkbox"');
      expect(result.html).toContain('I agree to terms');
    });

    it('should render checked checkbox', () => {
      const doc = parse('page { checkbox "Checked" checked }');
      const result = render(doc);

      expect(result.html).toContain('checked');
    });

    it('should render radio button', () => {
      const doc = parse('page { radio "Option A" name="options" }');
      const result = render(doc);

      expect(result.html).toContain('type="radio"');
      expect(result.html).toContain('name="options"');
      expect(result.html).toContain('Option A');
    });

    it('should render switch with accessibility', () => {
      const doc = parse('page { switch "Dark Mode" }');
      const result = render(doc);

      expect(result.html).toContain('role="switch"');
      expect(result.html).toContain('Dark Mode');
    });

    it('should render slider with min/max', () => {
      const doc = parse('page { slider "Volume" min=0 max=100 value=50 }');
      const result = render(doc);

      expect(result.html).toContain('type="range"');
      expect(result.html).toContain('min="0"');
      expect(result.html).toContain('max="100"');
      expect(result.html).toContain('value="50"');
    });
  });

  describe('Button Component', () => {
    it('should render button variants', () => {
      const variants = [
        { attr: 'primary', class: 'wf-button-primary' },
        { attr: 'secondary', class: 'wf-button-secondary' },
        { attr: 'outline', class: 'wf-button-outline' },
        { attr: 'ghost', class: 'wf-button-ghost' },
        { attr: 'danger', class: 'wf-button-danger' },
      ];

      for (const { attr, class: cls } of variants) {
        const doc = parse(`page { button "Click" ${attr} }`);
        const result = render(doc);

        expect(result.html).toContain(cls);
      }
    });

    it('should render button sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];

      for (const size of sizes) {
        const doc = parse(`page { button "Click" size=${size} }`);
        const result = render(doc);

        expect(result.html).toContain(`wf-button-${size}`);
      }
    });

    it('should render disabled button with aria', () => {
      const doc = parse('page { button "Disabled" disabled }');
      const result = render(doc);

      expect(result.html).toContain('disabled');
      expect(result.html).toContain('wf-button-disabled');
    });

    it('should render loading button', () => {
      const doc = parse('page { button "Loading" loading }');
      const result = render(doc);

      expect(result.html).toContain('wf-button-loading');
    });
  });

  describe('Display Components', () => {
    it('should render image with alt text', () => {
      const doc = parse('page { image "photo.jpg" alt="A photo" }');
      const result = render(doc);

      expect(result.html).toContain('<img');
      expect(result.html).toContain('alt="A photo"');
      expect(result.html).toContain('wf-image');
    });

    it('should render placeholder with label', () => {
      const doc = parse('page { placeholder "Image Area" }');
      const result = render(doc);

      expect(result.html).toContain('wf-placeholder');
      expect(result.html).toContain('Image Area');
    });

    it('should render avatar with initials', () => {
      const doc = parse('page { avatar "John Doe" }');
      const result = render(doc);

      expect(result.html).toContain('wf-avatar');
      expect(result.html).toContain('JD');
      expect(result.html).toContain('role="img"');
    });

    it('should render avatar sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];

      for (const size of sizes) {
        const doc = parse(`page { avatar "User" size=${size} }`);
        const result = render(doc);

        expect(result.html).toContain(`wf-avatar-${size}`);
      }
    });

    it('should render badge', () => {
      const doc = parse('page { badge "New" }');
      const result = render(doc);

      expect(result.html).toContain('wf-badge');
      expect(result.html).toContain('New');
    });

    it('should render badge pill', () => {
      const doc = parse('page { badge "5" pill }');
      const result = render(doc);

      expect(result.html).toContain('wf-badge-pill');
    });

    it('should render icon with aria-hidden', () => {
      const doc = parse('page { icon "home" }');
      const result = render(doc);

      expect(result.html).toContain('wf-icon');
      expect(result.html).toContain('aria-hidden="true"');
      expect(result.html).toContain('[home]');
    });
  });

  describe('Data Components', () => {
    it('should render table with header and rows', () => {
      const doc = parse(`
        page {
          table {
            columns ["Name", "Status"]
            row ["Alice", "Active"]
            row ["Bob", "Pending"]
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('<table');
      expect(result.html).toContain('<thead>');
      expect(result.html).toContain('<tbody>');
      expect(result.html).toContain('<th>Name</th>');
      expect(result.html).toContain('<td>Alice</td>');
    });

    it('should render table variants', () => {
      const doc = parse(`
        page {
          table striped bordered hover {
            columns ["Col"]
            row ["Val"]
          }
        }
      `);
      const result = render(doc);

      expect(result.html).toContain('wf-table-striped');
      expect(result.html).toContain('wf-table-bordered');
      expect(result.html).toContain('wf-table-hover');
    });

    it('should render list', () => {
      const doc = parse('page { list ["Item 1", "Item 2", "Item 3"] }');
      const result = render(doc);

      expect(result.html).toContain('<ul');
      expect(result.html).toContain('wf-list');
      expect(result.html).toContain('Item 1');
      expect(result.html).toContain('Item 2');
    });

    it('should render ordered list', () => {
      const doc = parse('page { list ["First", "Second"] ordered }');
      const result = render(doc);

      expect(result.html).toContain('<ol');
    });
  });

  describe('Feedback Components', () => {
    it('should render alert with role', () => {
      const doc = parse('page { alert "Warning message" }');
      const result = render(doc);

      expect(result.html).toContain('wf-alert');
      expect(result.html).toContain('role="alert"');
      expect(result.html).toContain('Warning message');
    });

    it('should render dismissible alert', () => {
      const doc = parse('page { alert "Info" dismissible }');
      const result = render(doc);

      expect(result.html).toContain('wf-alert-close');
    });

    it('should render progress with aria attributes', () => {
      const doc = parse('page { progress value=75 max=100 }');
      const result = render(doc);

      expect(result.html).toContain('wf-progress');
      expect(result.html).toContain('role="progressbar"');
      expect(result.html).toContain('aria-valuenow="75"');
      expect(result.html).toContain('aria-valuemin="0"');
      expect(result.html).toContain('aria-valuemax="100"');
    });

    it('should render spinner with status role', () => {
      const doc = parse('page { spinner "Loading data" }');
      const result = render(doc);

      expect(result.html).toContain('wf-spinner');
      expect(result.html).toContain('role="status"');
    });

    it('should render spinner sizes', () => {
      const sizes = ['sm', 'md', 'lg'];

      for (const size of sizes) {
        const doc = parse(`page { spinner size=${size} }`);
        const result = render(doc);

        expect(result.html).toContain(`wf-spinner-${size}`);
      }
    });
  });

  describe('Navigation Components', () => {
    it('should render nav with items', () => {
      const doc = parse('page { nav ["Home", "About", "Contact"] }');
      const result = render(doc);

      expect(result.html).toContain('<nav');
      expect(result.html).toContain('wf-nav');
      expect(result.html).toContain('Home');
      expect(result.html).toContain('About');
    });

    it('should render vertical nav', () => {
      const doc = parse('page { nav ["Item"] vertical }');
      const result = render(doc);

      expect(result.html).toContain('wf-nav-vertical');
    });

    it('should render tabs with tablist role', () => {
      const doc = parse('page { tabs ["Tab 1", "Tab 2", "Tab 3"] }');
      const result = render(doc);

      expect(result.html).toContain('wf-tabs');
      expect(result.html).toContain('role="tablist"');
      expect(result.html).toContain('role="tab"');
    });

    it('should render breadcrumb with aria-label', () => {
      const doc = parse('page { breadcrumb ["Home", "Products", "Item"] }');
      const result = render(doc);

      expect(result.html).toContain('wf-breadcrumb');
      expect(result.html).toContain('aria-label="Breadcrumb"');
      expect(result.html).toContain('aria-current="page"');
    });
  });

  describe('Divider', () => {
    it('should render divider', () => {
      const doc = parse('page { divider }');
      const result = render(doc);

      expect(result.html).toContain('<hr');
      expect(result.html).toContain('wf-divider');
    });
  });
});

describe('XSS Prevention', () => {
  it('should escape HTML in text content', () => {
    const doc = parse('page { text "<script>alert(1)</script>" }');
    const result = render(doc);

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('should escape HTML in title content', () => {
    const doc = parse('page { title "<img src=x onerror=alert(1)>" }');
    const result = render(doc);

    expect(result.html).not.toContain('<img');
    expect(result.html).toContain('&lt;img');
  });

  it('should escape HTML in button content', () => {
    const doc = parse('page { button "<b onclick=alert(1)>Click</b>" }');
    const result = render(doc);

    expect(result.html).not.toContain('<b onclick');
    expect(result.html).toContain('&lt;b');
  });

  it('should escape HTML in link content', () => {
    const doc = parse('page { link "<script>evil()</script>" href="/safe" }');
    const result = render(doc);

    expect(result.html).not.toContain('<script>evil');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('should escape HTML in alert content', () => {
    const doc = parse('page { alert "<div onmouseover=alert(1)>Hover</div>" }');
    const result = render(doc);

    expect(result.html).not.toContain('<div onmouseover');
    expect(result.html).toContain('&lt;div');
  });

  it('should escape HTML in list items', () => {
    const doc = parse('page { list ["<script>bad()</script>", "Safe item"] }');
    const result = render(doc);

    expect(result.html).not.toContain('<script>bad');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('should escape HTML in input placeholder', () => {
    const doc = parse('page { input "Test" placeholder="<script>x</script>" }');
    const result = render(doc);

    expect(result.html).not.toContain('placeholder="<script>');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('should escape special characters', () => {
    const doc = parse('page { text "Tom & Jerry\'s \\"Show\\"" }');
    const result = render(doc);

    expect(result.html).toContain('&amp;');
    expect(result.html).toContain('&#39;');
    expect(result.html).toContain('&quot;');
  });
});

describe('Accessibility', () => {
  it('should include role attributes on interactive elements', () => {
    const doc = parse(`
      page {
        alert "Warning"
        progress value=50
        spinner
      }
    `);
    const result = render(doc);

    expect(result.html).toContain('role="alert"');
    expect(result.html).toContain('role="progressbar"');
    expect(result.html).toContain('role="status"');
  });

  it('should include aria-modal on modals', () => {
    const doc = parse('page { modal "Dialog" { text "Content" } }');
    const result = render(doc);

    expect(result.html).toContain('aria-modal="true"');
  });

  it('should include aria-current on breadcrumb', () => {
    const doc = parse('page { breadcrumb ["Home", "Current"] }');
    const result = render(doc);

    expect(result.html).toContain('aria-current="page"');
  });

  it('should include aria-selected on tabs', () => {
    const doc = parse('page { tabs ["Active", "Inactive"] active=0 }');
    const result = render(doc);

    expect(result.html).toContain('aria-selected="true"');
    expect(result.html).toContain('aria-selected="false"');
  });

  it('should include aria-hidden on decorative icons', () => {
    const doc = parse('page { icon "star" }');
    const result = render(doc);

    expect(result.html).toContain('aria-hidden="true"');
  });

  it('should include aria-label on avatar', () => {
    const doc = parse('page { avatar "John Smith" }');
    const result = render(doc);

    expect(result.html).toContain('aria-label="John Smith"');
  });
});

describe('Component Styles Generation', () => {
  it('should generate container component styles', () => {
    const css = generateComponentStyles(defaultTheme);

    expect(css).toContain('.wf-card');
    expect(css).toContain('.wf-modal');
    expect(css).toContain('.wf-drawer');
    expect(css).toContain('.wf-accordion');
  });

  it('should generate text component styles', () => {
    const css = generateComponentStyles(defaultTheme);

    expect(css).toContain('.wf-text');
    expect(css).toContain('.wf-title');
    expect(css).toContain('.wf-link');
  });

  it('should generate input component styles', () => {
    const css = generateComponentStyles(defaultTheme);

    expect(css).toContain('.wf-input');
    expect(css).toContain('.wf-textarea');
    expect(css).toContain('.wf-select');
    expect(css).toContain('.wf-checkbox');
    expect(css).toContain('.wf-radio');
    expect(css).toContain('.wf-switch');
    expect(css).toContain('.wf-slider');
  });

  it('should generate button component styles', () => {
    const css = generateComponentStyles(defaultTheme);

    expect(css).toContain('.wf-button');
    expect(css).toContain('.wf-button-primary');
    expect(css).toContain('.wf-button-outline');
    expect(css).toContain('.wf-button-disabled');
  });

  it('should generate feedback component styles', () => {
    const css = generateComponentStyles(defaultTheme);

    expect(css).toContain('.wf-alert');
    expect(css).toContain('.wf-progress');
    expect(css).toContain('.wf-spinner');
  });

  it('should generate navigation component styles', () => {
    const css = generateComponentStyles(defaultTheme);

    expect(css).toContain('.wf-nav');
    expect(css).toContain('.wf-tabs');
    expect(css).toContain('.wf-breadcrumb');
  });

  it('should generate accessibility utility styles', () => {
    const css = generateComponentStyles(defaultTheme);

    expect(css).toContain('.sr-only');
    expect(css).toContain('prefers-reduced-motion');
  });
});
