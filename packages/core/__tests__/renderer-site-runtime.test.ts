/**
 * The inline runtime of a `renderSite` document, executed.
 *
 * `renderer-site.test.ts` asserts what the composed *markup* is. This file
 * asserts what the shipped *script* does with it, on a DOM small enough to run
 * in the node test environment (`helpers/dom.ts`).
 *
 * The property under test is a path, not a result. A `navigate` target that is a
 * URL is judged once, at render time, and arrives as `EXTERNAL_NAVIGATE_ATTR`;
 * the runtime branches on that marker and never re-derives "is this a URL" from
 * the string. Asserting only that a marked click changes no screen would pass
 * just as well if the runtime looked the target up and found nothing — so every
 * assertion here is about the *lookup not being attempted*: the element's target
 * is never read at all.
 *
 * That distinction is only observable when the registry would have answered, so
 * the fixture is built so it does: a page whose `id` is itself URL-shaped
 * (`id="/docs"`) is a real, addressable screen, and the elements pointing at
 * `/docs` would reach it the moment the marker stopped being honoured.
 */

import { describe, it, expect } from 'vitest'
import { parse, renderSite, buildSiteModel } from '../src'
import { EXTERNAL_NAVIGATE_ATTR, INTERACTIVE_ATTR_NAMES } from '../src/renderer/html/interactive'
import { runRuntime } from './helpers/dom'
import type { Element, RuntimeHost } from './helpers/dom'

const [NAVIGATE_ATTR] = INTERACTIVE_ATTR_NAMES

/**
 * A document where the URL-shaped target `/docs` also names a screen.
 *
 * Three elements point at it, and the renderer treats each differently:
 * - the nav anchor gets it as an `href` and no `data-navigate` at all;
 * - the shell button and the in-screen button keep it as `data-navigate` and
 *   carry the marker, because a `<button>` has no `href` to move it into.
 */
const SOURCE = `
layout app {
  header {
    title "Acme"
    nav [
      { label="Home" navigate="home" }
      { label="Docs" navigate="/docs" }
    ]
    button "Docs" navigate="/docs"
  }
  slot
}
page "홈" id=home uses=app viewport="1280x800" {
  button "Read docs" navigate="/docs"
}
page "안내" id="/docs" uses=app viewport="1280x800" { text "docs body" }
`

const DOC = parse(SOURCE)

/** The rendered document, optionally with every marker stripped from it. */
function site(options: { withMarker: boolean } = { withMarker: true }): string {
  const html = renderSite(DOC)
  return options.withMarker
    ? html
    : html.replace(new RegExp(` ${EXTERNAL_NAVIGATE_ATTR}="[^"]*"`, 'g'), '')
}

/** Run a rendered document's own script against its own markup. */
function boot(html: string): RuntimeHost {
  const script = html.slice(
    html.indexOf('<script>') + '<script>'.length,
    html.lastIndexOf('</script>'),
  )
  return runRuntime(script, html)
}

/** Which screen the runtime says is current. */
function currentScreen(host: RuntimeHost): string | null {
  const root = host.root.querySelector('.wf-site')
  expect(root).not.toBeNull()
  return (root as Element).getAttribute('data-current-screen')
}

/** The `<button>` inside a screen host, i.e. page content rather than chrome. */
function inScreenButton(host: RuntimeHost): Element {
  const found = host.root
    .querySelectorAll(`[${NAVIGATE_ATTR}]`)
    .find((el) => el.tag === 'button' && el.closest('[data-screen]') !== null)
  expect(found, 'fixture must contain a button inside a screen').toBeDefined()
  return found as Element
}

/** The `<button>` in the shell's header, i.e. chrome shared by every screen. */
function chromeButton(host: RuntimeHost): Element {
  const found = host.root
    .querySelectorAll(`[${NAVIGATE_ATTR}]`)
    .find((el) => el.tag === 'button' && el.closest('[data-screen]') === null)
  expect(found, 'fixture must contain a button in the shell chrome').toBeDefined()
  return found as Element
}

describe('the fixture is not a vacuum', () => {
  it('registers the URL-shaped name as a real, addressable screen', () => {
    const names = buildSiteModel(DOC).names

    // If this were absent, "no screen change" would prove nothing: the lookup
    // would have failed anyway and the marker would be doing no work.
    expect(names.get('/docs')).toBe(1)
    expect(names.get('home')).toBe(0)
  })

  it('emits the target on non-anchors and moves it into the href on anchors', () => {
    const html = site()

    expect(html).toContain(
      `<button class="wf-button" ${NAVIGATE_ATTR}="/docs" ${EXTERNAL_NAVIGATE_ATTR}="${EXTERNAL_NAVIGATE_ATTR}">`,
    )
    // The anchor spends its target on the href, so there is nothing left to
    // mark — and nothing for the runtime to see either.
    expect(html).toContain('<a class="wf-nav-link" href="/docs">')
    expect(html).not.toContain(`href="/docs" ${NAVIGATE_ATTR}`)
  })

  it('shows the entry screen once booted', () => {
    expect(currentScreen(boot(site()))).toBe('0')
  })
})

describe('a marked target is not looked up — the path differs, not just the result', () => {
  it('never reads the target of a marked element that was clicked', () => {
    const host = boot(site())
    const button = inScreenButton(host)

    const event = host.dispatch('click', { target: button })

    // The decisive assertion: the value was never fetched, so no lookup was
    // attempted. A runtime that resolved and discarded would have read it.
    expect(button.reads).not.toContain(NAVIGATE_ATTR)
    expect(event.prevented).toBe(false)
    expect(currentScreen(host)).toBe('0')
    expect(host.location.hash).toBe('')
  })

  it('resolves that very target the moment the marker is gone', () => {
    const host = boot(site({ withMarker: false }))
    const button = inScreenButton(host)

    const event = host.dispatch('click', { target: button })

    // Same document, same string, same click. Only the marker changed — and the
    // registry answered, which is what the marked run declined to ask.
    expect(button.reads).toContain(NAVIGATE_ATTR)
    expect(event.prevented).toBe(true)
    expect(currentScreen(host)).toBe('1')
  })

  it('still navigates a target that names a page', () => {
    const host = boot(site())
    const link = host.root
      .querySelectorAll(`[${NAVIGATE_ATTR}]`)
      .find((el) => el.tag === 'a') as Element

    // Reach the other screen the only way the marker leaves open — the fragment —
    // so the click below is a real move rather than a no-op onto itself.
    host.location.hash = '#/docs'
    host.dispatch('hashchange', { target: link })
    expect(currentScreen(host)).toBe('1')

    const event = host.dispatch('click', { target: link })

    expect(link.reads).toContain(NAVIGATE_ATTR)
    expect(event.prevented).toBe(true)
    expect(currentScreen(host)).toBe('0')
    expect(host.location.hash).toBe('home')
  })
})

describe('derived active skips a marked target the same way', () => {
  it('never reads the target of marked shell chrome', () => {
    const host = boot(site())
    const button = chromeButton(host)

    // markActive runs on every show, including the boot show.
    expect(button.reads).toEqual([])
    expect(button.className).not.toContain('wf-nav-link-active')
  })

  it('would have marked it active without the marker, which is why the skip counts', () => {
    const host = boot(site({ withMarker: false }))
    const button = chromeButton(host)

    // `/docs` resolves to screen 1, so showing it makes this chrome button the
    // "current" one as far as an unguarded markActive is concerned.
    host.dispatch('click', { target: inScreenButton(host) })

    expect(currentScreen(host)).toBe('1')
    expect(button.reads).toContain(NAVIGATE_ATTR)
    expect(button.className).toContain('wf-nav-link-active')
  })

  it('derives active for the screen actually shown', () => {
    const host = boot(site())
    const homeLink = host.root
      .querySelectorAll(`[${NAVIGATE_ATTR}]`)
      .find((el) => el.tag === 'a') as Element

    expect(homeLink.className).toContain('wf-nav-link-active')
  })
})

describe('the runtime carries no copy of the URL rule', () => {
  it('resolves names against the registry and nothing else', () => {
    const html = site()
    const start = html.indexOf('function resolve(')
    const body = html.slice(start, html.indexOf('\n  }', start))

    expect(start).toBeGreaterThan(0)
    expect(body).toContain('R.names')
    // The shape tests `isUrlTarget` performs — a leading `/`, `#` or `?`, and an
    // RFC 3986 scheme — have no counterpart here. If one ever appears, the rule
    // has two homes again and they can disagree.
    expect(body).not.toMatch(/startsWith|charAt|indexOf|A-Za-z/)
  })

  it('reads the marker only as a boolean', () => {
    const html = site()
    const script = html.slice(html.indexOf('<script>'))

    // `getAttribute` on the marker would mean the runtime cared about its value;
    // it has none — it qualifies the target beside it.
    expect(script).not.toContain(`getAttribute("${EXTERNAL_NAVIGATE_ATTR}")`)
    expect(script).toContain(`hasAttribute("${EXTERNAL_NAVIGATE_ATTR}")`)
  })
})
