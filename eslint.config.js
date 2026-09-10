import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

// Flat config. `prettier` (last) turns off every rule that would fight the
// formatter — ESLint judges code, Prettier owns layout.
export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'src/data/**', // generated snapshots
      'data/**', // ingest history / raw cache
      'public/**',
    ],
  },

  // App source — browser globals, React rules.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Build / ingest scripts and plain-JS config — Node globals, no React.
  {
    files: ['scripts/**/*.mjs', '*.config.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // TS config files (vite.config.ts) — need the TS parser, still Node.
  {
    files: ['*.config.{ts,mts}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },

  prettier,
)
