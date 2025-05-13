# Task Master Connection Testing

Task Master includes an enhanced connection testing system that helps you validate and troubleshoot your AI provider connections with detailed diagnostics.

## Overview

The connection testing feature provides:

- Detailed diagnostic information about AI provider connections
- Error analysis with specific suggestions
- Performance metrics for successful connections
- Warning detection for suboptimal configurations
- Interactive testing interface

## Usage

You can test your AI provider connection in several ways:

### Using the Setup Wizard

```bash
# Run the setup wizard and choose "Test AI connection"
tm setup

# Direct connection testing
tm setup --test-connection

# Test a specific provider
tm setup --test-connection openai
```

## Diagnostic Information

The connection test provides comprehensive diagnostic information:

### For Successful Connections

- Provider name and type
- Model name and version
- Response time in milliseconds
- Warning detection for suboptimal responses
- Detailed response information (optional)

### For Failed Connections

- Specific error message with context
- Error code and type
- Suggestions for resolving the issue
- Detailed error information
- Option to reconfigure the provider

## Connection Test Process

The connection testing process:

1. **Initialization**: Loads provider configuration
2. **Provider Creation**: Creates the AI provider instance
3. **Connection Test**: Sends a simple test prompt
4. **Response Analysis**: Analyzes the response for issues
5. **Diagnostics**: Provides detailed diagnostic information
6. **Reconfiguration**: Offers to reconfigure the provider if needed

## Error Types and Suggestions

The system detects common error types and provides helpful suggestions:

| Error Type | Description | Suggestion |
|------------|-------------|------------|
| ApiKeyError | Issues with the API key | Check your API key. It may be invalid, expired, or missing. |
| TimeoutError | Request timeout | The request timed out. Check your internet connection or try again later. |
| NetworkError | Network connectivity issues | Network error. Check your internet connection. |
| ModelError | Issues with the AI model | The specified model may not be available. Check the model name. |
| ApiError (401) | Authentication failed | Authentication failed. Check your API key. |
| ApiError (403) | Permission denied | Permission denied. Your account may not have access to this resource. |
| ApiError (404) | Resource not found | Resource not found. Check the API endpoint or model name. |
| ApiError (429) | Rate limit exceeded | Rate limit exceeded. Your account may have reached its quota. |
| ApiError (500+) | Server error | Server error. The API service may be experiencing issues. Try again later. |

## Examples

### Successful Connection

```
Connection Successful

Successfully connected to OpenAI
Model: gpt-4
Response time: 1243ms
```

### Connection with Warnings

```
Connection Successful

Successfully connected to OpenAI
Model: gpt-4
Response time: 1532ms

Warnings:
- Unexpected response: hello world (expected "Hello")
```

### Failed Connection

```
Connection Failed

Failed to connect to Anthropic

Error: Authentication failed. Invalid API key provided.
Error code: 401
Error type: ApiError

Suggestion: Authentication failed. Check your API key.
```

## Integration with Setup

The connection testing feature is integrated with the setup wizard:

1. At the end of AI provider configuration, you're prompted to test the connection
2. Detailed diagnostic information is provided for both successful and failed connections
3. For failed connections, you can reconfigure the provider directly

## Technical Implementation

The connection testing system:

- Uses `@clack/prompts` for interactive UI
- Analyzes Axios errors for detailed diagnostics
- Categorizes errors for more helpful suggestions
- Tests actual model responses, not just connectivity
- Provides detailed metrics about successful connections
- Integrates with AI provider configuration

## Verbosity Settings

The connection tester supports different verbosity levels:

- **Standard**: Shows basic success/failure information
- **Verbose**: Shows detailed diagnostics, including response content and timing
- **Debug**: Shows complete raw response data for deeper troubleshooting