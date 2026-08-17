/**
 * Interaction intent → rendered HTML.
 *
 * `navigate` / `opens` / `toggles` / `action` are the only structural link
 * between screens in a wireframe. A renderer that parses them and then omits
 * them loses that link silently: the document still renders, the author sees a
 * menu, and nothing downstream can tell that the menu was ever wired up. That
 * is exactly what `navigation.ts` did — nav, group and breadcrumb items carried
 * `InteractiveProps` in the AST and emitted only `href`.
 *
 * Two guarantees are pinned here:
 *
 * - **Emission** — every container that carries item-level intent renders it.
 * - **Single owner** — the four attribute names exist in exactly one source
 *   file, so a seventh renderer cannot quietly repeat the omission.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse, render, extractScreenTransitions } from '../src'
import { EXTERNAL_NAVIGATE_ATTR, INTERACTIVE_ATTR_NAMES } from '../src/renderer/html/interactive'
import { scanCode } from './helpers/source-code-scan'

/** All four intents on one item, for exhaustive emission checks. */
const ALL_INTENTS = 'navigate="Target" opens="ov" toggles="tg" action="act"'
const ALL_ATTRS = [
  'data-navigate="Target"',
  'data-opens="ov"',
  'data-toggles="tg"',
  'data-action="act"',
]

function html(src: string): string {
  return render(parse(src)).html
}

/** The rendered element containing `needle`, as a single tag string. */
function tagContaining(markup: string, needle: string): string {
  const at = markup.indexOf(needle)
  expect(at, `expected markup to contain ${needle}`).toBeGreaterThanOrEqual(0)
  const open = markup.lastIndexOf('<', at)
  const close = markup.indexOf('>', at)
  return markup.slice(open, close + 1)
}

describe('Interaction intent emission', () => {
  describe('navigation containers (the regression this file exists for)', () => {
    it.each([
      ['nav array item', `page { nav [ { label="N" ${ALL_INTENTS} } ] }`, 'wf-nav-link'],
      ['nav block item', `page { nav { item "N" ${ALL_INTENTS} } }`, 'wf-nav-link'],
      ['nav grouped item', `page { nav { group "G" { item "N" ${ALL_INTENTS} } } }`, 'wf-nav-link'],
      [
        'breadcrumb item',
        `page { breadcrumb [ { label="A" ${ALL_INTENTS} } { label="B" } ] }`,
        'wf-breadcrumb-item',
      ],
    ])('%s emits all four intents on its own element', (_name, src, marker) => {
      const tag = tagContaining(html(src), marker)
      for (const attr of ALL_ATTRS) {
        expect(tag, `missing ${attr} on <${marker}>`).toContain(attr)
      }
    })

    it('emits intent for every item of a multi-item nav, not just the first', () => {
      const markup = html(`page {
        nav {
          item "Map" navigate="Screen A"
          item "Bookings" navigate="Screen B"
          group "More" {
            item "Settings" navigate="Screen C" action="track"
          }
        }
      }`)
      expect(markup).toContain('data-navigate="Screen A"')
      expect(markup).toContain('data-navigate="Screen B"')
      expect(markup).toContain('data-navigate="Screen C"')
      expect(markup).toContain('data-action="track"')
      expect(markup.match(/data-navigate=/g)).toHaveLength(3)
    })

    it('keeps the authored href and the declared intent as separate layers', () => {
      const tag = tagContaining(
        html(`page { nav [ { label="N" href="/raw-anchor" navigate="Screen A" } ] }`),
        'wf-nav-link',
      )
      expect(tag).toContain('href="/raw-anchor"')
      expect(tag).toContain('data-navigate="Screen A"')
    })

    it('does not synthesise an href from navigate', () => {
      const tag = tagContaining(
        html(`page { nav [ { label="N" navigate="Screen A" } ] }`),
        'wf-nav-link',
      )
      expect(tag).toContain('href="#"')
      expect(tag).toContain('data-navigate="Screen A"')
    })

    it('emits nothing when an item declares no intent', () => {
      const tag = tagContaining(html('page { nav [ { label="N" href="/x" } ] }'), 'wf-nav-link')
      for (const name of INTERACTIVE_ATTR_NAMES) {
        expect(tag).not.toContain(name)
      }
      expect(tag).toBe('<a class="wf-nav-link" href="/x">')
    })

    it('escapes intent targets', () => {
      const tag = tagContaining(
        html(`page { nav [ { label="N" navigate="a\\"b&c" } ] }`),
        'wf-nav-link',
      )
      expect(tag).toContain('data-navigate="a&quot;b&amp;c"')
      expect(tag).not.toContain('data-navigate="a"b')
    })
  })

  describe('accessibility invariants are preserved', () => {
    it('keeps the trailing breadcrumb a non-anchor current-page span', () => {
      const tag = tagContaining(
        html(`page { breadcrumb [ { label="A" navigate="X" } { label="B" navigate="Y" } ] }`),
        'aria-current',
      )
      expect(tag.startsWith('<span')).toBe(true)
      expect(tag).toContain('aria-current="page"')
      expect(tag).not.toContain('href=')
      // Declared intent still travels — renderer and extractor must agree.
      expect(tag).toContain('data-navigate="Y"')
    })

    it('keeps tab role and selection wiring', () => {
      const markup = html('page { tabs ["One", "Two"] }')
      expect(markup).toContain('role="tablist"')
      expect(markup).toContain(
        '<button class="wf-tab wf-tab-active" role="tab" aria-selected="true">',
      )
      expect(markup).toContain('aria-selected="false"')
    })
  })

  describe('renderer and transition extractor agree', () => {
    // The transition graph is derived from declared intent. If an item's intent
    // reaches the graph but not the markup, a consumer of the HTML cannot act
    // on an edge the graph promises — the exact split this task closed.
    const source = `
page "Home" {
  nav {
    item "Map" navigate="Map" icon=map active
    item "Bookings" navigate="Bookings"
    group "More" { item "Settings" navigate="Settings" action="track" }
  }
  breadcrumb [ { label="Home" navigate="Home" } { label="Map" navigate="Map" } ]
}
page "Map" { text "map" }
page "Bookings" { text "b" }
page "Settings" { text "s" }
`

    it('renders a data attribute for every item-level edge the graph reports', () => {
      const doc = parse(source)
      const markup = render(doc).html
      const itemEdges = extractScreenTransitions(doc).edges.filter((e) => e.trigger.item)

      expect(itemEdges.length).toBeGreaterThan(0)
      for (const edge of itemEdges) {
        expect(markup, `edge ${edge.kind} → ${edge.target} is missing from the markup`).toContain(
          `data-${edge.kind}="${edge.target}"`,
        )
      }
    })
  })
})

describe('href and navigate are separate layers', () => {
  it('renders a navigate-only dropdown item as an inert anchor carrying the intent', () => {
    const markup = html('page { dropdown { item "Settings" navigate="Settings" } }')
    const tag = tagContaining(markup, 'wf-dropdown-item')

    expect(tag).toContain('href="#"')
    expect(tag).toContain('data-navigate="Settings"')
    expect(tag).not.toContain('href="Settings"')
  })

  it('keeps an authored dropdown href and emits the intent beside it', () => {
    const markup = html('page { dropdown { item "Docs" href="/docs" navigate="Settings" } }')
    const tag = tagContaining(markup, 'wf-dropdown-item')

    expect(tag).toContain('href="/docs"')
    expect(tag).toContain('data-navigate="Settings"')
  })

  it('leaves an item with no destination as a button', () => {
    const markup = html('page { dropdown { item "Sign out" action="logout" } }')
    const tag = tagContaining(markup, 'wf-dropdown-item')

    expect(tag.startsWith('<button')).toBe(true)
    expect(tag).toContain('data-action="logout"')
  })

  it('never derives an href from navigate in any container', () => {
    const markup = html(`
page "홈" {
  link "링크" navigate="설정"
  nav ["홈", { label="설정", navigate="설정" }]
  breadcrumb [{ label="홈", navigate="설정" }, { label="지금" }]
  dropdown { item "메뉴" navigate="설정" }
}

page "설정" { text "설정" }
`)
    expect(markup).toContain('data-navigate="설정"')
    expect(markup).not.toContain('href="설정"')
  })
})

describe('a URL-shaped target is judged once, at render time', () => {
  // The judgment is `isUrlTarget`, and it has exactly one home. What is pinned
  // here is that the *answer* leaves the renderer as an attribute, so that no
  // consumer — least of all the generated JavaScript in a `renderSite`
  // document — has to read the target's shape a second time to act on it.
  const MARKER = `${EXTERNAL_NAVIGATE_ATTR}="${EXTERNAL_NAVIGATE_ATTR}"`

  it('marks a URL on an element that has no href to carry it', () => {
    const tag = tagContaining(
      html('page { button "약관" navigate="https://acme.io/terms" }'),
      'wf-button',
    )

    expect(tag).toContain('data-navigate="https://acme.io/terms"')
    expect(tag).toContain(MARKER)
  })

  it('marks nothing on an anchor, where the URL became the href', () => {
    const tag = tagContaining(
      html('page { link "약관" navigate="https://acme.io/terms" }'),
      'wf-link',
    )

    expect(tag).toContain('href="https://acme.io/terms"')
    expect(tag).not.toContain('data-navigate=')
    // Nothing left to qualify: a marker beside no target would name nothing.
    expect(tag).not.toContain(EXTERNAL_NAVIGATE_ATTR)
  })

  it('marks the target an authored href did not displace', () => {
    // Both channels are filled, deliberately (the contradiction is the author's
    // to settle). The one in the data attribute is still a URL, and a consumer
    // still has to be told not to look for a screen with that name.
    const tag = tagContaining(
      html('page { nav [ { label="Docs" href="/raw" navigate="https://acme.io/docs" } ] }'),
      'wf-nav-link',
    )

    expect(tag).toContain('href="/raw"')
    expect(tag).toContain('data-navigate="https://acme.io/docs"')
    expect(tag).toContain(MARKER)
  })

  it('leaves a page name unmarked', () => {
    const tag = tagContaining(html('page { button "설정" navigate="Settings" }'), 'wf-button')

    expect(tag).toContain('data-navigate="Settings"')
    expect(tag).not.toContain(EXTERNAL_NAVIGATE_ATTR)
  })

  it('leaves a prose title that merely looks scheme-like unmarked', () => {
    // The whitespace screen in `isUrlTarget`, seen from the markup: `Note:` is
    // not a scheme, and a page titled this way stays addressable.
    const tag = tagContaining(html('page { button "메모" navigate="Note: draft" }'), 'wf-button')

    expect(tag).toContain('data-navigate="Note: draft"')
    expect(tag).not.toContain(EXTERNAL_NAVIGATE_ATTR)
  })

  it('marks the trailing breadcrumb span, which is not an anchor either', () => {
    const tag = tagContaining(
      html(
        'page { breadcrumb [ { label="홈" navigate="Home" } { label="약관" navigate="/terms" } ] }',
      ),
      'aria-current',
    )

    expect(tag.startsWith('<span')).toBe(true)
    expect(tag).toContain('data-navigate="/terms"')
    expect(tag).toContain(MARKER)
  })

  it('emits no marker for an element with no navigate at all', () => {
    const tag = tagContaining(html('page { button "저장" action="save" }'), 'wf-button')

    expect(tag).toContain('data-action="save"')
    expect(tag).not.toContain(EXTERNAL_NAVIGATE_ATTR)
  })
})

describe('itemIndex counts only positions that can hold an intent', () => {
  /** Item-level edge indices for `container`, in document order. */
  function indices(src: string, container: string): number[] {
    const doc = parse(src)
    return extractScreenTransitions(doc)
      .edges.filter((e) => e.trigger.nodeType === container)
      .flatMap((e) => (e.trigger.item ? [e.trigger.item.index] : []))
  }

  it('skips dividers in a dropdown', () => {
    const src = `
page "홈" {
  dropdown {
    item "첫째" action="a"
    divider
    item "둘째" action="b"
    divider
    item "셋째" action="c"
  }
}
`
    expect(indices(src, 'Dropdown')).toEqual([0, 1, 2])
  })

  it('skips dividers and group headings in a block nav, matching the dropdown rule', () => {
    const src = `
page "홈" {
  nav {
    item "첫째" action="a"
    divider
    item "둘째" action="b"
    group "묶음" {
      item "셋째" action="c"
    }
  }
}
`
    expect(indices(src, 'Nav')).toEqual([0, 1, 2])
  })

  it('counts plain label items, which are addressable positions', () => {
    // "홈" declares no intent but is an item: the one after it is at index 1.
    const src = `
page "홈" {
  nav ["홈", { label="설정", action="a" }]
}
`
    expect(indices(src, 'Nav')).toEqual([1])
  })
})

describe('Interaction attributes have a single owner', () => {
  const rendererRoot = path.resolve(__dirname, '../src/renderer')
  const OWNER = path.join(rendererRoot, 'html', 'interactive.ts')

  function sourceFiles(dir: string, acc: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) sourceFiles(full, acc)
      else if (entry.name.endsWith('.ts')) acc.push(full)
    }
    return acc
  }

  /**
   * Every renderer source, scanned once — comments removed, code kept.
   *
   * Scanned once and shared, so the two tests below grade the same reading of
   * the same files: one asks what the code says, the other asks whether the
   * scan was in a position to know.
   */
  const SCANNED = sourceFiles(rendererRoot).map((file) => ({
    file,
    relative: path.relative(rendererRoot, file),
    ...scanCode(fs.readFileSync(file, 'utf8')),
  }))

  it('scans every renderer source to the end', () => {
    // A scan that stops inside a string, comment or regex has lost track of
    // which construct it is in, and from there it can leave a comment standing
    // or read code as prose. Either way the verdict below is an artefact of the
    // scanner, so it is not worth reading until this holds. This is the check
    // that was missing when a regular expression containing quote characters
    // (`base.ts`'s HTML escape) put the scan inside a string for the rest of
    // the file, and the offence it invented was then argued with by rewording
    // a doc comment.
    const unterminated = SCANNED.filter((entry) => entry.open !== null).map(
      (entry) => `${entry.relative}: ${entry.open?.kind} opened at line ${entry.open?.line}`,
    )

    expect(SCANNED.length).toBeGreaterThan(0)
    expect(unterminated).toEqual([])
  })

  it('spells the attribute names in exactly one file under src/renderer', () => {
    const offenders = SCANNED.filter((entry) => entry.file !== OWNER)
      // Any occurrence in code counts, in any quoting or none: a template
      // literal (`<a data-navigate="${x}">`) is the form a renderer reaches
      // for most naturally, and it is neither of the two quote characters a
      // narrower check would look for.
      .filter((entry) => INTERACTIVE_ATTR_NAMES.some((name) => entry.code.includes(name)))
      .map((entry) => entry.relative)

    // A new renderer must call `interactiveAttrs()` rather than re-typing the
    // names; re-typing them is how navigation.ts came to omit them entirely.
    expect(SCANNED.length).toBeGreaterThan(1)
    expect(offenders).toEqual([])
  })

  it('owns all four names', () => {
    const owner = fs.readFileSync(OWNER, 'utf8')
    for (const name of INTERACTIVE_ATTR_NAMES) {
      expect(owner).toContain(`'${name}'`)
    }
    expect(INTERACTIVE_ATTR_NAMES).toEqual([
      'data-navigate',
      'data-opens',
      'data-toggles',
      'data-action',
    ])
  })
})
