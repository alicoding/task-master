import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigationStore } from '../context/NavigationContext.ts';
import { COLORS, DIMENSIONS, BORDERS } from '../constants/theme.ts';
import { GLOBAL_SHORTCUTS } from '../constants/shortcuts.ts';
import Header from './Header.tsx';
import Footer from './Footer.tsx';
import HelpOverlay from './HelpOverlay.tsx';
import StatusBar from './StatusBar.tsx';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showShortcuts?: boolean;
  showBreadcrumbs?: boolean;
}

/**
 * Main layout component with header, footer, and content area
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showHeader = true,
  showFooter = true,
  showShortcuts = true,
  showBreadcrumbs = true,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { currentScreen, breadcrumbs, isNavigating, goBack, goHome } = useNavigationStore();
  
  // Handle keyboard input
  useInput((input, key) => {
    // Global keyboard shortcuts
    if (key.escape) {
      goBack();
    } else if (input === '\u0008' || (key.ctrl && input === 'h')) { // Ctrl+H
      setShowHelp(prev => !prev);
    } else if (key.ctrl && input === 'q') { // Ctrl+Q
      goHome();
    }
  });
  
  // Show status message when navigating
  useEffect(() => {
    if (isNavigating) {
      setStatusMessage('Navigating...');
      
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isNavigating]);
  
  return (
    <Box flexDirection="column" width={DIMENSIONS.maxContentWidth} height={process.stdout.rows}>
      {/* Main content with header and footer */}
      <Box flexDirection="column" flex={1}>
        {/* Header */}
        {showHeader && (
          <Header 
            title={title || 'Task Master'} 
            showBreadcrumbs={showBreadcrumbs}
          />
        )}
        
        {/* Status bar for navigation feedback */}
        {statusMessage && (
          <StatusBar message={statusMessage} />
        )}
        
        {/* Main content */}
        <Box
          flexDirection="column"
          flex={1}
          paddingX={2}
          paddingY={1}
          borderStyle="classic"
          borderColor={COLORS.border}
        >
          {children}
        </Box>
        
        {/* Footer with shortcuts */}
        {showFooter && (
          <Footer showShortcuts={showShortcuts} />
        )}
      </Box>
      
      {/* Help overlay */}
      {showHelp && (
        <HelpOverlay onClose={() => setShowHelp(false)} />
      )}
    </Box>
  );
};

export default Layout;