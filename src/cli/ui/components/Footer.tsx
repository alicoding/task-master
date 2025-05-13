import React from 'react';
import { Box, Text } from 'ink';
import { COLORS, ELEMENTS, SPACING } from '../constants/theme.ts';
import { GLOBAL_SHORTCUTS, SCREEN_SHORTCUTS } from '../constants/shortcuts.ts';
import { useNavigationStore } from '../context/NavigationContext.ts';

interface FooterProps {
  showShortcuts?: boolean;
}

/**
 * Footer component with shortcuts and status information
 */
const Footer: React.FC<FooterProps> = ({ showShortcuts = true }) => {
  const { currentScreen } = useNavigationStore();
  
  // Get current screen shortcuts
  const screenShortcuts = SCREEN_SHORTCUTS[currentScreen] || [];
  
  // Get global shortcuts
  const globalShortcuts = GLOBAL_SHORTCUTS.filter(shortcut => shortcut.isGlobal);
  
  // Combine shortcuts
  const shortcuts = showShortcuts 
    ? [...screenShortcuts, ...globalShortcuts.slice(0, 3)] 
    : [];
  
  return (
    <Box
      flexDirection="column"
      width="100%"
      height={ELEMENTS.footer.height}
      borderTopStyle="single"
      borderColor={COLORS.border}
      paddingX={ELEMENTS.footer.padding}
      paddingY={1}
    >
      {/* Shortcuts */}
      {showShortcuts && shortcuts.length > 0 && (
        <Box>
          {shortcuts.map((shortcut, index) => (
            <React.Fragment key={shortcut.key}>
              <Box marginRight={2}>
                <Text bold color={COLORS.text.primary}>
                  {shortcut.key}
                </Text>
                <Text color={COLORS.text.secondary}>
                  {': '}
                </Text>
                <Text color={COLORS.text.muted}>
                  {shortcut.description}
                </Text>
              </Box>
              
              {index < shortcuts.length - 1 && (
                <Text color={COLORS.text.muted} marginRight={2}>
                  |
                </Text>
              )}
            </React.Fragment>
          ))}
        </Box>
      )}
      
      {/* Version and additional info */}
      <Box justifyContent="space-between" marginTop={1}>
        <Text color={COLORS.text.muted}>
          Task Master v1.0.0
        </Text>
        
        <Text color={COLORS.text.muted}>
          Press Ctrl+Q to return to main menu
        </Text>
      </Box>
    </Box>
  );
};

export default Footer;