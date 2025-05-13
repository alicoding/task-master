import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Layout from '../components/Layout.tsx';
import TextInput from '../components/TextInput.tsx';
import Button from '../components/Button.tsx';
import StatusBar from '../components/StatusBar.tsx';
import Progress from '../components/Progress.tsx';
import ConfirmDialog from '../components/ConfirmDialog.tsx';
import { useNavigationStore } from '../context/NavigationContext.ts';
import { Screen } from '../constants/screens.ts';
import { COLORS, ICONS } from '../constants/theme.ts';
import SelectInput from 'ink-select-input';
import Menu from '../components/Menu.tsx';

// Task status options
const STATUS_OPTIONS = [
  { label: 'Todo', value: 'todo', hint: 'Not started' },
  { label: 'In Progress', value: 'in_progress', hint: 'Currently working on' },
  { label: 'Done', value: 'done', hint: 'Completed task' },
  { label: 'Blocked', value: 'blocked', hint: 'Waiting on something' },
];

// Task priority options
const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low', hint: 'Can wait' },
  { label: 'Medium', value: 'medium', hint: 'Normal priority' },
  { label: 'High', value: 'high', hint: 'Important' },
  { label: 'Critical', value: 'critical', hint: 'Urgent attention needed' },
];

// Available tags
const AVAILABLE_TAGS = [
  'bug', 'feature', 'enhancement', 'documentation', 'refactor', 'test',
  'performance', 'security', 'design', 'ux', 'backend', 'frontend',
];

// Form steps
enum FormStep {
  TITLE = 'title',
  DESCRIPTION = 'description',
  STATUS = 'status',
  PRIORITY = 'priority',
  TAGS = 'tags',
  REVIEW = 'review',
}

/**
 * Task creation screen
 */
const TaskCreate: React.FC = () => {
  const { setBreadcrumbs, navigateTo, goBack } = useNavigationStore();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.TITLE);
  
  // UI state
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmIsDestructive, setConfirmIsDestructive] = useState(false);
  
  // Validation state
  const [titleError, setTitleError] = useState('');
  
  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs(['Main Menu', 'Task Management', 'Create Task']);
  }, [setBreadcrumbs]);
  
  // Handle keyboard shortcuts
  useInput((input, key) => {
    // Skip to next step with Tab
    if (key.tab && !key.shift) {
      handleNextStep();
    }
    
    // Go to previous step with Shift+Tab
    if (key.tab && key.shift) {
      handlePreviousStep();
    }
    
    // Cancel with Escape (if not in dialog)
    if (key.escape && !showConfirmDialog) {
      handleCancel();
    }
    
    // Submit with Ctrl+S
    if (key.ctrl && input === 's') {
      handleSave();
    }
  });
  
  // Validate title
  const validateTitle = (value: string) => {
    if (!value.trim()) {
      setTitleError('Title is required');
      return false;
    }
    
    setTitleError('');
    return true;
  };
  
  // Handle moving to next step
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === FormStep.TITLE && !validateTitle(title)) {
      return;
    }
    
    // Move to next step
    switch (currentStep) {
      case FormStep.TITLE:
        setCurrentStep(FormStep.DESCRIPTION);
        break;
      case FormStep.DESCRIPTION:
        setCurrentStep(FormStep.STATUS);
        break;
      case FormStep.STATUS:
        setCurrentStep(FormStep.PRIORITY);
        break;
      case FormStep.PRIORITY:
        setCurrentStep(FormStep.TAGS);
        break;
      case FormStep.TAGS:
        setCurrentStep(FormStep.REVIEW);
        break;
      case FormStep.REVIEW:
        handleSave();
        break;
    }
  };
  
  // Handle moving to previous step
  const handlePreviousStep = () => {
    switch (currentStep) {
      case FormStep.DESCRIPTION:
        setCurrentStep(FormStep.TITLE);
        break;
      case FormStep.STATUS:
        setCurrentStep(FormStep.DESCRIPTION);
        break;
      case FormStep.PRIORITY:
        setCurrentStep(FormStep.STATUS);
        break;
      case FormStep.TAGS:
        setCurrentStep(FormStep.PRIORITY);
        break;
      case FormStep.REVIEW:
        setCurrentStep(FormStep.TAGS);
        break;
    }
  };
  
  // Handle cancellation
  const handleCancel = () => {
    // Show confirmation dialog if form has data
    if (title || description || status !== 'todo' || priority !== 'medium' || tags.length > 0) {
      setConfirmTitle('Cancel Task Creation?');
      setConfirmMessage('You will lose all entered data. Are you sure you want to cancel?');
      setConfirmIsDestructive(true);
      setConfirmAction(() => () => goBack());
      setShowConfirmDialog(true);
    } else {
      goBack();
    }
  };
  
  // Handle saving the task
  const handleSave = () => {
    // Validate form
    if (!validateTitle(title)) {
      setCurrentStep(FormStep.TITLE);
      return;
    }
    
    // Show saving message
    setMessage('Saving task...');
    setMessageType('info');
    
    // Simulate saving
    setTimeout(() => {
      setMessage('Task created successfully!');
      setMessageType('success');
      
      // Go back to task list after a delay
      setTimeout(() => {
        navigateTo(Screen.TASK_MENU);
      }, 1500);
    }, 1500);
  };
  
  // Handle toggling a tag
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };
  
  // Save progress locally (would use localStorage in a browser)
  const saveProgress = () => {
    setMessage('Saving progress...');
    setMessageType('info');
    
    // Simulate saving
    setTimeout(() => {
      setMessage('Progress saved! You can continue later.');
      setMessageType('success');
      
      // Clear message after a delay
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    }, 1000);
  };
  
  // Progress steps
  const progressSteps = [
    {
      id: FormStep.TITLE,
      label: 'Title',
      status: currentStep === FormStep.TITLE
        ? 'in_progress'
        : title
          ? 'completed'
          : 'pending',
    },
    {
      id: FormStep.DESCRIPTION,
      label: 'Description',
      status: currentStep === FormStep.DESCRIPTION
        ? 'in_progress'
        : currentStep === FormStep.TITLE
          ? 'pending'
          : 'completed',
    },
    {
      id: FormStep.STATUS,
      label: 'Status',
      status: currentStep === FormStep.STATUS
        ? 'in_progress'
        : currentStep < FormStep.STATUS
          ? 'pending'
          : 'completed',
    },
    {
      id: FormStep.PRIORITY,
      label: 'Priority',
      status: currentStep === FormStep.PRIORITY
        ? 'in_progress'
        : currentStep < FormStep.PRIORITY
          ? 'pending'
          : 'completed',
    },
    {
      id: FormStep.TAGS,
      label: 'Tags',
      status: currentStep === FormStep.TAGS
        ? 'in_progress'
        : currentStep < FormStep.TAGS
          ? 'pending'
          : 'completed',
    },
    {
      id: FormStep.REVIEW,
      label: 'Review',
      status: currentStep === FormStep.REVIEW
        ? 'in_progress'
        : currentStep < FormStep.REVIEW
          ? 'pending'
          : 'completed',
    },
  ];
  
  // Get current step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case FormStep.TITLE:
        return (
          <Box flexDirection="column">
            <TextInput
              label="Task Title"
              value={title}
              onChange={(value) => {
                setTitle(value);
                validateTitle(value);
              }}
              placeholder="Enter task title"
              helpText="A clear, concise title for the task"
              error={titleError}
              width={50}
            />
          </Box>
        );
        
      case FormStep.DESCRIPTION:
        return (
          <Box flexDirection="column">
            <Text bold color={COLORS.text.primary}>
              Task Description
            </Text>
            
            <Box
              marginTop={1}
              borderStyle="single"
              borderColor={COLORS.border}
              padding={1}
              width={50}
              height={10}
            >
              <TextInput
                value={description}
                onChange={setDescription}
                placeholder="Enter task description (optional)"
                width={48}
              />
            </Box>
            
            <Box marginTop={1}>
              <Text color={COLORS.text.muted}>
                Provide details about what needs to be done
              </Text>
            </Box>
          </Box>
        );
        
      case FormStep.STATUS:
        return (
          <Box flexDirection="column">
            <Text bold color={COLORS.text.primary}>
              Task Status
            </Text>
            
            <Box marginTop={1}>
              <Menu
                items={STATUS_OPTIONS}
                onSelect={(item) => setStatus(item.value)}
                label="Select task status:"
              />
            </Box>
          </Box>
        );
        
      case FormStep.PRIORITY:
        return (
          <Box flexDirection="column">
            <Text bold color={COLORS.text.primary}>
              Task Priority
            </Text>
            
            <Box marginTop={1}>
              <Menu
                items={PRIORITY_OPTIONS}
                onSelect={(item) => setPriority(item.value)}
                label="Select task priority:"
              />
            </Box>
          </Box>
        );
        
      case FormStep.TAGS:
        return (
          <Box flexDirection="column">
            <Text bold color={COLORS.text.primary}>
              Task Tags
            </Text>
            
            <Box marginTop={1} flexDirection="column">
              <Text>
                Selected tags: {tags.length > 0 ? tags.join(', ') : 'None'}
              </Text>
              
              <Box marginTop={1} flexWrap="wrap">
                {AVAILABLE_TAGS.map(tag => (
                  <Button
                    key={tag}
                    label={tag}
                    variant={tags.includes(tag) ? 'secondary' : 'outline'}
                    selected={tags.includes(tag)}
                    onSelect={() => toggleTag(tag)}
                    marginRight={1}
                    marginBottom={1}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        );
        
      case FormStep.REVIEW:
        return (
          <Box flexDirection="column">
            <Text bold color={COLORS.text.primary}>
              Review Task
            </Text>
            
            <Box marginTop={1} flexDirection="column">
              <Box marginBottom={1}>
                <Text bold>Title: </Text>
                <Text>{title}</Text>
              </Box>
              
              <Box marginBottom={1}>
                <Text bold>Description: </Text>
                <Text>{description || 'N/A'}</Text>
              </Box>
              
              <Box marginBottom={1}>
                <Text bold>Status: </Text>
                <Text>{STATUS_OPTIONS.find(s => s.value === status)?.label || status}</Text>
              </Box>
              
              <Box marginBottom={1}>
                <Text bold>Priority: </Text>
                <Text>{PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}</Text>
              </Box>
              
              <Box marginBottom={1}>
                <Text bold>Tags: </Text>
                <Text>{tags.length > 0 ? tags.join(', ') : 'None'}</Text>
              </Box>
            </Box>
          </Box>
        );
    }
  };
  
  return (
    <Layout title="Create New Task">
      <Box flexDirection="column">
        {/* Status message */}
        {message && (
          <StatusBar
            message={message}
            type={messageType}
            showSpinner={messageType === 'info'}
          />
        )}
        
        <Box>
          {/* Form progress */}
          <Box width="30%">
            <Progress 
              steps={progressSteps}
              currentStep={currentStep}
            />
          </Box>
          
          {/* Current step form */}
          <Box width="70%" paddingLeft={2}>
            {renderCurrentStep()}
          </Box>
        </Box>
        
        {/* Navigation buttons */}
        <Box marginTop={3}>
          {currentStep !== FormStep.TITLE && (
            <Button
              label="Previous"
              variant="outline"
              onSelect={handlePreviousStep}
              marginRight={2}
              shortcut="⇧+Tab"
            />
          )}
          
          {currentStep !== FormStep.REVIEW && (
            <Button
              label="Next"
              variant="primary"
              onSelect={handleNextStep}
              marginRight={2}
              shortcut="Tab"
            />
          )}
          
          {currentStep === FormStep.REVIEW && (
            <Button
              label="Create Task"
              variant="success"
              onSelect={handleSave}
              marginRight={2}
              shortcut="Enter"
            />
          )}
          
          <Button
            label="Save Progress"
            variant="secondary"
            onSelect={saveProgress}
            marginRight={2}
            shortcut="Ctrl+S"
          />
          
          <Button
            label="Cancel"
            variant="outline"
            onSelect={handleCancel}
            shortcut="Esc"
          />
        </Box>
      </Box>
      
      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          title={confirmTitle}
          message={confirmMessage}
          isDestructive={confirmIsDestructive}
          onConfirm={() => {
            setShowConfirmDialog(false);
            confirmAction();
          }}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </Layout>
  );
};

export default TaskCreate;