import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Layout from '../components/Layout.tsx';
import TextInput from '../components/TextInput.tsx';
import Button from '../components/Button.tsx';
import StatusBar from '../components/StatusBar.tsx';
import Progress from '../components/Progress.tsx';
import { useNavigationStore } from '../context/NavigationContext.ts';
import { COLORS, ICONS } from '../constants/theme.ts';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import Menu from '../components/Menu.tsx';

// AI Provider types
const AI_PROVIDERS = [
  { 
    label: 'OpenAI', 
    value: 'openai',
    hint: 'GPT-3.5, GPT-4',
    description: 'Configure OpenAI API for GPT-3.5 and GPT-4 models',
  },
  { 
    label: 'Anthropic', 
    value: 'anthropic',
    hint: 'Claude models',
    description: 'Configure Anthropic\'s Claude models with state-of-the-art capabilities',
  },
  { 
    label: 'Custom OpenAI Compatible', 
    value: 'custom-openai',
    hint: 'Ollama, etc.',
    description: 'Configure custom OpenAI-compatible API endpoints like local models or other services',
  },
  { 
    label: 'Mock Provider', 
    value: 'mock',
    hint: 'For development and testing',
    description: 'Use a mock provider for development and testing without requiring API keys',
  },
];

// OpenAI Models
const OPENAI_MODELS = [
  {
    label: 'GPT-4o',
    value: 'gpt-4o',
    hint: 'Most capable',
    description: 'OpenAI\'s most capable model with improved reasoning capabilities',
    tokens: '128,000',
    pricing: '$0.005/1K input tokens, $0.015/1K output tokens',
  },
  {
    label: 'GPT-4 Turbo',
    value: 'gpt-4-turbo',
    hint: 'Great performance',
    description: 'Powerful GPT-4 model with improved cost efficiency',
    tokens: '128,000',
    pricing: '$0.01/1K input tokens, $0.03/1K output tokens',
  },
  {
    label: 'GPT-3.5 Turbo',
    value: 'gpt-3.5-turbo',
    hint: 'Fastest, cheapest',
    description: 'Fast and cost-effective model for simpler tasks',
    tokens: '16,385',
    pricing: '$0.0005/1K input tokens, $0.0015/1K output tokens',
  },
];

// Anthropic Models
const ANTHROPIC_MODELS = [
  {
    label: 'Claude 3 Opus',
    value: 'claude-3-opus-20240229',
    hint: 'Most powerful',
    description: 'Most powerful Claude model with excellent reasoning',
    tokens: '200,000',
    pricing: '$15/million input tokens, $75/million output tokens',
  },
  {
    label: 'Claude 3 Sonnet',
    value: 'claude-3-sonnet-20240229',
    hint: 'Balanced',
    description: 'Balance of intelligence and speed',
    tokens: '200,000',
    pricing: '$3/million input tokens, $15/million output tokens',
  },
  {
    label: 'Claude 3 Haiku',
    value: 'claude-3-haiku-20240307',
    hint: 'Fastest',
    description: 'Fastest Claude model optimized for production use cases',
    tokens: '200,000',
    pricing: '$0.25/million input tokens, $1.25/million output tokens',
  },
];

/**
 * AI Configuration screen
 */
const ConfigAI: React.FC = () => {
  const { setBreadcrumbs, navigateTo, goBack } = useNavigationStore();
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  
  // Configuration state
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Validation state
  const [apiKeyError, setApiKeyError] = useState('');
  
  // Models based on provider
  const getModelsForProvider = (provider: string) => {
    switch (provider) {
      case 'openai':
        return OPENAI_MODELS;
      case 'anthropic':
        return ANTHROPIC_MODELS;
      default:
        return [];
    }
  };
  
  // Get hints for provider API keys
  const getApiKeyHint = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'Starts with "sk-"';
      case 'anthropic':
        return 'Starts with "sk-ant-"';
      case 'custom-openai':
        return 'May be optional for local providers';
      default:
        return '';
    }
  };
  
  // Set default model when provider changes
  useEffect(() => {
    const models = getModelsForProvider(provider);
    if (models.length > 0) {
      setModel(models[0].value);
    } else {
      setModel('');
    }
  }, [provider]);
  
  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs(['Main Menu', 'Configuration', 'AI Provider']);
  }, [setBreadcrumbs]);
  
  // Validate API key
  const validateApiKey = (key: string, provider: string) => {
    if (provider === 'mock') {
      return true;
    }
    
    if (!key) {
      setApiKeyError('API key is required');
      return false;
    }
    
    if (provider === 'openai' && !key.startsWith('sk-')) {
      setApiKeyError('OpenAI API key should start with "sk-"');
      return false;
    }
    
    if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
      setApiKeyError('Anthropic API key should start with "sk-ant-"');
      return false;
    }
    
    setApiKeyError('');
    return true;
  };
  
  // Handle provider selection
  const handleProviderSelect = (item: any) => {
    setProvider(item.value);
  };
  
  // Handle model selection
  const handleModelSelect = (item: any) => {
    setModel(item.value);
  };
  
  // Test connection
  const testConnection = () => {
    if (!validateApiKey(apiKey, provider)) {
      return;
    }
    
    setTestingConnection(true);
    setStatus('Testing connection to AI provider...');
    setStatusType('info');
    
    // Simulate testing
    setTimeout(() => {
      setTestingConnection(false);
      
      if (Math.random() > 0.3) {
        setStatus('Connection successful!');
        setStatusType('success');
      } else {
        setStatus('Connection failed. Please check your API key and try again.');
        setStatusType('error');
      }
      
      // Clear status after a while
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    }, 2000);
  };
  
  // Save configuration
  const saveConfiguration = () => {
    if (!validateApiKey(apiKey, provider)) {
      return;
    }
    
    setStatus('Saving configuration...');
    setStatusType('info');
    
    // Simulate saving
    setTimeout(() => {
      setStatus('Configuration saved successfully!');
      setStatusType('success');
      
      // Go back after a while
      setTimeout(() => {
        goBack();
      }, 1500);
    }, 1500);
  };
  
  // Get current step of the configuration process
  const getCurrentStep = () => {
    if (!provider) return 'provider';
    if (!model && getModelsForProvider(provider).length > 0) return 'model';
    if (!apiKey && provider !== 'mock') return 'apiKey';
    return 'save';
  };
  
  // Configuration progress steps
  const configSteps = [
    {
      id: 'provider',
      label: 'Select AI Provider',
      status: provider ? 'completed' : 'in_progress',
    },
    {
      id: 'model',
      label: 'Select Model',
      status: getModelsForProvider(provider).length === 0
        ? 'skipped'
        : model
          ? 'completed'
          : 'in_progress',
    },
    {
      id: 'apiKey',
      label: 'Enter API Key',
      status: provider === 'mock'
        ? 'skipped'
        : apiKey
          ? 'completed'
          : 'in_progress',
    },
    {
      id: 'test',
      label: 'Test Connection',
      status: testingConnection
        ? 'in_progress'
        : status === 'Connection successful!'
          ? 'completed'
          : status === 'Connection failed. Please check your API key and try again.'
            ? 'error'
            : 'pending',
    },
    {
      id: 'save',
      label: 'Save Configuration',
      status: status === 'Configuration saved successfully!'
        ? 'completed'
        : status === 'Saving configuration...'
          ? 'in_progress'
          : 'pending',
    },
  ];
  
  return (
    <Layout title="AI Provider Configuration">
      <Box flexDirection="column">
        {/* Status messages */}
        {status && (
          <StatusBar
            message={status}
            type={statusType}
            showSpinner={statusType === 'info'}
          />
        )}
        
        {/* Progress indicator */}
        <Box marginBottom={2}>
          <Progress 
            steps={configSteps}
            currentStep={getCurrentStep()}
          />
        </Box>
        
        {/* Provider selection */}
        <Box flexDirection="column" marginBottom={2}>
          <Text bold color={COLORS.text.primary}>
            AI Provider
          </Text>
          
          <Box marginTop={1}>
            <Menu
              items={AI_PROVIDERS}
              onSelect={handleProviderSelect}
              label="Select AI Provider:"
              searchable
            />
          </Box>
        </Box>
        
        {/* Model selection for providers with models */}
        {getModelsForProvider(provider).length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Text bold color={COLORS.text.primary}>
              AI Model
            </Text>
            
            <Box marginTop={1}>
              <Menu
                items={getModelsForProvider(provider).map(m => ({
                  ...m,
                  description: `${m.description}\n${m.tokens} tokens | ${m.pricing}`,
                }))}
                onSelect={handleModelSelect}
                label={`Select Model for ${provider}:`}
                searchable
              />
            </Box>
          </Box>
        )}
        
        {/* API Key input (except for mock provider) */}
        {provider !== 'mock' && (
          <Box flexDirection="column" marginBottom={2}>
            <TextInput
              label="API Key"
              value={apiKey}
              onChange={(value) => {
                setApiKey(value);
                validateApiKey(value, provider);
              }}
              placeholder={`Enter ${provider} API key`}
              mask="•"
              helpText={getApiKeyHint(provider)}
              error={apiKeyError}
              width={50}
            />
          </Box>
        )}
        
        {/* Temperature input */}
        <Box flexDirection="column" marginBottom={2}>
          <TextInput
            label="Temperature"
            value={temperature}
            onChange={setTemperature}
            placeholder="0.7"
            helpText="Lower values (0.0-0.5) for more deterministic outputs, higher values (0.7-1.0) for more creative responses"
            width={10}
          />
        </Box>
        
        {/* Action buttons */}
        <Box marginTop={2}>
          <Button
            label="Test Connection"
            variant="secondary"
            disabled={provider === 'mock' || !apiKey || testingConnection}
            onSelect={testConnection}
            marginRight={2}
          />
          
          <Button
            label="Save Configuration"
            variant="primary"
            onSelect={saveConfiguration}
            marginRight={2}
          />
          
          <Button
            label="Cancel"
            variant="outline"
            onSelect={() => goBack()}
          />
        </Box>
      </Box>
    </Layout>
  );
};

export default ConfigAI;