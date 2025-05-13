import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

// Simplified screen system for initial testing
enum Screen {
  MAIN_MENU = 'MAIN_MENU',
  HELP = 'HELP',
  SETTINGS = 'SETTINGS',
}

/**
 * Main App component with simplified routing
 */
const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.MAIN_MENU);

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape) {
      // Go back to main menu
      setCurrentScreen(Screen.MAIN_MENU);
    } else if (input === 'h') {
      // Show help
      setCurrentScreen(Screen.HELP);
    } else if (input === 's') {
      // Show settings
      setCurrentScreen(Screen.SETTINGS);
    }
  });

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.MAIN_MENU:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Task Master Main Menu</Text>
            <Box marginTop={1}>
              <Text>Press <Text color="green" bold>h</Text> for help, <Text color="cyan" bold>s</Text> for settings</Text>
            </Box>
            <Box marginTop={2} flexDirection="column">
              <Text>Welcome to the interactive Task Master interface!</Text>
              <Text>Navigate through different screens to manage your tasks.</Text>
            </Box>
          </Box>
        );

      case Screen.HELP:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Help</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>• Press <Text color="green" bold>h</Text> to view this help screen</Text>
              <Text>• Press <Text color="cyan" bold>s</Text> to access settings</Text>
              <Text>• Press <Text color="yellow" bold>Esc</Text> to return to the main menu</Text>
            </Box>
          </Box>
        );

      case Screen.SETTINGS:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Settings</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>Here you can configure your Task Master settings.</Text>
              <Text>Press <Text color="yellow" bold>Esc</Text> to return to the main menu</Text>
            </Box>
          </Box>
        );

      default:
        return <Text>Unknown screen</Text>;
    }
  };

  return (
    <Box flexDirection="column" borderStyle="classic" padding={1}>
      {renderScreen()}

      <Box marginTop={1} borderStyle="classic" borderColor="gray" padding={1}>
        <Text dimColor>Press Esc to return to main menu | Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};

export default App;