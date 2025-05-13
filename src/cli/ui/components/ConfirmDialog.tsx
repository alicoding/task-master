import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { COLORS, ICONS } from '../constants/theme.ts';
import Button from './Button.tsx';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for actions that need explicit confirmation
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const [selectedOption, setSelectedOption] = useState<'confirm' | 'cancel'>('cancel');
  
  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow) {
      // Toggle between options
      setSelectedOption(prev => (prev === 'confirm' ? 'cancel' : 'confirm'));
    } else if (key.return) {
      // Confirm selection
      if (selectedOption === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    } else if (key.escape) {
      // Cancel dialog
      onCancel();
    } else if (input === 'y' || input === 'Y') {
      // Shortcut for confirm
      onConfirm();
    } else if (input === 'n' || input === 'N') {
      // Shortcut for cancel
      onCancel();
    }
  });
  
  return (
    <Box
      flexDirection="column"
      borderStyle="classic"
      borderColor={isDestructive ? COLORS.status.error : COLORS.primary}
      padding={2}
      width={50}
    >
      {/* Dialog title */}
      <Box marginBottom={1}>
        <Text color={isDestructive ? COLORS.status.error : COLORS.primary} bold>
          {isDestructive ? ICONS.warning + ' ' : ''}
          {title}
        </Text>
      </Box>
      
      {/* Dialog message */}
      <Box marginBottom={2}>
        <Text color={COLORS.text.primary}>
          {message}
        </Text>
      </Box>
      
      {/* Action buttons */}
      <Box justifyContent="space-between">
        <Button
          label={cancelLabel}
          variant="outline"
          selected={selectedOption === 'cancel'}
          onSelect={() => setSelectedOption('cancel')}
          shortcut="N"
        />
        
        <Button
          label={confirmLabel}
          variant={isDestructive ? 'danger' : 'primary'}
          selected={selectedOption === 'confirm'}
          onSelect={() => setSelectedOption('confirm')}
          shortcut="Y"
        />
      </Box>
      
      {/* Help text */}
      <Box marginTop={1} justifyContent="center">
        <Text color={COLORS.text.muted}>
          Press <Text color={COLORS.text.primary} bold>Y/N</Text> or <Text color={COLORS.text.primary} bold>↑/↓/Enter</Text> to confirm
        </Text>
      </Box>
    </Box>
  );
};

export default ConfirmDialog;