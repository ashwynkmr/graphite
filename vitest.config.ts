import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
    // The share card reads its colours from tokens.css, so tests need the file's real contents.
    css: { include: /tokens\.css/ },
  },
});
