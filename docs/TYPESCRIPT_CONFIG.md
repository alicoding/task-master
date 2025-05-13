# TypeScript Configuration Guide

This document describes the TypeScript configuration used in the Task Master project, focusing on module resolution, path aliases, and build settings.

## Configuration Files

The project uses several TypeScript configuration files for different purposes:

1. **tsconfig.json** - Base configuration
2. **tsconfig.build.json** - Build-specific configuration
3. **tsconfig.dev.json** - Development configuration for type checking
4. **tsconfig.path-aliases.json** - Path alias configuration (now integrated into main config)

## Module Resolution and Path Aliases

### Module Resolution Strategy

The project uses the "bundler" module resolution strategy with "ESNext" module format:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    // ...
  }
}
```

This configuration allows:
- Importing TypeScript files without file extensions
- Using path aliases without extensions
- Maintaining ESM compatibility

### Path Aliases

Path aliases are configured to simplify imports and eliminate the need for complex relative paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/core/*": ["core/*", "src/core/*"],
      "@/cli/*": ["cli/*", "src/cli/*"],
      "@/db/*": ["src/db/*"]
    }
  }
}
```

Example usage:
```typescript
// Instead of complex relative paths like:
import { Task } from '../../../../db/schema';

// Use path aliases:
import { Task } from '@/db/schema';
```

## Project Structure

The project uses a multi-root directory structure with code in several directories:

- `src/` - Main source code
- `cli/` - Command line interface 
- `core/` - Core functionality
- `scripts/` - Build and utility scripts
- `test/` - Test files

This is configured in tsconfig.json:

```json
{
  "include": [
    "src/**/*.ts",
    "cli/**/*.ts",
    "core/**/*.ts",
    "src/**/*.d.ts",
    "src/types/**/*.d.ts"
  ],
  "exclude": ["node_modules", "dist", "test", "scripts"]
}
```

## Runtime Support

The Node.js loader (`node-loaders.mjs`) provides runtime support for:

1. Path alias resolution 
2. TypeScript file imports without .ts extensions
3. Directory-to-index.ts resolution

To use the loader with Node.js:

```bash
node --loader ./node-loaders.mjs <script>
```

## Build Scripts

Several build scripts are available:

1. **build** - Default build with progressive fallback
2. **build:standard** - Standard TypeScript build
3. **build:strict** - Strict TypeScript build
4. **build:force** - Build with errors allowed
5. **build:fast** - Quick transpile-only build (no type checking)
6. **build:types** - Generate type declarations only

## Development Workflow

### Type Checking

For development, use:

```bash
npm run typecheck
```

This will perform type checking without generating output files.

### Development Build

For fast development builds:

```bash
npm run build:fast
```

This uses transpile-only mode to quickly generate JavaScript without type checking.

### Production Build

For production builds:

```bash
npm run build
```

This attempts the strictest build first, then falls back to less strict options.

## Common Issues and Solutions

### Issue: "Cannot find module '@/xyz'"

**Solution**: Ensure the path alias is correctly configured in tsconfig.json and the file exists in the corresponding directory.

### Issue: "File is not under 'rootDir'"

**Solution**: This is resolved by setting `"rootDir": "."` in tsconfig.json to include all project directories.

### Issue: "Relative import paths need explicit file extensions"

**Solution**: This is resolved by using path aliases (@/) and the "bundler" moduleResolution strategy.

### Runtime Errors

If you encounter runtime errors related to module resolution:

1. Ensure you're using the Node.js loader with `--loader ./node-loaders.mjs`
2. Check that the paths in your imports match the configured path aliases
3. Verify the target file exists at the expected location