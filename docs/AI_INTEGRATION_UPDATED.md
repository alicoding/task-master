# AI Integration in Task Master

Task Master provides robust AI integration capabilities through a flexible provider-based architecture. This document explains how to use and extend the AI features in your task management workflow.

## Architecture

The AI integration consists of the following components:

1. **AI Providers**: Abstract interfaces and concrete implementations for different AI services
   - `BaseAiProvider`: Abstract base class with common functionality
   - `OpenAiProvider`: Implementation for OpenAI (GPT-4, etc.)
   - `AnthropicProvider`: Implementation for Anthropic (Claude)
   - `CustomOpenAiProvider`: Implementation for any OpenAI-compatible API
   - `MockAiProvider`: Mock implementation for testing

2. **Task Operations**: Utility functions for performing AI operations on tasks
   - Summarizing tasks
   - Prioritizing tasks
   - Generating subtasks
   - Suggesting tags
   - Analyzing task complexity and dependencies
   - Converting text descriptions to structured tasks

3. **AI Factory**: Helper for creating provider instances
   - Create from configuration
   - Create from environment variables
   - Support for custom providers

4. **CLI Integration**: Commands for using AI features directly from the command line

## Getting Started

### Using the CLI

The quickest way to use AI features is through the Task Master CLI:

```bash
# Test connection to the configured AI provider
tm ai test-connection

# Generate subtasks for a task
tm ai generate-subtasks --id 123

# Suggest tags for a task
tm ai suggest-tags --id 123 --apply

# Analyze a task for complexity and dependencies
tm ai analyze --id 123 

# Prioritize tasks
tm ai prioritize --filter "tag:UI" --apply

# Generate tasks from a description
tm ai generate-tasks --from-text "Create a user authentication system" --create
```

### Using Environment Variables

Configure AI providers through environment variables:

```bash
# Set the provider type (openai, anthropic, custom-openai, or mock)
export AI_PROVIDER_TYPE=openai

# Set provider-specific variables
export OPENAI_API_KEY=your_api_key
export OPENAI_MODEL=gpt-4

# For Claude
export ANTHROPIC_API_KEY=your_api_key
export ANTHROPIC_MODEL=claude-3-opus-20240229

# For custom OpenAI-compatible endpoints
export CUSTOM_OPENAI_BASE_URL=http://localhost:8080
export CUSTOM_OPENAI_MODEL=llama2

# Enable debug mode (optional)
export AI_DEBUG=true
```

### Using the API in Code

You can also use the AI integration in your own code:

```typescript
import { AiProviderFactory, TaskOperations } from './core/ai/index.js';

// Create a provider 
const provider = AiProviderFactory.createProvider({
  type: 'openai',
  apiKey: 'your_api_key',
  model: 'gpt-4'
});

// Initialize the provider
await provider.initialize();

// Create operations instance
const operations = new TaskOperations(provider);

// Generate subtasks for a task
const result = await operations.generateSubtasks({
  id: '123',
  title: 'Implement authentication system',
  status: 'todo',
  readiness: 'ready'
});

console.log('Suggested subtasks:');
result.subtasks.forEach(subtask => {
  console.log(`- ${subtask}`);
});
```

## Supported Operations

### Summarize Task

Generates a concise summary of a task.

```typescript
const result = await operations.summarizeTask(task);
console.log(result.summary);
```

### Prioritize Tasks

Assigns priorities (high, medium, low) to a list of tasks.

```typescript
const result = await operations.prioritizeTasks(tasks);
console.log(result.priorities);
```

### Generate Subtasks

Breaks down a complex task into smaller, actionable subtasks.

```typescript
const result = await operations.generateSubtasks(task, { count: 5 });
console.log(result.subtasks);
```

### Suggest Tags

Suggests relevant tags for a task.

```typescript
const result = await operations.suggestTags(task);
console.log(result.tags);
```

### Analyze Task

Provides insights about a task including complexity, estimated time, and dependencies.

```typescript
const result = await operations.analyzeTask(task);
console.log(result.analysis);
```

### Generate Tasks from Description

Converts a text description into structured tasks.

```typescript
const description = "We need to revamp the website homepage, update the product listings, and fix the mobile layout issues.";
const result = await operations.generateTasksFromDescription(description);
console.log(result.tasks);
```

## Providers

### OpenAI

Standard OpenAI API provider supporting models like GPT-4.

```typescript
const provider = new OpenAiProvider({
  type: 'openai',
  apiKey: 'your_api_key',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000
});
```

### Claude (Anthropic)

Claude AI provider supporting the latest Claude models.

```typescript
const provider = new AnthropicProvider({
  type: 'anthropic',
  apiKey: 'your_api_key',
  model: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 1000
});
```

### Custom OpenAI-Compatible Provider

Supports any provider with an OpenAI-compatible API, like:

- Ollama
- LM Studio
- LlamaIndex
- LocalAI
- Azure OpenAI

```typescript
const provider = new CustomOpenAiProvider({
  type: 'openai',
  baseUrl: 'http://localhost:11434/v1', // Ollama endpoint
  model: 'llama2',
  apiKey: 'optional-api-key', // Some providers don't need this
  providerName: 'Ollama (Llama 2)'
});
```

### Mock Provider

For testing and development without calling real AI services.

```typescript
const provider = new MockAiProvider({
  type: 'mock',
  responses: {
    // Custom responses for different operations
    generate_subtasks: '1. Define API endpoints\n2. Implement auth middleware\n3. Add JWT generation'
  }
});
```

## Configuration Options

### OpenAI

| Option | Description | Default |
|--------|-------------|---------|
| apiKey | OpenAI API key | Required |
| model | Model to use | gpt-4 |
| temperature | Randomness (0-1) | 0.7 |
| maxTokens | Maximum tokens to generate | 1000 |
| baseUrl | Custom API endpoint | https://api.openai.com |
| organization | Organization ID | Optional |

### Anthropic (Claude)

| Option | Description | Default |
|--------|-------------|---------|
| apiKey | Anthropic API key | Required |
| model | Model to use | claude-3-opus-20240229 |
| temperature | Randomness (0-1) | 0.7 |
| maxTokens | Maximum tokens to generate | 1000 |
| baseUrl | Custom API endpoint | https://api.anthropic.com |

### Custom OpenAI-Compatible

| Option | Description | Default |
|--------|-------------|---------|
| baseUrl | OpenAI-compatible API endpoint | Required |
| apiKey | API key (if required) | Optional |
| model | Model to use | gpt-3.5-turbo |
| providerName | Name for the provider | CustomOpenAI |
| temperature | Randomness (0-1) | 0.7 |

### Mock Provider

| Option | Description | Default |
|--------|-------------|---------|
| responses | Custom responses for operations | Built-in defaults |
| debug | Enable debug logging | false |

## Implementing Custom AI Providers

You can implement your own AI providers by extending the `BaseAiProvider` class:

```typescript
import { BaseAiProvider, CompletionOptions, CompletionResult } from './core/ai/index.js';

export class CustomAiProvider extends BaseAiProvider {
  getName(): string {
    return 'CustomAI';
  }
  
  async initialize(): Promise<void> {
    await super.initialize();
    // Custom initialization
  }
  
  async createCompletion(options: CompletionOptions): Promise<CompletionResult> {
    // Implement completion logic
    // Return result in the expected format
  }
}
```

## Best Practices

1. **Use Mock Provider for Testing**: During development and testing, use the mock provider to avoid API costs.

2. **Manage API Keys Securely**: Store API keys as environment variables, never hardcode them.

3. **Handle Rate Limits**: Implement retry logic for API rate limits, especially in batch operations.

4. **Validate AI Outputs**: Always validate and review AI-generated content before using it.

5. **Optimize Token Usage**: Use concise prompts and limit the content sent to AI providers to minimize token usage.

6. **Use Custom Providers for Local Development**: For local development, consider using a local model with the CustomOpenAiProvider.

## Examples

See the `/examples/ai-example.ts` file for complete examples of using different AI providers.

## Performance Considerations

- AI API calls are asynchronous and can take several seconds to complete
- Consider implementing caching for frequent operations
- Use batch operations when processing multiple tasks
- Monitor API usage to control costs
- For local development or data-sensitive environments, consider using local models with the CustomOpenAiProvider