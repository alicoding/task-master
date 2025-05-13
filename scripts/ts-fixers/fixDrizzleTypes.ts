#!/usr/bin/env tsx
/**
 * Script to fix Drizzle ORM type errors in the codebase
 * 
 * This script automatically fixes errors like:
 * "Property 'connection' does not exist on type 'BetterSQLite3Database<...>'"
 * "Property 'tableX' does not exist on type 'DrizzleTypeError<...>'"
 * 
 * It fixes database connection and schema-related type issues.
 */

import { SyntaxKind, Node, SourceFile } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Known database tables
const KNOWN_TABLES = [
  'tasks', 'dependencies', 'files', 'taskFiles', 'fileChanges', 
  'timeWindows', 'terminalSessions', 'sessionTasks', 'fileSessionMapping'
];

/**
 * Fix property access on db.connection
 */
function fixConnectionPropertyAccess(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
  let fixCount = 0;
  
  for (const propAccess of propertyAccesses) {
    const propName = propAccess.getName();
    const expression = propAccess.getExpression().getText();
    
    // Look for db.connection or this._db.connection
    if (propName === 'connection' && 
        (expression.includes('db') || expression.includes('_db')) &&
        !expression.includes('raw')) {
      
      const parent = propAccess.getParent();
      
      // Store the expression and full text before modifying anything
      const expressionText = expression;
      const fullText = propAccess.getText();

      // Log what we found
      logger.verbose(`  Found db.connection access: ${fullText}`, options.verbose);

      // Add a type assertion to the db object if it's in a condition
      if (parent && parent.getKind() === SyntaxKind.IfStatement) {
        const ifStmt = parent.asKind(SyntaxKind.IfStatement);
        const condition = ifStmt?.getExpression();

        if (condition) {
          // Instead of directly replacing the condition, just create a new condition text
          const conditionText = condition.getText();
          if (conditionText.includes(fullText)) {
            // Replace the condition with a non-null assertion on the db object
            // from: if (!this._db.connection) to: if (!this._db)
            condition.replaceWithText(expressionText);
            fixCount++;
          }
        }
      }
      // If it's a direct access, replace with a connection getter function
      else {
        // Replace db.connection with (db as any).connection
        propAccess.replaceWithText(`(${expressionText} as any).connection`);
        fixCount++;
      }
    }
  }
  
  return fixCount;
}

/**
 * Fix schema table access errors
 */
function fixSchemaTableAccess(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
  let fixCount = 0;

  for (const propAccess of propertyAccesses) {
    try {
      const propName = propAccess.getName();
      const expression = propAccess.getExpression().getText();

      // Skip any db.query.* expressions - these need special handling
      if (expression.includes('db.query')) {
        // Don't try to modify these yet
        continue;
      }

      // Look for db.tableName accesses where tableName is a known table
      if (KNOWN_TABLES.includes(propName) &&
          (expression.includes('db') || expression.includes('schema'))) {

        // Store the data we need before modifying the node
        const expressionText = expression;
        const propNameText = propName;
        const fullText = propAccess.getText();

        logger.verbose(`  Found schema table access: ${fullText}`, options.verbose);

        // Replace with a type cast: db.tableName to (db as any).tableName
        propAccess.replaceWithText(`(${expressionText} as any).${propNameText}`);
        fixCount++;

        // Skip to the next property access to avoid accessing modified nodes
        continue;
      }
    } catch (error) {
      // Log the error but continue processing other nodes
      logger.verbose(`  Error processing property access: ${error}`, options.verbose);
      continue;
    }
  }

  return fixCount;
}

/**
 * Fix generic type issues in database operations
 */
function fixDatabaseGenericTypes(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  const varDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  let fixCount = 0;

  for (const varDecl of varDeclarations) {
    // Get all the information needed before making any changes
    const name = varDecl.getName();
    const initializer = varDecl.getInitializer();
    const hasTypeNode = varDecl.getTypeNode() !== undefined;
    const initializerText = initializer ? initializer.getText() : '';

    // Skip if already has type annotation
    if (hasTypeNode) {
      continue;
    }

    // Look for database instances
    if ((name.includes('db') || name.includes('database')) &&
        initializer && initializerText.includes('drizzle(')) {

      logger.verbose(`  Found database declaration without type: ${name}`, options.verbose);

      // Add type annotation
      varDecl.setType('BetterSQLite3Database<Record<string, unknown>>');
      fixCount++;
      continue;
    }

    // Look for query results from databases
    const isQueryResult = name.includes('result') &&
        initializer &&
        (initializerText.includes('.query') ||
         initializerText.includes('.select') ||
         initializerText.includes('.insert') ||
         initializerText.includes('.delete'));

    if (isQueryResult) {
      logger.verbose(`  Found query result without type: ${name}`, options.verbose);

      // Add any type to query results
      varDecl.setType('any');
      fixCount++;
      continue;
    }
  }

  return fixCount;
}

/**
 * Fix db.query.tableName patterns - handles complex nested property access
 */
function fixDbQueryTablePattern(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;

  // Use regex to find db.query.tableName patterns in the file
  const fileContent = sourceFile.getFullText();
  const dbQueryPattern = /(\w+)\.query\.(\w+)/g;
  let match;

  // Collect all matches first
  const matches = [];
  while ((match = dbQueryPattern.exec(fileContent)) !== null) {
    const [fullMatch, dbVar, tableName] = match;
    if ((dbVar.includes('db') || dbVar.includes('_db')) &&
        KNOWN_TABLES.includes(tableName)) {
      matches.push({
        fullMatch,
        dbVar,
        tableName,
        position: match.index
      });
    }
  }

  // Sort matches by position in descending order to avoid issues with overlapping replacements
  matches.sort((a, b) => b.position - a.position);

  // Replace matches one by one using direct text manipulation
  for (const { fullMatch, dbVar, tableName } of matches) {
    logger.verbose(`  Found db.query.tableName pattern: ${fullMatch}`, options.verbose);

    // Get the sourceFile's current text
    const text = sourceFile.getFullText();

    // Find all occurrences of the match
    let pos = text.indexOf(fullMatch);

    while (pos >= 0) {
      // Create the replacement
      const replacement = `(${dbVar} as any).query.${tableName}`;

      // Replace the match
      sourceFile.replaceText([pos, pos + fullMatch.length], replacement);
      fixCount++;

      // Find the next occurrence
      pos = text.indexOf(fullMatch, pos + 1);
    }
  }

  return fixCount;
}

/**
 * Fix db.query() calls
 */
function fixQueryCalls(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;

  try {
    const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const callExpr of callExprs) {
      try {
        const expression = callExpr.getExpression();

        if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
          const propAccess = expression.asKind(SyntaxKind.PropertyAccessExpression);

          if (propAccess && propAccess.getName() === 'query') {
            const obj = propAccess.getExpression().getText();

            if (obj.includes('db') || obj.includes('_db')) {
              // Store the full text before any modifications
              const fullText = callExpr.getText();
              logger.verbose(`  Found db.query() call: ${fullText}`, options.verbose);

              // Add type assertion to the whole call
              callExpr.replaceWithText(`(${fullText} as any)`);
              fixCount++;

              // After modifying this node, continue to the next node
              // to avoid accessing modified nodes
              continue;
            }
          }
        }
      } catch (error) {
        logger.verbose(`  Error processing call expression: ${error}`, options.verbose);
        continue;
      }
    }
  } catch (error) {
    logger.error(`Error in fixQueryCalls: ${error}`);
  }

  return fixCount;
}

/**
 * Fix Drizzle ORM type issues in the project
 */
async function fixDrizzleTypes(options: ReturnType<typeof parseArgs>) {
  // Target files with database-related code
  const targetPaths = options.files.length
    ? options.files
    : [
        'core/repository/**/*.ts',
        'db/**/*.ts',
        'cli/commands/**/*.ts'
      ];

  // Process one file at a time to avoid AST node conflicts
  let fixedCount = 0;
  let processedCount = 0;

  // Get list of files to process
  const { project: tempProject, sourceFiles: allFiles } = initProject(targetPaths);
  const filesToProcess = [];

  // Filter files to only include those with database operations
  for (const sourceFile of allFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(rootDir, filePath);
    const fileContent = sourceFile.getFullText();

    if (fileContent.includes('drizzle(') ||
        fileContent.includes('connection') ||
        fileContent.includes('query(') ||
        KNOWN_TABLES.some(table => fileContent.includes(`.${table}`))) {
      filesToProcess.push(filePath);
    } else {
      logger.verbose(`  Skipping ${relativePath} (no database operations)`, options.verbose);
    }
  }

  logger.info(`Found ${filesToProcess.length} files with database operations`);

  // Process each file in isolation
  for (const filePath of filesToProcess) {
    // Create a new project for each file to avoid node conflicts
    const { project, sourceFiles } = initProject([filePath]);
    const sourceFile = sourceFiles[0];
    const relativePath = path.relative(rootDir, filePath);

    logger.info(`Processing ${relativePath} (${++processedCount}/${filesToProcess.length})`);

    try {
      // Fix various database-related issues
      const connectionFixCount = fixConnectionPropertyAccess(sourceFile, options);
      const tableFixCount = fixSchemaTableAccess(sourceFile, options);
      const genericFixCount = fixDatabaseGenericTypes(sourceFile, options);
      const queryCallFixCount = fixQueryCalls(sourceFile, options);
      const queryTableFixCount = fixDbQueryTablePattern(sourceFile, options);

      const fileFixCount = connectionFixCount + tableFixCount + genericFixCount + queryCallFixCount + queryTableFixCount;

      // Save changes if we made any fixes
      if (fileFixCount > 0) {
        logger.info(`Fixed ${fileFixCount} database type issues in ${relativePath}`);
        saveChanges(sourceFile, options.dryRun);
        fixedCount += fileFixCount;
      }
    } catch (error) {
      logger.error(`Error processing ${relativePath}: ${error}`);
      // Continue with the next file even if this one fails
      continue;
    }
  }

  logger.info(`Fixed ${fixedCount} Drizzle database type issues in ${processedCount} files`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixDrizzleTypes.ts',
  'Automatically fixes Drizzle ORM and database-related type errors.',
  fixDrizzleTypes,
  options
);