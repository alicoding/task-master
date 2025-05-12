/**
 * File Change Analyzer for extracting metadata from file changes
 * Implements Task 17.6: File Change Analyzer
 * 
 * This module provides analysis of file changes to extract metadata
 * beyond task relationships, including code metrics, change patterns,
 * and structural information.
 */

import fs from 'fs/promises';
import path from 'path';
import { FileChangeEvent } from './file-tracking-daemon.ts';
import { createLogger } from '../utils/logger.ts';
import { diffLines } from 'diff';

// Create logger for file change analyzer
const logger = createLogger('FileChangeAnalyzer');

/**
 * File Change Analyzer configuration
 */
export interface FileChangeAnalyzerConfig {
  // File extensions to analyze (e.g., ['.js', '.ts', '.tsx'])
  fileExtensions: string[];
  
  // Patterns to exclude from analysis (e.g., ['node_modules', 'dist'])
  excludePatterns: string[];
  
  // Whether to calculate code complexity metrics
  calculateComplexity: boolean;
  
  // Whether to track function/class changes
  trackStructuralChanges: boolean;
  
  // Whether to compute diff statistics
  computeDiffStats: boolean;
  
  // Maximum file size to analyze (in bytes)
  maxFileSize: number;
}

/**
 * Default configuration for the File Change Analyzer
 */
export const DEFAULT_FILE_CHANGE_ANALYZER_CONFIG: FileChangeAnalyzerConfig = {
  fileExtensions: ['.js', '.ts', '.tsx', '.jsx', '.md', '.json'],
  excludePatterns: ['node_modules', 'dist', '.git'],
  calculateComplexity: true,
  trackStructuralChanges: true,
  computeDiffStats: true,
  maxFileSize: 1024 * 1024 // 1MB
};

/**
 * Code complexity metrics
 */
export interface CodeComplexityMetrics {
  // Number of lines of code
  linesOfCode: number;
  
  // Number of functions/methods
  functionCount: number;
  
  // Number of classes
  classCount: number;
  
  // Cyclomatic complexity estimation
  cyclomaticComplexity: number;
  
  // Maintainability index (0-100)
  maintainabilityIndex: number;
}

/**
 * Structural change information
 */
export interface StructuralChangeInfo {
  // Added function/method names
  addedFunctions: string[];
  
  // Modified function/method names
  modifiedFunctions: string[];
  
  // Removed function/method names
  removedFunctions: string[];
  
  // Added class names
  addedClasses: string[];
  
  // Modified class names
  modifiedClasses: string[];
  
  // Removed class names
  removedClasses: string[];
}

/**
 * Diff statistics
 */
export interface DiffStatistics {
  // Lines added count
  linesAdded: number;
  
  // Lines removed count
  linesRemoved: number;
  
  // Lines modified count
  linesModified: number;
  
  // Overall change percentage
  changePercentage: number;
}

/**
 * Result of file change analysis
 */
export interface FileChangeAnalysisResult {
  // File path
  filePath: string;
  
  // File type based on extension and content
  fileType: string;
  
  // File size in bytes
  fileSize: number;
  
  // Programming language
  language: string;
  
  // Complexity metrics
  complexityMetrics?: CodeComplexityMetrics;
  
  // Structural changes information
  structuralChanges?: StructuralChangeInfo;
  
  // Diff statistics
  diffStats?: DiffStatistics;
  
  // Keywords extracted from content
  keywords: string[];
  
  // Timestamp of analysis
  timestamp: Date;
}

/**
 * File Change Analyzer
 * 
 * This class analyzes file changes to extract metadata beyond task relationships,
 * focusing on code metrics, structural changes, and diff statistics.
 */
export class FileChangeAnalyzer {
  private config: FileChangeAnalyzerConfig;
  private previousFileContents: Map<string, string> = new Map();
  
  /**
   * Create a new File Change Analyzer
   * @param config Configuration options
   */
  constructor(config: Partial<FileChangeAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_FILE_CHANGE_ANALYZER_CONFIG, ...config };
    
    logger.debug('File Change Analyzer initialized with config:', {
      fileExtensions: this.config.fileExtensions,
      calculateComplexity: this.config.calculateComplexity,
      trackStructuralChanges: this.config.trackStructuralChanges
    });
  }
  
  /**
   * Analyze a file change event
   * @param event The file change event to analyze
   * @returns Analysis result or null if the file should be skipped
   */
  async analyzeFileChange(event: FileChangeEvent): Promise<FileChangeAnalysisResult | null> {
    // Skip deleted files
    if (event.type === 'deleted' || event.type === 'unlink') {
      // Remove from previous contents cache
      this.previousFileContents.delete(event.path);
      return null;
    }
    
    // Skip files based on exclusion patterns
    if (this.shouldExcludeFile(event.path)) {
      return null;
    }
    
    try {
      // Read file content
      const content = await fs.readFile(event.path, 'utf-8');
      
      // Skip if file is too large
      const stats = await fs.stat(event.path);
      if (stats.size > this.config.maxFileSize) {
        logger.warn(`Skipping large file ${event.path} (${stats.size} bytes)`);
        return null;
      }
      
      // Get file extension and determine language
      const extension = path.extname(event.path).toLowerCase();
      const language = this.determineLanguage(extension);
      
      // Skip if not in included extensions (if list is not empty)
      if (this.config.fileExtensions.length > 0 && !this.config.fileExtensions.includes(extension)) {
        return null;
      }
      
      // Initialize result
      const result: FileChangeAnalysisResult = {
        filePath: event.path,
        fileType: this.determineFileType(event.path, content),
        fileSize: stats.size,
        language,
        keywords: this.extractKeywords(content),
        timestamp: new Date()
      };
      
      // Calculate complexity metrics if enabled
      if (this.config.calculateComplexity) {
        result.complexityMetrics = this.calculateComplexityMetrics(content, language);
      }
      
      // Track structural changes if enabled
      if (this.config.trackStructuralChanges) {
        result.structuralChanges = this.analyzeStructuralChanges(
          content, 
          this.previousFileContents.get(event.path) || '',
          language
        );
      }
      
      // Compute diff statistics if enabled
      if (this.config.computeDiffStats && this.previousFileContents.has(event.path)) {
        result.diffStats = this.computeDiffStatistics(
          content,
          this.previousFileContents.get(event.path) || ''
        );
      }
      
      // Save current content for future comparisons
      this.previousFileContents.set(event.path, content);
      
      return result;
    } catch (error) {
      logger.error(`Error analyzing file change for ${event.path}:`, error);
      return null;
    }
  }
  
  /**
   * Analyze multiple file changes in batch
   * @param events Array of file change events
   * @returns Array of analysis results (null for skipped files)
   */
  async analyzeMultipleChanges(events: FileChangeEvent[]): Promise<(FileChangeAnalysisResult | null)[]> {
    return Promise.all(events.map(event => this.analyzeFileChange(event)));
  }
  
  /**
   * Calculate code complexity metrics
   * @param content File content
   * @param language Programming language
   * @returns Complexity metrics
   */
  private calculateComplexityMetrics(content: string, language: string): CodeComplexityMetrics {
    // Count lines of code (excluding empty lines and comments)
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
        !trimmed.startsWith('//') && 
        !trimmed.startsWith('/*') && 
        !trimmed.startsWith('*') &&
        !trimmed.startsWith('#');
    }).length;
    
    // Count functions (very simplified, could be improved with AST parsing)
    const functionMatches = content.match(/function\s+\w+\s*\(|const\s+\w+\s*=\s*\([^)]*\)\s*=>|^\s*\w+\s*\([^)]*\)\s*{/gm);
    const functionCount = functionMatches ? functionMatches.length : 0;
    
    // Count classes (very simplified, could be improved with AST parsing)
    const classMatches = content.match(/class\s+\w+/g);
    const classCount = classMatches ? classMatches.length : 0;
    
    // Simple cyclomatic complexity estimation by counting branches
    const branches = (content.match(/if|else|for|while|switch|case|catch|&&|\|\||\?/g) || []).length;
    const cyclomaticComplexity = 1 + branches;
    
    // Simple maintainability index calculation (0-100 scale)
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / Math.max(1, lines.length);
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || 
        trimmed.startsWith('/*') || 
        trimmed.startsWith('*');
    }).length;
    const commentRatio = commentLines / Math.max(1, lines.length);
    
    // Higher ratio of comments and lower cyclomatic complexity improves maintainability
    const maintainabilityIndex = Math.max(0, Math.min(100, 
      100 - (cyclomaticComplexity * 0.2) + (commentRatio * 20) - (avgLineLength * 0.2)
    ));
    
    return {
      linesOfCode,
      functionCount,
      classCount,
      cyclomaticComplexity,
      maintainabilityIndex: Math.round(maintainabilityIndex)
    };
  }
  
  /**
   * Analyze structural changes between versions
   * @param newContent New file content
   * @param oldContent Previous file content
   * @param language Programming language
   * @returns Structural change information
   */
  private analyzeStructuralChanges(
    newContent: string, 
    oldContent: string,
    language: string
  ): StructuralChangeInfo {
    // This is a simplified implementation - for production use,
    // we would use a proper AST parser for the specific language
    
    // Extract functions from content
    const extractFunctions = (content: string): string[] => {
      const functionMatches = content.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>|(\w+)\s*\([^)]*\)\s*{/gm);
      if (!functionMatches) return [];
      
      return functionMatches.map(match => {
        const functionNameMatch = match.match(/function\s+(\w+)|const\s+(\w+)|(\w+)\s*\(/);
        if (functionNameMatch) {
          return functionNameMatch[1] || functionNameMatch[2] || functionNameMatch[3] || '';
        }
        return '';
      }).filter(Boolean);
    };
    
    // Extract classes from content
    const extractClasses = (content: string): string[] => {
      const classMatches = content.match(/class\s+(\w+)/g);
      if (!classMatches) return [];
      
      return classMatches.map(match => {
        const classNameMatch = match.match(/class\s+(\w+)/);
        return classNameMatch ? classNameMatch[1] : '';
      }).filter(Boolean);
    };
    
    const oldFunctions = extractFunctions(oldContent);
    const newFunctions = extractFunctions(newContent);
    
    const oldClasses = extractClasses(oldContent);
    const newClasses = extractClasses(newContent);
    
    // Determine added, modified, and removed functions
    const addedFunctions = newFunctions.filter(fn => !oldFunctions.includes(fn));
    const removedFunctions = oldFunctions.filter(fn => !newFunctions.includes(fn));
    
    // Determine added, modified, and removed classes
    const addedClasses = newClasses.filter(cls => !oldClasses.includes(cls));
    const removedClasses = oldClasses.filter(cls => !newClasses.includes(cls));
    
    // For modified functions, we need more sophisticated analysis with AST parsing
    // This is a simplified approach
    const modifiedFunctions = oldFunctions.filter(fn => 
      newFunctions.includes(fn) && 
      this.functionContentChanged(fn, oldContent, newContent)
    );
    
    // For modified classes, similar approach
    const modifiedClasses = oldClasses.filter(cls => 
      newClasses.includes(cls) && 
      this.classContentChanged(cls, oldContent, newContent)
    );
    
    return {
      addedFunctions,
      modifiedFunctions,
      removedFunctions,
      addedClasses,
      modifiedClasses,
      removedClasses
    };
  }
  
  /**
   * Check if function content has changed
   * @param functionName Function name to check
   * @param oldContent Old file content
   * @param newContent New file content
   * @returns True if function content has changed
   */
  private functionContentChanged(
    functionName: string, 
    oldContent: string, 
    newContent: string
  ): boolean {
    // Simplified implementation - could be improved with AST parsing
    const extractFunctionContent = (content: string, fnName: string): string => {
      // Try different function declaration patterns
      const patterns = [
        // Regular function declaration: function name() {...}
        new RegExp(`function\\s+${fnName}\\s*\\([^)]*\\)\\s*{([^}]*)}`, 's'),
        // Arrow function: const name = () => {...}
        new RegExp(`const\\s+${fnName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{([^}]*)}`, 's'),
        // Method definition: name() {...}
        new RegExp(`${fnName}\\s*\\([^)]*\\)\\s*{([^}]*)}`, 's')
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      return '';
    };
    
    const oldFnContent = extractFunctionContent(oldContent, functionName);
    const newFnContent = extractFunctionContent(newContent, functionName);
    
    return oldFnContent !== newFnContent;
  }
  
  /**
   * Check if class content has changed
   * @param className Class name to check
   * @param oldContent Old file content
   * @param newContent New file content
   * @returns True if class content has changed
   */
  private classContentChanged(
    className: string, 
    oldContent: string, 
    newContent: string
  ): boolean {
    // Simplified implementation - could be improved with AST parsing
    const extractClassContent = (content: string, clsName: string): string => {
      const pattern = new RegExp(`class\\s+${clsName}\\s*{([^}]*)}`, 's');
      const match = content.match(pattern);
      return match && match[1] ? match[1].trim() : '';
    };
    
    const oldClassContent = extractClassContent(oldContent, className);
    const newClassContent = extractClassContent(newContent, className);
    
    return oldClassContent !== newClassContent;
  }
  
  /**
   * Compute diff statistics between two versions of a file
   * @param newContent New file content
   * @param oldContent Previous file content
   * @returns Diff statistics
   */
  private computeDiffStatistics(newContent: string, oldContent: string): DiffStatistics {
    // Calculate diff using 'diff' library
    const changes = diffLines(oldContent, newContent);
    
    let linesAdded = 0;
    let linesRemoved = 0;
    let linesModified = 0;
    
    for (const change of changes) {
      const lineCount = (change.value.match(/\n/g) || []).length + (change.value.endsWith('\n') ? 0 : 1);
      
      if (change.added) {
        linesAdded += lineCount;
      } else if (change.removed) {
        linesRemoved += lineCount;
      } else {
        // Check if this is part of a modification (if previous was removed and next is added)
        const index = changes.indexOf(change);
        if (index > 0 && changes[index - 1].removed && index < changes.length - 1 && changes[index + 1].added) {
          linesModified += lineCount;
        }
      }
    }
    
    // Calculate total lines in old content for percentage
    const totalOldLines = (oldContent.match(/\n/g) || []).length + (oldContent.endsWith('\n') ? 0 : 1);
    const changePercentage = totalOldLines > 0 
      ? Math.min(100, Math.round((linesAdded + linesRemoved + linesModified) / totalOldLines * 100))
      : (linesAdded > 0 ? 100 : 0);
    
    return {
      linesAdded,
      linesRemoved,
      linesModified,
      changePercentage
    };
  }
  
  /**
   * Extract keywords from file content
   * @param content File content
   * @returns Array of keywords
   */
  private extractKeywords(content: string): string[] {
    // This is a simplified implementation
    // A more sophisticated approach would use NLP techniques
    
    // Remove comments
    const noComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Get all words, filtering out common programming language keywords
    const words = noComments.match(/\b[A-Za-z][A-Za-z0-9_]{2,}\b/g) || [];
    
    // Common keywords to filter out
    const commonKeywords = new Set([
      'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 
      'switch', 'case', 'break', 'continue', 'default', 'try', 'catch', 'throw',
      'new', 'this', 'class', 'interface', 'type', 'enum', 'import', 'export',
      'from', 'as', 'async', 'await', 'true', 'false', 'null', 'undefined'
    ]);
    
    // Filter and count word frequencies
    const wordCounts = words.filter(word => !commonKeywords.has(word.toLowerCase()))
      .reduce((acc, word) => {
        const key = word.toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    // Sort by frequency and limit to top 20
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }
  
  /**
   * Determine the programming language based on file extension
   * @param extension File extension (including the dot)
   * @returns Programming language name
   */
  private determineLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript (React)',
      '.tsx': 'TypeScript (React)',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.go': 'Go',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.rs': 'Rust',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.less': 'LESS',
      '.md': 'Markdown',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yml': 'YAML',
      '.yaml': 'YAML',
      '.sh': 'Shell',
      '.bat': 'Batch',
      '.ps1': 'PowerShell'
    };
    
    return languageMap[extension.toLowerCase()] || 'Unknown';
  }
  
  /**
   * Determine the file type based on extension and content
   * @param filePath File path
   * @param content File content
   * @returns File type
   */
  private determineFileType(filePath: string, content: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);
    
    // Check if it's a test file
    if (
      filename.includes('.test.') ||
      filename.includes('.spec.') ||
      filename.endsWith('.test.js') ||
      filename.endsWith('.test.ts') ||
      filename.endsWith('.spec.js') ||
      filename.endsWith('.spec.ts') ||
      content.includes('describe(') && content.includes('it(') && content.includes('expect(')
    ) {
      return 'test';
    }
    
    // Check if it's a documentation file
    if (
      extension === '.md' ||
      extension === '.txt' ||
      extension === '.doc' ||
      extension === '.pdf' ||
      filename === 'README.md' ||
      filename.includes('DOCUMENTATION')
    ) {
      return 'documentation';
    }
    
    // Check if it's a configuration file
    if (
      filename === 'package.json' ||
      filename === 'tsconfig.json' ||
      filename.endsWith('.config.js') ||
      filename.endsWith('.config.ts') ||
      extension === '.yml' ||
      extension === '.yaml' ||
      extension === '.toml' ||
      extension === '.ini'
    ) {
      return 'configuration';
    }
    
    // Check if it's a build file
    if (
      filename === 'Makefile' ||
      filename === 'Dockerfile' ||
      extension === '.sh' ||
      extension === '.bat' ||
      extension === '.cmd'
    ) {
      return 'build';
    }
    
    // Check if it's a source code file
    if (
      extension === '.js' ||
      extension === '.ts' ||
      extension === '.jsx' ||
      extension === '.tsx' ||
      extension === '.py' ||
      extension === '.java' ||
      extension === '.c' ||
      extension === '.cpp' ||
      extension === '.cs' ||
      extension === '.go' ||
      extension === '.rb' ||
      extension === '.php' ||
      extension === '.swift' ||
      extension === '.kt' ||
      extension === '.rs'
    ) {
      return 'source';
    }
    
    // Check if it's a style file
    if (
      extension === '.css' ||
      extension === '.scss' ||
      extension === '.less' ||
      extension === '.sass'
    ) {
      return 'style';
    }
    
    // Check if it's a template file
    if (
      extension === '.html' ||
      extension === '.ejs' ||
      extension === '.pug' ||
      extension === '.hbs'
    ) {
      return 'template';
    }
    
    // Default to 'other'
    return 'other';
  }
  
  /**
   * Check if a file should be excluded from analysis
   * @param filePath Path to check
   * @returns True if the file should be excluded
   */
  private shouldExcludeFile(filePath: string): boolean {
    return this.config.excludePatterns.some(pattern => filePath.includes(pattern));
  }
}