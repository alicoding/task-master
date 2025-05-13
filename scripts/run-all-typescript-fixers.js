#!/usr/bin/env node

/**
 * Master script to run all existing TypeScript error fixers in a strategic order
 * to systematically eliminate all TypeScript errors
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Map of error categories to existing fixers
const FIXERS = {
  // Type confusion issues (TS2345) - ChalkColor and ChalkStyle
  typeConfusion: [
    'scripts/fix-chalk-color-issues.js',
    'scripts/ts-fixers/fixChalkColorTypes.ts',
    'scripts/ts-fixers/fixChalkColorCalls.ts',
    'scripts/ts-fixers/fixStringLiteralTypes.ts'
  ],

  // Import issues (TS2304, TS2305)
  importIssues: [
    'scripts/fix-malformed-imports.js',
    'scripts/ts-fixers/fixCreationImports.ts',
    'scripts/ts-transformers/fix-schema-imports.js',
    'scripts/ts-transformers/fix-task-schema-import.js',
    'scripts/ts-transformers/fix-chalk-imports.ts'
  ],

  // Property access issues (TS2339, TS2551)
  propertyAccess: [
    'scripts/ts-fixers/fixParentIdProperty.ts',
    'scripts/ts-transformers/fix-metadata-access.ts',
    'scripts/ts-transformers/fix-metadata-nullable-access.js',
    'scripts/ts-transformers/fix-tags-nullability.ts',
    'scripts/fix-task-tags-null-checks.js'
  ],

  // Parameter count issues (TS2554)
  parameterCount: [
    'scripts/ts-fixers/fixRepositoryParameterCount.ts',
    'scripts/ts-transformers/fix-search-handler-params.ts'
  ],

  // Arithmetic operation issues (TS2362, TS2363)
  arithmeticOperations: [
    'scripts/ts-fixers/fixArithmeticOperations.ts',
    'scripts/ts-transformers/fix-array-from-usage.js'
  ],

  // Type exports and definitions (TS2724, TS2740)
  typeDefinitions: [
    'scripts/ts-fixers/fixMissingExports.ts',
    'scripts/ts-transformers/fix-core-types-export.js',
    'scripts/ts-transformers/fix-task-export.ts',
    'scripts/ts-transformers/fix-task-export-simple.js'
  ]
};

// Helper to check if a script exists
function scriptExists(scriptPath) {
  return fs.existsSync(path.resolve(process.cwd(), scriptPath));
}

// Run a script with error handling
function runScript(script) {
  console.log(`\n===== Running ${script} =====`);
  try {
    execSync(`node ${script}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error running ${script}:`, error.message);
    return false;
  }
}

// Check TypeScript errors
function checkTypeScriptErrors() {
  console.log('\n===== Checking TypeScript errors =====');
  try {
    execSync('npx tsc --noEmit > typescript_errors.txt 2>&1 || true', { stdio: 'inherit' });
    const errorCount = parseInt(
      execSync('cat typescript_errors.txt | wc -l', { encoding: 'utf8' }).trim(),
      10
    );
    console.log(`Current TypeScript error count: ${errorCount}`);
    return errorCount;
  } catch (error) {
    console.error('Error checking TypeScript errors:', error.message);
    return -1;
  }
}

// Main function
async function main() {
  console.log('Starting comprehensive TypeScript error fix process...');
  
  // Check initial error count
  const initialErrors = checkTypeScriptErrors();
  
  // Track success/failure of each category
  const results = {};
  
  // Process each category in order
  for (const [category, scripts] of Object.entries(FIXERS)) {
    console.log(`\n\n***** Running ${category} fixers *****`);
    
    results[category] = {
      success: 0,
      failure: 0,
      skipped: 0
    };
    
    for (const script of scripts) {
      if (scriptExists(script)) {
        const success = runScript(script);
        results[category][success ? 'success' : 'failure']++;
      } else {
        console.log(`Skipping ${script} (file not found)`);
        results[category].skipped++;
      }
    }
    
    // Check error count after each category
    checkTypeScriptErrors();
  }
  
  // Run final TypeScript check
  const finalErrors = checkTypeScriptErrors();
  
  // Summary
  console.log('\n\n===== TypeScript Error Fix Summary =====');
  console.log(`Initial errors: ${initialErrors}`);
  console.log(`Final errors: ${finalErrors}`);
  console.log(`Reduced by: ${initialErrors - finalErrors} (${((initialErrors - finalErrors) / initialErrors * 100).toFixed(1)}%)`);
  
  console.log('\nCategory results:');
  for (const [category, result] of Object.entries(results)) {
    console.log(`- ${category}: ${result.success} succeeded, ${result.failure} failed, ${result.skipped} skipped`);
  }
  
  if (finalErrors > 0) {
    console.log('\nRemaining TypeScript errors by category:');
    try {
      execSync('grep -o "TS[0-9]*" typescript_errors.txt | sort | uniq -c | sort -nr | head -10', 
        { stdio: 'inherit' });
    } catch (error) {
      console.error('Error analyzing remaining errors:', error.message);
    }
    
    console.log('\nTo address remaining errors, consider creating additional fixers or manual fixes.');
  } else {
    console.log('\nSuccess! All TypeScript errors have been fixed.');
  }
}

main();