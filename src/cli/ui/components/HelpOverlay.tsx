import React from 'react';
import { Box, Text, useInput } from 'ink';
import { COLORS, BORDERS, DIMENSIONS } from '../constants/theme.ts';
import { GLOBAL_SHORTCUTS, SCREEN_SHORTCUTS } from '../constants/shortcuts.ts';
import { useNavigationStore } from '../context/NavigationContext.ts';
import { SCREEN_INFO } from '../constants/screens.ts';

interface HelpOverlayProps {
  onClose: () => void;
}

/**
 * Help overlay component with keyboard shortcuts and navigation help
 */
const HelpOverlay: React.FC<HelpOverlayProps> = ({ onClose }) => {
  const { currentScreen } = useNavigationStore();
  
  // Get current screen info
  const screenInfo = SCREEN_INFO[currentScreen];
  
  // Get screen-specific shortcuts
  const screenShortcuts = SCREEN_SHORTCUTS[currentScreen] || [];
  
  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape || input === 'q' || (key.ctrl && input === 'h')) {
      onClose();
    }
  });
  
  return (
    <Box
      flexDirection="column"
      position="absolute"
      width={DIMENSIONS.maxContentWidth - 10}
      height={process.stdout.rows - 10}
      top={5}
      left={5}
      backgroundColor={COLORS.background}
      borderStyle="classic"
      borderColor={COLORS.primary}
      padding={2}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={COLORS.primary}>
          Help & Keyboard Shortcuts
        </Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text color={COLORS.text.secondary}>
          Current screen: <Text color={COLORS.text.primary} bold>{screenInfo?.title || currentScreen}</Text>
        </Text>
      </Box>
      
      {screenInfo?.description && (
        <Box marginBottom={2}>
          <Text color={COLORS.text.secondary}>
            {screenInfo.description}
          </Text>
        </Box>
      )}
      
      {/* Screen-specific shortcuts */}
      {screenShortcuts.length > 0 && (
        <>
          <Box marginBottom={1}>
            <Text bold color={COLORS.text.primary}>
              Screen Shortcuts
            </Text>
          </Box>
          
          <Box flexDirection="column" marginBottom={2}>
            {screenShortcuts.map((shortcut) => (
              <Box key={shortcut.key} marginY={1}>
                <Box width={10}>
                  <Text bold color={COLORS.primary}>
                    {shortcut.key}
                  </Text>
                </Box>
                <Text color={COLORS.text.secondary}>
                  {shortcut.description}
                </Text>
              </Box>
            ))}
          </Box>
        </>
      )}
      
      {/* Global shortcuts */}
      <Box marginBottom={1}>
        <Text bold color={COLORS.text.primary}>
          Global Shortcuts
        </Text>
      </Box>
      
      <Box flexDirection="column">
        {GLOBAL_SHORTCUTS.map((shortcut) => (
          <Box key={shortcut.key} marginY={1}>
            <Box width={10}>
              <Text bold color={COLORS.primary}>
                {shortcut.key}
              </Text>
            </Box>
            <Text color={COLORS.text.secondary}>
              {shortcut.description}
            </Text>
          </Box>
        ))}
      </Box>
      
      {/* Footer */}
      <Box marginTop={2} justifyContent="center">
        <Text color={COLORS.text.muted}>
          Press <Text color={COLORS.primary} bold>ESC</Text> or <Text color={COLORS.primary} bold>Ctrl+H</Text> to close help
        </Text>
      </Box>
    </Box>
  );
};

export default HelpOverlay;