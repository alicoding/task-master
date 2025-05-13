#!/usr/bin/env node

/**
 * Fix formatter-enhanced.ts issues
 */

import fs from 'fs';
import path from 'path';

function main() {
  console.log('Fixing formatter-enhanced.ts issues...');
  
  const formatterPath = path.resolve(process.cwd(), 'cli/commands/deduplicate/lib/formatter-enhanced.ts');
  if (!fs.existsSync(formatterPath)) {
    console.log(`File not found: ${formatterPath}`);
    return;
  }
  
  let content = fs.readFileSync(formatterPath, 'utf8');
  
  // Fix formatTags function
  content = content.replace(
    /function formatTags\(tags: string\[\] \| null, color: string, colorize: ColorizeFunction, colorize\): string {/,
    'function formatTags(tags: string[] | null, color: string, colorize: ColorizeFunction): string {'
  );
  
  // Fix formatTags calls with extra colorize param
  content = content.replace(
    /formatTags\(task\.tags, asChalkColor\(\(asChalkColor\('cyan', colorize\)\)\)\)/g,
    'formatTags(task.tags, asChalkColor(\'cyan\'), colorize)'
  );
  
  content = content.replace(
    /formatTags\(task\.tags, asChalkColor\(\(asChalkColor\('cyan'\)\)\), colorize\)/g,
    'formatTags(task.tags, asChalkColor(\'cyan\'), colorize)'
  );
  
  fs.writeFileSync(formatterPath, content, 'utf8');
  console.log('✅ Fixed formatter-enhanced.ts');
}

main();