/**
 * TypeScript Transformer: Fix TaskStatus and TaskReadiness Type Assertions
 * 
 * This transformer fixes type errors where string values need to be
 * converted to TaskStatus or TaskReadiness types.
 */

import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a new project
const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../../tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});

// Add source files - focusing on search handlers where we know there are issues
project.addSourceFilesAtPaths([
  "cli/commands/search/search-handler*.ts"
]);

console.log(`Analyzing search handler files...`);

// Track changes
let taskStatusFixes = 0;
let taskReadinessFixes = 0;
let filesChanged = 0;

// Process each source file
for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;
  const filePath = sourceFile.getFilePath();
  
  console.log(`Checking ${filePath}`);
  
  // Find all property assignments to filters.status directly
  const propertyAssignments = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment);

  // Find status property assignments
  const statusAssignments = propertyAssignments.filter(assignment => {
    const name = assignment.getName();
    return name === 'status';
  });

  console.log(`Found ${statusAssignments.length} status property assignments`);

  // Replace the initializer with asTaskStatus call for each assignment
  for (const assignment of statusAssignments) {
    const initializer = assignment.getInitializer();
    if (!initializer) continue;

    // Only replace if it's a string literal or string-like expression
    if (initializer.getKind() === SyntaxKind.StringLiteral ||
        initializer.getText().startsWith("'") ||
        initializer.getText().startsWith('"')) {

      const initializerText = initializer.getText();
      assignment.setInitializer(`asTaskStatus(${initializerText})`);
      taskStatusFixes++;
      fileChanged = true;
    }
  }

  // Also look for direct assignments to options.status via = operators
  const binaryExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression)
    .filter(expr => {
      const operator = expr.getOperatorToken().getText();
      if (operator !== '=') return false;

      const left = expr.getLeft().getText();
      return left === 'filters.status' || left.endsWith('.status');
    });

  console.log(`Found ${binaryExpressions.length} status assignments with = operator`);

  for (const expr of binaryExpressions) {
    const right = expr.getRight();
    if (right.getKind() === SyntaxKind.StringLiteral ||
        right.getText().startsWith("'") ||
        right.getText().startsWith('"')) {

      const rightText = right.getText();
      expr.setRight(`asTaskStatus(${rightText})`);
      taskStatusFixes++;
      fileChanged = true;
    }
  }
  
  // Find readiness property assignments
  const readinessAssignments = propertyAssignments.filter(assignment => {
    const name = assignment.getName();
    return name === 'readiness';
  });

  console.log(`Found ${readinessAssignments.length} readiness property assignments`);

  // Replace the initializer with asTaskReadiness call for each assignment
  for (const assignment of readinessAssignments) {
    const initializer = assignment.getInitializer();
    if (!initializer) continue;

    // Only replace if it's a string literal or string-like expression
    if (initializer.getKind() === SyntaxKind.StringLiteral ||
        initializer.getText().startsWith("'") ||
        initializer.getText().startsWith('"')) {

      const initializerText = initializer.getText();
      assignment.setInitializer(`asTaskReadiness(${initializerText})`);
      taskReadinessFixes++;
      fileChanged = true;
    }
  }

  // Also look for direct assignments to options.readiness via = operators
  const readinessBinaryExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression)
    .filter(expr => {
      const operator = expr.getOperatorToken().getText();
      if (operator !== '=') return false;

      const left = expr.getLeft().getText();
      return left === 'filters.readiness' || left.endsWith('.readiness');
    });

  console.log(`Found ${readinessBinaryExpressions.length} readiness assignments with = operator`);

  for (const expr of readinessBinaryExpressions) {
    const right = expr.getRight();
    if (right.getKind() === SyntaxKind.StringLiteral ||
        right.getText().startsWith("'") ||
        right.getText().startsWith('"')) {

      const rightText = right.getText();
      expr.setRight(`asTaskReadiness(${rightText})`);
      taskReadinessFixes++;
      fileChanged = true;
    }
  }
  
  if (fileChanged) {
    // Add the necessary import
    const existingImports = sourceFile.getImportDeclaration(i => 
      i.getModuleSpecifierValue().includes('type-safety')
    );
    
    if (existingImports) {
      // Add to existing import
      const namedImports = existingImports.getNamedImports();
      
      if (!namedImports.some(imp => imp.getName() === 'asTaskStatus')) {
        existingImports.addNamedImport('asTaskStatus');
      }
      
      if (!namedImports.some(imp => imp.getName() === 'asTaskReadiness')) {
        existingImports.addNamedImport('asTaskReadiness');
      }
    } else {
      // Add new import
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@/core/utils/type-safety',
        namedImports: ['asTaskStatus', 'asTaskReadiness']
      });
    }
    
    // Save the file
    sourceFile.save();
    filesChanged++;
  }
}

console.log('\nTransformation complete!');
console.log(`TaskStatus fixes: ${taskStatusFixes}`);
console.log(`TaskReadiness fixes: ${taskReadinessFixes}`);
console.log(`Total files changed: ${filesChanged}`);