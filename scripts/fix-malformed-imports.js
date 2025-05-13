#!/usr/bin/env node

/**
 * Fix malformed import statements in the codebase
 * 
 * This script specifically targets the pattern where there are two import statements
 * chained together incorrectly, like:
 * `import { ChalkColor } from '../utils'; import { "@/cli/utils/chalk-utils";`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = process.cwd();

// Files known to have malformed imports
const TARGET_FILES = [
  'cli/commands/triage/lib/interactive-enhanced/utils/colors.ts',
  'src/cli/commands/triage/lib/interactive-enhanced/handlers/update-task.ts',
  'src/cli/commands/triage/lib/interactive-enhanced/prompts/action-prompts.ts'
];

/**
 * Fix malformed imports in a file
 * @param {string} filePath Path to the file
 * @returns {boolean} Whether changes were made
 */
function fixMalformedImports(filePath) {
  const fullPath = path.resolve(cwd, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Fix pattern: `import {...} from '...'; import { "...";`
  // Replace with: `import {...} from '...';`
  const importRegex = /(import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]);\s*import\s+\{\s*["'][^'"]+["']/g;
  content = content.replace(importRegex, '$1');
  
  // Fix additional malformed imports if needed
  const badImportRegex = /import\s+\{\s*["'][^'"]+["']/g;
  content = content.replace(badImportRegex, '// Removed malformed import:');
  
  // Check if content changed
  if (content !== originalContent) {
    console.log(`Fixing malformed imports in: ${filePath}`);
    fs.writeFileSync(fullPath, content, 'utf8');
    return true;
  }
  
  console.log(`No changes needed for: ${filePath}`);
  return false;
}

/**
 * Find files that might have malformed imports
 * @returns {string[]} List of file paths
 */
function findPotentialIssueFiles() {
  const grepCmd = "grep -r --include='*.ts' 'import.*;.*import.*{.*\"' .";
  try {
    const output = execSync(grepCmd, { encoding: 'utf8' });
    const files = output
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.split(':')[0]);
    
    return [...new Set(files)]; // Remove duplicates
  } catch (error) {
    console.error('Error finding files:', error.message);
    return [];
  }
}

function main() {
  console.log('Fixing malformed import statements...');
  
  // Automatically find potential issue files if available
  const potentialFiles = findPotentialIssueFiles();
  const filesToProcess = TARGET_FILES.concat(
    potentialFiles.filter(file => !TARGET_FILES.includes(file))
  );
  
  console.log(`Found ${filesToProcess.length} files to process`);
  
  let fixedCount = 0;
  for (const file of filesToProcess) {
    if (fixMalformedImports(file)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed imports in ${fixedCount} files`);
}

main();