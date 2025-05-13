import { Command } from 'commander';
import { TaskRepository } from '@/core/repo';
import { TaskGraph } from '@/core/graph/index';
import { OutputFormat } from '@/core/types';
import readline from 'readline';
import { helpFormatter } from '@/cli/helpers/help-formatter';

export function createRemoveCommand() {
  const removeCommand = new Command('remove')
    .description('Remove a task')
    .argument('<id>', 'Task ID to remove')
    .option('--force', 'Skip confirmation')
    .option('--with-children', 'Remove all child tasks as well')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--dry-run', 'Show what would be removed without making changes')

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(removeCommand, {
    description: 'Delete tasks from your task list with protection against accidental removal. Supports removing individual tasks or entire hierarchies with their children.',
    examples: [
      {
        command: 'tm remove 5',
        description: 'Remove task #5 (with confirmation prompt)'
      },
      {
        command: 'tm remove 3 --with-children',
        description: 'Remove task #3 and all its subtasks'
      },
      {
        command: 'tm remove 10 --force',
        description: 'Remove task #10 without confirmation'
      },
      {
        command: 'tm remove 7 --dry-run',
        description: 'Show what would be removed without actually deleting anything'
      },
      {
        command: 'tm remove 12 --with-children --format json',
        description: 'Remove a task hierarchy with JSON output'
      }
    ],
    notes: [
      'Removing a task automatically reorders remaining task IDs',
      'The --with-children flag removes all descendant tasks',
      'Use --dry-run to preview what would be removed',
      'Interactive confirmation is required unless --force is used',
      'Removed tasks cannot be recovered - consider marking as done instead'
    ],
    seeAlso: ['update', 'show', 'add']
  })
    .action(async (id, options) => {
      try {
        const repo = new TaskRepository();
        const graph = new TaskGraph(repo);
        const format = options.format as OutputFormat;
        const dryRun = options.dryRun || false;
        
        // Check if task exists
        const task = await repo.getTask(id);
        
        if (!task) {
          console.error(`Task with ID ${id} not found`);
          repo.close();
          return;
        }
        
        // Find children if needed
        let children: string[] = [];
        if (options.withChildren) {
          const descendants = await graph.getDescendants(id);
          children = descendants.map(t => t.id);
        }
        
        // Show what will be removed
        if (format === 'json') {
          const toBeRemoved = {
            task: {
              id: task.id, 
              title: task.title
            },
            children: children.length > 0 ? children.map(id => ({ id })) : [],
            dryRun
          };
          
          console.log(JSON.stringify(toBeRemoved, null, 2));
          
          if (dryRun || (!options.force && process.stdin.isTTY === false)) {
            repo.close();
            return;
          }
        } else {
          console.log(`Task to remove: ${id}. ${task.title}`);
          
          if (children.length > 0) {
            console.log(`This will also remove ${children.length} child tasks:`);
            for (const childId of children) {
              const child = await repo.getTask(childId);
              if (child) {
                console.log(`  ${childId}. ${child.title}`);
              }
            }
          }
          
          if (dryRun) {
            console.log('Dry run complete - no tasks were removed');
            repo.close();
            return;
          }
        }
        
        // Ask for confirmation unless --force is provided
        if (!options.force && process.stdin.isTTY !== false) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          const prompt = children.length > 0 
            ? `Are you sure you want to remove this task and ${children.length} child tasks? [y/N] `
            : 'Are you sure you want to remove this task? [y/N] ';
          
          const answer = await new Promise<string>(resolve => {
            rl.question(prompt, resolve);
          });
          
          rl.close();
          
          if (answer.toLowerCase() !== 'y') {
            console.log('Task removal cancelled');
            repo.close();
            return;
          }
        }
        
        // Remove children first if requested (to avoid orphaned tasks)
        if (options.withChildren && children.length > 0) {
          for (const childId of children.reverse()) { // Remove in reverse order (deepest first)
            await repo.removeTask(childId);
          }
        }
        
        // Remove the task
        const success = await repo.removeTask(id);
        
        // Handle dependent task ID reordering
        await graph.handleTaskDeletion(id);
        
        if (success) {
          if (format !== 'json') {
            console.log(`Task ${id} removed successfully`);
            if (options.withChildren && children.length > 0) {
              console.log(`${children.length} child tasks also removed`);
            }
          }
        } else {
          console.error(`Failed to remove task ${id}`);
        }
        
        repo.close();
      } catch (error) {
        console.error('Error removing task:', error);
        process.exit(1);
      }
    });
  
  return removeCommand;
}