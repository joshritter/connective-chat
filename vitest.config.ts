import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/components/ui/**",
        "src/integrations/**",
        "src/routeTree.gen.ts",
        "src/router.tsx",
        "src/start.ts",
        "src/server.ts",
        "src/client.tsx",
        "src/routes/**",
      ],
      // Global floor: ratchet these up as more of the app gets covered,
      // never down. A drop below the floor fails `bun run test:coverage`.
      thresholds: {
        statements: 22,
        branches: 22,
        functions: 18,
        lines: 22,
        // Modules with real unit tests must stay well covered.
        "src/lib/utils.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/hooks/useTyping.ts": { statements: 85, branches: 75, functions: 85, lines: 90 },
        "src/components/chat/Composer.tsx": {
          statements: 80,
          branches: 85,
          functions: 60,
          lines: 85,
        },
        "src/components/chat/MessageRow.tsx": {
          statements: 70,
          branches: 70,
          functions: 55,
          lines: 70,
        },
        "src/components/chat/TypingIndicator.tsx": {
          statements: 100,
          branches: 85,
          functions: 100,
          lines: 100,
        },
        "src/components/chat/UserAvatar.tsx": {
          statements: 100,
          branches: 60,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
