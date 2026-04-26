import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules - re-enable most, keep some off for gradual migration
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "error",
    "@typescript-eslint/no-unused-disable-directive": "warn",
    
    // React rules - re-enable critical ones
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/purity": "error",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "error",
    
    // General JavaScript rules - re-enable most
    "prefer-const": "warn",
    "no-unused-vars": "off", // handled by typescript version
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "warn",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-irregular-whitespace": "error",
    "no-case-declarations": "off",
    "no-fallthrough": ["error", { commentPattern: "fallthrough|passthrough" }],
    "no-mixed-spaces-and-tabs": "error",
    "no-redeclare": "off",
    "no-undef": "off", // handled by typescript
    "no-unreachable": "error",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "src/components/ui/**"]
}];

export default eslintConfig;
