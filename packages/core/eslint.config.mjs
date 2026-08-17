import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'storybook-static',
      'src/parser/generated-parser.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Root-level config files only. Anything under `scripts/` is covered
          // by `scripts/tsconfig.json` — see the note there for why this list
          // must not grow with the build.
          allowDefaultProject: [
            'eslint.config.mjs',
            'tsup.config.ts',
            'vitest.config.ts',
            '.storybook/main.ts',
            '.storybook/preview.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
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
  {
    files: ['__tests__/**/*.ts', 'src/**/*.test.ts', 'src/**/*.stories.ts', '.storybook/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // This package's build scripts (scripts/*.mjs) run under Node, so `console`
  // and `process` are theirs to use. `no-console` is off for the same reason it
  // is off for the repo-level guard scripts: for a build or gate script the
  // report IS the product — `build:icons` printing its icon count and
  // `check:*-sync` printing what drifted are how a CI log is read.
  //
  // Stated here rather than as a file-level `eslint-disable` header per script,
  // which is the same decision copied once per file and again for every script
  // added later. This block replaces one that matched `scripts/**/*.cjs` — a
  // glob left pointing at a file that no longer exists, and which also switched
  // off four `no-unsafe-*` rules for a generator that used `eval`. Those stay
  // ON: the current generator satisfies them by narrowing `unknown`, so nothing
  // here needs them relaxed.
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
)
