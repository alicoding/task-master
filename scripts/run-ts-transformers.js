#!/usr/bin/env node

/**
 * Run TypeScript Transformers
 *
 * This script executes the transformers using tsx which handles TypeScript
 * files directly without needing to compile them first.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of transformers to run
const transformers = [
  'fix-chalk-colors.ts',
  'fix-metadata-access.ts',
  'fix-tags-nullability.ts',
  'fix-task-export.ts',
  'fix-search-handler-params.ts',
  'fix-task-imports.ts',
  'fix-search-handler-paths.js',
  'fix-metadata-nullable-access.js',
  'fix-task-schema-import.js',
  'fix-task-references.js',
  'fix-array-from-usage.js',
  'fix-core-types-export.js',
  'fix-schema-imports.js',
];

function runTransformer(transformerScript) {
  return new Promise((resolve, reject) => {
    console.log(`\n====================================================`);
    console.log(`Running transformer: ${transformerScript}`);
    console.log(`====================================================\n`);
    
    const transformer = path.join('scripts', 'ts-transformers', transformerScript);
    const tsx = spawn('npx', ['tsx', transformer], {
      stdio: 'inherit',
      shell: true
    });
    
    tsx.on('close', code => {
      if (code === 0) {
        console.log(`\n✅ Transformer ${transformerScript} completed successfully\n`);
        resolve();
      } else {
        console.error(`\n❌ Transformer ${transformerScript} failed with code ${code}\n`);
        reject(new Error(`Transformer failed with code ${code}`));
      }
    });
    
    tsx.on('error', err => {
      console.error(`\n❌ Error executing transformer ${transformerScript}:`, err);
      reject(err);
    });
  });
}

async function runAll() {
  try {
    console.log(`Starting TypeScript transformers at ${new Date().toLocaleTimeString()}`);
    
    for (const transformer of transformers) {
      await runTransformer(transformer);
    }
    
    console.log(`\n✨ All transformers completed at ${new Date().toLocaleTimeString()}`);
    console.log(`\nRunning TypeScript type-check to see if errors were reduced...`);
    
    const typecheck = spawn('npm', ['run', 'typecheck'], {
      stdio: 'inherit',
      shell: true
    });
    
    typecheck.on('close', code => {
      if (code === 0) {
        console.log(`\n✨ TypeScript check completed successfully`);
      } else {
        console.log(`\n⚠️ TypeScript check completed with errors`);
        console.log(`Check typescript-errors.txt for details`);
      }
    });
  } catch (error) {
    console.error('Error running transformers:', error);
    process.exit(1);
  }
}

runAll();