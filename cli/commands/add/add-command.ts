/**
 * Add command - CLI command for adding tasks
 * Provides a CLI interface for the add task command handler
 */

import { Command } from 'commander';
import readline from 'readline';
import chalk from 'chalk';
import { helpFormatter } from '../../helpers/help-formatter.js';
import { commandRegistry } from '../../../core/api/command.js';
import { CommandContext, InputSource, OutputMode } from '../../../core/api/context.js';
import { AddTaskParams } from '../../../core/api/handlers/task-add.js';
import { TaskInsertOptions, OutputFormat } from '../../../core/types.js';
import { TaskRepository } from '../../../core/repo.js';

/**
 * UI helper for displaying and handling similar tasks
 */
class SimilarTasksUI {
  private useColors: boolean;
  
  constructor(useColors: boolean = true) {
    this.useColors = useColors;
  }
  
  /**
   * Color helper function
   */
  colorize(text: string, color?: string, style?: string): string {
    if (!this.useColors) return text;
    
    let result = text;
    if (color && chalk[color]) {
      result = chalk[color](result);
    }
    if (style && chalk[style]) {
      result = chalk[style](result);
    }
    return result;
  }
  
  /**
   * Display a list of similar tasks
   */
  displaySimilarTasks(similarTasks: any[]): void {
    console.log(this.colorize(`\nPotential duplicates found:`, 'yellow', 'bold'));
    
    similarTasks.forEach((task, index) => {
      // Get similarity details
      const score = task.metadata?.similarityScore || 0;
      const percentage = Math.round(score * 100);
      
      // Generate visual similarity bar
      const barLength = Math.round(percentage / 4);
      const bar = '█'.repeat(barLength);
      
      // Determine color based on similarity
      let displayColor = 'yellow';
      let similarityText = 'Somewhat similar';
      
      if (score > 0.8) {
        displayColor = 'red';
        similarityText = 'HIGHLY SIMILAR';
      } else if (score > 0.6) {
        displayColor = 'yellow';
        similarityText = 'Very similar';
      } else if (score > 0.4) {
        displayColor = 'green';
        similarityText = 'Similar';
      }
      
      // Display with numbering for selection
      const selectionNumber = index + 1;
      
      console.log(this.colorize(`[${selectionNumber}] ${task.id}: `, 'blue', 'bold') + task.title);
      console.log(`   ${this.colorize('Similarity:', displayColor)} ${this.colorize(`${percentage}%`, displayColor)} ${this.colorize(bar, displayColor)} ${this.colorize(`(${similarityText})`, displayColor)}`);
      console.log(`   Status: ${task.status}, Readiness: ${task.readiness}, Tags: ${task.tags.join(', ') || 'none'}`);
      console.log(`   Created: ${new Date(task.createdAt).toLocaleString()}`);
      
      // Show additional notes based on similarity
      if (score > 0.8) {
        console.log(this.colorize('   Note: This task appears to be a duplicate', 'red'));
      }
      
      // Add separator between tasks
      if (index < similarTasks.length - 1) {
        console.log(this.colorize('   ----------------------------------------', 'gray'));
      }
    });
  }
  
  /**
   * Display action options when similar tasks are found
   */
  async promptForAction(): Promise<string> {
    // Show options for what to do
    console.log(this.colorize('\nWhat would you like to do?', 'blue', 'bold'));
    console.log(this.colorize('  a', 'green') + ') ' + this.colorize('Add anyway', 'white') + ' - Create a new task');
    console.log(this.colorize('  c', 'red') + ') ' + this.colorize('Cancel', 'white') + ' - Don\'t create a task');
    console.log(this.colorize('  u', 'yellow') + ') ' + this.colorize('Update', 'white') + ' - Modify an existing task instead');
    console.log(this.colorize('  m', 'magenta') + ') ' + this.colorize('Merge', 'white') + ' - Combine with an existing task');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>(resolve => {
      rl.question(this.colorize('\nChoose an option [a/c/u/m]: ', 'cyan'), resolve);
    });
    
    rl.close();
    return answer.toLowerCase();
  }
  
  /**
   * Prompt for task selection
   */
  async promptForTaskSelection(taskCount: number, operation: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const taskIdOrNumber = await new Promise<string>(resolve => {
      rl.question(
        this.colorize(`\nEnter task number [1-${taskCount}] or ID to ${operation}: `, 'cyan'), 
        resolve
      );
    });
    
    rl.close();
    return taskIdOrNumber;
  }
  
  /**
   * Display a merge preview
   */
  displayMergePreview(task: any, newOptions: any, combinedTags: string[]): void {
    console.log(this.colorize('\nMerge preview:', 'blue', 'bold'));
    console.log(this.colorize('Title: ', 'green') + task.title + ' (unchanged)');
    console.log(this.colorize('Tags: ', 'green') + combinedTags.join(', '));
    console.log(this.colorize('Status: ', 'green') + (newOptions.status || task.status) + 
                (newOptions.status ? this.colorize(' (updated)', 'yellow') : ' (unchanged)'));
    console.log(this.colorize('Readiness: ', 'green') + (newOptions.readiness || task.readiness) + 
                (newOptions.readiness ? this.colorize(' (updated)', 'yellow') : ' (unchanged)'));
  }
  
  /**
   * Confirm merge operation
   */
  async confirmMerge(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const mergeConfirm = await new Promise<string>(resolve => {
      rl.question(this.colorize('\nProceed with merge? [y/n]: ', 'cyan'), resolve);
    });
    
    rl.close();
    
    return mergeConfirm.toLowerCase() === 'y';
  }
  
  /**
   * Display task creation result
   */
  displayTaskResult(task: any, operation: string = 'created'): void {
    console.log(this.colorize(`\n✅ Task ${task.id} ${operation} successfully!`, 'green', 'bold'));
    console.log(`Title: ${task.title}`);
    console.log(`Status: ${task.status}`);
    console.log(`Readiness: ${task.readiness}`);
    
    if (task.tags && task.tags.length > 0) {
      console.log(`Tags: ${task.tags.join(', ')}`);
    }
    
    if (task.parentId) {
      console.log(`Parent: ${task.parentId}`);
    }
    
    if (task.metadata && Object.keys(task.metadata).length > 0) {
      console.log('Metadata:', JSON.stringify(task.metadata, null, 2));
    }
  }
  
  /**
   * Display dry run result
   */
  displayDryRunResult(title: string, noSimilarTasks: boolean = false): void {
    console.log(this.colorize('\n✅ Dry run complete - would create new task with title:', 'green'));
    console.log(`"${title}"`);
    
    if (noSimilarTasks) {
      console.log(this.colorize('No similar tasks found above threshold.', 'green'));
    }
  }
}

/**
 * Core add command functionality
 */
export class AddCommandHandler {
  private repo: TaskRepository;
  private ui: SimilarTasksUI;
  
  constructor(repo: TaskRepository, useColors: boolean = true) {
    this.repo = repo;
    this.ui = new SimilarTasksUI(useColors);
  }
  
  /**
   * Handle the add command action with NLP similarity detection
   */
  async handleAddCommand(options: any): Promise<any> {
    const format = options.format as OutputFormat;
    const dryRun = options.dryRun || false;
    const force = options.force || false;
    const useColors = options.color !== false;
    const similarityThreshold = parseFloat(options.similarityThreshold) / 100;
    
    // Validate threshold
    if (isNaN(similarityThreshold) || similarityThreshold < 0 || similarityThreshold > 1) {
      throw new Error('Invalid similarity threshold. Must be a number between 0 and 100.');
    }
    
    // Parse metadata if provided
    let metadata = undefined;
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata);
      } catch (e) {
        throw new Error(`Invalid JSON for metadata: ${e}`);
      }
    }
    
    // Check for similar tasks
    const similarTasks = await this.repo.findSimilarTasks(options.title);
    
    // Filter by threshold
    const filteredTasks = similarTasks.filter(task => {
      const score = task.metadata?.similarityScore || 0;
      return score >= similarityThreshold;
    });
    
    // Handle similar tasks with different behavior based on output format
    if (filteredTasks.length > 0) {
      if (format === 'json') {
        // In JSON mode, always show the similar tasks but don't prompt
        const result = {
          similarTasks: filteredTasks,
          message: 'Similar tasks found',
          requiresConfirmation: !force && !dryRun,
          threshold: similarityThreshold
        };
        
        console.log(JSON.stringify(result, null, 2));
        
        if (dryRun || !force) {
          return null; // Signal to stop processing
        }
      } else {
        // Display similar tasks with similarity score and visual bar
        this.ui.displaySimilarTasks(filteredTasks);
        
        // If in dry run mode, just show the similar tasks and exit
        if (dryRun) {
          this.ui.displayDryRunResult(options.title);
          return null;
        }
        
        // If force is enabled, skip the confirmation prompt
        if (!force) {
          // Ask for confirmation
          const response = await this.ui.promptForAction();
          
          if (response === 'c') {
            console.log(this.ui.colorize('Task creation cancelled', 'yellow'));
            return null;
          } else if (response === 'u' || response === 'm') {
            const isMerge = response === 'm';
            
            // Ask which task to update/merge with
            const taskIdOrNumber = await this.ui.promptForTaskSelection(
              filteredTasks.length, 
              isMerge ? 'merge with' : 'update'
            );
            
            // Find the task by number or ID
            let taskToUpdate;
            
            // Check if the input is a number within range
            const taskNum = parseInt(taskIdOrNumber);
            if (!isNaN(taskNum) && taskNum > 0 && taskNum <= filteredTasks.length) {
              taskToUpdate = filteredTasks[taskNum - 1];
            } else {
              // Try to find by ID
              taskToUpdate = filteredTasks.find(t => t.id === taskIdOrNumber);
            }
            
            if (!taskToUpdate) {
              throw new Error(`Task with ID/number ${taskIdOrNumber} not found in similar tasks`);
            }
            
            if (isMerge) {
              // Merge operation - combine tags, keep latest status, update description
              console.log(this.ui.colorize(`\nMerging with task ${taskToUpdate.id}...`, 'magenta'));
              
              // Combine tags (unique)
              const combinedTags = [...new Set([
                ...(taskToUpdate.tags || []),
                ...(options.tags || [])
              ])];
              
              // Merge metadata - prefer existing for conflicts
              const mergedMetadata = {
                ...metadata,
                ...taskToUpdate.metadata,
                mergedFrom: options.title,
                mergedAt: new Date().toISOString()
              };
              
              // Show merge preview
              this.ui.displayMergePreview(taskToUpdate, options, combinedTags);
              
              // Ask for confirmation
              const shouldProceed = await this.ui.confirmMerge();
              
              if (!shouldProceed) {
                console.log(this.ui.colorize('Merge cancelled', 'yellow'));
                return null;
              }
              
              // Update the existing task
              const updateResult = await this.repo.updateTask({
                id: taskToUpdate.id,
                status: options.status || taskToUpdate.status,
                readiness: options.readiness || taskToUpdate.readiness,
                tags: combinedTags,
                metadata: mergedMetadata
              });
              
              this.ui.displayTaskResult(updateResult, 'merged');
              return updateResult;
            } else {
              // Update operation - just update the existing task
              console.log(this.ui.colorize(`\nUpdating task ${taskToUpdate.id}...`, 'yellow'));
              
              // Update the existing task
              const updateResult = await this.repo.updateTask({
                id: taskToUpdate.id,
                title: options.title,
                status: options.status,
                readiness: options.readiness,
                tags: options.tags,
                metadata
              });
              
              this.ui.displayTaskResult(updateResult, 'updated');
              return updateResult;
            }
          }
          // If 'a' or anything else, continue with task creation
        }
      }
    }
    
    // Skip task creation in dry run mode
    if (dryRun) {
      this.ui.displayDryRunResult(options.title, true);
      return null;
    }
    
    // Create task options
    const taskOptions: TaskInsertOptions = {
      title: options.title,
      status: options.status,
      readiness: options.readiness,
      tags: options.tags,
      childOf: options.childOf,
      after: options.after,
      metadata
    };
    
    // Create the task
    const task = await this.repo.createTask(taskOptions);
    
    // Display results based on output format
    if (format === 'json') {
      console.log(JSON.stringify(task, null, 2));
    } else {
      this.ui.displayTaskResult(task);
    }
    
    return task;
  }
}

/**
 * Create the add command for the CLI
 */
export function createAddCommand() {
  const addCommand = new Command('add')
    .description('Add a new task')
    .requiredOption('--title <string>', 'Task title')
    .option('--child-of <id>', 'Make this task a child of the specified task ID')
    .option('--after <id>', 'Add this task after the specified task ID')
    .option('--status <status>', 'Task status (todo, in-progress, done)')
    .option('--readiness <readiness>', 'Task readiness (draft, ready, blocked)')
    .option('--tags <tags...>', 'Task tags')
    .option('--metadata <json>', 'JSON string with task metadata')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--force', 'Skip similarity check and confirmation')
    .option('--dry-run', 'Check for similarities without creating the task')
    .option('--no-color', 'Disable colored output')
    .option('--similarity-threshold <number>', 'Similarity threshold (0-100)', '30');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(addCommand, {
    description: 'Add a new task to your task list with title, status, tags, and optional hierarchical positioning. Includes automatic duplicate detection using NLP similarity matching.',
    examples: [
      {
        command: 'tm add --title "Implement login form"',
        description: 'Add a basic task with just a title'
      },
      {
        command: 'tm add --title "Add validation" --child-of 3',
        description: 'Add a subtask under task with ID 3'
      },
      {
        command: 'tm add --title "Fix navbar styling" --tags UI bugfix --status in-progress',
        description: 'Add a task with tags and status'
      },
      {
        command: 'tm add --title "Refactor auth module" --dry-run',
        description: 'Check for similar tasks without creating a new one'
      },
      {
        command: 'tm add --title "Setup API" --similarity-threshold 50',
        description: 'Set a higher threshold (50%) for duplicate detection'
      }
    ],
    notes: [
      'Smart duplicate detection prevents creating similar tasks accidentally',
      'The --force flag will bypass duplicate detection and confirmation prompts',
      'Use --dry-run to check for duplicates without creating a task',
      'The --similarity-threshold option (0-100) controls sensitivity of duplicate detection',
      'You can update an existing task instead of creating a new one when duplicates are found',
      'Use --metadata to store structured data as a JSON string'
    ],
    seeAlso: ['update', 'remove', 'show', 'search --similar']
  });
  
  // Execute the command using the command handler
  addCommand.action(async (options) => {
    try {
      // Option 1: Use the CommandRegistry and API architecture
      if (commandRegistry.has('add')) {
        // Create context for command execution
        const context = new CommandContext('./db/taskmaster.db', {
          output: options.format === 'json' ? OutputMode.Json : OutputMode.Console,
          source: InputSource.Cli,
          dryRun: options.dryRun
        });
        
        // Prepare parameters for the command handler
        const params: AddTaskParams = {
          title: options.title,
          childOf: options.childOf,
          status: options.status,
          readiness: options.readiness,
          tags: options.tags,
          metadata: options.metadata
        };
        
        // Add CLI-specific options
        const cliOptions = {
          force: options.force,
          similarityThreshold: options.similarityThreshold,
          color: options.color
        };
        
        // Merge parameters for command execution
        const commandParams = { ...params, ...cliOptions };
        
        // Execute the command through the registry
        const handler = commandRegistry.get('add');
        await handler.execute(context, commandParams);
        
        // Clean up
        context.close();
      } 
      // Option 2: Direct implementation (fallback)
      else {
        const repo = new TaskRepository();
        const handler = new AddCommandHandler(repo, options.color !== false);
        
        try {
          await handler.handleAddCommand(options);
        } finally {
          repo.close();
        }
      }
    } catch (error) {
      console.error('Error adding task:', error);
      process.exit(1);
    }
  });
  
  return addCommand;
}