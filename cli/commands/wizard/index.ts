import { Command } from 'commander';
import { helpFormatter } from '../../helpers/help-formatter';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Create the wizard command - the main entry point for Task Master
 */
export function createWizardCommand(): Command {
  // This is a hidden command that's executed when no command is specified
  const wizardCommand = new Command('wizard')
    .description('Task Master Wizard - Interactive interface for task management')
    .option('--setup-only', 'Run only the setup portion of the wizard', false)
    .option('--debug', 'Enable debug mode', false)
    .action(async (options) => {
      try {
        console.log('Starting Task Master Wizard...');
        
        // Check if this is a first-time run
        const isFirstRun = !doesConfigExist();
        
        if (isFirstRun) {
          console.log('Welcome to Task Master! Let\'s get you set up.');
        } else if (options.setupOnly) {
          console.log('Running setup wizard...');
        } else {
          console.log('Welcome back to Task Master!');
        }
        
        // For first-time users or when setup-only is specified, run setup flow
        if (isFirstRun || options.setupOnly) {
          await runSetupFlow(options);
        } else {
          // For returning users, launch the main interface
          await runMainInterface(options);
        }
      } catch (error) {
        console?.error('An error occurred in the Task Master Wizard:');
        console?.error(error);
        process.exit(1);
      }
    });
  
  // Deliberately keep this command hidden from help to avoid confusion
  wizardCommand.hidden = true;
  
  return wizardCommand;
}

/**
 * Check if configuration exists
 */
function doesConfigExist(): boolean {
  // Check for .env file
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  
  // Check if database exists
  let dbPath = process.env.DB_PATH;
  if (!dbPath) {
    // Try to find it in .env file if it exists
    if (envExists) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DB_PATH=(.+)/);
        if (match && match[1]) {
          dbPath = match[1];
        }
      } catch (error) {
        // Ignore errors reading .env
      }
    }
    
    // Default path
    if (!dbPath) {
      dbPath = path.join(process.cwd(), 'db', 'taskmaster.db');
    }
  }
  
  const dbExists = fs.existsSync(dbPath);
  
  // Consider configuration to exist if both .env and database exist
  return envExists && dbExists;
}

/**
 * Run the setup flow for first-time users
 */
async function runSetupFlow(options: any): Promise<void> {
  console.log('Setting up Task Master...');
  
  try {
    if (options.debug) {
      console.log('Debug mode enabled');
    }
    
    // Import React for UI components
    const React = await import('react');
    console.log('React version:', React.version);
    
    // Import the setup UI
    console.log('Loading setup UI components...');
    
    // We'll use the ui/setup.tsx module which will contain the setup UI
    const { default: runSetup } = await import('../../ui/setup.tsx');
    
    // Run the setup UI
    console.log('Starting setup wizard...');
    await runSetup();
    
    console.log('Setup completed successfully!');
  } catch (error) {
    console?.error('Failed to run setup:');
    console?.error(error);
    process.exit(1);
  }
}

/**
 * Run the main interface for returning users
 */
async function runMainInterface(options: any): Promise<void> {
  console.log('Loading Task Master interface...');
  
  try {
    if (options.debug) {
      console.log('Debug mode enabled');
    }
    
    // Import React for UI components
    const React = await import('react');
    console.log('React version:', React.version);
    
    // Import the main UI
    console.log('Loading UI components...');
    
    // We'll use the ui/index.tsx module which will contain the main UI
    const { default: runUI } = await import('../../ui/index.tsx');
    
    // Run the main UI
    console.log('Starting Task Master interface...');
    await runUI();
  } catch (error) {
    console?.error('Failed to launch interface:');
    console?.error(error);
    process.exit(1);
  }
}

export default createWizardCommand;