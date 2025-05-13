import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { COLORS } from '../constants/theme.ts';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
}

/**
 * Tabs component for multi-tab interfaces
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab: externalActiveTab,
  onChange,
}) => {
  // Use internal state if external control is not provided
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');
  
  // Use external or internal active tab
  const activeTab = externalActiveTab || internalActiveTab;
  
  // Handle tab change
  const handleTabChange = (tabId: string) => {
    if (onChange) {
      onChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };
  
  // Get active tab content
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content || null;
  
  // Handle keyboard navigation
  useInput((input, key) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    if (key.tab || key.rightArrow) {
      // Move to next tab
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];
      if (!nextTab.disabled) {
        handleTabChange(nextTab.id);
      }
    } else if ((key.shiftTab || key.leftArrow) && currentIndex > 0) {
      // Move to previous tab
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      const prevTab = tabs[prevIndex];
      if (!prevTab.disabled) {
        handleTabChange(prevTab.id);
      }
    } else if (input >= '1' && input <= '9') {
      // Select tab by number (1-9)
      const numIndex = parseInt(input, 10) - 1;
      if (numIndex < tabs.length) {
        const numTab = tabs[numIndex];
        if (!numTab.disabled) {
          handleTabChange(numTab.id);
        }
      }
    }
  });
  
  return (
    <Box flexDirection="column">
      {/* Tab headers */}
      <Box
        borderStyle="single"
        borderColor={COLORS.border}
        borderBottom={false}
        paddingX={1}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const tabColor = tab.disabled
            ? COLORS.text.muted
            : isActive
              ? COLORS.primary
              : COLORS.text.secondary;
          
          return (
            <Box
              key={tab.id}
              marginRight={2}
              paddingX={2}
              paddingY={1}
              borderStyle={isActive ? 'single' : undefined}
              borderBottom={false}
              borderColor={isActive ? COLORS.primary : undefined}
            >
              <Text
                color={tabColor}
                bold={isActive}
                dimColor={tab.disabled}
              >
                {index + 1}. {tab.label}
              </Text>
            </Box>
          );
        })}
      </Box>
      
      {/* Tab content */}
      <Box
        flexDirection="column"
        padding={2}
        borderStyle="single"
        borderColor={COLORS.border}
      >
        {activeTabContent}
      </Box>
      
      {/* Help text */}
      <Box marginTop={1}>
        <Text color={COLORS.text.muted}>
          Use Tab/Shift+Tab or arrow keys to navigate tabs, or press tab number (1-{Math.min(tabs.length, 9)})
        </Text>
      </Box>
    </Box>
  );
};

export default Tabs;