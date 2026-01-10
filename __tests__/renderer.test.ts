/**
 * Renderer Tests for wireweave
 *
 * Tests HTML rendering, CSS generation, and theme support
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../src';
import {
  render,
  renderToHtml,
  generateStyles,
  createHtmlRenderer,
  defaultTheme,
  darkTheme,
  getTheme,
  type RenderResult,
} from '../src/renderer';

describe('Renderer', () => {
  describe('render()', () => {
    it('should render empty page', () => {
      const doc = parse('page { }');
      const result = render(doc);

      expect(result.html).toContain('wf-page');
      expect(result.html).toContain('<div');
      expect(result.html).toContain('</div>');
    });

    it('should render page with title', () => {
      const doc = parse('page "My Page" { }');
      const result = render(doc);

      expect(result.html).toContain('My Page');
    });

    it('should include CSS by default', () => {
      const doc = parse('page { }');
      const result = render(doc);

      expect(result.css).toBeTruthy();
      expect(result.css).toContain('--wf-primary');
      expect(result.css).toContain('.wf-page');
    });

    it('should exclude CSS when includeStyles is false', () => {
      const doc = parse('page { }');
      const result = render(doc, { includeStyles: false });

      expect(result.css).toBe('');
    });

    it('should minify output when minify option is true', () => {
      const doc = parse('page { text "Hello" }');
      const result = render(doc, { minify: true });

      expect(result.html).not.toContain('\n');
    });
  });

  describe('renderToHtml()', () => {
    it('should return complete HTML document', () => {
      const doc = parse('page { }');
      const html = renderToHtml(doc);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('<style>');
    });

    it('should include viewport meta tag', () => {
      const doc = parse('page { }');
      const html = renderToHtml(doc);

      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });
  });

  describe('Theme Support', () => {
    it('should use light theme by default', () => {
      const doc = parse('page { }');
      const result = render(doc);

      expect(result.css).toContain('#FFFFFF');
      expect(result.css).toContain('#000000');
    });

    it('should apply dark theme', () => {
      const doc = parse('page { }');
      const result = render(doc, { theme: 'dark' });

      expect(result.css).toContain('#1A1A1A');
    });

    it('should export defaultTheme', () => {
      expect(defaultTheme).toBeDefined();
      expect(defaultTheme.colors.background).toBe('#FFFFFF');
      expect(defaultTheme.colors.foreground).toBe('#000000');
    });

    it('should export darkTheme', () => {
      expect(darkTheme).toBeDefined();
      expect(darkTheme.colors.background).toBe('#1A1A1A');
    });

    it('should get theme by name', () => {
      expect(getTheme('light')).toEqual(defaultTheme);
      expect(getTheme('dark')).toEqual(darkTheme);
    });
  });

  describe('createHtmlRenderer()', () => {
    it('should create renderer instance', () => {
      const renderer = createHtmlRenderer();
      expect(renderer).toBeDefined();
      expect(renderer.render).toBeDefined();
    });

    it('should accept options', () => {
      const renderer = createHtmlRenderer({ theme: 'dark', minify: true });
      const doc = parse('page { }');
      const result = renderer.render(doc);

      expect(result.css).toContain('#1A1A1A');
      expect(result.html).not.toContain('\n');
    });
  });
});

describe('CSS Generation', () => {
  describe('generateStyles()', () => {
    it('should generate CSS variables', () => {
      const css = generateStyles(defaultTheme);

      expect(css).toContain(':root');
      expect(css).toContain('--wf-primary');
      expect(css).toContain('--wf-bg');
      expect(css).toContain('--wf-fg');
      expect(css).toContain('--wf-border');
    });

    it('should generate grid classes', () => {
      const css = generateStyles(defaultTheme);

      expect(css).toContain('.wf-row');
      expect(css).toContain('.wf-col');
      expect(css).toContain('.wf-col-1');
      expect(css).toContain('.wf-col-12');
    });

    // Note: Responsive breakpoints intentionally not implemented
    it('should NOT generate responsive grid classes (fixed layout design)', () => {
      const css = generateStyles(defaultTheme);

      expect(css).not.toContain('.wf-col-sm-');
      expect(css).not.toContain('.wf-col-md-');
      expect(css).not.toContain('@media (min-width:');
    });

    it('should generate spacing classes', () => {
      const css = generateStyles(defaultTheme);

      // Padding
      expect(css).toContain('.wf-p-0');
      expect(css).toContain('.wf-p-4');
      expect(css).toContain('.wf-pt-');
      expect(css).toContain('.wf-pb-');
      expect(css).toContain('.wf-px-');
      expect(css).toContain('.wf-py-');

      // Margin
      expect(css).toContain('.wf-m-0');
      expect(css).toContain('.wf-mt-');
      expect(css).toContain('.wf-mx-auto');
    });

    it('should generate flex classes', () => {
      const css = generateStyles(defaultTheme);

      expect(css).toContain('.wf-flex');
      expect(css).toContain('.wf-flex-row');
      expect(css).toContain('.wf-flex-col');
      expect(css).toContain('.wf-justify-center');
      expect(css).toContain('.wf-justify-between');
      expect(css).toContain('.wf-align-center');
      expect(css).toContain('.wf-flex-wrap');
      expect(css).toContain('.wf-gap-');
    });

    it('should use custom prefix', () => {
      const css = generateStyles(defaultTheme, 'custom');

      expect(css).toContain('--custom-primary');
      expect(css).toContain('.custom-page');
      expect(css).toContain('.custom-row');
    });
  });
});

describe('Layout Rendering', () => {
  it('should render header', () => {
    const doc = parse('page { header { text "Logo" } }');
    const result = render(doc);

    expect(result.html).toContain('<header');
    expect(result.html).toContain('wf-header');
    expect(result.html).toContain('Logo');
  });

  it('should render main', () => {
    const doc = parse('page { main { text "Content" } }');
    const result = render(doc);

    expect(result.html).toContain('<main');
    expect(result.html).toContain('wf-main');
  });

  it('should render footer', () => {
    const doc = parse('page { footer { text "Copyright" } }');
    const result = render(doc);

    expect(result.html).toContain('<footer');
    expect(result.html).toContain('wf-footer');
  });

  it('should render sidebar', () => {
    const doc = parse('page { sidebar { text "Menu" } }');
    const result = render(doc);

    expect(result.html).toContain('<aside');
    expect(result.html).toContain('wf-sidebar');
  });

  it('should render section', () => {
    const doc = parse('page { section "Features" { text "Feature 1" } }');
    const result = render(doc);

    expect(result.html).toContain('<section');
    expect(result.html).toContain('wf-section');
    expect(result.html).toContain('Features');
  });
});

describe('Grid Rendering', () => {
  it('should render row', () => {
    const doc = parse('page { row { } }');
    const result = render(doc);

    expect(result.html).toContain('wf-row');
  });

  it('should render col', () => {
    const doc = parse('page { row { col { text "Cell" } } }');
    const result = render(doc);

    expect(result.html).toContain('wf-col');
  });

  it('should render col with span', () => {
    const doc = parse('page { row { col span=6 { text "Half" } } }');
    const result = render(doc);

    expect(result.html).toContain('wf-col-6');
  });

  it('should render multiple columns', () => {
    const doc = parse(`
      page {
        row {
          col span=4 { text "One" }
          col span=4 { text "Two" }
          col span=4 { text "Three" }
        }
      }
    `);
    const result = render(doc);

    expect(result.html.match(/wf-col-4/g)).toHaveLength(3);
    expect(result.html).toContain('One');
    expect(result.html).toContain('Two');
    expect(result.html).toContain('Three');
  });
});

describe('Text Rendering', () => {
  it('should render text', () => {
    const doc = parse('page { text "Hello World" }');
    const result = render(doc);

    expect(result.html).toContain('<p');
    expect(result.html).toContain('wf-text');
    expect(result.html).toContain('Hello World');
  });

  it('should render text with size', () => {
    const doc = parse('page { text "Large" size=lg }');
    const result = render(doc);

    expect(result.html).toContain('wf-text-lg');
  });

  it('should render muted text', () => {
    const doc = parse('page { text "Muted" muted }');
    const result = render(doc);

    expect(result.html).toContain('wf-text-muted');
  });

  it('should render title', () => {
    const doc = parse('page { title "Heading" }');
    const result = render(doc);

    expect(result.html).toContain('<h1');
    expect(result.html).toContain('wf-title');
    expect(result.html).toContain('Heading');
  });

  it('should render title with level', () => {
    const doc = parse('page { title "Sub Heading" level=2 }');
    const result = render(doc);

    expect(result.html).toContain('<h2');
  });

  it('should render link', () => {
    const doc = parse('page { link "Click here" href="/page" }');
    const result = render(doc);

    expect(result.html).toContain('<a');
    expect(result.html).toContain('href="/page"');
    expect(result.html).toContain('Click here');
  });

  it('should render external link', () => {
    const doc = parse('page { link "External" href="https://example.com" external }');
    const result = render(doc);

    expect(result.html).toContain('target="_blank"');
    expect(result.html).toContain('rel="noopener noreferrer"');
  });
});

describe('Input Rendering', () => {
  it('should render input', () => {
    const doc = parse('page { input "Email" }');
    const result = render(doc);

    expect(result.html).toContain('<input');
    expect(result.html).toContain('wf-input');
    expect(result.html).toContain('Email');
  });

  it('should render input with type', () => {
    const doc = parse('page { input "Password" type=password }');
    const result = render(doc);

    expect(result.html).toContain('type="password"');
  });

  it('should render input with placeholder', () => {
    const doc = parse('page { input "Name" placeholder="Enter name" }');
    const result = render(doc);

    expect(result.html).toContain('placeholder="Enter name"');
  });

  it('should render textarea', () => {
    const doc = parse('page { textarea "Description" }');
    const result = render(doc);

    expect(result.html).toContain('<textarea');
    expect(result.html).toContain('Description');
  });

  it('should render select', () => {
    const doc = parse('page { select "Country" ["USA", "UK", "Japan"] }');
    const result = render(doc);

    expect(result.html).toContain('<select');
    expect(result.html).toContain('<option');
    expect(result.html).toContain('USA');
    expect(result.html).toContain('UK');
    expect(result.html).toContain('Japan');
  });

  it('should render checkbox', () => {
    const doc = parse('page { checkbox "Agree" }');
    const result = render(doc);

    expect(result.html).toContain('type="checkbox"');
    expect(result.html).toContain('Agree');
  });

  it('should render radio', () => {
    const doc = parse('page { radio "Option A" }');
    const result = render(doc);

    expect(result.html).toContain('type="radio"');
    expect(result.html).toContain('Option A');
  });

  it('should render switch', () => {
    const doc = parse('page { switch "Dark Mode" }');
    const result = render(doc);

    expect(result.html).toContain('role="switch"');
    expect(result.html).toContain('Dark Mode');
  });

  it('should render slider', () => {
    const doc = parse('page { slider "Volume" min=0 max=100 }');
    const result = render(doc);

    expect(result.html).toContain('type="range"');
    expect(result.html).toContain('min="0"');
    expect(result.html).toContain('max="100"');
  });
});

describe('Button Rendering', () => {
  it('should render button', () => {
    const doc = parse('page { button "Submit" }');
    const result = render(doc);

    expect(result.html).toContain('<button');
    expect(result.html).toContain('wf-button');
    expect(result.html).toContain('Submit');
  });

  it('should render primary button', () => {
    const doc = parse('page { button "Save" primary }');
    const result = render(doc);

    expect(result.html).toContain('wf-button-primary');
  });

  it('should render outline button', () => {
    const doc = parse('page { button "Cancel" outline }');
    const result = render(doc);

    expect(result.html).toContain('wf-button-outline');
  });

  it('should render disabled button', () => {
    const doc = parse('page { button "Disabled" disabled }');
    const result = render(doc);

    expect(result.html).toContain('disabled');
    expect(result.html).toContain('wf-button-disabled');
  });
});

describe('Container Rendering', () => {
  it('should render card', () => {
    const doc = parse('page { card "Info" { text "Content" } }');
    const result = render(doc);

    expect(result.html).toContain('wf-card');
    expect(result.html).toContain('Info');
    expect(result.html).toContain('Content');
  });

  it('should render card with shadow', () => {
    const doc = parse('page { card shadow=lg { text "Content" } }');
    const result = render(doc);

    expect(result.html).toContain('wf-card-shadow-lg');
  });

  it('should render modal', () => {
    const doc = parse('page { modal "Dialog" { text "Body" } }');
    const result = render(doc);

    expect(result.html).toContain('wf-modal');
    expect(result.html).toContain('wf-modal-backdrop');
    expect(result.html).toContain('role="dialog"');
    expect(result.html).toContain('Dialog');
  });

  it('should render accordion', () => {
    const doc = parse('page { accordion "FAQ" { text "Answer" } }');
    const result = render(doc);

    expect(result.html).toContain('wf-accordion');
    expect(result.html).toContain('FAQ');
  });
});

describe('Display Rendering', () => {
  it('should render image', () => {
    const doc = parse('page { image "photo.jpg" alt="Photo" }');
    const result = render(doc);

    expect(result.html).toContain('<img');
    expect(result.html).toContain('wf-image');
    expect(result.html).toContain('alt="Photo"');
  });

  it('should render placeholder', () => {
    const doc = parse('page { placeholder "Image Area" }');
    const result = render(doc);

    expect(result.html).toContain('wf-placeholder');
    expect(result.html).toContain('Image Area');
  });

  it('should render avatar', () => {
    const doc = parse('page { avatar "John Doe" }');
    const result = render(doc);

    expect(result.html).toContain('wf-avatar');
    expect(result.html).toContain('JD');
  });

  it('should render badge', () => {
    const doc = parse('page { badge "New" }');
    const result = render(doc);

    expect(result.html).toContain('wf-badge');
    expect(result.html).toContain('New');
  });

  it('should render badge with pill style', () => {
    const doc = parse('page { badge "5" pill }');
    const result = render(doc);

    expect(result.html).toContain('wf-badge-pill');
  });
});

describe('Data Rendering', () => {
  it('should render table', () => {
    const doc = parse(`
      page {
        table {
          columns ["Name", "Age"]
          row ["Alice", "30"]
          row ["Bob", "25"]
        }
      }
    `);
    const result = render(doc);

    expect(result.html).toContain('<table');
    expect(result.html).toContain('wf-table');
    expect(result.html).toContain('<th>Name</th>');
    expect(result.html).toContain('<th>Age</th>');
    expect(result.html).toContain('<td>Alice</td>');
    expect(result.html).toContain('<td>30</td>');
  });

  it('should render striped table', () => {
    const doc = parse(`
      page {
        table striped {
          columns ["A"]
          row ["1"]
        }
      }
    `);
    const result = render(doc);

    expect(result.html).toContain('wf-table-striped');
  });

  it('should render list', () => {
    const doc = parse('page { list ["Item 1", "Item 2", "Item 3"] }');
    const result = render(doc);

    expect(result.html).toContain('<ul');
    expect(result.html).toContain('wf-list');
    expect(result.html).toContain('Item 1');
    expect(result.html).toContain('Item 2');
    expect(result.html).toContain('Item 3');
  });

  it('should render ordered list', () => {
    const doc = parse('page { list ["First", "Second"] ordered }');
    const result = render(doc);

    expect(result.html).toContain('<ol');
    expect(result.html).toContain('wf-list-ordered');
  });
});

describe('Feedback Rendering', () => {
  it('should render alert', () => {
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

  it('should render progress', () => {
    const doc = parse('page { progress value=75 }');
    const result = render(doc);

    expect(result.html).toContain('wf-progress');
    expect(result.html).toContain('role="progressbar"');
    expect(result.html).toContain('width: 75%');
  });

  it('should render spinner', () => {
    const doc = parse('page { spinner "Loading" }');
    const result = render(doc);

    expect(result.html).toContain('wf-spinner');
    expect(result.html).toContain('role="status"');
  });
});

describe('Navigation Rendering', () => {
  it('should render nav', () => {
    const doc = parse('page { nav ["Home", "About", "Contact"] }');
    const result = render(doc);

    expect(result.html).toContain('<nav');
    expect(result.html).toContain('wf-nav');
    expect(result.html).toContain('Home');
    expect(result.html).toContain('About');
    expect(result.html).toContain('Contact');
  });

  it('should render vertical nav', () => {
    const doc = parse('page { nav ["Item 1"] vertical }');
    const result = render(doc);

    expect(result.html).toContain('wf-nav-vertical');
  });

  it('should render tabs', () => {
    const doc = parse('page { tabs ["Tab 1", "Tab 2"] }');
    const result = render(doc);

    expect(result.html).toContain('wf-tabs');
    expect(result.html).toContain('role="tablist"');
    expect(result.html).toContain('Tab 1');
    expect(result.html).toContain('Tab 2');
  });

  it('should render breadcrumb', () => {
    const doc = parse('page { breadcrumb ["Home", "Products", "Item"] }');
    const result = render(doc);

    expect(result.html).toContain('wf-breadcrumb');
    expect(result.html).toContain('aria-label="Breadcrumb"');
    expect(result.html).toContain('Home');
    expect(result.html).toContain('Products');
    expect(result.html).toContain('Item');
  });
});

describe('Spacing Styles (px-accurate)', () => {
  it('should apply padding as inline style', () => {
    // Spacing token 4 = 16px
    const doc = parse('page { text "Padded" p=4 }');
    const result = render(doc);

    // Spacing tokens: 4=16px
    expect(result.html).toContain('padding: 16px');
  });

  it('should apply margin as inline style', () => {
    // Spacing tokens: 2=8px, 4=16px
    const doc = parse('page { text "Margin" mt=2 mb=4 }');
    const result = render(doc);

    expect(result.html).toContain('margin-top: 8px');
    expect(result.html).toContain('margin-bottom: 16px');
  });

  it('should apply gap as inline style', () => {
    const doc = parse('page { row gap=1 { col { } } }');
    const result = render(doc);

    // Spacing token 1 = 4px
    expect(result.html).toContain('gap: 4px');
  });
});

describe('Flex Classes', () => {
  it('should apply flex direction', () => {
    const doc = parse('page { row direction=column { } }');
    const result = render(doc);

    expect(result.html).toContain('wf-flex-col');
  });

  it('should apply justify content', () => {
    const doc = parse('page { row justify=between { } }');
    const result = render(doc);

    expect(result.html).toContain('wf-justify-between');
  });

  it('should apply align items', () => {
    const doc = parse('page { row align=center { } }');
    const result = render(doc);

    expect(result.html).toContain('wf-align-center');
  });
});

describe('HTML Escaping', () => {
  it('should escape HTML in text content', () => {
    const doc = parse('page { text "<script>alert(1)</script>" }');
    const result = render(doc);

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('should escape HTML in title', () => {
    const doc = parse('page { title "<b>Bold</b>" }');
    const result = render(doc);

    expect(result.html).not.toContain('<b>Bold</b>');
    expect(result.html).toContain('&lt;b&gt;Bold&lt;/b&gt;');
  });

  it('should escape special characters', () => {
    const doc = parse('page { text "Tom & Jerry\'s \\"Show\\"" }');
    const result = render(doc);

    expect(result.html).toContain('&amp;');
    expect(result.html).toContain('&#39;');
  });
});

describe('Divider Rendering', () => {
  it('should render divider', () => {
    const doc = parse('page { divider }');
    const result = render(doc);

    expect(result.html).toContain('<hr');
    expect(result.html).toContain('wf-divider');
  });
});
