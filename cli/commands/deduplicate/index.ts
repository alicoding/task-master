import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
import { NlpService } from '../../../core/nlp-service';
import { helpFormatter } from '../../helpers/help-formatter';
import { createColorize, getEmptyResultsMessage, getNoTasksMessage, formatJsonOutput } from './lib/utils';
import { findDuplicateGroups } from './lib/finder';
import { displayDuplicateGroups } from './lib/formatter-enhanced';
import { runInteractiveMode, runAutoMergeSuggestions } from './lib/interactive-enhanced';
import { processTasks } from './lib/processor';


/**
 * Define the deduplicate command options
 */
interface DeduplicateCommandOptions {
  minSimilarity: string;
  status?: string;
  tag?: string[];
  limit: string;
  autoMerge?: boolean;
  color: boolean;
  json?: boolean;
  dryRun?: boolean;
  interactive?: boolean;
}

/**
 * Create the deduplicate command for finding and managing duplicate tasks
 */
export function createDeduplicateCommand() {
  const deduplicateCommand = new Command('deduplicate')
    .description('Find and manage duplicate tasks')
    .option('--min-similarity <number>', 'Minimum similarity threshold (0-100)', '50')
    .option('--status <status>', 'Filter by status (todo, in-progress, done)')
    .option('--tag <tags...>', 'Filter by tag')
    .option('--limit <number>', 'Limit the number of task groups to show', '10')
    .option('--auto-merge', 'Automatically suggest merges for highly similar tasks')
    .option('--interactive', 'Run in interactive mode with enhanced UI')
    .option('--no-color', 'Disable colored output')
    .option('--json', 'Output results in JSON format')
    .option('--dry-run', 'Show duplicates without taking action')
    
  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(deduplicateCommand, {
    description: 'Find and manage duplicate tasks using advanced NLP similarity detection. Helps keep your task list clean by identifying potential duplicates and providing options to merge or update them.',
    examples: [
      {
        command: 'tm deduplicate',
        description: 'Find potential duplicate tasks with default settings'
      },
      {
        command: 'tm deduplicate --interactive',
        description: 'Use the interactive mode with enhanced UI'
      },
      {
        command: 'tm deduplicate --min-similarity 70',
        description: 'Find highly similar tasks (70%+ similarity)'
      },
      {
        command: 'tm deduplicate --status todo',
        description: 'Only look for duplicates among todo tasks'
      },
      {
        command: 'tm deduplicate --tag UI --tag API',
        description: 'Find duplicates with specific tags'
      },
      {
        command: 'tm deduplicate --auto-merge',
        description: 'Automatically suggest merges for highly similar tasks'
      },
      {
        command: 'tm deduplicate --dry-run',
        description: 'Show duplicates without taking action'
      }
    ],
    notes: [
      'Uses NLP-enhanced similarity detection to find potential duplicate tasks',
      'Groups tasks by similarity to show the most likely duplicates',
      'Interactive mode provides enhanced UI for reviewing and managing duplicates',
      'Higher min-similarity values (e.g., 80+) find fewer but more certain duplicates',
      'Lower values (e.g., 40-60) find more potential duplicates but with more false positives',
      'The --auto-merge flag will suggest automatic merges for tasks with 80%+ similarity'
    ],
    seeAlso: ['search --similar', 'add', 'update']
  })
    .action(handleDeduplicateCommand);

  return deduplicateCommand;
}

/**
 * Handle the deduplicate command execution
 * @param options Command options
 */
async function handleDeduplicateCommand(options: DeduplicateCommandOptions) {
  try {
    const repo = new TaskRepository();
    const nlpService = new NlpService();
    const minSimilarity = Math.min(100, Math.max(0, parseInt(options.minSimilarity) || 50)) / 100;
    const limit = parseInt(options.limit) || 10;
    const useColors = options.color !== false;
    const jsonOutput = options.json || false;
    const dryRun = options.dryRun || false;
    const autoMerge = options.autoMerge || false;
    const interactive = options.interactive || false;
    
    // Create colorize helper function
    const colorize = createColorize(useColors, jsonOutput);
    
    if (!jsonOutput) {
      console.log(colorize('\n🔍 Scanning for duplicate tasks...', asChalkColor((asChalkColor((asChalkColor('blue'))))), asChalkColor('bold')));
    }
    
    // Get filtered tasks
    const allTasks = await processTasks(repo, nlpService, { 
      status: options.status,
      tag: options.tag
    });
    
    if (allTasks.length === 0) {
      console.log(colorize(getNoTasksMessage(jsonOutput), asChalkColor((asChalkColor((asChalkColor('yellow')))))));
      repo.close();
      return;
    }
    
    // Ensure NLP service is trained
    await nlpService.train();
    
    // Find duplicate groups
    const duplicateGroups = await findDuplicateGroups(allTasks, nlpService, minSimilarity);
    
    // Sort groups by highest similarity
    duplicateGroups.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
    
    // Limit the number of groups
    const limitedGroups = duplicateGroups.slice(0, limit);
    
    if (limitedGroups.length === 0) {
      console.log(colorize(getEmptyResultsMessage(minSimilarity, jsonOutput), asChalkColor((asChalkColor((asChalkColor('green')))))));
      repo.close();
      return;
    }
    
    // Handle JSON output
    if (jsonOutput) {
      console.log(formatJsonOutput(limitedGroups, duplicateGroups.length, minSimilarity, dryRun));
      repo.close();
      return;
    }
    
    // Display duplicate groups with improved UI
    displayDuplicateGroups(limitedGroups, duplicateGroups, colorize);
    
    // Exit if dry run
    if (dryRun) {
      console.log(colorize('\n✅ Dry run complete. No changes made.', asChalkColor((asChalkColor((asChalkColor('blue')))))));
      repo.close();
      return;
    }
    
    // Check if auto-merge is enabled
    if (autoMerge) {
      // Find high similarity groups (80%+)
      const highSimilarityGroups = limitedGroups.filter(group => group.maxSimilarity >= 0.8);
      
      if (highSimilarityGroups.length === 0) {
        console.log(colorize('\nNo groups with 80%+ similarity found for auto-merge.', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
        
        // If in interactive mode, run that instead
        if (interactive) {
          await runInteractiveMode(limitedGroups, repo, colorize);
        }
      } else {
        // Run auto-merge with improved UI
        await runAutoMergeSuggestions(highSimilarityGroups, repo, colorize);
      }
      
      repo.close();
      return;
    }
    
    // If interactive mode is enabled, run enhanced UI
    if (interactive) {
      await runInteractiveMode(limitedGroups, repo, colorize);
      repo.close();
      return;
    }
    
    // Display basic prompt for non-interactive mode
    console.log(colorize('\nTip: Run with --interactive for an enhanced deduplication experience!', asChalkColor((asChalkColor((asChalkColor('blue')))))));
    console.log(colorize('     Use --auto-merge to automatically handle high-similarity duplicates.', asChalkColor((asChalkColor((asChalkColor('blue')))))));
    
    repo.close();
  } catch (error) {
    console?.error('Error in deduplicate command:', error);
    process.exit(1);
  }
}