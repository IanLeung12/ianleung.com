import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Flat config (ESLint v9). The source is browser-side TypeScript (no JSX), so we
// use the non-type-checked `recommended` presets — that keeps linting fast and
// needs no tsconfig (the project transpiles via Vite/esbuild, not tsc).
export default tseslint.config(
  { ignores: ['dist', 'image-originals'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
  },
  {
    // Config files run in Node (Vite injects __dirname into its config loader).
    files: ['**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
