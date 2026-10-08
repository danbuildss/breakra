import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    // The handler's structured request log is asserted in handler tests; keep it out of test output.
    onConsoleLog: (log) => !log.includes('"breakra.analyze"'),
  },
});
