<p align="center">
  <img src="https://raw.githubusercontent.com/wireweave/core/main/logo.svg" width="128" height="128" alt="Wireweave Core">
</p>

<h1 align="center">@wireweave/core</h1>

<p align="center">Core parser and renderers for Wireweave DSL</p>

## Installation

```bash
npm install @wireweave/core
# or
pnpm add @wireweave/core
# or
yarn add @wireweave/core
```

## Quick Start

```typescript
import { parse, render, renderToSvg, renderToHtml } from '@wireweave/core';

const source = `
  page "Hello" {
    card p=4 {
      title "Welcome"
      text "Hello, wireweave!"
      button "Get Started" primary
    }
  }
`;

// Parse DSL to AST
const doc = parse(source);

// Render to HTML + CSS
const { html, css } = render(doc);

// Render to complete HTML document
const fullHtml = renderToHtml(doc);

// Render to SVG
const { svg, width, height } = renderToSvg(doc);
```

## API Reference

### Parser

#### `parse(source: string): WireframeDocument`

Parses wireframe DSL source code into an AST (Abstract Syntax Tree).

```typescript
import { parse } from '@wireweave/core';

const doc = parse('page { text "Hello" }');
console.log(doc.children[0].type); // 'Page'
```

**Throws**: `ParseError` if the source contains syntax errors.

### HTML Renderer

#### `render(doc: WireframeDocument, options?: RenderOptions): RenderResult`

Renders the AST to HTML and CSS.

```typescript
import { parse, render } from '@wireweave/core';

const doc = parse('page { card { text "Hello" } }');
const { html, css } = render(doc);
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |

**Returns**: `{ html: string, css: string }`

#### `renderToHtml(doc: WireframeDocument, options?: RenderOptions): string`

Renders the AST to a complete HTML document with embedded CSS.

```typescript
import { parse, renderToHtml } from '@wireweave/core';

const doc = parse('page "Test" { text "Hello" }');
const html = renderToHtml(doc, { theme: 'dark' });
// Returns: <!DOCTYPE html><html>...</html>
```

### SVG Renderer

#### `renderToSvg(doc: WireframeDocument, options?: SvgRenderOptions): SvgRenderResult`

Renders the AST to SVG format.

```typescript
import { parse, renderToSvg } from '@wireweave/core';

const doc = parse('page { button "Click" primary }');
const { svg, width, height } = renderToSvg(doc, {
  width: 800,
  padding: 20
});
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | `1200` | SVG width in pixels |
| `padding` | `number` | `24` | Padding around content |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |

**Returns**: `{ svg: string, width: number, height: number }`

### Analysis

#### `analyze(doc: WireframeDocument, options?: AnalysisOptions): AnalysisResult`

Analyzes a wireframe document and returns comprehensive statistics.

```typescript
import { parse, analyze } from '@wireweave/core';

const doc = parse('page { card { text "Hello" button "Click" } }');
const result = analyze(doc);

console.log(result.summary);
// { totalComponents: 4, uniqueTypes: 4, mostUsedType: 'Page', ... }

console.log(result.tree);
// { totalNodes: 4, maxDepth: 3, avgDepth: 2, ... }

console.log(result.accessibility);
// { score: 100, imagesWithAlt: 0, inputsWithLabels: 0, ... }

console.log(result.complexity);
// { score: 2, level: 'simple', interactiveElements: 1, ... }
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeComponentBreakdown` | `boolean` | `true` | Include component statistics |
| `includeAccessibility` | `boolean` | `true` | Include accessibility metrics |
| `includeComplexity` | `boolean` | `true` | Include complexity analysis |
| `includeLayout` | `boolean` | `true` | Include layout analysis |
| `includeContent` | `boolean` | `true` | Include content analysis |

### Diff (Document Comparison)

#### `diff(oldDoc: WireframeDocument, newDoc: WireframeDocument, options?: DiffOptions): DiffResult`

Compares two wireframe documents and returns detailed differences.

```typescript
import { parse, diff } from '@wireweave/core';

const oldDoc = parse('page { text "Hello" }');
const newDoc = parse('page { text "Hello" button "Click" }');

const result = diff(oldDoc, newDoc);

console.log(result.identical); // false
console.log(result.description); // "Added 1 component(s): Button."
console.log(result.summary);
// { addedCount: 1, removedCount: 0, changedCount: 0, ... }
```

#### `areIdentical(oldDoc: WireframeDocument, newDoc: WireframeDocument): boolean`

Quick check if two documents are identical.

```typescript
import { parse, areIdentical } from '@wireweave/core';

const doc1 = parse('page { text "Hello" }');
const doc2 = parse('page { text "Hello" }');

console.log(areIdentical(doc1, doc2)); // true
```

#### `getChangeSummary(oldDoc: WireframeDocument, newDoc: WireframeDocument): string`

Returns a human-readable summary of changes.

```typescript
import { parse, getChangeSummary } from '@wireweave/core';

const oldDoc = parse('page { text "A" }');
const newDoc = parse('page { text "B" }');

console.log(getChangeSummary(oldDoc, newDoc));
// "Modified 1 component(s)."
```

### Export

#### `exportToJson(doc: WireframeDocument, options?: ExportOptions): JsonExportResult`

Exports wireframe to JSON format.

```typescript
import { parse, exportToJson } from '@wireweave/core';

const doc = parse('page { card { text "Hello" } }');
const result = exportToJson(doc);

console.log(result.version); // "1.0.0"
console.log(result.pages); // [{ type: 'page', children: [...] }]
console.log(result.metadata);
// { exportedAt: '...', nodeCount: 3, componentTypes: ['card', 'page', 'text'] }
```

#### `exportToJsonString(doc: WireframeDocument, options?: ExportOptions): string`

Exports wireframe to JSON string.

```typescript
import { parse, exportToJsonString } from '@wireweave/core';

const doc = parse('page { text "Hello" }');
const json = exportToJsonString(doc, { prettyPrint: true });
```

#### `exportToFigma(doc: WireframeDocument): FigmaExportResult`

Exports wireframe to Figma-compatible format.

```typescript
import { parse, exportToFigma } from '@wireweave/core';

const doc = parse('page { card { text "Hello" } }');
const result = exportToFigma(doc);

console.log(result.document); // Figma-compatible node tree
console.log(result.componentMappings);
// { page: 'CANVAS', card: 'FRAME', text: 'TEXT' }
```

### AST Utilities

#### `walk(node: ASTNode, callback: WalkCallback): void`

Traverses the AST tree depth-first.

```typescript
import { parse } from '@wireweave/core';
import { walk } from '@wireweave/core/ast';

const doc = parse('page { card { text "A" text "B" } }');
walk(doc.children[0], (node, parent, depth) => {
  console.log(`${node.type} at depth ${depth}`);
});
```

#### `find(node: ASTNode, predicate: (n: ASTNode) => boolean): ASTNode | undefined`

Finds the first node matching the predicate.

```typescript
import { find } from '@wireweave/core/ast';

const button = find(doc.children[0], n => n.type === 'Button');
```

#### `findAll(node: ASTNode, predicate: (n: ASTNode) => boolean): ASTNode[]`

Finds all nodes matching the predicate.

```typescript
import { findAll } from '@wireweave/core/ast';

const buttons = findAll(doc.children[0], n => n.type === 'Button');
```

#### `findByType<T>(node: ASTNode, type: string): T[]`

Finds all nodes of a specific type.

```typescript
import { findByType } from '@wireweave/core/ast';
import type { ButtonNode } from '@wireweave/core';

const buttons = findByType<ButtonNode>(doc.children[0], 'Button');
```

#### `countNodes(node: ASTNode): number`

Counts all nodes in the tree.

#### `getMaxDepth(node: ASTNode): number`

Returns the maximum nesting depth.

#### `cloneNode<T>(node: T): T`

Creates a deep copy of a node.

## Type Definitions

### WireframeDocument

```typescript
interface WireframeDocument {
  type: 'Document';
  children: PageNode[];
}
```

### PageNode

```typescript
interface PageNode {
  type: 'Page';
  title?: string;
  children: ASTNode[];
  // ... spacing attributes
}
```

### Common Node Properties

All nodes include:
- `type: string` - Node type (e.g., 'Button', 'Card')
- `location?: Location` - Source location info
- Spacing: `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl`, `m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml`
- Size: `w`, `h`

### Component-Specific Properties

```typescript
// Button
interface ButtonNode {
  type: 'Button';
  content: string;
  primary?: boolean;
  secondary?: boolean;
  outline?: boolean;
  ghost?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

// Input
interface InputNode {
  type: 'Input';
  label?: string;
  placeholder?: string;
  inputType?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
  required?: boolean;
  disabled?: boolean;
}

// Card
interface CardNode {
  type: 'Card';
  title?: string;
  children: ASTNode[];
}

// Col
interface ColNode {
  type: 'Col';
  span?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  children: ASTNode[];
}
```

## DSL Syntax Reference

### Page Structure

```
page "Title" {
  header { }
  main { }
  footer { }
  sidebar { }
  aside { }
}
```

### Layout

```
// Grid columns (12-column system)
row {
  col span=6 { }   // 50% width
  col span=6 { }   // 50% width
}

// Responsive breakpoints
col span=12 sm=6 md=4 lg=3 xl=2 { }

// Flexbox
row flex justify=center align=center gap=4 wrap { }
// justify: start, end, center, between, around, evenly
// align: start, end, center, stretch, baseline
// direction: row, row-reverse, column, column-reverse
```

### Spacing Scale

Values use a 4px base: `1 = 4px`, `2 = 8px`, `4 = 16px`, etc.

```
card p=4 m=2 { }    // padding: 16px, margin: 8px
button mt=4 mb=2    // margin-top: 16px, margin-bottom: 8px
```

### Size

```
image w=400 h=300   // width: 400px, height: 300px
card w=full         // width: 100%
```

### Comments

```
// Single line comment

/* Multi-line
   comment */

page {
  // Comment inside block
  text "Hello"
}
```

## Error Handling

```typescript
import { parse } from '@wireweave/core';

try {
  const doc = parse('page { invalid }');
} catch (error) {
  if (error.name === 'ParseError') {
    console.log(error.message);
    // "Syntax error at line 1, column 8: ..."
    console.log(error.location);
    // { start: { line: 1, column: 8 }, end: { ... } }
  }
}
```

## Browser Support

The core library works in both Node.js and browser environments. For browser usage:

```html
<script type="module">
  import { parse, render } from '@wireweave/core';

  const doc = parse('page { text "Hello" }');
  const { html, css } = render(doc);

  document.body.innerHTML = `<style>${css}</style>${html}`;
</script>
```

## License

MIT
