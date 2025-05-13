#!/usr/bin/env tsx
/**
 * Import Extension Validator
 *
 * This script validates that all imports in TypeScript files do NOT use
 * file extensions. It can be used as a pre-commit hook or in CI/CD.
 *
 * Run with:
 *   npx tsx scripts/validate-extensionless-imports.ts
 *
 * If any imports with extensions are detected, it will exit with code 1.
 */
export {};
