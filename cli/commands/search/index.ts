import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo.js';
import { SearchFilters, OutputFormat } from '../../../core/types.js';
import { helpFormatter } from '../../helpers/help-formatter.js';
import chalk from 'chalk';
import { NlpService } from '../../../core/nlp-service.js';

export function createSearchCommand() {
  const searchCommand = new Command('search')
    .description('Search for tasks')
    .option('--filter <filters...>', 'Filter by attribute (format: key:value)', [])
    .option('--query <query>', 'Search in task titles and metadata (NLP-enhanced)')
    .option('--status <status>', 'Filter by status (todo, in-progress, done)')
    .option('--readiness <readiness>', 'Filter by readiness (draft, ready, blocked)')
    .option('--tag <tags...>', 'Filter by tags (can specify multiple)')
    .option('--metadata <json>', 'Filter by metadata as JSON string')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--sort <field>', 'Sort by field (id, title, status, readiness, createdAt, updatedAt)', 'id')
    .option('--explain', 'Show explanation of how search was processed')
    .option('--similar <title>', 'Find tasks similar to specified title')
    .option('--fuzzy', 'Use fuzzy matching for search and similarity', true)
    .option('--no-fuzzy', 'Disable fuzzy matching')
    .option('--no-color', 'Disable colored output')

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(searchCommand, {
    description: 'Find tasks using powerful search filters and NLP-enhanced natural language matching. Search by title, status, tags, metadata, and more with flexible filtering options.',
    examples: [
      {
        command: 'tm search --query "user interface"',
        description: 'Search for tasks with titles related to "user interface"'
      },
      {
        command: 'tm search --status in-progress',
        description: 'Find all in-progress tasks'
      },
      {
        command: 'tm search --tag UI --tag high-priority',
        description: 'Find tasks with both UI and high-priority tags'
      },
      {
        command: 'tm search --filter meta.assignee:alice',
        description: 'Find tasks assigned to Alice in metadata'
      },
      {
        command: 'tm search --metadata \'{"priority": "high"}\'',
        description: 'Find tasks with high priority in metadata'
      },
      {
        command: 'tm search --query "api" --sort updatedAt',
        description: 'Find API-related tasks sorted by last update time'
      },
      {
        command: 'tm search --query "important blocked tasks" --explain',
        description: 'Search with natural language and see explanation'
      },
      {
        command: 'tm search --similar "Add login feature"',
        description: 'Find tasks similar to "Add login feature"'
      },
      {
        command: 'tm search --query "frontend tasks" --fuzzy',
        description: 'Search with fuzzy matching enabled'
      }
    ],
    notes: [
      'The --query option uses NLP-enhanced natural language processing to find relevant tasks',
      'Natural language queries can extract status, readiness, and other properties automatically',
      'Use --explain to see how your query was processed by the NLP engine',
      'Combine multiple filter options to narrow down results',
      'The --filter option accepts key:value pairs (meta.key:value for metadata)',
      'Use --metadata with a JSON object for complex metadata filtering',
      'Results include task details like status, readiness, tags, and metadata',
      'The --similar option uses semantic similarity to find related tasks',
      'Enable --fuzzy for improved matching using Fuse.js fuzzy search'
    ],
    seeAlso: ['show', 'update', 'show graph']
  })
    .action(async (options) => {
      try {
        const repo = new TaskRepository();
        const format = options.format as OutputFormat;
        const nlpService = new NlpService();
        const useFuzzy = options.fuzzy !== false;
        
        // Check if we're doing a similarity search
        if (options.similar) {
          await performSimilaritySearch(repo, nlpService, options);
          repo.close();
          return;
        }
        
        // Build filters from options
        const filters: SearchFilters = {};
        
        // Direct filter options
        if (options.status) {
          filters.status = options.status;
        }
        
        if (options.readiness) {
          filters.readiness = options.readiness;
        }
        
        if (options.tag && options.tag.length > 0) {
          filters.tags = options.tag;
        }
        
        // Parse traditional key:value filters
        if (options.filter && options.filter.length > 0) {
          for (const filter of options.filter) {
            const [key, value] = filter.split(':');
            
            if (!key || !value) continue;
            
            if (key === 'tag' || key === 'tags') {
              filters.tags = filters.tags || [];
              filters.tags.push(value);
            } else if (key === 'status' && !filters.status) {
              filters.status = value;
            } else if (key === 'readiness' && !filters.readiness) {
              filters.readiness = value;
            } else if (key.startsWith('meta.')) {
              filters.metadata = filters.metadata || {};
              const metaKey = key.substring(5);
              filters.metadata[metaKey] = value;
            }
          }
        }
        
        // Parse metadata JSON if provided
        if (options.metadata) {
          try {
            const metadataObj = JSON.parse(options.metadata);
            filters.metadata = filters.metadata || {};
            Object.assign(filters.metadata, metadataObj);
          } catch (e) {
            console.error('Invalid JSON for metadata:', e);
          }
        }
        
        // Process natural language query if provided
        let tasks;
        let extractedInfo;
        
        if (options.query) {
          // Get extracted filter information if explain is enabled
          if (options.explain) {
            extractedInfo = await nlpService.extractSearchFilters(options.query);
          }
          
          // If we're using the natural language search
          if (useFuzzy) {
            // Use the new naturalLanguageSearch method
            tasks = await repo.naturalLanguageSearch(options.query, true);
          } else {
            // Use traditional search approach
            filters.query = options.query;
            tasks = await repo.searchTasks(filters);
          }
        } else {
          // Standard search with filters
          tasks = await repo.searchTasks(filters);
        }
        
        // Sort results if requested
        if (options.sort && options.sort !== 'id') {
          const sortField = options.sort;
          tasks.sort((a, b) => {
            // Handle dates specially
            if (sortField === 'createdAt' || sortField === 'updatedAt') {
              return new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
            }
            // For other fields use string comparison
            const aVal = String(a[sortField] || '');
            const bVal = String(b[sortField] || '');
            return aVal.localeCompare(bVal);
          });
        }
        
        if (tasks.length === 0) {
          console.log('No tasks found matching the criteria');
          repo.close();
          return;
        }
        
        if (format === 'json') {
          console.log(JSON.stringify(tasks, null, 2));
        } else {
          // If explanation is requested, show it first
          if (options.explain && extractedInfo) {
            const { colorize } = getColorFunctions(options.color);
            
            console.log(colorize('Search query analysis:', 'blue', 'bold'));
            console.log(colorize(`Original query: "${options.query}"`, 'green'));
            
            if (extractedInfo.extractedTerms.length > 0) {
              console.log(colorize('Extracted filters:', 'blue'));
              for (const term of extractedInfo.extractedTerms) {
                console.log(`  - ${colorize(term, 'magenta')}`);
              }
            }
            
            if (extractedInfo.query !== options.query) {
              console.log(colorize('Cleaned query: ', 'blue') + 
                          colorize(`"${extractedInfo.query}"`, 'green'));
            }
            
            console.log(colorize(`Fuzzy matching: ${useFuzzy ? 'enabled' : 'disabled'}`, 'blue'));
            
            console.log(); // Empty line before results
          }
          
          console.log(`Found ${tasks.length} matching tasks:`);
          
          // Handle the case where tasks are ranked by similarity
          const hasSimilarityRanking = tasks.some(task => {
            const metadata = typeof task.metadata === 'string' 
              ? JSON.parse(task.metadata) 
              : task.metadata;
            return metadata?.similarityScore !== undefined;
          });
          
          tasks.forEach(task => {
            // Parse metadata if it's a string
            const metadata = typeof task.metadata === 'string' 
              ? JSON.parse(task.metadata) 
              : task.metadata;
              
            // If tasks have similarity scores, show them
            const similarityScore = metadata?.similarityScore;
            let scoreDisplay = '';
            
            if (similarityScore !== undefined) {
              const percentage = Math.round(similarityScore * 100);
              const { colorize } = getColorFunctions(options.color);
              
              // Choose color based on score
              let scoreColor = 'red';
              if (percentage >= 70) scoreColor = 'green';
              else if (percentage >= 40) scoreColor = 'yellow';
              
              // Add visual indicator
              scoreDisplay = ` ${colorize(`[${percentage}%]`, scoreColor)}`;
            }
            
            console.log(`${task.id}.${scoreDisplay} ${task.title} [${task.status}]`);
            console.log(`  Tags: ${task.tags.join(', ') || 'none'}`);
            console.log(`  Readiness: ${task.readiness}`);
            
            if (metadata && Object.keys(metadata).length > 0) {
              // Don't show similarityScore in output
              const displayMetadata = { ...metadata };
              delete displayMetadata.similarityScore;
              
              if (Object.keys(displayMetadata).length > 0) {
                console.log(`  Metadata: ${JSON.stringify(displayMetadata)}`);
              }
            }
            console.log('');
          });
        }
        
        repo.close();
      } catch (error) {
        console.error('Error searching tasks:', error);
        process.exit(1);
      }
    });
  
  return searchCommand;
}

/**
 * Perform a similarity search for tasks
 * @param repo Task repository
 * @param nlpService NLP service
 * @param options Command options
 */
async function performSimilaritySearch(
  repo: TaskRepository, 
  nlpService: NlpService, 
  options: any
): Promise<void> {
  const format = options.format as OutputFormat;
  const { colorize } = getColorFunctions(options.color);
  const useFuzzy = options.fuzzy !== false;
  
  // Perform similarity search
  const similarTasks = await repo.findSimilarTasks(options.similar, useFuzzy);
  
  if (similarTasks.length === 0) {
    console.log('No similar tasks found');
    return;
  }
  
  if (format === 'json') {
    console.log(JSON.stringify(similarTasks, null, 2));
  } else {
    console.log(colorize(`Tasks similar to "${options.similar}":\n`, 'blue', 'bold'));
    console.log(colorize(`Fuzzy matching: ${useFuzzy ? 'enabled' : 'disabled'}`, 'blue'));
    console.log('');
    
    similarTasks.forEach(task => {
      // Get similarity score from metadata
      const metadata = typeof task.metadata === 'string' 
        ? JSON.parse(task.metadata) 
        : task.metadata;
        
      const score = metadata?.similarityScore || 0;
      const percentage = Math.round(score * 100);
      
      // Generate a visual bar based on similarity
      const barLength = Math.round(percentage / 5);
      const bar = '█'.repeat(barLength);
      
      // Color the bar based on similarity
      let barColor = 'red';
      if (percentage >= 70) barColor = 'green';
      else if (percentage >= 40) barColor = 'yellow';
      
      console.log(`${task.id}. ${task.title}`);
      console.log(`  ${colorize('Similarity: ', 'blue')}${colorize(`${percentage}%`, barColor)} ${colorize(bar, barColor)}`);
      console.log(`  Tags: ${task.tags.join(', ') || 'none'}`);
      console.log(`  Status: ${task.status}, Readiness: ${task.readiness}`);
      console.log('');
    });
  }
}

/**
 * Get color functions based on whether colors are enabled
 * @param colorEnabled Whether colors are enabled
 * @returns Color utility functions
 */
function getColorFunctions(colorEnabled: boolean) {
  return {
    colorize: (text: string, color?: string, style?: string) => {
      if (!colorEnabled) return text;
      
      let result = text;
      if (color && (chalk as any)[color]) {
        result = (chalk as any)[color](result);
      }
      if (style && (chalk as any)[style]) {
        result = (chalk as any)[style](result);
      }
      return result;
    }
  };
}