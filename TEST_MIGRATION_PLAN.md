# Test Migration Plan

## Summary

- Total test files: 27
- uvu test files: 21
- Vitest test files: 3
- Other test files: 3
- Total tests in uvu: 84
- Total tests in Vitest: 10

## Migration Progress

- Migration progress: 11%

## Migration Plan

### Core

*Core tests* are those in the `/test/core/` directory and test the core functionality of the application.

#### Files to Convert

```
test/core/base-repository.test.ts (8 tests)
test/core/base-repository.vitest.test.ts (8 tests)
test/core/graph.test.ts (3 tests)
test/core/hierarchy-repository-simple.test.ts (3 tests)
test/core/metadata-repository.test.ts (6 tests)
test/core/nlp-search.test.ts (5 tests)
test/core/repo-advanced-simple.test.ts (1 tests)
test/core/repo-advanced.test.ts (5 tests)
test/core/repo.test.ts (4 tests)
test/core/repository-factory.test.ts (3 tests)
test/core/search-repository-simple.test.ts (2 tests)
test/core/search-repository.test.ts (6 tests)
```

### Commands

*Command tests* are those in the `/test/commands/` directory and test the CLI commands.

#### Files to Convert

```
test/commands/add-command.test.ts (5 tests)
test/commands/api-simple.test.ts (1 tests)
test/commands/api.test.ts (3 tests)
test/commands/metadata-command.test.ts (8 tests)
test/commands/metadata-nested.test.ts (9 tests)
test/commands/metadata-simple.test.ts (1 tests)
test/commands/metadata.test.ts (1 tests)
test/commands/next-simple.test.ts (1 tests)
test/commands/next.test.ts (1 tests)
```

### Other

*Other tests* are those in other directories or that don't fall into the previous categories.

#### Files to Convert

All other files have been converted.

## Recommendations

1. Run the migration script for each category:

```bash
# Migrate core tests
npm run test:migrate:file test/core/base-repository.test.ts
npm run test:migrate:file test/core/base-repository.vitest.test.ts
npm run test:migrate:file test/core/graph.test.ts
# ... and 9 more

# Migrate command tests
npm run test:migrate:file test/commands/add-command.test.ts
npm run test:migrate:file test/commands/api-simple.test.ts
npm run test:migrate:file test/commands/api.test.ts
# ... and 6 more

# Migrate other tests
```

2. Or use the automated migration for all files:

```bash
npm run test:migrate:all
```

3. Verify the migrated tests by running:

```bash
npm test
```
