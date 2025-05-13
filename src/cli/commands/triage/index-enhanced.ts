import { Command } from 'commander';
import { TaskRepository } from '@/core/repo';
import { TaskGraph } from '@/core/graph/index';
import { NlpService } from '@/core/nlp-service-mock';
import fs from 'fs/promises';
import { helpFormatter } from '@/cli/helpers/help-formatter';
import { processPlanWithEnhancedUI } from '@/cli/commands/triage/lib/processor-enhanced';
import { runInteractiveMode } from '@/cli/commands/triage/lib/interactive-enhanced/index';
import { createEmptyResults, createColorize, ProcessingOptions, TriageResults, TriageTask } from '@/cli/commands/triage/lib/utils';

/**
 * Define the triage command options type
 */
interface TriageCommandOptions {
  plan?: string;
  interactive?: boolean;
  similarityThreshold: string;
  dryRun?: boolean;
  format: 'text' | 'json';
  autoMerge?: boolean;
  color: boolean;
  sortBy?: 'status' | 'readiness' | 'created' | 'updated' | 'id';
  filterStatus?: string;
  filterReadiness?: string;
  filterTags?: string;
}

/**
 * Create the enhanced triage command for processing batches of tasks from a plan file
 * or interactively triaging tasks with improved UI
 */
export function createTriageCommand() {
  const triageCommand = new Command('triage')
    .description('Process batches of tasks from a JSON plan file or interactively')
    .option('--plan <file>', 'JSON file containing a task plan to process')
    .option('--interactive', 'Run in interactive mode to triage tasks one by one')
    .option('--similarity-threshold <number>', 'Similarity threshold (0-100)', '50')
    .option('--dry-run', 'Show what would happen without making changes')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--auto-merge', 'Automatically suggest merges for similar tasks')
    .option('--no-color', 'Disable colored output')
    .option('--sort-by <field>', 'Sort tasks by field (status, readiness, created, updated, id)', 'status')
    .option('--filter-status <status>', 'Filter tasks by status (todo, in-progress, done)')
    .option('--filter-readiness <readiness>', 'Filter tasks by readiness (draft, ready, blocked)')
    .option('--filter-tags <tags>', 'Filter tasks by tags (comma-separated)');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(triageCommand, {
    description: 'Process and triage batches of tasks from a structured plan file or interactively with enhanced UI. The triage command analyzes tasks for duplicates, manages task creation and updates, and provides detailed results, helping you maintain a clean and organized task list.',
    examples: [
      {
        command: 'tm triage --interactive',
        description: 'Launch enhanced interactive triage mode to process tasks one by one'
      },
      {
        command: 'tm triage --plan sprint-plan.json',
        description: 'Process and triage tasks from a sprint plan file'
      },
      {
        command: 'tm triage --interactive --sort-by readiness',
        description: 'Interactive mode with tasks sorted by readiness state'
      },
      {
        command: 'tm triage --interactive --filter-status todo',
        description: 'Interactive mode filtering only todo tasks'
      },
      {
        command: 'tm triage --plan generated-tasks.json --dry-run',
        description: 'Preview triage processing without making changes'
      },
      {
        command: 'tm triage --plan ai-generated-plan.json --format json',
        description: 'Process a plan and get structured JSON results'
      },
      {
        command: 'tm triage --interactive --similarity-threshold 70',
        description: 'Interactive mode with higher similarity threshold'
      },
      {
        command: 'tm triage --plan plan.json --auto-merge',
        description: 'Auto-merge similar tasks during processing'
      },
      {
        command: 'tm triage --interactive --filter-tags important,urgent',
        description: 'Interactive mode filtering tasks with specific tags'
      }
    ],
    notes: [
      'Triage mode helps maintain task list quality by preventing duplicates',
      'Interactive mode walks through pending tasks one by one, suggesting actions',
      'Plan file must contain a tasks array: { "tasks": [ {...task1}, {...task2} ] }',
      'Tasks with ID fields are treated as updates to existing tasks',
      'Tasks without ID fields are treated as new tasks to create',
      'The similarity threshold controls how aggressively duplicates are detected',
      'Use filtering and sorting options to focus on specific task subsets',
      'Each task can include:',
      '  - title: The task title (required for new tasks)',
      '  - status: Task status (todo, in-progress, done)',
      '  - readiness: Task readiness (draft, ready, blocked)',
      '  - tags: Array of task tags',
      '  - force: Boolean to force creation even if duplicates exist',
      '  - parentId/childOf: Parent task ID for hierarchical relationship',
      '  - metadata: JSON object with additional task data'
    ],
    seeAlso: ['add', 'update', 'deduplicate', 'api batch', 'api import']
  })
    .action(handleTriageCommand);

  return triageCommand;
}

/**
 * Handle the triage command execution
 * @param options Command options
 */
async function handleTriageCommand(options: TriageCommandOptions) {
  try {
    // Create repo and other services
    const repo = new TaskRepository();
    const graph = new TaskGraph(repo);
    const nlpService = new NlpService();
    const useColors = options.color !== false;
    const jsonOutput = options.format === 'json';
    const dryRun = options.dryRun || false;
    const autoMerge = options.autoMerge || false;
    const similarityThreshold = Math.min(100, Math.max(0, parseInt(options.similarityThreshold) || 50)) / 100;

    // Train the NLP service for similarity detection
    await nlpService.train();

    // Create colorize helper function
    const colorize = createColorize(useColors, jsonOutput);

    // Define result structure
    const results = createEmptyResults();

    // Check if we're in interactive mode
    if (options.interactive) {
      if (!jsonOutput) {
        // Use the enhanced interactive mode UI
        // The header is now part of the interactive mode implementation
      }

      await runInteractiveMode(repo, nlpService, results, {
        dryRun,
        similarityThreshold,
        autoMerge,
        colorize,
        jsonOutput
      });
    }
    // Plan file mode
    else if (options.plan) {
      await processPlanFileMode(options.plan, repo, nlpService, results, {
        dryRun,
        similarityThreshold,
        autoMerge,
        colorize,
        jsonOutput
      });
    } else {
      handleMissingModeError(jsonOutput, colorize, repo);
      return;
    }

    // Output results
    outputResults(results, dryRun, similarityThreshold, jsonOutput, colorize);

    // Close the repository
    repo.close();
  } catch (error: unknown) {
    console.error('Error in triage command:', error);
    process.exit(1);
  }
}

/**
 * Process tasks from a plan file using enhanced processor
 * @param planFile Path to plan file
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
async function processPlanFileMode(
  planFile: string,
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize, jsonOutput } = options;

  // Read and parse the plan file
  const fileContent = await fs.readFile(planFile, 'utf-8');
  const plan = JSON.parse(fileContent);

  // Check plan structure
  if (!plan.tasks || !Array.isArray(plan.tasks)) {
    console.error('Invalid plan format. Expected a "tasks" array.');
    return;
  }

  if (!jsonOutput) {
    // The enhanced processor has its own header now
  }

  // Process the batch of tasks using enhanced UI
  await processPlanWithEnhancedUI(plan.tasks, repo, nlpService, results, options);
}

/**
 * Handle missing mode error (no --plan or --interactive)
 * @param jsonOutput Whether JSON output is enabled
 * @param colorize Color function
 * @param repo Task repository to close
 */
function handleMissingModeError(
  jsonOutput: boolean,
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string,
  repo: TaskRepository
) {
  if (jsonOutput) {
    console.log(JSON.stringify({
      error: 'Either --plan or --interactive option must be specified'
    }));
  } else {
    console.error(colorize('Error: Either --plan or --interactive option must be specified', asChalkColor('red')));
    console.log('Run "tm triage --help" for usage information');
  }
  repo.close();
}

/**
 * Output results of triage operation with enhanced formatting
 * @param results Results to output
 * @param dryRun Whether this was a dry run
 * @param similarityThreshold Similarity threshold used
 * @param jsonOutput Whether JSON output is enabled
 * @param colorize Color function
 */
function outputResults(
  results: TriageResults,
  dryRun: boolean,
  similarityThreshold: number,
  jsonOutput: boolean,
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  // Output results based on format
  if (jsonOutput) {
    console.log(JSON.stringify({
      status: 'completed',
      dry_run: dryRun,
      similarity_threshold: similarityThreshold,
      results
    }, null, 2));
  } else {
    // Enhanced results presentation
    console.log(colorize('\n┌' + '─'.repeat(60) + '┐', asChalkColor('blue')));
    console.log(colorize('│ TRIAGE RESULTS SUMMARY', asChalkColor('blue'), asChalkColor('bold')) + colorize(' '.repeat(39) + '│', asChalkColor('blue')));
    console.log(colorize('└' + '─'.repeat(60) + '┘', asChalkColor('blue')));
    
    console.log('');
    console.log(`  ${colorize('✓', asChalkColor('green'))} ${colorize('Tasks added:', asChalkColor('white'), asChalkColor('bold'))}    ${colorize(results.added.length.toString(), asChalkColor('green'))}`);
    console.log(`  ${colorize('✓', asChalkColor('yellow'))} ${colorize('Tasks updated:', asChalkColor('white'), asChalkColor('bold'))}  ${colorize(results.updated.length.toString(), asChalkColor('yellow'))}`);
    console.log(`  ${colorize('✓', asChalkColor('magenta'))} ${colorize('Tasks merged:', asChalkColor('white'), asChalkColor('bold'))}   ${colorize(results.merged.length.toString(), asChalkColor('magenta'))}`);
    console.log(`  ${colorize('⊘', asChalkColor('gray'))} ${colorize('Tasks skipped:', asChalkColor('white'), asChalkColor('bold'))}  ${colorize(results.skipped.length.toString(), asChalkColor('gray'))}`);
    console.log(`  ${results.errors.length > 0 ? colorize('✗', asChalkColor('red')) : colorize('✓', asChalkColor('green'))} ${colorize('Errors:', asChalkColor('white'), asChalkColor('bold'))}        ${results.errors.length > 0 ? colorize(results.errors.length.toString(), asChalkColor('red')) : colorize('0', asChalkColor('green'))}`);

    // Generate progress bars for visual representation
    const total = results.added.length + results.updated.length + results.merged.length + results.skipped.length;
    
    if (total > 0) {
      const addedPct = Math.floor((results.added.length / total) * 40);
      const updatedPct = Math.floor((results.updated.length / total) * 40);
      const mergedPct = Math.floor((results.merged.length / total) * 40);
      const skippedPct = Math.floor((results.skipped.length / total) * 40);
      
      console.log('\n  Task Distribution:');
      
      // Draw percentage bars
      console.log(`  ${colorize('█'.repeat(addedPct), asChalkColor('green'))}${colorize('█'.repeat(updatedPct), asChalkColor('yellow'))}${colorize('█'.repeat(mergedPct), asChalkColor('magenta'))}${colorize('█'.repeat(skippedPct), asChalkColor('gray'))}${' '.repeat(Math.max(0, 40 - addedPct - updatedPct - mergedPct - skippedPct))}`);
      
      // Legend
      console.log(`  ${colorize('■', asChalkColor('green'))} Added  ${colorize('■', asChalkColor('yellow'))} Updated  ${colorize('■', asChalkColor('magenta'))} Merged  ${colorize('■', asChalkColor('gray'))} Skipped`);
    }

    if (results.errors.length > 0) {
      console.log(colorize('\nErrors:', asChalkColor('red'), asChalkColor('bold')));
      results.errors.forEach((err: string, i: number) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    if (dryRun) {
      console.log(colorize('\n✅ Dry run completed. No changes were made.', asChalkColor('green'), asChalkColor('bold')));
    } else {
      console.log(colorize('\n✅ Triage completed successfully.', asChalkColor('green'), asChalkColor('bold')));
    }
  }
}

// Import necessary types
import { ChalkColor, ChalkStyle } from '@/cli/commands/triage/lib/utils';
import { asChalkColor } from "@/cli/utils/chalk-utils";
