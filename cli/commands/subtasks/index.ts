import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo.ts';
import { OutputFormat } from '../../../core/types.ts';
import { helpFormatter } from '../../helpers/help-formatter.ts';

export function createSubtasksCommand() {
  const subtasksCommand = new Command('subtasks')
    .description('Show subtasks of a specific task')
    .argument('<taskId>', 'ID of the task to show subtasks for')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--status <status>', 'Filter subtasks by status', 'all')
    .option('--readiness <readiness>', 'Filter subtasks by readiness', 'all')
    .option('--recursive', 'Show all nested subtasks recursively', false)

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(subtasksCommand, {
    description: 'Display subtasks of a specific task. This command helps you see the detailed breakdown of a parent task into its component parts.',
    examples: [
      {
        command: 'tm subtasks 17.8',
        description: 'Show immediate subtasks of task 17.8'
      },
      {
        command: 'tm subtasks 17 --recursive',
        description: 'Show all subtasks of task 17 and their subtasks'
      },
      {
        command: 'tm subtasks 17.8 --status todo',
        description: 'Show subtasks of 17.8 with todo status'
      },
      {
        command: 'tm subtasks 17.8 --format json',
        description: 'Get subtasks of 17.8 in JSON format'
      }
    ],
    notes: [
      'Subtasks are identified by their ID pattern (e.g., 17.1 is a subtask of 17)',
      'Use --recursive to see all levels of nested subtasks',
      'Filter by status or readiness to focus on specific subtasks',
      'The command will work with any valid task ID in the system'
    ],
    seeAlso: ['show', 'next', 'search']
  })
    .action(async (taskId, options) => {
      try {
        const repo = new TaskRepository();
        const format = options.format as OutputFormat;
        const recursive = options.recursive === true;
        
        // Get all tasks
        const tasksResult = await repo.getAllTasks();
        
        if (!tasksResult.success || !tasksResult.data) {
          console.error('Error retrieving tasks:', tasksResult.error?.message || 'Unknown error');
          repo.close();
          return;
        }
        
        // Find the specified task
        const parentTask = tasksResult.data.find(task => task.id === taskId);
        
        if (!parentTask) {
          console.error(`Task with ID ${taskId} not found`);
          repo.close();
          return;
        }
        
        // Find subtasks
        const subtasks = tasksResult.data.filter(task => {
          // Direct subtasks have IDs that start with the parent ID followed by a dot
          const isDirectSubtask = task.id.startsWith(taskId + '.');
          
          // For direct subtasks, there should be only one more segment in the ID
          const idSegments = task.id.split('.');
          const parentSegments = taskId.split('.');
          
          const isImmediateSubtask = idSegments.length === parentSegments.length + 1;
          
          // Use either direct subtasks or all nested subtasks based on the recursive flag
          const isSubtask = recursive ? isDirectSubtask : (isDirectSubtask && isImmediateSubtask);
          
          // Apply status filter if specified
          const statusMatches = options.status === 'all' || task.status === options.status;
          
          // Apply readiness filter if specified
          const readinessMatches = options.readiness === 'all' || task.readiness === options.readiness;
          
          return isSubtask && statusMatches && readinessMatches;
        });
        
        // Sort subtasks by ID
        subtasks.sort((a, b) => {
          // Split IDs into parts and compare numerically
          const aParts = a.id.split('.').map(Number);
          const bParts = b.id.split('.').map(Number);
          
          // Compare each part
          for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
            if (aParts[i] !== bParts[i]) {
              return aParts[i] - bParts[i];
            }
          }
          
          // If all common parts are the same, shorter IDs come first
          return aParts.length - bParts.length;
        });
        
        // Display results
        if (subtasks.length === 0) {
          console.log(`No subtasks found for task ${taskId}`);
          repo.close();
          return;
        }
        
        if (format === 'json') {
          console.log(JSON.stringify(subtasks, null, 2));
        } else {
          console.log(`Subtasks of task ${taskId}: ${parentTask.title}`);
          console.log('─'.repeat(50));
          
          subtasks.forEach(task => {
            console.log(`${task.id}: ${task.title}`);
            console.log(`  Status: ${task.status}`);
            console.log(`  Readiness: ${task.readiness}`);
            if (task.tags && task.tags.length > 0) {
              console.log(`  Tags: ${task.tags.join(', ')}`);
            }
            console.log(''); // Empty line between tasks
          });
        }
        
        repo.close();
      } catch (error) {
        console.error('Error retrieving subtasks:', error);
        process.exit(1);
      }
    });

  return subtasksCommand;
}