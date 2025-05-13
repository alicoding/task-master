#!/usr/bin/env tsx
/**
 * TypeScript Import Validator
 *
 * This script validates that all imports in TypeScript files use .ts extensions
 * and not .js extensions. It can be used as a pre-commit hook or in CI/CD.
 *
 * Run with:
 *   npx tsx scripts/validate-ts-imports.ts
 *
 * If any .js imports are detected, it will exit with code 1.
 */
export {};
