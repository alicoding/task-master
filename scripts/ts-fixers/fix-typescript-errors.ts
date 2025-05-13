/**
 * Script to run all TypeScript error fixes
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import * as path from 'path';
import * as child_process from 'child_process';
import * as util from 'util';

const exec = util.promisify(child_process.exec);
const FIXER_DIR = __dirname;

// List of scripts to run
const fixers = [
  'fixChalkColorCalls.ts',
  'fixParentIdProperty.ts',
  'fixRepositoryParameterCount.ts',
  'fixArithmeticOperations.ts',
  'fixCreationImports.ts'
];

// Run all the fixers
async function main() {
  console.log('Starting TypeScript error fixes...');
  
  let successCount = 0;
  
  for (const fixer of fixers) {
    const fixerPath = path.join(FIXER_DIR, fixer);
    console.log(`\n----- Running ${fixer} -----`);
    
    try {
      const { stdout, stderr } = await exec(`npx ts-node ${fixerPath}`);
      console.log(stdout);
      
      if (stderr) {
        console.error(stderr);
      }
      
      successCount++;
    } catch (error) {
      console.error(`Error running ${fixer}:`, error);
    }
  }
  
  console.log(`\nCompleted ${successCount}/${fixers.length} fixers successfully.`);
  console.log('\nRunning TypeScript check to see if errors are fixed...');
  
  try {
    const { stdout, stderr } = await exec('npx tsc --noEmit');
    if (stderr) {
      console.error(stderr);
    } else {
      console.log('TypeScript check completed successfully!');
    }
  } catch (error) {
    console.log('Some TypeScript errors still remain:');
    console.log(error.stdout);
  }
}

main();