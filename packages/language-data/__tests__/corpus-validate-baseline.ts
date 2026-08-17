/**
 * Recorded validation state of the `.wf` corpus.
 *
 * These are measurements, not targets. `validate()` today rejects DSL that core
 * itself parses, so the count cannot be driven to zero from this package: the
 * overwhelming majority of these errors are core-side defects, and only a small
 * remainder are genuine authoring errors in the corpus. Fixing them belongs to
 * core's owners, and which owner depends on the class.
 *
 * Two opposite causes can produce the same error — a spec that lags the renderer,
 * and a spelling the renderer never implemented — and they take opposite fixes.
 * They are separated here item by item, by rendering each element with and
 * without the attribute and comparing output rather than by reading the spec.
 * The result is one-sided: **no remaining error is a spec that lags the
 * renderer.** Every one of the 48 names an attribute that no renderer honours on
 * that element, so the fix is never to add it to `ComponentSpec.attributes` —
 * doing that would turn a visible error into a silently dropped attribute.
 *
 * What the current count is made of, by why the attribute was written:
 *
 * - **28** — a spelling the language does use, but on other elements: `hover` on
 *   `row` ×15 (only `table` renders it), `variant` on `button` ×4 (button reads
 *   the boolean shorthands `primary`/`ghost`/`danger`, badge and alert read
 *   `variant`), `size` on `progress` ×3, `navigate` on `row` ×2, `active` on
 *   `nav` ×1 (only `tabs` takes it at node level), `position`/`bottom`/`right` on
 *   `button` ×3. Each is a surface inconsistency the author reasonably guessed
 *   wrong about; closing one means implementing that render path, not declaring
 *   the attribute.
 * - **9** — the `size=2xl` / `size=3xl` tokenizer defect: the value lexes as `2`
 *   plus a bare `xl`, which the generic attribute spread then attaches as
 *   `xl=true`. The source is valid intent, so this is a grammar defect, not an
 *   authoring error.
 * - **9** — bare identifiers the generic attribute spread turns into `name=true`,
 *   so a shorthand and a typo are indistinguishable (`badge "X" pill success`, a
 *   lone `spacer` line absorbed by the element above it).
 * - **2** — silent losses newly made visible, not newly created: `span` on
 *   `sidebar` and `main`. `span` used to sit in the tier every element spreads,
 *   so these parsed clean while the renderer dropped them; it now sits on `col`
 *   alone, the one element that reads it, and they surface as errors.
 *
 * **What these numbers cover.** They are the errors inside the validator's field
 * of view, not the errors in the corpus. `validateNode` recurses through
 * `children` only (`core/src/validation/index.ts:143`), so nodes reached through
 * an `items` array — `NavGroup.items`, `Dropdown.items`, `List.items` — are
 * never visited. The same bogus attribute is reported on the `children` path and
 * accepted silently inside all three. Those nodes now carry a type and a `loc`,
 * so widening the walk is possible, and doing so will make these numbers **rise**
 * without anything having regressed. Read a future increase against this
 * paragraph before treating it as a regression, and re-measure the breakdown when
 * it happens.
 *
 * A class leaves this list entirely when its cause is fixed — parser node-type
 * casing was one and is not listed. So the breakdown is re-measured whenever the
 * totals move, rather than the totals being edited on their own: numbers that
 * still add up over a description of the wrong classes is the failure mode this
 * header exists to prevent.
 *
 * Until each class has a decided severity, this file keeps the count monotonic:
 * the gate fails if it rises, and fails if it falls without these numbers being
 * lowered to match. That makes progress one-way while the decision is pending.
 *
 * **Lower these, never raise them.** Raising a number to make the gate pass
 * discards the guarantee the gate exists to provide.
 */
export const CORPUS_VALIDATE_BASELINE = {
  /**
   * Total `.wf` files measured. Guarded downward only — new corpus files are
   * welcome, but a shrinking corpus can drop the error count for the wrong
   * reason, which would otherwise read as an improvement.
   */
  files: 70,
  /** Files with at least one parse or validation failure. */
  failingFiles: 15,
  /** Total validation errors across all files. */
  errors: 48,
} as const
