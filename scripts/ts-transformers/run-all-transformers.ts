/**
 * Run all TypeScript transformers
 * 
 * This script runs all the TypeScript transformers in sequence to
 * fix common TypeScript errors throughout the codebase.
 */

import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';

const execPromise = util.promisify(exec);

// List of transformer scripts to run
const transformers = [
  'fix-chalk-colors.ts',
  'fix-metadata-access.ts',
  'fix-tags-nullability.ts',
];

async function runTransformers() {
  console.log('====================================================');
  console.log('Running TypeScript transformers to fix type errors');
  console.log('====================================================\n');
  
  for (const transformer of transformers) {
    const transformerPath = path.join(__dirname, transformer);
    console.log(`Running transformer: ${transformer}`);
    
    try {
      // Execute the transformer script
      const { stdout, stderr } = await execPromise(`npx ts-node ${transformerPath}`);
      
      if (stderr) {
        console.error(`Error in ${transformer}:`);
        console.error(stderr);
      }
      
      console.log(stdout);
      console.log('----------------------------------------------------\n');
    } catch (error) {
      console.error(`Failed to run transformer ${transformer}:`);
      console.error(error);
    }
  }
  
  console.log('All transformers complete!');
  console.log('Running TypeScript type-check to verify improvements...');
  
  try {
    // Run TypeScript type check to see if errors were reduced
    const { stdout, stderr } = await execPromise('npm run typecheck -- --pretty');
    
    // Count remaining errors
    const errorCount = (stdout.match(/error TS\d+/g) || []).length;
    
    console.log(`\nRemaining TypeScript errors: ${errorCount}`);
    console.log('Check typescript-errors.txt for details.');
  } catch (error) {
    // Even with errors, the command will complete
    const output = error.stdout || '';
    const errorCount = (output.match(/error TS\d+/g) || []).length;
    
    console.log(`\nRemaining TypeScript errors: ${errorCount}`);
    console.log('Check typescript-errors.txt for details.');
  }
}

runTransformers().catch(error => {
  console.error('Failed to run transformers:');
  console.error(error);
  process.exit(1);
});