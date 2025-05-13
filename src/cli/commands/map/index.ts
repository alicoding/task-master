import { Command } from 'commander';
import { TaskRepository } from '@/core/repo';
import { 
  CapabilityMapGenerator, 
  CapabilityDiscoveryOptions 
} from '@/core/capability-map/index';
import { 
  CapabilityMapVisualizer, 
  VisualizationOptions 
} from '@/core/capability-map/visualizer';
import { helpFormatter } from '@/cli/helpers/help-formatter';
import { AiProviderFactory } from '@/core/ai/factory';
import { asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Create the map command for visualizing task capabilities
 */
export async function createMapCommand() {
  const mapCommand = new Command('map')
    .description('Discover and visualize task capabilities automatically')
    .option('--format <format>', 'Output format (text, mermaid, dot, json)', 'text')
    .option('--min-confidence <value>', 'Minimum confidence threshold for nodes (0-1)', '0.5')
    .option('--max-nodes <value>', 'Maximum number of nodes to display', '20')
    .option('--group-by-type', 'Group capabilities by their discovered type')
    .option('--include-completed', 'Include completed tasks in the analysis')
    .option('--include-metadata', 'Include metadata in the capability analysis')
    .option('--color', 'Use colors in output when available')
    .option('--no-color', 'Disable colored output')
    .option('--show-confidence', 'Show confidence scores in the visualization')
    .option('--show-task-count', 'Show task count for each capability')
    .option('--show-types', 'Show capability types in the visualization')
    .option('--title <title>', 'Custom title for the visualization')
    .option('--ai-model <model>', (asChalkColor('Specify AI model to use (defaults to gpt-4, use "mock" for testing without API key)')))
    .option('--export <file>', 'Export the visualization to a file')
    .option('--progressive', 'Enable progressive refinement of the map');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(mapCommand, {
    description: 'Dynamically discover and visualize task capabilities using AI and NLP techniques. This command analyzes your tasks to automatically identify capabilities, features, and technical domains without any hardcoded categories or relationships.',
    examples: [
      {
        command: 'tm map',
        description: 'Generate a dynamic capability map and display it in the terminal'
      },
      {
        command: 'tm map --format mermaid',
        description: 'Generate a capability map in Mermaid.js diagram syntax for embedding in markdown'
      },
      {
        command: 'tm map --format dot',
        description: 'Generate a capability map in DOT syntax for use with Graphviz'
      },
      {
        command: 'tm map --format json',
        description: 'Generate a capability map in JSON format for use with other tools'
      },
      {
        command: 'tm map --min-confidence 0.7',
        description: 'Only show capabilities with at least 70% confidence'
      },
      {
        command: 'tm map --ai-model mock',
        description: 'Generate a capability map without requiring an API key'
      },
      {
        command: 'tm map --max-nodes 10',
        description: 'Limit the map to the 10 most confident capabilities'
      },
      {
        command: 'tm map --group-by-type',
        description: 'Group capabilities by their automatically discovered types'
      },
      {
        command: 'tm map --include-completed',
        description: 'Include completed tasks in the capability analysis'
      },
      {
        command: 'tm map --show-confidence --show-task-count',
        description: 'Show confidence scores and task counts in the visualization'
      },
      {
        command: 'tm map --export capabilities.md --format mermaid',
        description: 'Export a Mermaid diagram to a markdown file'
      }
    ],
    notes: [
      'The capability map is generated dynamically - no manual categorization needed',
      'The system uses AI and NLP to identify capabilities from task content',
      'Capabilities are discovered based solely on your task data',
      'Relationships between capabilities are inferred automatically',
      'The visualization adapts as your tasks evolve',
      'Different output formats are available for different uses:',
      '  - text: Clean ASCII visualization for terminal display',
      '  - mermaid: Diagram syntax for embedding in markdown documents',
      '  - dot: Graphviz syntax for advanced visualization',
      '  - json: Structured data for custom processing',
      'The map continuously improves its understanding as more tasks are added',
      'No predefined taxonomies or classification systems are used',
      'The system autonomously derives all structure from task content'
    ],
    seeAlso: ['show', 'search', 'graph']
  });

  mapCommand.action(async (options) => {
    try {
      console.log('Generating capability map...');
      const startTime = Date.now();

      // Create repository
      const repo = new TaskRepository();

      // Create AI provider if needed
      let aiProvider;
      if (options.ai_model) {
        try {
          // Check if user requested mock provider
          if (options.ai_model.toLowerCase() === 'mock') {
            console.log('Using mock AI provider (no API key required)...');
            aiProvider = AiProviderFactory.createProvider({
              type: 'mock'
            });
          } else {
            // Use specified model
            aiProvider = AiProviderFactory.createProvider({
              type: 'openai',
              model: options.ai_model,
            });
          }
        } catch (error) {
          console.warn(`Could not create AI provider with model ${options.ai_model}:`, error);
          console.log('Falling back to default AI provider...');
        }
      }

      // Create capability map generator
      const generator = new CapabilityMapGenerator(repo, aiProvider);

      // Prepare discovery options
      const discoveryOptions: CapabilityDiscoveryOptions = {
        confidenceThreshold: parseFloat(options.min_confidence) || 0.5,
        maxNodes: parseInt(options.max_nodes) || 20,
        includeCompletedTasks: options.include_completed === true,
        includeMetadata: options.include_metadata === true,
        visualizationFormat: options.format,
        enableProgressiveRefinement: options.progressive === true,
        aiModel: options.ai_model,
      };

      // Generate the capability map
      const capabilityMap = await generator.generateCapabilityMap(discoveryOptions);

      // Create visualizer
      const visualizer = new CapabilityMapVisualizer();

      // Prepare visualization options
      const visualizationOptions: VisualizationOptions = {
        format: options.format,
        colorOutput: options.color !== false,
        showConfidence: options.show_confidence === true,
        showTaskCount: options.show_task_count === true,
        showNodeTypes: options.show_types === true,
        minNodeConfidence: parseFloat(options.min_confidence) || 0.5,
        groupByType: options.group_by_type === true,
        title: options.title,
        showStats: true,
      };

      // Generate visualization
      const visualization = visualizer.visualize(capabilityMap, visualizationOptions);

      // Display timing information
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // Check if we have any capabilities
      if (capabilityMap.nodes.length === 0) {
        console.log('\n⚠️  No capabilities found in your tasks.\n');
        console.log('This could be because:');
        console.log('1. You have no tasks created yet (use "tm add" to create tasks)');
        console.log('2. Your tasks lack sufficient descriptive content');
        console.log('3. There was an error with the AI provider (try "--ai-model mock")');
        console.log('\nTry adding more descriptive tasks with tags and relationships.');
      } else {
        // Export to file if requested
        if (options.export) {
          const fs = await import('fs');
          fs.writeFileSync(options.export, visualization);
          console.log(`Capability map exported to ${options.export}`);
        } else {
          // Display in console
          console.log(visualization);
        }

        console.log(`Generated in ${duration.toFixed(2)} seconds with ${capabilityMap.nodes.length} capabilities and ${capabilityMap.edges.length} relationships`);
      }

      // Close repository
      repo.close();
    } catch (error) {
      console.error('Error generating capability map:', error);
      console.log('');
      console.log('Troubleshooting suggestions:');
      console.log('1. Try using the mock provider: tm map --ai-model mock');
      console.log('   This works without an API key and uses fallback algorithms');
      console.log('2. Check if you have an OpenAI API key set (OPENAI_API_KEY environment variable)');
      console.log('3. Try running with simpler options: tm map --min-confidence 0.3 --max-nodes 10');
      console.log('');
      process.exit(1);
    }
  });

  return mapCommand;
}