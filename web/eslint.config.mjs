import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // PoC: Supabase row types are loose; will tighten with generated types later.
      "@typescript-eslint/no-explicit-any": "off",
      // PoC: setState inside async effect callbacks is intentional for fetch-then-render.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["tests/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
