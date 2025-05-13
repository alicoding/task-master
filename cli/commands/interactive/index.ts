import { Command } from 'commander';
import { helpFormatter } from '../../helpers/help-formatter';

/**
 * Create the interactive command
 */
export function createInteractiveCommand(): Command {
  const interactiveCommand = new Command('interactive')
    .description('Launch interactive terminal UI for Task Master')
    .alias('ui')
    .option('--debug', 'Enable debug mode', false)
    .action(async (options) => {
      try {
        console.log('Launching interactive UI...');
        if (options.debug) {
          console.log('Debug mode enabled');
        }

        // Make sure React is properly initialized
        console.log('Setting up React environment...');

        // Import React and ensure it's loaded
        const React = await import('react');
        console.log('React version:', React.version);

        // Dynamically import the interactive UI
        console.log('Loading interactive UI components...');
        const { default: run } = await import('../../ui/index');

        // Run the interactive UI
        console.log('Rendering interactive UI...');
        await run();
      } catch (error) {
        console?.error('Failed to launch interactive UI:');
        console?.error(error);
        process.exit(1);
      }
    });
    
  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(interactiveCommand, {
    description: 'Launch a rich, interactive terminal UI for Task Master with full navigation controls, visual styling, and a comprehensive menu system.',
    examples: [
      {
        command: 'tm interactive',
        description: 'Launch the interactive UI'
      },
      {
        command: 'tm ui',
        description: 'Short alias for the interactive command'
      },
      {
        command: 'tm ui --debug',
        description: 'Launch the interactive UI in debug mode'
      }
    ],
    notes: [
      'The interactive UI provides a more sophisticated terminal experience',
      'Features include full navigation, visual styling, keyboard shortcuts, and more',
      'Use arrow keys to navigate, Tab to cycle through options, Enter to select',
      'Press Ctrl+H at any time to view help and keyboard shortcuts',
      'Press Ctrl+Q to return to the main menu from anywhere',
      'Press Esc to go back or cancel current operation'
    ]
  });
  
  return interactiveCommand;
}

export default createInteractiveCommand;