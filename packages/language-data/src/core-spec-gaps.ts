/**
 * Vocabulary the editors need that `@wireweave/core/spec` does not state.
 *
 * Every other name in this package is derived from the core spec, which derives
 * the element set from the grammar. Two kinds of entry cannot be derived, and
 * they are different in kind — keeping them apart is the point of this module:
 *
 * - **`EDITOR_ONLY_*` is permanent and correct.** These are things an author
 *   types that the grammar desugars into a *different* AST key, so they never
 *   become attribute keys and correctly have no `AttributeSpec`. `ATTRIBUTE_SPECS`
 *   is keyed by the AST alphabet — `validate()` reads node keys — while editors
 *   complete the source alphabet. Where the two differ, the source spelling lives
 *   here. Entries must never be "fixed" by adding them to core.
 *
 * - **`PENDING_CORE_ATTRIBUTES` is a defect list.** Each entry is real DSL —
 *   parsed, rendered, and consumed by core itself — that core's spec omits.
 *   Because `validate()` derives its known-attribute set from `ATTRIBUTE_SPECS`,
 *   every entry there is reported as an unknown attribute. They belong in
 *   `packages/core/src/spec/attributes.ts`; until they land, dropping them would
 *   silently delete working vocabulary from autocomplete and hover.
 *
 * `core-spec-sync.test.ts` asserts this list stays disjoint from core, so the
 * moment core adopts an entry the build fails until the entry is deleted here.
 * The list can only shrink.
 *
 * Neither kind may restate a value core already declares. A desugared spelling
 * shares one value space with the AST key it becomes, so it reads that space out
 * of `ATTRIBUTE_SPECS` rather than repeating it — a second copy would drift the
 * moment core adds a value, and no gate would notice.
 */

import { ATTRIBUTE_SPECS } from '@wireweave/core/spec'

import type { AttributeDef } from './types.js'

/**
 * The value space core declares for `name`, read out of the attribute registry.
 *
 * Returns `undefined` when core declares no such attribute, which the sync test
 * turns into a failure — a silent `undefined` here would empty an editor-only
 * entry's completions without breaking anything else.
 */
function coreValuesOf(name: string): string[] | undefined {
  const values = ATTRIBUTE_SPECS.find((spec) => spec.name === name)?.values
  return values ? [...values] : undefined
}

/**
 * Surface syntax editors complete, which is deliberately not an attribute.
 */
export const EDITOR_ONLY_ATTRIBUTES: readonly AttributeDef[] = [
  {
    name: 'at',
    type: 'function',
    description:
      'Place page on the multi-page canvas at (x, y) — pages without at() auto-flow horizontally',
    example: 'at(0, 0)',
  },
  {
    // Desugared, not missing. `wireframe.peggy` (Input rule) reads the authored
    // `type`, deletes it, and re-emits it as `inputType`; the renderer then reads
    // `node.inputType` for the HTML type attribute. The rename is forced, not
    // incidental: `type` is every AST node's kind discriminant, which is why
    // `validation/index.ts` lists it among the structural keys it skips. Adding
    // `type` to `ATTRIBUTE_SPECS` would put the same name in `validate()`'s
    // known-attribute set and its structural-skip set at once, so core is right
    // to declare only `inputType` and this is the source spelling's only home.
    name: 'type',
    type: 'string',
    // One attribute, two spellings — so one value space. Copying core's list
    // would let `inputType` gain a value that `type=` never completes.
    values: coreValuesOf('inputType'),
    description: 'Input type — written as `type` and stored on the node as `inputType`',
    example: 'type=email',
  },
]

/**
 * Real attributes missing from `ATTRIBUTE_SPECS`.
 *
 * Empty: core's attribute registry states every attribute the editors need.
 *
 * An entry belongs here only while core omits an attribute that the DSL already
 * parses, renders, and consumes — dropping such a name instead would silently
 * delete working vocabulary from autocomplete and hover. Each entry carries the
 * evidence (the types, renderer, and consumers that prove the attribute is real)
 * so the core-side fix is actionable rather than a bare list of names.
 */
export const PENDING_CORE_ATTRIBUTES: readonly AttributeDef[] = []
