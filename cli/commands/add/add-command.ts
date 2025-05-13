import { ChalkColor, asChalkColor, ChalkStyle } from '@/cli/utils/chalk-utils';
import { createColorize } from '@/cli/utils/chalk-utils';
/**
 * Add command - CLI command for adding tasks
 * Provides a CLI interface for the add task command handler
 */
import { Command } from 'commander';
import readline from 'readline';
import { helpFormatter } from '../../helpers/help-formatter';
import { commandRegistry } from '../../../core/api/command';
import { CommandContext, InputSource, OutputMode } from '../../../core/api/context';
import { AddTaskParams } from '../../../core/api/handlers/task-add';
import { TaskInsertOptions, OutputFormat } from '../../../core/types';
import { TaskRepository } from '../../../core/repo';
import { InteractiveTaskForm } from './interactive-form';
/**
 * UI helper for displaying and handling similar tasks
 */
class SimilarTasksUI {
    public colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
    constructor(useColors: boolean = true) {
        this.colorize = createColorize(useColors);
    }
    /**
     * Display a list of similar tasks
     */
    displaySimilarTasks(similarTasks: any[]): void {
        console.log(this.colorize(`\nPotential duplicates found:`, asChalkColor(1), 'bold'));
        similarTasks.forEach((task, index) => {
            // Get similarity details
            const score = task.metadata?.similarityScore || 0;
            const percentage = Math.round(score * 100);
            // Generate visual similarity bar
            const barLength = Math.round(percentage / 4);
            const bar = '█'.repeat(barLength);
            // Determine color based on similarity
            let displayColor = (asChalkColor(1));
            let similarityText = 'Somewhat similar';
            if (score > 0.8) {
                displayColor = (asChalkColor(1));
                similarityText = 'HIGHLY SIMILAR';
            }
            else if (score > 0.6) {
                displayColor = (asChalkColor(1));
                similarityText = 'Very similar';
            }
            else if (score > 0.4) {
                displayColor = (asChalkColor(1));
                similarityText = 'Similar';
            }
            // Display with numbering for selection
            const selectionNumber = index + 1;
            console.log(this.colorize(`[${selectionNumber}] ${task.id}: `, asChalkColor(1), 'bold') + task.title);
            console.log(`   ${this.colorize('Similarity:', displayColor)} ${this.colorize(`${percentage}%`, displayColor)} ${this.colorize(bar, displayColor)} ${this.colorize(`(${similarityText})`, displayColor)}`);
            console.log(`   Status: ${task.status}, Readiness: ${task.readiness}, Tags: ${task.tags?.join(', ') || 'none'}`);
            console.log(`   Created: ${new Date(task.createdAt).toLocaleString()}`);
            // Show additional notes based on similarity
            if (score > 0.8) {
                console.log(this.colorize('   Note: This task appears to be a duplicate', asChalkColor(1)));
            }
            // Add separator between tasks
            if (index < similarTasks.length - 1) {
                console.log(this.colorize('   ----------------------------------------', asChalkColor(1)));
            }
        });
    }
    /**
     * Display action options when similar tasks are found
     */
    async promptForAction(): Promise<string> {
        // Show options for what to do
        console.log(this.colorize('\nWhat would you like to do?', asChalkColor(1), 'bold'));
        console.log(this.colorize('  a', asChalkColor(1)) + ') ' + this.colorize('Add anyway', asChalkColor(1)) + ' - Create a new task');
        console.log(this.colorize('  c', asChalkColor(1)) + ') ' + this.colorize('Cancel', asChalkColor(1)) + ' - Don\'t create a task');
        console.log(this.colorize('  u', asChalkColor(1)) + ') ' + this.colorize('Update', asChalkColor(1)) + ' - Modify an existing task instead');
        console.log(this.colorize('  m', asChalkColor(1)) + ') ' + this.colorize('Merge', asChalkColor(1)) + ' - Combine with an existing task');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const answer = await new Promise<string>(resolve => {
            rl.question(this.colorize('\nChoose an option [a/c/u/m]: ', asChalkColor(1)), resolve);
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
            rl.question(this.colorize(`\nEnter task number [1-${taskCount}] or ID to ${operation}: `, asChalkColor(1)), resolve);
        });
        rl.close();
        return taskIdOrNumber;
    }
    /**
     * Display a merge preview
     */
    displayMergePreview(task: any, newOptions: any, combinedTags: string[]): void {
        console.log(this.colorize('\nMerge preview:', asChalkColor(1), 'bold'));
        console.log(this.colorize('Title: ', asChalkColor(1)) + task.title + ' (unchanged)');
        console.log(this.colorize('Tags: ', asChalkColor(1)) + combinedTags.join(', '));
        console.log(this.colorize('Status: ', asChalkColor(1)) + (newOptions.status || task.status) +
            (newOptions.status ? this.colorize(' (updated)', asChalkColor(1)) : ' (unchanged)'));
        console.log(this.colorize('Readiness: ', asChalkColor(1)) + (newOptions.readiness || task.readiness) +
            (newOptions.readiness ? this.colorize(' (updated)', asChalkColor(1)) : ' (unchanged)'));
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
            rl.question(this.colorize('\nProceed with merge? [y/n]: ', asChalkColor(1)), resolve);
        });
        rl.close();
        return mergeConfirm.toLowerCase() === 'y';
    }
    /**
     * Display task creation result
     */
    displayTaskResult(task: any, operation: string = 'created'): void {
        console.log(this.colorize(`\n✅ Task ${task.id} ${operation} successfully!`, asChalkColor(1), 'bold'));
        console.log(this.colorize(`${task.title}`, asChalkColor(1), 'bold'));
        if (task.description !== undefined && task.description !== null) {
            console.log(`\n${this.colorize('Description:', asChalkColor(1))} ${task.description}`);
        }
        if (task.body !== undefined && task.body !== null) {
            console.log(`\n${this.colorize('Details:', asChalkColor(1))}\n${task.body}`);
        }
        console.log(`\n${this.colorize('Status:', asChalkColor(1))} ${task.status}`);
        console.log(`${this.colorize('Readiness:', asChalkColor(1))} ${task.readiness}`);
        if (task.tags && task.tags.length > 0) {
            console.log(`${this.colorize('Tags:', asChalkColor(1))} ${task.tags.map((tag: string) => this.colorize(`#${tag}`, asChalkColor(1))).join(' ')}`);
        }
        if (task.parentId) {
            console.log(`${this.colorize('Parent:', asChalkColor(1))} ${task.parentId}`);
        }
        console.log(`\n${this.colorize('Created:', asChalkColor(1))} ${new Date(task.createdAt).toLocaleString()}`);
        console.log(`${this.colorize('Updated:', asChalkColor(1))} ${new Date(task.updatedAt).toLocaleString()}`);
        if (task.metadata && Object.keys(task.metadata).length > 0) {
            console.log(`\n${this.colorize('Metadata:', asChalkColor(1))}\n${JSON.stringify(task.metadata, null, 2)}`);
        }
    }
    /**
     * Display dry run result
     */
    displayDryRunResult(title: string, noSimilarTasks: boolean = false): void {
        console.log(this.colorize('\n✅ Dry run complete - would create new task with title:', asChalkColor(1)));
        console.log(`"${title}"`);
        if (noSimilarTasks) {
            console.log(this.colorize('No similar tasks found above threshold.', asChalkColor(1)));
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
            }
            catch (e) {
                throw new Error(`Invalid JSON for metadata: ${e}`);
            }
        }
        // Check for similar tasks
        const similarTasksResult = await this.repo.findSimilarTasks(options.title);
        // Handle result from new TaskOperationResult pattern
        let similarTasks: Array<any> = [];
        if (similarTasksResult?.success && similarTasksResult?.data) {
            similarTasks = similarTasksResult?.data;
        }
        else {
            console.warn("Warning: Could not check for similar tasks");
        }
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
            }
            else {
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
                        console.log(this.ui.colorize('Task creation cancelled', asChalkColor(1)));
                        return null;
                    }
                    else if (response === 'u' || response === 'm') {
                        const isMerge = response === 'm';
                        // Ask which task to update/merge with
                        const taskIdOrNumber = await this.ui.promptForTaskSelection(filteredTasks.length, isMerge ? 'merge with' : 'update');
                        // Find the task by number or ID
                        let taskToUpdate;
                        // Check if the input is a number within range
                        const taskNum = parseInt(taskIdOrNumber);
                        if (!isNaN(taskNum) && taskNum > 0 && taskNum <= filteredTasks.length) {
                            taskToUpdate = filteredTasks[taskNum - 1];
                        }
                        else {
                            // Try to find by ID
                            taskToUpdate = filteredTasks.find(t => t.id === taskIdOrNumber);
                        }
                        if (!taskToUpdate) {
                            throw new Error(`Task with ID/number ${taskIdOrNumber} not found in similar tasks`);
                        }
                        if (isMerge) {
                            // Merge operation - combine tags, keep latest status, update description
                            console.log(this.ui.colorize(`\nMerging with task ${taskToUpdate.id}...`, asChalkColor(1)));
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
                                console.log(this.ui.colorize('Merge cancelled', asChalkColor(1)));
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
                            // Handle result from new TaskOperationResult pattern
                            if (!updateResult?.success || !updateResult?.data) {
                                throw new Error(`Failed to merge task: ${updateResult?.error?.message || 'Unknown error'}`);
                            }
                            this.ui.displayTaskResult(updateResult?.data, 'merged');
                            return updateResult?.data;
                        }
                        else {
                            // Update operation - just update the existing task
                            console.log(this.ui.colorize(`\nUpdating task ${taskToUpdate.id}...`, asChalkColor(1)));
                            // Update the existing task
                            const updateResult = await this.repo.updateTask({
                                id: taskToUpdate.id,
                                title: options.title,
                                status: options.status,
                                readiness: options.readiness,
                                tags: options.tags,
                                metadata
                            });
                            // Handle result from new TaskOperationResult pattern
                            if (!updateResult?.success || !updateResult?.data) {
                                throw new Error(`Failed to update task: ${updateResult?.error?.message || 'Unknown error'}`);
                            }
                            this.ui.displayTaskResult(updateResult?.data, 'updated');
                            return updateResult?.data;
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
            description: options.description,
            body: options.body,
            status: options.status,
            readiness: options.readiness,
            tags: options.tags,
            childOf: options.childOf,
            after: options.after,
            metadata
        };
        // Create the task
        const taskResult = await this.repo.createTask(taskOptions);
        // Handle result from new TaskOperationResult pattern
        if (!taskResult?.success || !taskResult?.data) {
            throw new Error(`Failed to create task: ${taskResult?.error?.message || 'Unknown error'}`);
        }
        const task = taskResult?.data;
        // Handle DoD options
        if (options.dod !== undefined) {
            try {
                const { DoDManager } = await import('../../../core/dod/manager');
                const dodManager = new DoDManager();
                // Set DoD enabled state based on options
                if (options.dod === false) {
                    // User explicitly disabled DoD with --no-dod
                    await dodManager.setTaskDoDEnabled(task.id, false);
                }
                else {
                    // Enable DoD and add items if provided
                    await dodManager.setTaskDoDEnabled(task.id, true);
                    // Add DoD items if specified
                    if (Array.isArray(options.dod) && options.dod.length > 0) {
                        for (const item of options.dod) {
                            await dodManager.addTaskDoDItem(task.id, item);
                        }
                    }
                }
            }
            catch (error) {
                console?.error('Warning: Failed to set up Definition of Done:', error);
            }
        }
        // Display results based on output format
        if (format === 'json') {
            console.log(JSON.stringify(task, null, 2));
        }
        else {
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
        .option('--description <string>', 'Short description of the task')
        .option('--body <string>', 'Detailed task body/content')
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
        .option('--interactive', 'Use interactive mode for task creation')
        .option('--similarity-threshold <number>', 'Similarity threshold (0-100)', '30')
        .option('--dod <items...>', 'Definition of Done items to add to the task')
        .option('--no-dod', 'Disable Definition of Done for this task');
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
            // Check if interactive mode is enabled
            if (options.interactive) {
                // Use the interactive form
                const form = new InteractiveTaskForm(options.color !== false);
                const taskOptions = await form.run();
                // If the user cancelled, exit without creating a task
                if (!taskOptions) {
                    return;
                }
                // Merge form input with command line options (form takes precedence)
                const mergedOptions = {
                    ...options,
                    ...taskOptions,
                    // These flags should always come from command line
                    format: options.format,
                    force: options.force,
                    dryRun: options.dryRun,
                    color: options.color,
                    similarityThreshold: options.similarityThreshold
                };
                // Proceed with task creation using the merged options
                const repo = new TaskRepository();
                const handler = new AddCommandHandler(repo, options.color !== false);
                try {
                    await handler.handleAddCommand(mergedOptions);
                }
                finally {
                    repo.close();
                }
                return;
            }
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
                    description: options.description,
                    body: options.body,
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
                if (handler) {
                    await handler.execute(context, commandParams);
                }
                else {
                    throw new Error('Add command handler not found in registry');
                }
                // Clean up
                context.close();
            }
            // Option 2: Direct implementation (fallback)
            else {
                const repo = new TaskRepository();
                const handler = new AddCommandHandler(repo, options.color !== false);
                try {
                    await handler.handleAddCommand(options);
                }
                finally {
                    repo.close();
                }
            }
        }
        catch (error) {
            console?.error('Error adding task:', error);
            process.exit(1);
        }
    });
    return addCommand;
}
