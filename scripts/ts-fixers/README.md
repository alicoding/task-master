# TypeScript Fixers

This directory contains automated scripts to fix common TypeScript errors in the Task Master codebase.

## Overview

The fixers are designed to be run in a specific order to maximize error reduction. Each script focuses on a specific type of error and is designed to be safe and idempotent (can be run multiple times without issues).

## Available Fixers

1. **fixMissingExports.ts**: Adds missing exports to modules
   - Fixes "Module X has no exported member Y" errors
   - Adds type exports like HierarchyTask, TaskSearch, etc.
   - Adds missing table exports in schema files

2. **fixChalkColorTypes.ts**: Fixes chalk color type issues
   - Fixes "string is not assignable to parameter of type 'ChalkColor'" errors
   - Adds type assertions to string literals used as colors
   - Handles both colorize() and chalk.color() patterns

3. **fixTimeWindowTypes.ts**: Fixes TimeWindow type issues
   - Fixes "string is not assignable to type 'TimeWindowType'" errors
   - Adds type assertions to TimeWindowCriteria objects
   - Fixes generic type issues in time window modules

4. **fixDrizzleTypes.ts**: Fixes database-related type errors
   - Fixes "Property 'connection' does not exist on type ..." errors
   - Fixes "Property 'tableX' does not exist on type ..." errors
   - Adds proper generic type parameters to database operations

## Running the Fixers

### Run All Fixers

To run all fixers in the optimal order:

```bash
npm run fix:ts
```

To see what changes would be made without applying them:

```bash
npm run fix:ts:dry
```

### Run Individual Fixers

You can also run individual fixers:

```bash
npm run fix:ts:exports    # Fix missing exports
npm run fix:ts:chalk      # Fix chalk color issues
npm run fix:ts:timewindow # Fix time window type issues
npm run fix:ts:drizzle    # Fix database type issues
```

Or run them directly:

```bash
npx tsx scripts/ts-fixers/fixChalkColorTypes.ts --dry-run
npx tsx scripts/ts-fixers/fixMissingExports.ts --verbose
```

## Options

All fixers support the following command-line options:

- `--dry-run`: Show changes without applying them
- `--verbose`: Show detailed diagnostic information
- `--help`: Show help information

You can also specify specific files to process:

```bash
npx tsx scripts/ts-fixers/fixChalkColorTypes.ts src/cli/commands/add/add-command.ts
```

## Results

The fixers will report:
- How many issues they fixed
- The TypeScript error count before and after (unless in dry-run mode)
- Which files were modified

## Implementation Details

The fixers use the TypeScript Compiler API via ts-morph to:
1. Parse TypeScript files into an AST
2. Find and modify specific nodes in the AST
3. Write the changes back to disk

This approach is much more reliable than simple regex-based replacements and handles complex syntax correctly.

## Adding New Fixers

To add a new fixer:

1. Create a new script in this directory
2. Follow the existing pattern, importing utilities from utils.ts
3. Use the runFixer function to handle common setup and reporting
4. Add your script to the FIXERS array in run-all.ts
5. Add a new script to package.json