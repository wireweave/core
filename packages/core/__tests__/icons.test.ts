/**
 * Icon resolution + unknown-icon render-fallback tests.
 *
 * Covers the alias repair (legacy `more-*` / `dots-*` names → real Lucide
 * `ellipsis` keys) and the generic unknown-icon placeholder shared by the
 * icon node, button, and input renderers (no raw DSL name leaks as text).
 */

import { describe, it, expect } from 'vitest'
import { getIconData } from '../src'
import { parse } from '../src'
import { render } from '../src/renderer'

describe('getIconData alias resolution', () => {
  it('resolves "more-vertical" to the ellipsis-vertical glyph', () => {
    const data = getIconData('more-vertical')
    expect(data).toBeDefined()
    expect(data).toBe(getIconData('ellipsis-vertical'))
  })

  it('resolves "more-horizontal" to the ellipsis glyph', () => {
    const data = getIconData('more-horizontal')
    expect(data).toBeDefined()
    expect(data).toBe(getIconData('ellipsis'))
  })

  it('resolves the repaired "dots" / "dots-vertical" shorthands', () => {
    expect(getIconData('dots')).toBe(getIconData('ellipsis'))
    expect(getIconData('dots-vertical')).toBe(getIconData('ellipsis-vertical'))
  })

  it('returns undefined for a genuinely unknown name', () => {
    expect(getIconData('definitely-not-an-icon')).toBeUndefined()
  })
})

describe('unknown-icon render fallback', () => {
  const PLACEHOLDER_MARKERS = ['stroke-dasharray="4 2"', '>?</text>']

  it('button with unknown icon renders the "?" placeholder, not [name]', () => {
    const doc = parse('page { button "" icon="definitely-not-an-icon" }')
    const { html } = render(doc)

    for (const marker of PLACEHOLDER_MARKERS) {
      expect(html).toContain(marker)
    }
    expect(html).toContain('title="Unknown icon: definitely-not-an-icon"')
    expect(html).not.toContain('[definitely-not-an-icon]')
  })

  it('input with unknown icon renders the "?" placeholder, not [name]', () => {
    const doc = parse('page { input "Email" icon="definitely-not-an-icon" }')
    const { html } = render(doc)

    for (const marker of PLACEHOLDER_MARKERS) {
      expect(html).toContain(marker)
    }
    expect(html).toContain('title="Unknown icon: definitely-not-an-icon"')
    expect(html).not.toContain('[definitely-not-an-icon]')
  })

  it('button with a now-aliased "more-vertical" renders a real glyph, not the placeholder', () => {
    const doc = parse('page { button "" icon="more-vertical" }')
    const { html } = render(doc)

    expect(html).not.toContain('>?</text>')
    expect(html).not.toContain('[more-vertical]')
    expect(html).not.toContain('Unknown icon:')
    // Real Lucide svg path/elements present
    expect(html).toContain('<svg')
  })
})
