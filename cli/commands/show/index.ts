import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
import { TaskGraph } from '../../../core/graph';
import { OutputFormat, HierarchyTask } from '../../../core/types';
import { createShowGraphCommand } from './show-graph';
import { createDepsCommand } from './deps';
import { helpFormatter } from '../../helpers/help-formatter';

export async function createShowCommand() {
  const showCommand = new Command('show')
    .description('Show tasks')
    .argument('[id]', 'Task ID to show (shows all tasks if omitted)')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--graph', 'Show tasks in a graph format (deprecated, use `show graph` instead)')
    .option('--filter <filter>', 'Filter tasks by tag')
    .option('--task-style <style>', 'Task display style (polished, enhanced, boxed, simple)', 'polished')
    .option('--color', 'Use colors in output when available')
    .option('--no-color', 'Disable colored output')
    .option('--boxes', 'Use box drawing for task sections')
    .option('--no-boxes', 'Disable box drawing for task sections')
    .option('--tables', 'Use formatted tables for task lists')
    .option('--no-tables', 'Disable formatted tables for task lists')
    .option('--compact', 'Use compact display format')
    .option('--compatibility-mode', 'Use compatibility mode for limited terminals')
    .option('--show-metadata', 'Include metadata in the output')
    .option('--hide-description', 'Hide description in the output')
    .option('--full-content', 'Show all content without truncation for long descriptions and body text')

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(showCommand, {
    description: 'Display tasks with enhanced visual formatting, detailed information, and hierarchical relationships. View a single task with boxed sections, all tasks in a formatted table, or visualize the task hierarchy with clear tree structure.',
    examples: [
      {
        command: 'tm show',
        description: 'List all tasks in a formatted table'
      },
      {
        command: 'tm show 42',
        description: 'Show detailed information about task #42 with the polished professional layout'
      },
      {
        command: 'tm show 42 --task-style polished',
        description: 'Show task with polished professional layout (default)'
      },
      {
        command: 'tm show 42 --task-style enhanced',
        description: 'Show task with enhanced unified layout (previous default)'
      },
      {
        command: 'tm show 42 --task-style boxed',
        description: 'Show task with classic boxed layout (separate sections)'
      },
      {
        command: 'tm show 42 --task-style simple',
        description: 'Show task with simple plain text layout'
      },
      {
        command: 'tm show --graph',
        description: 'Show all tasks in a hierarchical tree (deprecated)'
      },
      {
        command: 'tm show graph',
        description: 'Display the task hierarchy with enhanced visualization'
      },
      {
        command: 'tm show --filter UI',
        description: 'Show only tasks with the UI tag'
      },
      {
        command: 'tm show --compact',
        description: 'Show tasks in a more compact format'
      },
      {
        command: 'tm show --no-boxes --no-color',
        description: 'Show tasks without box formatting and color (for compatibility)'
      },
      {
        command: 'tm show 42 --show-metadata',
        description: 'Show a task with its metadata displayed'
      },
      {
        command: 'tm show 42 --full-content',
        description: 'Show all task content without truncation for long descriptions and body text'
      }
    ],
    notes: [
      'The show command displays tasks with professional visual formatting',
      'Without an ID, it lists all tasks in a formatted table',
      'With an ID, it shows detailed information about that task with a polished professional layout',
      'Task display styles:',
      '  - polished: Professional layout with advanced typography and visual elements (default)',
      '  - enhanced: Modern unified layout with integrated sections',
      '  - boxed: Classic multi-box layout with separate sections',
      '  - simple: Basic text output without fancy formatting',
      'Use --no-color, --no-boxes, or --compatibility-mode for terminals with limited formatting',
      'The --compact option shows tasks in a more condensed format',
      'Use the graph subcommand for advanced hierarchy visualization',
      'Status is color-coded: todo (white), in-progress (yellow), done (green)',
      'Progress bar visually indicates task completion status',
      'Long descriptions and body content are truncated by default, use --full-content to show all'
    ],
    seeAlso: ['add', 'update', 'remove', 'search']
  })

  // Add the graph and deps subcommands
  showCommand.addCommand(await createShowGraphCommand())
  showCommand.addCommand(await createDepsCommand())
    .action(async (id, options) => {
      try {
        const repo = new TaskRepository();
        const graph = new TaskGraph(repo);

        const format = options.format as OutputFormat;

        if (id) {
          // Show a specific task
          const taskResult = await repo.getTask(id);

          if (!taskResult?.success || !taskResult?.data) {
            console?.error(`Task with ID ${id} not found: ${taskResult?.error?.message || 'Unknown error'}`);
            repo.close();
            return;
          }

          const task = taskResult?.data;

          if (format === 'json') {
            console.log(JSON.stringify(task, null, 2));
          } else {
            // Use the task view formatter with specified style
            const taskStyle = options.task_style || 'polished';
            const formattedTask = await graph.formatTaskView(task, taskStyle, {
              useColor: options.color !== false,
              useBoxes: options.boxes !== false,
              showMetadata: options.showMetadata === true,
              fullContent: options.full_content === true,
              width: process.stdout.columns || 80
            });

            console.log(formattedTask);
          }
        } else {
          // Show all tasks
          if (options.graph) {
            // Get the task hierarchy
            const hierarchyResult = await repo.buildTaskHierarchy();

            if (!hierarchyResult?.success || !hierarchyResult?.data) {
              console?.error(`Failed to build task hierarchy: ${hierarchyResult?.error?.message || 'Unknown error'}`);
              repo.close();
              return;
            }

            // If filter is provided, filter the hierarchy
            let filteredHierarchy = hierarchyResult?.data;
            if (options.filter) {
              // Simple filtering for MVP
              const filterTag = options.filter;

              function filterTasksByTag(tasks: HierarchyTask[], tag: string): HierarchyTask[] {
                return tasks.filter(task => {
                  const taskTags = task.tags || [];

                  // Keep this task if it has the tag
                  const hasTag = taskTags.includes(tag);

                  // Filter its children
                  if (task.children && task.children.length > 0) {
                    task.children = filterTasksByTag(task.children, tag);
                  }

                  // Keep this task if it has the tag or has children after filtering
                  return hasTag || (task.children && task.children.length > 0);
                });
              }

              filteredHierarchy = filterTasksByTag(filteredHierarchy, filterTag);
            }

            // Format based on the desired output
            if (format === 'json') {
              const jsonOutput = await graph.formatHierarchyJson(filteredHierarchy);
              console.log(JSON.stringify(jsonOutput, null, 2));
            } else {
              const textOutput = await graph.formatHierarchyText(filteredHierarchy);
              console.log(textOutput);
            }
          } else {
            // Simple list of all tasks
            const tasksResult = await repo.getAllTasks();

            if (!tasksResult?.success || !tasksResult?.data) {
              console?.error(`Failed to retrieve tasks: ${tasksResult?.error?.message || 'Unknown error'}`);
              repo.close();
              return;
            }

            const tasks = tasksResult?.data;

            if (format === 'json') {
              console.log(JSON.stringify(tasks, null, 2));
            } else {
              // Use the enhanced task list formatter
              const formattedList = await graph.formatTaskList(tasks, 'table', {
                useColor: options.color !== false,
                useTable: options.tables !== false,
                showDescription: true,
                compact: options.compact === true
              });

              console.log(formattedList);
            }
          }
        }

        repo.close();
      } catch (error) {
        console?.error('Error showing tasks:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return showCommand;
}