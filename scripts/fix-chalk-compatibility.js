const fs = require('fs');
const path = require('path');

// Fix the chalk-utils type definition to make ChalkColor compatible with ChalkStyle
function fixChalkUtilsTypes() {
  const filePath = path.join(__dirname, '../cli/utils/chalk-utils.ts');
  console.log(`Fixing chalk-utils.ts types...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Modify the ChalkColor type to be a union of string literals and ChalkStyle
  const oldChalkColorType = /export\s+type\s+ChalkColor\s*=\s*([^;]+);/;
  if (oldChalkColorType.test(content)) {
    content = content.replace(
      oldChalkColorType,
      'export type ChalkColor = ChalkStyle | \'black\' | \'red\' | \'green\' | \'yellow\' | \'blue\' | \'magenta\' | \'cyan\' | \'white\' | \'gray\' | \'grey\' | \'blackBright\' | \'redBright\' | \'greenBright\' | \'yellowBright\' | \'blueBright\' | \'magentaBright\' | \'cyanBright\' | \'whiteBright\';'
    );
    console.log('✅ Updated ChalkColor type');
  } else {
    console.log('❌ Could not find ChalkColor type definition');
  }
  
  // Update colorize function to accept ChalkColor | ChalkStyle
  const oldColorizeFunction = /export\s+function\s+colorize\s*\(\s*text\s*:\s*string\s*,\s*color\s*:\s*ChalkColor\s*\|\s*undefined\s*\)/;
  if (oldColorizeFunction.test(content)) {
    content = content.replace(
      oldColorizeFunction,
      'export function colorize(text: string, color: ChalkColor | ChalkStyle | undefined)'
    );
    console.log('✅ Updated colorize function parameter type');
  } else {
    console.log('❌ Could not find colorize function');
  }
  
  // Update asChalkColor function to handle string conversion better
  const asChalkColorFunction = /export\s+function\s+asChalkColor\s*\(\s*colorOrStyle\s*:\s*string\s*\)\s*:\s*ChalkColor\s*{[^}]+}/;
  if (asChalkColorFunction.test(content)) {
    content = content.replace(
      asChalkColorFunction,
      `export function asChalkColor(colorOrStyle: string): ChalkColor {
  return colorOrStyle as ChalkColor;
}`
    );
    console.log('✅ Updated asChalkColor function');
  } else {
    console.log('❌ Could not find asChalkColor function');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix formatter-enhanced.ts file to use asChalkColor properly
function fixFormatterEnhanced() {
  const filePath = path.join(__dirname, '../cli/commands/deduplicate/lib/formatter-enhanced.ts');
  console.log(`Fixing formatter-enhanced.ts...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Import asChalkColor if not already imported
  if (!content.includes('import { asChalkColor }')) {
    const importStatement = content.match(/import\s*{([^}]+)}\s*from\s*'@\/cli\/utils\/chalk-utils';/);
    if (importStatement) {
      const imports = importStatement[1];
      if (!imports.includes('asChalkColor')) {
        content = content.replace(
          importStatement[0],
          importStatement[0].replace('{' + imports + '}', '{' + imports + ', asChalkColor}')
        );
        console.log('✅ Added asChalkColor import');
      }
    }
  }
  
  // Fix colorize calls with string literals
  const stringLiteralPattern = /colorize\(([^,]+),\s*['"]([^'"]+)['"]\)/g;
  let match;
  let count = 0;
  
  while ((match = stringLiteralPattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const text = match[1];
    const color = match[2];
    
    // Skip if already using asChalkColor
    if (fullMatch.includes('asChalkColor')) continue;
    
    const replacement = `colorize(${text}, asChalkColor('${color}'))`;
    content = content.replace(fullMatch, replacement);
    count++;
  }
  
  console.log(`✅ Fixed ${count} colorize calls with string literals`);
  
  // Fix formatTags function
  const formatTagsFunction = /function\s+formatTags\s*\(\s*tags\s*:\s*string\[\]\s*\|\s*null\s*,\s*color\s*:\s*string\s*,\s*colorize\s*:\s*ColorizeFunction\s*\)\s*:\s*string\s*{[^}]+}/;
  if (formatTagsFunction.test(content)) {
    content = content.replace(
      formatTagsFunction,
      `function formatTags(tags: string[] | null, color: string, colorize: ColorizeFunction): string {
  if (!tags || tags.length === 0) {
    return colorize('none', asChalkColor('gray'));
  }
  return tags.map(tag => colorize(tag, asChalkColor(color))).join(', ');
}`
    );
    console.log('✅ Fixed formatTags function');
  } else {
    console.log('❌ Could not find formatTags function');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix all add-command.ts and interactive-form.ts files
function fixAddCommandFiles() {
  const files = [
    '../cli/commands/add/add-command.ts',
    '../cli/commands/add/interactive-form.ts'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    console.log(`Fixing ${file}...`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Import asChalkColor if not already imported
    if (!content.includes('import { asChalkColor }')) {
      const importStatement = content.match(/import\s*{([^}]+)}\s*from\s*'@\/cli\/utils\/chalk-utils';/);
      if (importStatement) {
        const imports = importStatement[1];
        if (!imports.includes('asChalkColor')) {
          content = content.replace(
            importStatement[0],
            importStatement[0].replace('{' + imports + '}', '{' + imports + ', asChalkColor}')
          );
          console.log('✅ Added asChalkColor import');
        }
      } else {
        // Add the import at the top after other imports
        const lastImport = content.match(/import[^;]*;/g);
        if (lastImport) {
          const lastImportStatement = lastImport[lastImport.length - 1];
          content = content.replace(
            lastImportStatement,
            lastImportStatement + '\nimport { asChalkColor } from \'@/cli/utils/chalk-utils\';'
          );
          console.log('✅ Added asChalkColor import');
        }
      }
    }
    
    // Fix colorize calls with string literals
    const stringLiteralPattern = /colorize\(([^,]+),\s*['"]([^'"]+)['"]\)/g;
    let match;
    let count = 0;
    
    while ((match = stringLiteralPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const text = match[1];
      const color = match[2];
      
      // Skip if already using asChalkColor
      if (fullMatch.includes('asChalkColor')) continue;
      
      const replacement = `colorize(${text}, asChalkColor('${color}'))`;
      content = content.replace(fullMatch, replacement);
      count++;
    }
    
    console.log(`✅ Fixed ${count} colorize calls with string literals`);
    
    // Fix remaining instances of "black" without asChalkColor
    const blackPattern = /colorize\(([^,]+),\s*["']black["']\)/g;
    count = 0;
    
    while ((match = blackPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const text = match[1];
      
      // Skip if already using asChalkColor
      if (fullMatch.includes('asChalkColor')) continue;
      
      const replacement = `colorize(${text}, asChalkColor('black'))`;
      content = content.replace(fullMatch, replacement);
      count++;
    }
    
    console.log(`✅ Fixed ${count} black color calls`);
    
    fs.writeFileSync(filePath, content, 'utf8');
  });
}

// Main execution
console.log('===== Fixing ChalkColor/ChalkStyle compatibility issues =====');
fixChalkUtilsTypes();
fixFormatterEnhanced();
fixAddCommandFiles();
console.log('===== Completed ChalkColor/ChalkStyle compatibility fixes =====');