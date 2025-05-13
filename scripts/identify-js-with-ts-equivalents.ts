#!/usr/bin/env tsx
/**
 * Script to identify JavaScript files with existing TypeScript equivalents
 * 
 * This script:
 * 1. Reads the inventory of JavaScript and TypeScript files
 * 2. Identifies which JavaScript files have TypeScript equivalents
 * 3. Identifies which JavaScript files need to be converted
 * 4. Creates categorized lists for further processing
 */

import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

// Read inventory files
const jsFilesRaw = fs.readFileSync('js-files-inventory.txt', 'utf-8').split('\n').filter(Boolean);
const tsFilesRaw = fs.readFileSync('ts-files-inventory.txt', 'utf-8').split('\n').filter(Boolean);
const dtsFilesRaw = fs.readFileSync('dts-files-inventory.txt', 'utf-8').split('\n').filter(Boolean);

// Clean path format for comparison
const normalizePath = (filePath: string): string => {
  return filePath.trim().replace(/^\.\//, '');
};

// Get the base name without extension
const getBaseNameWithoutExt = (filePath: string): string => {
  const normalizedPath = normalizePath(filePath);
  const parsedPath = path.parse(normalizedPath);
  return path.join(parsedPath.dir, parsedPath.name);
};

// Normalize all paths
const jsFiles = jsFilesRaw.map(normalizePath);
const tsFiles = tsFilesRaw.map(normalizePath);
const dtsFiles = dtsFilesRaw.map(normalizePath);

// Convert to base names for comparison
const jsBasePaths = jsFiles.map(getBaseNameWithoutExt);
const tsBasePaths = tsFiles.map(getBaseNameWithoutExt);
const dtsBasePaths = dtsFiles.map(getBaseNameWithoutExt);

// Create sets for faster lookups
const tsBasePathsSet = new Set(tsBasePaths);
const dtsBasePathsSet = new Set(dtsBasePaths);

// Lists to populate
const jsWithTsEquivalents: string[] = [];
const jsNeedingConversion: string[] = [];
const mismatchedDeclarations: string[] = [];

// Check each JS file to see if it has a TS equivalent
jsFiles.forEach((jsFile, index) => {
  const jsBasePath = jsBasePaths[index];
  
  if (tsBasePathsSet.has(jsBasePath)) {
    jsWithTsEquivalents.push(jsFile);
  } else {
    jsNeedingConversion.push(jsFile);
  }
});

// Check for declaration files without TS implementations
dtsBasePaths.forEach((dtsBasePath, index) => {
  if (!tsBasePathsSet.has(dtsBasePath) && !jsBasePaths.includes(dtsBasePath)) {
    mismatchedDeclarations.push(dtsFilesRaw[index]);
  }
});

// Write results to files
fs.writeFileSync('js-with-ts-equivalents.txt', jsWithTsEquivalents.join('\n'));
fs.writeFileSync('js-needing-conversion.txt', jsNeedingConversion.join('\n'));
fs.writeFileSync('mismatched-declarations.txt', mismatchedDeclarations.join('\n'));

// Print summary
console.log(`${colors.cyan}${colors.bold}TypeScript Migration Assessment${colors.reset}`);
console.log(`${colors.gray}------------------------------------------${colors.reset}`);
console.log(`${colors.blue}Total JavaScript files:${colors.reset} ${jsFiles.length}`);
console.log(`${colors.blue}Total TypeScript files:${colors.reset} ${tsFiles.length}`);
console.log(`${colors.blue}Total Declaration files:${colors.reset} ${dtsFiles.length}`);

console.log(`\n${colors.green}JavaScript files with TypeScript equivalents:${colors.reset} ${jsWithTsEquivalents.length}`);
console.log(`${colors.yellow}JavaScript files needing conversion:${colors.reset} ${jsNeedingConversion.length}`);
console.log(`${colors.red}Declaration files without implementations:${colors.reset} ${mismatchedDeclarations.length}`);

console.log(`\n${colors.magenta}${colors.bold}Next Steps:${colors.reset}`);
console.log(`1. Review 'js-with-ts-equivalents.txt' for files that can be safely removed`);
console.log(`2. Review 'js-needing-conversion.txt' for files that need to be converted to TypeScript`);
console.log(`3. Review 'mismatched-declarations.txt' for declarations that may be redundant`);

console.log(`\n${colors.green}${colors.bold}Assessment complete!${colors.reset}`);