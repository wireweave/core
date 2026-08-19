import { describe, it, expect } from 'vitest'

import { parse } from '../src/parser'
import { render } from '../src/renderer'

/**
 * Every component class the stylesheet styles must reach the markup.
 *
 * `.wf-select` was defined six times — the chevron, the focus ring, the
 * disabled state, the row sizing — and the select renderer emitted
 * `class="wf-input"`. Not one of those six rules ever matched an element. The
 * select instead inherited `.wf-row > .wf-input { flex: 1 1 auto }`, meant for
 * text inputs, and stretched to 858px in a header, pushing its own label and
 * the avatar beside it off the screen.
 *
 * Nothing caught it because every existing assertion checked that `<select>`
 * and its `<option>`s appear. They did. The class the CSS keys on was the part
 * nobody asserted, and a dead rule is silent by construction: the page renders,
 * it just renders wrong.
 *
 * This asserts the property that was violated — for each component class the
 * generated CSS styles, some element in the markup generated ALONGSIDE it
 * carries that class. Reading both sides out of the same render is the point;
 * a hard-coded list of known class names would go stale the moment someone
 * adds a seventh rule for a class no renderer emits.
 */

/** Component class names the given CSS styles, as bare `.x` element subjects. */
function styledClasses(css: string): Set<string> {
  const styled = new Set<string>()
  for (const [, selectors] of css.matchAll(/([^{}]+)\{[^}]*\}/g)) {
    for (const selector of selectors.split(',')) {
      const trimmed = selector.trim()
      // Only rules that name a class at all, and skip at-rule preludes.
      if (trimmed.startsWith('@') || !trimmed.includes('.')) continue
      // The LAST compound in a descendant selector is the element being
      // styled; `.wf-row > .wf-select` styles `wf-select`, not `wf-row`.
      const subject = trimmed.split(/\s+/).pop() ?? ''
      for (const [, name] of subject.matchAll(/\.([A-Za-z0-9_-]+)/g)) styled.add(name)
    }
  }
  return styled
}

/** Every class that appears on any element in the html. */
function markupClasses(html: string): Set<string> {
  const present = new Set<string>()
  for (const [, value] of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const name of value.split(/\s+/).filter(Boolean)) present.add(name)
  }
  return present
}

/**
 * Classes the CSS styles for components exercised by the given source, but
 * which no element carries. Restricted to an explicit watch list: the full
 * stylesheet covers components this page does not use, and states (`:hover`,
 * variants, modifiers) that only appear under interaction or other props.
 */
function deadClasses(html: string, css: string, watch: string[]): string[] {
  const styled = styledClasses(css)
  const present = markupClasses(html)
  return watch.filter((name) => styled.has(name) && !present.has(name))
}

/** One page carrying every form control that has a dedicated element class. */
const SOURCE = `page "Fields" id=fields {
  input label="검색" placeholder="검색어"
  textarea "설명"
  select "현재 프로젝트" ["거시경제 모니터링", "국내 증시 추적"]
  slider "범위"
  checkbox "동의"
  radio "선택"
  switch "알림"
  badge "비공개"
}`

/**
 * The element classes each control is expected to carry. These are contracts,
 * not incidental names: each is the only hook the stylesheet has for that
 * element's own behaviour (a select's chevron and intrinsic width, a
 * textarea's min-height and resize).
 */
const ELEMENT_CLASSES = [
  'wf-input',
  'wf-textarea',
  'wf-select',
  'wf-slider',
  'wf-checkbox',
  'wf-radio',
  'wf-switch',
  'wf-badge',
  'wf-field',
]

describe('styled component classes reach the markup', () => {
  it('no element class is styled by the CSS yet absent from the html', () => {
    const { html, css } = render(parse(SOURCE))

    // Control: the check can fail. Rewrite the select back to the class it
    // shipped with and the same document must report `wf-select` dead —
    // otherwise `styledClasses`/`markupClasses` are matching everything and
    // the assertion below is vacuous.
    const asShipped = html.replace('class="wf-select"', 'class="wf-input"')
    expect(asShipped).not.toBe(html)
    expect(deadClasses(asShipped, css, ELEMENT_CLASSES)).toContain('wf-select')

    expect(deadClasses(html, css, ELEMENT_CLASSES)).toEqual([])
  })

  it('each control carries its own element class', () => {
    const { html } = render(parse(SOURCE))

    expect(html).toContain('<select class="wf-select"')
    expect(html).toContain('<textarea class="wf-textarea"')
    expect(html).toMatch(/<input class="wf-input"/)
  })
})

/**
 * A label and its control are one unit.
 *
 * They were emitted as siblings, so inside a flex row each became an
 * independent flex item: the label landed beside the control rather than above
 * it, and in the e-torch header the label overlapped the nav links.
 */
describe('label and control render as one field', () => {
  it('wraps a labelled select so the pair is a single flex item', () => {
    const { html } = render(parse('page { select "현재 프로젝트" ["A", "B"] }'))

    expect(html).toMatch(
      /<div class="wf-field"><label class="wf-input-label">현재 프로젝트<\/label>\s*<select/,
    )
  })

  it('wraps every labelled control, not just select', () => {
    const cases: [string, string][] = [
      ['page { input label="검색" }', '<input'],
      ['page { textarea "설명" }', '<textarea'],
      ['page { slider "범위" }', '<input'],
      ['page { input label="검색" icon="search" }', '<div class="wf-input-wrapper"'],
    ]

    for (const [source, control] of cases) {
      const { html } = render(parse(source))
      expect(html, source).toMatch(/<div class="wf-field"><label class="wf-input-label">/)
      expect(html, source).toContain(control)
    }
  })

  /**
   * The property the defect actually violated: inside a flex row, no label is
   * a DIRECT child of the row. As a direct child it is an independent flex
   * item and lands beside the control instead of above it — in the e-torch
   * header it overlapped the nav links.
   */
  it('no label is a direct flex item of the row that holds its control', () => {
    const source =
      'page { row { title "e-torch" select "현재 프로젝트" ["A", "B"] avatar "사용자" } }'
    const { html } = render(parse(source))

    /** Immediate children of the first `wf-row`, as their open tags. */
    const rowChildren = (markup: string): string[] => {
      const start = markup.indexOf('<div class="wf-row')
      const body = markup.slice(markup.indexOf('>', start) + 1)
      const tags: string[] = []
      let depth = 0
      for (const [tag, closing, name] of body.matchAll(/<(\/?)([a-z0-9]+)\b[^>]*?(\/?)>/g)) {
        const selfClosing = tag.endsWith('/>') || name === 'input'
        if (closing) {
          if (depth === 0) break
          depth -= 1
          continue
        }
        if (depth === 0) tags.push(tag)
        if (!selfClosing) depth += 1
      }
      return tags
    }

    const children = rowChildren(html)
    expect(children.length).toBeGreaterThan(0)
    expect(children.filter((tag) => tag.startsWith('<label'))).toEqual([])
    // The field wrapper is the row's child in the label's place.
    expect(children.some((tag) => tag.includes('wf-field'))).toBe(true)
  })

  it('emits no field wrapper when there is no label', () => {
    const { html } = render(parse('page { select ["A", "B"] }'))
    expect(html).not.toContain('wf-field')
    expect(html).toContain('<select')
  })
})

/**
 * A badge is a fixed-size marker.
 *
 * Without `flex-shrink: 0` it stretched to the row height (90px) while its
 * width was squeezed below the text, breaking the two-character label
 * "비공개" across two lines as "비공 개".
 */
describe('badge holds its size inside a flex row', () => {
  it('.wf-badge refuses to shrink and centres itself', () => {
    const { css } = render(parse('page { row { title "제목" badge "비공개" } }'))

    const rule = /\.wf-badge\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule).not.toBe('')
    expect(rule).toMatch(/flex-shrink:\s*0/)
    expect(rule).toMatch(/align-self:\s*center/)
  })
})

/**
 * The other direction: every class the MARKUP carries must be one the CSS
 * defines.
 *
 * The checks above run markup-ward — a class the stylesheet styles has to
 * reach an element. That misses the mirror-image defect, and the mirror image
 * is what shipped: `renderComponentUse` put `wf-component-instance` on every
 * component invocation and no rule anywhere defined it. A class is the hook a
 * stylesheet paints through, so markup that carries one is advertising a style
 * that does not exist — the wrapper is `display: contents` and must have no box
 * at all, which is exactly what `data-` attributes, not a class, are for.
 *
 * Both directions are now covered, so neither kind of drift is silent: a rule
 * nothing wears fails above, a class nothing styles fails here.
 */
describe('markup classes are defined by the stylesheet', () => {
  /** Classes the markup carries that no rule in the CSS mentions. */
  const undefinedClasses = (html: string, css: string): string[] => {
    const styled = styledClasses(css)
    // Every class named ANYWHERE in the CSS, not only as a rule's subject: a
    // class used purely as an ancestor (`.wf-site .wf-page`) is still defined.
    const mentioned = new Set(styled)
    for (const [, name] of css.matchAll(/\.([A-Za-z0-9_-]+)/g)) mentioned.add(name)
    return [...markupClasses(html)]
      .filter((name) => name.startsWith('wf-'))
      .filter((name) => !mentioned.has(name))
      .sort()
  }

  it('no wf- class in a rendered page is left undefined by the CSS', () => {
    const { html, css } = render(parse(SOURCE))

    // Control: the check can fail. Re-introducing the class the defect emitted
    // must be reported, or the assertion below proves nothing.
    const withDeadClass = html.replace(
      '<div class="wf-field"',
      '<div class="wf-component-instance"',
    )
    expect(withDeadClass).not.toBe(html)
    expect(undefinedClasses(withDeadClass, css)).toContain('wf-component-instance')

    expect(undefinedClasses(html, css)).toEqual([])
  })

  /**
   * A component invocation is marked by `data-`, not by a class.
   *
   * `display: contents` means the wrapper has no box; any rule that gave it one
   * would defeat the declaration, so there is no style the class could ever
   * carry — the identity exists to be queried, never painted.
   */
  it('marks component invocations with data- attributes and no class', () => {
    const source = `component Card(label: string) {
  card { text "$label" }
}
page "Home" id=home { use Card(label="hi") }`
    const { html, css } = render(parse(source))

    expect(html).toContain('data-wf-component="Card"')
    expect(html).toContain('style="display: contents"')
    expect(html).not.toContain('wf-component-instance')
    expect(css).not.toContain('wf-component-instance')
    expect(undefinedClasses(html, css)).toEqual([])
  })
})
