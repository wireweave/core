import { Script } from 'node:vm'
import { describe, expect, it } from 'vitest'
import {
  buildSiteModel,
  documentPages,
  parse,
  printWireframe,
  render,
  renderSite,
  validate,
} from '../src'

const SITE_SOURCE = `
layout app {
  header { title "Acme" }
  slot
  footer { text "Footer" }
}

page "Home" id=home uses=app viewport="800x600" {
  text "Home content"
  modal "Confirm" id=confirm { text "Are you sure?" }
}

page "Settings" id=settings uses=app viewport="800x600" {
  text "Settings content"
  modal "Confirm" id=confirm { text "Change settings?" }
}
`

describe('named page layouts', () => {
  it('parses definitions separately from page screens', () => {
    const doc = parse(SITE_SOURCE)

    expect(doc.children.map((child) => child.type)).toEqual(['Layout', 'Page', 'Page'])
    expect(doc.children[0]).toMatchObject({ type: 'Layout', name: 'app' })
    expect(doc.children[0].children.map((child) => child.type)).toContain('Slot')
    expect(documentPages(doc)).toHaveLength(2)
    expect(documentPages(doc)[0]).toMatchObject({ id: 'home', uses: 'app' })
    expect(validate(doc).valid).toBe(true)
  })

  it('prints layout, slot, and page uses syntax back to parseable source', () => {
    const printed = printWireframe(parse(SITE_SOURCE))

    expect(printed).toContain('layout app {')
    expect(printed).toContain('slot')
    expect(printed).toContain('uses=app')
    expect(parse(printed).children.map((child) => child.type)).toEqual(['Layout', 'Page', 'Page'])
  })

  it('keeps the page-only renderer free of layout definitions', () => {
    const result = render(parse(SITE_SOURCE))

    expect(result.html).toContain('Home content')
    expect(result.html).not.toContain('data-layout="app"')
    expect(result.html).not.toContain('class="wf-slot"')
  })
})

describe('renderSite', () => {
  it('hosts shared-layout screens and scopes repeated authored ids', () => {
    const html = renderSite(parse(SITE_SOURCE))

    expect(html).toContain('class="wf-site"')
    expect(html).toContain('data-screen-count="2"')
    expect(html).toContain('data-shell-count="1"')
    expect(html).toContain('data-layout="app"')
    expect(html).toContain('class="wf-slot"')
    expect(html).toContain('data-id-scope="s0-"')
    expect(html).toContain('data-id-scope="s1-"')
    expect(html).toContain('id="s0-confirm"')
    expect(html).toContain('id="s1-confirm"')
    expect(html).not.toContain('id="confirm"')
    expect(html).toContain('data-current-screen')

    const script = html.slice(
      html.indexOf('<script>') + '<script>'.length,
      html.lastIndexOf('</script>'),
    )
    expect(() => new Script(script)).not.toThrow()
  })

  it('lets page ids take precedence over an earlier colliding title', () => {
    const doc = parse(`
      page "settings" id=home { text "Home" }
      page "Dashboard" id=settings { text "Settings" }
    `)
    const model = buildSiteModel(doc)

    expect(model.names.get('settings')).toBe(1)
    expect(model.names.get('home')).toBe(0)
    expect(model.screens[0].name).toBe('home')
    expect(model.screens[1].name).toBe('settings')
  })
})
