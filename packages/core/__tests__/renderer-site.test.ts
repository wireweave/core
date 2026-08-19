/**
 * `renderSite` — a document composed into one navigable HTML file.
 *
 * The property under test throughout is that shared things are *shared*, not
 * repeated: one stylesheet, one runtime, and one copy of each layout however
 * many screens use it. A composition that emitted a shell per screen and hid
 * all but one would look identical in a screenshot and be worth nothing, so
 * "emitted once" is asserted by counting, not by rendering.
 *
 * The second property is totality. A document can name a layout that does not
 * exist, reuse an `id`, or use a layout with no `slot`; none of those is a
 * parse error, so none may stop a render. Each is pinned to a defined,
 * first-wins outcome with the unmet request left visible in the output.
 */

import { describe, it, expect } from 'vitest'
import { parse, render, renderToHtml, renderSite, buildSiteModel } from '../src'

/** How many times `needle` occurs in `haystack`. */
function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

/**
 * The rendered markup, without the stylesheet or the runtime.
 *
 * Both of those legitimately mention class names the markup also uses, so
 * counting occurrences over the whole document counts CSS rules as if they were
 * elements. Every structural count in this file is taken over this slice.
 */
function bodyOf(html: string): string {
  return html.slice(html.indexOf('<div class="wf-site"'), html.indexOf('<script>'))
}

const SHELL = `
layout app {
  header {
    title "Acme"
    nav [
      { label="Home" navigate="home" }
      { label="Settings" navigate="settings" }
    ]
  }
  slot
  footer { text "© 2026 Acme" }
}
`

const TWO_SHELLED_PAGES = `${SHELL}
page "홈" id=home uses=app viewport="1280x800" { text "home body" }
page "설정" id=settings uses=app viewport="1280x800" { text "settings body" }
`

describe('renderSite — one document', () => {
  it('produces a single standalone HTML document', () => {
    const html = renderSite(parse(TWO_SHELLED_PAGES))

    expect(count(html, '<!DOCTYPE html>')).toBe(1)
    expect(count(html, '<html lang="en">')).toBe(1)
    expect(count(html, '<style>')).toBe(1)
    expect(count(html, '<script>')).toBe(1)
  })

  it('has no external dependency of any kind', () => {
    const html = renderSite(parse(TWO_SHELLED_PAGES))

    expect(html).not.toContain('<link')
    expect(html).not.toContain('src=')
    expect(html).not.toContain('@import')
    // The only <script> is the inline runtime.
    expect(html).not.toMatch(/<script[^>]+>/)
  })

  it('titles the document from the entry page', () => {
    expect(renderSite(parse(TWO_SHELLED_PAGES))).toContain('<title>홈</title>')
  })

  it('takes an explicit title over the entry page title', () => {
    expect(renderSite(parse(TWO_SHELLED_PAGES), { title: 'Acme prototype' })).toContain(
      '<title>Acme prototype</title>',
    )
  })
})

describe('renderSite — a shell is emitted once, not per screen', () => {
  it('emits one shell for every page that uses it', () => {
    const html = renderSite(parse(TWO_SHELLED_PAGES))

    expect(count(html, 'data-layout="app"')).toBe(1)
    expect(count(html, '<div class="wf-page wf-shell"')).toBe(1)
    // The shell's own markup, once — not once per screen.
    expect(count(html, '© 2026 Acme')).toBe(1)
    expect(count(html, 'data-navigate="settings"')).toBe(1)
  })

  it('hosts every screen of the group inside that one shell', () => {
    const html = renderSite(parse(TWO_SHELLED_PAGES))
    const shell = html.slice(html.indexOf('<div class="wf-page wf-shell"'))

    expect(count(shell, '<div class="wf-slot">')).toBe(1)
    expect(shell).toContain('data-screen="0"')
    expect(shell).toContain('data-screen="1"')
    expect(shell).toContain('home body')
    expect(shell).toContain('settings body')
  })

  it('does not repeat the page frame for a hosted screen', () => {
    const html = renderSite(parse(TWO_SHELLED_PAGES))

    // The shell is the frame. Two screens inside it must not bring two more.
    expect(count(html, 'class="wf-page ')).toBe(1)
    expect(count(html, 'class="wf-page"')).toBe(0)
  })

  it('emits one shell per layout and no more', () => {
    const html = renderSite(
      parse(`
layout a { header { title "A" } slot }
layout b { header { title "B" } slot }
page "One" id=one uses=a { text "1" }
page "Two" id=two uses=a { text "2" }
page "Three" id=three uses=b { text "3" }
`),
    )

    expect(count(html, 'data-layout="a"')).toBe(1)
    expect(count(html, 'data-layout="b"')).toBe(1)
    expect(count(html, 'data-screen="')).toBe(3)
  })

  it('grows by a screen, not by a shell, when a page is added', () => {
    const two = renderSite(parse(TWO_SHELLED_PAGES))
    const three = renderSite(
      parse(`${TWO_SHELLED_PAGES}
page "청구" id=billing uses=app viewport="1280x800" { text "billing body" }`),
    )

    expect(count(three, 'data-layout="app"')).toBe(1)
    expect(count(three, '© 2026 Acme')).toBe(1)
    // The whole cost of one more screen is that screen.
    expect(three.length - two.length).toBeLessThan(400)
  })
})

describe('renderSite — pages that do not use a layout are unchanged', () => {
  const STANDALONE = `
page "홈" viewport="1280x800" { text "home" }
page "설정" viewport="1280x800" { text "settings" }
`

  it('keeps each page its own screen with its own frame', () => {
    const body = bodyOf(renderSite(parse(STANDALONE)))

    expect(count(body, 'wf-shell')).toBe(0)
    expect(count(body, 'data-screen="0"')).toBe(1)
    expect(count(body, 'data-screen="1"')).toBe(1)
    expect(count(body, 'class="wf-page"')).toBe(2)
  })

  it('renders the page exactly as the page renderer does', () => {
    const doc = parse('page "홈" viewport="1280x800" { text "home" }')
    const site = renderSite(doc)

    // The page element, verbatim from `render`, wrapped in a screen host.
    expect(site).toContain(render(doc).html)
  })
})

describe('renderSite — the screen registry is keyed by id', () => {
  it('addresses a screen by its id', () => {
    const model = buildSiteModel(parse(TWO_SHELLED_PAGES))

    expect(model.names.get('home')).toBe(0)
    expect(model.names.get('settings')).toBe(1)
  })

  it('falls back to the title when no id is declared', () => {
    const model = buildSiteModel(parse('page "홈" { text "a" }\npage "설정" { text "b" }'))

    expect(model.names.get('홈')).toBe(0)
    expect(model.names.get('설정')).toBe(1)
  })

  it('keeps the title addressable beside the id', () => {
    const model = buildSiteModel(parse(TWO_SHELLED_PAGES))

    expect(model.names.get('홈')).toBe(0)
    expect(model.names.get('설정')).toBe(1)
  })

  it('resolves an id before a title, matching the transition graph', () => {
    // Page 1's id is page 0's title. The id wins, exactly as `navigate` resolves.
    const model = buildSiteModel(
      parse('page "settings" { text "a" }\npage "B" id=settings { text "b" }'),
    )

    expect(model.names.get('settings')).toBe(1)
  })

  it('lets an id replace a title even when the title page has another id', () => {
    const model = buildSiteModel(
      parse('page "settings" id=home { text "a" }\npage "B" id=settings { text "b" }'),
    )

    // Identifier precedence is across the whole document, not only against
    // title-only pages. This must agree with extractScreenTransitions, which
    // keeps id and title namespaces separate and consults the former first.
    expect(model.names.get('settings')).toBe(1)
    expect(model.screens[0].name).toBe('home')
    expect(model.screens[1].name).toBe('settings')
  })

  it('emits the owned name as the screen fragment, and the index when none is owned', () => {
    const html = renderSite(
      parse('page "settings" { text "a" }\npage "B" id=settings { text "b" }'),
    )

    // Page 0's title is taken by page 1's id, so page 0 owns no name. The next
    // attribute follows `data-screen` directly, which is where a name would be.
    expect(html).toContain('<div class="wf-screen" data-screen="0" data-id-scope="s0-">')
    expect(html).toContain('data-screen="1" data-screen-name="settings"')
  })
})

describe('renderSite — resolution stays total', () => {
  it('resolves duplicate ids first-wins without throwing', () => {
    const doc = parse('page "A" id=dup { text "first" }\npage "B" id=dup { text "second" }')

    expect(() => renderSite(doc)).not.toThrow()
    expect(buildSiteModel(doc).names.get('dup')).toBe(0)
  })

  it('still renders the shadowed page, under whichever name is still free', () => {
    const html = renderSite(
      parse('page "A" id=dup { text "first" }\npage "B" id=dup { text "second" }'),
    )

    expect(html).toContain('second')
    // Its id went to the page before it, so the page is addressed by the one
    // name it does own: its title. Nothing is renamed and nothing is dropped.
    expect(html).toContain('data-screen="1" data-screen-name="B"')
  })

  it('leaves a page with no free name addressable only by index', () => {
    const html = renderSite(
      parse('page "dup" id=dup { text "first" }\npage "dup" id=dup { text "second" }'),
    )

    expect(html).toContain('second')
    expect(html).toContain('<div class="wf-screen" data-screen="1" data-id-scope="s1-">')
  })

  it('renders a page whose layout does not exist, and marks the unmet uses', () => {
    const body = bodyOf(
      renderSite(parse('page "홈" uses=missing viewport="1280x800" { text "page content" }')),
    )

    expect(body).toContain('page content')
    expect(body).toContain('data-wf-uses-unresolved="missing"')
    expect(body).toContain('data-wf-uses-reason="unknown-layout"')
    // No shell, and the page keeps the frame it would have had on its own.
    expect(count(body, 'wf-shell')).toBe(0)
    expect(count(body, 'class="wf-page"')).toBe(1)
  })

  it('renders a page whose layout has no slot, and marks why', () => {
    const body = bodyOf(
      renderSite(
        parse(`layout bare { header { title "H" } }
page "홈" uses=bare viewport="1280x800" { text "page content" }`),
      ),
    )

    expect(body).toContain('page content')
    expect(body).toContain('data-wf-uses-reason="slotless-layout"')
    expect(count(body, 'wf-shell')).toBe(0)
    expect(count(body, 'class="wf-page"')).toBe(1)
  })

  it('fills the first slot of a layout that declares two', () => {
    const body = bodyOf(
      renderSite(
        parse(`layout two { slot slot }
page "홈" id=home uses=two { text "page content" }`),
      ),
    )

    expect(count(body, '<div class="wf-slot">')).toBe(2)
    expect(body.indexOf('page content')).toBeLessThan(body.lastIndexOf('<div class="wf-slot">'))
    expect(body).toContain('<div class="wf-slot"></div>')
  })

  it('marks a hosted screen whose viewport disagrees with its shell', () => {
    const html = renderSite(
      parse(`layout app { slot }
page "A" id=a uses=app viewport="1280x800" { text "a" }
page "B" id=b uses=app viewport="390x844" { text "b" }`),
    )

    expect(html).toContain('data-viewport-width="1280"')
    expect(html).toContain('data-wf-viewport-conflict="390x844"')
  })

  it('renders a document with no pages at all', () => {
    const html = renderSite(parse('layout app { slot }'))

    expect(html).toContain('data-screen-count="0"')
    expect(count(html, 'data-screen="')).toBe(0)
  })
})

describe('renderSite — active is derived, never authored', () => {
  it('emits no active class of its own on shell chrome', () => {
    const html = renderSite(parse(TWO_SHELLED_PAGES))
    const shell = html.slice(
      html.indexOf('<div class="wf-page wf-shell"'),
      html.indexOf('<div class="wf-slot">'),
    )

    // Nothing in the emitted shell says which screen is current. The runtime
    // decides, from the target each item already carries.
    expect(shell).not.toContain('wf-nav-link-active')
    expect(shell).toContain('data-navigate="home"')
    expect(shell).toContain('data-navigate="settings"')
  })

  it('ships a runtime that derives the class from the current screen', () => {
    const html = renderSite(parse(TWO_SHELLED_PAGES))

    expect(html).toContain("var NAV_ACTIVE = P + '-nav-link-active'")
    expect(html).toContain('function markActive(key)')
  })
})

describe('renderSite — the runtime is safe to embed', () => {
  it('cannot be closed early by a page name', () => {
    const html = renderSite(parse('page "</script><b>x" { text "a" }'))

    expect(count(html, '</script>')).toBe(1)
    expect(html).toContain('\\u003C/script>')
  })
})

describe('renderSite is additive', () => {
  it('leaves render() and renderToHtml() untouched', () => {
    const doc = parse('page "홈" viewport="1280x800" { text "home" }')
    const before = { html: render(doc).html, standalone: renderToHtml(doc) }

    renderSite(doc)

    expect(render(doc).html).toBe(before.html)
    expect(renderToHtml(doc)).toBe(before.standalone)
  })

  it('does not invent an edge the page renderer refuses to emit', () => {
    // `row` does not carry interaction intent, so `row navigate=` parses and
    // renders to nothing — a silent loss the corpus still contains twice
    // (`swapgrid-{2026-07-26,preremoval}/rider-map/v1.wf:5`). Composing those
    // pages into one navigable document is exactly the situation where a
    // renderer would be tempted to make the click work after all; doing so would
    // convert a visible defect into a feature and remove the reason to fix it.
    const doc = parse(`page "지도" viewport="375x812" {
  row gap=3 navigate="상세" { text "A규격" }
}
page "상세" viewport="375x812" { text "detail" }`)

    // Over the markup only: the runtime names the attribute in its selectors,
    // which says nothing about whether any element carries it.
    expect(bodyOf(renderSite(doc))).not.toContain('data-navigate')
    expect(render(doc).html).not.toContain('data-navigate')
  })

  it('does not let a layout definition become a screen in the other renderers', () => {
    // Before reuse definitions were excluded, this rendered two boards: the
    // page and the layout, and `render` treated the document as multi-page.
    const doc = parse(`layout app { header { title "H" } slot }
page "홈" viewport="1280x800" { text "home" }`)

    expect(count(render(doc).html, 'class="wf-page"')).toBe(1)
    expect(render(doc).html).not.toContain('wf-canvas')
  })
})

/**
 * The gutter around the boards may not come out of the board's own width.
 *
 * `body` is a block box, so its `width: auto` resolves to the viewport minus
 * its own horizontal padding. `padding: 24px` therefore made the containing
 * block 1440 - 24*2 = 1392px wide, while a board authored for the 1440px
 * desktop viewport is a 1440px `.wf-page` that must not shrink (`flex-shrink:
 * 0`, the fixed-layout invariant in no-responsive.md). The board overhung its
 * parent by 24px on each side and every desktop document scrolled sideways —
 * measured in a real browser as `.wf-site` 1392px against a 1440px shell,
 * `scrollWidth - clientWidth === 24`.
 *
 * `box-sizing` cannot fix it: it reinterprets an *explicit* width, and `auto`
 * is not one. The gutter therefore stays only on the vertical axis, where a
 * document scrolls by nature and the leading is free, and comes off the
 * horizontal one, where every pixel it takes is a pixel the board gives back.
 */
describe('the horizontal gutter never narrows the board', () => {
  it('leaves the body content box the full viewport width', () => {
    const html = renderSite(parse('page "Wide" id=wide viewport="1440x900" { text "hi" }'))

    // The board's own rule, anchored to the line start so the `html, body`
    // reset above it (whose padding is 0) is not what gets read.
    const body = /^body \{([^}]*)\}/m.exec(html.slice(0, html.indexOf('/* wireweave')))?.[1] ?? ''
    expect(body).not.toBe('')

    // Vertical leading is kept; horizontal padding is what stole the width.
    expect(body).toMatch(/padding:\s*24px 0\s*;?/)
    // The defect, exactly: a uniform padding (or any non-zero horizontal one)
    // subtracts from the width the fixed-size board is laid out in.
    expect(body).not.toMatch(/padding:\s*24px\s*;/)
  })

  it('lays the board out at exactly its authored viewport width', () => {
    const html = renderSite(parse('page "Wide" id=wide viewport="1440x900" { text "hi" }'))

    // The board keeps the authored width — the fix must not have shrunk it to
    // fit, which would trade a scrollbar for a violated fixed-layout invariant.
    expect(html).toContain('width: 1440px')
    expect(html).toMatch(/data-viewport-width="1440"/)
  })
})
