import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";

const base = defineConfig(
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/generated/**",
    "**/coverage/**",
    ".scratch/**",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      boundaries,
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
    },
    settings: {
      "boundaries/elements": [
        { type: "api", pattern: "apps/api/*" },
        { type: "web", pattern: "apps/web/*" },
        { type: "libs", pattern: "libs/*" },
        { type: "packages", pattern: "packages/*" },
      ],
      "boundaries/ignore": ["**/*.spec.ts", "**/*.test.ts", "**/*.config.*", "**/generated/**"],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // The web app may consume packages (contracts, ui, configs) only;
      // the api may consume libs and packages; libs/packages stay leaf-level.
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "api", allow: ["libs", "packages"] },
            { from: "web", allow: ["packages"] },
            { from: "libs", allow: ["packages"] },
            { from: "packages", allow: ["packages"] },
          ],
        },
      ],
    },
  },
);

export default base;
