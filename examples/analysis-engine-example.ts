/**
 * Example for using the Analysis Engine
 * 
 * This example demonstrates how to use the Analysis Engine to analyze files
 * and associate them with tasks.
 */

import { AnalysisEngine } from '../core/daemon/analysis-engine.ts';
import { FileTrackingRepository } from '../core/repository/file-tracking.ts';
import { createDb } from '../db/init.ts';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

// Create a temporary file with task references
async function createTestFile(content: string, fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), fileName);
  await fs.writeFile(filePath, content);
  return filePath;
}

async function main() {
  // Initialize the database
  console.log(chalk.blue('Initializing database...'));
  const db = createDb();
  
  // Create a repository instance
  console.log(chalk.blue('Creating file tracking repository...'));
  const repository = new FileTrackingRepository(db);
  
  // Initialize the Analysis Engine
  console.log(chalk.blue('Initializing Analysis Engine...'));
  const analysisEngine = new AnalysisEngine(repository, {
    confidenceThreshold: 70,
    taskIdPattern: /(?:Task-|#)(\d+)/gi,
    fileExtensions: ['.ts', '.js', '.md', '.txt'],
    exclusionPatterns: ['node_modules', 'dist', '.git']
  });
  
  // Create a test file with task references
  const testFileContent = `
  /**
   * This file implements Task-123: Analysis Engine
   * 
   * The Analysis Engine analyzes file content to find task references.
   * It's related to #456 as well.
   */
  
  function analyzeContent() {
    // This tests functionality for Task-789
    console.log("Analyzing content...");
  }
  `;
  
  const testFilePath = await createTestFile(testFileContent, 'test-analysis.ts');
  
  console.log(chalk.green(`Created test file at ${testFilePath}`));
  
  try {
    // First, track the file in the repository
    const trackResult = await repository.trackFile(testFilePath);
    
    if (!trackResult.success) {
      console.error(chalk.red(`Error tracking file: ${trackResult.error?.message}`));
      return;
    }
    
    console.log(chalk.green(`File tracked with ID: ${trackResult.data.id}`));
    
    // Analyze the file
    console.log(chalk.blue('Analyzing file...'));
    const analysisResult = await analysisEngine.analyzeFileChange({
      type: 'change',
      path: testFilePath,
      timestamp: new Date()
    });
    
    if (!analysisResult) {
      console.log(chalk.yellow('No analysis results found'));
      return;
    }
    
    // Display the results
    console.log(chalk.green('Analysis complete!'));
    console.log(chalk.cyan('File:'), analysisResult.filePath);
    console.log(chalk.cyan('File Type:'), analysisResult.fileType);
    console.log(chalk.cyan('Task Matches:'));
    
    for (const match of analysisResult.taskMatches) {
      console.log(chalk.yellow(`  Task ${match.taskId}:`));
      console.log(`    Confidence: ${match.confidence}%`);
      console.log(`    Reason: ${match.matchReason}`);
      
      const relationship = analysisResult.suggestedRelationships.get(match.taskId);
      console.log(`    Relationship: ${relationship || 'related'}`);
      
      if (match.matchLocation) {
        console.log(`    Location: Line ${match.matchLocation.line}, Column ${match.matchLocation.column}`);
      }
      console.log();
    }
    
    // Associate the file with tasks
    console.log(chalk.blue('Associating file with tasks...'));
    const associationResult = await analysisEngine.associateFilesWithTasks(analysisResult);
    
    console.log(chalk.green(`Association success: ${associationResult}`));
    
    // Cleanup
    await fs.unlink(testFilePath);
    console.log(chalk.blue(`Removed test file ${testFilePath}`));
    
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  } finally {
    // Close database connection
    await db.close();
    console.log(chalk.blue('Database connection closed'));
  }
}

main().catch(console.error);