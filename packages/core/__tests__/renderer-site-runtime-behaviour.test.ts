import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'

import { parse } from '../src/parser'
import { renderSite } from '../src/renderer'

/**
 * The site runtime, EXECUTED — not read.
 *
 * Every other gate in this package inspects the generated script as a string.
 * That is how the defect below shipped: the script contained `preventDefault`
 * four times and every string-counting assertion was green, while the one case
 * that mattered fell through all four.
 *
 * The click handler cancels a click only when it RESOLVES an intent, which is
 * correct for the intent branches — an unresolved intent must not look handled.
 * But a wireframe is mostly anchors with no destination at all (nav labels,
 * tabs, breadcrumbs, bare links); the renderer gives those `INERT_HREF`, and
 * their default action is still a navigation. In the `srcdoc` frame every
 * consumer mounts this output in, that `href` resolves against the EMBEDDER's
 * URL, so the click walks the frame out of the wireframe and loads the host app
 * inside itself. Measured in Chromium on a real 20-screen demo: 44 such anchors,
 * frame URL `about:srcdoc` -> `<host page>#`, host assets refetched.
 *
 * jsdom asserts the mechanism (`defaultPrevented`); the browser probe
 * established the consequence. `preventDefault()` is precisely what separates
 * the two, so this is the property to hold onto in CI.
 */

const SOURCE = `page "홈" id=home {
  nav { item "대시보드" navigate="설정" }
  nav ["개요", "요금", "문의"]
  breadcrumb ["홈", "설정", "알림"]
  link "외부 문서" href="https://example.com/docs"
  link "설정으로" navigate="설정"
}

page "설정" id=settings {
  text "설정 화면"
}`

/** Mount the shipped document and let its own `<script>` run, as a browser would. */
function mount(html: string): JSDOM {
  return new JSDOM(html, { runScripts: 'dangerously', url: 'https://embedder.example/app' })
}

/** Dispatch a real, cancelable click and report whether the runtime stopped it. */
function clickIsPrevented(dom: JSDOM, selector: string): boolean {
  const el = dom.window.document.querySelector(selector)
  if (el === null) throw new Error(`no element matched ${selector}`)
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event.defaultPrevented
}

describe('site runtime: clicks that reach the browser', () => {
  const html = renderSite(parse(SOURCE))

  it('the fixture actually contains the three anchor kinds under test', () => {
    // Without this the assertions below could all be passing on absent elements
    // — `querySelector` returning null throws, but a fixture that quietly stopped
    // producing, say, real hrefs would still leave two green tests and no cover.
    const dom = mount(html)
    const { document } = dom.window
    expect(document.querySelectorAll('a[href="#"]:not([data-navigate])').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('a[href="#"][data-navigate]').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('a[href^="https://"]').length).toBeGreaterThan(0)
  })

  it('an anchor with no destination does not navigate', () => {
    expect(clickIsPrevented(mount(html), 'a[href="#"]:not([data-navigate])')).toBe(true)
  })

  it('an anchor carrying a screen target still navigates in-document', () => {
    // Control for "is the script even running": this one is cancelled by the
    // intent branch, which existed before the guard. If it were false, the
    // test above would prove nothing about the guard.
    const dom = mount(html)
    expect(clickIsPrevented(dom, 'a[href="#"][data-navigate]')).toBe(true)
    expect(
      dom.window.document
        .querySelector('[data-current-screen]')
        ?.getAttribute('data-current-screen'),
    ).not.toBeNull()
  })

  it('a real authored href is left alone — the guard is not "cancel every link"', () => {
    // The renderer decides which anchors have a destination; the runtime reads
    // that decision back. Cancelling this one would make external links dead.
    expect(clickIsPrevented(mount(html), 'a[href^="https://"]')).toBe(false)
  })

  it('without the guard the same click is not prevented (non-vacuity)', () => {
    // Neutralise only the guard's lookup, leaving every other branch intact, and
    // the document must go back to letting the browser navigate. A test of a
    // behaviour has to be able to observe that behaviour's absence.
    const unguarded = html.replace("closest('a[href]')", 'null')
    expect(unguarded).not.toBe(html)
    expect(clickIsPrevented(mount(unguarded), 'a[href="#"]:not([data-navigate])')).toBe(false)
  })
})
