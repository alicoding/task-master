/**
 * Connection Tester
 * Enhanced testing for AI provider connections with detailed diagnostics
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { EnvManager } from '@/cli/commands/setup/env-manager';
import { AiProviderFactory } from '@/core/ai/factory';
import { AiProvider } from '@/core/ai/types';
import { isAxiosError } from 'axios';

// Environment Manager instance
const envManager = new EnvManager({
  backupOnSave: true,
  mergeStrategy: 'prompt'
});

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  success: boolean;
  providerName: string;
  modelName?: string;
  responseTime?: number;
  error?: {
    message: string;
    code?: string;
    type: string;
    details?: string;
    suggestion?: string;
  };
  warnings?: string[];
  details?: string;
}

/**
 * Test connection with detailed diagnostics
 */
export async function testConnection(
  providerType?: string,
  verbose: boolean = false
): Promise<ConnectionTestResult> {
  const s = p.spinner();
  
  // If no provider type is specified, use the one from the environment
  if (!providerType) {
    const env = await envManager.load();
    providerType = env.AI_PROVIDER_TYPE || 'mock';
  }
  
  s.start(`Testing connection to ${providerType} provider...`);
  
  try {
    const startTime = Date.now();
    
    // Create provider from environment
    process.env.AI_PROVIDER_TYPE = providerType;
    const provider = AiProviderFactory.createFromEnvironment();
    
    // Detailed test
    const result = await detailedConnectionTest(provider, verbose);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (result.success) {
      s.stop(`✅ Successfully connected to ${provider.getName()}`);
    } else {
      s.stop(`❌ Failed to connect to ${provider.getName()}`);
    }
    
    return {
      ...result,
      providerName: provider.getName(),
      responseTime
    };
  } catch (error) {
    s.stop(`❌ Connection test failed`);
    
    // Analyze error
    const errorInfo = analyzeError(error);
    
    return {
      success: false,
      providerName: providerType,
      error: errorInfo
    };
  }
}

/**
 * Detailed connection test with diagnostics
 */
async function detailedConnectionTest(
  provider: AiProvider,
  verbose: boolean = false
): Promise<ConnectionTestResult> {
  const warnings: string[] = [];
  let modelName: string | undefined;
  
  try {
    // Try to initialize the provider
    await provider.initialize();
    
    // For mock provider, return success immediately
    if (provider.getName().toLowerCase().includes('mock')) {
      return {
        success: true,
        providerName: provider.getName(),
        warnings: ['Using mock provider - no actual AI connection is being made'],
        details: 'Mock provider simulates responses without making API calls'
      };
    }
    
    // Try a simple completion
    const completionResult = await provider.createCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Respond with the word "Hello" and nothing else.' }
      ],
      maxTokens: 10
    });
    
    // Extract model name if available
    modelName = completionResult.model;
    
    // Check if the response is as expected
    const response = completionResult.text.trim().toLowerCase();
    
    if (!response.includes('hello')) {
      warnings.push(`Unexpected response: ${response} (expected "Hello")`);
    }
    
    // Check usage information
    if (!completionResult.usage) {
      warnings.push('No usage information returned from provider');
    }
    
    return {
      success: true,
      providerName: provider.getName(),
      modelName,
      warnings: warnings.length > 0 ? warnings : undefined,
      details: verbose ? JSON.stringify(completionResult, null, 2) : undefined
    };
  } catch (error) {
    // Analyze error
    const errorInfo = analyzeError(error);
    
    return {
      success: false,
      providerName: provider.getName(),
      modelName,
      error: errorInfo
    };
  }
}

/**
 * Analyze error to provide helpful diagnostics
 */
function analyzeError(error: unknown): {
  message: string;
  code?: string;
  type: string;
  details?: string;
  suggestion?: string;
} {
  // Default error info
  let message = 'Unknown error';
  let code: string | undefined;
  let type = 'UnknownError';
  let details: string | undefined;
  let suggestion: string | undefined;
  
  if (error instanceof Error) {
    message = error.message;
    type = error.name;
    
    // Check for common error patterns
    if (message.includes('API key')) {
      type = 'ApiKeyError';
      suggestion = 'Check your API key. It may be invalid, expired, or missing.';
    } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      type = 'TimeoutError';
      suggestion = 'The request timed out. Check your internet connection or try again later.';
    } else if (message.includes('network') || message.includes('ENOTFOUND')) {
      type = 'NetworkError';
      suggestion = 'Network error. Check your internet connection.';
    } else if (message.includes('model')) {
      type = 'ModelError';
      suggestion = 'The specified model may not be available. Check the model name.';
    }
    
    // Check for Axios errors (common in API clients)
    if (isAxiosError(error)) {
      // Get more details from the Axios error
      type = 'ApiError';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        code = `${error.response.status}`;
        details = JSON.stringify(error.response.data, null, 2);
        
        // Specific status code suggestions
        if (error.response.status === 401) {
          suggestion = 'Authentication failed. Check your API key.';
        } else if (error.response.status === 403) {
          suggestion = 'Permission denied. Your account may not have access to this resource.';
        } else if (error.response.status === 404) {
          suggestion = 'Resource not found. Check the API endpoint or model name.';
        } else if (error.response.status === 429) {
          suggestion = 'Rate limit exceeded. Your account may have reached its quota.';
        } else if (error.response.status >= 500) {
          suggestion = 'Server error. The API service may be experiencing issues. Try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        type = 'NetworkError';
        suggestion = 'No response received. Check your internet connection or API endpoint URL.';
      }
    }
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    // Try to extract useful information from the error object
    message = (error as any).message || 'Unknown error';
    code = (error as any).code || (error as any).status;
    details = JSON.stringify(error, null, 2);
  }
  
  return {
    message,
    code,
    type,
    details,
    suggestion
  };
}

/**
 * Display connection test results
 */
export function displayConnectionResults(result: ConnectionTestResult): void {
  if (result.success) {
    p.note(
      [
        `Successfully connected to ${chalk.green(result.providerName)}`,
        result.modelName ? `Model: ${chalk.blue(result.modelName)}` : '',
        result.responseTime ? `Response time: ${chalk.blue(result.responseTime + 'ms')}` : '',
        result.warnings && result.warnings.length > 0
          ? `\nWarnings:\n${result.warnings.map(w => `- ${chalk.yellow(w)}`).join('\n')}`
          : '',
        result.details ? `\nDetails:\n${chalk.gray(result.details)}` : ''
      ].filter(Boolean).join('\n'),
      'Connection Successful'
    );
  } else {
    p.note(
      [
        `Failed to connect to ${chalk.red(result.providerName)}`,
        `\nError: ${chalk.red(result.error?.message || 'Unknown error')}`,
        result.error?.code ? `Error code: ${chalk.red(result.error.code)}` : '',
        result.error?.type ? `Error type: ${chalk.yellow(result.error.type)}` : '',
        result.error?.suggestion ? `\nSuggestion: ${chalk.green(result.error.suggestion)}` : '',
        result.error?.details ? `\nDetails:\n${chalk.gray(result.error.details)}` : ''
      ].filter(Boolean).join('\n'),
      'Connection Failed'
    );
  }
}

/**
 * Run an interactive connection test
 */
export async function runConnectionTest(providerType?: string): Promise<void> {
  // Ask for provider type if not specified
  if (!providerType) {
    const env = await envManager.load();
    const currentProviderType = env.AI_PROVIDER_TYPE || 'mock';
    
    const providerOptions = [
      { value: 'openai', label: 'OpenAI', hint: 'GPT-3.5/4 models' },
      { value: 'anthropic', label: 'Anthropic', hint: 'Claude models' },
      { value: 'custom-openai', label: 'Custom OpenAI Compatible', hint: 'Ollama, etc.' },
      { value: 'mock', label: 'Mock Provider', hint: 'For testing without API keys' }
    ];
    
    const selectedProvider = await p.select({
      message: 'Select AI provider to test:',
      options: providerOptions,
      initialValue: currentProviderType
    });
    
    // Handle cancellation
    if (p.isCancel(selectedProvider)) {
      p.cancel('Connection test cancelled');
      process.exit(0);
    }
    
    providerType = selectedProvider;
  }
  
  // Ask for verbosity
  const verbose = await p.confirm({
    message: 'Show detailed diagnostic information?',
    initialValue: false
  });
  
  // Handle cancellation
  if (p.isCancel(verbose)) {
    p.cancel('Connection test cancelled');
    process.exit(0);
  }
  
  // Run the test
  const result = await testConnection(providerType, verbose);
  
  // Display results
  displayConnectionResults(result);
  
  // If connection failed, offer to configure the provider
  if (!result.success) {
    const reconfigure = await p.confirm({
      message: 'Would you like to reconfigure this provider?',
      initialValue: true
    });
    
    // Handle cancellation
    if (p.isCancel(reconfigure)) {
      p.cancel('Connection test cancelled');
      process.exit(0);
    }
    
    if (reconfigure) {
      // Import the AI configuration module dynamically
      const { setupAiConfiguration } = await import("@/cli/commands/setup/ai-config");
      
      // Run the AI configuration with force flag
      await setupAiConfiguration(true);
    }
  }
}