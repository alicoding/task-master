#!/usr/bin/env node

/**
 * Terminal Test Fixer
 * 
 * This script systematically updates terminal session tests to use the 
 * standardized test utilities. It handles:
 * 
 * - Updating import statements
 * - Adding proper test environment setup
 * - Fixing database initialization
 * - Correcting terminal mocking
 * - Adding proper cleanup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Promisify functions
const readFile = (filePath) => fs.promises.readFile(filePath, 'utf8');
const writeFile = (filePath, content) => fs.promises.writeFile(filePath, content);
const globAsync = (pattern) => new Promise((resolve, reject) => {
  glob(pattern, (err, files) => {
    if (err) reject(err);
    else resolve(files);
  });
});

// Paths to update
const TERMINAL_TEST_PATTERNS = [
  'test/core/terminal-*.vitest.ts',
  'test/core/terminal-*.test.ts',
  'test/core/time-window-manager.vitest.ts'
];

// Helper to read file content
async function readFileContent(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Helper to write file content
async function writeFileContent(filePath, content) {
  try {
    await writeFile(filePath, content);
    console.log(`✅ Updated ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error);
    return false;
  }
}

// Check if imports need updating
function needsImportUpdate(content) {
  return !content.includes('import') || 
         !content.includes('terminal-session-test-utils');
}

// Check if test setup needs updating
function needsTestSetupUpdate(content) {
  return !content.includes('initializeTerminalTestDB') || 
         !content.includes('cleanupTestDB');
}

// Update imports
function updateImports(content) {
  // Check if we need to add the import
  if (!content.includes('terminal-session-test-utils')) {
    const importStatement = `import { 
  initializeTerminalTestDB,
  createMockTerminalFingerprint,
  cleanupTestDB,
  createTerminalSession,
  createTestTask,
  createTestFile,
  associateTaskWithSession,
  associateFileWithSession,
  createTimeWindow,
  mockTerminalDetection,
  createTerminalTestSetup
} from '../utils/terminal-session-test-utils';\n`;
    
    // Find the last import statement
    const lastImportIndex = content.lastIndexOf('import');
    if (lastImportIndex === -1) {
      // No imports found, add at the beginning
      return importStatement + content;
    }
    
    // Find the end of the last import statement
    const endOfImport = content.indexOf(';', lastImportIndex);
    if (endOfImport === -1) {
      // No semicolon found, try to find newline
      const endOfLine = content.indexOf('\n', lastImportIndex);
      if (endOfLine === -1) {
        // No newline found, add at the beginning
        return importStatement + content;
      }
      return content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
    }
    
    return content.slice(0, endOfImport + 1) + '\n' + importStatement + content.slice(endOfImport + 1);
  }
  
  return content;
}

// Fix direct database access
function fixDatabaseAccess(content) {
  // Replace createDb with initializeTerminalTestDB
  content = content.replace(
    /createDb\([^)]*\)/g,
    'initializeTerminalTestDB()'
  );
  
  // Replace manual SQL execution with helper functions
  content = content.replace(
    /db\.exec\(`[\s\S]*?CREATE TABLE[\s\S]*?`\);/g,
    '// Tables created by initializeTerminalTestDB'
  );
  
  // Fix db.driver access
  content = content.replace(
    /const\s+dbConnection\s*=\s*db\.driver;/g,
    '// Database initialized by initializeTerminalTestDB'
  );
  
  return content;
}

// Fix terminal environment mocking
function fixTerminalMocking(content) {
  // Replace stdout mocking
  content = content.replace(
    /process\.stdout\.isTTY\s*=\s*true;/g,
    '// Terminal mocking handled by mockTerminalDetection'
  );
  
  // Fix fingerprint mocking
  content = content.replace(
    /vi\.spyOn\(.*getTerminalFingerprint.*\)/g,
    'mockTerminalDetection()'
  );
  
  return content;
}

// Fix beforeEach/afterEach hooks
function fixTestHooks(content) {
  // Check if beforeEach needs updating
  if (content.includes('beforeEach') && !content.includes('initializeTerminalTestDB')) {
    // Replace the beforeEach block
    content = content.replace(
      /beforeEach\((async)?\s*\(\)\s*=>\s*{[\s\S]*?}\);/,
      `beforeEach(async () => {
    // Initialize test database
    const { db, sqlite, path: dbPath } = initializeTerminalTestDB();
    
    // Create test session
    const sessionId = await createTerminalSession(db);
    const taskId = await createTestTask(db);
    const fileId = await createTestFile(db);
    
    // Make available to tests
    testDb = db;
    testDbPath = dbPath;
    testSessionId = sessionId;
    testTaskId = taskId;
    testFileId = fileId;
  });`
    );
  }
  
  // Check if afterEach needs updating
  if (content.includes('afterEach') && !content.includes('cleanupTestDB')) {
    // Replace the afterEach block
    content = content.replace(
      /afterEach\((async)?\s*\(\)\s*=>\s*{[\s\S]*?}\);/,
      `afterEach(async () => {
    // Clean up test database
    if (testDbPath) {
      cleanupTestDB(testDbPath);
    }
  });`
    );
  }
  
  return content;
}

// Add missing test setup
function addMissingTestSetup(content) {
  // Check if we need to add test variables
  if (!content.includes('let testDb') && !content.includes('let testDbPath')) {
    // Find the describe block
    const describeIndex = content.indexOf('describe(');
    if (describeIndex !== -1) {
      // Find the opening brace of the describe block
      const openingBrace = content.indexOf('{', describeIndex);
      if (openingBrace !== -1) {
        // Add test variables after the opening brace
        const testVars = `
  // Test state
  let testDb;
  let testDbPath;
  let testSessionId;
  let testTaskId;
  let testFileId;
`;
        return content.slice(0, openingBrace + 1) + testVars + content.slice(openingBrace + 1);
      }
    }
  }
  
  return content;
}

// Apply all fixes to a file
async function fixFile(filePath) {
  console.log(`Processing ${path.basename(filePath)}...`);
  const content = await readFileContent(filePath);
  if (!content) return false;
  
  let updatedContent = content;
  
  // Apply fixes
  if (needsImportUpdate(updatedContent)) {
    updatedContent = updateImports(updatedContent);
  }
  
  updatedContent = fixDatabaseAccess(updatedContent);
  updatedContent = fixTerminalMocking(updatedContent);
  updatedContent = addMissingTestSetup(updatedContent);
  updatedContent = fixTestHooks(updatedContent);
  
  // Only write if content changed
  if (updatedContent !== content) {
    return await writeFileContent(filePath, updatedContent);
  } else {
    console.log(`⚠️ No changes needed for ${path.basename(filePath)}`);
    return true;
  }
}

// Main function
async function main() {
  try {
    console.log('🔍 Finding terminal session test files...');
    
    // Find all terminal test files
    let testFiles = [];
    for (const pattern of TERMINAL_TEST_PATTERNS) {
      const files = await globAsync(pattern);
      testFiles = [...testFiles, ...files];
    }
    
    console.log(`🔍 Found ${testFiles.length} terminal test files to process`);
    
    // Process each file
    let successCount = 0;
    for (const file of testFiles) {
      const success = await fixFile(file);
      if (success) successCount++;
    }
    
    console.log(`\n✅ Successfully updated ${successCount}/${testFiles.length} test files`);
    if (successCount < testFiles.length) {
      console.log('❌ Some files could not be updated. Manual review required.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error processing files:', error);
    process.exit(1);
  }
}

// Run the script
main();