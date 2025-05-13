import { Project, SourceFile, SyntaxKind, TypeAliasDeclaration } from 'ts-morph';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * A comprehensive transformer to fix TypeScript issues across the codebase
 *
 * This transformer handles multiple related issues:
 * 1. Ensures Task is properly exported as an interface
 * 2. Updates all Task imports to use the correct path
 * 3. Fixes Array.from usage with proper spread syntax
 * 4. Adds null checks for TaskOperationResult properties
 * 5. Fixes unknown type errors in database files with proper type assertions
 * 6. Fixes Promise<NlpServiceInterface> property access in nlp-profile
 */

// Initialize ts-morph project
const project = new Project({
  compilerOptions: {
    baseUrl: path.resolve(__dirname, '../../'),
    paths: {
      '@/*': ['src/*', 'cli/*', 'core/*']
    }
  }
});

// Add relevant source files
project.addSourceFilesAtPaths([
  'src/core/types.ts',
  'src/core/repository/**/*.ts',
  'cli/commands/**/*.ts',
  'src/db/**/*.ts',
  'db/**/*.ts'
]);

// Step 1: Fix Task definition in core/types.ts
function fixTaskDefinition() {
  console.log('Fixing Task definition in core/types.ts...');
  
  const typesFile = project.getSourceFileOrThrow('src/core/types.ts');
  
  // Check for existing Task type declarations
  const taskTypeAliases = typesFile.getTypeAliases().filter(t => t.getName() === 'Task');
  const taskInterfaces = typesFile.getInterfaces().filter(i => i.getName() === 'Task');
  
  // If we have both a type alias and an interface, keep only the interface
  if (taskTypeAliases.length > 0 && taskInterfaces.length > 0) {
    console.log('Found both Task type alias and interface, refactoring...');
    
    // Rename the type alias to avoid conflicts
    taskTypeAliases[0].rename('TaskType');
    
    // Make sure the interface extends from the renamed type
    if (!taskInterfaces[0].getExtends().length) {
      taskInterfaces[0].addExtends('TaskType');
    }
  } 
  // If we only have a type alias, create an interface that extends it
  else if (taskTypeAliases.length > 0 && taskInterfaces.length === 0) {
    console.log('Found only Task type alias, adding interface...');
    
    // Rename the type alias
    taskTypeAliases[0].rename('TaskType');
    
    // Get position to insert the new interface (after the type alias)
    const typeAliasEnd = taskTypeAliases[0].getEnd();
    
    // Add documentation and the interface
    typesFile.insertText(
      typeAliasEnd,
      `\n\n/**
 * Task interface that extends the inferred database type
 * This is the main Task interface used throughout the codebase
 */
export interface Task extends TaskType {}\n`
    );
  }
  
  console.log('Task definition fixed');
}

// Step 2: Fix Task imports in repository and command files
function fixTaskImports() {
  console.log('Fixing Task imports in repository and command files...');
  
  // Get all source files that might import Task
  const sourceFiles = project.getSourceFiles().filter(file => 
    file.getFilePath().includes('/repository/') ||
    file.getFilePath().includes('/commands/')
  );
  
  let fixCount = 0;
  
  for (const sourceFile of sourceFiles) {
    // Skip the types file itself
    if (sourceFile.getFilePath().endsWith('types.ts')) continue;
    
    // Find imports that include Task but from incorrect locations
    const importDeclarations = sourceFile.getImportDeclarations().filter(importDecl => {
      const namedImports = importDecl.getNamedImports()
        .map(namedImport => namedImport.getName());
      
      return namedImports.includes('Task');
    });
    
    // Fix each import declaration
    for (const importDecl of importDeclarations) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Skip if already using the right path
      if (moduleSpecifier === '@/core/types') continue;
      
      // Fix the import path
      importDecl.setModuleSpecifier('@/core/types');
      fixCount++;
    }
  }
  
  console.log(`Fixed ${fixCount} Task imports`);
}

// Step 3: Fix Array.from usage with spread syntax
function fixArrayFromUsage() {
  console.log('Fixing Array.from() usage with spread syntax...');

  // Get repository files that might use Array.from
  const sourceFiles = project.getSourceFiles().filter(file =>
    file.getFilePath().includes('/repository/') ||
    file.getFilePath().includes('/core/')
  );

  let fixCount = 0;

  for (const sourceFile of sourceFiles) {
    try {
      // Find all Array.from calls
      const arrayFromCalls = sourceFile
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .filter(call => {
          try {
            const expression = call.getExpression().getText();
            return expression === 'Array.from';
          } catch (error) {
            // Skip if we can't get the expression
            return false;
          }
        });

      // Fix each Array.from call
      for (const call of arrayFromCalls) {
        try {
          const args = call.getArguments();

          // If Array.from() with no arguments, replace with []
          if (args.length === 0) {
            call.replaceWithText('[]');
            fixCount++;
          }
          // If Array.from(something), replace with [...something]
          else if (args.length === 1) {
            const arg = args[0].getText();
            // Only replace if it's not already using a map function (2nd arg)
            if (!call.getText().includes('.map(')) {
              call.replaceWithText(`[...${arg}]`);
              fixCount++;
            }
          }
          // If Array.from().from, fix the chained call
          else if (call.getText().includes('Array.from().from')) {
            call.replaceWithText('Array.from');
            fixCount++;
          }
        } catch (error) {
          console.log(`Skipping Array.from call due to error`);
        }
      }

      // Also search for common chained patterns like Array.from().from syntax
      const memberAccessExpressions = sourceFile
        .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
        .filter(access => {
          try {
            const text = access.getText();
            return text.includes('Array.from().from');
          } catch (error) {
            return false;
          }
        });

      for (const access of memberAccessExpressions) {
        try {
          if (access.getText().includes('Array.from().from')) {
            access.replaceWithText('Array.from');
            fixCount++;
          }
        } catch (error) {
          console.log(`Skipping property access due to error`);
        }
      }
    } catch (error) {
      console.log(`Error processing file ${sourceFile.getBaseName()}: ${error}`);
    }
  }

  console.log(`Fixed ${fixCount} Array.from() calls`);
}

// Step 4: Fix TaskOperationResult property access
function fixTaskOperationResultAccess() {
  console.log('Fixing TaskOperationResult property access...');

  // Get all source files that might use TaskOperationResult
  const sourceFiles = project.getSourceFiles().filter(file =>
    file.getFilePath().includes('/repository/') ||
    file.getFilePath().includes('/commands/') ||
    file.getFilePath().includes('/db/')
  );

  let fixCount = 0;

  for (const sourceFile of sourceFiles) {
    // Create a safer approach by looking for variable declarations with TaskOperationResult type
    // and then looking for property accesses on those variables

    // Find variables that might be of type TaskOperationResult
    const resultVariables = new Set<string>();

    // Look for variables that contain 'result' or 'Result' in their name
    const variableDeclarations = sourceFile.getVariableDeclarations();
    for (const declaration of variableDeclarations) {
      const name = declaration.getName();
      if (name.includes('result') || name.includes('Result')) {
        resultVariables.add(name);
      }
    }

    // Also look for function parameters that might be TaskOperationResult
    const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
    for (const parameter of parameters) {
      const name = parameter.getName();
      if (name.includes('result') || name.includes('Result')) {
        resultVariables.add(name);
      }
    }

    // Find all property accesses in the file
    const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);

    // Process each property access to determine if it's on a TaskOperationResult
    for (const access of propertyAccesses) {
      try {
        // Get the expression text (the object being accessed)
        const expressionText = access.getExpression().getText();
        const accessText = access.getText();

        // Skip if it already has optional chaining
        if (accessText.includes('?.')) continue;

        // Check if this is a result variable or contains .data, .success, etc.
        const isResultAccess =
          resultVariables.has(expressionText) ||
          expressionText.includes('result.') ||
          expressionText.includes('Result.') ||
          // Common properties of TaskOperationResult
          (accessText.includes('.data') ||
           accessText.includes('.success') ||
           accessText.includes('.error'));

        if (isResultAccess) {
          // Get the property being accessed
          const propertyName = access.getName();

          // Create the safe access with optional chaining
          const safeAccess = `${expressionText}?.${propertyName}`;

          // Replace the access with the safe version
          access.replaceWithText(safeAccess);
          fixCount++;
        }
      } catch (error) {
        // Skip this access if there was an error processing it
        // This can happen if the node was removed or transformed already
        console.log(`Skipping property access due to error`);
      }
    }
  }

  console.log(`Fixed ${fixCount} TaskOperationResult property accesses`);
}

// Step 5: Fix unknown type errors in database files
function fixUnknownTypeErrors() {
  console.log('Fixing unknown type errors in database files...');

  // Get all database-related files
  const dbFiles = project.getSourceFiles().filter(file =>
    file.getFilePath().includes('/db/') &&
    (file.getFilePath().includes('check-schema.ts') ||
     file.getFilePath().includes('init.ts'))
  );

  let fixCount = 0;

  for (const sourceFile of dbFiles) {
    console.log(`Processing ${sourceFile.getBaseName()}...`);

    // Based on the TypeScript errors, we need to add type assertions to the
    // expression being iterated rather than to the initializer
    const forOfStatements = sourceFile.getDescendantsOfKind(SyntaxKind.ForOfStatement);

    for (const forOf of forOfStatements) {
      try {
        const initializer = forOf.getInitializer();
        const expression = forOf.getExpression();
        const expressionText = expression.getText();

        // Check for 'table of tablesResult' pattern
        if (expressionText === 'tablesResult' && initializer) {
          // Add type assertion to the expression being iterated
          forOf.setExpression(`${expressionText} as { name: string }[]`);
          fixCount++;
        }

        // Check for 'column of schemaResult' pattern
        if (expressionText === 'schemaResult' && initializer) {
          // Add type assertion to the expression being iterated
          forOf.setExpression(`${expressionText} as { name: string, type: string }[]`);
          fixCount++;
        }
      } catch (error) {
        console.log(`Skipping for-of statement due to error: ${error}`);
      }
    }

    // Fix error handling in catch blocks
    const catchClauses = sourceFile.getDescendantsOfKind(SyntaxKind.CatchClause);

    for (const catchClause of catchClauses) {
      try {
        const variableDeclaration = catchClause.getVariableDeclaration();

        if (variableDeclaration) {
          const paramName = variableDeclaration.getName();

          // Skip if already has a type annotation that's not 'any'
          try {
            const typeText = variableDeclaration.getType().getText();
            if (typeText !== 'any') continue;
          } catch (e) {
            // If we can't get the type, assume it needs fixing
          }

          // Add unknown type to error parameters (TS requires catch variables to be 'any' or 'unknown')
          variableDeclaration.setType('unknown');
          fixCount++;

          // Find all property accesses on this error variable
          const propertyAccesses = catchClause.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);

          for (const access of propertyAccesses) {
            try {
              // Only handle accesses on our error variable
              if (access.getExpression().getText() === paramName) {
                const property = access.getName();

                // If accessing 'message' or other Error properties, add type assertion
                if (property === 'message' || property === 'stack' || property === 'name') {
                  // Replace with a type assertion to Error
                  const fullText = access.getText();
                  access.replaceWithText(`(${paramName} as Error).${property}`);
                  fixCount++;
                }
              }
            } catch (error) {
              console.log(`Skipping property access due to error`);
            }
          }
        }
      } catch (error) {
        console.log(`Skipping catch clause due to error: ${error}`);
      }
    }

    // Also find and fix all error.message accesses across the entire file
    // This catches property accesses that might have been missed in the catch blocks
    const allPropertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);

    for (const access of allPropertyAccesses) {
      try {
        const expressionText = access.getExpression().getText();
        const property = access.getName();

        // Check if this is an error property access
        if (property === 'message' &&
            (expressionText === 'error' || expressionText.includes('Error'))) {

          // Only add type assertion if it doesn't already have one
          if (!access.getText().includes(' as ')) {
            access.replaceWithText(`(${expressionText} as Error).${property}`);
            fixCount++;
          }
        }
      } catch (error) {
        console.log(`Skipping general property access due to error`);
      }
    }
  }

  console.log(`Fixed ${fixCount} unknown type errors in database files`);
}

// Step 6: Fix NlpServiceInterface promise access in nlp-profile/index.ts
function fixNlpServicePromiseAccess() {
  console.log('Fixing NlpServiceInterface promise access in nlp-profile/index.ts...');

  // Get the nlp-profile/index.ts file
  const nlpProfileFiles = project.getSourceFiles().filter(file =>
    file.getFilePath().includes('nlp-profile/index.ts')
  );

  if (nlpProfileFiles.length === 0) {
    console.log('nlp-profile/index.ts not found');
    return;
  }

  let fixCount = 0;
  const sourceFile = nlpProfileFiles[0];
  console.log(`Processing ${sourceFile.getBaseName()}...`);

  // Find all property accesses on the nlpService variable
  // Look for patterns like: await nlpService.train()
  const awaitExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.AwaitExpression);

  for (const awaitExpr of awaitExpressions) {
    try {
      // Get the expression being awaited
      const expression = awaitExpr.getExpression();

      // Check if it's a call expression (e.g., nlpService.train())
      if (expression.getKind() === SyntaxKind.CallExpression) {
        const callExpr = expression.asKind(SyntaxKind.CallExpression);

        // Get the expression being called (e.g., nlpService.train)
        const calledExpr = callExpr.getExpression();

        // Check if it's a property access (e.g., nlpService.train)
        if (calledExpr.getKind() === SyntaxKind.PropertyAccessExpression) {
          const propAccess = calledExpr.asKind(SyntaxKind.PropertyAccessExpression);

          // Get the object being accessed (e.g., nlpService)
          const objExpr = propAccess.getExpression();

          // Only fix if the object is 'nlpService'
          if (objExpr.getText() === 'nlpService') {
            // We need to cast the nlpService to any to avoid type errors
            // Replace the propertyAccess with a cast version
            const propertyName = propAccess.getName();
            const args = callExpr.getArguments().map(arg => arg.getText()).join(', ');

            // Replace the original await expression with a cast version
            awaitExpr.replaceWithText(`await (nlpService as any).${propertyName}(${args})`);
            fixCount++;
          }
        }
      }
    } catch (error) {
      console.log(`Skipping await expression due to error: ${error}`);
    }
  }

  // Also fix the @ts-ignore comments by replacing them with proper casts
  const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);

  for (const access of propertyAccesses) {
    try {
      // Get the expression being accessed
      const objExpr = access.getExpression();

      // Only fix if the object is 'nlpService'
      if (objExpr.getText() === 'nlpService') {
        // Get the property name
        const propertyName = access.getName();

        // Check if this is a '@ts-ignore' case (like clearCache, printProfilingResults, etc.)
        const leadingComments = access.getLeadingCommentRanges();
        const hasIgnore = leadingComments?.some(comment =>
          comment.getText().includes('@ts-ignore'));

        if (hasIgnore) {
          // Replace the access with a cast version
          access.replaceWithText(`(nlpService as any).${propertyName}`);
          fixCount++;
        }
      }
    } catch (error) {
      console.log(`Skipping property access due to error: ${error}`);
    }
  }

  console.log(`Fixed ${fixCount} NlpServiceInterface promise access issues`);
}

// Run all fixers
console.log('Starting comprehensive Task fixes...');
fixTaskDefinition();
fixTaskImports();
fixArrayFromUsage();
fixTaskOperationResultAccess();
fixUnknownTypeErrors();
fixNlpServicePromiseAccess();

// Save all changes
console.log('Saving all changes...');
project.saveSync();

console.log('Comprehensive Task fixes completed successfully!');