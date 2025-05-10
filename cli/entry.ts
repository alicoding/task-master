#!/usr/bin/env node
import { Command } from 'commander';
import { createAddCommand } from './commands/add/index.js';
import { createShowCommand } from './commands/show/index.js';
import { createUpdateCommand } from './commands/update/index.js';
import { createSearchCommand } from './commands/search/index.js';
import { createNextCommand } from './commands/next/index.js';
import { createRemoveCommand } from './commands/remove/index.js';
import { createMetadataCommand } from './commands/metadata/index.js';
import { createApiCommand } from './commands/api/index.js';
import { createTriageCommand } from './commands/triage/index.js';
import { createDeduplicateCommand } from './commands/deduplicate/index.js';
import { createAiCommand } from './commands/ai/index.js';
import { helpFormatter } from './helpers/help-formatter.js';

async function main() {
  const program = new Command();

  program
    .name('tm')
    .description('Task Master - Structured CLI Task Engine')
    .version('1.0.0');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(program, {
    description: 'Task Master is a powerful, structured CLI task engine for managing tasks with rich metadata, hierarchical relationships, and AI integration. It provides a comprehensive set of commands for creating, organizing, and searching tasks.',
    examples: [
      {
        command: 'tm add --title "Implement login form"',
        description: 'Create a new task'
      },
      {
        command: 'tm show',
        description: 'List all tasks'
      },
      {
        command: 'tm show graph',
        description: 'Show task hierarchy as a tree'
      },
      {
        command: 'tm next',
        description: 'Show the next task to work on'
      },
      {
        command: 'tm search --query "user interface"',
        description: 'Search for tasks matching specific text'
      },
      {
        command: 'tm update --id 5 --status done',
        description: 'Mark a task as completed'
      },
      {
        command: 'tm deduplicate',
        description: 'Find and merge duplicate tasks'
      },
      {
        command: 'tm ai generate-subtasks --id 5',
        description: 'Use AI to generate subtasks'
      }
    ],
    notes: [
      'Task Master offers a complete workflow for task management',
      'Tasks support status (todo, in-progress, done) and readiness (draft, ready, blocked)',
      'Tasks can be organized hierarchically with parent-child relationships',
      'All commands support detailed help with --help flag',
      'Advanced features include metadata management, batch operations, and AI integration',
      'For integration with scripts or AI agents, use the "api" command family',
      'Use the AI commands for task generation, prioritization, and analysis'
    ],
    seeAlso: ['add', 'show', 'update', 'search', 'next', 'metadata', 'api', 'deduplicate', 'ai']
  });
  
  // Add commands
  program.addCommand(createAddCommand());
  program.addCommand(await createShowCommand());
  program.addCommand(await createUpdateCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createNextCommand());
  program.addCommand(createRemoveCommand());
  program.addCommand(createMetadataCommand());
  program.addCommand(createApiCommand());
  program.addCommand(createTriageCommand());
  program.addCommand(createDeduplicateCommand());
  program.addCommand(createAiCommand());
  
  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});