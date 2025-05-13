/**
 * Setup Command
 * Provides interactive setup wizards for Task Master configuration
 */

import { Command } from 'commander';
import { helpFormatter } from '@/cli/helpers/help-formatter';
import { setupAiConfiguration } from '@/cli/commands/setup/ai-config';
import { setupDbConfiguration } from '@/cli/commands/setup/db-config';
import { setupNewProject } from '@/cli/commands/setup/project-init';
import { runConfigurationValidation } from '@/cli/commands/setup/config-validator';
import { runConnectionTest } from '@/cli/commands/setup/connection-tester';
import * as p from '@clack/prompts';
import chalk from 'chalk';

/**
 * Create the setup command
 */
export function createSetupCommand(): Command {
  const setupCommand = new Command('setup')
    .description('Interactive setup for Task Master configuration')
    .option('--ai', 'Configure AI providers only', false)
    .option('--db', 'Configure database settings only', false)
    .option('--init', 'Initialize a new Task Master project', false)
    .option('--dir <path>', 'Directory for the new project (with --init)')
    .option('--validate', 'Validate current configuration', false)
    .option('--fix', 'Fix issues found during validation', false)
    .option('--test-connection [provider]', 'Test AI provider connection with detailed diagnostics')
    .option('--export [sections]', 'Export configuration to a file')
    .option('--import [sections]', 'Import configuration from a file')
    .option('--force', 'Force reconfiguration even if settings already exist', false);

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(setupCommand, {
    description: 'Interactive setup wizard for configuring Task Master. This command guides you through the setup process for different components of Task Master, including AI provider configuration.',
    examples: [
      {
        command: 'tm setup',
        description: 'Launch the full interactive setup wizard'
      },
      {
        command: 'tm setup --ai',
        description: 'Only configure AI providers'
      },
      {
        command: 'tm setup --db',
        description: 'Only configure database settings'
      },
      {
        command: 'tm setup --init',
        description: 'Initialize a new Task Master project'
      },
      {
        command: 'tm setup --init --dir /path/to/project',
        description: 'Initialize a new project in the specified directory'
      },
      {
        command: 'tm setup --validate',
        description: 'Validate current configuration and report issues'
      },
      {
        command: 'tm setup --validate --fix',
        description: 'Validate configuration and fix auto-fixable issues'
      },
      {
        command: 'tm setup --test-connection',
        description: 'Test AI provider connection with detailed diagnostics'
      },
      {
        command: 'tm setup --test-connection openai',
        description: 'Test connection to a specific AI provider'
      },
      {
        command: 'tm setup --export',
        description: 'Export configuration to a file'
      },
      {
        command: 'tm setup --export ai,db',
        description: 'Export only AI and database configuration'
      },
      {
        command: 'tm setup --import',
        description: 'Import configuration from a file'
      },
      {
        command: 'tm setup --import ai',
        description: 'Import only AI configuration'
      },
      {
        command: 'tm setup --force',
        description: 'Force reconfiguration even if settings already exist'
      }
    ],
    notes: [
      'The setup wizard creates or modifies the .env file in your Task Master installation directory',
      'You can re-run this command at any time to update your configuration',
      'Use --force to reconfigure settings that are already set',
      'Automatic backup of your .env file is created before making changes',
      'Use --init to create a new Task Master project with all necessary files and configurations',
      'Use --validate to check your configuration for issues and inconsistencies',
      'Use --fix with --validate to automatically fix common issues',
      'Use --test-connection to test your AI provider connection with detailed diagnostics',
      'Use --export to save your configuration to a portable JSON file',
      'Use --import to apply configuration from a previously exported file',
      'Specify sections with --export or --import (e.g., --export ai,db) to limit what\'s exported/imported'
    ],
    seeAlso: ['ai test-connection', 'db:init', 'db:migrate']
  });

  setupCommand.action(async (options) => {
    p.intro(`${chalk.blue.bold('Task Master Setup')} ${chalk.dim('v1.0.0')}`);

    try {
      if (options.export !== undefined) {
        // Export configuration
        const { exportConfiguration } = await import("@/cli/commands/setup/config-export-import");

        // Parse sections if provided
        const sections = typeof options.export === 'string'
          ? options.export.split(',').map(s => s.trim())
          : undefined;

        await exportConfiguration(options.force, sections);
      } else if (options.import !== undefined) {
        // Import configuration
        const { importConfiguration } = await import("@/cli/commands/setup/config-export-import");

        // Parse sections if provided
        const sections = typeof options.import === 'string'
          ? options.import.split(',').map(s => s.trim())
          : undefined;

        await importConfiguration(options.force, sections);
      } else if (options.testConnection !== undefined) {
        // Test AI provider connection with detailed diagnostics
        const providerType = typeof options.testConnection === 'string' ? options.testConnection : undefined;
        await runConnectionTest(providerType);
      } else if (options.validate) {
        // Run configuration validation
        await runConfigurationValidation(options.fix);
      } else if (options.init) {
        // Initialize a new project
        await setupNewProject(options.dir);
      } else if (options.ai) {
        // Only run AI configuration with header
        await setupAiConfiguration(options.force);
      } else if (options.db) {
        // Only run database configuration
        await setupDbConfiguration(options.force);
      } else {
        // Run the full setup wizard
        const message = `Welcome to the ${chalk.blue(('Task Master' as string))} setup wizard. This will help you configure your installation.`;
        p.note(message, 'Getting Started');
        
        // Ask if they want to initialize a new project, configure existing, or validate
        const setupMode = await p.select({
          message: 'What would you like to do?',
          options: [
            { value: 'configure', label: 'Configure existing installation', hint: 'Set up AI providers, database, etc.' },
            { value: 'init', label: 'Initialize new project', hint: 'Create a new Task Master project' },
            { value: 'validate', label: 'Validate configuration', hint: 'Check for issues and inconsistencies' },
            { value: 'test', label: 'Test AI connection', hint: 'Test provider connection with diagnostics' },
            { value: 'export', label: 'Export configuration', hint: 'Save settings to a portable file' },
            { value: 'import', label: 'Import configuration', hint: 'Load settings from a file' }
          ],
          initialValue: 'configure'
        });
        
        // Handle cancellation
        if (p.isCancel(setupMode)) {
          p.cancel('Setup cancelled');
          process.exit(0);
        }
        
        if (setupMode === 'init') {
          // Initialize a new project
          await setupNewProject();
        } else if (setupMode === 'validate') {
          // Ask if they want to fix issues
          const fixIssues = await p.confirm({
            message: 'Would you like to automatically fix issues when possible?',
            initialValue: true
          });

          // Handle cancellation
          if (p.isCancel(fixIssues)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }

          // Run validation
          await runConfigurationValidation(fixIssues);
        } else if (setupMode === 'test') {
          // Run connection test
          await runConnectionTest();
        } else if (setupMode === 'export') {
          // Export configuration
          const { exportConfiguration } = await import("@/cli/commands/setup/config-export-import");

          // Ask which sections to export
          const sections = await p.multiselect({
            message: 'Which configuration sections would you like to export?',
            options: [
              { value: 'ai', label: 'AI Configuration', hint: 'Provider, model, settings' },
              { value: 'database', label: 'Database Configuration', hint: 'Path, migrations, backups' },
              { value: 'general', label: 'General Settings', hint: 'Other configuration options' }
            ],
            initialValues: ['ai', 'database', 'general'],
            required: true
          });

          // Handle cancellation
          if (p.isCancel(sections)) {
            p.cancel('Export cancelled');
            process.exit(0);
          }

          // Ask about including secrets
          const includeSecrets = await p.confirm({
            message: 'Include sensitive information like API keys?',
            initialValue: false
          });

          // Handle cancellation
          if (p.isCancel(includeSecrets)) {
            p.cancel('Export cancelled');
            process.exit(0);
          }

          // Run export
          await exportConfiguration(includeSecrets, sections);
        } else if (setupMode === 'import') {
          // Import configuration
          const { importConfiguration } = await import("@/cli/commands/setup/config-export-import");

          // Ask if they want to overwrite existing values
          const overwriteExisting = await p.confirm({
            message: 'Overwrite existing configuration values?',
            initialValue: false,
            help: 'If set to No, you will be prompted for each conflict'
          });

          // Handle cancellation
          if (p.isCancel(overwriteExisting)) {
            p.cancel('Import cancelled');
            process.exit(0);
          }

          // Run import
          await importConfiguration(overwriteExisting);
        } else {
          // Configuration options
          const setupOptions = await p.multiselect({
            message: 'Which components would you like to configure?',
            options: [
              { value: 'ai', label: 'AI Providers', hint: 'OpenAI, Claude, etc.' },
              { value: 'db', label: 'Database Settings', hint: 'Location, backups, migrations' }
            ],
            initialValues: ['ai', 'db'],
            required: true
          });
          
          // Handle cancellation
          if (p.isCancel(setupOptions)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }
          
          // Run selected configuration wizards
          if (setupOptions.includes('ai')) {
            await setupAiConfiguration(options.force);
          }
          
          if (setupOptions.includes('db')) {
            await setupDbConfiguration(options.force);
          }
          
          // Offer to validate configuration
          const validateAfter = await p.confirm({
            message: 'Would you like to validate your configuration?',
            initialValue: true
          });
          
          // Handle cancellation
          if (p.isCancel(validateAfter)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }
          
          if (validateAfter) {
            await runConfigurationValidation(false);
          }
          
          p.note('Setup complete! You can re-run this wizard at any time with: tm setup', 'Success');
        }
      }
    } catch (error) {
      p.cancel(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    } finally {
      p.outro('Thank you for using Task Master!');
    }
  });

  return setupCommand;
}