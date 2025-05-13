import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { COLORS } from '../constants/theme.ts';
import Spinner from 'ink-spinner';

interface StatusBarProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timeout?: number;
  showSpinner?: boolean;
}

/**
 * Status bar for displaying notifications and feedback
 */
const StatusBar: React.FC<StatusBarProps> = ({
  message,
  type = 'info',
  timeout,
  showSpinner = true,
}) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide after timeout
  useEffect(() => {
    if (timeout) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [timeout]);
  
  if (!visible) {
    return null;
  }
  
  // Determine color based on type
  let color;
  switch (type) {
    case 'success':
      color = COLORS.status.success;
      break;
    case 'warning':
      color = COLORS.status.warning;
      break;
    case 'error':
      color = COLORS.status.error;
      break;
    case 'info':
    default:
      color = COLORS.status.info;
      break;
  }
  
  return (
    <Box
      paddingX={2}
      paddingY={1}
      backgroundColor={color}
      justifyContent="center"
      alignItems="center"
    >
      {showSpinner && (
        <Box marginRight={1}>
          <Text>
            <Spinner type="dots" />
          </Text>
        </Box>
      )}
      
      <Text color={COLORS.text.primary} bold>
        {message}
      </Text>
    </Box>
  );
};

export default StatusBar;