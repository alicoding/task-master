import React from 'react';
import { Box, Text } from 'ink';
import { COLORS, ICONS } from '../constants/theme.ts';

interface BreadcrumbsProps {
  items: string[];
}

/**
 * Breadcrumbs navigation component
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <Box>
      {items.map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          <Text color={COLORS.text.primary} dimColor={index < items.length - 1}>
            {item}
          </Text>
          
          {index < items.length - 1 && (
            <Text color={COLORS.text.primary} dimColor>
              {' '}{ICONS.arrow.right}{' '}
            </Text>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default Breadcrumbs;