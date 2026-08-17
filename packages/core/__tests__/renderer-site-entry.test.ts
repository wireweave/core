/**
 * Which screen a composed document opens on.
 *
 * `buildSiteModel` answers "what does this document say", and a document says
 * nothing about where a *reader* should start — so the model's entry is the
 * first page in document order and the choice belongs to the caller. A studio
 * that lets an author mark a start screen has that choice in hand and, before
 * this option existed, had nowhere to put it: the composed file always opened
 * on whichever page happened to be first.
 *
 * The option is a screen *name*, not an index, because an index is a fact about
 * document order — the one thing a caller holding a screen name does not know,
 * and the thing that changes when an unrelated page is added.
 */

import { describe, it, expect } from 'vitest'
import { parse, renderSite } from '../src'
import { runRuntime } from './helpers/dom'
import type { RuntimeHost } from './helpers/dom'

/** Three screens, each addressable by both `id` and `title`. */
const SOURCE = `
page "First screen" id=first viewport="1280x800" {
  button "to second" navigate="Second screen"
}
page "Second screen" id=second viewport="1280x800" {
  button "to third" navigate="Third screen"
}
page "Third screen" id=third viewport="1280x800" {
  text "the end"
}
`

const DOC = parse(SOURCE)

/** Run a rendered document's own script against its own markup. */
function boot(html: string): RuntimeHost {
  const script = html.slice(
    html.indexOf('<script>') + '<script>'.length,
    html.lastIndexOf('</script>'),
  )
  return runRuntime(script, html)
}

/**
 * The screen index the document actually opened on.
 *
 * Read from the DOM the runtime wrote rather than from the registry JSON: the
 * registry is what the renderer *said*, and the point of the option is what the
 * document *does* when it is opened with no fragment.
 */
function openedOn(html: string): string | null {
  const host = boot(html)
  const site = host.root.querySelector('[data-screen-count]')
  return site === null ? null : site.getAttribute('data-current-screen')
}

describe('the entry option is inert unless used', () => {
  it('renders byte-identically with no option, an empty option bag, and a blank name', () => {
    // Every existing caller passes one of these three, so all three must be the
    // document that shipped before the option existed — not merely equivalent.
    const bare = renderSite(DOC)

    expect(renderSite(DOC, {})).toBe(bare)
    expect(renderSite(DOC, { entry: '' })).toBe(bare)
    expect(renderSite(DOC, { entry: '   ' })).toBe(bare)
  })

  it('opens on the first page in document order by default', () => {
    expect(openedOn(renderSite(DOC))).toBe('0')
  })

  it('changes the document when a name IS given', () => {
    // The non-vacuity control for the test above: the three equalities are a
    // measurement only if the code path they exercise can produce a difference.
    expect(renderSite(DOC, { entry: 'Third screen' })).not.toBe(renderSite(DOC))
  })
})

describe('the entry option names a screen the way everything else does', () => {
  it('opens on a screen named by title', () => {
    expect(openedOn(renderSite(DOC, { entry: 'Second screen' }))).toBe('1')
  })

  it('opens on a screen named by id', () => {
    // One resolution rule, every consumer: the same string in a `navigate=`, in
    // a URL fragment, and here all land on the same screen.
    expect(openedOn(renderSite(DOC, { entry: 'third' }))).toBe('2')
  })

  it('lets a fragment override the opening screen afterwards', () => {
    const host = boot(renderSite(DOC, { entry: 'Third screen' }))
    const site = host.root.querySelector('[data-screen-count]')

    expect(site?.getAttribute('data-current-screen')).toBe('2')

    host.location.hash = '#first'
    host.dispatch('hashchange', { target: host.root })

    // The option decides where a reader with no fragment lands; it does not
    // outrank a fragment, which is the reader asking for a specific screen.
    expect(site?.getAttribute('data-current-screen')).toBe('0')
  })
})

describe('a name that addresses no screen', () => {
  it('falls back to document order rather than opening nothing', () => {
    expect(openedOn(renderSite(DOC, { entry: 'no such screen' }))).toBe('0')
  })

  it('marks the unmet request on the site container', () => {
    // Same treatment as an unmet `uses=`: the request stays visible in the
    // artefact instead of disappearing silently between the call and the HTML.
    // A caller that misspelled a screen name gets a document that says so.
    expect(renderSite(DOC, { entry: 'no such screen' })).toContain(
      'data-wf-entry-unresolved="no such screen"',
    )
  })

  it('marks nothing when the name resolves', () => {
    expect(renderSite(DOC, { entry: 'Second screen' })).not.toContain('data-wf-entry-unresolved')
    expect(renderSite(DOC)).not.toContain('data-wf-entry-unresolved')
  })

  it('escapes the unmet name into the attribute', () => {
    expect(renderSite(DOC, { entry: 'a "quoted" <name>' })).toContain(
      'data-wf-entry-unresolved="a &quot;quoted&quot; &lt;name&gt;"',
    )
  })
})

describe('the document title follows the entry screen', () => {
  it('defaults to the entry page’s title rather than the first page’s', () => {
    // `title` was already documented as "the entry page's title". Leaving it on
    // screen 0 while the document opens on another would make a file whose tab
    // names a screen the reader is not looking at.
    expect(renderSite(DOC, { entry: 'Second screen' })).toContain('<title>Second screen</title>')
    expect(renderSite(DOC)).toContain('<title>First screen</title>')
  })

  it('still lets an explicit title win', () => {
    expect(renderSite(DOC, { entry: 'Second screen', title: 'Prototype' })).toContain(
      '<title>Prototype</title>',
    )
  })
})
