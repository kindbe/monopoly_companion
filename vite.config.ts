import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      exclude: [
        "e2e/**",
        "dist/**",
        "playwright.config.ts",
        "vite.config.*",
        "**/*.test.*",
        "src/main.tsx",
        "src/server/index.ts",
        "src/shared/**",
        "src/test/**",
        "src/common/auctionTypes.ts",
        "src/components/**/types.ts",
        "**/*.d.ts"
      ],
      thresholds: {
        lines: 80,
        functions: 79,
        branches: 75,
        statements: 80
      }
    }
  }
});
