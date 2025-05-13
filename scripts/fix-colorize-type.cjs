#!/usr/bin/env node

/**
 * Fix ColorizeFunction type definition
 */

const fs = require('fs');
const path = require('path');

function fixColorizeType() {
  const filePath = path.join(__dirname, '../cli/utils/chalk-utils.ts');
  console.log(`Fixing ColorizeFunction type in chalk-utils.ts...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update the ColorizeFunction type to match the implementation
  const oldTypePattern = /export type ColorizeFunction = \(text: string, color\?: ChalkColor, style\?: ChalkStyle\) => string;/;
  if (oldTypePattern.test(content)) {
    content = content.replace(
      oldTypePattern,
      'export type ColorizeFunction = (text: string, color?: ChalkColor | ChalkStyle, style?: ChalkStyle) => string;'
    );
    console.log('✅ Updated ColorizeFunction type definition');
  } else {
    console.log('❌ Could not find ColorizeFunction type definition');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Main execution
console.log('===== Fixing ColorizeFunction Type =====');
fixColorizeType();
console.log('===== Completed ColorizeFunction Type Fix =====');