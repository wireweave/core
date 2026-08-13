import { describe, expect, it } from 'vitest'
import { anchorIntent, parse, render } from '../src'

describe('anchorIntent public renderer contract', () => {
  it('keeps a page target in data-navigate on an inert anchor', () => {
    const intent = anchorIntent({ navigate: 'Settings', opens: 'menu' })

    expect(intent.href).toBe('#')
    expect(intent.attrs['data-navigate']).toBe('Settings')
    expect(intent.attrs['data-opens']).toBe('menu')
    expect(intent.attrs['data-navigate-external']).toBeUndefined()
  })

  it('moves a URL target into href when no authored href exists', () => {
    const intent = anchorIntent({ navigate: ' https://example.com/docs ' })

    expect(intent.href).toBe('https://example.com/docs')
    expect(intent.attrs['data-navigate']).toBeUndefined()
    expect(intent.attrs['data-navigate-external']).toBeUndefined()
  })

  it('preserves an authored href and the separate declared navigate intent', () => {
    const intent = anchorIntent({ href: '/authored', navigate: 'https://example.com/docs' })

    expect(intent.href).toBe('/authored')
    expect(intent.attrs['data-navigate']).toBe('https://example.com/docs')
    expect(intent.attrs['data-navigate-external']).toBe(true)
  })
})

describe('anchor renderers use the public decision', () => {
  const markup = render(
    parse(`
page "Home" {
  link "Docs" navigate="https://example.com/docs"
  nav [{ label="Settings" navigate="Settings" }]
  breadcrumb [{ label="Home" navigate="Home" }, { label="Current" navigate="Settings" }]
  dropdown { item "Account" navigate="Settings" }
}
page "Settings" { text "Settings" }
`),
  ).html

  it('moves a Link URL to href without a duplicate data-navigate', () => {
    expect(markup).toContain('<a class="wf-link" href="https://example.com/docs">Docs</a>')
    expect(markup).not.toContain('data-navigate="https://example.com/docs"')
  })

  it('keeps page targets on nav, breadcrumb, and dropdown output', () => {
    expect(markup).toContain('<a class="wf-nav-link" href="#" data-navigate="Settings">')
    expect(markup).toContain(
      '<span class="wf-breadcrumb-item" aria-current="page" data-navigate="Settings">Current</span>',
    )
    expect(markup).toContain('<a class="wf-dropdown-item" href="#" data-navigate="Settings">')
  })
})
