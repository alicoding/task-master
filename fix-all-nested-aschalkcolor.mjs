import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all TypeScript files that contain nested asChalkColor calls
const result = execSync('grep -l "asChalkColor((asChalkColor" --include="*.ts" -r .').toString().trim();
const filesToFix = result.split('\n');

console.log(`Found ${filesToFix.length} files with nested asChalkColor calls.`);

let fixedFiles = 0;
let fixedPatterns = 0;

for (const filePath of filesToFix) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace triple nested patterns first
    const triplePattern = /asChalkColor\(\(asChalkColor\(\(asChalkColor\(\(['"]([^'"]+)['"]\)\)\)\)\)\)/g;
    content = content.replace(triplePattern, "asChalkColor('$1')");
    
    // Replace double nested patterns
    const doublePattern = /asChalkColor\(\(asChalkColor\(\(['"]([^'"]+)['"]\)\)\)\)/g;
    content = content.replace(doublePattern, "asChalkColor('$1')");
    
    // Replace single nested patterns with extra parentheses
    const singlePattern = /asChalkColor\(\(['"]([^'"]+)['"]\)\)/g;
    content = content.replace(singlePattern, "asChalkColor('$1')");
    
    if (content \!== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedFiles++;
      
      // Count how many patterns were fixed
      const patternsDiff = (originalContent.match(/asChalkColor\(\(/g) || []).length - 
                           (content.match(/asChalkColor\(\(/g) || []).length;
      fixedPatterns += patternsDiff;
      
      console.log(`Fixed ${patternsDiff} nested asChalkColor patterns in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

console.log(`\nSummary: Fixed ${fixedPatterns} nested asChalkColor patterns in ${fixedFiles} files.`);
