/**
 * Example of using AI providers for task management
 * This example demonstrates how to use different AI providers 
 * to generate and analyze tasks
 */

import { 
  AiProviderFactory, 
  TaskOperations,
  OpenAiProvider,
  AnthropicProvider,
  CustomOpenAiProvider,
  MockAiProvider
} from '../core/ai/index';

// Create a simple task for demo purposes
const demoTask = {
  id: '1',
  title: 'Build a user authentication system',
  status: 'todo',
  readiness: 'ready',
  tags: ['backend', 'security'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Example of using OpenAI for task management
 */
async function openAiExample() {
  console.log('\n===== OpenAI Example =====');
  
  try {
    // Create provider from environment variables (requires OPENAI_API_KEY)
    const provider = AiProviderFactory.createFromEnvironment();
    
    // If not configured, skip
    if (!process.env.OPENAI_API_KEY) {
      console.log('Skipping OpenAI example (API key not configured)');
      console.log('Set OPENAI_API_KEY to run this example');
      return;
    }
    
    // Initialize the provider
    await provider.initialize();
    
    // Create operations instance
    const operations = new TaskOperations(provider);
    
    // Generate subtasks
    console.log('Generating subtasks with OpenAI...');
    const subtasks = await operations.generateSubtasks(demoTask, { count: 3 });
    
    console.log('Generated subtasks:');
    subtasks.subtasks.forEach((subtask, i) => {
      console.log(`${i + 1}. ${subtask}`);
    });
    
    // Analyze task
    console.log('\nAnalyzing task with OpenAI...');
    const analysis = await operations.analyzeTask(demoTask);
    
    console.log('Analysis:');
    for (const [key, value] of Object.entries(analysis.analysis)) {
      const formattedKey = key.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      console.log(`- ${formattedKey}: ${value}`);
    }
  } catch (error) {
    console.error('Error in OpenAI example:', error.message);
  }
}

/**
 * Example of using Claude for task management
 */
async function claudeExample() {
  console.log('\n===== Claude Example =====');
  
  try {
    // Check if we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('Skipping Claude example (API key not configured)');
      console.log('Set ANTHROPIC_API_KEY to run this example');
      return;
    }
    
    // Create Claude provider
    const provider = new AnthropicProvider({
      type: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-haiku-20240307',
      debug: true
    });
    
    // Initialize the provider
    await provider.initialize();
    
    // Create operations instance
    const operations = new TaskOperations(provider);
    
    // Suggest tags
    console.log('Suggesting tags with Claude...');
    const tagResult = await operations.suggestTags(demoTask);
    
    console.log('Suggested tags:');
    tagResult.tags.forEach(tag => {
      console.log(`- ${tag}`);
    });
    
    // Generate tasks from description
    console.log('\nGenerating tasks from description with Claude...');
    const taskDescription = 'Create a dashboard for monitoring system performance, with real-time metrics, alerts, and historical data visualization.';
    
    const tasksResult = await operations.generateTasksFromDescription(taskDescription, { count: 3 });
    
    console.log('Generated tasks:');
    tasksResult.tasks.forEach((task, i) => {
      console.log(`${i + 1}. ${task.title}`);
      if (task.description) {
        console.log(`   Description: ${task.description}`);
      }
      if (task.tags && task.tags.length > 0) {
        console.log(`   Tags: ${task.tags?.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Error in Claude example:', error.message);
  }
}

/**
 * Example of using a custom OpenAI-compatible provider
 */
async function customProviderExample() {
  console.log('\n===== Custom Provider Example =====');
  
  try {
    // Use Ollama via an OpenAI-compatible API
    // Make sure Ollama is running with: ollama serve
    // And has a model loaded with: ollama pull llama2
    const baseUrl = process.env.CUSTOM_OPENAI_BASE_URL || 'http://localhost:11434/v1';
    
    const provider = new CustomOpenAiProvider({
      type: 'openai',
      baseUrl,
      model: 'llama2',
      providerName: 'Ollama (Llama 2)',
      debug: true
    });
    
    // Check connection before initializing
    console.log(`Checking connection to ${baseUrl}...`);
    
    try {
      const connected = await provider.verifyConnection();
      if (!connected) {
        console.log(`Could not connect to custom provider at ${baseUrl}`);
        console.log('Is Ollama running? Try: ollama serve');
        return;
      }
    } catch (e) {
      console.log(`Could not connect to custom provider at ${baseUrl}: ${e.message}`);
      return;
    }
    
    // Initialize the provider
    await provider.initialize();
    
    // Create operations instance
    const operations = new TaskOperations(provider);
    
    // Summarize task
    console.log('Summarizing task with custom provider...');
    const summary = await operations.summarizeTask(demoTask);
    
    console.log('Summary:');
    console.log(summary.summary);
  } catch (error) {
    console.error('Error in custom provider example:', error.message);
  }
}

/**
 * Example of using the mock provider for testing
 */
async function mockProviderExample() {
  console.log('\n===== Mock Provider Example =====');
  
  try {
    // Create mock provider
    const provider = new MockAiProvider({
      type: 'mock',
      debug: true,
      responses: {
        analyze: 'Complexity: Medium\nEstimated time: 3-4 days\nDependencies: User model, encryption library\nRecommendations: Start with user model design'
      }
    });
    
    // Initialize the provider
    await provider.initialize();
    
    // Create operations instance
    const operations = new TaskOperations(provider);
    
    // Analyze task
    console.log('Analyzing task with mock provider...');
    const analysis = await operations.analyzeTask(demoTask);
    
    console.log('Analysis:');
    console.log(analysis.raw);
    
    // Generate tasks from description
    console.log('\nGenerating tasks from description with mock provider...');
    const taskDescription = 'Set up CI/CD pipeline for the project';
    
    const tasksResult = await operations.generateTasksFromDescription(taskDescription);
    
    console.log('Generated tasks:');
    tasksResult.tasks.forEach((task, i) => {
      console.log(`${i + 1}. ${task.title}`);
    });
    
    // Show mock provider name
    console.log(`\nProvider name: ${provider.getName()}`);
  } catch (error) {
    console.error('Error in mock provider example:', error.message);
  }
}

/**
 * Run all examples
 */
async function main() {
  console.log('Task Master AI Provider Examples');
  console.log('===============================');
  
  // Run examples
  await mockProviderExample(); // Always runs
  await openAiExample();      // Runs if OPENAI_API_KEY is set
  await claudeExample();      // Runs if ANTHROPIC_API_KEY is set
  await customProviderExample(); // Tries to connect to local provider
}

// Run the main function
main().catch(console.error);