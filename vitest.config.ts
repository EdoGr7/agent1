import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: false,
    testTimeout: 15000,
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/bin/**", "src/**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
