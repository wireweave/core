// @ts-check
import { resolve } from 'node:path'

import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier/flat'

export default tseslint.config(
  // Anything git refuses to track is not this repo's code to lint — build
  // output, caches, and the gitignored .local/ scratch area all live there.
  // Reusing .gitignore rather than restating it keeps the two from drifting:
  // a new scratch directory is excluded the moment it is ignored, instead of
  // reddening root lint until someone remembers to copy the path here.
  includeIgnoreFile(resolve(import.meta.dirname, '.gitignore')),

  {
    // Every package and docs/ ships its own eslint.config.mjs and is linted by
    // its own `lint` script, so this config's real subject is whatever sits at
    // the repository root — scripts/, this file, commitlint.config.js. Ignoring
    // the workspaces makes that explicit and makes root `eslint .` lint exactly
    // the files nobody else owns, with no path list to keep in sync: a new root
    // script is covered the moment it exists.
    ignores: [
      '**/dist',
      'node_modules',
      '**/.vitepress/dist',
      '**/.vitepress/cache',
      'packages/**',
      'docs/**',
    ],
  },

  // base: JS recommended
  js.configs.recommended,

  // TS recommended (type-checked rules enabled per-package; root stays type-unaware)
  ...tseslint.configs.recommended,

  // common rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Repo-level guard scripts (scripts/*.mjs) run under Node, so `process` and
  // `console` are theirs to use — without this they fail `no-undef` on every
  // line that reports a gate result. Declared inline, matching how each
  // package's own config does it, rather than pulling in the `globals` package
  // for two names.
  //
  // `no-console` is off here for the same reason, one level up. For a guard
  // script the report IS the product: `--list` feeds a shell loop over stdout,
  // and the verified/skipped counts are what a CI log is read for. Every one of
  // these scripts had reached that conclusion independently and carried its own
  // file-level `eslint-disable no-console` — five copies of one decision, and a
  // sixth waiting for the next gate script. Stated once here instead, so the
  // rule reflects what this directory is rather than being switched off five
  // times. Note this covers scripts/ at the repo root only; packages/*/scripts
  // run under their own package config.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Disable stylistic rules conflicting with Prettier — must be last
  prettier,
)
