---
'@wireweave/core': patch
'@wireweave/language-data': patch
'@wireweave/markdown-plugin': patch
'@wireweave/ux-rules': patch
---

fix: serve CommonJS consumers CommonJS type declarations

Each of these packages ships both an ESM and a CJS build but declared a single
`exports` `"types"` entry pointing at the ESM `.d.ts`. TypeScript resolves types
through the same condition it resolves code, so a consumer doing
`require('@wireweave/core')` under `moduleResolution: node16`/`bundler` was
handed declarations that only typecheck when the package is dynamically
imported — the types said "ESM" while the code said "CJS".

The maps now split `import` and `require`, each with its own `types`, matching
the shape `@wireweave/agent-prompts` already used. Every subpath is covered, and
the `.d.cts` files they point at were already being emitted. No entry point was added or
removed and every path resolves to the same code as before.
