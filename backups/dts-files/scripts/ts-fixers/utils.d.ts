/**
 * Shared utilities for TypeScript fixer scripts
 */
import { Project, SourceFile, Node } from 'ts-morph';
export declare const colors: {
    reset: string;
    bright: string;
    dim: string;
    underscore: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
};
/**
 * Logger utility with colored output
 */
export declare const logger: {
    info: (message: string) => void;
    success: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
    title: (message: string) => void;
    dim: (message: string) => void;
    verbose: (message: string, isVerbose: boolean) => void;
};
/**
 * Initializes a TypeScript project for analysis and modification
 */
export declare function initProject(includePaths?: string[]): {
    project: Project;
    sourceFiles: SourceFile[];
};
/**
 * Parse command line arguments
 */
export declare function parseArgs(args: string[]): {
    dryRun: boolean;
    verbose: boolean;
    help: boolean;
    files: string[];
};
/**
 * Count TypeScript errors in the project
 */
export declare function countTsErrors(): Promise<number>;
/**
 * Find call expressions to a specific function in a source file
 */
export declare function findCallExpressions(sourceFile: SourceFile, functionNamePatterns: string[]): Node[];
/**
 * Find string literals in a source file
 */
export declare function findStringLiterals(sourceFile: SourceFile): Node[];
/**
 * Save changes to a file with dry-run support
 */
export declare function saveChanges(sourceFile: SourceFile, dryRun: boolean): boolean;
/**
 * Print script usage information
 */
export declare function printUsage(scriptName: string, description: string, options?: string[]): void;
/**
 * Run a fixer script and report results
 */
export declare function runFixer(scriptName: string, description: string, fixerFn: (options: ReturnType<typeof parseArgs>) => Promise<number>, options: ReturnType<typeof parseArgs>): Promise<number>;
