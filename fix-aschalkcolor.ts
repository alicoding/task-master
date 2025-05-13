// Fix nested asChalkColor calls

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Find all TypeScript files that contain nested asChalkColor calls
const result = execSync('grep -l "asChalkColor((asChalkColor" --include="*.ts" -r .').toString().trim();
const filesToFix = result.split('\n').filter(Boolean);

console.log(`Found ${filesToFix.length} files with nested asChalkColor calls.`);

let fixedFiles = 0;
let fixedPatterns = 0;

for (const filePath of filesToFix) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace triple nested patterns first
    content = content.replace(/asChalkColor\(\(asChalkColor\(\(asChalkColor\(\(['"]([^'"]+)['"]\)\)\)\)\)\)/g, "asChalkColor('$1')");
    
    // Replace double nested patterns
    content = content.replace(/asChalkColor\(\(asChalkColor\(\(['"]([^'"]+)['"]\)\)\)\)/g, "asChalkColor('$1')");
    
    // Replace single nested patterns with extra parentheses
    content = content.replace(/asChalkColor\(\(['"]([^'"]+)['"]\)\)/g, "asChalkColor('$1')");
    
    if (content \!== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedFiles++;
      
      // Count how many patterns were fixed
      const originalMatches = (originalContent.match(/asChalkColor\(\(/g) || []).length;
      const newMatches = (content.match(/asChalkColor\(\(/g) || []).length;
      const patternsDiff = originalMatches - newMatches;
      fixedPatterns += patternsDiff;
      
      console.log(`Fixed ${patternsDiff} nested asChalkColor patterns in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

console.log(`\nSummary: Fixed ${fixedPatterns} nested asChalkColor patterns in ${fixedFiles} files.`);
