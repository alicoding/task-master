/**
 * Show graph command implementation
 * Displays the task hierarchy with improved visualization
 */

import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
import { TaskGraph } from '../../../core/graph';
import { OutputFormat, HierarchyTask } from '../../../core/types';

export async function createShowGraphCommand() {
  const showGraphCommand = new Command('graph')
    .description('Display task hierarchy as a graph')
    .option('--filter <filter...>', 'Filter tasks by tags (can specify multiple)')
    .option('--status <status>', 'Filter by status (todo, in-progress, done)')
    .option('--readiness <readiness>', 'Filter by readiness (draft, ready, blocked)')
    .option('--format <format>', 'Output format (text, json, dot, mermaid)', 'text')
    .option('--text-style <style>', 'Text style when using text format (simple, tree, detailed, compact, enhanced)', 'enhanced')
    .option('--json-style <style>', 'JSON style when using json format (flat, tree, graph, ai)', 'tree')
    .option('--show-metadata', 'Include metadata in the output')
    .option('--show-tags', 'Include tags in the output')
    .option('--hide-description', 'Hide description in the output')
    .option('--output <file>', 'Save output to file instead of displaying in console')
    .option('--color', 'Use colors in output when available')
    .option('--no-color', 'Disable colored output')
    .option('--unicode', 'Use unicode box drawing characters')
    .option('--no-unicode', 'Disable unicode box drawing characters')
    .option('--boxes', 'Use box drawing for task sections')
    .option('--no-boxes', 'Disable box drawing for task sections')
    .option('--tables', 'Use formatted tables for task lists')
    .option('--no-tables', 'Disable formatted tables for task lists')
    .option('--compact', 'Use compact display format')
    .option('--compatibility-mode', 'Use compatibility mode for limited terminals')

  // Import helpFormatter here to avoid circular dependency
  // Using dynamic import instead of require for ESM compatibility
  const helpFormatterModule = await import('../../helpers/help-formatter');
  const helpFormatter = helpFormatterModule.helpFormatter;

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(showGraphCommand, {
    description: 'Visualize the task hierarchy with enhanced visual formatting, clear structure indicators, and rich details. Supports multiple output formats, styles, and filtering options for both human readability and machine processing.',
    examples: [
      {
        command: 'tm show graph',
        description: 'Show the complete task hierarchy with enhanced tree visualization'
      },
      {
        command: 'tm show graph --text-style detailed',
        description: 'Show task hierarchy with comprehensive information'
      },
      {
        command: 'tm show graph --filter UI backend',
        description: 'Show only tasks with UI or backend tags'
      },
      {
        command: 'tm show graph --format json --json-style ai',
        description: 'Get AI-friendly JSON format with rich metadata'
      },
      {
        command: 'tm show graph --format dot --output tasks.dot',
        description: 'Export graph in DOT format for Graphviz visualization'
      },
      {
        command: 'tm show graph --format mermaid --output tasks.mmd',
        description: 'Export graph in Mermaid format for web integration'
      },
      {
        command: 'tm show graph --text-style compact --color',
        description: 'Show compact task view with colorized output'
      },
      {
        command: 'tm show graph --compatibility-mode',
        description: 'Use minimal formatting for limited terminals'
      }
    ],
    notes: [
      'Multiple output formats are supported:',
      '  - text: Human-readable text (default, with multiple styles)',
      '  - json: Machine-readable structured data (with multiple formats)',
      '  - dot: GraphViz DOT format for advanced visualization',
      '  - mermaid: Mermaid flowchart format for web integration',
      'Text styles include:',
      '  - enhanced: Rich tree with improved visuals and structure (default)',
      '  - simple: Basic indented hierarchy (original format)',
      '  - tree: ASCII tree with lines and symbols',
      '  - detailed: Comprehensive view with all task information',
      '  - compact: Minimal view with essential information only',
      'JSON styles include:',
      '  - tree: Nested hierarchy preserving parent-child relationships (default)',
      '  - flat: Flattened task list (original format)',
      '  - graph: Nodes and edges format for graph visualization tools',
      '  - ai: Rich format with statistics and metadata optimized for AI processing',
      'Status is color-coded: todo (white), in-progress (yellow), done (green)',
      'Readiness is color-coded: draft (blue), ready (magenta), blocked (red)',
      'Status symbols: □ (todo), ▶ (in-progress), ✓ (done)',
      'Readiness symbols: ✎ (draft), ▣ (ready), ⚠ (blocked)',
      'Use --output to save to a file instead of displaying in console',
      'Use --compatibility-mode for terminals with limited formatting support'
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
        const hierarchyResult = await repo.buildTaskHierarchy();

        if (!hierarchyResult?.success || !hierarchyResult?.data) {
          console?.error(`Failed to build task hierarchy: ${hierarchyResult?.error?.message || 'Unknown error'}`);
          repo.close();
          process.exit(1);
          return;
        }

        // Apply filters if provided
        let filteredHierarchy = hierarchyResult?.data;

        if (options.filter || options.status || options.readiness) {
          filteredHierarchy = filterTasks(
            filteredHierarchy,
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
            // Text output with specified style and all formatting options
            output = await graph.formatHierarchyText(
              filteredHierarchy,
              textStyle,
              {
                showMetadata: options.show_metadata === true,
                showTags: options.show_tags !== false,
                showDescription: options.hide_description !== true,
                useColor: options.color !== false,
                useUnicode: options.unicode !== false,
                useBoxes: options.boxes !== false,
                useTables: options.tables !== false,
                compactMode: options.compact === true,
                compatibilityMode: options.compatibility_mode === true
              }
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
        console?.error('Error showing task graph:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return showGraphCommand;
}

/**
 * Filter tasks based on specified criteria
 */
function filterTasks(tasks: HierarchyTask[], filters: {
  tags?: string[],
  status?: string,
  readiness?: string
}): HierarchyTask[] {
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