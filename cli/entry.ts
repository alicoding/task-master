#!/usr/bin/env node
import { Command } from 'commander';
import { createAddCommand } from './commands/add/index.ts';
import { createShowCommand } from './commands/show/index.ts';
import { createUpdateCommand } from './commands/update/index.ts';
import { createSearchCommand } from './commands/search/index.ts';
import { createNextCommand } from './commands/next/index.ts';
import { createRemoveCommand } from './commands/remove/index.ts';
import { createMetadataCommand } from './commands/metadata/index.ts';
import { createApiCommand } from './commands/api/index.ts';
import { createTriageCommand } from './commands/triage/index.ts';
import { createDeduplicateCommand } from './commands/deduplicate/index.ts';
import { createAiCommand } from './commands/ai/index.ts';
import { createEnhancedMapCommand } from './commands/map/index-enhanced.ts';
import { createNlpProfileCommand } from './commands/nlp-profile/index.ts';
import registerDaemonCommand from './commands/daemon/index.ts';
import createDoDCommand from './commands/dod/index.ts';
import { createTerminalCommand } from './commands/terminal/index.ts';
import { createSubtasksCommand } from './commands/subtasks/index.ts';
import { helpFormatter } from './helpers/help-formatter.ts';
import { RepositoryFactory } from '../core/repository/factory.ts';

// Global registry of open connections to ensure cleanup on exit
const openConnections: Set<{ close: () => void }> = new Set();

// Register connection for cleanup
export function registerConnection(connection: { close: () => void }) {
  openConnections.add(connection);
}

// Close all registered connections
export function closeAllConnections() {
  for (const connection of openConnections) {
    try {
      connection.close();
    } catch (error) {
      // Ignore errors while closing
    }
  }
  openConnections.clear();

  // Reset the repository factory as well
  try {
    RepositoryFactory.reset();
  } catch (error) {
    // Ignore errors
  }
}

// Add process termination handlers
process.on('exit', () => {
  closeAllConnections();
});

process.on('SIGINT', () => {
  console.log('\nExiting Task Master...');
  closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nTerminating Task Master...');
  closeAllConnections();
  process.exit(0);
});

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
      },
      {
        command: 'tm map',
        description: 'Discover and visualize task capabilities with progress tracking'
      },
      {
        command: 'tm daemon start',
        description: 'Start the file tracking daemon for automatic task-code tracking'
      },
      {
        command: 'tm dod check 5',
        description: 'Check Definition of Done requirements for a task'
      },
      {
        command: 'tm terminal status',
        description: 'Show terminal integration status and session information'
      },
      {
        command: 'tm terminal task 5',
        description: 'Set current task for terminal session'
      }
    ],
    notes: [
      'Task Master offers a complete workflow for task management',
      'Tasks support status (todo, in-progress, done) and readiness (draft, ready, blocked)',
      'Tasks can be organized hierarchically with parent-child relationships',
      'Definition of Done (DoD) helps maintain quality standards for tasks',
      'All commands support detailed help with --help flag',
      'Advanced features include metadata management, batch operations, and AI integration',
      'For integration with scripts or AI agents, use the "api" command family',
      'Use the AI commands for task generation, prioritization, and analysis'
    ],
    seeAlso: ['add', 'show', 'update', 'search', 'next', 'metadata', 'api', 'deduplicate', 'ai', 'map', 'daemon', 'dod', 'terminal', 'subtasks', 'nlp-profile']
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
  program.addCommand(await createEnhancedMapCommand());
  program.addCommand(createNlpProfileCommand());
  // Add DoD command - will be accessible as 'tm dod'
  program.addCommand(createDoDCommand());
  // Add terminal command - will be accessible as 'tm terminal' or 'tm term'
  program.addCommand(createTerminalCommand());
  // Add subtasks command - will be accessible as 'tm subtasks'
  program.addCommand(createSubtasksCommand());
  registerDaemonCommand(program);

  try {
    await program.parseAsync(process.argv);
    // Ensure we exit cleanly after command execution
    // Give a small timeout to allow any async operations to complete
    setTimeout(() => {
      closeAllConnections();
      process.exit(0);
    }, 100);
  } catch (err) {
    console.error('Error:', err);
    closeAllConnections();
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  closeAllConnections();
  process.exit(1);
});