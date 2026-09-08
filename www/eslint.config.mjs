import js from "@eslint/js";
import next from "eslint-config-next";
import prettier from "eslint-config-prettier/flat";
import imports from "eslint-plugin-import";
import { defineConfig, globalIgnores } from "eslint/config";
import { configs as tseslintConfigs } from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  ...next,
  {
    // Next registers the import plugin; keep the existing import checks too.
    rules: {
      ...imports.configs.recommended.rules,
      ...imports.configs.typescript.rules,
    },
    settings: imports.configs.typescript.settings,
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [tseslintConfigs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts"]),
]);
