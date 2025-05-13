#!/usr/bin/env node

/**
 * Fix chalk-utils.ts type definitions
 */

const fs = require('fs');
const path = require('path');

function fixChalkUtils() {
  const filePath = path.join(__dirname, '../cli/utils/chalk-utils.ts');
  console.log(`Fixing chalk-utils.ts...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update the colorize function to fix parameter types
  const oldColorizeFunctionPattern = /export function colorize\(text: string, color\?: ChalkColor, style\?: ChalkStyle\): string/;
  if (oldColorizeFunctionPattern.test(content)) {
    content = content.replace(
      oldColorizeFunctionPattern,
      'export function colorize(text: string, color?: ChalkColor | ChalkStyle, style?: ChalkStyle): string'
    );
    console.log('✅ Updated colorize function parameters');
  } else {
    console.log('❌ Could not find colorize function');
  }
  
  // Update function implementations to handle the updated parameter types
  const oldColorLogicPattern = /if \(color && colorMap\[color\]\) \{\s+const colorKey = colorMap\[color\];\s+result = chalk\[colorKey\]\(result\);\s+\}/;
  if (oldColorLogicPattern.test(content)) {
    content = content.replace(
      oldColorLogicPattern,
      `if (color) {
    // Check if it's a color
    if (colorMap[color as keyof typeof colorMap]) {
      const colorKey = colorMap[color as keyof typeof colorMap];
      result = chalk[colorKey](result);
    }
    // Check if it's a style
    else if (styleMap[color as keyof typeof styleMap]) {
      const styleKey = styleMap[color as keyof typeof styleMap];
      result = chalk[styleKey](result);
    }
  }`
    );
    console.log('✅ Updated color logic implementation');
  } else {
    console.log('❌ Could not find color logic implementation');
  }
  
  // Update createColorize function to match the new colorize signature
  const oldCreateColorizePattern = /return \(text: string, color\?: ChalkColor, style\?: ChalkStyle\): string => \{/;
  if (oldCreateColorizePattern.test(content)) {
    content = content.replace(
      oldCreateColorizePattern,
      'return (text: string, color?: ChalkColor | ChalkStyle, style?: ChalkStyle): string => {'
    );
    console.log('✅ Updated createColorize function');
  } else {
    console.log('❌ Could not find createColorize function');
  }
  
  // Update asChalkColor function to make it more compatible
  const asChalkColorFunctionPattern = /export function asChalkColor\(colorOrStyle: string\): ChalkColor \{\s+return colorOrStyle as ChalkColor;\s+\}/;
  if (asChalkColorFunctionPattern.test(content)) {
    content = content.replace(
      asChalkColorFunctionPattern,
      `export function asChalkColor(colorOrStyle: string): ChalkColor | ChalkStyle {
  // First check if it's a style
  if (Object.keys(styleMap).includes(colorOrStyle)) {
    return colorOrStyle as ChalkStyle;
  }
  // Otherwise treat it as a color
  return colorOrStyle as ChalkColor;
}`
    );
    console.log('✅ Updated asChalkColor function');
  } else {
    console.log('❌ Could not find asChalkColor function');
  }
  
  // Update formatTags function to match the updated types
  const formatTagsPattern = /export function formatTags\(\s+tags: string\[\] \| null \| undefined,\s+color\?: ChalkColor,\s+emptyText: string = 'none'\s+\): string/;
  if (formatTagsPattern.test(content)) {
    content = content.replace(
      formatTagsPattern,
      `export function formatTags(
  tags: string[] | null | undefined,
  color?: ChalkColor | ChalkStyle,
  emptyText: string = 'none'
): string`
    );
    console.log('✅ Updated formatTags function');
  } else {
    console.log('❌ Could not find formatTags function');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Main execution
console.log('===== Fixing Chalk Types =====');
fixChalkUtils();
console.log('===== Completed Chalk Types Fixes =====');