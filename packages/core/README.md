# @wireweave/core

The parser and renderer for the Wireweave wireframe DSL.

## What it does

`@wireweave/core` turns Wireweave's text-based DSL into an AST and back into visual output. It provides:

- **Parser** — a Peggy-generated parser that converts `.wf` / `.wireframe` source into a typed AST, with strict and error-recovering modes.
- **Renderers** — render the AST to HTML+CSS, a standalone HTML document, or SVG. Multi-page documents are auto-composed onto a bounded canvas; single-page documents render in legacy single-board mode.
- **Multi-page canvas** — `.wf` supports multiple pages positioned on a canvas (`page "..." at(x, y)`) with per-page `viewport` / `device` presets.
- **AST utilities** — type guards and traversal helpers (`walkDocument`, `find`, `findByType`, …).
- **Validation** — check AST nodes against the DSL specification.
- **Diff** — structurally compare two documents.
- **Export** — convert the AST to JSON or a Figma-compatible structure.
- **Analyze** — compute statistics plus accessibility, complexity, layout, and content metrics.

## Install

```bash
npm i @wireweave/core
```

## Usage

```typescript
import { parse, render, renderToHtml, renderToSvg } from '@wireweave/core'

const source = `
  page "Home" {
    card p=4 {
      title "Welcome"
      text "Hello, Wireweave!"
      button "Get Started" primary
    }
  }
`

// Parse DSL into an AST
const doc = parse(source)

// Render to HTML fragment + CSS
const { html, css } = render(doc)

// Render to a standalone HTML document
const fullHtml = renderToHtml(doc)

// Render to SVG (multi-page docs auto-compose onto a canvas)
const { svg, width, height } = renderToSvg(doc)
```

### Multi-page canvas

```typescript
const doc = parse(`
  page "Login" at(0, 0) viewport=mobile {
    button "Sign in" primary
  }
  page "Home" at(420, 0) viewport=mobile {
    text "Welcome back"
  }
`)

const { svg } = renderToSvg(doc) // viewBox sized to the canvas bounding box
```

### Analyze, diff, and export

```typescript
import { parse, analyze, diff, exportToJson, exportToFigma } from '@wireweave/core'

const a = parse(sourceA)
const b = parse(sourceB)

const stats = analyze(a) // totals, accessibility score, complexity, layout, content
const changes = diff(a, b) // added / removed / changed / moved nodes
const json = exportToJson(a) // serializable AST
const figma = exportToFigma(a) // Figma-compatible node tree
```

### Print back to canonical DSL

```typescript
import { parse, printWireframe, formatWireframeCode } from '@wireweave/core'

const doc = parse(source)
const canonical = printWireframe(doc) // deterministic canonical `.wf` text
const formatted = formatWireframeCode(source) // parse + reprint in one step
```

The printer emits a single canonical form (fixed indentation, attribute
ordering, quoting, blank-line policy) with round-trip guarantees:
`parse(printWireframe(doc))` is structurally equivalent to `doc`, printing is
idempotent, and already-canonical text reprints byte-identical. Comments are
not preserved (the parser drops them before the AST).

### Walk the AST

```typescript
import { parse, walkDocument, findByType, isButtonNode } from '@wireweave/core'

const doc = parse(source)

walkDocument(doc, (node) => {
  if (isButtonNode(node)) {
    console.log(node.content)
  }
})

const buttons = findByType(doc.children[0], 'Button')
```

## Main API

| Export                                                          | Description                                                                 |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `parse(source, options?)`                                       | Parse DSL into a `WireframeDocument`; throws `ParseError` on syntax errors. |
| `tryParse` / `isValid` / `getErrors`                            | Error-recovering parse, boolean check, and error list.                      |
| `printWireframe` / `formatWireframeCode`                        | Canonical `.wf` printer — AST → deterministic DSL text (round-trip safe).   |
| `render(doc, options?)`                                         | Render to `{ html, css }`. Auto canvas mode for multi-page docs.            |
| `renderToHtml(doc, options?)`                                   | Render to a complete standalone HTML document string.                       |
| `renderToSvg(doc, options?)`                                    | Render to `{ svg, width, height }` using `foreignObject` (HTML+CSS in SVG). |
| `renderPage` / `renderCanvas` / `layoutCanvas`                  | Explicit single-page / multi-page composition primitives.                   |
| `validate` / `isValidAst` / `getValidationErrors`               | Validate AST nodes against the DSL spec.                                    |
| `analyze(doc, options?)`                                        | Statistics plus accessibility, complexity, layout, and content metrics.     |
| `diff(oldDoc, newDoc, options?)`                                | Structural diff; also `areIdentical`, `getChangeSummary`.                   |
| `exportToJson` / `importFromJson` / `exportToFigma`             | Format conversion to/from JSON and to Figma.                                |
| `walkDocument` / `walk` / `find` / `findAll` / `findByType`     | AST traversal helpers.                                                      |
| `resolveViewport` / `DEVICE_PRESETS` / `wrapInPreviewContainer` | Viewport sizing, device presets, preview scaling.                           |
| AST types + `is*` guards                                        | `WireframeDocument`, `AnyNode`, node types, and type guards.                |

Subpath entries are available for `@wireweave/core/parser` and `@wireweave/core/renderer`.

The build runs `build:grammar` (Peggy) before the TypeScript build to regenerate the parser from `src/grammar/wireframe.peggy`.

Part of the [Wireweave monorepo](https://github.com/wireweave/wireweave).

## License

MIT
