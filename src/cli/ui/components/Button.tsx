import React from 'react';
import { Box, Text } from 'ink';
import { COLORS, ELEMENTS } from '../constants/theme.ts';

interface ButtonProps {
  label: string;
  shortcut?: string;
  selected?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  fullWidth?: boolean;
  onSelect?: () => void;
  marginRight?: number;
  marginBottom?: number;
}

/**
 * Button component with different variants and states
 */
const Button: React.FC<ButtonProps> = ({
  label,
  shortcut,
  selected = false,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  onSelect,
  marginRight = 1,
  marginBottom = 0,
}) => {
  // Determine button colors based on variant and state
  let backgroundColor;
  let textColor = COLORS.text.primary;
  let borderColor;
  
  if (disabled) {
    backgroundColor = COLORS.background;
    textColor = COLORS.text.muted;
    borderColor = COLORS.text.muted;
  } else {
    switch (variant) {
      case 'primary':
        backgroundColor = selected ? COLORS.primary : undefined;
        borderColor = COLORS.primary;
        break;
      case 'secondary':
        backgroundColor = selected ? COLORS.secondary : undefined;
        borderColor = COLORS.secondary;
        break;
      case 'success':
        backgroundColor = selected ? COLORS.status.success : undefined;
        borderColor = COLORS.status.success;
        break;
      case 'danger':
        backgroundColor = selected ? COLORS.status.error : undefined;
        borderColor = COLORS.status.error;
        break;
      case 'outline':
        backgroundColor = selected ? COLORS.border : undefined;
        borderColor = COLORS.border;
        break;
    }
  }
  
  // For non-selected outline buttons, use the border color for text
  if (variant === 'outline' && !selected && !disabled) {
    textColor = borderColor || COLORS.text.primary;
  }
  
  return (
    <Box
      borderStyle="classic"
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      paddingX={ELEMENTS.button.padding}
      paddingY={1}
      marginRight={marginRight}
      marginBottom={marginBottom}
      flexGrow={fullWidth ? 1 : 0}
    >
      <Text color={textColor} bold={selected}>
        {label}
      </Text>
      
      {shortcut && (
        <Text color={textColor} dimColor>
          {' '}
          ({shortcut})
        </Text>
      )}
    </Box>
  );
};

export default Button;