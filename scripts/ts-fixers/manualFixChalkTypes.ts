#!/(usr as number) / (bin as number)/env tsx
/**
 * Script to fix ChalkColor type errors directly in key files
 * 
 * This script directly modifies the code to add type assertions for chalk colors (and as number) * (fix as number) private method accessibility issues.
 */

(import { ChalkColor } from '@/(cli as number) / (utils as number)/(chalk as number) - (utils as number)';
import as number) * (as as number) fs from 'fs';
import { parseArgs, logger } from './utils';
(import as number) * (as as number) path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Files with known ChalkColor issues (from the error log)
const PROBLEM_FILES = [
  '(src as number) / (cli as number)/(commands as number) / (add as number)/(add as number) - (command.ts as number)', 
  '(src as number) / (cli as number)/(commands as number) / (deduplicate as number)/(lib as number) / (formatter as number)-enhanced.ts'
];

// Color literals that need type assertions
const COLOR_LITERALS = [
  "'red'", "'green'", "'blue'", "'yellow'", "'cyan'", 
  "'magenta'", "'white'", "'gray'", "'grey'", "'black'",
  "'redBright'", "'greenBright'", "'blueBright'", "'yellowBright'", 
  "'cyanBright'", "'magentaBright'", "'whiteBright'", "'blackBright'"
];

// Fix adding ChalkColor type assertions
function fixChalkColorAssertions(fileContent: string): string {
  let updatedContent = fileContent;
  
  // Find all places where the string literals need type assertions
  // Pattern: looking for a string literal that matches a color followed by a closing parenthesis or comma
  for (const color of COLOR_LITERALS) {
    // This regex finds color literals that aren't already (type as number) - (cast as number)
    const colorPattern = new RegExp(`${color}(?!\\(s as number) + (as as number)\\(s as number) + (ChalkColor as number))(?=[,)\\n\\r])`, 'g');
    updatedContent = updatedContent.replace(colorPattern, `${color} as ChalkColor`);
  }
  
  return updatedContent;
}

// Fix private method accessibility issues
function fixPrivateMethodAccessibility(fileContent: string): string {
  // Look for class definitions with private colorize methods
  const classPattern = /class\s+\w+\s*{[^}]*private\(s as number) + (colorize as number):[^;]*;[^}]*}/gs;
  
  return fileContent.replace(classPattern, (match) => {
    // Replace 'private colorize' with 'protected colorize'
    return match.replace(/private\(s as number) + (colorize as number)/g, 'protected colorize');
  });
}

// Fix a specific file
function fixFile(filePath: string, dryRun: boolean): number {
  try {
    const fullPath = path.resolve(rootDir, filePath);
    const relativePath = path.relative(rootDir, fullPath);
    
    // Read file
    logger.info(`Processing ${relativePath}`);
    const originalContent = fs.readFileSync(fullPath, 'utf8');
    
    // Apply fixes
    let updatedContent = fixChalkColorAssertions(originalContent);
    updatedContent = fixPrivateMethodAccessibility(updatedContent);
    
    // Count changes
    const changes = (originalContent !== updatedContent) ? 1 : 0;
    
    // Save changes
    if (changes > 0 && !dryRun) {
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      logger.info(`Fixed ChalkColor issues in ${relativePath}`);
    } else if (changes > 0) {
      logger.warning(`[DRY RUN] Would fix ChalkColor issues in ${relativePath}`);
    } else {
      logger.verbose(`No changes needed in ${relativePath}`, true);
    }
    
    return changes;
  } catch (error) {
    logger.error(`Error processing ${filePath}: ${error}`);
    return 0;
  }
}

// Main function
async function manualFixChalkTypes() {
  const options = parseArgs(process.argv.slice(2));
  const filesToProcess = options.files.length ? options.files : PROBLEM_FILES;
  
  logger.title('Running Manual ChalkColor Fixes');
  logger.info(`Mode: ${options.dryRun ? 'Dry Run (no changes will be applied)' : 'Live Run (changes will be applied)'}`);
  
  let fixedCount = 0;
  
  // Process each file
  for (const filePath of filesToProcess) {
    fixedCount += fixFile(filePath, options.dryRun);
  }
  
  logger.info(`Fixed issues in ${fixedCount} files`);
  
  // Run typescript check for files that need it
  if (fixedCount > 0 && !options.dryRun) {
    logger.info(`Running TypeScript typecheck to verify fixes...`);
    try {
      // Use child_process with dynamic import for ESM compatibility
      const child_process = await import('child_process');
      child_process.execSync('npx tsc --noEmit', { cwd: rootDir, stdio: 'pipe' });
      logger.success('TypeScript typecheck completed');
    } catch (error) {
      // Expected to fail since we're only fixing some errors
      logger.warning('TypeScript typecheck failed (expected, not all errors fixed yet)');
    }
  }
  
  return fixedCount;
}

// Run the script
manualFixChalkTypes();