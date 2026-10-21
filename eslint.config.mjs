import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "db_setup.cjs",
    "pg_probe.cjs",
    "prisma/seed.js",
    "seed_local_content.cjs",
    "scripts/**",
    "*.ts", // root level scripts
    "tests/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;
