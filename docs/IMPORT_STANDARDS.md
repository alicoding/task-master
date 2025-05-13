# Import Standards in Task Master

## Overview

This document outlines the standard import patterns used in the Task Master codebase. Our import strategy uses **extensionless imports** for a cleaner, more maintainable codebase.

## Import Pattern Guidelines

### Correct Import Pattern (without extensions)

```typescript
// Preferred: No file extensions
import { someFunction } from './path/to/file';
import * as utils from '../utils';

// Dynamic imports should also not include extensions
const module = await import('./dynamic/module');

// Re-exports should not include extensions
export * from './some/module';
export { namedExport } from './other/module';
```

### Incorrect Import Pattern (with extensions)

```typescript
// Avoid: Using explicit file extensions
import { someFunction } from './path/to/file.ts';
import * as utils from '../utils.js';

// Avoid extensions in dynamic imports too
const module = await import('./dynamic/module.ts');

// Avoid extensions in re-exports
export * from './some/module.ts';
export { namedExport } from './other/module.js';
```

## How It Works

The extensionless imports are supported by:

1. Our custom Node.js ESM loader (`node-loaders.mjs`) which automatically resolves imports at runtime
2. TypeScript's module resolution is configured to work with our loader:
   - `"module": "NodeNext"`
   - `"moduleResolution": "NodeNext"`
   - `"experimentalSpecifierResolution": "node"` in ts-node configuration

## Exceptions

Some specific files require explicit extensions for technical reasons:

1. Some utility scripts like `fix-js-imports.ts`, `fix-js-to-ts-imports.ts`, and `fix-ts-to-js-imports.ts` use explicit extensions for demonstration or internal functionality
2. TypeScript declaration files using declaration merging (like `src/types/core-types.d.ts`)
3. Certain core files with special import requirements (documented in the exception list in `remove-import-extensions-with-exceptions.ts`)

## Validation and Fixing

We have built tooling to help maintain this standard:

1. `npm run validate:imports:safe` - Check if any files use extensions (with exceptions)
2. `npm run fix:imports:safe` - Automatically remove extensions from imports (respecting exceptions)
3. Both are integrated into our pre-commit hooks and CI/CD pipeline

## TypeScript Compiler Considerations

While our runtime handles extensionless imports perfectly, you may notice that TypeScript still generates errors during typechecking. This is because TypeScript's `NodeNext` module resolution strategy technically requires extensions.

To resolve these errors when necessary:
- For development, use our custom compilation setup that handles this discrepancy
- For strict typechecking, we can use a separate set of configurations

## Benefits of This Approach

1. **Cleaner Code**: Imports are more concise and readable
2. **Easier Refactoring**: Moving files or changing implementations doesn't require updating extensions
3. **Uniform Codebase**: Consistent import patterns make code more maintainable
4. **Future Compatibility**: Matches the direction of the JavaScript ecosystem