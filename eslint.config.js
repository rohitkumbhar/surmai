// ESLint flat config tailored for this React + TypeScript + Vite project
import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  // Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'dev-dist/',
      'playwright-report/',
      'test-results/',
      'backend/**', // backend is a separate Go project – exclude from front-end linting
      '**/*.min.*',
      '*.config.*.timestamp-*',
    ],
  },

  // Base config for TypeScript/React source files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      // TypeScript best practices (a small, pragmatic subset)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Vite React Fast Refresh: ensure only components are exported from files that use hooks
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Imports: keep them tidy without requiring extra resolvers
      'import/order': [
        'warn',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'index', 'object'],
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'warn',
      'import/newline-after-import': 'warn',
    },
  },

  // Node-related config files and scripts
  {
    files: [
      '*.config.{js,cjs,mjs,ts}',
      'vitest.setup.ts',
      'vite*.{js,ts}',
      'playwright.config.{js,ts}',
      'commitlint.config.js',
    ],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]);
