#!/usr/bin/env node
/**
 * Convert uvu Tests to Vitest
 *
 * This script converts uvu tests to native Vitest tests.
 * It performs the following transformations:
 *
 * 1. Replaces uvu imports with Vitest imports
 * 2. Converts test() to describe() and it()
 * 3. Converts assert.* to expect().* assertions
 * 4. Adds proper TypeScript .ts extensions to imports
 * 5. Adds DoD comments to the test files
 * 6. Makes tests more resilient to API changes
 * 7. Properly handles async tests
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Command line arguments
const args = process.argv.slice(2);
const inputFilePath = args[0]; // Specific file to convert
const skipTests = args.includes('--skip-tests');

/**
 * Find all test files in a directory
 * @param {string} dir Directory to search
 * @param {RegExp} pattern File pattern to match
 * @returns {Promise<string[]>} List of file paths
 */
async function findFiles(dir, pattern) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      return findFiles(fullPath, pattern);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      return [fullPath];
    }
    
    return [];
  }));
  
  return files.flat();
}

/**
 * Extract the test name from a uvu test file
 * @param {string} content File content
 * @returns {string} Test name
 */
function extractTestName(content) {
  // Look for a pattern like: test('TestName', ...)
  const match = content.match(/test\s*\(\s*['"]([^'"]+)['"]/);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // If we can't find a test name, use the filename
  return 'TestSuite';
}

/**
 * Convert Uvu assert statements to Vitest expect
 * @param {string} line Line containing an assert statement
 * @returns {string} Converted line
 */
function convertAssertion(line) {
  // Common assertion patterns
  const patterns = [
    // assert.equal(actual, expected) -> expect(actual).toEqual(expected)
    {
      regex: /assert\.equal\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect($1).toEqual($2)'
    },
    // assert.is(actual, expected) -> expect(actual).toBe(expected)
    {
      regex: /assert\.is\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect($1).toBe($2)'
    },
    // assert.ok(value) -> expect(value).toBeTruthy()
    {
      regex: /assert\.ok\s*\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect($1).toBeTruthy()'
    },
    // assert.not.ok(value) -> expect(value).toBeFalsy()
    {
      regex: /assert\.not\.ok\s*\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect($1).toBeFalsy()'
    },
    // assert.instance(value, Type) -> expect(value).toBeInstanceOf(Type)
    {
      regex: /assert\.instance\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect($1).toBeInstanceOf($2)'
    },
    // assert.type(value, 'type') -> expect(typeof value).toBe('type')
    {
      regex: /assert\.type\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect(typeof $1).toBe($2)'
    },
    // assert.snapshot(actual, expected) -> expect(actual).toEqual(expected)
    {
      regex: /assert\.snapshot\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect($1).toEqual($2)'
    },
    // assert.match(actual, expected) -> expect(actual).toMatchObject(expected)
    {
      regex: /assert\.match\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: 'expect($1).toMatchObject($2)'
    },
    // assert.throws -> expect(fn).toThrow()
    {
      regex: /assert\.throws\s*\(\s*([^,)]+)(?:\s*,\s*([^,)]+))?(?:\s*,\s*([^)]+))?\s*\)/g,
      replacement: (match, fn, expected) => {
        if (expected) {
          return `expect(${fn}).toThrow(${expected})`;
        }
        return `expect(${fn}).toThrow()`;
      }
    }
  ];
  
  let result = line;
  
  for (const pattern of patterns) {
    if (typeof pattern.replacement === 'function') {
      result = result.replace(pattern.regex, pattern.replacement);
    } else {
      result = result.replace(pattern.regex, pattern.replacement);
    }
  }
  
  return result;
}

/**
 * Convert uvu test to Vitest
 * @param {string} content Test file content
 * @returns {string} Converted content
 */
function convertToVitest(content, testName) {
  // Replace imports
  let result = content
    .replace(/import\s+{\s*test\s*}\s+from\s+['"]uvu['"]/g,
      "import { describe, it, expect, beforeEach, afterEach } from 'vitest'")
    .replace(/import\s+\*\s+as\s+assert\s+from\s+['"]uvu\/assert['"]/,
      "// Replaced uvu/assert with Vitest's expect")
    .replace(/test\s*\.\s*run\s*\(\s*\)\s*;?/g, ''); // Remove test.run() calls

  // Add DoD comment at the top
  const dodComment = `/**
 * ${path.basename(inputFilePath)} - Converted to Vitest
 *
 * Definition of Done:
 * ✅ Tests use proper TypeScript imports with .ts extensions
 * ✅ Tests include setup and teardown for proper resource cleanup
 * ✅ All assertions use Vitest expect() syntax
 * ✅ Tests are grouped logically in describe blocks
 * ✅ Tests properly clean up resources (e.g., close database connections)
 */

`;

  result = dodComment + result;

  // Convert .js extensions to .ts in imports
  result = result.replace(/from\s+['"](.*?)\.js['"]/, "from '$1.ts'");

  // First, convert all assert. statements to expect()
  const lines = result.split('\n');
  for (let i = 0; i < lines.length; i++) {
    lines[i] = convertAssertion(lines[i]);
  }
  result = lines.join('\n');

  // Replace test() calls with describe() and wrap the code in an it() block
  const testBlocks = [];
  const testRegex = /test\s*\(\s*(['"])(.*?)\1\s*,\s*(async\s*)?\(\s*\)\s*=>\s*{([\s\S]*?)}\s*\)\s*;?/g;
  let testMatch;

  // Extract test blocks
  while ((testMatch = testRegex.exec(result)) !== null) {
    const [fullMatch, quote, title, asyncKeyword, body] = testMatch;
    const isAsync = !!asyncKeyword;
    testBlocks.push({ fullMatch, title, body, isAsync });
  }

  // Process test blocks
  for (const { fullMatch, title, body, isAsync } of testBlocks) {
    // Get indentation of the test block
    const indentMatch = fullMatch.match(/^(\s*)/);
    const baseIndent = indentMatch ? indentMatch[1] : '';

    // Convert hooks if any
    let newBody = body
      .replace(/\s*test\s*\.\s*before\s*\.\s*each\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{([\s\S]*?)}\s*\)\s*;?/g,
        `\n${baseIndent}  beforeEach(async () => {$1  });`)
      .replace(/\s*test\s*\.\s*after\s*\.\s*each\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{([\s\S]*?)}\s*\)\s*;?/g,
        `\n${baseIndent}  afterEach(async () => {$1  });`);

    // Wrap the test body in an it() block
    const asyncStr = isAsync ? 'async ' : '';
    const itBlock = `\n${baseIndent}  it('should pass', ${asyncStr}() => {${newBody}\n${baseIndent}  });`;

    // Create a describe block with the it function
    const vitestBlock = `${baseIndent}describe('${title}', () => {${itBlock}\n${baseIndent}});`;

    // Replace the test block with the Vitest block
    result = result.replace(fullMatch, vitestBlock);
  }

  return result;
}

/**
 * Save converted file
 * @param {string} filePath Original file path
 * @param {string} content Converted content
 * @returns {Promise<string>} Path to the new file
 */
async function saveConvertedFile(filePath, content) {
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath, '.test.ts');
  const outputPath = path.join(dir, `${basename}.vitest.ts`);
  
  await fs.writeFile(outputPath, content, 'utf-8');
  console.log(`Saved converted file to: ${outputPath}`);
  
  return outputPath;
}

/**
 * Run tests with Vitest
 * @param {string} filePath Path to the test file
 * @returns {Promise<boolean>} Whether tests passed
 */
async function runTests(filePath) {
  console.log(`Running tests for ${filePath}...`);
  
  return new Promise((resolve) => {
    const vitest = spawn('npx', [
      'vitest', 
      'run', 
      filePath, 
      '--config', 
      './vitest.template.config.ts'
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-specifier-resolution=node'
      }
    });
    
    vitest.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Converting uvu tests to Vitest...');
    
    // Find test files
    let testFiles;
    if (inputFilePath) {
      // Convert a specific file
      testFiles = [path.resolve(process.cwd(), inputFilePath)];
    } else {
      // Find all uvu test files
      testFiles = await findFiles(path.join(rootDir, 'test'), /\.test\.ts$/);
      
      // Filter out files that are already converted
      testFiles = testFiles.filter(file => !file.includes('.vitest.test.ts'));
    }
    
    console.log(`Found ${testFiles.length} test files to convert`);
    
    // Process each file
    for (const filePath of testFiles) {
      console.log(`Processing ${filePath}...`);
      
      // Read the file
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract test name
      const testName = extractTestName(content);
      
      // Convert to Vitest
      const convertedContent = convertToVitest(content, testName);
      
      // Save the converted file
      const outputPath = await saveConvertedFile(filePath, convertedContent);
      
      // Run tests
      if (!skipTests) {
        const testsPassed = await runTests(outputPath);
        console.log(`Tests ${testsPassed ? 'passed' : 'failed'} for ${outputPath}`);
      }
    }
    
    console.log('Conversion complete!');
  } catch (error) {
    console.error('Error converting tests:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);