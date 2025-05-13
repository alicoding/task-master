import React from 'react';
import { render, Box, Text, useInput } from 'ink';

// Main UI sections
enum Section {
  DASHBOARD = 'dashboard',
  TASKS = 'tasks',
  SETTINGS = 'settings',
  TERMINAL = 'terminal',
  HELP = 'help'
}

interface AppProps {
  initialState?: {
    activeSection?: string;
  };
}

/**
 * Main Task Master UI App
 */
const App: React.FC<AppProps> = ({ initialState = {} }) => {
  // Use initialSection if provided
  const initialSection = initialState.activeSection ?
    (initialState.activeSection as Section) :
    Section.DASHBOARD;

  const [activeSection, setActiveSection] = React.useState<Section>(initialSection);
  
  // Handle keyboard navigation
  useInput((input, key) => {
    if (input === 'd') {
      setActiveSection(Section.DASHBOARD);
    } else if (input === 't') {
      setActiveSection(Section.TASKS);
    } else if (input === 's') {
      setActiveSection(Section.SETTINGS);
    } else if (input === 'r') {
      setActiveSection(Section.TERMINAL);
    } else if (input === 'h' || (key.ctrl && input === 'h')) {
      setActiveSection(Section.HELP);
    } else if (key.escape) {
      setActiveSection(Section.DASHBOARD);
    } else if (input === 'q' && key.ctrl) {
      process.exit(0);
    }
  });
  
  // Render active section
  const renderSection = () => {
    switch (activeSection) {
      case Section.DASHBOARD:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Dashboard</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>You have 3 tasks in progress.</Text>
              <Text>Next task: <Text color="cyan">Implement login form</Text></Text>
            </Box>
          </Box>
        );

      case Section.TASKS:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Tasks</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>• <Text color="yellow">[ IN PROGRESS ]</Text> Implement login form</Text>
              <Text>• <Text color="yellow">[ IN PROGRESS ]</Text> Add dark mode</Text>
              <Text>• <Text color="yellow">[ IN PROGRESS ]</Text> Fix navigation bug</Text>
              <Text>• <Text color="blue">[ TODO ]</Text> Update documentation</Text>
              <Text>• <Text color="green">[ DONE ]</Text> Setup project structure</Text>
            </Box>
          </Box>
        );

      case Section.TERMINAL:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Terminal Integration</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>Active Terminal Sessions:</Text>
              <Box marginTop={1} borderStyle="classic" padding={1}>
                <Text>• Session ID: <Text color="cyan">ts_a1b2c3d4</Text></Text>
                <Text>  Status: <Text color="green">Active</Text></Text>
                <Text>  Started: <Text color="cyan">2025-05-12 14:30:00</Text></Text>
                <Text>  Current Task: <Text color="yellow">Implement login form</Text></Text>
              </Box>

              <Box marginTop={2} flexDirection="column">
                <Text bold>Time Windows:</Text>
                <Box marginY={1} borderStyle="classic" padding={1}>
                  <Text>• Window ID: <Text color="cyan">tw_1234</Text></Text>
                  <Text>  Duration: <Text color="cyan">2h 15m</Text></Text>
                  <Text>  Type: <Text color="green">Work</Text></Text>
                </Box>
              </Box>

              <Box marginTop={2} flexDirection="column">
                <Text>Press <Text color="green" bold>Enter</Text> to manage sessions</Text>
                <Text>Press <Text color="green" bold>Tab</Text> to manage time windows</Text>
              </Box>
            </Box>
          </Box>
        );

      case Section.SETTINGS:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Settings</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>• Database: <Text color="cyan">db/taskmaster.db</Text></Text>
              <Text>• AI Provider: <Text color="cyan">Mock Provider</Text></Text>
              <Text>• Theme: <Text color="cyan">Default</Text></Text>
            </Box>
          </Box>
        );

      case Section.HELP:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Help</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>• Press <Text color="green" bold>d</Text> to view Dashboard</Text>
              <Text>• Press <Text color="green" bold>t</Text> to manage Tasks</Text>
              <Text>• Press <Text color="green" bold>r</Text> to view Terminal Sessions</Text>
              <Text>• Press <Text color="green" bold>s</Text> to access Settings</Text>
              <Text>• Press <Text color="green" bold>h</Text> to view this Help</Text>
              <Text>• Press <Text color="green" bold>Esc</Text> to return to Dashboard</Text>
              <Text>• Press <Text color="green" bold>Ctrl+Q</Text> to exit</Text>
            </Box>
          </Box>
        );
    }
  };
  
  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="classic" borderColor="cyan" padding={1} marginBottom={1}>
        <Box width="100%" justifyContent="space-between">
          <Text bold>Task Master</Text>
          <Text>Press <Text color="green" bold>h</Text> for help</Text>
        </Box>
      </Box>

      {/* Navigation */}
      <Box marginBottom={1}>
        <Box marginRight={2} paddingX={1} backgroundColor={activeSection === Section.DASHBOARD ? 'cyan' : undefined}>
          <Text bold={activeSection === Section.DASHBOARD} color={activeSection === Section.DASHBOARD ? 'black' : undefined}>Dashboard (d)</Text>
        </Box>
        <Box marginRight={2} paddingX={1} backgroundColor={activeSection === Section.TASKS ? 'cyan' : undefined}>
          <Text bold={activeSection === Section.TASKS} color={activeSection === Section.TASKS ? 'black' : undefined}>Tasks (t)</Text>
        </Box>
        <Box marginRight={2} paddingX={1} backgroundColor={activeSection === Section.TERMINAL ? 'cyan' : undefined}>
          <Text bold={activeSection === Section.TERMINAL} color={activeSection === Section.TERMINAL ? 'black' : undefined}>Terminal (r)</Text>
        </Box>
        <Box marginRight={2} paddingX={1} backgroundColor={activeSection === Section.SETTINGS ? 'cyan' : undefined}>
          <Text bold={activeSection === Section.SETTINGS} color={activeSection === Section.SETTINGS ? 'black' : undefined}>Settings (s)</Text>
        </Box>
        <Box paddingX={1} backgroundColor={activeSection === Section.HELP ? 'cyan' : undefined}>
          <Text bold={activeSection === Section.HELP} color={activeSection === Section.HELP ? 'black' : undefined}>Help (h)</Text>
        </Box>
      </Box>

      {/* Content */}
      <Box flexGrow={1} borderStyle="classic" padding={1}>
        {renderSection()}
      </Box>

      {/* Footer */}
      <Box borderStyle="classic" padding={1} marginTop={1}>
        <Text dimColor>Task Master v1.0.0 | Press Ctrl+Q to exit</Text>
      </Box>
    </Box>
  );
};

/**
 * Entry point for Task Master UI
 * @param initialSection Optional initial section to open
 */
const runUI = async (initialSection?: string) => {
  try {
    // Check if we can use interactive mode
    const isRawModeSupported = process.stdin.isTTY && process.stdout.isTTY;

    let instance;
    if (isRawModeSupported) {
      // Set initial section if provided
      let initialState = {};
      if (initialSection) {
        initialState = { activeSection: initialSection };
      }

      // Render the interactive app
      instance = render(
        React.createElement(App, { initialState }),
        {
          stdout: process.stdout,
          stdin: process.stdin,
          exitOnCtrlC: true,
          patchConsole: true
        }
      );
    } else {
      // For non-interactive environments, show a message
      console.log('Task Master requires an interactive terminal.');
      console.log('Please run this command in a terminal that supports interactive input.');
      process.exit(1);
    }

    // Wait for app to exit
    await instance.waitUntilExit();
  } catch (error) {
    console.error('An error occurred in Task Master UI:', error);
    process.exit(1);
  }
};

export default runUI;