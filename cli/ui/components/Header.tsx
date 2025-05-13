import React from 'react';
import { Box, Text } from 'ink';
import { COLORS, ELEMENTS, SPACING, ICONS } from '../constants/theme.ts';
import { useNavigationStore } from '../context/NavigationContext.ts';
import Breadcrumbs from './Breadcrumbs.tsx';

interface HeaderProps {
  title: string;
  showBreadcrumbs?: boolean;
}

/**
 * Header component with title and navigation breadcrumbs
 */
const Header: React.FC<HeaderProps> = ({ title, showBreadcrumbs = true }) => {
  const { breadcrumbs } = useNavigationStore();
  
  return (
    <Box
      flexDirection="column"
      width="100%"
      height={ELEMENTS.header.height}
      backgroundColor={COLORS.primary}
      paddingX={ELEMENTS.header.padding}
      paddingY={1}
    >
      <Box justifyContent="space-between" alignItems="center">
        <Text bold color={COLORS.text.primary}>
          {ICONS.menu} {title}
        </Text>
        
        <Box paddingRight={1}>
          <Text color={COLORS.text.primary} dimColor>
            Press Ctrl+H for help
          </Text>
        </Box>
      </Box>
      
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <Box marginTop={1}>
          <Breadcrumbs items={breadcrumbs} />
        </Box>
      )}
    </Box>
  );
};

export default Header;