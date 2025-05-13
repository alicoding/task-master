import { Command } from 'commander';
import { helpFormatter } from '../../helpers/help-formatter';
import { handleSearchCommand } from './search-handler';

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
    .action(async (options) => await handleSearchCommand(options));

  return searchCommand;
}

