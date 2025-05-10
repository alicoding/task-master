# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Commands
- Build: `npm run build` - Compiles TypeScript to JavaScript
- Dev: `npm run dev -- [command]` - Runs the CLI with live TS compilation
- Test: `npm run test` - Runs all tests
- Single test: `npm run test test/core/repo.test.ts` - Run specific test file
- Database: 
  - Init: `npm run db:init` - Initialize database
  - Migrate: `npm run db:migrate` - Apply migrations

## Code Style Guidelines
- Use ESM imports with `.js` extension (e.g., `import { x } from './y.js'`)
- TypeScript with strict typing - define interfaces in core/types.ts
- Use async/await with try/catch for error handling
- Command pattern: each CLI command has its own module in cli/commands/
- Functions: camelCase, Classes: PascalCase
- Types: union types for bounded options (e.g., `type Status = 'todo' | 'in-progress'`)
- Database access through repository pattern
- CLI commands handle outputs and user interaction