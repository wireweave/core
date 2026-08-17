---
'@wireweave/core': patch
'@wireweave/language-data': patch
---

fix: correct the legacy entry fields both packages publish

`main` is the CommonJS fallback for resolvers that do not read `exports`, and
`module` is the bundler convention for the ESM build. Both packages pointed
`main` at the ESM `dist/index.js` while shipping a perfectly good
`dist/index.cjs`, so a consumer old enough to fall back to `main` got ESM
syntax it could not parse. `@wireweave/core` additionally set
`module: dist/index.mjs`, a file tsup has never emitted — webpack, rollup, and
any vite config that honours `module` resolved core to nothing.

Both now match the rest of the workspace: `main: dist/index.cjs`,
`module: dist/index.js`. Modern resolution is unaffected — the `exports` maps
were already correct and take precedence.
