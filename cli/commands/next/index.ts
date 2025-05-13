import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
import { SearchFilters, OutputFormat } from '../../../core/types';
import { helpFormatter } from '../../helpers/help-formatter';

export function createNextCommand() {
  const nextCommand = new Command('next')
    .description('Show the next task to work on')
    .option('--filter <tag>', 'Filter by tag')
    .option('--status <status>', 'Filter by status')
    .option('--readiness <readiness>', 'Filter by readiness')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--count <count>', 'Number of next tasks to show', '1')
    .option('--subtasks', 'Show subtasks of the next parent task', false)
    .option('--parent <parentId>', 'Find next task under specific parent ID')

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(nextCommand, {
    description: 'Find the next task to work on based on priority, readiness, and custom filters. The next command helps you focus on what to do next based on your task list.',
    examples: [
      {
        command: 'tm next',
        description: 'Show the single most important task to work on next'
      },
      {
        command: 'tm next --count 3',
        description: 'Show the top 3 tasks to consider working on'
      },
      {
        command: 'tm next --filter UI',
        description: 'Find the next UI-related task to work on'
      },
      {
        command: 'tm next --readiness ready',
        description: 'Show the next task that is marked as ready'
      },
      {
        command: 'tm next --status todo --count 5',
        description: 'Show 5 pending tasks to choose from'
      },
      {
        command: 'tm next --subtasks',
        description: 'Show the next parent task with its subtasks'
      },
      {
        command: 'tm next --parent 17.8',
        description: 'Find the next task within the 17.8 parent task'
      }
    ],
    notes: [
      'Tasks are prioritized based on status, readiness, and creation date',
      'By default, returns the single highest priority task',
      'Use --count to see multiple options for what to work on next',
      'Combine filters to focus on specific types of tasks',
      'Status defaults to "todo" when not explicitly filtered'
    ],
    seeAlso: ['show', 'update', 'search']
  })
    .action(async (options) => {
      try {
        const repo = new TaskRepository();
        const format = options.format as OutputFormat;
        const count = parseInt(options.count, 10) || 1;
        const showSubtasks = options.subtasks === true;
        const parentId = options.parent;

        // Build filters from options
        const filters: SearchFilters = {};

        if (options.filter) {
          filters.tags = [options.filter];
        }

        if (options.status) {
          filters.status = options.status;
        }

        if (options.readiness) {
          filters.readiness = options.readiness;
        }

        // Add parent ID filter if specified
        if (parentId) {
          // We need to handle parent filtering manually as it's not directly supported in the filters
          // So first, get all tasks
          const allTasksResult = await repo.getAllTasks();

          if (!allTasksResult?.success || !allTasksResult?.data) {
            console?.error('Error retrieving tasks:', allTasksResult?.error?.message || 'Unknown error');
            repo.close();
            return;
          }

          // Find direct child tasks of the specified parent
          const childTasks = allTasksResult?.data?.filter(task => {
            return task.id.startsWith(parentId + '.') &&
                  // Make sure it's a direct child (one level down)
                  task.id.split('.').length === parentId.split('.').length + 1;
          });

          // Apply other filters to these child tasks
          const filteredTasks = childTasks.filter(task => {
            let matches = true;

            if (filters.status) {
              matches = matches && task.status === filters.status;
            }

            if (filters.readiness) {
              matches = matches && task.readiness === filters.readiness;
            }

            if (filters.tags && filters.tags.length > 0) {
              matches = matches && filters.tags.every(tag =>
                task.tags && task.tags.includes(tag)
              );
            }

            return matches;
          });

          // Sort by ID (numerical parts)
          filteredTasks.sort((a, b) => {
            const aParts = a.id.split('.').map(Number);
            const bParts = b.id.split('.').map(Number);

            for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
              if (aParts[i] !== bParts[i]) {
                return aParts[i] - bParts[i];
              }
            }

            return aParts.length - bParts.length;
          });

          // Return the results
          if (filteredTasks.length === 0) {
            console.log(`No tasks found under parent ${parentId} matching the criteria`);
            repo.close();
            return;
          }

          // Display results
          if (format === 'json') {
            console.log(JSON.stringify(filteredTasks.slice(0, count), null, 2));
          } else {
            console.log(`Next tasks under parent ${parentId}:`);
            console.log('─'.repeat(40));

            filteredTasks.slice(0, count).forEach((task, index) => {
              console.log(`${task.id}: ${task.title}`);
              console.log(`  Status: ${task.status}`);
              console.log(`  Readiness: ${task.readiness}`);
              if (task.tags && task.tags.length > 0) {
                console.log(`  Tags: ${task.tags?.join(', ')}`);
              }
              console.log(''); // Empty line between tasks
            });
          }

          repo.close();
          return;
        }

        // Get multiple next tasks if requested
        const tasksResult = await repo.getNextTasks(filters, count);

        if (!tasksResult?.success || !tasksResult?.data || tasksResult?.data?.length === 0) {
          console.log('No tasks found matching the criteria');
          repo.close();
          return;
        }

        const tasks = tasksResult?.data;

        // Handle subtasks option - find and display subtasks of the first task
        if (showSubtasks && tasks.length > 0) {
          const parentTask = tasks[0];

          // Get all tasks to find subtasks
          const allTasksResult = await repo.getAllTasks();

          if (!allTasksResult?.success || !allTasksResult?.data) {
            console?.error('Error retrieving tasks:', allTasksResult?.error?.message || 'Unknown error');
            repo.close();
            return;
          }

          // Find direct subtasks
          const subtasks = allTasksResult?.data?.filter(task => {
            return task.id.startsWith(parentTask.id + '.') &&
                  // Make sure it's a direct child (one level down)
                  task.id.split('.').length === parentTask.id.split('.').length + 1;
          });

          // Sort subtasks by ID
          subtasks.sort((a, b) => {
            const aParts = a.id.split('.').map(Number);
            const bParts = b.id.split('.').map(Number);

            for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
              if (aParts[i] !== bParts[i]) {
                return aParts[i] - bParts[i];
              }
            }

            return aParts.length - bParts.length;
          });

          // Display parent task with subtasks
          if (format === 'json') {
            console.log(JSON.stringify({
              parent: parentTask,
              subtasks: subtasks
            }, null, 2));
          } else {
            console.log(`Next task: ${parentTask.id}. ${parentTask.title}`);
            console.log(`Status: ${parentTask.status}`);
            console.log(`Readiness: ${parentTask.readiness}`);
            console.log(`Tags: ${parentTask.tags?.join(', ') || 'none'}`);

            if (subtasks.length > 0) {
              console.log('\nSubtasks:');
              console.log('─'.repeat(40));

              subtasks.forEach((task, index) => {
                console.log(`${task.id}: ${task.title}`);
                console.log(`  Status: ${task.status}`);
                console.log(`  Readiness: ${task.readiness}`);
                if (task.tags && task.tags.length > 0) {
                  console.log(`  Tags: ${task.tags?.join(', ')}`);
                }
                console.log(''); // Empty line between tasks
              });
            } else {
              console.log('\nNo subtasks found.');
            }
          }

          repo.close();
          return;
        }

        // Regular output without subtasks
        if (format === 'json') {
          console.log(JSON.stringify(tasks, null, 2));
        } else {
          if (tasks.length === 1) {
            const task = tasks[0];
            console.log(`Next task: ${task.id}. ${task.title}`);
            console.log(`Status: ${task.status}`);
            console.log(`Readiness: ${task.readiness}`);
            console.log(`Tags: ${task.tags?.join(', ') || 'none'}`);
            if (Object.keys(task.metadata || {}).length > 0) {
              console.log(`Metadata: ${JSON.stringify(task.metadata, null, 2)}`);
            }
          } else {
            console.log(`Found ${tasks.length} next tasks:`);
            tasks.forEach((task, index) => {
              console.log(`\n${index + 1}. ${task.id}. ${task.title}`);
              console.log(`   Status: ${task.status}`);
              console.log(`   Readiness: ${task.readiness}`);
              console.log(`   Tags: ${task.tags?.join(', ') || 'none'}`);
            });
          }
        }

        repo.close();
      } catch (error) {
        console?.error('Error finding next task:', error);
        process.exit(1);
      }
    });
  
  return nextCommand;
}