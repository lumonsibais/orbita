import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // Clean Architecture: domain y application no saben nada de React, HTTP ni pantallas.
    files: ["src/features/*/domain/**", "src/features/*/application/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "@tanstack/*"],
              message: "domain y application son TypeScript puro: sin React.",
            },
            {
              group: ["**/infrastructure/**", "**/presentation/**", "@/app/*", "@/shared/http/*"],
              message: "domain y application no dependen de capas externas.",
            },
          ],
        },
      ],
    },
  },
  {
    // presentation llama casos de uso; no habla con la API directamente.
    files: ["src/features/*/presentation/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/**", "@/shared/http/*"],
              message:
                "presentation usa casos de uso; las dependencias llegan desde @/app/container.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "presentation nunca hace fetch directo: usa un caso de uso." },
      ],
    },
  },
]);
