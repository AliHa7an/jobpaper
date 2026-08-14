import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/engine/tests/**/*.test.ts"],
    environment: "node",
  },
});
