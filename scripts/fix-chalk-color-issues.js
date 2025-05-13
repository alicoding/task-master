#!/usr/bin/env node

/**
 * Fix ChalkColor type issues in the codebase
 * 
 * This script addresses two common patterns:
 * 1. String literals without type assertion passed to functions expecting ChalkColor
 * 2. Missing imports for ChalkColor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

// Files with known ChalkColor issues as a starting point
const COLOR_ISSUE_FILES = [
  'cli/commands/add/add-command.ts',
  'cli/commands/deduplicate/index.ts',
  'cli/commands/deduplicate/lib/formatter-enhanced.ts'
];

/**
 * Find all files with ChalkColor usage
 * @returns {string[]} List of file paths
 */
function findFilesWithChalkColorUsage() {
  console.log('Finding files with ChalkColor usage...');
  try {
    // Find files using colorize functions or mentioning ChalkColor
    const cmd = "grep -r --include='*.ts' 'colorize\\|ChalkColor' --exclude-dir='node_modules' .";
    const output = execSync(cmd, { encoding: 'utf8' });
    
    const files = output
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.split(':')[0])
      .filter(Boolean);
    
    return [...new Set(files)]; // Remove duplicates
  } catch (error) {
    console.error('Error finding ChalkColor files:', error.message);
    return COLOR_ISSUE_FILES;
  }
}

/**
 * Check if a file already imports ChalkColor
 * @param {string} content File content
 * @returns {boolean} Whether ChalkColor is imported
 */
function hasChalkColorImport(content) {
  return /import\s+[^;]*\bChalkColor\b[^;]*;/.test(content);
}

/**
 * Add ChalkColor import to a file
 * @param {string} content File content
 * @returns {string} Updated content
 */
function addChalkColorImport(content) {
  // If file already imports from chalk-utils but not ChalkColor, add it to that import
  const chalkUtilsImport = content.match(/import\s+{([^}]*)}\s+from\s+['"]@\/cli\/utils\/chalk-utils['"]/);
  if (chalkUtilsImport) {
    if (!chalkUtilsImport[1].includes('ChalkColor')) {
      return content.replace(
        /import\s+{([^}]*)}\s+from\s+['"]@\/cli\/utils\/chalk-utils['"]/,
        (match, imports) => `import { ${imports.trim()}, ChalkColor } from '@/cli/utils/chalk-utils'`
      );
    }
    return content;
  }
  
  // Otherwise add a new import at the top of the imports section
  const firstImport = content.match(/import\s+/);
  if (firstImport) {
    const index = firstImport.index;
    return content.slice(0, index) + 
           "import { ChalkColor } from '@/cli/utils/chalk-utils';\n" +
           content.slice(index);
  }
  
  // If no imports found, add at the top after any comments
  const firstNonComment = content.search(/^[^/\s]/m);
  if (firstNonComment !== -1) {
    return content.slice(0, firstNonComment) + 
           "import { ChalkColor } from '@/cli/utils/chalk-utils';\n\n" +
           content.slice(firstNonComment);
  }
  
  // Last resort: add at the top
  return "import { ChalkColor } from '@/cli/utils/chalk-utils';\n\n" + content;
}

/**
 * Fix string literals used where ChalkColor is expected
 * @param {string} content File content
 * @returns {string} Updated content
 */
function fixStringToChalkColor(content) {
  // Find colorize calls with string literals - handle both ' and "
  return content
    // Pattern: colorize(text, 'red') -> colorize(text, 'red' as ChalkColor)
    .replace(/colorize\((.*?),\s*['"]([a-z]+)['"]\s*(\)|,)/g, 
             (match, text, color, end) => `colorize(${text}, '${color}' as ChalkColor${end}`)
    
    // Pattern: colorize(text, 'red', 'bold') -> colorize(text, 'red' as ChalkColor, 'bold' as ChalkStyle)
    .replace(/colorize\((.*?),\s*['"]([a-z]+)['"]\s*,\s*['"]([a-z]+)['"]\s*(\)|,)/g, 
             (match, text, color, style, end) => 
             `colorize(${text}, '${color}' as ChalkColor, '${style}' as ChalkStyle${end}`);
}

/**
 * Fix ChalkColor issues in a file
 * @param {string} filePath Path to the file
 * @returns {boolean} Whether changes were made
 */
function fixChalkColorIssues(filePath) {
  const fullPath = path.resolve(cwd, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Step 1: Add missing import if needed
  if (!hasChalkColorImport(content) && 
      (content.includes('ChalkColor') || content.includes('colorize('))) {
    content = addChalkColorImport(content);
  }
  
  // Step 2: Fix string literals used as ChalkColor
  content = fixStringToChalkColor(content);
  
  // Check if content changed
  if (content !== originalContent) {
    console.log(`Fixing ChalkColor issues in: ${filePath}`);
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('Fixing ChalkColor type issues...');
  
  // Find files with potential ChalkColor issues
  const files = findFilesWithChalkColorUsage();
  console.log(`Found ${files.length} files to check for ChalkColor issues`);
  
  let fixedCount = 0;
  for (const file of files) {
    if (fixChalkColorIssues(file)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed ChalkColor issues in ${fixedCount} files`);
}

main();