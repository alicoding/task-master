#!/usr/bin/env node
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { createAddCommand } from '@/cli/commands/add/index';
import { createShowCommand } from '@/cli/commands/show/index';
import { createUpdateCommand } from '@/cli/commands/update/index';
import { createSearchCommand } from '@/cli/commands/search/index';
import { createNextCommand } from '@/cli/commands/next/index';
import { createRemoveCommand } from '@/cli/commands/remove/index';
import { createMetadataCommand } from '@/cli/commands/metadata/index';
import { createApiCommand } from '@/cli/commands/api/index';
import { createTriageCommand } from '@/cli/commands/triage/index';
import { createDeduplicateCommand } from '@/cli/commands/deduplicate/index';
import { createAiCommand } from '@/cli/commands/ai/index';
import { createEnhancedMapCommand } from '@/cli/commands/map/index-enhanced';
import { createNlpProfileCommand } from '@/cli/commands/nlp-profile/index';
import createDoDCommand from '@/cli/commands/dod/index';
import { createSubtasksCommand } from '@/cli/commands/subtasks/index';
import { createSetupCommand } from '@/cli/commands/setup/index';
import { createWizardCommand } from '@/cli/commands/wizard/index';
import { helpFormatter } from '@/cli/helpers/help-formatter';
import { RepositoryFactory } from '@/core/repository/factory';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config();

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
        command: 'tm setup --ai',
        description: 'Configure AI providers interactively'
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
        command: 'tm dod check 5',
        description: 'Check Definition of Done requirements for a task'
      },
      {
        command: 'tm interactive',
        description: 'Launch rich, interactive terminal UI'
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
      'Use the AI commands for task generation, prioritization, and analysis',
      'For a rich, interactive user experience, use the "interactive" or "ui" command'
    ],
    seeAlso: ['add', 'show', 'update', 'search', 'next', 'metadata', 'api', 'deduplicate', 'setup', 'ai', 'map', 'dod', 'subtasks', 'nlp-profile', 'interactive', 'ui']
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
  // Add subtasks command - will be accessible as 'tm subtasks'
  program.addCommand(createSubtasksCommand());
  // Add setup command - will be accessible as 'tm setup'
  program.addCommand(createSetupCommand());
  // Add wizard command - this is the default command when no args are provided
  program.addCommand(createWizardCommand());

  try {
    // Check if a command was provided
    const hasCommand = process.argv.length > 2 && !process.argv[2].startsWith('-');

    if (!hasCommand) {
      // No command provided, run the wizard
      console.log('Welcome to Task Master!');
      await program.parseAsync(['node', 'tm', 'wizard']);
    } else {
      // Parse normal command
      await program.parseAsync(process.argv);
    }

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