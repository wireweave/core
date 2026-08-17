/**
 * Canonical `.wf` printer tests.
 *
 * Round-trip laws (see `src/printer/index.ts`):
 * (a) `parse(print(ast))` is structurally equivalent to `ast` (loc ignored)
 * (b) `print(parse(print(ast))) === print(ast)` (idempotent fixpoint)
 * (c) for already-canonical text: `print(parse(text)) === text`
 *
 * The laws are checked property-style across every DSL fixture found in the
 * repo (grammar/parser tests, stories, docs examples) plus targeted cases per
 * grammar construct.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse, printWireframe, formatWireframeCode } from '../src'
import type { WireframeDocument } from '../src'
import { stripLoc, walkFiles } from './helpers/ast'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Assert laws (a) + (b) for one DSL source. Returns the canonical text. */
function expectRoundTrip(source: string, label = 'inline fixture'): string {
  const original = parse(source)
  const printed = printWireframe(original)
  let reparsed: WireframeDocument
  try {
    reparsed = parse(printed)
  } catch (error) {
    throw new Error(
      `[${label}] canonical output failed to parse: ${String(error)}\n--- printed ---\n${printed}`,
      { cause: error },
    )
  }
  // (a) structural equivalence — no information loss over parsed content
  expect(stripLoc(reparsed), `[${label}] parse(print(ast)) must equal ast`).toEqual(
    stripLoc(original),
  )
  // (b) idempotent fixpoint
  expect(printWireframe(reparsed), `[${label}] print must be a fixpoint`).toBe(printed)
  return printed
}

// ---------------------------------------------------------------------------
// (c) canonical texts reprint byte-identical (golden form pinning)
// ---------------------------------------------------------------------------

const CANONICAL_TEXTS: Record<string, string> = {
  'empty page': 'page {}\n',
  'basic page': `page "Login" {
  header border {
    text "My App" size=lg weight=bold
  }
  main {
    input "Email" placeholder="you@example.com" required type=email
    button "Sign in" primary
  }
}
`,
  'multi-page with canvas coordinates': `page "A" x=0 y=0 {
  text "hi"
}

page "B" x=760 y=0 {
  text "bye"
}
`,
  'data and navigation components': `page {
  table striped {
    columns ["Name", "Email"]
    row ["John", "john@x.com"]
  }
  list ["One", "Two"] ordered
  nav ["Home", "About"] vertical
  breadcrumb ["Home", "Products"]
  dropdown {
    item "Edit" icon=pencil
    divider
    item "Delete" danger
  }
  placeholder "" h=200
}
`,
  'nested containers with tokens': `page w=1440 {
  row gap=4 {
    col span=8 {
      card "Stats" shadow=md {
        text "42" size="2xl"
      }
    }
  }
}
`,
  'annotations and markers': `page {
  relative {
    button "Submit" primary
    marker 1 anchor=top-right color=blue
  }
  annotations title="Screen notes" {
    item 1 "Submit" {
      text "Primary action"
    }
    item 2 "Empty"
  }
}
`,
  'select options and tabs': `page {
  select "Country" [{ label=Korea, value=kr }, { label=Japan, value=jp }] required
  tabs ["One", "Two"] active=0
}
`,
  'nav block with groups': `page {
  sidebar {
    nav vertical {
      item "Home" active icon=house
      group "Admin" collapsed {
        item "Users"
        divider
        item "Settings"
      }
    }
  }
}
`,
}

describe('printer — canonical form (law c)', () => {
  for (const [name, text] of Object.entries(CANONICAL_TEXTS)) {
    it(`reprints canonical text byte-identical: ${name}`, () => {
      expect(printWireframe(parse(text))).toBe(text)
      expect(formatWireframeCode(text)).toBe(text)
    })
  }

  it('prints an empty document as an empty string', () => {
    expect(printWireframe(parse(''))).toBe('')
    expect(printWireframe(parse('// only a comment\n'))).toBe('')
  })
})

// ---------------------------------------------------------------------------
// targeted per-construct round-trip cases (laws a + b)
// ---------------------------------------------------------------------------

const CONSTRUCT_FIXTURES: Record<string, string> = {
  'page: title, at(), viewport, device, centered':
    'page "Home" at(120, 340) viewport="1440x900" device="desktop" centered { text "x" }',
  'page: numeric viewport': 'page viewport=1440 { text "x" }',
  'layout: header/main/footer with attrs':
    'page { header border p=4 { text "a" } main scroll { text "b" } footer border { text "c" } }',
  'layout: sidebar position': 'page { sidebar position=right w=240 { text "s" } }',
  'layout: row/col with flex and breakpoints':
    'page { row gap=2 justify=between align=center wrap { col span=6 sm=12 md=8 lg=6 xl=4 order=2 scroll { text "c" } } }',
  'layout: stack and relative':
    'page { stack gap=4 direction=column { text "s" } relative { image "bg" badge "9" anchor=top-right } }',
  'layout: spacing/size/appearance tokens':
    'page { col p=2 px=4 py=1 pt=1 pr=2 pb=3 pl=4 m=2 mx=auto my=1 mt=0 mr=1 mb=2 ml=3 w=full h=screen minW=200 maxW=960 minH=100 maxH=500 bg=muted border { text "x" } }',
  'layout: unit values': 'page { col w=320px h=50% p=2em m=1rem minH=10vh maxW=90vw { text "x" } }',
  'layout: negative and float numbers': 'page { col x=-20 y=1.5 { text "x" } }',
  'containers: card/modal/drawer/accordion/section':
    'page { card "T" shadow=lg border navigate="Home" { text "c" } modal "M" id="m1" { text "m" } drawer "D" id="d1" position=bottom { text "d" } accordion "A" { text "a" } section "S" expanded { text "s" } }',
  'containers: untitled': 'page { card { text "c" } section { text "s" } }',
  'text: sizes, weight, align, muted':
    'page { text "t" size=xs weight=semibold align=right muted }',
  'text: unit size': 'page { text "t" size=18px }',
  'title: level and align': 'page { title "Heading" level=3 align=center }',
  'link: href, external, actions':
    'page { link "Docs" href="https://example.com" external link "Go" navigate="Home" opens="m1" toggles="side" action="submit" }',
  'button: variants, icon, states, aria':
    'page { button "Save" primary icon=check disabled loading size=lg aria="Save document" title="Save" button "" icon=x aria-label="Close" }',
  'input: every input type':
    'page { input "A" type=text input "B" type=email input "C" type=password input "D" type=number input "E" type=tel input "F" type=url input "G" type=search input "H" type=date }',
  'input: value, placeholder, states, icon':
    'page { input "Q" placeholder="Search" value="wire" disabled required readonly icon=search }',
  'input: no label': 'page { input placeholder="Bare" }',
  'textarea: rows and states':
    'page { textarea "Bio" placeholder="..." value="v" rows=5 disabled required }',
  'select: plain and object options':
    'page { select "L" ["A", "B"] value="A" placeholder="Pick" disabled required select [{ label="K", value="k" }] }',
  'select: no options': 'page { select "Empty" placeholder="none" }',
  'checkbox/radio/switch':
    'page { checkbox "C" checked disabled radio "R" name="grp" checked switch "S" checked disabled }',
  'slider: range attrs': 'page { slider "Vol" min=0 max=100 value=40 step=5 disabled }',
  'image: src and alt': 'page { image "hero.png" alt="Hero" w=400 image alt="none" }',
  'placeholder: label, block, attrs':
    'page { placeholder "Chart" h=200 placeholder "" { text "inside" } }',
  'avatar: name, src, size': 'page { avatar "Kim" src size=lg avatar size=24 }',
  'badge: variant, pill, icon, size': 'page { badge "New" variant=success pill icon=star size=sm }',
  'icon: size and muted': 'page { icon "arrow-right" size=xl muted icon "x" size=16 }',
  'table: simplified nested-array syntax':
    'page { table [["Name", "Role"], ["Kim", "Admin"], ["Lee", "User"]] striped bordered hover }',
  'table: verbose syntax': 'page { table { columns ["A", "B"] row ["1", "2"] row ["3", "4"] } }',
  'table: rows without columns': 'page { table { row ["only", "rows"] } }',
  'table: mixed cell types': 'page { table [["N", "OK"], [1, true], [2.5, false]] }',
  'table: empty': 'page { table {} }',
  'list: array, ordered, none': 'page { list ["a", "b"] list ["x"] ordered list ["y"] none }',
  'list: block with icons and nesting':
    'page { list { item "Docs" icon=book { item "Guide" item "API" } item "Blog" } }',
  'alert/toast: variants':
    'page { alert "Saved" variant=success dismissible icon=check toast "Hi" position=bottom-right variant=info }',
  'progress/spinner':
    'page { progress value=60 max=100 label="60%" progress indeterminate spinner "Loading" size=lg spinner }',
  'tooltip: content and position': 'page { tooltip "Help text" position=right }',
  'popover: title and children':
    'page { popover "Info" { text "body" } popover { text "untitled" } }',
  'dropdown: simplified with divider tokens': 'page { dropdown ["Edit", "---", "Delete"] }',
  'dropdown: verbose with attrs':
    'page { dropdown { item "Edit" icon=pencil item "Del" danger disabled navigate="Home" divider item "Cancel" } }',
  'nav: array with object items':
    'page { nav ["Home", { label="Docs", href="/docs", active=true }] vertical }',
  'nav: block with group/divider':
    'page { nav { item "A" active group "G" collapsed { item "B" divider item "C" disabled } divider item "D" } }',
  'nav: array and block together': 'page { nav ["Top"] vertical { item "Block" } }',
  'tabs: array with active index': 'page { tabs ["One", "Two", "Three"] active=1 }',
  'tabs: block with children':
    'page { tabs { tab "First" active { text "1" } tab "Second" disabled { text "2" } tab "Empty" { } } }',
  'breadcrumb: strings and objects':
    'page { breadcrumb ["Home", "Products"] breadcrumb [{ label="Home", href="/" }, "Here"] }',
  'divider: horizontal and vertical': 'page { divider row { text "l" divider vertical text "r" } }',
  'marker: number, color, anchor':
    'page { relative { button "Go" marker 3 color=red anchor=bottom-left } }',
  'annotations: items with and without blocks':
    'page { annotations title="Notes" { item 1 "First" { text "d1" text "d2" } item 2 "Second" } annotations { item 1 "Bare" } }',
  'interactive props on display nodes':
    'page { image "a.png" navigate="Home" avatar "K" opens="menu" badge "3" toggles="panel" icon "bell" action="notify" }',
  'strings: escapes': 'page { text "line1\\nline2\\ttab \\"quoted\\" back\\\\slash" }',
  'strings: single-quoted input': "page { text 'single' button 'ok' primary }",
  'strings: unicode content': 'page "로그인" { text "안녕하세요 — ✓" button "확인" primary }',
  'strings: empty required content': 'page { text "" button "" }',
  'strings: boolean-prefixed values must stay quoted':
    'page { input "A" value="trueish" input "B" value="false-start" }',
  'comments: dropped by the parser':
    'page { // line comment\n text "a" /* block comment */ text "b" } // tail',
  'multi-page: consecutive top-level pages':
    'page "One" at(0, 0) { text "1" } page "Two" at(760, 0) { text "2" } page "Three" { text "3" }',
  'deep nesting': 'page { main { row { col { card "C" { stack { row { text "deep" } } } } } } }',
}

describe('printer — per-construct round-trip (laws a + b)', () => {
  for (const [name, source] of Object.entries(CONSTRUCT_FIXTURES)) {
    it(name, () => {
      expectRoundTrip(source, name)
    })
  }
})

// ---------------------------------------------------------------------------
// unprintable structures throw (documented — no silent lossiness)
// ---------------------------------------------------------------------------

function docWith(node: Record<string, unknown>): WireframeDocument {
  return {
    type: 'Document',
    children: [{ type: 'Page', title: null, children: [node] }],
  } as unknown as WireframeDocument
}

describe('printer — unprintable structures throw', () => {
  it('rejects tooltip children (grammar has no tooltip block)', () => {
    const doc = docWith({
      type: 'Tooltip',
      content: 't',
      children: [{ type: 'Text', content: 'x' }],
    })
    expect(() => printWireframe(doc)).toThrow(/tooltip block/i)
  })

  it('rejects attribute names that collide with child keywords', () => {
    const doc = docWith({ type: 'Text', content: 'x', card: true })
    expect(() => printWireframe(doc)).toThrow(/child keyword/)
  })

  it('rejects non-identifier attribute names', () => {
    const doc = docWith({ type: 'Text', content: 'x', 'bad name': 1 })
    expect(() => printWireframe(doc)).toThrow(/not a grammar identifier/)
  })

  it('rejects numbers without a decimal grammar representation', () => {
    const doc = docWith({ type: 'Text', content: 'x', w: 1e21 })
    expect(() => printWireframe(doc)).toThrow(/decimal grammar representation/)
    const nan = docWith({ type: 'Text', content: 'x', w: Number.NaN })
    expect(() => printWireframe(nan)).toThrow(/not finite/)
  })

  it('rejects negative or fractional marker numbers', () => {
    expect(() => printWireframe(docWith({ type: 'Marker', number: -1 }))).toThrow(/integer/)
    expect(() => printWireframe(docWith({ type: 'Marker', number: 1.5 }))).toThrow(/integer/)
  })

  it('rejects nav groups nested inside nav groups', () => {
    const doc = docWith({
      type: 'Nav',
      items: [],
      children: [
        { type: 'NavGroup', label: 'a', items: [{ type: 'NavGroup', label: 'b', items: [] }] },
      ],
    })
    expect(() => printWireframe(doc)).toThrow(/group inside a group/)
  })
})

// ---------------------------------------------------------------------------
// repo-wide fixture corpus (stories + tests + docs examples)
// ---------------------------------------------------------------------------

interface Fixture {
  source: string
  text: string
}

/** Backtick template literals (no interpolation) from a TS source file. */
function extractTemplateLiterals(fileText: string): string[] {
  const out: string[] = []
  for (const match of fileText.matchAll(/`([^`]*)`/g)) {
    const candidate = match[1] ?? ''
    if (candidate.includes('${')) continue
    out.push(candidate)
  }
  return out
}

/** Fenced ```wireframe / ```wf code blocks from a markdown file. */
function extractFencedBlocks(fileText: string): string[] {
  const out: string[] = []
  for (const match of fileText.matchAll(/```(?:wireframe|wf)[^\n]*\n([\s\S]*?)```/g)) {
    out.push(match[1] ?? '')
  }
  return out
}

/** Accept a candidate as a fixture if it parses (directly or page-wrapped). */
function toFixture(candidate: string, source: string): Fixture | null {
  const trimmed = candidate.trim()
  if (trimmed === '') return null
  try {
    const doc = parse(trimmed)
    if (doc.children.length > 0) return { source, text: trimmed }
  } catch {
    // fall through to page-wrapped attempt
  }
  const wrapped = `page {\n${trimmed}\n}`
  try {
    const doc = parse(wrapped)
    if (doc.children.length > 0) return { source, text: wrapped }
  } catch {
    return null
  }
  return null
}

function collectFixtures(): Fixture[] {
  const here = import.meta.dirname
  const fixtures: Fixture[] = []
  const seen = new Set<string>()

  const push = (candidate: string, source: string): void => {
    const fixture = toFixture(candidate, source)
    if (!fixture || seen.has(fixture.text)) return
    seen.add(fixture.text)
    fixtures.push(fixture)
  }

  const tsFiles: string[] = []
  walkFiles(path.resolve(here, '../src/stories'), '.stories.ts', tsFiles)
  walkFiles(here, '.test.ts', tsFiles)
  for (const file of tsFiles) {
    for (const candidate of extractTemplateLiterals(fs.readFileSync(file, 'utf8'))) {
      push(candidate, path.relative(here, file))
    }
  }

  const mdFiles: string[] = []
  walkFiles(path.resolve(here, '../../../docs'), '.md', mdFiles)
  for (const file of mdFiles) {
    for (const candidate of extractFencedBlocks(fs.readFileSync(file, 'utf8'))) {
      push(candidate, path.relative(here, file))
    }
  }

  return fixtures
}

describe('printer — repo-wide fixture corpus round-trip', () => {
  const fixtures = collectFixtures()

  it('collects a substantial corpus (stories, tests, docs)', () => {
    // Floor guards against silent extraction regressions.
    expect(fixtures.length).toBeGreaterThan(100)
  })

  it(`round-trips every collected fixture (laws a + b)`, () => {
    const failures: string[] = []
    for (const fixture of fixtures) {
      try {
        expectRoundTrip(fixture.text, fixture.source)
      } catch (error) {
        failures.push(`--- ${fixture.source} ---\n${fixture.text}\n=> ${String(error)}`)
      }
    }
    expect(
      failures,
      `${failures.length}/${fixtures.length} corpus fixtures failed round-trip:\n${failures
        .slice(0, 5)
        .join('\n\n')}`,
    ).toEqual([])
  })
})
