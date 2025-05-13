import React from 'react';
import { Box, Text } from 'ink';
import { COLORS, ICONS } from '../constants/theme.ts';
import Spinner from 'ink-spinner';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped';
  description?: string;
}

interface ProgressProps {
  steps: ProgressStep[];
  currentStep: string;
  showDetails?: boolean;
}

/**
 * Progress component for multi-step processes
 */
const Progress: React.FC<ProgressProps> = ({
  steps,
  currentStep,
  showDetails = true,
}) => {
  // Calculate progress
  const completedSteps = steps.filter(step => 
    step.status === 'completed' || step.status === 'skipped'
  ).length;
  
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);
  
  // Create progress bar
  const barWidth = 30;
  const filledWidth = Math.round((progressPercentage / 100) * barWidth);
  const progressBar = '█'.repeat(filledWidth) + '▒'.repeat(barWidth - filledWidth);
  
  return (
    <Box flexDirection="column">
      {/* Progress percentage and bar */}
      <Box marginBottom={1}>
        <Text bold>
          Progress: <Text color={COLORS.primary}>{progressPercentage}%</Text>
        </Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text color={COLORS.primary}>
          {progressBar}
        </Text>
      </Box>
      
      {/* Step list */}
      <Box flexDirection="column" marginTop={1}>
        {steps.map((step, index) => {
          // Determine step indicator and color
          let indicator;
          let color;
          
          switch (step.status) {
            case 'completed':
              indicator = ICONS.check;
              color = COLORS.status.success;
              break;
            case 'error':
              indicator = ICONS.cross;
              color = COLORS.status.error;
              break;
            case 'in_progress':
              indicator = <Spinner type="dots" />;
              color = COLORS.primary;
              break;
            case 'skipped':
              indicator = '-';
              color = COLORS.text.muted;
              break;
            case 'pending':
            default:
              indicator = `${index + 1}.`;
              color = COLORS.text.secondary;
              break;
          }
          
          // Is current step
          const isCurrent = step.id === currentStep;
          
          return (
            <Box 
              key={step.id} 
              flexDirection="column" 
              marginBottom={1}
              paddingX={1}
              paddingY={0}
              borderStyle={isCurrent ? 'single' : undefined}
              borderColor={isCurrent ? COLORS.primary : undefined}
            >
              <Box>
                <Box width={4} marginRight={1}>
                  <Text color={color}>
                    {indicator}
                  </Text>
                </Box>
                
                <Text color={isCurrent ? COLORS.primary : color} bold={isCurrent}>
                  {step.label}
                </Text>
              </Box>
              
              {/* Step description */}
              {showDetails && step.description && (isCurrent || step.status === 'in_progress') && (
                <Box marginLeft={5} marginTop={1}>
                  <Text color={COLORS.text.secondary}>
                    {step.description}
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Progress;