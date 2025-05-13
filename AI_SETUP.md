# AI Integration Setup Guide

Task Master offers powerful AI-powered features to enhance your task management workflow. This guide explains how to set up and use different AI providers with Task Master.

## Supported AI Providers

Task Master currently supports the following AI providers:

1. **OpenAI** - GPT models like GPT-4 and GPT-3.5-Turbo
2. **Anthropic** - Claude models like Claude 3 Opus, Sonnet, and Haiku
3. **Custom OpenAI-Compatible Providers**:
   - Azure OpenAI Service
   - Local models via Ollama
   - LM Studio
   - Any OpenAI API-compatible endpoint

4. **Mock Provider** - For testing without an API key (limited capabilities)

## AI Features Overview

Task Master's AI capabilities include:

- **Generate Subtasks**: Break down complex tasks into manageable subtasks
- **Suggest Tags**: Get AI-suggested tags for better organization
- **Task Analysis**: Analyze task complexity, dependencies, and requirements
- **Prioritization**: AI-powered prioritization of your tasks
- **Generate Tasks from Text**: Create structured tasks from a text description

## Setup Instructions

### 1. Environment Configuration

Task Master uses environment variables for AI configuration. You can:

1. Create a `.env` file in your Task Master root directory
2. Set environment variables in your shell
3. Use the interactive setup wizard (recommended)

#### Using the Setup Wizard (Recommended)

Run the setup wizard to configure AI providers interactively:

```bash
# Configure all Task Master components (recommended for new users)
tm setup

# Configure only AI providers
tm setup --ai

# Force reconfiguration even if settings already exist
tm setup --force
```

The wizard will guide you through:
1. Selecting your preferred AI provider
2. Configuring API keys and other settings
3. Testing the connection to verify everything works
4. Creating/updating your .env file automatically

#### Manual Configuration

Copy the `.env.example` file to `.env` and edit it:

```bash
cp .env.example .env
```

Then edit the `.env` file with your preferred editor and add your API keys and preferences.

### 2. Provider-Specific Setup

#### OpenAI Setup

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Configure your `.env` file:
   ```
   AI_PROVIDER_TYPE=openai
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4
   ```

#### Anthropic (Claude) Setup

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Configure your `.env` file:
   ```
   AI_PROVIDER_TYPE=anthropic
   ANTHROPIC_API_KEY=your-api-key-here
   ANTHROPIC_MODEL=claude-3-opus-20240229
   ```

#### Custom OpenAI-Compatible Providers

##### Ollama (Local Models)

1. Install [Ollama](https://ollama.ai/) and pull your preferred model:
   ```bash
   ollama pull llama3
   ```

2. Configure your `.env` file:
   ```
   AI_PROVIDER_TYPE=custom-openai
   CUSTOM_OPENAI_BASE_URL=http://localhost:11434/v1
   CUSTOM_OPENAI_MODEL=llama3
   CUSTOM_OPENAI_PROVIDER_NAME=Ollama
   ```

##### Azure OpenAI

1. Create an Azure OpenAI resource and deployment
2. Configure your `.env` file:
   ```
   AI_PROVIDER_TYPE=custom-openai
   CUSTOM_OPENAI_API_KEY=your-azure-api-key
   CUSTOM_OPENAI_BASE_URL=https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name
   CUSTOM_OPENAI_MODEL=your-deployment-name
   CUSTOM_OPENAI_PROVIDER_NAME=Azure OpenAI
   ```

### 3. Testing Your Configuration

To test your AI provider connection:

```bash
tm ai test-connection
```

## CLI Usage Examples

### Generate Subtasks

```bash
# Generate subtasks for task with ID 42
tm ai generate-subtasks --id 42

# Generate 10 subtasks
tm ai generate-subtasks --id 42 --count 10
```

### Suggest Tags

```bash
# Suggest tags for task
tm ai suggest-tags --id 42

# Apply the suggested tags automatically
tm ai suggest-tags --id 42 --apply
```

### Analyze Task

```bash
# Analyze a task's complexity and requirements
tm ai analyze --id 42
```

### Prioritize Tasks

```bash
# Prioritize all tasks
tm ai prioritize

# Prioritize with filter and apply priorities as tags
tm ai prioritize --filter "tag:frontend" --apply
```

### Generate Tasks from Text

```bash
# Generate structured tasks from text description
tm ai generate-tasks --from-text "Create a user authentication system with login, registration, and password recovery"

# Create the generated tasks
tm ai generate-tasks --from-text "Create a user authentication system" --create
```

## Setting a Different Provider for a Single Command

You can override the default provider for a single command:

```bash
tm ai analyze --id 42 --provider anthropic
```

## Model Recommendations

### OpenAI

| Model | Use Case | Relative Cost |
|-------|----------|---------------|
| gpt-4 | Most accurate for complex tasks | High |
| gpt-4-turbo | Good balance of accuracy and cost | Medium-High |
| gpt-3.5-turbo | Economical for simpler tasks | Low |

### Anthropic (Claude)

| Model | Use Case | Relative Cost |
|-------|----------|---------------|
| claude-3-opus | Highest accuracy for complex tasks | High |
| claude-3-sonnet | Good balance of accuracy and cost | Medium |
| claude-3-haiku | Fast and economical for simpler tasks | Low |

### Local Models

| Model | Use Case | Notes |
|-------|----------|-------|
| llama3 | Good all-around performance | Free, requires ~8GB VRAM |
| mistral | Good accuracy with smaller resource needs | Free, requires ~4GB VRAM |
| phi-2 | Lighter model for basic tasks | Free, requires ~2GB VRAM |

## Troubleshooting

### Common Issues

#### API Key Issues

- **Error**: `API key is required for [Provider] provider`
  - **Solution**: Ensure you've set the correct API key in your `.env` file

#### Connection Timeouts

- **Error**: `[Provider] API request timed out after 30000ms`
  - **Solution**: Check your internet connection or increase the timeout

#### Model Not Available

- **Error**: `Model not available on [Provider]`
  - **Solution**: Verify you're using a valid model name for your provider

#### Custom Provider Connection Issues

- **Error**: `Could not connect to [Provider] at [URL]`
  - **Solution**: Ensure your local model server is running or check the URL

## Estimated Costs and Token Usage

### Average Token Usage by Feature

| Feature | Average Input Tokens | Average Output Tokens | Total Tokens per Operation |
|---------|---------------------|---------------------|----------------------------|
| Generate Subtasks | ~200-500 | ~200-400 | ~400-900 |
| Suggest Tags | ~200-400 | ~50-150 | ~250-550 |
| Analyze Task | ~200-500 | ~300-600 | ~500-1100 |
| Prioritize Tasks | ~500-2000 | ~200-500 | ~700-2500 |
| Generate Tasks from Text | ~100-300 | ~300-800 | ~400-1100 |

### Estimated Costs (USD)

#### OpenAI

| Model | Cost per 1K Tokens (Input) | Cost per 1K Tokens (Output) | Estimated Cost per 100 Operations |
|-------|----------------------------|------------------------------|----------------------------------|
| gpt-4 | $0.03 | $0.06 | $3.00-$15.00 |
| gpt-4-turbo | $0.01 | $0.03 | $1.00-$5.00 |
| gpt-3.5-turbo | $0.0015 | $0.002 | $0.10-$0.50 |

#### Anthropic (Claude)

| Model | Cost per 1K Tokens (Input) | Cost per 1K Tokens (Output) | Estimated Cost per 100 Operations |
|-------|----------------------------|------------------------------|----------------------------------|
| claude-3-opus | $0.015 | $0.075 | $1.50-$7.50 |
| claude-3-sonnet | $0.003 | $0.015 | $0.30-$1.50 |
| claude-3-haiku | $0.00025 | $0.00125 | $0.03-$0.15 |

## Privacy Considerations

When using external AI providers like OpenAI or Anthropic:

- Task content is sent to third-party servers for processing
- Consider data sensitivity when using AI features
- Local models (Ollama, etc.) keep data on your machine

## Contributing

If you'd like to add support for additional AI providers or enhance existing features, please check our [contribution guidelines](CONTRIBUTING.md).