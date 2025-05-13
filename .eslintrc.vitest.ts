/**
 * ESLint configuration for tests
 * 
 * This configuration enforces TypeScript-only imports and other best practices for tests.
 */

module.exports = {
  "extends": [
    "./.eslintrc.js"
  ],
  "rules": {
    // Enforce .ts extensions in import paths
    "import/extensions": ["error", "always", { ts: "always" }],
    
    // Prevent .js file extension in imports
    "no-restricted-syntax": [
      "error",
      {
        "selector": "ImportDeclaration[source.value=/\\.js$/]",
        "message": "Do not use .js extensions in imports. Use .ts extensions instead."
      },
      {
        "selector": "ImportDeclaration[source.value=/[\'\"].*(?<!\\.ts)[\'\"]$/] > [local=/\\w+/]",
        "message": "Missing .ts extension in import."
      }
    ],
    
    // Enforce TypeScript-specific rules
    "@typescript-eslint/explicit-function-return-type": ["error", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true
    }],
    
    // Enforce proper testing practices
    "jest/expect-expect": "off", // Use our own Vitest-specific rules
    "vitest/expect-expect": ["error", { 
      "assertFunctionNames": ["expect", "assert*"] 
    }],
    "vitest/no-disabled-tests": "warn",
    "vitest/no-focused-tests": "error",
    "vitest/no-identical-title": "error",
    
    // Enforce isolation in tests
    "vitest/no-mocks-import": "error",
    "vitest/valid-expect": "error",
    "vitest/valid-title": "error",
    "vitest/prefer-strict-equal": "warn",
    "vitest/no-conditional-expect": "error",
    "vitest/no-conditional-tests": "error",
    
    // Encourage test isolation
    "vitest/require-hook": "error"
  },
  "plugins": [
    "vitest"
  ],
  "env": {
    "vitest/globals": true
  }
};