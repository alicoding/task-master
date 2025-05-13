import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { COLORS, ELEMENTS } from '../constants/theme.ts';
import InkTextInput from 'ink-text-input';

interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  mask?: string;
  suggestions?: string[];
  maxSuggestions?: number;
  helpText?: string;
  error?: string;
  width?: number | string;
}

/**
 * Enhanced text input with autocomplete suggestions
 */
const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  onSubmit,
  placeholder = '',
  mask,
  suggestions = [],
  maxSuggestions = 5,
  helpText,
  error,
  width = 40,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  // Filter suggestions based on input value
  useEffect(() => {
    if (value && suggestions.length > 0) {
      // Filter suggestions that start with or include input value
      const filtered = suggestions
        .filter(suggestion => suggestion.toLowerCase().includes(value.toLowerCase()))
        .slice(0, maxSuggestions);
      
      setFilteredSuggestions(filtered);
      setHighlightedSuggestion(0);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, suggestions, maxSuggestions]);
  
  // Handle keyboard input for suggestions
  useInput((input, key) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (key.downArrow) {
        // Navigate down suggestions
        setHighlightedSuggestion(
          (highlightedSuggestion + 1) % filteredSuggestions.length
        );
      } else if (key.upArrow) {
        // Navigate up suggestions
        setHighlightedSuggestion(
          (highlightedSuggestion - 1 + filteredSuggestions.length) % filteredSuggestions.length
        );
      } else if (key.tab) {
        // Apply suggestion
        onChange(filteredSuggestions[highlightedSuggestion]);
        setShowSuggestions(false);
      } else if (key.escape) {
        // Dismiss suggestions
        setShowSuggestions(false);
      }
    }
  });
  
  return (
    <Box flexDirection="column">
      {/* Input label */}
      {label && (
        <Box marginBottom={1}>
          <Text color={COLORS.text.primary} bold>
            {label}
          </Text>
        </Box>
      )}
      
      {/* Input field */}
      <Box position="relative">
        <Box
          borderStyle="single"
          borderColor={error ? COLORS.status.error : COLORS.border}
          padding={1}
          width={width}
        >
          <InkTextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            placeholder={placeholder}
            mask={mask}
          />
        </Box>
        
        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <Box
            flexDirection="column"
            position="absolute"
            top={3}
            left={0}
            width={width}
            borderStyle="single"
            borderColor={COLORS.border}
            backgroundColor={COLORS.background}
            padding={1}
            zIndex={1}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <Box key={suggestion} paddingX={1} paddingY={0}>
                <Text
                  color={index === highlightedSuggestion ? COLORS.primary : COLORS.text.primary}
                  bold={index === highlightedSuggestion}
                  backgroundColor={index === highlightedSuggestion ? COLORS.background : undefined}
                >
                  {suggestion}
                </Text>
              </Box>
            ))}
            
            <Box marginTop={1}>
              <Text color={COLORS.text.muted} dimColor>
                Use arrow keys to navigate, Tab to select
              </Text>
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Help text */}
      {helpText && !error && (
        <Box marginTop={1}>
          <Text color={COLORS.text.muted}>
            {helpText}
          </Text>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Box marginTop={1}>
          <Text color={COLORS.status.error}>
            {error}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TextInput;