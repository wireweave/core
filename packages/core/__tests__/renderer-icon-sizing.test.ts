import { describe, it, expect } from 'vitest'

import { parse } from '../src/parser'
import { render, renderSite } from '../src/renderer'

/**
 * Every rendered glyph must be SIZED by something the same output carries.
 *
 * `renderIconSvg` discards its `size` argument on purpose — sizing moved from
 * the SVG's `width`/`height` attributes to CSS, so a caller states the size by
 * choosing the class it passes. Nothing enforced the other half of that
 * bargain, and two callers (`Alert`, `Input`) passed a class that only carries
 * placement. A viewBox-only SVG has no intrinsic size, so as a flex item it
 * grew to fill its parent — 1370px in a real demo — and `flex-shrink: 0` on the
 * same class then refused to give the space back, squeezing the message beside
 * it into a one-character vertical column.
 *
 * Every gate this repo owns counted strings, so all of them stayed green while
 * the screen was unusable. This one asserts the property that was actually
 * violated: for each `<svg>` the renderer emits, either the tag carries an
 * explicit `width`, or one of its classes is sized by the CSS emitted ALONGSIDE
 * it. Reading the size rules out of the same output is the point — a test that
 * hard-codes the known class names would pass the day a third caller invents a
 * fourth one.
 */

/** Class names the given CSS gives a `width` to, for `.x` and `svg.x` alike. */
function sizedClasses(css: string): Set<string> {
  const sized = new Set<string>()
  // Selector list up to the block, then the block — good enough for the
  // generated stylesheet, which is plain flat rules with no at-rule nesting
  // around the icon sizing.
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!/(^|[\s;])width\s*:/.test(body)) continue
    for (const selector of selectors.split(',')) {
      // The LAST class in a descendant selector is the element being sized;
      // `.wf-button svg.wf-icon` sizes `wf-icon`, not `wf-button`.
      const subject = selector.trim().split(/\s+/).pop() ?? ''
      for (const [, name] of subject.matchAll(/\.([A-Za-z0-9_-]+)/g)) sized.add(name)
    }
  }
  return sized
}

/** Every `<svg …>` open tag in the html, as `{ classes, hasWidthAttr }`. */
function svgTags(html: string): { classes: string[]; hasWidthAttr: boolean; tag: string }[] {
  return [...html.matchAll(/<svg\b[^>]*>/g)].map(([tag]) => ({
    tag,
    hasWidthAttr: /\swidth\s*=/.test(tag),
    classes: (/\sclass="([^"]*)"/.exec(tag)?.[1] ?? '').split(/\s+/).filter(Boolean),
  }))
}

function unsizedGlyphs(html: string, css: string): string[] {
  const sized = sizedClasses(css)
  return svgTags(html)
    .filter((svg) => !svg.hasWidthAttr && !svg.classes.some((c) => sized.has(c)))
    .map((svg) => svg.classes.join(' ') || '(no class)')
}

/** One page carrying every component that can render a glyph. */
const SOURCE = `page "Icons" id=icons {
  alert "정보" icon="info" variant=info
  alert "경고" icon="triangle-alert" variant=warning
  alert "알 수 없는 이름" icon="definitely-not-a-lucide-icon"
  input label="검색" placeholder="검색어" icon="search"
  input label="알 수 없는" icon="definitely-not-a-lucide-icon"
  button "확인" icon="check"
  badge "새로움" icon="star"
  icon "star"
  nav { item "홈" icon="house" }
}`

describe('rendered glyphs are sized by the output that carries them', () => {
  it('render(): no <svg> is left without a width attribute AND without a sized class', () => {
    const { html, css } = render(parse(SOURCE))

    // Control: the check can fail. Strip the base sizing rule and the same
    // document must report glyphs — otherwise `sizedClasses` is matching
    // everything and the assertion below is vacuous.
    const withoutBase = css.replace(/svg\.wf-icon\s*\{[^}]*\}/g, '')
    expect(unsizedGlyphs(html, withoutBase).length).toBeGreaterThan(0)

    expect(unsizedGlyphs(html, css)).toEqual([])
  })

  it('reds on the exact markup that shipped, and names the class at fault', () => {
    const { html, css } = render(parse(SOURCE))
    // The defect verbatim: the glyph keeps its placement class and loses the
    // sizing one. Asserting the substitution applied keeps this from decaying
    // into a test of an empty edit if the class string is ever renamed.
    const asShipped = html.replaceAll('class="wf-icon wf-alert-icon"', 'class="wf-alert-icon"')
    expect(asShipped).not.toBe(html)

    // Red is not enough — the report has to point at the cause, because the
    // remedy differs per class (size the class, or pass the sized one).
    expect(unsizedGlyphs(asShipped, css)).toContain('wf-alert-icon')
  })

  it('renderSite(): the same holds for the composed single-document output', () => {
    const doc = renderSite(parse(SOURCE))
    // The site emits one document; read its inline stylesheet back out of it.
    const css = [...doc.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    expect(css.length).toBeGreaterThan(0)

    expect(unsizedGlyphs(doc, css)).toEqual([])
  })
})
