/**
 * Enhanced Model Selection for AI Configuration
 * Provides fuzzy search, grouping, and detailed model information
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { Fzf } from 'fzf';

// Define model data structure with enhanced metadata
interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  pricing?: string;
  tokenLimit?: number;
  recommended?: boolean;
  isDefault?: boolean;
  beta?: boolean;
}

// Model capability groups
type CapabilityGroup = 'code' | 'text' | 'analysis' | 'creativity' | 'reasoning';

// Group definitions with descriptions
interface CapabilityGroupInfo {
  id: CapabilityGroup;
  name: string;
  description: string;
}

const CAPABILITY_GROUPS: CapabilityGroupInfo[] = [
  {
    id: 'code',
    name: 'Code Generation & Understanding',
    description: 'Best for writing, reviewing, and explaining code'
  },
  {
    id: 'text',
    name: 'Text Processing',
    description: 'Efficient for summarization, editing, and formatting text'
  },
  {
    id: 'analysis',
    name: 'Data Analysis',
    description: 'Specialized in analyzing structured data and providing insights'
  },
  {
    id: 'creativity',
    name: 'Creative Writing',
    description: 'Optimized for generating creative content and ideas'
  },
  {
    id: 'reasoning',
    name: 'Complex Reasoning',
    description: 'Strong logical reasoning and problem-solving capabilities'
  }
];

// Enhanced model database with detailed information
const MODELS: ModelInfo[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI\'s most capable model with improved reasoning capabilities',
    capabilities: ['code', 'text', 'analysis', 'creativity', 'reasoning'],
    pricing: '$0.005/1K input tokens, $0.015/1K output tokens',
    tokenLimit: 128000,
    recommended: true,
    isDefault: true
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Powerful GPT-4 model with improved cost efficiency',
    capabilities: ['code', 'text', 'analysis', 'creativity', 'reasoning'],
    pricing: '$0.01/1K input tokens, $0.03/1K output tokens',
    tokenLimit: 128000
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'Original GPT-4 model with strong reasoning capabilities',
    capabilities: ['code', 'text', 'analysis', 'reasoning'],
    pricing: '$0.03/1K input tokens, $0.06/1K output tokens',
    tokenLimit: 8192
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and cost-effective model for simpler tasks',
    capabilities: ['text', 'code'],
    pricing: '$0.0005/1K input tokens, $0.0015/1K output tokens',
    tokenLimit: 16385
  },
  
  // Anthropic Models
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Anthropic\'s most powerful model with superior reasoning',
    capabilities: ['code', 'text', 'analysis', 'creativity', 'reasoning'],
    pricing: '$15/million input tokens, $75/million output tokens',
    tokenLimit: 200000,
    recommended: true,
    isDefault: true
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    description: 'Balance of intelligence and speed with excellent reasoning',
    capabilities: ['code', 'text', 'reasoning', 'analysis'],
    pricing: '$3/million input tokens, $15/million output tokens',
    tokenLimit: 200000
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fastest Claude model optimized for production use cases',
    capabilities: ['text', 'code'],
    pricing: '$0.25/million input tokens, $1.25/million output tokens',
    tokenLimit: 200000
  },
  
  // Custom OpenAI Compatible Models
  {
    id: 'llama3',
    name: 'Llama 3',
    provider: 'custom-openai',
    description: 'Meta\'s open model optimized for performance',
    capabilities: ['text', 'code', 'reasoning'],
    tokenLimit: 8192,
    isDefault: true
  },
  {
    id: 'mistral',
    name: 'Mistral',
    provider: 'custom-openai',
    description: 'Efficient model with strong reasoning capabilities',
    capabilities: ['text', 'reasoning'],
    tokenLimit: 8192
  },
  {
    id: 'gemma',
    name: 'Gemma',
    provider: 'custom-openai',
    description: 'Google\'s lightweight efficient model',
    capabilities: ['text', 'code'],
    tokenLimit: 8192
  },
  {
    id: 'phi-2',
    name: 'Phi-2',
    provider: 'custom-openai',
    description: 'Microsoft\'s compact research model',
    capabilities: ['text'],
    tokenLimit: 2048
  }
];

/**
 * Group models by capability
 */
function groupModelsByCapability(models: ModelInfo[]): Map<string, ModelInfo[]> {
  const groupedModels = new Map<string, ModelInfo[]>();
  
  // Initialize groups
  CAPABILITY_GROUPS.forEach(group => {
    groupedModels.set(group.id, []);
  });
  
  // Add models to their respective groups
  models.forEach(model => {
    model.capabilities.forEach(capability => {
      const group = groupedModels.get(capability);
      if (group) {
        group.push(model);
      }
    });
  });
  
  return groupedModels;
}

/**
 * Get models for a specific provider
 */
function getModelsForProvider(provider: string): ModelInfo[] {
  return MODELS.filter(model => model.provider === provider);
}

/**
 * Get default model for a provider
 */
function getDefaultModel(provider: string): string {
  const model = MODELS.find(m => m.provider === provider && m.isDefault);
  return model?.id || '';
}

/**
 * Format model for display in selection UI
 */
function formatModelForDisplay(model: ModelInfo): string {
  const parts = [
    model.name,
    model.recommended ? chalk.green(' (Recommended)') : '',
    model.beta ? chalk.yellow(' (Beta)') : '',
    '\n',
    chalk.dim(model.description),
    '\n'
  ];
  
  if (model.pricing) {
    parts.push(chalk.blue(`Pricing: ${model.pricing}`));
    parts.push('\n');
  }
  
  if (model.tokenLimit) {
    parts.push(chalk.magenta(`Context: ${model.tokenLimit.toLocaleString()} tokens`));
    parts.push('\n');
  }
  
  parts.push(chalk.dim('Tags: ' + model.capabilities.map(c => {
    const group = CAPABILITY_GROUPS.find(g => g.id === c);
    return group?.name || c;
  }).join(', ')));
  
  return parts.join('');
}

/**
 * Fetch models from API (for providers that support it)
 * This is a placeholder for actual API integration
 */
async function fetchModelsFromApi(provider: string): Promise<ModelInfo[] | null> {
  const s = p.spinner();
  s.start(`Fetching available models from ${provider}...`);
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For now, just return the static models
    // In a real implementation, this would call the provider API
    const models = getModelsForProvider(provider);
    
    s.stop(`Found ${models.length} models from ${provider}`);
    return models;
  } catch (error) {
    s.stop(`Failed to fetch models from ${provider}`);
    p.log?.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Filter models using fuzzy search
 */
function fuzzyFilterModels(models: ModelInfo[], query: string): ModelInfo[] {
  if (!query) return models;
  
  const fzf = new Fzf(models, {
    selector: item => `${item.name} ${item.description} ${item.capabilities.join(' ')}`,
    tiebreakers: [(a, b) => {
      // Prioritize recommended models
      if (a.item.recommended && !b.item.recommended) return -1;
      if (!a.item.recommended && b.item.recommended) return 1;
      return 0;
    }]
  });
  
  const results = fzf.find(query);
  return results.map(result => result?.item);
}

/**
 * Select model with enhanced interactive UI
 */
export async function selectModel(
  provider: string,
  currentModel?: string
): Promise<string | undefined> {
  // Attempt to fetch models from API
  const s = p.spinner();
  s.start('Loading model information...');
  
  // Get models (from API or fallback to static list)
  const models = await fetchModelsFromApi(provider) || getModelsForProvider(provider);
  
  s.stop(`Loaded ${models.length} models for ${provider}`);
  
  if (models.length === 0) {
    p.log?.error(`No models found for ${provider}`);
    return undefined;
  }
  
  // If there's only one model, just return it
  if (models.length === 1) {
    p.log.info(`Only one model available for ${provider}: ${models[0].name}`);
    return models[0].id;
  }
  
  // Show capability groups for context
  p.note(
    CAPABILITY_GROUPS.map(group => 
      `• ${chalk.bold(group.name)}: ${group.description}`
    ).join('\n'),
    'Model Capabilities'
  );
  
  // Determine view mode
  const viewMode = await p.select({
    message: 'How would you like to view available models?',
    options: [
      { value: 'all', label: 'Show all models', hint: `${models.length} models` },
      { value: 'search', label: 'Search models', hint: 'Find by name or capability' },
      { value: 'grouped', label: 'View by capability', hint: 'Models grouped by feature' }
    ],
    initialValue: 'all'
  });
  
  // Handle cancellation
  if (p.isCancel(viewMode)) {
    p.cancel('Model selection cancelled');
    process.exit(0);
  }
  
  let modelToSelect: string;
  
  if (viewMode === 'all') {
    // Show all models in a simple list
    const modelChoice = await p.select({
      message: `Select a model for ${provider}:`,
      options: models.map(model => ({
        value: model.id,
        label: model.name,
        hint: model.recommended ? 'Recommended' : undefined
      })),
      initialValue: currentModel || getDefaultModel(provider)
    });
    
    // Handle cancellation
    if (p.isCancel(modelChoice)) {
      p.cancel('Model selection cancelled');
      process.exit(0);
    }
    
    modelToSelect = modelChoice;
    
  } else if (viewMode === 'search') {
    // Implement fuzzy search
    let filteredModels = [...models];
    let selectedModelId: string | undefined;
    
    while (!selectedModelId) {
      const searchTerm = await p.text({
        message: 'Search models by name, description, or capability:',
        placeholder: 'e.g., "code" or "fast" or "reasoning"'
      });
      
      // Handle cancellation
      if (p.isCancel(searchTerm)) {
        p.cancel('Model selection cancelled');
        process.exit(0);
      }
      
      // Apply fuzzy filter
      filteredModels = fuzzyFilterModels(models, searchTerm.toString());
      
      if (filteredModels.length === 0) {
        p.log?.error('No models match your search. Try a different term.');
        continue;
      }
      
      // Display filtered results
      const modelChoice = await p.select({
        message: `Found ${filteredModels.length} models matching "${searchTerm}":`,
        options: filteredModels.map(model => ({
          value: model.id,
          label: model.name,
          hint: model.description.slice(0, 30) + (model.description.length > 30 ? '...' : '')
        })),
        initialValue: filteredModels[0].id
      });
      
      // Handle cancellation
      if (p.isCancel(modelChoice)) {
        p.cancel('Model selection cancelled');
        process.exit(0);
      }
      
      selectedModelId = modelChoice;
    }
    
    modelToSelect = selectedModelId;
    
  } else {
    // Group by capability
    const groupedModels = groupModelsByCapability(models);
    
    // First select a capability group
    const capabilityOptions = CAPABILITY_GROUPS
      .filter(group => {
        const modelsInGroup = groupedModels.get(group.id) || [];
        return modelsInGroup.length > 0;
      })
      .map(group => {
        const modelsInGroup = groupedModels.get(group.id) || [];
        return {
          value: group.id,
          label: group.name,
          hint: `${modelsInGroup.length} models`
        };
      });
    
    const selectedCapability = await p.select({
      message: 'Select a model capability:',
      options: capabilityOptions
    });
    
    // Handle cancellation
    if (p.isCancel(selectedCapability)) {
      p.cancel('Model selection cancelled');
      process.exit(0);
    }
    
    // Get models in the selected capability group
    const modelsInGroup = groupedModels.get(selectedCapability) || [];
    
    // Then select a model from that group
    const modelChoice = await p.select({
      message: `Select a model for ${CAPABILITY_GROUPS.find(g => g.id === selectedCapability)?.name}:`,
      options: modelsInGroup.map(model => ({
        value: model.id,
        label: model.name,
        hint: model.recommended ? 'Recommended' : undefined
      }))
    });
    
    // Handle cancellation
    if (p.isCancel(modelChoice)) {
      p.cancel('Model selection cancelled');
      process.exit(0);
    }
    
    modelToSelect = modelChoice;
  }
  
  // Show details for the selected model
  const selectedModel = models.find(m => m.id === modelToSelect);
  
  if (selectedModel) {
    p.note(formatModelForDisplay(selectedModel), `Selected Model: ${selectedModel.name}`);
  }
  
  // Confirm selection or return to search
  const confirmSelection = await p.confirm({
    message: 'Use this model?',
    initialValue: true
  });
  
  // Handle cancellation
  if (p.isCancel(confirmSelection)) {
    p.cancel('Model selection cancelled');
    process.exit(0);
  }
  
  if (!confirmSelection) {
    // If not confirmed, call this function again to restart selection
    return selectModel(provider, modelToSelect);
  }
  
  return modelToSelect;
}

/**
 * Get model information by ID
 */
export function getModelById(modelId: string): ModelInfo | undefined {
  return MODELS.find(model => model.id === modelId);
}