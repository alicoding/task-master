#!/usr/bin/env tsx
/**
 * Script to analyze TypeScript declaration (.d.ts) files
 * 
 * This script:
 * 1. Categorizes .d.ts files into essential vs generated
 * 2. Identifies declaration files for external dependencies
 * 3. Analyzes usage patterns in the codebase
 * 4. Makes recommendations for which files to keep
 */

import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

// Read declaration files inventory
const dtsFilesRaw = fs.readFileSync('dts-files-inventory.txt', 'utf-8').split('\n').filter(Boolean);

// Categories for declaration files
interface DeclarationFileInfo {
  path: string;
  category: 'essential' | 'generated' | 'external-dependency' | 'unclear';
  usage: number;
  implementationExists: boolean;
  recommendation: 'keep' | 'remove' | 'review';
  notes: string;
}

// Normalize path for comparison
const normalizePath = (filePath: string): string => {
  return filePath.trim().replace(/^\.\//, '');
};

const dtsFiles = dtsFilesRaw.map(normalizePath);

// Check if there is a corresponding TypeScript implementation
const hasImplementation = (dtsPath: string): boolean => {
  const basePath = dtsPath.replace(/\.d\.ts$/, '.ts');
  return fs.existsSync(basePath);
};

// Check how many files import this declaration
const getUsageCount = (dtsPath: string): number => {
  try {
    // Remove ./ prefix if present for grep
    const searchPath = dtsPath.replace(/^\.\//, '');
    // Use basename to search for imports
    const fileName = path.basename(searchPath);
    
    // Search for imports in the codebase
    const command = `grep -r --include="*.ts" --exclude="*.d.ts" "from ['\\\"].*${fileName.replace(/\.d\.ts$/, '')}" . | wc -l`;
    const result = childProcess.execSync(command, { encoding: 'utf-8' }).trim();
    
    return parseInt(result, 10) || 0;
  } catch (error) {
    console.error(`Error checking usage for ${dtsPath}:`, error);
    return 0;
  }
};

// Determine if it's for an external dependency
const isExternalDependency = (dtsPath: string): boolean => {
  // Check if the file is in src/types, which likely contains types for external deps
  return dtsPath.includes('src/types/') || 
         dtsPath.includes('types/') ||
         dtsPath.includes('node_modules/');
};

// Analyze declaration files
const analyzeDeclarationFiles = (): DeclarationFileInfo[] => {
  const results: DeclarationFileInfo[] = [];
  
  for (const dtsFile of dtsFiles) {
    const hasImpl = hasImplementation(dtsFile);
    const usageCount = getUsageCount(dtsFile);
    const isExternal = isExternalDependency(dtsFile);
    
    let category: 'essential' | 'generated' | 'external-dependency' | 'unclear';
    let recommendation: 'keep' | 'remove' | 'review';
    let notes = '';
    
    // Categorize the file
    if (isExternal) {
      category = 'external-dependency';
      recommendation = 'keep';
      notes = 'Types for external dependency';
    } else if (hasImpl) {
      category = 'generated';
      recommendation = 'review';
      notes = 'Has corresponding implementation file';
    } else if (usageCount > 0) {
      category = 'essential';
      recommendation = 'keep';
      notes = 'Used in the codebase without implementation';
    } else {
      category = 'unclear';
      recommendation = 'review';
      notes = 'No implementation and no detected usage';
    }
    
    results.push({
      path: dtsFile,
      category,
      usage: usageCount,
      implementationExists: hasImpl,
      recommendation,
      notes
    });
  }
  
  return results;
};

// Main execution
console.log(`${colors.cyan}${colors.bold}TypeScript Declaration Files Analysis${colors.reset}`);
console.log(`${colors.gray}------------------------------------------${colors.reset}`);
console.log(`${colors.blue}Analyzing ${dtsFiles.length} declaration files...${colors.reset}\n`);

const analysis = analyzeDeclarationFiles();

// Generate statistics
const byCategory = {
  essential: analysis.filter(a => a.category === 'essential').length,
  generated: analysis.filter(a => a.category === 'generated').length,
  'external-dependency': analysis.filter(a => a.category === 'external-dependency').length,
  unclear: analysis.filter(a => a.category === 'unclear').length
};

const byRecommendation = {
  keep: analysis.filter(a => a.recommendation === 'keep').length,
  remove: analysis.filter(a => a.recommendation === 'remove').length,
  review: analysis.filter(a => a.recommendation === 'review').length
};

// Output summary
console.log(`${colors.green}${colors.bold}Summary:${colors.reset}`);
console.log(`${colors.yellow}By Category:${colors.reset}`);
console.log(`  Essential: ${byCategory.essential}`);
console.log(`  Generated: ${byCategory.generated}`);
console.log(`  External dependency: ${byCategory['external-dependency']}`);
console.log(`  Unclear: ${byCategory.unclear}`);

console.log(`\n${colors.yellow}By Recommendation:${colors.reset}`);
console.log(`  Keep: ${byRecommendation.keep}`);
console.log(`  Remove: ${byRecommendation.remove}`);
console.log(`  Review: ${byRecommendation.review}`);

// Save results to files by recommendation
fs.writeFileSync('dts-keep.txt', 
  analysis.filter(a => a.recommendation === 'keep')
    .map(a => a.path)
    .join('\n')
);

fs.writeFileSync('dts-remove.txt', 
  analysis.filter(a => a.recommendation === 'remove')
    .map(a => a.path)
    .join('\n')
);

fs.writeFileSync('dts-review.txt', 
  analysis.filter(a => a.recommendation === 'review')
    .map(a => a.path)
    .join('\n')
);

// Save full analysis as JSON for further inspection
fs.writeFileSync('dts-analysis.json', JSON.stringify(analysis, null, 2));

// Create a markdown report
const markdownReport = `# Declaration Files Analysis Report

## Summary

| Category | Count |
|----------|-------|
| Essential | ${byCategory.essential} |
| Generated | ${byCategory.generated} |
| External dependency | ${byCategory['external-dependency']} |
| Unclear | ${byCategory.unclear} |
| **Total** | **${dtsFiles.length}** |

## Recommendations

| Action | Count |
|--------|-------|
| Keep | ${byRecommendation.keep} |
| Remove | ${byRecommendation.remove} |
| Review | ${byRecommendation.review} |

## Essential Declaration Files to Keep

These files are essential and should be kept:

${analysis.filter(a => a.category === 'essential' || a.category === 'external-dependency')
  .map(a => `- \`${a.path}\` (${a.category}, ${a.usage} references)`)
  .join('\n')}

## Generated Declaration Files to Review

These files were likely generated from TypeScript files and should be reviewed:

${analysis.filter(a => a.category === 'generated')
  .map(a => `- \`${a.path}\` (${a.usage} references)`)
  .join('\n')}

## Unclear Declaration Files to Review Carefully

These files have no detected implementation or usage and should be carefully reviewed:

${analysis.filter(a => a.category === 'unclear')
  .map(a => `- \`${a.path}\``)
  .join('\n')}

## Next Steps

1. Keep all files marked as 'keep'
2. Review files marked as 'review' to determine their necessity
3. Remove any unnecessary declaration files
`;

fs.writeFileSync('declaration-files-report.md', markdownReport);

console.log(`\n${colors.magenta}${colors.bold}Next Steps:${colors.reset}`);
console.log(`1. Review the ${colors.cyan}declaration-files-report.md${colors.reset} file for full analysis`);
console.log(`2. Keep files listed in ${colors.green}dts-keep.txt${colors.reset}`);
console.log(`3. Review files listed in ${colors.yellow}dts-review.txt${colors.reset}`);
console.log(`4. Consider removing files listed in ${colors.red}dts-remove.txt${colors.reset} if any`);

console.log(`\n${colors.green}${colors.bold}Analysis complete!${colors.reset}`);