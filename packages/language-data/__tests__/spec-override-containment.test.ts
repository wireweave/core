/**
 * An element-scoped override may narrow a declared attribute and nothing else.
 *
 * `ATTRIBUTE_OVERRIDES` exists because the attribute registry is keyed by name
 * alone and so can hold only one answer per name, while some facts are true on
 * one element and false on the next. That makes it a second table of attribute
 * truth, and a second table is the shape that produced `collapsed` — three
 * layers, three different answers, no failure anywhere (see
 * `spec-reference-closure.test.ts`). The difference has to be enforced, not
 * intended: an override says *less* than the registry about *fewer* elements,
 * and can never say something the registry has not already said.
 *
 * Four containments, each a different way the second table could become a
 * second registry:
 *
 * 1. **Element exists** — every key names a node type the parser can emit.
 * 2. **Attribute is declared** — the element already accepts the attribute.
 *    Without this an override would add an attribute by the side door, one that
 *    `validate()` rejects and `isValidAttribute` denies while `attributeFor`
 *    describes it in detail.
 * 3. **Name is registered** — the attribute is in `ATTRIBUTE_SPECS`. This is the
 *    mirror of gate A's referenced ⊆ declared, for the second table.
 * 4. **Narrower, not different** — values may only shrink an existing domain and
 *    a type may only close an open one. An override that widened would be a
 *    fact no element-blind consumer can see and no gate covers. Its value half
 *    is dormant: comparing domains needs the registry to enumerate one, and the
 *    registry keeps `icon` and `name` open on purpose — which is section 5. The
 *    type half runs for all eight. `spec-override-baseline.ts` records that
 *    split and fails if it moves in either direction.
 *
 * The fifth section is the one the whole layer exists for: the glyph vocabulary
 * must stay *out* of the element-blind mirror. `VALUE_KEYWORDS` is a flat
 * alternation matched against any value position, so absorbing 1.6k icon names
 * into the registry would colour `home` and `map` as language constants in a
 * document with no icon in it. That the values are reachable only through
 * `attributeFor` is the decision; these assertions are what make it hold.
 *
 * It lives here rather than in core for the reason gate A does: core's spec is
 * the subject, and a check shipped with its subject is the producer grading its
 * own output.
 */

import { describe, it, expect } from 'vitest'
import {
  ATTRIBUTE_MAP,
  ATTRIBUTE_OVERRIDES,
  ATTRIBUTE_SPECS,
  BLOCK_NODE_SPECS,
  COMPONENT_SPECS,
  LUCIDE_ICON_NAMES,
  NODE_TYPE_MAP,
  VALID_ATTRIBUTE_NAMES,
  attributeFor,
  type AttributeOverride,
  type AttributeValueType,
} from '@wireweave/core/spec'
import { getIconData } from '@wireweave/core/renderer'

import { VALUE_KEYWORDS } from '../src/keywords.js'
import { WIDENING_ARM_BASELINE, type WideningArm } from './spec-override-baseline.js'

/** One entry of the override table, flattened for iteration and messages. */
interface Entry {
  nodeType: string
  attribute: string
  override: AttributeOverride
  /** `Icon.name`, for failure messages. */
  pair: string
}

const ENTRIES: readonly Entry[] = Object.entries(ATTRIBUTE_OVERRIDES).flatMap(
  ([nodeType, byAttribute]) =>
    Object.entries(byAttribute).map(([attribute, override]) => ({
      nodeType,
      attribute,
      override,
      pair: `${nodeType}.${attribute}`,
    })),
)

/** Every spec that can carry attributes, elements and block-scoped nodes alike. */
const ALL_SPECS = [...COMPONENT_SPECS, ...BLOCK_NODE_SPECS]

/**
 * Types an override may narrow *to*, keyed by what it narrows *from*.
 *
 * Only one move is a narrowing: closing an open domain into an enumerated one.
 * `string` → `number` is not narrower, it is a different attribute; `enum` →
 * `string` is wider. Staying put is always allowed and is not listed.
 */
const NARROWING_TYPES: Readonly<Partial<Record<AttributeValueType, readonly string[]>>> = {
  string: ['enum'],
  'string[]': ['enum'],
}

/** Attribute names some element narrows to an enumerated value set. */
const NARROWED_ATTRIBUTES = new Set(
  ENTRIES.filter((entry) => entry.override.values !== undefined).map((entry) => entry.attribute),
)

/** Every value any override enumerates, deduped. */
const OVERRIDE_VALUES = new Set(ENTRIES.flatMap((entry) => entry.override.values ?? []))

/**
 * Whether the widening comparison can execute for a pair.
 *
 * It needs both sides to exist. The override side always does here; the
 * registry side is open for `icon` and `name` on purpose, which is what makes
 * every pair dormant today. See `spec-override-baseline.ts`.
 */
function armStateFor(entry: Entry): WideningArm {
  if (entry.override.values === undefined) return 'dormant'
  return ATTRIBUTE_MAP.get(entry.attribute)?.values === undefined ? 'dormant' : 'live'
}

/** The arm state of every pair in the live table. */
const LIVE_ARM_STATE: Readonly<Record<string, WideningArm>> = Object.fromEntries(
  ENTRIES.map((entry) => [entry.pair, armStateFor(entry)]),
)

/** Pairs the baseline says the widening comparison runs for. */
const BASELINE_LIVE_PAIRS = Object.entries(WIDENING_ARM_BASELINE)
  .filter(([, state]) => state === 'live')
  .map(([pair]) => pair)
  .sort()

/**
 * Drift between a recorded arm-state table and the live one, in both
 * directions — see the baseline's header for why waking is a failure too.
 *
 * Exported shape rather than an inline comparison so the fixtures at the bottom
 * can drive it with tables that do drift. A differ that stopped reporting would
 * otherwise make this file green forever, which is the failure mode the whole
 * baseline exists to catch.
 */
export function armDrift(
  baseline: Readonly<Record<string, WideningArm>>,
  live: Readonly<Record<string, WideningArm>>,
): string[] {
  const drift: string[] = []

  for (const [pair, state] of Object.entries(live)) {
    const recorded = baseline[pair]
    if (recorded === undefined) {
      drift.push(`ADDED   ${pair} is a new override pair, arm is ${state}`)
    } else if (recorded !== state) {
      drift.push(
        state === 'live'
          ? `WOKE    ${pair} the registry now enumerates it — check the arm has something to ` +
              `say, then record 'live'`
          : `SLEPT   ${pair} the widening comparison no longer runs — coverage withdrawn`,
      )
    }
  }

  for (const pair of Object.keys(baseline)) {
    if (!(pair in live)) drift.push(`REMOVED ${pair} is no longer an override pair`)
  }

  return drift.sort()
}

const ARM_UPDATE_INSTRUCTIONS =
  'Update __tests__/spec-override-baseline.ts in the same commit as the spec change, and name ' +
  'the direction in the message. WOKE means an assertion that used to skip now runs — check it ' +
  'has something to say before recording it. SLEPT means an assertion that used to run now ' +
  'skips, and a skipped assertion is green.'

describe('attribute override containment', () => {
  it('has a table to check', () => {
    // Every assertion below is a `for` over `ENTRIES`, so an empty table would
    // make the whole file green while proving nothing. These counts are the
    // floor for the sections that read the override side: at least one
    // narrowing exists, and at least one of them enumerates values.
    //
    // They are *not* a floor for section 4's value comparison, which needs the
    // registry side too. Counting overrides that carry values says nothing
    // about whether the registry carries any, so this floor reads 8 while that
    // comparison runs 0 times. That split is recorded in
    // `spec-override-baseline.ts` and checked by the two assertions below.
    expect(ENTRIES.length).toBeGreaterThan(0)
    expect(NARROWED_ATTRIBUTES.size).toBeGreaterThan(0)
    expect(OVERRIDE_VALUES.size).toBeGreaterThan(0)
  })

  it('reaches exactly the assertions the baseline says it reaches', () => {
    expect(armDrift(WIDENING_ARM_BASELINE, LIVE_ARM_STATE), ARM_UPDATE_INSTRUCTIONS).toEqual([])
  })

  it('overrides only elements the parser can emit', () => {
    for (const { nodeType, pair } of ENTRIES) {
      expect(NODE_TYPE_MAP.has(nodeType), `${pair}: no node type ${nodeType}`).toBe(true)
    }
  })

  it('overrides only attributes the element already declares', () => {
    for (const { nodeType, attribute, pair } of ENTRIES) {
      const spec = NODE_TYPE_MAP.get(nodeType)
      expect(spec?.attributes, `${pair}: ${nodeType} declares no attributes`).toBeDefined()
      expect(
        spec?.attributes.includes(attribute),
        `${pair}: ${nodeType} does not declare ${attribute}, so the override would add it`,
      ).toBe(true)
    }
  })

  it('overrides only attributes the registry declares', () => {
    for (const { attribute, pair } of ENTRIES) {
      expect(
        VALID_ATTRIBUTE_NAMES.has(attribute),
        `${pair}: ${attribute} is not in ATTRIBUTE_SPECS`,
      ).toBe(true)
    }
  })

  it('narrows the value domain and never widens it', () => {
    const compared: string[] = []

    for (const { attribute, override, pair } of ENTRIES) {
      if (override.values === undefined) continue
      const base = ATTRIBUTE_MAP.get(attribute)
      expect(base, `${pair}: no registry entry`).toBeDefined()
      if (base?.values === undefined) continue
      compared.push(pair)

      const declared = new Set(base.values)
      const widening = override.values.filter((value) => !declared.has(value))
      // Only the head is named. A widening can run to thousands of values, and
      // a failure message that long is one nobody reads to the end of.
      expect(
        widening.length,
        `${pair}: introduces ${widening.length} value(s) the registry does not declare, ` +
          `starting with ${widening.slice(0, 5).join(', ')}`,
      ).toBe(0)
    }

    // Both `continue`s above skip an assertion, and a skipped assertion is
    // green. Which pairs survive to the comparison is therefore part of what
    // this test asserts, not an implementation detail of it — recorded in the
    // baseline, checked here against what the loop actually did rather than
    // against a second reading of the same condition.
    expect(
      compared.sort(),
      'the widening comparison ran for a different set of pairs than ' +
        '`spec-override-baseline.ts` records',
    ).toEqual(BASELINE_LIVE_PAIRS)
  })

  it('narrows the value type and never changes it to an unrelated one', () => {
    for (const { attribute, override, pair } of ENTRIES) {
      if (override.type === undefined) continue
      const base = ATTRIBUTE_MAP.get(attribute)
      expect(base, `${pair}: no registry entry`).toBeDefined()
      if (base === undefined) continue
      if (override.type === base.type) continue

      expect(
        NARROWING_TYPES[base.type] ?? [],
        `${pair}: ${base.type} → ${override.type} is not a narrowing`,
      ).toContain(override.type)
    }
  })

  it('never renames an attribute', () => {
    // The type forbids it, but the table is built by a function and a `name` key
    // would survive a cast. A renamed override is how a second registry starts:
    // the name it introduced would answer to `attributeFor` and to nothing else.
    for (const { override, pair } of ENTRIES) {
      expect(Object.keys(override), `${pair}: an override may not carry a name`).not.toContain(
        'name',
      )
    }
  })
})

describe('attributeFor composition', () => {
  it('returns the narrowed spec exactly where an override exists', () => {
    for (const { nodeType, attribute, override, pair } of ENTRIES) {
      const base = ATTRIBUTE_MAP.get(attribute)
      const resolved = attributeFor(nodeType, attribute)
      expect(resolved, `${pair}: resolves to nothing`).toBeDefined()
      expect(resolved).toEqual({ ...base, ...override })
    }
  })

  it('returns the registry entry untouched everywhere else', () => {
    let checked = 0
    for (const spec of ALL_SPECS) {
      for (const attribute of spec.attributes) {
        if (ATTRIBUTE_OVERRIDES[spec.nodeType]?.[attribute]) continue
        const base = ATTRIBUTE_MAP.get(attribute)
        if (base === undefined) continue
        expect(attributeFor(spec.nodeType, attribute)).toEqual(base)
        checked++
      }
    }
    // A `continue` chain can empty a loop silently; the count says it did not.
    expect(checked).toBeGreaterThan(0)
  })

  it('answers the same for an element keyword as for its node type', () => {
    let checked = 0
    for (const spec of COMPONENT_SPECS) {
      for (const attribute of spec.attributes) {
        expect(attributeFor(spec.name, attribute)).toEqual(attributeFor(spec.nodeType, attribute))
        checked++
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('has nothing to say about an attribute the element does not declare', () => {
    // The containment above is only meaningful if the lookup is scoped at all —
    // a function that returned the registry entry regardless of element would
    // satisfy every assertion in the previous block.
    const undeclared = ALL_SPECS.map((spec) => ({
      spec,
      attribute: ATTRIBUTE_SPECS.map((attr) => attr.name).find(
        (name) => !spec.attributes.includes(name),
      ),
    })).filter((candidate) => candidate.attribute !== undefined)

    expect(undeclared.length).toBeGreaterThan(0)
    for (const { spec, attribute } of undeclared) {
      expect(
        attributeFor(spec.nodeType, attribute as string),
        `${spec.nodeType}.${attribute as string}: resolved despite not being declared`,
      ).toBeUndefined()
    }
  })

  it('resolves nothing for an element nobody has heard of', () => {
    expect(attributeFor('NotAnElement', 'gap')).toBeUndefined()
  })
})

describe('glyph vocabulary stays out of the element-blind mirror', () => {
  it('keeps the narrowed attributes open in the registry', () => {
    for (const attribute of NARROWED_ATTRIBUTES) {
      const base = ATTRIBUTE_MAP.get(attribute)
      expect(base?.values, `${attribute}: the registry now enumerates its values`).toBeUndefined()
    }
  })

  it('lets no override value reach VALUE_KEYWORDS on the strength of the override', () => {
    // The four value keywords that are also icon names — `baseline`, `bold`,
    // `info`, `search` — are there because `align`, `weight`, `variant` and
    // `inputType` enumerate them, not because anything is glyph-valued. Derived
    // rather than listed: absorbing the glyph set into the registry would put
    // ~1.6k names into `VALUE_KEYWORDS` that no other attribute enumerates, and
    // this set is exactly those.
    const enumeratedElsewhere = new Set(
      ATTRIBUTE_SPECS.filter((spec) => !NARROWED_ATTRIBUTES.has(spec.name)).flatMap(
        (spec) => spec.values ?? [],
      ),
    )
    const leaked = VALUE_KEYWORDS.filter(
      (keyword) => OVERRIDE_VALUES.has(keyword) && !enumeratedElsewhere.has(keyword),
    )
    expect(leaked, `override values reached the editor vocabulary: ${leaked.join(', ')}`).toEqual(
      [],
    )
  })

  it('keeps the mirror the size of a language, not of a dataset', () => {
    // Corroborates the two set assertions with the fact they exist to protect:
    // the vocabulary an editor colours is small, and the glyph list is not.
    expect(VALUE_KEYWORDS.length).toBeLessThan(OVERRIDE_VALUES.size / 10)
  })
})

describe('glyph vocabulary is what the renderer can draw', () => {
  it('resolves every name the override offers', () => {
    // The behavioral half. A `values` list is a promise that writing one of
    // these draws something; the list and the dataset are two files, so the
    // promise is checked against the lookup the renderer actually performs
    // rather than against the list it was generated from.
    const unresolvable = LUCIDE_ICON_NAMES.filter((name) => getIconData(name) === undefined)
    expect(
      unresolvable,
      `names the renderer cannot draw: ${unresolvable.slice(0, 5).join(', ')}`,
    ).toEqual([])
  })

  it('distinguishes a glyph from a name that merely looks like one', () => {
    // Positive and negative control for the assertion above: `getIconData` has
    // to be capable of returning `undefined`, or the check is vacuous.
    expect(getIconData(LUCIDE_ICON_NAMES[0])).toBeDefined()
    expect(getIconData('definitely-not-a-lucide-icon')).toBeUndefined()
  })

  it('offers the glyph domain through attributeFor and not through the registry', () => {
    expect(attributeFor('icon', 'name')?.values).toEqual(LUCIDE_ICON_NAMES)
    expect(attributeFor('button', 'icon')?.values).toEqual(LUCIDE_ICON_NAMES)
    expect(ATTRIBUTE_MAP.get('name')?.values).toBeUndefined()
    expect(ATTRIBUTE_MAP.get('icon')?.values).toBeUndefined()
    // `name` on a radio is a group name, not a glyph. Same attribute, different
    // element, and the whole point of the layer if it answers differently.
    expect(attributeFor('radio', 'name')?.values).toBeUndefined()
    expect(attributeFor('avatar', 'name')?.values).toBeUndefined()
  })
})

describe('the arm tracker reports drift it is given', () => {
  // Every assertion above compares the live table against the baseline and
  // expects no drift, so all of them stay green if `armDrift` stops reporting.
  // These drive it with tables that do drift. They are fixtures rather than a
  // one-off tamper on the real table because a tamper proves the differ worked
  // on the day it was run, and a fixture proves it on every day after.
  const dormant = { 'A.icon': 'dormant' } as const
  const live = { 'A.icon': 'live' } as const

  it('says nothing when the tables agree', () => {
    expect(armDrift(dormant, dormant)).toEqual([])
  })

  it('reports a woken arm, which is a failure even though it is an improvement', () => {
    expect(armDrift(dormant, live)).toEqual([
      "WOKE    A.icon the registry now enumerates it — check the arm has something to say, then record 'live'",
    ])
  })

  it('reports a slept arm, the direction nothing else catches', () => {
    expect(armDrift(live, dormant)).toEqual([
      'SLEPT   A.icon the widening comparison no longer runs — coverage withdrawn',
    ])
  })

  it('reports a pair the baseline has never seen', () => {
    expect(armDrift({}, live)).toEqual(['ADDED   A.icon is a new override pair, arm is live'])
  })

  it('reports a pair that has left the table', () => {
    expect(armDrift(dormant, {})).toEqual(['REMOVED A.icon is no longer an override pair'])
  })

  it('reports every drifting pair, not the first one it meets', () => {
    expect(
      armDrift(
        { 'A.icon': 'dormant', 'B.icon': 'live' },
        { 'A.icon': 'live', 'C.icon': 'dormant' },
      ),
    ).toEqual([
      'ADDED   C.icon is a new override pair, arm is dormant',
      'REMOVED B.icon is no longer an override pair',
      "WOKE    A.icon the registry now enumerates it — check the arm has something to say, then record 'live'",
    ])
  })
})
