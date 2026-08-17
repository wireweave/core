/**
 * Every attribute name a spec references is a name the attribute registry declares.
 *
 * `ATTRIBUTE_SPECS` is the registry: `validate()` consults it to decide whether
 * an attribute exists at all, and this package turns it into hover and
 * completion. Element specs, block specs and the shared name lists then
 * *reference* those names to say which element may carry which attribute.
 * Nothing checked that what they reference is something the registry has, so a
 * spec could point at an attribute that was never declared and the reference
 * would simply hang.
 *
 * `collapsed` was one. The `group` block spec listed it, no `AttributeSpec`
 * declared it, and the renderer emitted nothing for it: `validate()` accepted
 * `group collapsed` because the block spec allowed it, editors offered nothing
 * because the registry did not know the name, and the render dropped it. Three
 * layers, three different answers, and no failure anywhere — which is why it
 * survived until someone read the specs by hand. Core has since deleted the
 * reference, which is the right repair for a name no renderer implements; this
 * gate is what makes the next one fail instead of hiding.
 *
 * The assertion is one direction only: referenced ⊆ declared. The opposite
 * direction — declared ⊆ rendered — is a behavioral question that no comparison
 * of sets can answer, and it is a separate gate.
 *
 * It lives here rather than in core because core's spec is the subject. A check
 * shipped alongside the thing it checks is the producer grading its own output;
 * this package already consumes the registry, so it can ask from outside.
 */

import { describe, it, expect } from 'vitest'
import {
  ATTRIBUTE_SPECS,
  COMPONENT_SPECS,
  BLOCK_NODE_SPECS,
  BOX_ATTRIBUTES,
  CONTAINER_ATTRIBUTES,
  INTERACTIVE_ATTRIBUTES,
} from '@wireweave/core/spec'

/** A spec naming an attribute, as opposed to the registry declaring one. */
interface Reference {
  /** Where the name is referenced, phrased for a failure message. */
  site: string
  attribute: string
}

/** The shape the closure is computed over, so it can also be fed a fixture. */
interface SpecSource {
  declared: readonly string[]
  elements: readonly { name: string; attributes: readonly string[] }[]
  blocks: readonly { name: string; attributes: readonly string[] }[]
  lists: readonly (readonly [label: string, names: readonly string[]])[]
}

/**
 * Every place in a spec source that names an attribute instead of declaring one.
 *
 * Element specs and block specs are separate arrays on purpose — `item` and
 * `group` are not writable on their own, so they are deliberately absent from
 * `COMPONENT_SPECS`. A walk that visits only the element specs cannot see a
 * block spec's references at all, which is exactly how `collapsed` stayed
 * invisible underneath a passing test named "covers every attribute the
 * component specs reference". The shared name lists are included for the same
 * reason: they are reference sites, not declarations.
 */
function referenceSites(source: SpecSource): Reference[] {
  const references: Reference[] = []
  for (const spec of source.elements) {
    for (const attribute of spec.attributes) {
      references.push({ site: `element "${spec.name}"`, attribute })
    }
  }
  for (const spec of source.blocks) {
    for (const attribute of spec.attributes) {
      references.push({ site: `block "${spec.name}"`, attribute })
    }
  }
  for (const [label, names] of source.lists) {
    for (const attribute of names) {
      references.push({ site: label, attribute })
    }
  }
  return references
}

/** References naming something the registry does not declare. */
function hangingReferences(source: SpecSource): Reference[] {
  const declared = new Set(source.declared)
  return referenceSites(source).filter((reference) => !declared.has(reference.attribute))
}

const CORE: SpecSource = {
  declared: ATTRIBUTE_SPECS.map((spec) => spec.name),
  elements: COMPONENT_SPECS,
  blocks: BLOCK_NODE_SPECS,
  lists: [
    ['BOX_ATTRIBUTES', BOX_ATTRIBUTES],
    ['CONTAINER_ATTRIBUTES', CONTAINER_ATTRIBUTES],
    ['INTERACTIVE_ATTRIBUTES', INTERACTIVE_ATTRIBUTES],
  ],
}

/**
 * References that hang today, recorded so this gate can ship green.
 *
 * Empty: every name the specs reference is a name the registry declares.
 *
 * Deliberately not `PENDING_CORE_ATTRIBUTES`. That list means "real DSL core
 * already parses and renders, which its spec omits", and every entry there is an
 * argument for adding the name to `ATTRIBUTE_SPECS`. This list would assert
 * nothing of the kind. A hanging reference has two opposite repairs — declare
 * the attribute, or delete the reference — and which one is right depends on
 * whether the renderer implements it. Recording one as pending picks the answer,
 * and picking wrong turns a silently dropped value into legal authoring.
 */
const UNRESOLVED_REFERENCES: readonly string[] = []

describe('spec reference closure', () => {
  const hanging = hangingReferences(CORE)

  it('walks every kind of reference site', () => {
    // Non-vacuity, real-input half. The assertions below are trivially true
    // against an empty walk, and the defect this gate exists to catch lived in
    // the category a narrower walk omitted — so every category must be shown to
    // contribute against the actual core spec.
    expect(CORE.declared.length, 'the attribute registry is empty').toBeGreaterThan(0)
    const references = referenceSites(CORE)
    for (const site of [
      'element "',
      'block "',
      'BOX_ATTRIBUTES',
      'CONTAINER_ATTRIBUTES',
      'INTERACTIVE_ATTRIBUTES',
    ]) {
      expect(
        references.filter((reference) => reference.site.startsWith(site)).length,
        `no references collected from ${site} — the walk lost a category`,
      ).toBeGreaterThan(0)
    }
  })

  it('reports a hanging reference when one exists', () => {
    // Non-vacuity, detector half. The real spec is closed today, so nothing in
    // this file would fail if `hangingReferences` silently returned nothing —
    // the suite would stay green while the gate had stopped working. Running the
    // same function over a fixture that does hang keeps the detector honest
    // without waiting for core to break again.
    //
    // The fixture hangs in the block category on purpose: that is the one the
    // previous test omitted, and the one `collapsed` hid in.
    const fixture: SpecSource = {
      declared: ['w', 'h'],
      elements: [{ name: 'card', attributes: ['w', 'h'] }],
      blocks: [{ name: 'group', attributes: ['w', 'ghost'] }],
      lists: [['BOX_ATTRIBUTES', ['h']]],
    }

    expect(hangingReferences(fixture)).toEqual([{ site: 'block "group"', attribute: 'ghost' }])
  })

  it('declares every attribute the specs reference', () => {
    const unexpected = hanging
      .filter((reference) => !UNRESOLVED_REFERENCES.includes(reference.attribute))
      .map((reference) => `${reference.site} references "${reference.attribute}"`)

    expect(
      unexpected,
      'these names are referenced by a spec but declared by no AttributeSpec, so ' +
        'validate() accepts them, editors cannot complete them, and nothing renders them',
    ).toEqual([])
  })

  it('keeps the unresolved list shrinking, never growing', () => {
    // Any entry has to stay earned. Once core either declares the name or drops
    // the reference, the entry describes something that no longer exists — and a
    // stale exemption silently re-opens the hole it documents.
    const stale = UNRESOLVED_REFERENCES.filter(
      (name) => !hanging.some((reference) => reference.attribute === name),
    )

    expect(
      stale,
      'these are no longer hanging — core resolved them, so delete them from ' +
        'UNRESOLVED_REFERENCES',
    ).toEqual([])
  })
})
