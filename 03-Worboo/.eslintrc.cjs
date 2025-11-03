module.exports = {
  root: true,
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    'packages/contracts/artifacts/**',
    'packages/contracts/cache/**',
    'packages/contracts/coverage/**',
    'packages/relayer/.cache/**',
    'packages/relayer/.logs/**',
    'react-wordle/build/**',
    'react-wordle/dist/**',
  ],
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: false,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      files: ['react-wordle/**/*.{ts,tsx,js,jsx}'],
      env: {
        browser: true,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      plugins: ['react', 'react-hooks', 'jsx-a11y'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended'],
      rules: {
        'react/prop-types': 'off',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    {
      files: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/__tests__/**/*.{ts,tsx,js,jsx}'],
      env: {
        jest: true,
        node: true,
      },
      globals: {
        vi: 'readonly',
      },
    },
    {
      files: [
        'packages/contracts/hardhat.config.ts',
        'packages/contracts/scripts/**/*.{ts,js}',
        'packages/contracts/ignition/**/*.ts',
      ],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
