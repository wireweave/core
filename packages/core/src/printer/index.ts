/**
 * Canonical `.wf` printer — AST → DSL text serialization.
 *
 * {@link printWireframe} turns a parsed `WireframeDocument` back into `.wf`
 * source in a single deterministic canonical form; {@link formatWireframeCode}
 * is the parse-then-reprint convenience. The printer is the write-side
 * counterpart of `parse` and defines THE canonical form for generated `.wf`
 * files (round-trip determinism: `save(load(F)) ≡ F` for canonical files).
 *
 * Round-trip laws (all covered by `__tests__/printer.test.ts`):
 * 1. `parse(printWireframe(ast))` is structurally equivalent to `ast`
 *    (ignoring `loc`) — no information loss over parsed content.
 * 2. `printWireframe(parse(printWireframe(ast))) === printWireframe(ast)` —
 *    printing is an idempotent fixpoint.
 * 3. For already-canonical text: `printWireframe(parse(text)) === text`.
 *
 * Canonical form (derived from `src/grammar/wireframe.peggy`; where the
 * grammar allows several spellings, the simplest deterministic one is fixed):
 * - LF line endings, 2-space indentation, single spaces between head
 *   segments, no trailing whitespace, exactly one trailing newline (an empty
 *   document prints as an empty string).
 * - One blank line between top-level `page` blocks; no other blank lines.
 * - Blocks open on the head line (`page "Login" {`), one child per line,
 *   `}` on its own line. Empty blocks print `{}` where the grammar requires
 *   a block and are omitted where it does not.
 * - Attributes sort byte-wise by name; `name=value` without spaces;
 *   `true`-valued attributes print as bare flags. Page coordinates print as
 *   plain `x=… y=…` attributes (the parsed equivalent of `at(x, y)`).
 * - Strings are double-quoted with the grammar's five escapes
 *   (`\\ \" \n \r \t`). Attribute/object string values print unquoted when
 *   they match the grammar `Identifier` rule (never when they start with
 *   `true`/`false` — the `Boolean` rule would truncate them); array-item
 *   strings are always quoted.
 * - Numbers print in plain decimal; `{ value, unit }` shapes print as unit
 *   literals (`16px`) in attribute/object position and as object literals in
 *   array items (the grammar's `ArrayItem` has no unit alternative).
 * - Arrays print `[a, b]`; objects print `{ k=v, … }` with byte-wise sorted
 *   keys and comma separators.
 * - Fixed element forms: tables always print the verbose block form
 *   (`table { columns […] row […] }` — the only form covering column-less
 *   tables); dropdowns always print the block form; lists print the array
 *   form for plain items and the block form when every item is a list-item
 *   shape; nav/tabs print their array items and block children as parsed.
 * - Optional labels equal to `null`/`""` are omitted (the grammar folds `""`
 *   to `null`), except `placeholder`, which always prints an explicit `""`
 *   label — a bare `placeholder` keyword would be captured as a flag
 *   attribute of a preceding sibling.
 *
 * Documented non-round-trippable cases (no silent lossiness — everything
 * else throws):
 * - Comments never reach the AST (the grammar's `Comment` rule returns
 *   `null`), so printed output contains none. Per ADR-0003 §6-3 (Wireweave
 *   Studio), callers must rewrite only files whose content actually changed
 *   and keep unchanged files byte-verbatim.
 * - `loc` source locations are derived data and are not printed.
 * - The printer throws (never silently drops) on structures the grammar
 *   cannot express: non-finite or exponent-magnitude numbers, negative or
 *   fractional `marker`/annotation-`item` numbers, attribute names that are
 *   not grammar identifiers or that collide with child keywords, `tooltip`
 *   children (no tooltip block exists), nested arrays in array items, nav
 *   groups inside nav groups, and `null`/function/etc. attribute values.
 */

export { printWireframe, formatWireframeCode } from './print'
