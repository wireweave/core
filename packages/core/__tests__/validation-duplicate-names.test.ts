/**
 * Duplicate names, in the three scopes the parser does not enforce.
 *
 * Two are declared in the flat document — `id` addresses a page for `navigate=`,
 * and a `layout` or `component` `name` addresses a definition for `uses=` (see
 * {@link WireframeDocument}). The third is one level down: an element `id`
 * addresses an overlay for `opens=` / `toggles=` within the page, layout or
 * component that declares it. None is checked while parsing.
 *
 * The third scope's boundary is not a choice made here. `renderer/site/index.ts`
 * gives every page and every shell its own DOM id scope, so the same `id` on two
 * pages is two different ids and has to stay legal; inside one context there is
 * no such escape. The rule is drawn to match the renderer, and
 * {@link id scopes follow the renderer} holds it there.
 *
 * ## Why a diagnostic and not a parse error
 *
 * A duplicate produces a document that is well-formed and renders completely.
 * Nothing looks wrong: every page draws, and the artefact is the one the author
 * expected to see. What is lost is invisible — `buildSiteModel` hands the name to
 * the first declarer and the later page keeps only its index, so
 * `navigate="checkout"` reaches one screen forever and the other is unreachable
 * by name. A defect a screenshot cannot show is exactly the kind a validator has
 * to say out loud.
 *
 * That also fixes which occurrence is blamed. The rule reports the *second*,
 * because first-wins is what the resolver does; blaming the first would send the
 * author to edit the page that still works.
 *
 * ## What these tests hold each other to
 *
 * The failure message claims something about a module this one does not own —
 * that the loser is reachable only by index. {@link the message describes what
 * the resolver does} checks that claim against `renderSite` rather than trusting
 * it, so the diagnostic cannot go on asserting a behaviour the renderer has
 * stopped having.
 */

import { describe, it, expect } from 'vitest'
import { parse, validate, renderSite } from '../src'
import { parseHtml } from './helpers/dom'

/** Document-scope duplicates: page `id` and definition `name`. */
function nameErrors(source: string) {
  const result = validate(parse(source))
  return result.errors.filter(
    (error) => /^Duplicate /.test(error.message) && !/^Duplicate element id/.test(error.message),
  )
}

/** Duplicates in the third scope, kept apart so neither family hides the other. */
function elementIdErrors(source: string) {
  const result = validate(parse(source))
  return result.errors.filter((error) => /^Duplicate element id/.test(error.message))
}

/** Every error, for the assertions about a document being otherwise clean. */
function allErrors(source: string) {
  return validate(parse(source)).errors
}

const TWO_OVERLAYS_ONE_ID = `
page "A" id=a viewport="800x600" {
  button "Open" opens="panel"
  modal "First" id="panel" { text "first" }
  drawer "Second" id="panel" { text "second" }
}
page "B" id=b viewport="800x600" { text "b" }
`

const TWO_PAGES_ONE_ID = `
page "Checkout" id=checkout {
  text "first"
}
page "Confirm" id=checkout {
  text "second"
}
`

describe('duplicate page id', () => {
  it('reports the second declaration and not the first', () => {
    const errors = nameErrors(TWO_PAGES_ONE_ID)

    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('pages[1]')
    expect(errors[0].nodeType).toBe('Page')
    expect(errors[0].attribute).toBe('id')
    expect(errors[0].message).toContain('checkout')
  })

  it('carries the location of the page it blames', () => {
    const [error] = nameErrors(TWO_PAGES_ONE_ID)

    // Line 5 is the second `page`, line 2 the first. A diagnostic that pointed
    // at line 2 would be pointing at the declaration that still resolves.
    expect(error.location).toBeDefined()
    expect(error.location?.line).toBe(5)
  })

  it('makes the document invalid', () => {
    // The rule is an error, not advice: `valid` has to move, or every consumer
    // that gates on it lets the duplicate through.
    expect(validate(parse(TWO_PAGES_ONE_ID)).valid).toBe(false)
  })

  it('reports every later declaration, not only the second', () => {
    const errors = nameErrors(`
page "A" id=dup { text "a" }
page "B" id=dup { text "b" }
page "C" id=dup { text "c" }
`)

    expect(errors.map((error) => error.path)).toEqual(['pages[1]', 'pages[2]'])
  })

  it('says nothing when the ids differ', () => {
    // Non-vacuity, other direction. Every assertion above is satisfied by a rule
    // that fires on every page, and this is what tells the two apart.
    expect(
      nameErrors(`
page "Checkout" id=checkout { text "first" }
page "Confirm" id=confirm { text "second" }
`),
    ).toEqual([])
  })

  it('says nothing about pages that declare no id', () => {
    expect(
      nameErrors(`
page "A" { text "a" }
page "B" { text "b" }
`),
    ).toEqual([])
  })

  it('normalises a name the way the resolver does', () => {
    // `renderer/site/model.ts` trims, so these two are one address to it. A
    // validator comparing raw values would call this pair distinct and stay
    // silent on a collision that really happens.
    const errors = nameErrors(`
page "A" id="  checkout  " { text "a" }
page "B" id="checkout" { text "b" }
`)

    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('pages[1]')
  })

  it('treats a blank id as no id, the way the resolver does', () => {
    expect(
      nameErrors(`
page "A" id="" { text "a" }
page "B" id="   " { text "b" }
`),
    ).toEqual([])
  })
})

describe('duplicate definition name', () => {
  it('reports a layout declared twice', () => {
    const errors = nameErrors(`
layout app { header { text "h" } slot }
layout app { footer { text "f" } slot }
page "A" uses=app { text "a" }
`)

    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('pages[1]')
    expect(errors[0].nodeType).toBe('Layout')
    expect(errors[0].attribute).toBe('name')
  })

  it('collides a component with a layout, because both answer uses=', () => {
    const errors = nameErrors(`
layout shell { header { text "h" } slot }
component shell { text "c" }
page "A" { text "a" }
`)

    expect(errors).toHaveLength(1)
    expect(errors[0].nodeType).toBe('Component')
    expect(errors[0].message).toContain('layout')
  })

  it('says nothing when the names differ', () => {
    expect(
      nameErrors(`
layout shell { header { text "h" } slot }
component fragment { text "c" }
page "A" uses=shell { text "a" }
`),
    ).toEqual([])
  })
})

describe('duplicate element id', () => {
  it('reports the second overlay and not the first', () => {
    const errors = elementIdErrors(TWO_OVERLAYS_ONE_ID)

    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('pages[0].children[2]')
    expect(errors[0].nodeType).toBe('Drawer')
    expect(errors[0].attribute).toBe('id')
    expect(errors[0].message).toContain('panel')
  })

  it('carries the location of the overlay it blames', () => {
    const errors = elementIdErrors(TWO_OVERLAYS_ONE_ID)

    expect(errors[0].location?.line).toBe(5)
  })

  it('reports every later declaration, not just the second', () => {
    const errors = elementIdErrors(`
page "A" id=a {
  modal "One" id="panel" { text "1" }
  modal "Two" id="panel" { text "2" }
  drawer "Three" id="panel" { text "3" }
}
`)

    expect(errors).toHaveLength(2)
    expect(errors.map((error) => error.path)).toEqual([
      'pages[0].children[1]',
      'pages[0].children[2]',
    ])
  })

  it('finds a duplicate nested anywhere below the context, not only at its top', () => {
    // The two overlays are at different depths, so a scan that only compared
    // siblings would call this document clean while the DOM still collides.
    const errors = elementIdErrors(`
page "A" id=a {
  modal "One" id="panel" { text "1" }
  card "Wrapper" { row { drawer "Two" id="panel" { text "2" } } }
}
`)

    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('pages[0].children[1].children[0].children[0]')
  })

  it('normalises the way the renderer does, so padding is not a second id', () => {
    expect(
      elementIdErrors(`
page "A" id=a {
  modal "One" id="  panel  " { text "1" }
  drawer "Two" id="panel" { text "2" }
}
`),
    ).toHaveLength(1)
  })

  it('says nothing about a blank id, which addresses nothing to begin with', () => {
    expect(
      elementIdErrors(`
page "A" id=a {
  modal "One" id="" { text "1" }
  drawer "Two" id="  " { text "2" }
}
`),
    ).toEqual([])
  })

  it('says nothing when the ids differ', () => {
    expect(
      elementIdErrors(`
page "A" id=a {
  modal "One" id="first" { text "1" }
  drawer "Two" id="second" { text "2" }
}
`),
    ).toEqual([])
  })

  it('says nothing when the overlays carry no id at all', () => {
    expect(
      elementIdErrors(`
page "A" id=a {
  modal "One" { text "1" }
  drawer "Two" { text "2" }
}
`),
    ).toEqual([])
  })
})

describe('id scopes follow the renderer', () => {
  it('lets two pages declare the same element id, because they render scoped', () => {
    // `renderSite` emits `s0-panel` and `s1-panel`. Flagging this would reject a
    // document the renderer resolves correctly, and contradict the scoping
    // feature that makes it correct.
    const source = `
page "A" id=a { modal "One" id="panel" { text "1" } }
page "B" id=b { modal "Two" id="panel" { text "2" } }
`
    expect(elementIdErrors(source)).toEqual([])

    const html = renderSite(parse(source))
    expect(html).toContain('id="s0-panel"')
    expect(html).toContain('id="s1-panel"')
  })

  it('lets a page and the layout hosting it declare the same element id', () => {
    // The shell gets its own scope, so these are two different DOM ids too.
    expect(
      elementIdErrors(`
layout app { slot drawer "Shell" id="menu" { text "shell" } }
page "A" id=a uses=app { drawer "Page" id="menu" { text "page" } }
`),
    ).toEqual([])
  })

  it('scopes a layout definition by itself', () => {
    const errors = elementIdErrors(`
layout app { slot
  drawer "One" id="menu" { text "1" }
  drawer "Two" id="menu" { text "2" }
}
page "A" id=a uses=app { text "a" }
`)

    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('in this layout')
  })

  it('scopes a component definition by itself, before it has a use site', () => {
    // Components are definition-only today, so nothing reaches the DOM yet. The
    // duplicate is still the author's, and waiting for instantiation to land
    // would mean shipping the defect and the rule that catches it separately.
    const errors = elementIdErrors(`
component frag {
  modal "One" id="panel" { text "1" }
  drawer "Two" id="panel" { text "2" }
}
page "A" id=a { text "a" }
`)

    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('in this component')
  })
})

describe('the three scopes stay independent', () => {
  it('lets a page id and an element id inside it be the same word', () => {
    // A page `id` is an address for `navigate=` and never becomes a DOM id — the
    // element below renders as `s0-a`. Sharing the scopes would invent a
    // collision the renderer does not have.
    const source = `
page "A" id=a { modal "One" id="a" { text "1" } }
page "B" id=b { text "b" }
`
    expect(allErrors(source)).toEqual([])
    expect(renderSite(parse(source))).toContain('id="s0-a"')
  })

  it('lets a page id and a layout name be the same word', () => {
    // `navigate="app"` and `uses=app` are different questions asked of different
    // attributes. Merging the scopes would reject a document that resolves
    // perfectly, which is the failure mode a validator is least forgiven for.
    expect(
      nameErrors(`
layout app { header { text "h" } slot }
page "App" id=app uses=app { text "a" }
`),
    ).toEqual([])
  })
})

describe('the message describes what the resolver does', () => {
  it('leaves the second page unreachable by name, as the diagnostic claims', () => {
    // The claim under test belongs to `renderer/site/model.ts`, so it is checked
    // there rather than assumed here. If the resolver ever starts disambiguating
    // duplicates itself, this fails and the diagnostic's wording — and possibly
    // the rule — has to be revisited.
    const html = renderSite(parse(TWO_PAGES_ONE_ID))
    const named = [...html.matchAll(/data-screen-name="([^"]*)"/g)].map((match) => match[1])

    expect(named).toContain('checkout')
    expect(named.filter((name) => name === 'checkout')).toHaveLength(1)
  })

  it('renders both pages regardless, which is why nothing else catches this', () => {
    const html = renderSite(parse(TWO_PAGES_ONE_ID))

    expect(html).toContain('first')
    expect(html).toContain('second')
  })

  it('leaves the second overlay unaddressable, as the element-id diagnostic claims', () => {
    // The message says `opens="panel"` reaches the first one. That is a claim
    // about selector semantics, checked here against the same query the site
    // runtime builds (`[id="…"]`, first match) rather than asserted in prose.
    const root = parseHtml(renderSite(parse(TWO_OVERLAYS_ONE_ID)))
    const matches = root.querySelectorAll('[id="s0-panel"]')
    const classes = matches.map((element) => element.getAttribute('class') ?? '')

    expect(matches).toHaveLength(2)
    expect(classes[0]).toContain('modal')
    expect(classes[1]).toContain('drawer')
    expect(root.querySelector('[id="s0-panel"]')).toBe(matches[0])
  })

  it('renders both overlays regardless, which is why nothing else catches this', () => {
    const html = renderSite(parse(TWO_OVERLAYS_ONE_ID))

    expect(html).toContain('first')
    expect(html).toContain('second')
  })
})

describe('a definition is not reported for the name that declares it', () => {
  it('says nothing about a document whose only content is a layout and a page', () => {
    // `layout app` writes `name` from an identifier that is part of the syntax,
    // not from an attribute the author could have written. Reporting it would
    // fire on every document that defines a shell — the widest possible false
    // positive, and one that trains authors to ignore the validator.
    expect(
      allErrors(`
layout app { header { text "h" } slot }
component frag { text "c" }
page "A" id=a uses=app { text "a" }
`),
    ).toEqual([])
  })

  it('still reports a name that is a real attribute on the element carrying it', () => {
    // The exclusion is per node type, so `name` stays validated where an author
    // does write it. A global skip would have silenced this.
    const errors = allErrors(`
page "A" id=a { avatar "SW" nmae="x" }
`)

    expect(errors).toHaveLength(1)
    expect(errors[0].attribute).toBe('nmae')
  })
})

describe('validation stays total', () => {
  it('does not throw on a document that collides in both scopes at once', () => {
    const source = `
layout app { header { text "h" } slot }
layout app { footer { text "f" } slot }
page "A" id=dup uses=app { text "a" }
page "B" id=dup uses=app { text "b" }
`
    expect(() => validate(parse(source))).not.toThrow()
    expect(nameErrors(source)).toHaveLength(2)
  })

  it('honours stopOnFirstError instead of collecting the rest', () => {
    const result = validate(parse(TWO_PAGES_ONE_ID), { stopOnFirstError: true })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('does not throw when all three scopes collide in one document', () => {
    const source = `
layout app { slot
  drawer "One" id="menu" { text "1" }
  drawer "Two" id="menu" { text "2" }
}
layout app { slot }
page "A" id=dup uses=app { modal "M" id="p" { text "1" } drawer "D" id="p" { text "2" } }
page "B" id=dup uses=app { text "b" }
`
    expect(() => validate(parse(source))).not.toThrow()
    expect(nameErrors(source)).toHaveLength(2)
    expect(elementIdErrors(source)).toHaveLength(2)
  })

  it('stops on the first element-id error when asked to', () => {
    const result = validate(parse(TWO_OVERLAYS_ONE_ID), { stopOnFirstError: true })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
  })
})
