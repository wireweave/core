/**
 * Every attribute an element spec declares changes what that element renders.
 *
 * This is the other half of `spec-reference-closure.test.ts`. That gate asks
 * whether the names the specs reference exist in the registry; sets answer that.
 * This one asks whether a declared attribute does anything, and no comparison of
 * sets can answer it — a spec listing an attribute is a promise about the
 * renderer, and only the renderer can keep it.
 *
 * The oracle is therefore behavioral, not textual: render the element without
 * the attribute, render it again with each value the registry says the attribute
 * accepts, and compare the output. Grep would have accepted `collapsed` — the
 * word appeared in the spec, in the AST type and in the printer — while nothing
 * emitted a byte for it.
 *
 * The direction matters. A declared-but-dead attribute is worse than an
 * undeclared one, because `validate()` accepts it: the author writes it, gets no
 * diagnostic, and the value is silently dropped. That is why the repair for a
 * failure here is to implement the render path or delete the declaration, never
 * to widen the spec.
 *
 * It lives here for the same reason gate A does: core's spec is the subject, and
 * a check shipped alongside its subject is the producer grading its own output.
 */

import { describe, it, expect } from 'vitest'
import { parse, render, renderSite } from '@wireweave/core'
import {
  ATTRIBUTE_MAP,
  ATTRIBUTE_SPECS,
  COMPONENT_SPECS,
  BLOCK_NODE_SPECS,
} from '@wireweave/core/spec'

/** Where the probed attribute is spliced into a sample. */
const SLOT = '§attr§'

/**
 * Context every sample carries so the probed attribute has somewhere to matter:
 * a second page so canvas mode engages, a layout named `shell` so `uses=`
 * resolves to something, and a `navigate=` referrer so a page `id` is reachable.
 * Without these, several attributes render identically for a reason that has
 * nothing to do with whether the renderer implements them.
 */
const PAGE_CONTEXT = `
layout shell {
  header { text "h" }
  slot
}
page "Q" {
  button "go" navigate="probe"
}
`

const inPage = (body: string) => `page "P" {\n  ${body}\n}${PAGE_CONTEXT}`

/** One minimal, renderable occurrence of each element, with a slot for the attribute. */
const SAMPLES: Readonly<Record<string, string>> = {
  page: `page "P" ${SLOT} {\n  text "x"\n}${PAGE_CONTEXT}`,
  layout: `layout main2 ${SLOT} {\n  header { text "h" }\n  slot\n}\npage "P" uses=main2 {\n  text "x"\n}${PAGE_CONTEXT}`,
  component: `component frag ${SLOT} {\n  text "c"\n}\npage "P" {\n  use frag\n}${PAGE_CONTEXT}`,
  use: `component frag2 {\n  text "c"\n}\npage "P" {\n  use frag2 ${SLOT}\n}${PAGE_CONTEXT}`,
  slot: `layout sh2 {\n  header { text "h" }\n  slot ${SLOT}\n}\npage "P" uses=sh2 {\n  text "x"\n}${PAGE_CONTEXT}`,
  // `repeat` declares no attributes, so no pair is probed from this sample;
  // it exists because the gate requires every element to have one, and the
  // count is positional rather than an attribute, so the slot sits after it.
  repeat: inPage(`repeat 2 ${SLOT} { text "x" }`),
  header: inPage(`header ${SLOT} { text "x" }`),
  main: inPage(`main ${SLOT} { text "x" }`),
  footer: inPage(`footer ${SLOT} { text "x" }`),
  sidebar: inPage(`sidebar ${SLOT} { text "x" }`),
  row: inPage(`row ${SLOT} { text "x" }`),
  col: inPage(`row { col ${SLOT} { text "x" } }`),
  stack: inPage(`stack ${SLOT} { text "x" }`),
  relative: inPage(`relative ${SLOT} { text "x" }`),
  card: inPage(`card "C" ${SLOT} { text "x" }`),
  modal: inPage(`modal "M" ${SLOT} { text "x" }`),
  drawer: inPage(`drawer "D" ${SLOT} { text "x" }`),
  accordion: inPage(`accordion "A" ${SLOT} { text "x" }`),
  section: inPage(`section "S" ${SLOT} { text "x" }`),
  text: inPage(`text "x" ${SLOT}`),
  title: inPage(`title "x" ${SLOT}`),
  link: inPage(`link "x" ${SLOT}`),
  button: inPage(`button "x" ${SLOT}`),
  input: inPage(`input "x" ${SLOT}`),
  textarea: inPage(`textarea "x" ${SLOT}`),
  select: inPage(`select "x" ["a", "b"] ${SLOT}`),
  checkbox: inPage(`checkbox "x" ${SLOT}`),
  radio: inPage(`radio "x" ${SLOT}`),
  switch: inPage(`switch "x" ${SLOT}`),
  slider: inPage(`slider "x" ${SLOT}`),
  image: inPage(`image "a.png" ${SLOT}`),
  placeholder: inPage(`placeholder "x" ${SLOT}`),
  avatar: inPage(`avatar "AB" ${SLOT}`),
  badge: inPage(`badge "x" ${SLOT}`),
  icon: inPage(`icon "star" ${SLOT}`),
  table: inPage(`table [["A", "B"], ["1", "2"]] ${SLOT}`),
  list: inPage(`list ["a", "b"] ${SLOT}`),
  alert: inPage(`alert "x" ${SLOT}`),
  toast: inPage(`toast "x" ${SLOT}`),
  progress: inPage(`progress ${SLOT}`),
  spinner: inPage(`spinner ${SLOT}`),
  tooltip: inPage(`tooltip "x" ${SLOT}`),
  popover: inPage(`popover "x" ${SLOT} { text "y" }`),
  dropdown: inPage(`dropdown ["a", "b"] ${SLOT}`),
  nav: inPage(`nav ["a", "b"] ${SLOT}`),
  tabs: inPage(`tabs ["a", "b"] ${SLOT}`),
  breadcrumb: inPage(`breadcrumb ["a", "b"] ${SLOT}`),
  divider: inPage(`divider ${SLOT}`),
  marker: inPage(`marker 1 ${SLOT}`),
  annotations: inPage(`text "x"\n  annotations ${SLOT} {\n    item 1 "T" { text "d" }\n  }`),
  item: inPage(`text "x"\n  annotations {\n    item 1 "T" ${SLOT} { text "d" }\n  }`),
}

/** The block node types, which are only writable inside their parent element. */
const BLOCK_SAMPLES: Readonly<Record<string, string>> = {
  NavItem: inPage(`nav {\n    item "a" ${SLOT}\n  }`),
  NavGroup: inPage(`nav {\n    group "g" ${SLOT} { item "a" }\n  }`),
  DropdownItem: inPage(`dropdown {\n    item "a" ${SLOT}\n  }`),
  ListItem: inPage(`list {\n    item "a" ${SLOT}\n  }`),
}

/**
 * Attributes whose real value domain the registry cannot express today.
 *
 * Each entry is a finding, not a convenience. `device` accepts the keys of
 * `DEVICE_PRESETS` and `icon` accepts a lucide name, but the registry types both
 * as free strings — so a probe drawing only from the registry would compare two
 * renders that had both fallen back to the default and conclude the attribute is
 * dead. Supplying a real value is what makes a `false` here mean "the renderer
 * ignores this" rather than "the probe guessed a value the renderer rejects".
 */
const UNDECLARED_DOMAIN: Readonly<Record<string, readonly string[]>> = {
  mx: ['mx=4', 'mx="auto"'], // number | "auto" — typed `string`, no values
  w: ['w=200'], // numbers too, not only the keywords
  h: ['h=200'],
  viewport: ['viewport="1280x720"', 'viewport="800"'], // "<w>x<h>" | "<w>"
  device: ['device="iphone14"'], // keys of DEVICE_PRESETS
  icon: ['icon="star"', 'icon=star'], // lucide icon names
  value: ['value="a"', 'value=3'], // must match an option / the slider range
  uses: ['uses="shell"', 'uses=shell'], // a layout name in the same document
  id: ['id="probe"'], // the destination PAGE_CONTEXT navigates to
  name: ['name="shell"'],
  src: ['src="a.png"'],
  href: ['href="/a"'],
  active: ['active=0'],
  level: ['level=2'],
  min: ['min=2'],
  max: ['max=9'],
  step: ['step=5'],
  rows: ['rows=4'],
  span: ['span=6'],

  // The `object` / `object[]` attributes. `spec.type` names the shape but not
  // the grammar that writes it, and the fallback probe below can only emit
  // `name="probe"` — a quoted string, which the guard/handler/state parsers
  // correctly discard. Probed with that value every one of these reads as dead
  // while all four render: the verdict would have been about the probe's value,
  // not about the renderer. The braces/brackets are the real syntax, taken from
  // core's own `interaction-runtime` fixture.
  //
  // `visibleWhen` / `enabledWhen` leave their evidence only in `renderSite` —
  // the site runtime reads `data-wf-visible-when` / `data-wf-enabled-when` — so
  // these entries also stand on `renderAll` spanning both render surfaces.
  visibleWhen: ['visibleWhen={ state=allowed, equals=true }'],
  enabledWhen: ['enabledWhen={ state=allowed, equals=true }'],
  on: ['on={ event=click, effects=[{ kind=toggle, state=allowed }] }'],
  states: ['states=[{ name=allowed, valueType=boolean, initial=false }]'],

  // `string[]` written as a bracketed list of bare identifiers. The fallback
  // probe emits `variants="probe"` — a bare string where an array is meant,
  // which `expandVariants` correctly ignores, so probed with that value alone
  // the attribute would read as dead while it renders.
  variants: ['variants=[loading, empty]'],
}

/** Every value the registry says the attribute accepts, plus type-shaped probes. */
function candidateValues(name: string): string[] {
  const spec = ATTRIBUTE_MAP.get(name)
  if (!spec) return []
  const out: string[] = []
  if (spec.values) for (const v of spec.values) out.push(`${name}=${JSON.stringify(String(v))}`)
  switch (spec.type) {
    case 'boolean':
      out.push(name, `${name}=false`)
      break
    case 'number':
      out.push(`${name}=3`, `${name}=1`, `${name}=0`)
      break
    default:
      out.push(`${name}="probe"`)
  }
  out.push(...(UNDECLARED_DOMAIN[name] ?? []))
  return out
}

/**
 * Everything the document renders, as one comparable string.
 *
 * The emptiness check is the point. `renderSite` returns a string while `render`
 * returns an object, and reading the wrong shape yields `undefined` — which is
 * equal to itself for every input, so that half of the oracle would silently
 * become a constant and stop discriminating. A probe that compares two constants
 * reports "no difference" for an attribute that renders perfectly well. Asserting
 * each part is a non-empty string is what keeps a passing comparison meaningful.
 */
function renderAll(source: string): string {
  const doc = parse(source)
  const result = render(doc)
  const parts: unknown[] = [result.html, result.css, renderSite(doc)]
  parts.forEach((part, index) => {
    if (typeof part !== 'string' || part.length === 0) {
      throw new Error(`render output ${index} is not a non-empty string`)
    }
  })
  return parts.join('\n<<<>>>\n')
}

/**
 * The rendered markup, with stylesheets removed.
 *
 * Two surfaces, because a sample can render through either: `render` returns the
 * page markup and `renderSite` the shell that wraps it, and `layout`/`slot` leave
 * their evidence only in the second.
 *
 * Stripping `<style>` is what keeps the marker check from being vacuous. The
 * embedded stylesheet names nearly every `wf-*` class whether or not the document
 * uses it, so a marker read out of the full output is true for every sample —
 * measured, not assumed: `textarea` and `select` both appear to carry their own
 * class until the style blocks are removed, and then neither does.
 */
function visibleMarkup(source: string): string {
  const doc = parse(source)
  const withoutStyles = (text: string) => text.replace(/<style[\s\S]*?<\/style>/g, '')
  return `${withoutStyles(render(doc).html)}\n${withoutStyles(renderSite(doc))}`
}

/** `NavItem` → `wf-nav-item`, the class the renderer builds from the node type. */
const derivedMarker = (nodeType: string) =>
  `wf-${nodeType.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`

/**
 * Elements whose markup does not carry their own derived class.
 *
 * Derivation covers the samples because the renderer names most elements after
 * their node type; these three render as something else and are listed rather
 * than transcribed — a marker column written by hand for every element would be
 * a copy of the specs, and a copy drifts from them silently.
 *
 * Keyed by node type, never by keyword: `item` is three different nodes, and a
 * keyword-keyed table would let one of them vouch for the others.
 *
 * The list is gated below on both sides. An entry naming an element that does
 * not exist fails, an entry whose derived marker would have worked fails as
 * stale, and an entry whose marker is absent from its own sample fails — so an
 * exception cannot be used to wave a degenerate sample through.
 */
const MARKER_OVERRIDES: Readonly<Record<string, string>> = {
  NavItem: 'wf-nav-link', // a nav item renders as the link inside it, not as a box
  // A layout is a definition, not a box: it emits nothing of its own, and its
  // evidence is the shell it contributes to the page that `uses=` it. The slot
  // marker is that contribution — present only when the layout was applied, so
  // it still fails if the layout stops rendering.
  Layout: 'wf-slot',
}

const markerFor = (nodeType: string) => MARKER_OVERRIDES[nodeType] ?? derivedMarker(nodeType)

/**
 * Does any accepted value of `attribute` change what `sample` renders?
 *
 * Throws rather than returning `false` when the baseline fails or every value is
 * rejected: both mean the probe never performed a valid comparison, and a
 * no-difference verdict drawn from a comparison that did not happen is exactly
 * the vacuous pass this gate must not produce.
 */
function affectsRender(sample: string, attribute: string): boolean {
  const base = renderAll(sample.replace(SLOT, ''))
  const candidates = candidateValues(attribute)
  if (candidates.length === 0) throw new Error(`"${attribute}" is not in ATTRIBUTE_SPECS`)

  let compared = 0
  const rejected: string[] = []
  for (const candidate of candidates) {
    let variant: string
    try {
      variant = renderAll(sample.replace(SLOT, candidate))
    } catch (error) {
      rejected.push(`${candidate}: ${(error as Error).message.split('\n')[0]}`)
      continue
    }
    compared += 1
    if (variant !== base) return true
  }
  if (compared === 0) {
    throw new Error(`every value of "${attribute}" failed to render [${rejected.join(' | ')}]`)
  }
  return false
}

/** One element-and-attribute promise, in the form the exception list records. */
interface Pair {
  element: string
  attribute: string
}

const pairId = (pair: Pair) => `${pair.element}.${pair.attribute}`

const TARGETS: readonly {
  element: string
  nodeType: string
  sample: string
  attributes: readonly string[]
}[] = [
  ...COMPONENT_SPECS.map((spec) => ({
    element: spec.name,
    nodeType: spec.nodeType,
    sample: SAMPLES[spec.name],
    attributes: spec.attributes,
  })),
  ...BLOCK_NODE_SPECS.map((spec) => ({
    element: spec.nodeType,
    nodeType: spec.nodeType,
    sample: BLOCK_SAMPLES[spec.nodeType],
    attributes: spec.attributes,
  })),
]

/**
 * Declarations the renderer does not yet keep, each with why it is still declared.
 *
 * Every entry is render debt, not an exemption on principle: the attribute is
 * real language surface that other tests pin, so deleting the declaration would
 * remove tested behaviour to make this gate pass. Implementing each one is a
 * design question, named here so it is answered rather than inherited.
 *
 * This list may only shrink. Both directions are enforced below — an addition
 * fails as a new broken promise, and an entry that has stopped being no-op fails
 * as a stale exemption, because a stale one silently re-opens the hole it
 * documents.
 */
const RENDER_DEBT: readonly { pair: string; reason: string }[] = [
  {
    pair: 'section.expanded',
    reason:
      'renderSection emits the title and children only. The printer round-trips ' +
      '`expanded` and components.test.ts asserts it, so the declaration is load-bearing; ' +
      'open question is whether a collapsed section renders collapsed or renders open ' +
      'with a marker, which is a wireframe-legibility decision, not a rendering one.',
  },
  {
    pair: 'input.size',
    reason:
      'button resolves `size` through resolveSizeValue; the input renderer has no size ' +
      'path at all. Open question is whether form controls take the same size scale as ' +
      'buttons or a narrower one.',
  },
  {
    pair: 'ListItem.icon',
    reason:
      'renderNavItem renders an item icon; renderList emits only the item content. Same ' +
      'attribute, same shape of item, two answers.',
  },
  {
    pair: 'DropdownItem.icon',
    reason: 'renderDropdown emits only the item label, for the same reason as ListItem.icon.',
  },
]

describe('spec render closure', () => {
  const noop: Pair[] = []
  const unprobed: string[] = []
  const degenerate: string[] = []
  let markersChecked = 0

  for (const { element, nodeType, sample, attributes } of TARGETS) {
    if (!sample) {
      unprobed.push(`${element}: no sample`)
      continue
    }
    // Before any comparison, and only where a comparison happens. An element
    // declaring no attributes makes no promises to keep, so requiring a marker of
    // it would be a second list to maintain with nothing riding on it — the scope
    // falls out of the specs rather than out of an exception.
    if (attributes.length > 0) {
      markersChecked += 1
      const marker = markerFor(nodeType)
      let baseline: string
      try {
        baseline = visibleMarkup(sample.replace(SLOT, ''))
      } catch (error) {
        degenerate.push(`${element}: baseline render threw — ${(error as Error).message}`)
        continue
      }
      if (!baseline.includes(marker)) {
        degenerate.push(`${element}: baseline renders no "${marker}"`)
        continue
      }
    }
    for (const attribute of attributes) {
      try {
        if (!affectsRender(sample, attribute)) noop.push({ element, attribute })
      } catch (error) {
        unprobed.push(`${element}.${attribute}: ${(error as Error).message}`)
      }
    }
  }

  it('renders the element each sample names', () => {
    // Non-vacuity, instrument half — and the reason it is separate from the two
    // tests below rather than folded into them. `renderAll` catches a baseline
    // that *failed*; nothing caught a baseline that *degenerated*. Dropping the
    // element name from `checkbox "L"` costs the wrapper — wf-checkbox goes from
    // true to false — while the output stays non-empty and still differs from the
    // variant, so every attribute of a silently emptied sample reads as live.
    //
    // A red here says the sample stopped exercising its element, which is an
    // instrument defect; a red below says the renderer stopped reading an
    // attribute, which is a regression. They are named apart because the repairs
    // are opposite, and reading the second as the first pours a real loss into
    // RENDER_DEBT and legalizes it. A red here also voids the verdicts below,
    // whose pairs were skipped for that element.
    expect(markersChecked, 'no sample was checked for its element').toBeGreaterThan(0)
    expect(
      degenerate,
      'these samples no longer render the element they name, so the attribute verdicts ' +
        'drawn from them would be about nothing — fix the sample, never the spec',
    ).toEqual([])
  })

  /**
   * `visibleMarkup` removes `<style>` blocks, and every marker check above is
   * meaningful only because it does.
   *
   * The embedded stylesheet names nearly every `wf-*` class whether the document
   * uses it or not. Measured on the checkbox sample: the stylesheet is 79% of
   * the raw output (59,397 bytes to 12,679), and `wf-textarea`, `wf-select`,
   * `wf-nav-link`, `wf-table`, `wf-avatar` and `wf-slider` are all present in it
   * while the document renders none of them. A marker read out of unstripped
   * output is therefore true for every sample, including a sample that renders
   * nothing at all.
   *
   * This is a test rather than a comment because of how it fails. Deleting the
   * strip does not make the marker guard go quiet — it makes the suite issue a
   * confident wrong diagnosis. Measured: with the strip removed and the element
   * dropped from `SAMPLES.checkbox`, this guard stays green and the attribute
   * gate reds on `checkbox.label`, `checked` and `disabled` instead — three
   * attributes the renderer honours correctly. The cheapest way to clear that
   * red is three lines in RENDER_DEBT, which permanently legalizes three working
   * attributes and buries the real cause. Whoever deletes the strip is not the
   * person who sees the red, and the red does not point at them.
   */
  it('strips stylesheets, so a marker means the document rendered it', () => {
    const sample = SAMPLES.checkbox.replace(SLOT, '')
    const doc = parse(sample)
    // The same two surfaces `visibleMarkup` reads, minus its strip. The strip
    // itself is never re-implemented here: a second copy of the regex could
    // drift from the helper and still agree with it, which is the failure this
    // gate is supposed to catch.
    const raw = `${render(doc).html}\n${renderSite(doc)}`
    const visible = visibleMarkup(sample)

    // Instrument first. If the renderer stops embedding a stylesheet there is
    // nothing to strip, and every assertion below would also hold for a helper
    // that had quietly stopped stripping.
    expect(
      raw,
      'the renderer emitted no <style> block, so this gate is proving nothing — ' +
        'the assertions below would pass for a helper that strips nothing',
    ).toContain('<style')

    expect(
      visible,
      'visibleMarkup left a stylesheet in its output. Restoring the strip is the fix: ' +
        'without it the marker guard does not fall silent, it misdiagnoses — the guard ' +
        'passes for a sample that renders nothing and the attribute gate blames working ' +
        'checkbox attributes instead, whose cheapest repair is to bury them in RENDER_DEBT',
    ).not.toContain('<style')

    // The false positive the strip exists to remove. `wf-textarea` is named by
    // the stylesheet on every page; this document contains no textarea.
    expect(
      raw,
      'the stylesheet no longer names wf-textarea, so this sample can no longer ' +
        'demonstrate the false positive — pick a class the stylesheet still declares',
    ).toContain('wf-textarea')
    expect(
      visible,
      'a class this document never renders survived the strip, so any marker check ' +
        'reading this output can be satisfied by the stylesheet alone',
    ).not.toContain('wf-textarea')

    // And the other direction, without which returning an empty string would
    // satisfy everything above.
    expect(
      visible,
      'the strip removed the class the document actually renders — it is cutting ' +
        'markup, not just stylesheets, and every marker check now reads too little',
    ).toContain('wf-checkbox')
  })

  it('keeps the marker exception list minimal and honest', () => {
    const byNodeType = new Map(TARGETS.map((target) => [target.nodeType, target]))
    const entries = Object.entries(MARKER_OVERRIDES)

    const unknown = entries.filter(([nodeType]) => !byNodeType.has(nodeType)).map(([n]) => n)
    expect(
      unknown,
      'these name no element in the specs, so they exempt nothing and hide a rename',
    ).toEqual([])

    const stale = entries.filter(([nodeType]) => {
      const sample = byNodeType.get(nodeType)?.sample
      return (
        sample !== undefined &&
        visibleMarkup(sample.replace(SLOT, '')).includes(derivedMarker(nodeType))
      )
    })
    expect(
      stale.map(([nodeType]) => nodeType),
      'these now carry their derived class, so delete the override — an override left ' +
        'behind lets the element stop rendering without this gate noticing',
    ).toEqual([])
  })

  it('probes every declared pair', () => {
    // Non-vacuity, coverage half. Every assertion below is trivially satisfied by
    // a probe that silently skipped everything, so the population has to be shown
    // to exist and to have been measured — no missing samples, no pair whose
    // baseline threw, no pair whose values were all rejected.
    expect(TARGETS.length, 'no elements to probe').toBeGreaterThan(0)
    expect(
      unprobed,
      'these pairs were never compared, so their absence from the no-op list means ' +
        'nothing — fix the sample or the value domain rather than leaving them unmeasured',
    ).toEqual([])
  })

  it('discriminates a live attribute from a dead one', () => {
    // Non-vacuity, detector half. The list below is short because the renderer is
    // in good shape, and a detector that had broken into always-true would produce
    // exactly the same short list. These two controls fail if it does: one pair
    // that must differ, one that must not, both against the real renderer.
    expect(affectsRender(SAMPLES.text, 'muted'), '`muted` on text no longer renders').toBe(true)
    expect(affectsRender(SAMPLES.input, 'size'), '`size` on input now renders').toBe(false)
  })

  it('renders every attribute the specs declare', () => {
    const debt = new Set(RENDER_DEBT.map((entry) => entry.pair))
    const unexpected = noop.map(pairId).filter((id) => !debt.has(id))

    expect(
      unexpected,
      'these attributes are declared on these elements but change nothing when rendered, ' +
        'so validate() accepts them and the value is silently dropped — implement the ' +
        'render path or delete the declaration, never widen the spec to match',
    ).toEqual([])
  })

  it('keeps the render debt shrinking, never growing', () => {
    const live = new Set(noop.map(pairId))
    const stale = RENDER_DEBT.map((entry) => entry.pair).filter((id) => !live.has(id))

    expect(
      stale,
      'these now render, so delete them from RENDER_DEBT — an exemption left behind ' +
        'stops the gate from noticing if the render path is removed again',
    ).toEqual([])
  })

  it('renders every attribute the registry declares, somewhere', () => {
    // Per-pair debt can hide a name that is dead everywhere it appears. `size` is
    // fine because button honours it; an attribute no element renders is a name
    // the editor completes, the validator accepts and nothing implements.
    const deadEverywhere = ATTRIBUTE_SPECS.map((spec) => spec.name).filter((name) => {
      const declaring = noop.filter((pair) => pair.attribute === name)
      const total = TARGETS.filter((target) => target.attributes.includes(name))
      return total.length > 0 && declaring.length === total.length
    })
    const debtNames = new Set(RENDER_DEBT.map((entry) => entry.pair.split('.')[1]))

    expect(
      deadEverywhere.filter((name) => !debtNames.has(name)),
      'no element renders these, so they are registry entries with no implementation',
    ).toEqual([])
  })
})
