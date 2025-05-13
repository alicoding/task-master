#!/usr/bin/env node

/**
 * Fix redundant nested asChalkColor calls
 */

const fs = require('fs');
const path = require('path');

function fixDoubleAsChalkColor() {
  const filePath = path.join(__dirname, '../cli/commands/deduplicate/lib/formatter-enhanced.ts');
  console.log(`Fixing double asChalkColor calls in formatter-enhanced.ts...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all instances of double asChalkColor with single asChalkColor
  const doubleAsChalkColorPattern = /asChalkColor\(\(asChalkColor\(['"]([^'"]+)['"]\)\)\)/g;
  content = content.replace(doubleAsChalkColorPattern, "asChalkColor('$1')");
  
  // Also check for references without parentheses
  const doubleAsChalkColorPattern2 = /asChalkColor\(asChalkColor\(['"]([^'"]+)['"]\)\)/g;
  content = content.replace(doubleAsChalkColorPattern2, "asChalkColor('$1')");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed double asChalkColor calls');
}

// Main execution
console.log('===== Fixing Double asChalkColor Calls =====');
fixDoubleAsChalkColor();
console.log('===== Completed Double asChalkColor Fixes =====');