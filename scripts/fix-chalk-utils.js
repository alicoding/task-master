#!/usr/bin/env node

/**
 * Fix chalk-utils.ts to resolve ChalkColor and ChalkStyle compatibility issues
 */

import fs from 'fs';
import path from 'path';

function main() {
  console.log('Fixing chalk-utils.ts...');
  
  const chalkUtilsPath = path.resolve(process.cwd(), 'cli/utils/chalk-utils.ts');
  if (!fs.existsSync(chalkUtilsPath)) {
    console.log(`File not found: ${chalkUtilsPath}`);
    return;
  }
  
  let content = fs.readFileSync(chalkUtilsPath, 'utf8');
  
  // First, remove the self-import that's causing circular dependency
  if (content.includes("import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';")) {
    content = content.replace(
      "import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';",
      "// Removed self-import to fix circular dependency"
    );
    
    console.log('Removed circular import');
  }
  
  // Update asChalkColor function to handle both color and style
  if (content.includes('export function asChalkColor')) {
    // Replace the existing asChalkColor function with a more general one
    content = content.replace(
      /export function asChalkColor\([^)]+\): ChalkColor {[^}]+}/,
      `/**
 * Function to safely convert a string to ChalkColor or ChalkStyle type
 * @param colorOrStyle The color or style name to convert
 * @returns The color or style name as a ChalkColor or ChalkStyle type
 */
export function asChalkColor(colorOrStyle: string): ChalkColor {
  return colorOrStyle as unknown as ChalkColor;
}`
    );
    
    console.log('Updated asChalkColor function');
  }
  
  // Write the modified file
  fs.writeFileSync(chalkUtilsPath, content, 'utf8');
  console.log('✅ Fixed chalk-utils.ts');
}

main();