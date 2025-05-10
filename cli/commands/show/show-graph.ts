/**
 * Show graph command implementation
 * Displays the task hierarchy with improved visualization
 */

import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo.js';
import { TaskGraph } from '../../../core/graph.js';
import { OutputFormat } from '../../../core/types.js';
import { TaskWithChildren } from '../../../core/types.js';

export async function createShowGraphCommand() {
  const showGraphCommand = new Command('graph')
    .description('Display task hierarchy as a graph')
    .option('--filter <filter...>', 'Filter tasks by tags (can specify multiple)')
    .option('--status <status>', 'Filter by status (todo, in-progress, done)')
    .option('--readiness <readiness>', 'Filter by readiness (draft, ready, blocked)')
    .option('--format <format>', 'Output format (text, json, dot, mermaid)', 'text')
    .option('--text-style <style>', 'Text style when using text format (simple, tree, detailed, compact)', 'tree')
    .option('--json-style <style>', 'JSON style when using json format (flat, tree, graph, ai)', 'tree')
    .option('--show-metadata', 'Include metadata in the output')
    .option('--output <file>', 'Save output to file instead of displaying in console')
    .option('--color', 'Use colors in output when available')

  // Import helpFormatter here to avoid circular dependency
  // Using dynamic import instead of require for ESM compatibility
  const helpFormatterModule = await import('../../helpers/help-formatter.js');
  const helpFormatter = helpFormatterModule.helpFormatter;

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(showGraphCommand, {
    description: 'Visualize the task hierarchy as a tree, graph, or other formats with enhanced options for both human readability and machine processing. Supports multiple output formats, styles, and filtering options.',
    examples: [
      {
        command: 'tm show graph',
        description: 'Show the complete task hierarchy with tree visualization'
      },
      {
        command: 'tm show graph --text-style detailed',
        description: 'Show task hierarchy with detailed information including status and tags'
      },
      {
        command: 'tm show graph --filter UI backend',
        description: 'Show only tasks with UI or backend tags'
      },
      {
        command: 'tm show graph --format json --json-style ai',
        description: 'Get AI-friendly JSON format with rich metadata and statistics'
      },
      {
        command: 'tm show graph --format dot --output tasks.dot',
        description: 'Export graph in DOT format for Graphviz visualization'
      },
      {
        command: 'tm show graph --format mermaid --output tasks.mmd',
        description: 'Export graph in Mermaid format for web visualization'
      },
      {
        command: 'tm show graph --text-style compact --color',
        description: 'Show compact task view with colorized output'
      },
      {
        command: 'tm show graph --status in-progress --format json --json-style graph',
        description: 'Get in-progress tasks in graph nodes/edges JSON format'
      }
    ],
    notes: [
      'Multiple output formats are supported:',
      '  - text: Human-readable text (default, with multiple styles)',
      '  - json: Machine-readable structured data (with multiple formats)',
      '  - dot: GraphViz DOT format for advanced visualization',
      '  - mermaid: Mermaid flowchart format for web integration',
      'Text styles include:',
      '  - simple: Basic indented hierarchy (original format)',
      '  - tree: ASCII tree with lines and symbols (default)',
      '  - detailed: Comprehensive view with all task information',
      '  - compact: Minimal view with essential information only',
      'JSON styles include:',
      '  - flat: Flattened task list (original format)',
      '  - tree: Nested hierarchy preserving parent-child relationships (default)',
      '  - graph: Nodes and edges format for graph visualization tools',
      '  - ai: Rich format with statistics and metadata optimized for AI processing',
      'Status symbols: □ (todo), ▶ (in-progress), ✓ (done)',
      'Readiness symbols: ✎ (draft), ▣ (ready), ⚠ (blocked)',
      'Use --output to save to a file instead of displaying in console'
    ],
    seeAlso: ['show', 'search', 'update', 'api']
  })
    .action(async (options) => {
      try {
        const repo = new TaskRepository();
        const graph = new TaskGraph(repo);
        
        const format = options.format as OutputFormat;
        const textStyle = options.text_style || 'tree';
        const jsonStyle = options.json_style || 'tree';
        const showMetadata = options.show_metadata === true;
        const useColor = options.color === true;
        const outputFile = options.output;
        
        // Get the complete task hierarchy
        const hierarchy = await repo.buildTaskHierarchy();
        
        // Apply filters if provided
        let filteredHierarchy = hierarchy;
        
        if (options.filter || options.status || options.readiness) {
          filteredHierarchy = filterTasks(
            hierarchy, 
            {
              tags: options.filter ? (Array.isArray(options.filter) ? options.filter : [options.filter]) : undefined,
              status: options.status,
              readiness: options.readiness
            }
          );
        }
        
        // Format the output based on requested format
        let output = '';
        
        // Format based on the desired output format
        switch (format) {
          case 'json':
            // JSON output with different styles
            const jsonOutput = await graph.formatHierarchyJson(filteredHierarchy, jsonStyle);
            output = JSON.stringify(jsonOutput, null, 2);
            break;

          case 'dot':
            // DOT format for Graphviz
            output = await graph.formatHierarchyDot(filteredHierarchy);
            break;

          case 'mermaid':
            // Mermaid flowchart format
            output = await graph.formatHierarchyMermaid(filteredHierarchy);
            break;

          case 'text':
          default:
            // Text output with specified style
            output = await graph.formatHierarchyText(
              filteredHierarchy,
              textStyle,
              { showMetadata, useColor }
            );
            break;
        }
        
        // Output to file or console
        if (outputFile) {
          const fs = await import('fs/promises');
          await fs.writeFile(outputFile, output);
          console.log(`Graph visualization saved to ${outputFile}`);
        } else {
          console.log(output);
        }
        
        repo.close();
      } catch (error) {
        console.error('Error showing task graph:', error);
        process.exit(1);
      }
    });
  
  return showGraphCommand;
}

/**
 * Filter tasks based on specified criteria
 */
function filterTasks(tasks: TaskWithChildren[], filters: { 
  tags?: string[], 
  status?: string, 
  readiness?: string 
}): TaskWithChildren[] {
  return tasks.filter(task => {
    let keep = true;
    
    // Filter by tags if provided
    if (filters.tags && filters.tags.length > 0) {
      const taskTags = task.tags || [];
      // Task matches if it has any of the specified tags
      keep = filters.tags.some(tag => taskTags.includes(tag));
    }
    
    // Filter by status if provided
    if (keep && filters.status) {
      keep = task.status === filters.status;
    }
    
    // Filter by readiness if provided
    if (keep && filters.readiness) {
      keep = task.readiness === filters.readiness;
    }
    
    // Process children
    if (task.children && task.children.length > 0) {
      task.children = filterTasks(task.children, filters);
      
      // Keep parent if it has matching children, even if it doesn't match the filters
      if (!keep && task.children.length > 0) {
        keep = true;
      }
    }
    
    return keep;
  });
}