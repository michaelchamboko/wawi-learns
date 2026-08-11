import { defineConfig } from "vitest/config";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.unit.test.ts", "tests/**/*.property.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@wawi-learns/spike-local-data": resolve(here, "packages/spike-local-data/src/index.ts"),
      "@wawi-learns/spike-local-data/test": resolve(here, "packages/spike-local-data/test/index.ts"),
    },
  },
});