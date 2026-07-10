import { defineConfig } from 'vitest/config';

// Vitest runs only the unit suites under src/**. It intentionally does NOT load
// the React plugin: current tests cover pure logic (tax math, merkle ledger,
// sale mapping), so happy-dom is enough for localStorage / crypto.subtle.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
  },
});
