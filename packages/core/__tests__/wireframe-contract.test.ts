import { describe, expect, it } from 'vitest'
import { documentPages, parse, render } from '../src'

describe('pixel-faithful neutral wireframe contract', () => {
  const source = (markerColor: 'blue' | 'red') => `
    page "Checkout" viewport="390x844" {
      relative {
        card at(24, 48) w=320 h=180 p=16px border {
          row gap=12px {
            placeholder w=120 h=80
            button "Continue" w=160 h=40
          }
        }
        marker 1 color=${markerColor}
      }
      annotations {
        item 1 "Checkout form"
      }
    }
  `

  it('preserves declared viewport and CSS-pixel geometry', () => {
    const document = parse(source('blue'))
    const page = documentPages(document)[0]

    expect(page.viewport).toBe('390x844')
    const relative = page.children[0]
    if (!relative || relative.type !== 'Relative')
      throw new Error('expected relative geometry container')
    expect(relative.children[0]).toMatchObject({
      x: 24,
      y: 48,
      w: 320,
      h: 180,
      p: { value: 16, unit: 'px' },
    })

    const { html } = render(document, { annotationStyle: 'neutral' })
    expect(html).toContain('width: 390px; height: 844px')
    expect(html).toContain('position: absolute; left: 24px; top: 48px; width: 320px; height: 180px')
    expect(html).toContain('padding: 16px')
    expect(html).toContain('gap: 12px')
    expect(html).toContain('width: 120px; height: 80px')
    expect(html).toContain('width: 160px; height: 40px')
  })

  it('preserves the legacy annotation presentation by default', () => {
    const blue = render(parse(source('blue')))
    const red = render(parse(source('red')))

    expect(blue.html).toContain('background: #3b82f6')
    expect(blue.css).toContain('background: #3b82f6')
    expect(red.html).toContain('background: #ef4444')
    expect(red).not.toEqual(blue)
  })

  it('normalizes marker color choices in explicit neutral mode', () => {
    const blue = render(parse(source('blue')), { annotationStyle: 'neutral' })
    const red = render(parse(source('red')), { annotationStyle: 'neutral' })

    expect(red).toEqual(blue)
    expect(blue.html).toContain('background: #000000')
    expect(blue.css).toContain('background: #000000')
    expect(blue.html).not.toMatch(/#(?:3b82f6|2563eb|ef4444|dc2626)/i)
    expect(blue.css).not.toMatch(/#(?:3b82f6|2563eb|ef4444|dc2626)/i)
  })
})
