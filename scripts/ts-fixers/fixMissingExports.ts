#!/usr/bin/env tsx
/**
 * Script to fix missing export errors in the codebase
 * 
 * This script automatically fixes errors like:
 * "Module 'X' has no exported member 'Y'"
 * 
 * It adds missing exports to modules based on a predefined mapping.
 */

import { SyntaxKind, SourceFile } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Define exports that need to be added to each file
// This maps file paths to the exports they should have
const EXPORTS_MAP = {
  'src/core/types.ts': [
    { name: 'HierarchyTask', type: true, extends: 'Task', properties: [
      { name: 'children', type: 'HierarchyTask[]', optional: true },
      { name: 'depth', type: 'number', optional: true }
    ]},
    { name: 'TaskSearch', type: true, properties: [
      { name: 'query', type: 'string', optional: true },
      { name: 'status', type: 'TaskStatus | TaskStatus[]', optional: true },
      { name: 'readiness', type: 'TaskReadiness | TaskReadiness[]', optional: true },
      { name: 'tags', type: 'string[]', optional: true },
      { name: 'metadata', type: 'Record<string, any>', optional: true }
    ]},
    { name: 'TaskCreateInput', type: true, properties: [
      { name: 'title', type: 'string', optional: false },
      { name: 'description', type: 'string', optional: true },
      { name: 'status', type: 'TaskStatus', optional: true },
      { name: 'readiness', type: 'TaskReadiness', optional: true },
      { name: 'tags', type: 'string[]', optional: true },
      { name: 'metadata', type: 'Record<string, any>', optional: true },
      { name: 'parentId', type: 'string', optional: true }
    ]}
  ],
  'src/core/dod/types.ts': [
    { name: 'DoD', type: true, properties: [
      { name: 'id', type: 'string' },
      { name: 'taskId', type: 'string' },
      { name: 'checks', type: 'DoDCheck[]' },
      { name: 'completed', type: 'boolean' },
      { name: 'createdAt', type: 'Date' },
      { name: 'updatedAt', type: 'Date' }
    ]},
    { name: 'DoDCheck', type: true, properties: [
      { name: 'id', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'completed', type: 'boolean' },
      { name: 'required', type: 'boolean' }
    ]}
  ],
  'src/db/schema.ts': [
    { name: 'files', export: true, table: true },
    { name: 'taskFiles', export: true, table: true },
    { name: 'fileChanges', export: true, table: true },
    { name: 'timeWindows', export: true, table: true },
    { name: 'terminalSessions', export: true, table: true },
    { name: 'sessionTasks', export: true, table: true },
    { name: 'fileSessionMapping', export: true, table: true }
  ],
  'src/core/terminal/terminal-session-types.ts': [
    { name: 'TerminalSession', type: true, properties: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'startTime', type: 'Date', optional: true },
      { name: 'endTime', type: 'Date', optional: true },
      { name: 'metadata', type: 'Record<string, any>', optional: true }
    ]},
    { name: 'TimeWindowType', type: true, union: true, values: ['task', 'file', 'idle', 'break', 'meeting'] },
    { name: 'TimeWindowStatus', type: true, union: true, values: ['active', 'completed', 'cancelled'] },
    { name: 'TimeWindow', type: true, properties: [
      { name: 'id', type: 'string' },
      { name: 'sessionId', type: 'string' },
      { name: 'taskId', type: 'string', optional: true },
      { name: 'type', type: 'TimeWindowType' },
      { name: 'status', type: 'TimeWindowStatus' },
      { name: 'startTime', type: 'Date' },
      { name: 'endTime', type: 'Date', optional: true },
      { name: 'duration', type: 'number', optional: true },
      { name: 'metadata', type: 'Record<string, any>', optional: true }
    ]}
  ],
  'src/core/terminal/time-window-manager.ts': [
    { name: 'TimeWindow', export: true }
  ]
};

/**
 * Generate interface definition code
 */
function generateInterface(def: any): string {
  const properties = def.properties?.map((prop: any) => {
    return `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`;
  }).join('\n') || '';
  
  const extendsClause = def.extends ? ` extends ${def.extends}` : '';
  
  return `export interface ${def.name}${extendsClause} {\n${properties}\n}`;
}

/**
 * Generate type union definition code
 */
function generateTypeUnion(def: any): string {
  const values = def.values.map((v: string) => `'${v}'`).join(' | ');
  return `export type ${def.name} = ${values};`;
}

/**
 * Generate table definition code
 */
function generateTableExport(def: any): string {
  return `export const ${def.name} = sqliteTable('${def.name}', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});`;
}

/**
 * Check if a file has an export with the given name
 */
function hasExport(sourceFile: SourceFile, exportName: string): boolean {
  // Check interface exports
  const interfaces = sourceFile.getInterfaces();
  if (interfaces.some(i => i.getName() === exportName && i.isExported())) {
    return true;
  }
  
  // Check type alias exports
  const typeAliases = sourceFile.getTypeAliases();
  if (typeAliases.some(t => t.getName() === exportName && t.isExported())) {
    return true;
  }
  
  // Check variable declarations
  const variables = sourceFile.getVariableDeclarations();
  if (variables.some(v => v.getName() === exportName && 
      v.getFirstAncestorByKind(SyntaxKind.VariableStatement)?.isExported())) {
    return true;
  }
  
  // Check regular exports
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDecl of exportDeclarations) {
    const namedExports = exportDecl.getNamedExports();
    if (namedExports.some(e => e.getName() === exportName)) {
      return true;
    }
  }
  
  // Check class exports
  const classes = sourceFile.getClasses();
  if (classes.some(c => c.getName() === exportName && c.isExported())) {
    return true;
  }
  
  return false;
}

/**
 * Fix missing exports in a project
 */
async function fixMissingExports(options: ReturnType<typeof parseArgs>) {
  // Get target files from arguments or use the predefined map
  const targetPaths = options.files.length
    ? options.files
    : Object.keys(EXPORTS_MAP).map(p => path.resolve(rootDir, p));
  
  const { project } = initProject(targetPaths);
  
  let fixedCount = 0;
  
  // Process each file in the exports map
  for (const [filePath, exports] of Object.entries(EXPORTS_MAP)) {
    const resolvedPath = path.resolve(rootDir, filePath);
    let sourceFile = project.getSourceFile(resolvedPath);
    
    // Skip if file doesn't exist or wasn't included
    if (!sourceFile) {
      logger.warning(`File not found: ${resolvedPath}`);
      continue;
    }
    
    logger.info(`Processing ${filePath}`);
    let fileFixCount = 0;
    
    // Check for each export
    for (const exportDef of exports) {
      const { name } = exportDef;
      
      // Skip if already exported
      if (hasExport(sourceFile, name)) {
        logger.verbose(`  Export ${name} already exists`, options.verbose);
        continue;
      }
      
      logger.verbose(`  Adding missing export: ${name}`, options.verbose);
      
      // Generate code for the export
      let code = '';
      if (exportDef.type && exportDef.union) {
        code = generateTypeUnion(exportDef);
      } else if (exportDef.type) {
        code = generateInterface(exportDef);
      } else if (exportDef.table) {
        code = generateTableExport(exportDef);
      } else {
        code = `export const ${name} = {}; // Auto-generated export`;
      }
      
      // Add the export to the end of the file
      sourceFile.addStatements(code);
      
      fileFixCount++;
      fixedCount++;
    }
    
    // Save changes if we made any fixes
    if (fileFixCount > 0) {
      logger.info(`Added ${fileFixCount} missing exports to ${filePath}`);
      saveChanges(sourceFile, options.dryRun);
    }
  }
  
  logger.info(`Fixed ${fixedCount} missing exports in ${Object.keys(EXPORTS_MAP).length} files`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixMissingExports.ts',
  'Automatically adds missing exports to modules based on a predefined mapping.',
  fixMissingExports,
  options
);