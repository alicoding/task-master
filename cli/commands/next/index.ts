import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo.ts';
import { SearchFilters, OutputFormat } from '../../../core/types.ts';
import { helpFormatter } from '../../helpers/help-formatter.ts';

export function createNextCommand() {
  const nextCommand = new Command('next')
    .description('Show the next task to work on')
    .option('--filter <tag>', 'Filter by tag')
    .option('--status <status>', 'Filter by status')
    .option('--readiness <readiness>', 'Filter by readiness')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--count <count>', 'Number of next tasks to show', '1')

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
        
        // Get multiple next tasks if requested
        const tasksResult = await repo.getNextTasks(filters, count);

        if (!tasksResult.success || !tasksResult.data || tasksResult.data.length === 0) {
          console.log('No tasks found matching the criteria');
          repo.close();
          return;
        }

        const tasks = tasksResult.data;
        
        if (format === 'json') {
          console.log(JSON.stringify(tasks, null, 2));
        } else {
          if (tasks.length === 1) {
            const task = tasks[0];
            console.log(`Next task: ${task.id}. ${task.title}`);
            console.log(`Status: ${task.status}`);
            console.log(`Readiness: ${task.readiness}`);
            console.log(`Tags: ${task.tags.join(', ') || 'none'}`);
            if (Object.keys(task.metadata || {}).length > 0) {
              console.log(`Metadata: ${JSON.stringify(task.metadata, null, 2)}`);
            }
          } else {
            console.log(`Found ${tasks.length} next tasks:`);
            tasks.forEach((task, index) => {
              console.log(`\n${index + 1}. ${task.id}. ${task.title}`);
              console.log(`   Status: ${task.status}`);
              console.log(`   Readiness: ${task.readiness}`);
              console.log(`   Tags: ${task.tags.join(', ') || 'none'}`);
            });
          }
        }
        
        repo.close();
      } catch (error) {
        console.error('Error finding next task:', error);
        process.exit(1);
      }
    });
  
  return nextCommand;
}