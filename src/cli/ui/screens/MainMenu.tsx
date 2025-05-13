import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import Layout from '../components/Layout.tsx';
import Menu, { createScreenMenu } from '../components/Menu.tsx';
import { useNavigationStore } from '../context/NavigationContext.ts';
import { Screen, SCREEN_INFO } from '../constants/screens.ts';
import { COLORS, ICONS } from '../constants/theme.ts';

/**
 * Main menu screen
 */
const MainMenu: React.FC = () => {
  const { navigateTo, setBreadcrumbs } = useNavigationStore();
  
  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs(['Main Menu']);
  }, [setBreadcrumbs]);
  
  // Define main menu screens
  const mainMenuScreens = [
    Screen.CONFIG_MENU,
    Screen.TASK_MENU,
    Screen.PROJECT_INIT,
    Screen.VALIDATION,
    Screen.CONNECTION_TEST,
    Screen.HELP,
  ];
  
  // Handle screen selection
  const handleScreenSelect = (screen: Screen) => {
    navigateTo(screen);
  };
  
  return (
    <Layout title="Task Master">
      <Box flexDirection="column">
        {/* Welcome message */}
        <Box 
          marginBottom={2}
          paddingX={2}
          paddingY={1}
          borderStyle="round"
          borderColor={COLORS.secondary}
        >
          <Text bold color={COLORS.secondary}>
            Welcome to Task Master Interactive Setup
          </Text>
        </Box>
        
        <Box flexDirection="column" marginBottom={2}>
          <Text>
            Select an option to get started, or press <Text color={COLORS.primary} bold>/</Text> to search.
          </Text>
          <Text color={COLORS.text.secondary}>
            Press <Text color={COLORS.primary} bold>Ctrl+H</Text> at any time to view help and keyboard shortcuts.
          </Text>
        </Box>
        
        {/* Main menu */}
        <Box flexDirection="column">
          {createScreenMenu(mainMenuScreens, handleScreenSelect)}
        </Box>
      </Box>
    </Layout>
  );
};

export default MainMenu;