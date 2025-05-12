/**
 * Analysis Engine for Task-Code Relationship Tracking
 * Implements Task 17.5: Analysis Engine for relating file changes to tasks
 * 
 * This module provides advanced analysis of file content and changes,
 * relating them to tasks in the system.
 */

import fs from 'fs/promises';
import path from 'path';
import { FileChangeEvent } from './file-tracking-daemon.ts';
import { Task } from '../types.ts';
import { FileTrackingRepository } from '../repository/file-tracking.ts';
import { createLogger } from '../utils/logger.ts';

// Create logger for analysis engine
const logger = createLogger('AnalysisEngine');

/**
 * Analysis configuration options
 */
export interface AnalysisEngineConfig {
  // Minimum confidence threshold (0-100) for automatic task associations
  confidenceThreshold: number;
  
  // Maximum number of task associations to create per file
  maxTaskAssociations: number;
  
  // Whether to look for task IDs in commit messages
  useCommitHistory: boolean;
  
  // Whether to use NLP for content analysis
  useNlpAnalysis: boolean;
  
  // Extensions to analyze in-depth (e.g., ['.js', '.ts', '.md'])
  inDepthExtensions: string[];
}

/**
 * Default analysis configuration
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisEngineConfig = {
  confidenceThreshold: 70,
  maxTaskAssociations: 5,
  useCommitHistory: true,
  useNlpAnalysis: true,
  inDepthExtensions: ['.js', '.ts', '.tsx', '.jsx', '.md', '.txt']
};

/**
 * Result of file content analysis
 */
export interface FileAnalysisResult {
  // File path that was analyzed
  filePath: string;
  
  // Task IDs found in the file with confidence scores
  taskMatches: Array<{
    taskId: string;
    confidence: number;
    matchReason: string;
    matchLocation?: { line: number; column: number };
  }>;
  
  // Type of file based on content analysis
  fileType: 'code' | 'test' | 'documentation' | 'build' | 'config' | 'other';
  
  // Suggested relationship type for each task match
  suggestedRelationships: Map<string, 'implements' | 'tests' | 'documents' | 'related'>;
}

/**
 * Analysis Engine for Task-Code Relationships
 * 
 * This class provides advanced analysis of file content and changes,
 * relating them to tasks in the system.
 */
export class AnalysisEngine {
  private config: AnalysisEngineConfig;
  private repository: FileTrackingRepository;
  
  /**
   * Create a new analysis engine
   * @param repository Repository for task-file operations
   * @param config Analysis configuration
   */
  constructor(repository: FileTrackingRepository, config: Partial<AnalysisEngineConfig> = {}) {
    this.repository = repository;
    this.config = {
      ...DEFAULT_ANALYSIS_CONFIG,
      ...config
    };
    
    logger.debug('Analysis engine initialized', { 
      confidenceThreshold: this.config.confidenceThreshold,
      maxTaskAssociations: this.config.maxTaskAssociations 
    });
  }
  
  /**
   * Analyze a file change event and find related tasks
   * @param event File change event to analyze
   * @returns Analysis results with task matches
   */
  async analyzeFileChange(event: FileChangeEvent): Promise<FileAnalysisResult | null> {
    // Skip analysis for deleted or unlinked files
    if (event.type === 'deleted' || event.type === 'unlink') {
      return null;
    }

    // Check if file should be excluded based on path patterns
    if (this.shouldExcludeFile(event.path)) {
      return null;
    }

    try {
      // Read file content for analysis
      const content = await fs.readFile(event.path, 'utf-8');

      // Get file extension for type-specific analysis
      const extension = path.extname(event.path).toLowerCase();

      // Check if file should be excluded based on extension (if a whitelist is provided)
      if (this.config.inDepthExtensions.length > 0 && !this.config.inDepthExtensions.includes(extension)) {
        return null;
      }

      // Determine if this file requires in-depth analysis
      const needsInDepthAnalysis = this.config.inDepthExtensions.includes(extension);
      
      // Perform basic task ID extraction for all files
      const taskMatches = this.extractTaskMatches(content, event.path);
      
      // Get file type based on extension and content
      const fileType = this.determineFileType(event.path, extension, content);
      
      // Determine relationship types based on file type
      const suggestedRelationships = new Map<string, 'implements' | 'tests' | 'documents' | 'related'>();
      
      // Suggest relationship types based on file type
      for (const match of taskMatches) {
        let relationshipType: 'implements' | 'tests' | 'documents' | 'related' = 'related';
        
        switch (fileType) {
          case 'code':
            relationshipType = 'implements';
            break;
          case 'test':
            relationshipType = 'tests';
            break;
          case 'documentation':
            relationshipType = 'documents';
            break;
          default:
            relationshipType = 'related';
        }
        
        suggestedRelationships.set(match.taskId, relationshipType);
      }
      
      // If enabled, perform additional NLP analysis for better matching
      if (needsInDepthAnalysis && this.config.useNlpAnalysis) {
        await this.enhanceAnalysisWithNlp(taskMatches, content, event.path);
      }
      
      // Filter matches based on confidence threshold
      const filteredMatches = taskMatches.filter(
        match => match.confidence >= this.config.confidenceThreshold
      );
      
      // Sort by confidence (descending) and limit to max associations
      const limitedMatches = filteredMatches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.config.maxTaskAssociations);
      
      const result: FileAnalysisResult = {
        filePath: event.path,
        taskMatches: limitedMatches,
        fileType,
        suggestedRelationships
      };
      
      return result;
    } catch (error) {
      logger.error(`Error analyzing file ${event.path}:`, error);
      return null;
    }
  }
  
  /**
   * Extract task IDs and calculate match confidence from file content
   * @param content File content to analyze
   * @param filePath Path of the file for context
   * @returns Array of task matches with confidence scores
   */
  private extractTaskMatches(content: string, filePath: string): Array<{
    taskId: string;
    confidence: number;
    matchReason: string;
    matchLocation?: { line: number; column: number };
  }> {
    const matches: Array<{
      taskId: string;
      confidence: number;
      matchReason: string;
      matchLocation?: { line: number; column: number };
    }> = [];
    
    // Helper to add a match only if it doesn't already exist
    const addMatch = (
      taskId: string, 
      confidence: number, 
      reason: string,
      location?: { line: number; column: number }
    ) => {
      const existingMatch = matches.find(m => m.taskId === taskId);
      
      if (existingMatch) {
        // Update existing match if new confidence is higher
        if (confidence > existingMatch.confidence) {
          existingMatch.confidence = confidence;
          existingMatch.matchReason = reason;
          if (location) {
            existingMatch.matchLocation = location;
          }
        }
      } else {
        // Add new match
        matches.push({
          taskId,
          confidence,
          matchReason: reason,
          matchLocation: location
        });
      }
    };
    
    // Extract task IDs from file content using various patterns
    
    // Pattern 1: Task-123 or Task 123 format with high confidence
    const taskIdRegex = /Task[- _](\d+(?:\.\d+)*)/gi;
    let match: RegExpExecArray | null;
    
    // Track line and column for each match
    const lines = content.split('\n');
    let lineIndex = 0;
    
    for (const line of lines) {
      let taskRegex = new RegExp(taskIdRegex);
      let taskMatch: RegExpExecArray | null;
      
      // Reset regex state for each line
      while ((taskMatch = taskRegex.exec(line)) !== null) {
        const taskId = taskMatch[1];
        const columnIndex = taskMatch.index;
        
        addMatch(taskId, 90, `Direct task reference (Task-${taskId})`, {
          line: lineIndex + 1,
          column: columnIndex + 1
        });
      }
      
      lineIndex++;
    }
    
    // Pattern 2: #123 format with moderate confidence
    const hashRegex = /#(\d+(?:\.\d+)*)\b/g;
    let hashMatch: RegExpExecArray | null;
    
    // Reset line index for new pattern
    lineIndex = 0;
    
    for (const line of lines) {
      let regex = new RegExp(hashRegex);
      let match: RegExpExecArray | null;
      
      while ((match = regex.exec(line)) !== null) {
        const taskId = match[1];
        const columnIndex = match.index;
        
        addMatch(taskId, 75, `Hash reference (#${taskId})`, {
          line: lineIndex + 1,
          column: columnIndex + 1
        });
      }
      
      lineIndex++;
    }
    
    // Pattern 3: File name contains task ID
    const filename = path.basename(filePath);
    const filenameMatch = filename.match(/task[- _]?(\d+(?:\.\d+)*)/i);
    
    if (filenameMatch && filenameMatch[1]) {
      addMatch(filenameMatch[1], 85, `Filename contains task ID (${filename})`);
    }
    
    // Pattern 4: Directory name contains task ID
    const dirname = path.dirname(filePath);
    const dirnameMatch = dirname.match(/task[- _]?(\d+(?:\.\d+)*)/i);
    
    if (dirnameMatch && dirnameMatch[1]) {
      addMatch(dirnameMatch[1], 70, `Directory contains task ID (${dirname})`);
    }
    
    return matches;
  }
  
  /**
   * Enhance analysis results using NLP techniques
   * This is a more sophisticated analysis for better task matching
   * @param matches Existing task matches to enhance
   * @param content File content
   * @param filePath File path
   */
  private async enhanceAnalysisWithNlp(
    matches: Array<{
      taskId: string;
      confidence: number;
      matchReason: string;
      matchLocation?: { line: number; column: number };
    }>,
    content: string,
    filePath: string
  ): Promise<void> {
    try {
      // Get existing task IDs from matches
      const taskIds = matches.map(match => match.taskId);
      
      // If we have task IDs, fetch their details for content comparison
      if (taskIds.length > 0) {
        // For each task ID, fetch task details
        for (const taskId of taskIds) {
          const taskResult = await this.repository._db.query('SELECT title, description FROM tasks WHERE id = ?', [taskId]);
          
          if (taskResult && taskResult.length > 0) {
            const task = taskResult[0];
            
            // Calculate similarity between task title/description and file content
            // This is a simplified version - a real implementation would use more
            // sophisticated NLP algorithms like TF-IDF, word embeddings, etc.
            
            // Check if title words appear in content
            if (task.title) {
              const titleWords = task.title.toLowerCase().split(/\s+/);
              const titleMatchCount = titleWords.filter(word => 
                content.toLowerCase().includes(word) && word.length > 3
              ).length;
              
              const titleMatchRatio = titleMatchCount / Math.max(1, titleWords.length);
              
              // Find the existing match
              const match = matches.find(m => m.taskId === taskId);
              if (match) {
                // Enhance confidence based on title match
                if (titleMatchRatio > 0.5) {
                  match.confidence = Math.min(100, match.confidence + 10);
                  match.matchReason += `, Title match (${Math.round(titleMatchRatio * 100)}%)`;
                }
              }
            }
            
            // Check if description content appears in file
            if (task.description) {
              const descriptionWords = task.description.toLowerCase().split(/\s+/);
              const descriptionMatchCount = descriptionWords.filter(word => 
                content.toLowerCase().includes(word) && word.length > 3
              ).length;
              
              const descriptionMatchRatio = descriptionMatchCount / Math.max(1, descriptionWords.length);
              
              // Find the existing match
              const match = matches.find(m => m.taskId === taskId);
              if (match) {
                // Enhance confidence based on description match
                if (descriptionMatchRatio > 0.3) {
                  match.confidence = Math.min(100, match.confidence + 5);
                  match.matchReason += `, Description match (${Math.round(descriptionMatchRatio * 100)}%)`;
                }
              }
            }
          }
        }
      }
      
      // Add heuristics for finding new tasks that might be related based on content similarity
      // This would typically use a more advanced NLP approach, such as embedding-based similarity
      
      // For simplicity, we're just checking for potential task-related keywords
      const taskRelatedKeywords = [
        'implement', 'fix', 'feature', 'bug', 'issue', 'task',
        'todo', 'refactor', 'enhance', 'optimize'
      ];
      
      // Count occurrences of task-related keywords
      const keywordCount = taskRelatedKeywords.reduce((count, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      
      // If we find many task-related keywords but no direct task references,
      // this file might be implementing a task that's not explicitly mentioned
      if (keywordCount > 5 && matches.length === 0) {
        logger.debug(`Found ${keywordCount} task-related keywords in ${filePath}, but no direct task references`);
        
        // In a more sophisticated implementation, we would search for similar tasks
        // based on content and suggest them as potential matches
      }
    } catch (error) {
      logger.error(`Error enhancing analysis with NLP for ${filePath}:`, error);
    }
  }
  
  /**
   * Determine the type of file based on extension and content
   * @param filePath File path
   * @param extension File extension
   * @param content File content
   * @returns File type classification
   */
  private determineFileType(
    filePath: string,
    extension: string,
    content: string
  ): 'code' | 'test' | 'documentation' | 'build' | 'config' | 'other' {
    const filename = path.basename(filePath);
    
    // Check for test files
    if (
      filename.includes('.test.') ||
      filename.includes('.spec.') ||
      filename.includes('Test') ||
      filename.startsWith('test') ||
      content.includes('describe(') && content.includes('it(') && content.includes('expect(')
    ) {
      return 'test';
    }
    
    // Check for documentation files
    if (
      extension === '.md' ||
      extension === '.txt' ||
      extension === '.doc' ||
      extension === '.pdf' ||
      filename.includes('README') ||
      filename.includes('DOCUMENTATION')
    ) {
      return 'documentation';
    }
    
    // Check for build files
    if (
      extension === '.json' && (
        filename.includes('package.json') ||
        filename.includes('tsconfig.json') ||
        filename.includes('webpack')
      ) ||
      filename.endsWith('.config.js') ||
      filename.endsWith('.config.ts')
    ) {
      return 'config';
    }
    
    // Check for other build files
    if (
      extension === '.sh' ||
      extension === '.bat' ||
      extension === '.cmd' ||
      filename.includes('Makefile') ||
      filename.includes('Dockerfile')
    ) {
      return 'build';
    }
    
    // Check for code files
    if (
      extension === '.js' ||
      extension === '.ts' ||
      extension === '.jsx' ||
      extension === '.tsx' ||
      extension === '.vue' ||
      extension === '.py' ||
      extension === '.java' ||
      extension === '.c' ||
      extension === '.cpp' ||
      extension === '.go' ||
      extension === '.rb'
    ) {
      return 'code';
    }
    
    // Default to other
    return 'other';
  }
  
  /**
   * Checks if a file should be excluded from analysis based on its path
   * @param filePath Path to the file to check
   * @returns True if the file should be excluded, false otherwise
   */
  private shouldExcludeFile(filePath: string): boolean {
    // Check if there are exclusion patterns
    if (!this.config.exclusionPatterns || !Array.isArray(this.config.exclusionPatterns)) {
      return false;
    }

    // Check if file path matches any exclusion pattern
    return this.config.exclusionPatterns.some(pattern => filePath.includes(pattern));
  }

  /**
   * Associate a file with tasks based on analysis results
   * @param result Analysis result containing task matches
   * @returns Success status with association details
   */
  async associateFilesWithTasks(result: FileAnalysisResult): Promise<boolean> {
    if (!result || result.taskMatches.length === 0) {
      return false;
    }
    
    try {
      // For each task match, create an association
      for (const match of result.taskMatches) {
        // Skip if confidence is below threshold
        if (match.confidence < this.config.confidenceThreshold) {
          continue;
        }
        
        // Get the suggested relationship type
        const relationshipType = result.suggestedRelationships.get(match.taskId) || 'related';
        
        // Associate file with task
        const associationResult = await this.repository.associateFileWithTask(
          match.taskId,
          result.filePath,
          relationshipType,
          match.confidence
        );
        
        if (!associationResult.success) {
          logger.error(`Failed to associate file ${result.filePath} with task ${match.taskId}:`, 
            associationResult.error);
        } else {
          logger.debug(`Associated file ${result.filePath} with task ${match.taskId} (${relationshipType}, ${match.confidence}%)`);
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error associating file ${result.filePath} with tasks:`, error);
      return false;
    }
  }
  
  /**
   * Process a batch of file changes and create task associations
   * @param events Array of file change events to process
   * @returns Number of successful associations made
   */
  async processBatchFileChanges(events: FileChangeEvent[]): Promise<number> {
    let associationCount = 0;
    
    // Process each file change event
    for (const event of events) {
      try {
        // Skip deleted files
        if (event.type === 'deleted') {
          continue;
        }
        
        // Analyze the file
        const analysisResult = await this.analyzeFileChange(event);
        
        if (analysisResult && analysisResult.taskMatches.length > 0) {
          // Associate files with tasks
          const success = await this.associateFilesWithTasks(analysisResult);
          
          if (success) {
            associationCount += analysisResult.taskMatches.length;
          }
        }
      } catch (error) {
        logger.error(`Error processing file change for ${event.path}:`, error);
      }
    }
    
    return associationCount;
  }
}