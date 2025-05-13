/**
 * Task Master AI Integration Example
 * 
 * This example demonstrates how to use the AI integration features
 * with different providers for task management operations.
 */

import { 
  AiProviderFactory, 
  TaskOperations, 
  MockAiConfig,
  OpenAiConfig 
} from '../core/ai/index';
import { Task } from '../core/types';

/**
 * Example tasks for demonstration
 */
const exampleTasks: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    status: 'todo',
    readiness: 'ready',
    tags: ['backend', 'auth'],
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {}
  },
  {
    id: '2',
    title: 'Design user interface mockups',
    status: 'in-progress',
    readiness: 'ready',
    tags: ['design', 'ui'],
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {}
  },
  {
    id: '3',
    title: 'Fix navigation bar responsiveness',
    status: 'todo',
    readiness: 'blocked',
    tags: ['frontend', 'bug'],
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {}
  }
];

/**
 * Example text description for task generation
 */
const exampleDescription = `
We need to implement a new feature that allows users to export their data in multiple formats. 
The feature should support CSV, JSON, and PDF formats. 
The export should include all user data and preferences. 
We also need to add a new menu item in the user settings page and show a progress indicator during export.
`;

/**
 * Run demonstrations with different providers
 */
async function runDemo() {
  console.log('Task Master AI Integration Example');
  console.log('=================================');
  
  // 1. Create and use a mock provider
  console.log('\n1. Using Mock Provider');
  console.log('-----------------------');
  
  const mockProvider = AiProviderFactory.createProvider({
    type: 'mock',
    debug: true
  } as MockAiConfig);
  
  await mockProvider.initialize();
  const mockOperations = new TaskOperations(mockProvider);
  
  // Demonstrate generating subtasks
  console.log('\nGenerating subtasks for authentication task:');
  const subtasksResult = await mockOperations.generateSubtasks(exampleTasks[0]);
  
  console.log(`Parent task: ${subtasksResult.parentTask}`);
  console.log('Suggested subtasks:');
  subtasksResult.subtasks.forEach((subtask, i) => {
    console.log(`${i+1}. ${subtask}`);
  });
  
  // Demonstrate prioritizing tasks
  console.log('\nPrioritizing tasks:');
  const priorityResult = await mockOperations.prioritizeTasks(exampleTasks);
  
  console.log('Task priorities:');
  for (const [id, priority] of Object.entries(priorityResult.priorities)) {
    const task = exampleTasks.find(t => t.id === id);
    if (task) {
      console.log(`- ${task.title}: ${priority}`);
    }
  }
  
  // Demonstrate suggesting tags
  console.log('\nSuggesting tags for navigation bar task:');
  const tagsResult = await mockOperations.suggestTags(exampleTasks[2]);
  
  console.log('Suggested tags:');
  tagsResult.tags.forEach(tag => {
    console.log(`- ${tag}`);
  });
  
  // Demonstrate generating tasks from description
  console.log('\nGenerating tasks from description:');
  const taskGenResult = await mockOperations.generateTasksFromDescription(exampleDescription);
  
  console.log('Generated tasks:');
  taskGenResult.tasks.forEach((task, i) => {
    console.log(`\nTask ${i+1}: ${task.title}`);
    console.log(`Status: ${task.status || 'todo'}`);
    console.log(`Readiness: ${task.readiness || 'draft'}`);
    console.log(`Tags: ${task.tags ? task.tags?.join(', ') : 'none'}`);
    
    if (task.subtasks && task.subtasks.length > 0) {
      console.log('Subtasks:');
      task.subtasks.forEach((st, j) => {
        console.log(`  ${j+1}. ${st}`);
      });
    }
  });
  
  // 2. OpenAI Provider (only if API key is available)
  if (process.env.OPENAI_API_KEY) {
    console.log('\n\n2. Using OpenAI Provider');
    console.log('------------------------');
    
    const openaiProvider = AiProviderFactory.createProvider({
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Use a cheaper model for demos
      debug: true
    } as OpenAiConfig);
    
    try {
      await openaiProvider.initialize();
      const openaiOperations = new TaskOperations(openaiProvider);
      
      // Analyze a task with OpenAI
      console.log('\nAnalyzing user interface task with OpenAI:');
      const analysisResult = await openaiOperations.analyzeTask(exampleTasks[1]);
      
      console.log('Analysis:');
      for (const [key, value] of Object.entries(analysisResult.analysis)) {
        console.log(`- ${key}: ${value}`);
      }
      
      // Summarize a task
      console.log('\nSummarizing a task:');
      const summaryResult = await openaiOperations.summarizeTask(exampleTasks[0]);
      
      console.log(`Summary: ${summaryResult.summary}`);
      
    } catch (error) {
      console.error('Error using OpenAI:');
      console.error(error.message);
    }
  } else {
    console.log('\nSkipping OpenAI example (no API key provided)');
    console.log('Set OPENAI_API_KEY environment variable to run this part');
  }
}

// Run the demo
runDemo().catch(error => {
  console.error('Error running demo:');
  console.error(error);
});