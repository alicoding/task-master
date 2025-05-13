import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { COLORS, ICONS } from '../constants/theme.ts';
import SelectInput from 'ink-select-input';
import { Item } from 'ink-select-input/build/SelectInput.js';
import { SCREEN_INFO, Screen } from '../constants/screens.ts';

interface MenuItem {
  label: string;
  value: string;
  hint?: string;
  shortcut?: string;
  description?: string;
  icon?: string;
}

interface MenuProps {
  items: MenuItem[];
  label?: string;
  onSelect: (item: MenuItem) => void;
  searchable?: boolean;
  showHints?: boolean;
  showDescription?: boolean;
}

/**
 * Menu component with selectable items
 */
const Menu: React.FC<MenuProps> = ({
  items,
  label,
  onSelect,
  searchable = false,
  showHints = true,
  showDescription = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  
  // Filter items based on search query
  const filteredItems = searchMode && searchQuery
    ? items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.hint && item.hint.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;
  
  // Convert to SelectInput format
  const selectItems: Item[] = filteredItems.map(item => ({
    key: item.value,
    label: item.label,
    value: item,
  }));
  
  // Handle keyboard input for search
  useInput((input, key) => {
    // Handle search mode
    if (searchable) {
      if (input === '/') {
        // Enter search mode with '/'
        setSearchMode(true);
        setSearchQuery('');
      } else if (searchMode) {
        if (key.escape) {
          // Exit search mode with Escape
          setSearchMode(false);
          setSearchQuery('');
        } else if (key.return) {
          // Submit search with Enter
          setSearchMode(false);
        } else if (key.backspace || key.delete) {
          // Handle backspace
          setSearchQuery(prevQuery => prevQuery.slice(0, -1));
        } else if (!key.ctrl && !key.meta && !key.shift && input.length === 1) {
          // Append character to search query
          setSearchQuery(prevQuery => prevQuery + input);
        }
      }
    }
  });
  
  return (
    <Box flexDirection="column">
      {/* Menu label if provided */}
      {label && (
        <Box marginBottom={1}>
          <Text bold color={COLORS.text.primary}>
            {label}
          </Text>
        </Box>
      )}
      
      {/* Search bar */}
      {searchable && (
        <Box marginBottom={1}>
          <Text color={searchMode ? COLORS.primary : COLORS.text.muted}>
            {searchMode ? '/' : 'Press / to search'}
          </Text>
          
          {searchMode && (
            <Text color={COLORS.text.primary}>
              {searchQuery || ' '}
            </Text>
          )}
          
          {searchMode && searchQuery && (
            <Text color={COLORS.text.secondary}>
              {' '}({filteredItems.length} results)
            </Text>
          )}
        </Box>
      )}
      
      {/* Menu items */}
      <SelectInput
        items={selectItems}
        onSelect={(item: Item) => onSelect(item.value as MenuItem)}
        itemComponent={({ isSelected, item }: { isSelected: boolean; item: Item }) => {
          const menuItem = item.value as MenuItem;
          
          return (
            <Box flexDirection="column">
              <Box>
                <Text color={isSelected ? COLORS.primary : COLORS.text.primary} bold={isSelected}>
                  {isSelected ? ICONS.arrow.right + ' ' : '  '}
                  {menuItem.icon ? menuItem.icon + ' ' : ''}
                  {menuItem.label}
                </Text>
                
                {menuItem.shortcut && (
                  <Text color={isSelected ? COLORS.primary : COLORS.text.secondary} dimColor>
                    {' '}({menuItem.shortcut})
                  </Text>
                )}
                
                {showHints && menuItem.hint && (
                  <Text color={COLORS.text.muted} dimColor>
                    {' '}- {menuItem.hint}
                  </Text>
                )}
              </Box>
              
              {showDescription && isSelected && menuItem.description && (
                <Box marginLeft={2} marginTop={1}>
                  <Text color={COLORS.text.secondary}>
                    {menuItem.description}
                  </Text>
                </Box>
              )}
            </Box>
          );
        }}
      />
      
      {/* Help text */}
      <Box marginTop={1}>
        <Text color={COLORS.text.muted}>
          {searchable && 'Press / to search, '}
          Use arrow keys to navigate, Enter to select
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Create a menu from screens
 */
export const createScreenMenu = (
  screens: Screen[],
  onSelect: (screen: Screen) => void
): JSX.Element => {
  // Convert screens to menu items
  const menuItems = screens.map(screen => {
    const info = SCREEN_INFO[screen];
    return {
      label: info.title,
      value: screen,
      hint: info.description,
      shortcut: info.shortcut,
    };
  });
  
  return (
    <Menu
      items={menuItems}
      onSelect={(item) => onSelect(item.value as Screen)}
      searchable
      showHints
      showDescription
    />
  );
};

export default Menu;