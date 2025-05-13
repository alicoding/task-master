#!/usr/bin/env node
import { Command } from 'commander';
import { createTriageCommand } from '@/cli/commands/triage/index';
import { helpFormatter } from '@/cli/helpers/help-formatter';

// This is a simplified entry point that only includes the triage command
// to avoid dependency issues with the NLP libraries

async function main() {
  const program = new Command();

  program
    .name('tm-triage')
    .description('Task Master Triage Command')
    .version('1.0.0');

  // Add the triage command
  program.addCommand(createTriageCommand());

  // Parse arguments
  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});