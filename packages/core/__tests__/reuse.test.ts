/**
 * Reuse grammar — REUSE-1 (parse) and REUSE-3 (round-trip).
 *
 * The point of `layout` / `component` / `slot` / `uses` is that a shared shell
 * is stated once instead of once per screen. That claim is only true if the
 * parser gives the shell its own top-level node and gives each page a reference
 * to it — so these tests assert the AST shape, not the rendered output. Render
 * semantics belong to `renderSite` (T3).
 */

import { describe, expect, it } from 'vitest'
import { parse } from '../src/parser'
import { printWireframe } from '../src/printer'
import { documentDefinitions, documentPages } from '../src/ast'
import type { AnyNode, LayoutDefinitionNode } from '../src/ast/types'
import { firstDifference, stripLoc } from './helpers/ast'

/**
 * REUSE-1's Given, transcribed: one top-level `layout app` holding a `slot`,
 * and three pages that reference it with `uses=app`.
 */
const REUSE_1_SOURCE = `layout app {
  header { title "Acme" }
  slot
  footer { text "© 2026 Acme" }
}

page "Home" uses=app {
  text "Welcome back"
}

page "Docs" uses=app {
  text "Getting started"
}

page "About" uses=app {
  text "Who we are"
}
`

describe('REUSE-1: one layout, three pages referencing it', () => {
  const doc = parse(REUSE_1_SOURCE)

  it('gives the document one Layout child and three Page children', () => {
    expect(doc.children.map((child) => child.type)).toEqual(['Layout', 'Page', 'Page', 'Page'])
    expect(documentDefinitions(doc)).toHaveLength(1)
    expect(documentPages(doc)).toHaveLength(3)
  })

  it('names the layout with the bare identifier, not a quoted title', () => {
    const [layout] = documentDefinitions(doc)
    expect(layout.type).toBe('Layout')
    expect(layout.name).toBe('app')
    // A layout is referenced, not displayed — it has no `title`.
    expect(layout).not.toHaveProperty('title')
  })

  it('resolves every page’s uses value to the string "app"', () => {
    expect(documentPages(doc).map((page) => page.uses)).toEqual(['app', 'app', 'app'])
    expect(documentPages(doc).map((page) => page.title)).toEqual(['Home', 'Docs', 'About'])
  })

  it('makes the slot position identifiable inside the layout', () => {
    const layout = documentDefinitions(doc)[0] as LayoutDefinitionNode
    const childTypes = layout.children.map((child: AnyNode) => child.type)

    // Identifiable *by position*: the slot sits between the header and the
    // footer, which is what tells a renderer where page content goes.
    expect(childTypes).toEqual(['Header', 'Slot', 'Footer'])
    expect(childTypes.indexOf('Slot')).toBe(1)

    // A bare positional marker: no name, no block.
    const slot = layout.children[1]
    expect(slot).not.toHaveProperty('name')
    expect(slot).not.toHaveProperty('children')
  })

  it('does not leak the reference into the page body', () => {
    // Each page states only its own content — that is the whole token saving.
    expect(documentPages(doc).map((page) => page.children.map((c) => c.type))).toEqual([
      ['Text'],
      ['Text'],
      ['Text'],
    ])
  })
})

/** REUSE-3's Given: a document using layout, component, slot and uses together. */
const REUSE_3_SOURCE = `layout app {
  header p=4 border {
    title "Acme" level=1
    nav ["Home", "Docs", "About"] active="Home"
  }
  sidebar w=240 border {
    nav ["Overview", "Settings"] vertical
  }
  slot
  footer h=48 {
    text "© 2026 Acme" muted
  }
}

component userbadge {
  row gap=2 align=center {
    avatar "SW" size=sm
    text "Seungwoo" weight=bold
    badge "pro" variant=success
  }
}

page "Home" uses=app viewport="1280x800" {
  card "Recent" p=4 shadow=md {
    list ["First", "Second"]
  }
}

page "Settings" uses=app viewport="1280x800" {
  input "Email" inputType=email placeholder="you@example.com" required
  button "Save" primary action="save"
}
`

describe('REUSE-3: parse → print → parse is lossless', () => {
  it('reparses the printed source to a structurally identical AST', () => {
    const first = parse(REUSE_3_SOURCE)
    const printed = printWireframe(first)
    const second = parse(printed)

    const diff = firstDifference(stripLoc(second), stripLoc(first))
    expect(diff).toBeNull()
  })

  it('reaches a fixed point after one print (canonical form is stable)', () => {
    const printed = printWireframe(parse(REUSE_3_SOURCE))
    expect(printWireframe(parse(printed))).toBe(printed)
  })

  it('keeps every reuse construct in the printed source', () => {
    const printed = printWireframe(parse(REUSE_3_SOURCE))

    // The name prints bare on both sides of the reference, so the definition
    // and the `uses=` that points at it stay in one lexical class.
    expect(printed).toContain('layout app {')
    expect(printed).toContain('component userbadge {')
    expect(printed).toContain('uses=app')
    expect(printed).toMatch(/^ {2}slot$/m)
  })
})

/**
 * `id=` and `uses=` are the two page attributes that carry a *reference* rather
 * than a look, and both arrive through the generic attribute spread rather than
 * through a rule of their own. That makes them exactly the kind of value a
 * printer change can drop without any grammar test noticing, so they are
 * pinned here: `id` is the key `navigate=` resolves against, and a silently
 * lost `id` turns into a silently unreachable screen.
 */
describe('page identity: id and uses survive the round trip', () => {
  const SOURCE = `page "Home" id=home uses=app {
  button "Open settings" navigate="settings"
}

page "Settings" id=settings uses=app {
  text "Settings"
}
`

  it('exposes id and uses as declared string properties of the page', () => {
    const [home, settings] = documentPages(parse(SOURCE))

    expect(home.id).toBe('home')
    expect(home.uses).toBe('app')
    expect(settings.id).toBe('settings')

    // The address is independent of the display name: they differ in case and
    // content, which is the whole point of having both.
    expect(home.title).toBe('Home')
    expect(home.id).not.toBe(home.title)
  })

  it('keeps both attributes through parse → print → parse', () => {
    const first = parse(SOURCE)
    const printed = printWireframe(first)

    expect(printed).toContain('id=home')
    expect(printed).toContain('id=settings')
    expect(firstDifference(stripLoc(parse(printed)), stripLoc(first))).toBeNull()
  })
})
