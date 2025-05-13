#!/usr/bin/env tsx
/**
 * Enhanced JavaScript to TypeScript Converter
 *
 * This script converts JavaScript files to TypeScript with proper type annotations:
 * 1. Analyzes JavaScript files to understand their structure and dependencies
 * 2. Uses AST transformation to add appropriate type annotations
 * 3. Handles common patterns and automatically infers types when possible
 * 4. Generates TypeScript files with proper imports and path aliases
 */

import { Project, ScriptTarget, SyntaxKind, SourceFile, VariableDeclarationKind, Node, ts } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Command-line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const cleanAfter = args.includes('--clean');
const fileArg = args.find(arg => !arg.startsWith('--'));

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

console.log(`
${colors.cyan}${colors.bold}Enhanced JavaScript to TypeScript Converter${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
${colors.yellow}Mode:${colors.reset} ${dryRun ? 'Dry run (no changes will be made)' : 'Live run (files will be created/modified)'}
${colors.yellow}Verbosity:${colors.reset} ${verbose ? 'Verbose' : 'Standard'}
${colors.yellow}Clean:${colors.reset} ${cleanAfter ? 'Yes (will remove .js files after conversion)' : 'No'}
${fileArg ? `${colors.yellow}Target file:${colors.reset} ${fileArg}` : ''}
`);

interface ConversionStats {
  scannedFiles: number;
  convertedFiles: number;
  addedTypeAnnotations: number;
  removedFiles: number;
}

const stats: ConversionStats = {
  scannedFiles: 0,
  convertedFiles: 0,
  addedTypeAnnotations: 0,
  removedFiles: 0
};

/**
 * Check if a file is in excluded directories
 */
function isExcludedDirectory(filePath: string): boolean {
  return filePath.includes('node_modules') || 
         filePath.includes('dist') || 
         filePath.includes('.git');
}

/**
 * Get list of JavaScript files to convert
 */
function getJavaScriptFiles(): string[] {
  // If a specific file is provided, use only that file
  if (fileArg) {
    if (!fs.existsSync(fileArg)) {
      console.error(`${colors.red}Error: File not found:${colors.reset} ${fileArg}`);
      process.exit(1);
    }
    return [fileArg];
  }
  
  // Otherwise, read from file if it exists
  if (fs.existsSync('js-needing-conversion.txt')) {
    console.log(`${colors.blue}Reading files to convert from js-needing-conversion.txt${colors.reset}`);
    const files = fs.readFileSync('js-needing-conversion.txt', 'utf-8')
      .split('\n')
      .filter(Boolean);
    return files;
  }
  
  console.error(`${colors.red}Error: No target files specified and js-needing-conversion.txt not found${colors.reset}`);
  process.exit(1);
}

/**
 * Convert a JavaScript file to TypeScript with proper types
 */
function convertJsToTs(jsFilePath: string): boolean {
  try {
    // Skip if file doesn't exist
    if (!fs.existsSync(jsFilePath)) {
      if (verbose) {
        console.log(`${colors.yellow}Skipping${colors.reset} - File doesn't exist: ${jsFilePath}`);
      }
      return false;
    }

    // Skip if in excluded directory
    if (isExcludedDirectory(jsFilePath)) {
      if (verbose) {
        console.log(`${colors.yellow}Skipping${colors.reset} - Excluded directory: ${jsFilePath}`);
      }
      return false;
    }
    
    // Define target TS file path
    const tsFilePath = jsFilePath.replace(/\.js$/, '.ts');
    
    // Skip if TypeScript equivalent already exists
    if (fs.existsSync(tsFilePath)) {
      if (verbose) {
        console.log(`${colors.yellow}Skipping${colors.reset} - TypeScript equivalent exists: ${jsFilePath}`);
      }
      return false;
    }

    // Initialize ts-morph project for parsing
    const project = new Project({
      compilerOptions: {
        target: ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        skipLibCheck: true,
      }
    });
    
    // Add the JS file as source file
    const sourceFile = project.addSourceFileAtPath(jsFilePath);
    
    // Apply transformations
    convertJsImportsToTs(sourceFile);
    addTypeAnnotations(sourceFile);
    convertRelativeImportsToPathAliases(sourceFile);
    
    // Get the processed content
    let tsContent = sourceFile.getFullText();
    
    // Create the TypeScript file (but not in dry run mode)
    if (!dryRun) {
      fs.writeFileSync(tsFilePath, tsContent, 'utf-8');
      console.log(`${colors.green}✓ Converted:${colors.reset} ${jsFilePath} → ${tsFilePath}`);
      
      // Clean up JS file if clean flag is set
      if (cleanAfter) {
        // Check if map file exists
        const mapFile = `${jsFilePath}.map`;
        if (fs.existsSync(mapFile)) {
          fs.unlinkSync(mapFile);
          stats.removedFiles++;
        }
        
        // Remove JS file
        fs.unlinkSync(jsFilePath);
        stats.removedFiles++;
        
        if (verbose) {
          console.log(`${colors.gray}  Removed: ${jsFilePath} and source map if exists${colors.reset}`);
        }
      }
      
      stats.convertedFiles++;
    } else {
      if (verbose) {
        console.log(`${colors.green}Would convert:${colors.reset} ${jsFilePath} → ${tsFilePath}`);
        console.log(`${colors.gray}Preview of content:${colors.reset}`);
        console.log(tsContent.substring(0, 500) + (tsContent.length > 500 ? '...' : ''));
      } else {
        console.log(`${colors.green}Would convert:${colors.reset} ${jsFilePath} → ${tsFilePath}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error converting${colors.reset} ${jsFilePath}:`, error);
    return false;
  }
}

/**
 * Convert .js extensions to .ts in imports
 */
function convertJsImportsToTs(sourceFile: SourceFile): void {
  // Handle static imports: import { X } from './path.js'
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDeclaration of importDeclarations) {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && moduleSpecifier.endsWith('.js')) {
      const newModuleSpecifier = moduleSpecifier.replace(/\.js$/, '.ts');
      importDeclaration.setModuleSpecifier(newModuleSpecifier);
    }
  }

  // Handle export declarations: export * from './path.js'
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDeclaration of exportDeclarations) {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && moduleSpecifier.endsWith('.js')) {
      const newModuleSpecifier = moduleSpecifier.replace(/\.js$/, '.ts');
      exportDeclaration.setModuleSpecifier(newModuleSpecifier);
    }
  }

  // Handle dynamic imports: import('./path.ts')
  const dynamicImports = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => call.getExpression().getText() === 'import' &&
            call.getArguments().length > 0 &&
            call.getArguments()[0].getKind() === SyntaxKind.StringLiteral);

  for (const dynamicImport of dynamicImports) {
    const argLiteral = dynamicImport.getArguments()[0].asKind(SyntaxKind.StringLiteral);
    if (argLiteral) {
      const importPath = argLiteral.getLiteralValue();
      if (importPath.endsWith('.js')) {
        const newImportPath = importPath.replace(/\.js$/, '.ts');
        argLiteral.setLiteralValue(newImportPath);
      }
    }
  }
}

/**
 * Convert relative imports to path aliases where appropriate
 */
function convertRelativeImportsToPathAliases(sourceFile: SourceFile): void {
  const filePath = sourceFile.getFilePath();
  
  // Only apply to files in src, cli, or core directories
  if (!filePath.includes('/src/') && !filePath.includes('/cli/') && !filePath.includes('/core/')) {
    return;
  }
  
  // Map from directory segment to path alias
  const pathAliasMap: Record<string, string> = {
    src: '@/',
    cli: '@/cli/',
    core: '@/core/',
    db: '@/db/'
  };
  
  // Function to check if a path should use an alias
  const shouldUseAlias = (modulePath: string): boolean => {
    // Don't convert node module imports or absolute imports
    if (!modulePath.startsWith('.')) {
      return false;
    }
    
    // Don't convert very short relative imports (like './utils')
    const segments = modulePath.split('/').filter(Boolean);
    return segments.length > 1 || modulePath.includes('../');
  };
  
  // Function to convert a path to use aliases
  const convertToAlias = (modulePath: string): string => {
    // Get the absolute path
    const absolutePath = path.resolve(path.dirname(filePath), modulePath);
    const projectRoot = path.resolve('.');
    
    // Get the relative path from project root
    const relativePath = path.relative(projectRoot, absolutePath);
    
    // Determine which alias to use
    for (const [dir, alias] of Object.entries(pathAliasMap)) {
      if (relativePath.startsWith(dir + '/')) {
        return alias + relativePath.substring(dir.length + 1);
      }
    }
    
    // If no alias matches, return the original path
    return modulePath;
  };
  
  // Process import declarations
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDeclaration of importDeclarations) {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && shouldUseAlias(moduleSpecifier)) {
      const newModuleSpecifier = convertToAlias(moduleSpecifier);
      if (newModuleSpecifier !== moduleSpecifier) {
        importDeclaration.setModuleSpecifier(newModuleSpecifier);
      }
    }
  }
  
  // Process export declarations
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDeclaration of exportDeclarations) {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && shouldUseAlias(moduleSpecifier)) {
      const newModuleSpecifier = convertToAlias(moduleSpecifier);
      if (newModuleSpecifier !== moduleSpecifier) {
        exportDeclaration.setModuleSpecifier(newModuleSpecifier);
      }
    }
  }
}

/**
 * Add type annotations to variables, functions, and class members
 */
function addTypeAnnotations(sourceFile: SourceFile): void {
  // Track the number of annotations added
  let annotationsAdded = 0;
  
  // Process variable declarations
  const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  for (const declaration of variableDeclarations) {
    // Skip if it already has a type annotation
    if (declaration.getTypeNode()) {
      continue;
    }
    
    // Determine if this is a function we can annotate
    const initializer = declaration.getInitializer();
    if (initializer && 
        (initializer.getKind() === SyntaxKind.ArrowFunction || 
         initializer.getKind() === SyntaxKind.FunctionExpression)) {
      
      // Add types to arrow functions and function expressions
      const func = initializer.asKind(SyntaxKind.ArrowFunction) || 
                  initializer.asKind(SyntaxKind.FunctionExpression);
      
      if (func) {
        // Add any type to parameters without type annotations
        func.getParameters().forEach(param => {
          if (!param.getTypeNode()) {
            param.setType('any');
            annotationsAdded++;
          }
        });
        
        // Add return type if none exists
        if (!func.getReturnTypeNode()) {
          func.setReturnType('any');
          annotationsAdded++;
        }
      }
    } else if (initializer) {
      // For regular variables, infer type from initializer when possible
      let typeAnnotation: string | undefined;
      
      if (initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
        typeAnnotation = 'Record<string, any>';
      } else if (initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
        typeAnnotation = 'any[]';
      } else if (initializer.getKind() === SyntaxKind.StringLiteral) {
        typeAnnotation = 'string';
      } else if (initializer.getKind() === SyntaxKind.NumericLiteral) {
        typeAnnotation = 'number';
      } else if (initializer.getKind() === SyntaxKind.TrueKeyword || 
                initializer.getKind() === SyntaxKind.FalseKeyword) {
        typeAnnotation = 'boolean';
      } else if (initializer.getText() === 'null') {
        typeAnnotation = 'null';
      } else if (initializer.getText() === 'undefined') {
        typeAnnotation = 'undefined';
      }
      
      // Add the type annotation if we could infer one
      if (typeAnnotation) {
        declaration.setType(typeAnnotation);
        annotationsAdded++;
      }
    }
  }
  
  // Process function declarations
  const functionDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
  for (const func of functionDeclarations) {
    // Add any type to parameters without type annotations
    func.getParameters().forEach(param => {
      if (!param.getTypeNode()) {
        param.setType('any');
        annotationsAdded++;
      }
    });
    
    // Add return type if none exists
    if (!func.getReturnTypeNode()) {
      // Check if the function returns anything
      const returnStatements = func
        .getDescendantsOfKind(SyntaxKind.ReturnStatement)
        .filter(ret => ret.getExpression());
      
      if (returnStatements.length > 0) {
        func.setReturnType('any');
      } else {
        func.setReturnType('void');
      }
      annotationsAdded++;
    }
  }
  
  // Process class declarations
  const classDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
  for (const classDecl of classDeclarations) {
    // Process properties
    const properties = classDecl.getProperties();
    for (const prop of properties) {
      if (!prop.getTypeNode()) {
        prop.setType('any');
        annotationsAdded++;
      }
    }
    
    // Process methods
    const methods = classDecl.getMethods();
    for (const method of methods) {
      // Add types to parameters
      method.getParameters().forEach(param => {
        if (!param.getTypeNode()) {
          param.setType('any');
          annotationsAdded++;
        }
      });
      
      // Add return type
      if (!method.getReturnTypeNode()) {
        // Check if the method returns anything
        const returnStatements = method
          .getDescendantsOfKind(SyntaxKind.ReturnStatement)
          .filter(ret => ret.getExpression());
        
        if (returnStatements.length > 0) {
          method.setReturnType('any');
        } else {
          method.setReturnType('void');
        }
        annotationsAdded++;
      }
    }
  }
  
  // Update the global stats
  stats.addedTypeAnnotations += annotationsAdded;
  
  if (verbose && annotationsAdded > 0) {
    console.log(`${colors.blue}  Added ${annotationsAdded} type annotations${colors.reset}`);
  }
}

// Main execution
async function main() {
  // Get JavaScript files to convert
  const jsFiles = getJavaScriptFiles();
  stats.scannedFiles = jsFiles.length;
  
  console.log(`${colors.blue}Processing ${jsFiles.length} JavaScript files...${colors.reset}\n`);
  
  // Convert each JavaScript file
  for (const jsFile of jsFiles) {
    convertJsToTs(jsFile);
  }
  
  // Print results
  console.log(`\n${colors.cyan}${colors.bold}Results:${colors.reset}`);
  console.log(`${colors.yellow}Scanned:${colors.reset} ${stats.scannedFiles} files`);
  console.log(`${colors.yellow}Converted:${colors.reset} ${stats.convertedFiles} files`);
  console.log(`${colors.yellow}Type annotations added:${colors.reset} ${stats.addedTypeAnnotations}`);
  
  if (cleanAfter && !dryRun) {
    console.log(`${colors.yellow}Removed:${colors.reset} ${stats.removedFiles} files (.js and .js.map)`);
  }
  
  if (dryRun) {
    console.log(`\n${colors.yellow}${colors.bold}NOTE:${colors.reset} This was a dry run. No files were modified.`);
    console.log(`Run without ${colors.cyan}--dry-run${colors.reset} to apply the changes.`);
  } else {
    console.log(`\n${colors.green}${colors.bold}✓ Conversion complete!${colors.reset}`);
    
    // Next steps guidance
    console.log(`\n${colors.magenta}${colors.bold}Next steps:${colors.reset}`);
    console.log(`1. Review the converted TypeScript files`);
    console.log(`2. Run TypeScript compiler to check for any issues:`);
    console.log(`   ${colors.cyan}npm run typecheck${colors.reset}`);
    console.log(`3. Fix any type errors in the converted files`);
    console.log(`4. Run tests to ensure functionality remains intact:`);
    console.log(`   ${colors.cyan}npm run test${colors.reset}`);
  }
}

main().catch(error => {
  console.error(`${colors.red}${colors.bold}Error:${colors.reset}`, error);
  process.exit(1);
});