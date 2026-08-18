# `.wf` regression corpus

71 wireframe source files written against the grammar as it stands today. They
exist to answer one question after the grammar is extended: **does source that
parsed before still parse to the same thing?**

The harness that reads them is `__tests__/corpus.test.ts`; the frozen expected
results live in `__tests__/corpus-baseline/`.

```bash
pnpm --filter @wireweave/core test corpus       # check against the baseline
pnpm --filter @wireweave/core test corpus -u    # re-freeze after a reviewed change
```

## Why files nobody uses are committed here

Two reasons, and both are the point rather than an accident.

**Durability.** 32 of these files lived only under gitignored `.local/`
directories on one machine — the swapgrid backups and the dogfood artifacts.
They were one `rm -rf` away from being gone, and with them the only record of
what real authored `.wf` looked like before the grammar changed. Copying them
into a committed fixture tree is what makes the baseline reproducible by anyone
else, later.

**The swapgrid wireframes were discarded for poor quality — and that does not
matter here.** They were dropped as _design output_. As _parser input_ they are
fully valid: they are genuine authored source exercising the grammar in ways
the hand-written test fixtures do not. A regression corpus asks "does this
still parse the same", not "is this good design". Do not delete them for being
bad wireframes.

## Where each file came from

Sources are separated by directory, so provenance survives and filename
collisions cannot happen (nine files are named `v1.wf`).

| Directory             | Files | Origin                                                                                         |
| --------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| `swapgrid-preremoval` | 15    | `wireweave-studio/.local/backups/swapgrid-wireframes-preremoval/screens/` — **gitignored**     |
| `swapgrid-2026-07-26` | 15    | `wireweave-studio/.local/backups/swapgrid-2026-07-26-2027/wireweave/screens/` — **gitignored** |
| `examples`            | 22    | `wireweave/_bak/examples/wf/`                                                                  |
| `studio-fixtures`     | 8     | `wireweave-studio/studio-harness/test/fixtures/*/wireweave/screens/`                           |
| `bookmark-v1`         | 3     | `wireweave/docs/aidlc-docs_wireweave-agent/products/01-bookmark/wireframes/v1/`                |
| `bookmark-v2`         | 4     | `wireweave/docs/aidlc-docs_wireweave-agent/products/01-bookmark/wireframes/v2/`                |
| `dogfood`             | 2     | `wireweave-studio/.local/dogfood-artifacts/shadow-bundle-run1/screens/` — **gitignored**       |
| `e2-demo`             | 1     | `wireweave/.local/e2-demo/` — **gitignored**                                                   |
| `repeat`              | 1     | Written for the `repeat N { … }` grammar addition — not imported from anywhere                 |

Directory layout under each source root is preserved, except that
`studio-fixtures` drops the `wireweave/screens/` middle segments
(`canonical-project/wireweave/screens/login/v1.wf` → `canonical-project/login/v1.wf`).

Notes on overlap, so nobody "cleans up" what looks like accidental duplication:

- `swapgrid-preremoval` and `swapgrid-2026-07-26` are two snapshots of the same
  15 screens taken at different times. 14 pairs are byte-identical; only
  `rider-map/v1.wf` differs. Both are kept because both were gitignored, and a
  duplicate costs nothing while a lost snapshot cannot be recovered.
- `dogfood/` holds two screens with the same names as the swapgrid sets, but
  the content differs — these came out of a shadow-bundle run, not the backups.
- `corrupt-manifests/` under `studio-fixtures` refers to corrupt _manifests_ in
  the studio harness. The `.wf` files themselves are ordinary source.

## Rules

- **Treat these files as read-only.** Reformatting or "fixing" one silently
  invalidates the baseline it was captured under. If a file must change, that
  is a deliberate act: change it, regenerate the baseline, and explain the
  diff.
- Adding files is fine — add them under a new source directory, then
  regenerate. The corpus inventory is itself snapshotted, so an addition or a
  deletion shows up as a failing test rather than as drift.
- Nothing here is published: `packages/core` ships `files: ["dist"]`, so the
  npm tarball contains no test fixtures.
