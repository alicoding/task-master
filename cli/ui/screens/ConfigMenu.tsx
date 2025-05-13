import React, { useEffect } from 'react';
import { Box, Text } from 'ink';
import Layout from '../components/Layout.tsx';
import Menu, { createScreenMenu } from '../components/Menu.tsx';
import { useNavigationStore } from '../context/NavigationContext.ts';
import { Screen, SCREEN_INFO } from '../constants/screens.ts';
import { COLORS, ICONS } from '../constants/theme.ts';
import Tabs from '../components/Tabs.tsx';

/**
 * Configuration menu screen
 */
const ConfigMenu: React.FC = () => {
  const { navigateTo, addBreadcrumb, setBreadcrumbs } = useNavigationStore();
  
  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs(['Main Menu', 'Configuration']);
  }, [setBreadcrumbs]);
  
  // Configuration options
  const configScreens = [
    Screen.CONFIG_AI,
    Screen.CONFIG_DATABASE,
    Screen.CONFIG_EXPORT,
    Screen.CONFIG_IMPORT,
  ];
  
  // Handle screen selection
  const handleScreenSelect = (screen: Screen) => {
    navigateTo(screen);
  };
  
  return (
    <Layout title="Configuration Menu">
      <Box flexDirection="column">
        <Box 
          marginBottom={2}
          paddingX={2}
          paddingY={1}
          borderStyle="round"
          borderColor={COLORS.primary}
        >
          <Text bold color={COLORS.primary}>
            Task Master Configuration
          </Text>
        </Box>
        
        <Box flexDirection="column" marginBottom={2}>
          <Text>
            Configure Task Master settings, or import/export configuration.
          </Text>
          <Text color={COLORS.text.secondary}>
            Select an option below, or press <Text color={COLORS.primary} bold>/</Text> to search.
          </Text>
        </Box>
        
        {/* Configuration menu */}
        <Box flexDirection="column">
          {createScreenMenu(configScreens, handleScreenSelect)}
        </Box>
        
        {/* Configuration tabs (alternative view) */}
        <Box flexDirection="column" marginTop={3}>
          <Text bold color={COLORS.text.primary}>
            Configuration Sections
          </Text>
          
          <Box marginTop={1}>
            <Tabs
              tabs={[
                {
                  id: 'ai',
                  label: 'AI Providers',
                  content: (
                    <Box flexDirection="column">
                      <Text>Configure AI providers and models.</Text>
                      <Box marginTop={1}>
                        <Text color={COLORS.text.secondary}>
                          Press <Text color={COLORS.primary}>Enter</Text> to configure AI providers.
                        </Text>
                      </Box>
                    </Box>
                  )
                },
                {
                  id: 'database',
                  label: 'Database',
                  content: (
                    <Box flexDirection="column">
                      <Text>Configure database settings.</Text>
                      <Box marginTop={1}>
                        <Text color={COLORS.text.secondary}>
                          Press <Text color={COLORS.primary}>Enter</Text> to configure database settings.
                        </Text>
                      </Box>
                    </Box>
                  )
                },
                {
                  id: 'export',
                  label: 'Export',
                  content: (
                    <Box flexDirection="column">
                      <Text>Export configuration to a file.</Text>
                      <Box marginTop={1}>
                        <Text color={COLORS.text.secondary}>
                          Press <Text color={COLORS.primary}>Enter</Text> to export configuration.
                        </Text>
                      </Box>
                    </Box>
                  )
                },
                {
                  id: 'import',
                  label: 'Import',
                  content: (
                    <Box flexDirection="column">
                      <Text>Import configuration from a file.</Text>
                      <Box marginTop={1}>
                        <Text color={COLORS.text.secondary}>
                          Press <Text color={COLORS.primary}>Enter</Text> to import configuration.
                        </Text>
                      </Box>
                    </Box>
                  )
                }
              ]}
              onChange={(tabId) => {
                // Map tab ID to screen
                const screenMap: Record<string, Screen> = {
                  'ai': Screen.CONFIG_AI,
                  'database': Screen.CONFIG_DATABASE,
                  'export': Screen.CONFIG_EXPORT,
                  'import': Screen.CONFIG_IMPORT,
                };
                
                // Navigate to corresponding screen
                if (screenMap[tabId]) {
                  navigateTo(screenMap[tabId]);
                }
              }}
            />
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default ConfigMenu;