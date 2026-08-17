/**
 * The authorable surface changes only when someone says it changed.
 *
 * The two closure gates are each one-directional. `spec-reference-closure`
 * asks whether every referenced name is declared; `spec-render-closure` asks
 * whether every declared name reaches the output. Both are satisfied by an
 * empty surface. Delete an attribute from thirty-nine elements and neither
 * fires: nothing references it, so nothing hangs, and nothing declares it, so
 * nothing goes unrendered. The gates verify that what exists is coherent, not
 * that it still exists.
 *
 * That is not hypothetical. `span` left `BOX_ATTRIBUTES` in a refactor and no
 * instrument in this package saw it. Corpus validation, the one gate with a
 * number attached, *improved* across the same change — a single corpus file
 * writes `span`, so the withdrawal cost one error while an unrelated repair
 * removed twenty-seven. A total that moves for two reasons reports neither, and
 * a ratchet on a total is structurally blind to any shrink smaller than the
 * growth it travels with.
 *
 * So the surface is snapshotted and diffed in both directions, and the two
 * directions are reported as different things:
 *
 * - **GREW** — an attribute became writable. Usually intended (a renderer
 *   landed) and usually harmless, but it is new syntax nobody reviewed.
 * - **SHRANK** — an attribute stopped being writable. Documents already written
 *   against it now fail validation, and the author's only signal is an error on
 *   a line they did not touch.
 *
 * Neither is treated as the safe direction, because "the number went down" is
 * exactly the disguise the `span` withdrawal wore.
 *
 * **Structural, not flat.** The snapshot records which shared lists an element
 * spreads and what it adds beyond them, rather than the ~1500 composed names.
 * A name entering or leaving `BOX_ATTRIBUTES` is then one failing assertion
 * about one list instead of thirty-nine identical ones about elements, and the
 * diff a reviewer reads says where the change actually happened.
 *
 * The decomposition is computed from core, not asserted from memory, and
 * {@link decompose} is checked against the real attribute set before any
 * comparison runs — a decomposition that quietly stopped reconstructing its
 * input would make every element agree with the baseline forever.
 */

import { describe, it, expect } from 'vitest'
import {
  COMPONENT_SPECS,
  BLOCK_NODE_SPECS,
  BOX_ATTRIBUTES,
  CONTAINER_ATTRIBUTES,
  INTERACTIVE_ATTRIBUTES,
  type ComponentSpec,
} from '@wireweave/core/spec'
import {
  SHARED_ATTRIBUTE_LISTS,
  ELEMENT_SURFACE,
  BLOCK_SURFACE,
  type SurfaceEntry,
} from './spec-surface-baseline'

/** The live shared lists, under the names the snapshot uses. */
const LIVE_SHARED_LISTS = {
  BOX: BOX_ATTRIBUTES,
  CONTAINER: CONTAINER_ATTRIBUTES,
  INTERACTIVE: INTERACTIVE_ATTRIBUTES,
} as const

type SharedListName = keyof typeof LIVE_SHARED_LISTS

const SHARED_LIST_NAMES = Object.keys(LIVE_SHARED_LISTS) as SharedListName[]

/**
 * Split an attribute set into "spreads these shared lists" plus "adds these".
 *
 * A list counts as spread when the element carries all of it. That is the
 * shape core actually writes (`[...BOX_ATTRIBUTES, 'scroll']`), and it is
 * recoverable from the composed result without core having to record its own
 * structure — which matters, because the composed array is all core exports.
 *
 * A near-miss — an element carrying all of `BOX` but one name — decomposes as
 * no shared list and twenty-two `own` entries, so it shows up as a loud diff
 * rather than a quiet one. That is the intended reading: dropping one name from
 * a spread list is a bigger event than adding one name beside it.
 */
function decompose(attributes: readonly string[]): SurfaceEntry {
  const carried = new Set(attributes)
  const shared = SHARED_LIST_NAMES.filter((name) =>
    LIVE_SHARED_LISTS[name].every((attr) => carried.has(attr)),
  )
  const covered = new Set(shared.flatMap((name) => LIVE_SHARED_LISTS[name]))
  return { shared, own: attributes.filter((attr) => !covered.has(attr)) }
}

/** Expand a decomposition back into the attribute set it stands for. */
function recompose(entry: SurfaceEntry): Set<string> {
  return new Set([...entry.shared.flatMap((name) => LIVE_SHARED_LISTS[name]), ...entry.own])
}

/** Names in `next` and not in `prev`. */
function added(prev: readonly string[], next: readonly string[]): string[] {
  const before = new Set(prev)
  return next.filter((name) => !before.has(name))
}

/** One difference between the recorded surface and the live one. */
interface Drift {
  direction: 'GREW' | 'SHRANK'
  where: string
  what: string
}

const describeDrift = (drift: Drift): string => `${drift.direction}  ${drift.where}  ${drift.what}`

/**
 * Compare one recorded entry against one live entry.
 *
 * Shared-list membership and own-attributes are reported separately: an element
 * that stops spreading `CONTAINER` and an element that loses a single local
 * attribute are different edits, and collapsing them into one "these names
 * disappeared" line would hide which one happened.
 */
function driftBetween(where: string, before: SurfaceEntry, after: SurfaceEntry): Drift[] {
  const drifts: Drift[] = []
  const record = (direction: Drift['direction'], names: string[], label: string) => {
    if (names.length > 0) drifts.push({ direction, where, what: `${label} ${names.join(', ')}` })
  }

  record('GREW', added(before.shared, after.shared), 'now spreads')
  record('SHRANK', added(after.shared, before.shared), 'no longer spreads')
  record('GREW', added(before.own, after.own), 'gained')
  record('SHRANK', added(after.own, before.own), 'lost')
  return drifts
}

/** Compare a whole recorded surface against the live specs it describes. */
function driftAgainst(
  recorded: Readonly<Record<string, SurfaceEntry>>,
  specs: readonly ComponentSpec[],
  keyOf: (spec: ComponentSpec) => string,
): Drift[] {
  const live = new Map(specs.map((spec) => [keyOf(spec), decompose(spec.attributes)]))
  const drifts: Drift[] = []

  for (const key of live.keys()) {
    if (!(key in recorded)) {
      drifts.push({ direction: 'GREW', where: key, what: 'is a new element, not in the snapshot' })
    }
  }
  for (const [key, entry] of Object.entries(recorded)) {
    const current = live.get(key)
    if (!current) {
      drifts.push({ direction: 'SHRANK', where: key, what: 'no longer exists' })
      continue
    }
    drifts.push(...driftBetween(key, entry, current))
  }
  return drifts
}

const UPDATE_INSTRUCTIONS =
  'Update __tests__/spec-surface-baseline.ts in the same commit as the spec change, ' +
  'and name the direction in the message. GREW means new writable syntax; SHRANK means ' +
  'documents that already use the attribute stop validating.'

describe('authorable surface snapshot', () => {
  describe('the decomposition is honest', () => {
    it('reconstructs every element and block spec exactly', () => {
      const lying: string[] = []

      for (const spec of [...COMPONENT_SPECS, ...BLOCK_NODE_SPECS]) {
        const rebuilt = recompose(decompose(spec.attributes))
        const declared = new Set(spec.attributes)
        const missing = spec.attributes.filter((attr) => !rebuilt.has(attr))
        const invented = [...rebuilt].filter((attr) => !declared.has(attr))
        if (missing.length || invented.length) {
          lying.push(
            `${spec.nodeType}: missing ${missing.join(', ') || '(none)'} · invented ${invented.join(', ') || '(none)'}`,
          )
        }
      }

      expect(
        lying,
        'decompose()/recompose() no longer round-trip. Every comparison below is ' +
          'reading a surface that is not the real one, so fix this before reading any ' +
          'other failure in this file.',
      ).toEqual([])
    })

    it('leaves nothing in own that a spread list already covers', () => {
      const redundant = [...COMPONENT_SPECS, ...BLOCK_NODE_SPECS].flatMap((spec) => {
        const entry = decompose(spec.attributes)
        const covered = new Set(entry.shared.flatMap((name) => LIVE_SHARED_LISTS[name]))
        const overlap = entry.own.filter((attr) => covered.has(attr))
        return overlap.length ? [`${spec.nodeType}: ${overlap.join(', ')}`] : []
      })

      expect(redundant, 'the decomposition is not canonical; the same name appears twice').toEqual(
        [],
      )
    })
  })

  describe('the shared lists', () => {
    it.each(SHARED_LIST_NAMES)('%s holds exactly the recorded names', (name) => {
      const recorded = SHARED_ATTRIBUTE_LISTS[name] as readonly string[]
      const live = LIVE_SHARED_LISTS[name]

      const grew = added(recorded, live)
      const shrank = added(live, recorded)

      expect(
        { GREW: grew, SHRANK: shrank },
        `${name}_ATTRIBUTES changed. Every element spreading it moved with it — this one ` +
          `assertion stands in for all of them. ${UPDATE_INSTRUCTIONS}`,
      ).toEqual({ GREW: [], SHRANK: [] })
    })
  })

  describe('per element', () => {
    it('matches the recorded surface in both directions', () => {
      const drifts = driftAgainst(ELEMENT_SURFACE, COMPONENT_SPECS, (spec) => spec.name)

      expect(drifts.map(describeDrift), UPDATE_INSTRUCTIONS).toEqual([])
    })
  })

  describe('per block node', () => {
    it('matches the recorded surface in both directions', () => {
      const drifts = driftAgainst(BLOCK_SURFACE, BLOCK_NODE_SPECS, (spec) => spec.nodeType)

      expect(
        drifts.map(describeDrift),
        `Block nodes are writable only inside a parent element, so they are absent from ` +
          `COMPONENT_SPECS and a walk over elements alone never sees them. ${UPDATE_INSTRUCTIONS}`,
      ).toEqual([])
    })
  })

  /**
   * The gate detects both directions on a surface that is known to have moved.
   *
   * Without this, "no drift" is unfalsifiable from inside the file: a differ
   * that returned `[]` unconditionally would pass every assertion above and go
   * on passing through exactly the change it exists to catch. The fixtures
   * reproduce the two real edits — `span` leaving a spread list, `rounded`
   * arriving — so the self-test fails if the differ stops distinguishing them.
   *
   * A fixture rather than a temporary edit to core: a proof that lives in the
   * suite keeps holding, while a tamper-and-restore proves the gate worked on
   * the afternoon someone ran it.
   */
  describe('the differ is not vacuous', () => {
    const RECORDED: Record<string, SurfaceEntry> = {
      col: { shared: ['BOX', 'CONTAINER'], own: ['span', 'order'] },
      badge: { shared: ['BOX'], own: ['variant'] },
      gone: { shared: [], own: ['whatever'] },
    }
    const spec = (name: string, attributes: readonly string[]): ComponentSpec =>
      ({ name, nodeType: name, attributes }) as ComponentSpec

    const boxWithout = (dropped: string) => BOX_ATTRIBUTES.filter((attr) => attr !== dropped)

    it('names a lost own-attribute as SHRANK', () => {
      const drifts = driftAgainst(
        RECORDED,
        [
          spec('col', [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'order']),
          spec('badge', [...BOX_ATTRIBUTES, 'variant']),
          spec('gone', ['whatever']),
        ],
        (s) => s.name,
      )

      expect(drifts.map(describeDrift)).toEqual(['SHRANK  col  lost span'])
    })

    it('names a gained own-attribute as GREW', () => {
      const drifts = driftAgainst(
        RECORDED,
        [
          spec('col', [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'span', 'order']),
          spec('badge', [...BOX_ATTRIBUTES, 'variant', 'rounded']),
          spec('gone', ['whatever']),
        ],
        (s) => s.name,
      )

      expect(drifts.map(describeDrift)).toEqual(['GREW  badge  gained rounded'])
    })

    it('reports a name leaving a spread list as a lost list, not as 39 lost names', () => {
      const drifts = driftAgainst(
        RECORDED,
        [
          spec('col', [...boxWithout('w'), ...CONTAINER_ATTRIBUTES, 'span', 'order']),
          spec('badge', [...BOX_ATTRIBUTES, 'variant']),
          spec('gone', ['whatever']),
        ],
        (s) => s.name,
      )

      // Spelled from the live list rather than by hand: this test is about the
      // differ reporting one lost list plus the leftovers, not about which
      // names BOX happens to hold — the shared-list assertions above own that.
      expect(drifts.map(describeDrift)).toEqual([
        'SHRANK  col  no longer spreads BOX',
        `GREW  col  gained ${boxWithout('w').join(', ')}`,
      ])
    })

    it('reports an element appearing and an element disappearing', () => {
      const drifts = driftAgainst(
        RECORDED,
        [
          spec('col', [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'span', 'order']),
          spec('badge', [...BOX_ATTRIBUTES, 'variant']),
          spec('brandNew', ['whatever']),
        ],
        (s) => s.name,
      )

      expect(drifts.map(describeDrift)).toEqual([
        'GREW  brandNew  is a new element, not in the snapshot',
        'SHRANK  gone  no longer exists',
      ])
    })

    it('holds its peace when nothing moved', () => {
      const drifts = driftAgainst(
        RECORDED,
        [
          spec('col', [...BOX_ATTRIBUTES, ...CONTAINER_ATTRIBUTES, 'span', 'order']),
          spec('badge', [...BOX_ATTRIBUTES, 'variant']),
          spec('gone', ['whatever']),
        ],
        (s) => s.name,
      )

      expect(drifts).toEqual([])
    })
  })
})
