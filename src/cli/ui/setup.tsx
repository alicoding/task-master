import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

// Setup steps
enum SetupStep {
  WELCOME = 'welcome',
  DATABASE = 'database',
  AI_PROVIDER = 'ai_provider',
  CONFIRM = 'confirm',
  COMPLETE = 'complete'
}

/**
 * Setup UI for first-time users
 */
const SetupApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.WELCOME);
  const [dbPath, setDbPath] = useState<string>('db/taskmaster.db');
  const [aiProvider, setAiProvider] = useState<string>('mock');
  
  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.return) {
      handleNext();
    } else if (key.escape) {
      // Allow going back except at welcome screen
      if (currentStep !== SetupStep.WELCOME) {
        handleBack();
      }
    } else if (input === 'q') {
      process.exit(0);
    }
  });
  
  // Handle moving to next step
  const handleNext = () => {
    switch (currentStep) {
      case SetupStep.WELCOME:
        setCurrentStep(SetupStep.DATABASE);
        break;
      case SetupStep.DATABASE:
        setCurrentStep(SetupStep.AI_PROVIDER);
        break;
      case SetupStep.AI_PROVIDER:
        setCurrentStep(SetupStep.CONFIRM);
        break;
      case SetupStep.CONFIRM:
        // Actually save configuration here
        setCurrentStep(SetupStep.COMPLETE);
        break;
      case SetupStep.COMPLETE:
        process.exit(0);
        break;
    }
  };
  
  // Handle moving to previous step
  const handleBack = () => {
    switch (currentStep) {
      case SetupStep.DATABASE:
        setCurrentStep(SetupStep.WELCOME);
        break;
      case SetupStep.AI_PROVIDER:
        setCurrentStep(SetupStep.DATABASE);
        break;
      case SetupStep.CONFIRM:
        setCurrentStep(SetupStep.AI_PROVIDER);
        break;
      case SetupStep.COMPLETE:
        // Can't go back from complete
        break;
    }
  };
  
  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case SetupStep.WELCOME:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Welcome to Task Master!</Text>
            <Box marginTop={1}>
              <Text>Let's get you set up with a few quick questions.</Text>
            </Box>
            <Box marginTop={2}>
              <Text>Press <Text bold color="green">Enter</Text> to continue or <Text bold color="red">q</Text> to exit.</Text>
            </Box>
          </Box>
        );
        
      case SetupStep.DATABASE:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Database Configuration</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>Where would you like to store your tasks?</Text>
              <Box marginTop={1} borderStyle="classic" padding={1}>
                <Text color="cyan">{dbPath}</Text>
              </Box>
              <Box marginTop={1}>
                <Text dimColor>This is the path where your SQLite database will be stored.</Text>
              </Box>
            </Box>
            <Box marginTop={2}>
              <Text>Press <Text bold color="green">Enter</Text> to continue or <Text bold color="yellow">Esc</Text> to go back.</Text>
            </Box>
          </Box>
        );
        
      case SetupStep.AI_PROVIDER:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>AI Provider Configuration</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>Which AI provider would you like to use?</Text>
              <Box marginTop={1} borderStyle="classic" padding={1}>
                <Text color="cyan">Mock Provider (no API key required)</Text>
              </Box>
              <Box marginTop={1}>
                <Text dimColor>You can change this later by running 'tm setup --ai'.</Text>
              </Box>
            </Box>
            <Box marginTop={2}>
              <Text>Press <Text bold color="green">Enter</Text> to continue or <Text bold color="yellow">Esc</Text> to go back.</Text>
            </Box>
          </Box>
        );
        
      case SetupStep.CONFIRM:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold>Confirm Configuration</Text>
            <Box marginTop={1} flexDirection="column" borderStyle="classic" padding={1}>
              <Text>Database Path: <Text color="cyan">{dbPath}</Text></Text>
              <Text>AI Provider: <Text color="cyan">{aiProvider === 'mock' ? 'Mock Provider' : aiProvider}</Text></Text>
            </Box>
            <Box marginTop={2}>
              <Text>Press <Text bold color="green">Enter</Text> to save configuration or <Text bold color="yellow">Esc</Text> to go back.</Text>
            </Box>
          </Box>
        );
        
      case SetupStep.COMPLETE:
        return (
          <Box flexDirection="column" padding={1}>
            <Text bold color="green">Setup Complete!</Text>
            <Box marginTop={1}>
              <Text>Task Master has been successfully configured.</Text>
            </Box>
            <Box marginTop={2}>
              <Text>Press <Text bold color="green">Enter</Text> to start using Task Master.</Text>
            </Box>
          </Box>
        );
    }
  };
  
  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="classic" padding={1} marginBottom={1}>
        <Text bold>Task Master Setup {currentStep !== SetupStep.WELCOME ? `- Step ${getStepNumber(currentStep)} of 4` : ''}</Text>
      </Box>

      {/* Current step */}
      {renderStep()}

      {/* Footer */}
      <Box borderStyle="classic" padding={1} marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to confirm, Esc to go back</Text>
      </Box>
    </Box>
  );
};

// Helper to get step number
function getStepNumber(step: SetupStep): number {
  switch (step) {
    case SetupStep.WELCOME:
      return 0;
    case SetupStep.DATABASE:
      return 1;
    case SetupStep.AI_PROVIDER:
      return 2;
    case SetupStep.CONFIRM:
      return 3;
    case SetupStep.COMPLETE:
      return 4;
    default:
      return 0;
  }
}

/**
 * Entry point for Task Master Setup UI
 */
const runSetup = async () => {
  try {
    // Check if we can use interactive mode
    const isRawModeSupported = process.stdin.isTTY && process.stdout.isTTY;
    
    let instance;
    if (isRawModeSupported) {
      // Render the setup UI
      instance = render(
        React.createElement(SetupApp),
        {
          stdout: process.stdout,
          stdin: process.stdin,
          exitOnCtrlC: true,
          patchConsole: true
        }
      );
    } else {
      // For non-interactive environments, show a message
      console.log('Task Master Setup requires an interactive terminal.');
      console.log('Please run this command in a terminal that supports interactive input.');
      process.exit(1);
    }
    
    // Wait for app to exit
    await instance.waitUntilExit();
  } catch (error) {
    console.error('An error occurred in setup UI:', error);
    process.exit(1);
  }
};

export default runSetup;