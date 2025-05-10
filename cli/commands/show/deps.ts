/**
 * Dependencies visualization command implementation
 * Shows dependencies between tasks with flexible output formats
 */

import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo.js';
import { TaskGraph } from '../../../core/graph.js';
import { OutputFormat } from '../../../core/types.js';
import { TaskWithChildren } from '../../../core/types.js';

export async function createDepsCommand() {
  const depsCommand = new Command('deps')
    .description('Visualize task dependencies')
    .argument('[id]', 'Root task ID to show dependencies for (shows all if omitted)')
    .option('--depth <depth>', 'Limit the depth of the dependency tree (default: no limit)', parseInt)
    .option('--direction <direction>', 'Direction to show (down, up, both)', 'down')
    .option('--format <format>', 'Output format (text, json, dot, mermaid)', 'text')
    .option('--text-style <style>', 'Text style when using text format (simple, tree, detailed)', 'tree')
    .option('--json-style <style>', 'JSON style when using json format (flat, tree, graph)', 'graph')
    .option('--show-metadata', 'Include metadata in the output')
    .option('--output <file>', 'Save output to file instead of displaying in console')
    .option('--color', 'Use colors in output when available')

  // Import helpFormatter here to avoid circular dependency
  // Using dynamic import instead of require for ESM compatibility
  const helpFormatterModule = await import('../../helpers/help-formatter.js');
  const helpFormatter = helpFormatterModule.helpFormatter;

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(depsCommand, {
    description: 'Visualize task dependencies and relationships with flexible output and filtering options. This command is useful for understanding the structure of your tasks and their interdependencies.',
    examples: [
      {
        command: 'tm deps',
        description: 'Show all task dependencies in a tree format'
      },
      {
        command: 'tm deps 42',
        description: 'Show dependencies for task #42 only'
      },
      {
        command: 'tm deps --depth 2',
        description: 'Show dependencies limited to 2 levels deep'
      },
      {
        command: 'tm deps --direction both',
        description: 'Show both child and parent dependencies'
      },
      {
        command: 'tm deps --format mermaid --output deps.mmd',
        description: 'Export deps as Mermaid flowchart to a file'
      },
      {
        command: 'tm deps 42 --format json --json-style graph',
        description: 'Get task #42 dependencies in JSON graph format'
      }
    ],
    notes: [
      'The deps command visualizes relationships between tasks',
      'Direction options:',
      '  - down: Show child tasks (default)',
      '  - up: Show parent tasks',
      '  - both: Show both parents and children',
      'Multiple output formats supported:',
      '  - text: Human-readable text (default)',
      '  - json: Machine-readable structured data',
      '  - dot: GraphViz DOT format for visualization',
      '  - mermaid: Mermaid flowchart format for web integration',
      'Use --depth to limit the levels of dependencies shown',
      'Use --output to save to a file instead of displaying in console'
    ],
    seeAlso: ['show', 'show graph', 'update']
  })
    .action(async (id, options) => {
      try {
        const repo = new TaskRepository();
        const graph = new TaskGraph(repo);
        
        const format = options.format as OutputFormat;
        const textStyle = options.text_style || 'tree';
        const jsonStyle = options.json_style || 'graph';
        const showMetadata = options.show_metadata === true;
        const useColor = options.color === true;
        const outputFile = options.output;
        const direction = options.direction || 'down';
        const maxDepth = options.depth ? parseInt(options.depth) : undefined;
        
        // Get tasks based on the specified dependencies
        let tasks: TaskWithChildren[] = [];
        
        if (id) {
          // Get specific task and its dependencies
          switch (direction) {
            case 'up':
              // Show parent relationships
              tasks = await getParentTree(repo, id, maxDepth);
              break;
              
            case 'down':
              // Show child relationships (default)
              tasks = await getTaskWithDescendants(repo, id, maxDepth);
              break;
              
            case 'both':
              // Show both parent and child relationships
              const descendants = await getTaskWithDescendants(repo, id, maxDepth);
              const ancestors = await getParentTree(repo, id, maxDepth);
              
              // Merge both trees
              tasks = [...descendants, ...ancestors.filter(task => 
                !descendants.some(d => d.id === task.id))];
              break;
          }
        } else {
          // Get all tasks in the hierarchy
          tasks = await repo.buildTaskHierarchy();
          
          // Apply depth limit if specified
          if (maxDepth !== undefined) {
            tasks = limitHierarchyDepth(tasks, maxDepth);
          }
        }
        
        // Format the output based on requested format
        let output = '';
        
        // Format based on the desired output format
        switch (format) {
          case 'json':
            // JSON output with different styles
            const jsonOutput = await graph.formatHierarchyJson(tasks, jsonStyle);
            output = JSON.stringify(jsonOutput, null, 2);
            break;
            
          case 'dot':
            // DOT format for Graphviz
            output = await graph.formatHierarchyDot(tasks);
            break;
            
          case 'mermaid':
            // Mermaid flowchart format
            output = await graph.formatHierarchyMermaid(tasks);
            break;
            
          case 'text':
          default:
            // Text output with specified style
            output = await graph.formatHierarchyText(
              tasks,
              textStyle,
              { showMetadata, useColor }
            );
            break;
        }
        
        // Output to file or console
        if (outputFile) {
          const fs = await import('fs/promises');
          await fs.writeFile(outputFile, output);
          console.log(`Dependencies visualization saved to ${outputFile}`);
        } else {
          console.log(output);
        }
        
        repo.close();
      } catch (error) {
        console.error('Error showing task dependencies:', error);
        process.exit(1);
      }
    });
  
  return depsCommand;
}

/**
 * Get a task and all its descendants (child tasks)
 */
async function getTaskWithDescendants(
  repo: TaskRepository,
  taskId: string,
  maxDepth: number = Infinity,
  currentDepth: number = 0
): Promise<TaskWithChildren[]> {
  // Get the task
  const task = await repo.getTask(taskId);
  if (!task) return [];
  
  // Convert to TaskWithChildren
  const taskWithChildren: TaskWithChildren = {
    ...task,
    children: []
  };
  
  // If we haven't reached the max depth, get children
  if (currentDepth < maxDepth) {
    // Get child tasks
    const childTasks = await repo.getChildTasks(taskId);
    
    // Get descendants for each child recursively
    for (const childTask of childTasks) {
      const childDescendants = await getTaskWithDescendants(
        repo,
        childTask.id,
        maxDepth,
        currentDepth + 1
      );
      
      // Add to children
      if (childDescendants.length > 0) {
        taskWithChildren.children.push(childDescendants[0]);
      }
    }
  }
  
  return [taskWithChildren];
}

/**
 * Get the parent tree for a task
 */
async function getParentTree(
  repo: TaskRepository,
  taskId: string,
  maxDepth: number = Infinity,
  currentDepth: number = 0,
  visited: Set<string> = new Set()
): Promise<TaskWithChildren[]> {
  // Prevent circular references
  if (visited.has(taskId)) return [];
  visited.add(taskId);
  
  // Get the task
  const task = await repo.getTask(taskId);
  if (!task) return [];
  
  // Build the result
  const result: TaskWithChildren[] = [{
    ...task,
    children: []
  }];
  
  // If we haven't reached the max depth and the task has a parent, get the parent
  if (currentDepth < maxDepth && task.parentId) {
    const parentTree = await getParentTree(
      repo,
      task.parentId,
      maxDepth,
      currentDepth + 1,
      visited
    );
    
    if (parentTree.length > 0) {
      // Add this task as a child of its parent
      parentTree[0].children.push(result[0]);
      return parentTree;
    }
  }
  
  return result;
}

/**
 * Limit the hierarchy to a specified depth
 */
function limitHierarchyDepth(
  tasks: TaskWithChildren[],
  maxDepth: number,
  currentDepth: number = 0
): TaskWithChildren[] {
  if (currentDepth >= maxDepth) {
    // Strip children at max depth
    return tasks.map(task => ({
      ...task,
      children: []
    }));
  }
  
  // Process children recursively
  return tasks.map(task => ({
    ...task,
    children: task.children 
      ? limitHierarchyDepth(task.children, maxDepth, currentDepth + 1)
      : []
  }));
}