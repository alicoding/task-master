#!/usr/bin/env node

/**
 * Fix ChalkStyle vs ChalkColor type compatibility issues
 * 
 * This script adds type compatibility between ChalkStyle and ChalkColor
 * by modifying chalk-utils.ts
 */

import fs from 'fs';
import path from 'path';

function main() {
  console.log('Fixing ChalkStyle and ChalkColor compatibility...');
  
  // Target the chalk-utils.ts file
  const chalkUtilsPath = path.resolve(process.cwd(), 'src/cli/utils/chalk-utils.ts');
  if (!fs.existsSync(chalkUtilsPath)) {
    console.log(`File not found, trying alternate path: ${chalkUtilsPath}`);
    // Try alternate path
    const altPath = path.resolve(process.cwd(), 'cli/utils/chalk-utils.ts');
    if (fs.existsSync(altPath)) {
      console.log(`Found at alternate path: ${altPath}`);
      fixChalkUtils(altPath);
    } else {
      console.log('chalk-utils.ts not found in either location.');
    }
  } else {
    fixChalkUtils(chalkUtilsPath);
  }
}

function fixChalkUtils(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file already has our fix
  if (content.includes('export type ChalkColor = ChalkStyle')) {
    console.log('chalk-utils.ts already has the compatibility fix. Skipping.');
    return;
  }
  
  // Find the ChalkColor type definition
  if (content.includes('export type ChalkColor =')) {
    // Replace the ChalkColor type with a type alias to ChalkStyle
    content = content.replace(
      /export type ChalkColor = [^;]+;/,
      'export type ChalkColor = ChalkStyle;'
    );
    
    // Write the modified content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed ChalkColor to be compatible with ChalkStyle');
  } else if (!content.includes('export type ChalkStyle')) {
    // If ChalkStyle is not defined and ChalkColor type is not found,
    // add our own type compatibility
    const addition = `
// Add ChalkStyle and ChalkColor compatibility
export type ChalkStyle = string;
export type ChalkColor = ChalkStyle;
`;
    
    // Add our type definitions to the end of imports
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfImports = content.indexOf(';', lastImportIndex) + 1;
      content = content.slice(0, endOfImports) + addition + content.slice(endOfImports);
    } else {
      // If no imports, add at the beginning
      content = addition + content;
    }
    
    // Write the modified content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Added ChalkStyle and ChalkColor type compatibility');
  }
}

main();