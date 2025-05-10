import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo.js';
import { TaskGraph } from '../../../core/graph.js';
import { OutputFormat } from '../../../core/types.js';
import { createShowGraphCommand } from './show-graph.js';
import { createDepsCommand } from './deps.js';
import { helpFormatter } from '../../helpers/help-formatter.js';

export async function createShowCommand() {
  const showCommand = new Command('show')
    .description('Show tasks')
    .argument('[id]', 'Task ID to show (shows all tasks if omitted)')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--graph', 'Show tasks in a graph format (deprecated, use `show graph` instead)')
    .option('--filter <filter>', 'Filter tasks by tag')

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(showCommand, {
    description: 'Display tasks with details and hierarchical relationships. View a single task, all tasks, or visualize the task hierarchy.',
    examples: [
      {
        command: 'tm show',
        description: 'List all tasks in a simple format'
      },
      {
        command: 'tm show 42',
        description: 'Show detailed information about task #42'
      },
      {
        command: 'tm show --graph',
        description: 'Show all tasks in a hierarchical tree (deprecated)'
      },
      {
        command: 'tm show graph',
        description: 'Display the task hierarchy with improved visualization'
      },
      {
        command: 'tm show --filter UI',
        description: 'Show only tasks with the UI tag'
      }
    ],
    notes: [
      'The show command displays tasks in different formats',
      'Without an ID, it lists all tasks in a flat list',
      'With an ID, it shows detailed information about that specific task',
      'Use the graph subcommand for advanced hierarchy visualization'
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
          const task = await repo.getTask(id);
          
          if (!task) {
            console.error(`Task with ID ${id} not found`);
            repo.close();
            return;
          }
          
          if (format === 'json') {
            console.log(JSON.stringify(task, null, 2));
          } else {
            console.log(`${task.id}. ${task.title}`);
            console.log(`Status: ${task.status}`);
            console.log(`Readiness: ${task.readiness}`);
            console.log(`Tags: ${task.tags.join(', ') || 'none'}`);
            console.log(`Created: ${new Date(task.createdAt).toLocaleString()}`);
            console.log(`Updated: ${new Date(task.updatedAt).toLocaleString()}`);
            
            if (task.parentId) {
              console.log(`Parent: ${task.parentId}`);
            }
          }
        } else {
          // Show all tasks
          if (options.graph) {
            // Get the task hierarchy
            const hierarchy = await repo.buildTaskHierarchy();
            
            // If filter is provided, filter the hierarchy
            let filteredHierarchy = hierarchy;
            if (options.filter) {
              // Simple filtering for MVP
              const filterTag = options.filter;
              
              function filterTasksByTag(tasks: any[], tag: string): any[] {
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
              
              filteredHierarchy = filterTasksByTag(hierarchy, filterTag);
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
            const tasks = await repo.getAllTasks();
            
            if (format === 'json') {
              console.log(JSON.stringify(tasks, null, 2));
            } else {
              tasks.forEach(task => {
                console.log(`${task.id}. ${task.title} [${task.status}]`);
              });
            }
          }
        }
        
        repo.close();
      } catch (error) {
        console.error('Error showing tasks:', error);
        process.exit(1);
      }
    });
  
  return showCommand;
}