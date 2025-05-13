# Path Alias Import System

This document describes the path alias import system implemented in the Task Master project. The system eliminates TypeScript errors related to file extensions in imports by using `@/` path aliases throughout the codebase.

## Overview

The `@/` path alias system provides several benefits:
- Eliminates "Relative import paths need explicit file extensions" TypeScript errors
- Makes imports more consistent and readable
- Reduces fragility when moving files around
- Simplifies import paths by using absolute paths rather than deeply nested relative paths

## Implementation

### 1. TypeScript Configuration

The project uses two TypeScript configurations:

#### Main tsconfig.json
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### Development tsconfig.path-aliases.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "rootDir": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/core/*": ["core/*", "src/core/*"],
      "@/cli/*": ["cli/*", "src/cli/*"],
      "@/db/*": ["src/db/*"]
    }
  }
}
```

### 2. Runtime Support with Custom Node.js Loader

The `node-loaders.mjs` file provides runtime support for path aliases:

```javascript
// Handle @ path alias imports
if (specifier.startsWith('@/')) {
  // Convert the @ path to a file path relative to the src directory
  const relativePath = specifier.slice(2); // Remove the '@/'
  
  // First try in src directory
  const srcFullPath = path.join(SRC_DIR, relativePath);
  
  // Try with .ts extension in src
  const srcTsPath = `${srcFullPath}.ts`;
  if (fs.existsSync(srcTsPath)) {
    return {
      url: pathToFileURL(srcTsPath).href,
      shortCircuit: true
    };
  }
  
  // Special handling for cli/ and core/ directories
  // ...
}
```

### 3. Import Patterns

Replace relative imports with `@/` path aliases:

Before:
```typescript
import { Task } from '../../../db/schema';
import { formatHierarchyText } from './formatters/text';
```

After:
```typescript
import { Task } from '@/db/schema';
import { formatHierarchyText } from '@/core/graph/formatters/text';
```

## Usage Guidelines

### When to Use Path Aliases

Always use `@/` path aliases for imports within the project:

- For files in the src directory: `@/path/to/file`
- For CLI modules: `@/cli/path/to/file`
- For core modules: `@/core/path/to/file`
- For database modules: `@/db/path/to/file`

### When Not to Use Path Aliases

Do not use path aliases for:
- External library imports (continue using standard imports)
- Node.js built-in modules (use node: prefix when needed)

## Tools and Scripts

### Conversion Script

The project includes a script to automatically convert relative imports to path aliases:

```bash
npm run convert:path-aliases
```

### Validation Script

Validate that no relative imports remain:

```bash
npm run validate:path-aliases
```

## Development Workflow

1. Always use `@/` path aliases for new imports
2. Run `npm run typecheck` to verify imports work correctly
3. Use the Node.js loader for development: `node --loader ./node-loaders.mjs ...`

## Common Issues and Solutions

### Issue: TypeScript can't find module with path alias
**Solution**: Make sure tsconfig.json has correct paths configuration and the file is within src directory.

### Issue: Runtime can't resolve path alias
**Solution**: Ensure you're using the Node.js loader with `--loader ./node-loaders.mjs`.

### Issue: Path alias works in src but not in cli or core
**Solution**: Use the appropriate alias path: `@/cli/...` or `@/core/...`.