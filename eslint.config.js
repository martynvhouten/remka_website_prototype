// Flat config for ESLint v9+
import globals from 'globals';

export default [
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: { ...globals.browser }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: "Program:has(Comment[value=/.*\\bTODO\\b|\\bFIXME\\b.*/i])",
          message: 'Use DEVNOTE[...] format instead of TODO/FIXME.'
        },
        {
          selector: "Program:has(Comment[value=/.*COPY TO PHTML.*/i])",
          message: 'Use DEVNOTE[hyva-slot,...] format. "COPY TO PHTML" is forbidden.'
        }
      ]
    }
  }
];


