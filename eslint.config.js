import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", "coverage", "src/routeTree.gen.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Accessibility guardrails — keep the UI usable with a keyboard and screen reader.
      ...jsxA11y.flatConfigs.recommended.rules,
      "jsx-a11y/no-autofocus": ["warn", { ignoreNonDOM: true }],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
  {
    // shadcn/ui primitives are generated wrappers: content is supplied by callers.
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/anchor-has-content": "off",
    },
  },
  {
    // Auto-generated backend integration files are not hand-maintained.
    files: ["src/integrations/**/*.{ts,tsx}", "src/routeTree.gen.ts"],
    rules: {
      "prefer-const": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // Test files run in Node with Vitest globals.
    files: ["**/*.{test,spec}.{ts,tsx}", "src/test/**/*.{ts,tsx}", "*.config.ts"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  eslintPluginPrettier,
);
