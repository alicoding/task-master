/**
 * AI Configuration Setup
 * Interactive wizard for configuring AI providers with enhanced UX
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { AiProviderFactory } from '../../../core/ai/factory';
import { EnvManager } from './env-manager';
import { testConnection, displayConnectionResults } from './connection-tester';

// Define environment variables by provider
interface EnvVarsByProvider {
  [key: string]: {
    name: string;
    description: string;
    variables: {
      name: string;
      description: string;
      required: boolean;
      secret?: boolean;
      default?: string;
      help?: string;
    }[];
  };
}

// Environment variables for each provider with enhanced descriptions and help text
const ENV_VARS_BY_PROVIDER: EnvVarsByProvider = {
  openai: {
    name: 'OpenAI',
    description: 'Configure OpenAI API for GPT-3.5 and GPT-4 models',
    variables: [
      {
        name: 'OPENAI_API_KEY',
        description: 'API Key',
        required: true,
        secret: true,
        help: 'Find your OpenAI API key in your account dashboard at https://platform.openai.com/api-keys'
      },
      {
        name: 'OPENAI_MODEL',
        description: 'Model',
        required: false,
        default: 'gpt-4',
        help: 'Choose the AI model to use. GPT-4 is more capable but costs more, while GPT-3.5 is faster and cheaper.'
      },
      {
        name: 'OPENAI_TEMPERATURE',
        description: 'Temperature',
        required: false,
        default: '0.7',
        help: 'Controls randomness. Lower values (0.0-0.5) for more focused, deterministic outputs. Higher values (0.7-1.0) for more creative, varied responses.'
      },
      {
        name: 'OPENAI_ORGANIZATION',
        description: 'Organization ID',
        required: false,
        help: 'Optional: Only needed if you belong to multiple organizations and need to specify which one to use.'
      }
    ]
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Configure Anthropic\'s Claude models with state-of-the-art capabilities',
    variables: [
      {
        name: 'ANTHROPIC_API_KEY',
        description: 'API Key',
        required: true,
        secret: true,
        help: 'Find your Anthropic API key in your account dashboard at https://console.anthropic.com/settings/keys'
      },
      {
        name: 'ANTHROPIC_MODEL',
        description: 'Model',
        required: false,
        default: 'claude-3-opus-20240229',
        help: 'Claude 3 Opus is the most powerful model, Sonnet is balanced, and Haiku is fastest.'
      },
      {
        name: 'ANTHROPIC_TEMPERATURE',
        description: 'Temperature',
        required: false,
        default: '0.7',
        help: 'Controls randomness. Lower values (0.0-0.5) for more focused, deterministic outputs. Higher values (0.7-1.0) for more creative, varied responses.'
      }
    ]
  },
  'custom-openai': {
    name: 'Custom OpenAI Compatible',
    description: 'Configure custom OpenAI-compatible API endpoints like local models or other services',
    variables: [
      {
        name: 'CUSTOM_OPENAI_BASE_URL',
        description: 'API Base URL',
        required: true,
        default: 'http://localhost:11434/v1',
        help: 'The base URL for your custom OpenAI-compatible endpoint. For Ollama, use http://localhost:11434/v1'
      },
      {
        name: 'CUSTOM_OPENAI_API_KEY',
        description: 'API Key',
        required: false,
        secret: true,
        help: 'API key for your custom endpoint. May be optional for local providers like Ollama.'
      },
      {
        name: 'CUSTOM_OPENAI_MODEL',
        description: 'Model Name',
        required: false,
        default: 'llama3',
        help: 'The model to use with your custom endpoint. For Ollama, examples include llama3, mistral, phi-2, etc.'
      },
      {
        name: 'CUSTOM_OPENAI_PROVIDER_NAME',
        description: 'Provider Display Name',
        required: false,
        default: 'Custom OpenAI',
        help: 'A friendly name for your custom provider, used in logs and outputs.'
      },
      {
        name: 'CUSTOM_OPENAI_TEMPERATURE',
        description: 'Temperature',
        required: false,
        default: '0.7',
        help: 'Controls randomness. Lower values (0.0-0.5) for more focused, deterministic outputs. Higher values (0.7-1.0) for more creative, varied responses.'
      }
    ]
  },
  mock: {
    name: 'Mock Provider (No API Key)',
    description: 'Use a mock provider for development and testing without requiring API keys',
    variables: [
      {
        name: 'AI_DEBUG',
        description: 'Enable debug mode',
        required: false,
        default: 'false',
        help: 'Enable debug mode to see detailed logs of mock AI operations.'
      }
    ]
  }
};

// Advanced model suggestions by provider
const MODEL_SUGGESTIONS: {[key: string]: Array<{name: string; description: string}>} = {
  openai: [
    { name: 'gpt-4', description: 'Most capable GPT-4 model for complex tasks' },
    { name: 'gpt-4-0125-preview', description: 'Latest GPT-4 with improved reasoning and instruction following' },
    { name: 'gpt-4-1106-preview', description: 'Previous GPT-4 version, good balance of capabilities' },
    { name: 'gpt-3.5-turbo', description: 'Fast and cost-effective for simpler tasks' }
  ],
  anthropic: [
    { name: 'claude-3-opus-20240229', description: 'Most powerful Claude model with advanced reasoning' },
    { name: 'claude-3-sonnet-20240229', description: 'Balanced performance and cost' },
    { name: 'claude-3-haiku-20240307', description: 'Fastest, most cost-effective Claude model' }
  ],
  'custom-openai': [
    { name: 'llama3', description: 'Meta\'s Llama 3 model' },
    { name: 'mistral', description: 'Mistral AI model' },
    { name: 'phi-2', description: 'Microsoft Phi-2 small model' },
    { name: 'gemma', description: 'Google\'s Gemma model' },
    { name: 'gpt4all', description: 'Open-source GPT4All model' }
  ]
};

// Environment Manager instance
const envManager = new EnvManager({
  backupOnSave: true,
  mergeStrategy: 'prompt'
});

/**
 * Test connection to the configured AI provider with enhanced diagnostics
 */
async function testAiProviderConnection(providerType: string): Promise<boolean> {
  const verbose = await p.confirm({
    message: 'Do you want to see detailed diagnostics during the test?',
    initialValue: false
  });

  // Handle cancellation
  if (p.isCancel(verbose)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }

  // Run enhanced connection test
  const result = await testConnection(providerType, verbose);

  // Display detailed results
  displayConnectionResults(result);

  return result?.success;
}

/**
 * Configure a single environment variable via prompt
 */
async function configureEnvVar(
  variable: {name: string; description: string; required: boolean; secret?: boolean; default?: string; help?: string},
  currentValue?: string,
  forceReconfigure: boolean = false
): Promise<string | undefined> {
  // If we already have a value and not forcing reconfiguration, confirm if user wants to change
  if (currentValue && !forceReconfigure) {
    const displayValue = variable.secret ? '********' : currentValue;
    
    p.log.info(`${variable.description}: ${chalk.green(displayValue)} ${chalk.gray('(Existing)')}`);
    
    if (variable.help) {
      p.note(variable.help, 'Help');
    }
    
    // Ask if the user wants to change this value
    const changeValue = await p.confirm({
      message: `Do you want to change the existing ${variable.description}?`,
      initialValue: false,
    });
    
    // Handle cancellation
    if (p.isCancel(changeValue)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }
    
    if (!changeValue) {
      return currentValue;
    }
  }
  
  // Show help text if available
  if (variable.help) {
    p.note(variable.help, 'Help');
  }
  
  // Prompt for the value
  // Use different prompt for secret values
  if (variable.secret) {
    // Display placeholder text before the prompt
    if (variable.default) {
      p.log.info(chalk.gray(`Default value: ${variable.default ? '*'.repeat(8) : ''}`));
    }

    const value = await p.password({
      message: `Enter ${variable.description}${variable.required ? '' : ' (optional)'}:`,
      validate: (input) => {
        if (variable.required && !input) {
          return `${variable.description} is required`;
        }
      }
    });

    // Handle cancellation
    if (p.isCancel(value)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    return value || undefined;
  } else {
    // Regular text input for non-secret values
    const value = await p.text({
      message: `Enter ${variable.description}${variable.required ? '' : ' (optional)'}:`,
      placeholder: variable.default || '',
      initialValue: variable.default || '',
      validate: (input) => {
        if (variable.required && !input) {
          return `${variable.description} is required`;
        }
      }
    });

    // Handle cancellation
    if (p.isCancel(value)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    return value || undefined;
  }
}

/**
 * Configure a provider with all its environment variables
 */
async function configureProvider(
  providerType: string,
  currentEnvVars: {[key: string]: string},
  forceReconfigure: boolean = false
): Promise<{[key: string]: string}> {
  const provider = ENV_VARS_BY_PROVIDER[providerType];
  const newEnvVars: {[key: string]: string} = { ...currentEnvVars };

  p.note(provider.description, provider.name);

  // Set provider type
  newEnvVars['AI_PROVIDER_TYPE'] = providerType;

  // Use the enhanced model selection interface
  const modelVar = provider.variables.find(v => v.name.includes('MODEL'));

  if (modelVar) {
    const currentModelValue = envManager.get(modelVar.name);

    // If we need to configure this variable
    if (forceReconfigure || !currentModelValue) {
      try {
        // Import the selectModel function dynamically to avoid circular dependencies
        const { selectModel } = await import('./model-selection');

        p.log.info(`Launching enhanced model selection for ${provider.name}...`);

        // Get model selection from the enhanced UI
        const modelChoice = await selectModel(
          providerType,
          currentModelValue
        );

        if (modelChoice) {
          newEnvVars[modelVar.name] = modelChoice;
        } else {
          // If model selection failed or was cancelled, prompt for manual entry
          const customModel = await p.text({
            message: 'Enter model name manually:',
            placeholder: currentModelValue || modelVar.default || '',
            validate: (input) => {
              if (!input) return 'Model name is required';
            }
          });

          // Handle cancellation
          if (p.isCancel(customModel)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }

          newEnvVars[modelVar.name] = customModel;
        }
      } catch (error) {
        // Fallback to simple selection if enhanced selection fails
        p.log?.error(`Enhanced model selection error: ${error instanceof Error ? error.message : String(error)}`);
        p.log.info('Falling back to simple model selection...');

        const modelOptions = (MODEL_SUGGESTIONS[providerType] || []).map(model => ({
          value: model.name,
          label: model.name,
          hint: model.description
        }));

        modelOptions.push({
          value: 'custom',
          label: 'Custom model',
          hint: 'Enter a model name manually'
        });

        const modelChoice = await p.select({
          message: `Select ${modelVar.description}:`,
          options: modelOptions,
          initialValue: currentModelValue || modelVar.default || (modelOptions.length > 0 ? modelOptions[0].value : '')
        });

        // Handle cancellation
        if (p.isCancel(modelChoice)) {
          p.cancel('Setup cancelled');
          process.exit(0);
        }

        if (modelChoice === 'custom') {
          // Prompt for custom model
          const customModel = await p.text({
            message: 'Enter custom model name:',
            placeholder: currentModelValue || modelVar.default || '',
            validate: (input) => {
              if (!input) return 'Model name is required';
            }
          });

          // Handle cancellation
          if (p.isCancel(customModel)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }

          newEnvVars[modelVar.name] = customModel;
        } else {
          // Use selected model
          newEnvVars[modelVar.name] = modelChoice;
        }
      }

      // Skip this variable in the loop below since we've already handled it
      provider.variables = provider.variables.filter(v => v.name !== modelVar.name);
    }
  }

  // Configure each environment variable
  for (const variable of provider.variables) {
    const currentValue = envManager.get(variable.name);
    const newValue = await configureEnvVar(variable, currentValue, forceReconfigure);

    if (newValue !== undefined) {
      newEnvVars[variable.name] = newValue;
    }
  }

  return newEnvVars;
}

/**
 * Main function to set up AI configuration
 */
export async function setupAiConfiguration(forceReconfigure: boolean = false): Promise<void> {
  p.note('Configure your preferred AI provider for Task Master', 'AI Provider Setup');

  // Load existing environment variables
  const currentEnvVars = await envManager.load();

  // Determine current provider type
  const currentProviderType = currentEnvVars['AI_PROVIDER_TYPE'] || 'mock';

  // Ask if the user wants to restore from a backup
  if (!forceReconfigure) {
    const backups = await envManager.listBackups();

    if (backups.length > 0) {
      const checkBackups = await p.confirm({
        message: 'Would you like to restore from a previous backup?',
        initialValue: false
      });

      // Handle cancellation
      if (p.isCancel(checkBackups)) {
        p.cancel('Setup cancelled');
        process.exit(0);
      }

      if (checkBackups) {
        // Format backups with timestamps
        const backupOptions = backups.map(backup => {
          const timestamp = backup.replace('.env.backup-', '');
          const date = new Date(parseInt(timestamp));
          return {
            value: backup,
            label: `Backup from ${date.toLocaleString()}`,
          };
        });

        const selectedBackup = await p.select({
          message: 'Select a backup to restore:',
          options: backupOptions
        });

        // Handle cancellation
        if (p.isCancel(selectedBackup)) {
          p.cancel('Setup cancelled');
          process.exit(0);
        }

        // Restore from the selected backup
        const restored = await envManager.restoreFromBackup(selectedBackup);

        if (restored) {
          p.note('Configuration restored from backup', 'Success');

          // Reload env vars after restore
          await envManager.load();

          // Check if the user wants to continue with configuration
          const continueSetup = await p.confirm({
            message: 'Would you like to continue configuring AI settings?',
            initialValue: true
          });

          // Handle cancellation
          if (p.isCancel(continueSetup)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }

          if (!continueSetup) {
            p.note('Setup complete', 'Success');
            return;
          }
        }
      }
    }
  }

  // Ask which provider to configure
  let providerType: string;

  if (currentProviderType && !forceReconfigure) {
    p.log.info(`Current AI provider: ${chalk.green(ENV_VARS_BY_PROVIDER[currentProviderType]?.name || currentProviderType)}`);

    const changeProvider = await p.confirm({
      message: 'Do you want to change the AI provider?',
      initialValue: false
    });

    // Handle cancellation
    if (p.isCancel(changeProvider)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    if (changeProvider) {
      // Choose a new provider
      const providerOptions = Object.entries(ENV_VARS_BY_PROVIDER).map(([key, provider]) => ({
        value: key,
        label: provider.name,
        hint: provider.description
      }));

      const provider = await p.select({
        message: 'Select AI provider:',
        options: providerOptions,
        initialValue: currentProviderType
      });

      // Handle cancellation
      if (p.isCancel(provider)) {
        p.cancel('Setup cancelled');
        process.exit(0);
      }

      providerType = provider;
    } else {
      providerType = currentProviderType;
    }
  } else {
    // Choose a provider
    const providerOptions = Object.entries(ENV_VARS_BY_PROVIDER).map(([key, provider]) => ({
      value: key,
      label: provider.name,
      hint: provider.description
    }));

    const provider = await p.select({
      message: 'Select AI provider:',
      options: providerOptions,
      initialValue: 'mock'
    });

    // Handle cancellation
    if (p.isCancel(provider)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    providerType = provider;
  }

  // Configure the selected provider
  const newEnvVars = await configureProvider(providerType, currentEnvVars, forceReconfigure);

  // Set global debug mode
  if (!newEnvVars['AI_DEBUG'] || forceReconfigure) {
    const enableDebug = await p.confirm({
      message: 'Enable AI debug mode? (logs AI operations to console)',
      initialValue: newEnvVars['AI_DEBUG'] === 'true' || false
    });

    // Handle cancellation
    if (p.isCancel(enableDebug)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    newEnvVars['AI_DEBUG'] = enableDebug.toString();
  }

  // Save the configuration using merge to handle conflicts
  await envManager.merge(newEnvVars);
  await envManager.save();

  // Test the connection
  if (providerType !== 'mock') {
    const testConnection = await p.confirm({
      message: 'Test connection to the AI provider?',
      initialValue: true
    });

    // Handle cancellation
    if (p.isCancel(testConnection)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }

    if (testConnection) {
      // Apply the environment variables to the current process
      Object.entries(newEnvVars).forEach(([key, value]) => {
        process.env[key] = value;
      });

      // Test the connection
      const success = await testAiProviderConnection(providerType);

      if (success) {
        p.note('AI provider configuration complete and connection successfully tested!', 'Success');
      } else {
        p.note([
          'AI provider configuration saved, but connection test failed.',
          'Check your API key and configuration settings.',
          'You can update your configuration at any time by running: tm setup --ai'
        ].join('\n'), 'Warning');
      }
    } else {
      p.note([
        'AI provider configuration complete!',
        'You can test the connection later with: tm ai test-connection'
      ].join('\n'), 'Success');
    }
  } else {
    p.note([
      'Mock AI provider configured. No connection test needed.',
      'This provider simulates AI responses without requiring an API key.',
      'When you\'re ready to use a real AI provider, run: tm setup --ai'
    ].join('\n'), 'Success');
  }
}