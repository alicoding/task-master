module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  rules: {
    // Enforce .ts extension in imports
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        'js': 'never',
        'ts': 'always',
        'tsx': 'always',
      }
    ],
    // Custom rule to enforce .ts extensions in imports
    'import/no-js-extension': 'error',
    // Disallow .js extensions in imports
    'no-restricted-syntax': [
      'error',
      {
        selector: "ImportDeclaration[source.value=/\\.js$/]",
        message: "Do not use .js extensions in imports. Use .ts extensions instead."
      },
      {
        selector: "ExportAllDeclaration[source.value=/\\.js$/]",
        message: "Do not use .js extensions in exports. Use .ts extensions instead."
      },
      {
        selector: "ExportNamedDeclaration[source.value=/\\.js$/]",
        message: "Do not use .js extensions in exports. Use .ts extensions instead."
      }
    ]
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
};