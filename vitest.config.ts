import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/types.ts',
        '**/types/**',
        'src/parser/generated-parser.js',
        'src/index.ts',
        'src/ast/index.ts',
        'src/ast/guards.ts',  // Type guard utilities
        'src/renderer/html/layout.ts',  // Internal module tested via public API
        'src/renderer/html/components.ts',  // Internal module tested via public API
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
