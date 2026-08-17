/**
 * Id uniqueness in a composed document.
 *
 * An authored `id` is unique inside the page that declares it, which is all a
 * page needs while it is a document of its own. `renderSite` puts every page of
 * a document into one file, and two screens declaring `confirm` then produce two
 * elements with the same id.
 *
 * ## What that costs, precisely
 *
 * Not the picture: both modals render, and both open on the right click — the
 * runtime finds an overlay by searching the active screen's own subtree, so it
 * never had to tell the two apart by id. What breaks is everything that reads
 * the document rather than clicking it. `#confirm` from outside resolves to an
 * arbitrary one, devtools and `getElementById` answer with the first, and the
 * accessibility tree treats an `aria-*` reference as naming one element. A
 * duplicate id is a lie the document tells its readers while looking right.
 *
 * The behavioural tests below therefore assert that scoping **did not break**
 * what already worked, and the document tests assert the thing that changed.
 * Claiming a click was fixed here would be claiming a defect that never
 * existed.
 *
 * ## Why the fixture matters
 *
 * The 70-file corpus contains no document where two pages declare the same
 * overlay id, so a gate run against it measures nothing: it would pass on a
 * renderer that scoped nothing at all. The collision is built here on purpose,
 * and {@link duplicateIds} is run against the unscoped path first to prove the
 * instrument sees a duplicate when there is one.
 */

import { describe, it, expect } from 'vitest'
import { parse, render, renderSite } from '../src'
import { INTERACTIVE_ATTR_NAMES } from '../src/renderer/html/interactive'
import { ID_SCOPE_ATTR } from '../src/renderer/site/runtime'
import { runRuntime } from './helpers/dom'
import type { Element, RuntimeHost } from './helpers/dom'

const [, OPENS_ATTR, TOGGLES_ATTR] = INTERACTIVE_ATTR_NAMES

/**
 * Two screens that each declare `confirm`, inside a shell that declares `menu`,
 * plus a third screen that declares its own `menu` over the shell's.
 *
 * Every collision this feature has to survive is present at once: page against
 * page, and page against the shell hosting it.
 */
const SOURCE = `
layout app {
  header {
    title "Acme"
    button "Menu" toggles="menu"
  }
  slot
  drawer "Shell menu" id="menu" { text "from the shell" }
}
page "A" id=a uses=app viewport="1280x800" {
  button "Delete A" opens="confirm"
  modal "Delete A?" id="confirm" { text "from A" }
}
page "B" id=b uses=app viewport="1280x800" {
  button "Delete B" opens="confirm"
  modal "Delete B?" id="confirm" { text "from B" }
}
page "C" id=c uses=app viewport="1280x800" {
  button "Own menu" toggles="menu"
  drawer "Page menu" id="menu" { text "from the page" }
}
`

const DOC = parse(SOURCE)

/** Every `id` value that appears more than once, in first-seen order. */
function duplicateIds(markup: string): string[] {
  const seen = new Map<string, number>()
  const pattern = / id="([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(markup)) !== null) {
    seen.set(match[1], (seen.get(match[1]) ?? 0) + 1)
  }
  return [...seen].filter(([, count]) => count > 1).map(([id]) => id)
}

/** Run a rendered document's own script against its own markup. */
function boot(html: string): RuntimeHost {
  const script = html.slice(
    html.indexOf('<script>') + '<script>'.length,
    html.lastIndexOf('</script>'),
  )
  return runRuntime(script, html)
}

/** The screen host for a page, by the name the model gave it. */
function screenNamed(host: RuntimeHost, name: string): Element {
  const found = host.root.querySelector(`[data-screen-name="${name}"]`)
  expect(found, `fixture must contain a screen named ${name}`).not.toBeNull()
  return found as Element
}

/** The one element inside `scope` carrying `attr`. */
function triggerIn(scope: Element, attr: string): Element {
  const found = scope.querySelectorAll(`[${attr}]`).filter((el) => el.tag === 'button')
  expect(found, `expected one ${attr} button`).toHaveLength(1)
  return found[0]
}

/** Move to a screen the way a fragment does, without going through a click. */
function goTo(host: RuntimeHost, fragment: string): void {
  host.location.hash = `#${fragment}`
  host.dispatch('hashchange', { target: host.root })
}

const CLOSED = 'wf-closed'

describe('the fixture collides, and the instrument sees it', () => {
  it('produces a duplicate id on the unscoped multi-page path', () => {
    // `render` composes the same pages into one HTML string and scopes nothing.
    // Without this line the gate below would pass on a renderer that emitted no
    // ids at all — or on a corpus where no two pages ever agree on a name.
    //
    // Only `confirm` collides here: `render` draws pages and never a layout, so
    // the page-against-shell collision is one that composition alone can make.
    expect(duplicateIds(render(DOC).html)).toEqual(['confirm'])
  })

  it('renders all three screens and both overlay declarations', () => {
    const html = renderSite(DOC)

    expect(html).toContain('from A')
    expect(html).toContain('from B')
    expect(html).toContain('from the shell')
    expect(html).toContain('from the page')
  })
})

describe('renderSite gives each declaring context an id namespace', () => {
  it('emits no duplicate id anywhere in the document', () => {
    expect(duplicateIds(renderSite(DOC))).toEqual([])
  })

  it('scopes an id by the screen that declares it', () => {
    const html = renderSite(DOC)

    expect(html).toContain('id="s0-confirm"')
    expect(html).toContain('id="s1-confirm"')
    expect(html).toContain('id="s2-menu"')
  })

  it('scopes a shell-declared id by the shell, not by any screen using it', () => {
    const html = renderSite(DOC)

    // One shell hosts all three screens, and its drawer exists once. A scheme
    // that scoped it per screen would have to emit it three times to stay
    // unique, which is the byte the shared shell exists to remove.
    expect(html.match(/id="l0-menu"/g)).toHaveLength(1)
  })

  it('never rewrites the authored intent', () => {
    const html = renderSite(DOC)

    // The prefix belongs to identity. `opens` names what its author could see
    // from where they were standing, and rewriting it here would make the
    // wireframe source stop describing the document it produces.
    expect(html.match(new RegExp(`${OPENS_ATTR}="confirm"`, 'g'))).toHaveLength(2)
    expect(html.match(new RegExp(`${TOGGLES_ATTR}="menu"`, 'g'))).toHaveLength(2)
    expect(html).not.toContain(`${OPENS_ATTR}="s0-`)
    expect(html).not.toContain(`${TOGGLES_ATTR}="l0-`)
  })

  it('publishes each scope on the container that owns it', () => {
    const html = renderSite(DOC)

    // The document describes its own scheme, so the runtime composes a scope it
    // read rather than one it re-derived. Two spellings of the same scheme is a
    // drift surface with nothing to keep the halves honest.
    expect(html).toContain(`data-screen="0" data-screen-name="a" ${ID_SCOPE_ATTR}="s0-"`)
    expect(html).toContain(`data-layout="app" ${ID_SCOPE_ATTR}="l0-"`)
  })
})

describe('the runtime still resolves what the author wrote', () => {
  it('opens the declaring screen’s own overlay, not the other screen’s', () => {
    const host = boot(renderSite(DOC))
    goTo(host, 'b')

    const modalB = host.root.querySelector('[id="s1-confirm"]') as Element
    const modalA = host.root.querySelector('[id="s0-confirm"]') as Element

    expect(modalB.className).toContain(CLOSED)
    host.dispatch('click', { target: triggerIn(screenNamed(host, 'b'), OPENS_ATTR) })

    expect(modalB.className).not.toContain(CLOSED)
    // The other screen's identically-named modal is untouched: same authored
    // name, different namespace, and the search never left screen B.
    expect(modalA.className).toContain(CLOSED)
  })

  it('lets a page shadow the shell overlay it shares a name with', () => {
    const host = boot(renderSite(DOC))
    goTo(host, 'c')

    const pageMenu = host.root.querySelector('[id="s2-menu"]') as Element
    const shellMenu = host.root.querySelector('[id="l0-menu"]') as Element

    host.dispatch('click', { target: triggerIn(screenNamed(host, 'c'), TOGGLES_ATTR) })

    // Nearest declaration wins: the screen is searched before its shell, so a
    // page that declares `menu` gets its own and the shell's stays shut.
    expect(pageMenu.className).not.toContain(CLOSED)
    expect(shellMenu.className).toContain(CLOSED)
  })

  it('reaches the shell overlay from a screen that declares no such name', () => {
    const host = boot(renderSite(DOC))
    goTo(host, 'a')

    const shellMenu = host.root.querySelector('[id="l0-menu"]') as Element
    const chrome = host.root
      .querySelectorAll(`[${TOGGLES_ATTR}]`)
      .find((el) => el.closest('[data-screen]') === null) as Element

    host.dispatch('click', { target: chrome })

    // Screen A has no `menu` of its own, so the search falls through to the
    // shell — across two different scopes, from a trigger that spells neither.
    expect(shellMenu.className).not.toContain(CLOSED)
  })

  it('leaves an overlay nothing points at alone', () => {
    const host = boot(renderSite(DOC))
    goTo(host, 'a')

    // Screen A points at `confirm` only. The shell's drawer is pointed at by
    // chrome, so it is closed at init; A's own modal is closed for the same
    // reason. Neither is a claim about the other's scope — this is the init
    // pass proving it visited both namespaces.
    expect((host.root.querySelector('[id="s0-confirm"]') as Element).className).toContain(CLOSED)
    expect((host.root.querySelector('[id="l0-menu"]') as Element).className).toContain(CLOSED)
  })
})
