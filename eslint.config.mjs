import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";
import localRules from "./eslint-local-rules.mjs";

export default tseslint.config(
  // ── Ignore patterns ─────────────────────────────────────────────
  {
    ignores: [
      "dist/",
      "node_modules/",
      "src-tauri/target/",
      "src/components/ui/", // shadcn/ui generated code
    ],
  },

  // ── Base + TypeScript ───────────────────────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── React + Hooks ───────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // ── Custom project rules ────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      local: { rules: localRules },
    },
    rules: {
      // File size
      "local/max-lines-per-file": ["error", { max: 500 }],
      // TypeScript strictness
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-as-const": "error",

      // Code quality
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-template-curly-in-string": "error",
      "no-unused-expressions": "error",

      // React quality
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ── Prettier (must be last to override formatting rules) ────────
  prettierConfig,
);
