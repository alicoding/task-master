#!/usr/bin/env node

/**
 * Fix all call sites of colorize function in the codebase
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Helper to update files calling colorize with 3 parameters
function fixColorizeCalls(filePath) {
  console.log(`Fixing calls in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Find colorize calls with 3 parameters
  const colorizeRegex = /colorize\(([^,]+),\s*asChalkColor\(['"]([^'"]+)['"]\),\s*asChalkColor\(['"]([^'"]+)['"]\)\)/g;
  let match;
  
  while ((match = colorizeRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const text = match[1];
    const color = match[2];
    const style = match[3];
    
    // Replace with the correct order: style then color
    const replacement = `colorize(${text}, asChalkColor('${style}'), asChalkColor('${color}'))`;
    content = content.replace(fullMatch, replacement);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed colorize calls in ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️ No colorize calls to fix in ${filePath}`);
    return false;
  }
}

// Main execution
function main() {
  console.log('===== Fixing Colorize Function Call Sites =====');
  
  // Find all TypeScript files that might use colorize
  const files = glob.sync('cli/**/*.ts', { cwd: path.join(__dirname, '..') });
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, '..', file);
    
    // Check if this file contains "colorize" and "asChalkColor"
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('colorize') && content.includes('asChalkColor')) {
      const fixed = fixColorizeCalls(filePath);
      if (fixed) totalFixed++;
    }
  }
  
  console.log(`Fixed color/style parameters in ${totalFixed} files`);
  console.log('===== Completed Colorize Function Call Sites Fixes =====');
}

// Fix imports to include asChalkColor
function fixImports() {
  console.log('===== Fixing Imports for asChalkColor =====');
  
  // Find all TypeScript files that might use colorize
  const files = glob.sync('cli/**/*.ts', { cwd: path.join(__dirname, '..') });
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, '..', file);
    
    // Check if this file imports from chalk-utils but not asChalkColor
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('from \'@/cli/utils/chalk-utils\'') && 
        content.includes('colorize') && 
        !content.includes('asChalkColor')) {
      
      // Add asChalkColor to the imports
      let modified = content.replace(
        /import\s*{\s*([^}]+)\s*}\s*from\s*'@\/cli\/utils\/chalk-utils'/,
        (match, imports) => {
          if (!imports.includes('asChalkColor')) {
            return `import { ${imports.trim()}, asChalkColor } from '@/cli/utils/chalk-utils'`;
          }
          return match;
        }
      );
      
      if (modified !== content) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`✅ Added asChalkColor import to ${filePath}`);
        totalFixed++;
      }
    }
  }
  
  console.log(`Fixed imports in ${totalFixed} files`);
  console.log('===== Completed Import Fixes =====');
}

// Run both fixes
fixImports();
main();