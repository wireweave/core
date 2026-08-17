---
'@wireweave/core': patch
---

chore: serve core's source to the workspace and its dist to npm

`packages/core` now points `main` / `module` at `src/index.ts` and adds a
`development` condition to every `exports` entry, so TypeScript,
typescript-eslint and Vite/Vitest read core's source instead of its build
output. This removes the ordering dependency that made `lint`, `typecheck` and
`test` observe a half-written `dist/` when run alongside `build` — a race that
produced failures naming files the author never touched, and that vanished on
re-run, which taught readers that red meant nothing.

What npm receives is unchanged. A `publishConfig` block carries the dist-based
`main` / `module` / `types` / `exports` map, and pnpm substitutes it at pack
time; the packaging gate's `publint --strict` run asserts every substituted
field resolves, and the tarball gate asserts the published archive contains
exactly what those fields point at and nothing from `src/`.
