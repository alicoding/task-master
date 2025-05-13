/**
 * AI commands for Task Master
 * Provides AI-powered features for task management
 */

import { Command } from 'commander';
import { AiProviderFactory } from '../../../core/ai/factory';
import { TaskOperations } from '../../../core/ai/operations';
import { TaskRepository } from '../../../core/repo';
import { helpFormatter } from '../../helpers/help-formatter';
import { TaskOperationResult } from '../../../core/types';
import { Task } from '@/core/types';

/**
 * Create the AI command
 */
export function createAiCommand() {
  const aiCommand = new Command('ai')
    .description('AI-powered features for task management')
    .option('--provider <type>', 'AI provider to use (openai, anthropic, custom-openai, mock)', process.env.AI_PROVIDER_TYPE || 'mock')
    .option('--model <model>', 'Model to use with the AI provider', process.env.AI_MODEL)
    .option('--debug', 'Enable debug mode for AI operations', process.env.AI_DEBUG === 'true');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(aiCommand, {
    description: 'Use AI to enhance your task management workflow with features like task generation, prioritization, subtask creation, tagging, and analysis.',
    examples: [
      {
        command: 'tm ai test-connection',
        description: 'Test connection to the configured AI provider'
      },
      {
        command: 'tm ai generate-subtasks --id 42',
        description: 'Generate subtasks for task #42'
      },
      {
        command: 'tm ai prioritize',
        description: 'AI-powered prioritization of all tasks'
      },
      {
        command: 'tm ai suggest-tags --id 42',
        description: 'Suggest tags for task #42'
      },
      {
        command: 'tm ai analyze --id 42',
        description: 'Analyze complexity and requirements for task #42'
      },
      {
        command: 'tm ai generate-tasks --from-text "Create a user authentication system with login, registration, and password recovery"',
        description: 'Generate structured tasks from text description'
      }
    ],
    notes: [
      'You can configure AI providers using environment variables:',
      '  - AI_PROVIDER_TYPE: openai, anthropic, custom-openai, or mock',
      '  - OPENAI_API_KEY: Your OpenAI API key',
      '  - OPENAI_MODEL: Model to use (e.g., gpt-4)',
      '  - ANTHROPIC_API_KEY: Your Anthropic API key',
      '  - ANTHROPIC_MODEL: Model to use (e.g., claude-3-opus-20240229)',
      '  - CUSTOM_OPENAI_BASE_URL: URL for custom OpenAI-compatible endpoint',
      '  - AI_DEBUG: Set to "true" to enable debug logging',
      '  ',
      'Custom OpenAI-compatible providers:',
      '  - Can be used with local models (Ollama, LM Studio, etc.)',
      '  - Support Azure OpenAI endpoints',
      '  - Custom provider name can be set with CUSTOM_OPENAI_PROVIDER_NAME'
    ],
    seeAlso: ['add', 'update', 'search']
  });

  // Register AI subcommands
  aiCommand
    .command('test-connection')
    .description('Test connection to the AI provider')
    .action(async (options, command) => {
      // Get parent command options
      const parentOptions = command.parent.opts();
      const provider = parentOptions.provider || 'mock';
      const model = parentOptions.model;
      const debug = parentOptions.debug || false;

      console.log(`Testing connection to ${provider} provider...`);

      try {
        // Create the provider based on the specified type
        const aiProvider = createProvider(provider, model, debug);

        // Test connection
        const success = await AiProviderFactory.testConnection(aiProvider);

        if (success) {
          console.log(`✅ Successfully connected to ${aiProvider.getName()}`);
        } else {
          console?.error(`❌ Failed to connect to ${aiProvider.getName()}`);
          console?.error('Check your API key and provider configuration');
          process.exit(1);
        }
      } catch (error) {
        console?.error(`❌ Error testing connection: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  aiCommand
    .command('generate-subtasks')
    .description('Generate subtasks for a task')
    .requiredOption('--id <id>', 'Task ID')
    .option('--count <count>', 'Number of subtasks to generate', '5')
    .option('--parent-as-prefix', 'Prefix subtasks with parent ID', false)
    .action(async (options, command) => {
      // Get parent command options
      const parentOptions = command.parent.opts();
      const provider = parentOptions.provider || 'mock';
      const model = parentOptions.model;
      const debug = parentOptions.debug || false;

      try {
        // Get the task from the repository
        const repo = new TaskRepository();
        const taskResult = await repo.getTask(options.id);

        if (!taskResult?.success || !taskResult?.data) {
          console?.error(`Task ${options.id} not found: ${taskResult?.error?.message || 'Unknown error'}`);
          repo.close();
          process.exit(1);
        }

        const task = taskResult?.data;
        console.log(`Generating subtasks for: ${task.id} - ${task.title}...`);

        // Create the AI provider and operations
        const aiProvider = createProvider(provider, model, debug);
        await aiProvider.initialize();

        const operations = new TaskOperations(aiProvider);

        // Generate subtasks
        const count = parseInt(options.count);
        const result = await operations.generateSubtasks(task, { count });

        console.log('\nSuggested subtasks:');

        // Create subtasks in the repository
        const createdTasks: Task[] = [];
        for (const subtaskTitle of result.subtasks) {
          const subtaskResult = await repo.createTask({
            title: subtaskTitle,
            status: 'todo',
            readiness: 'draft',
            childOf: task.id,
            tags: [...(task.tags || [])],
            metadata: { generatedBy: 'ai' }
          });

          if (subtaskResult?.success && subtaskResult?.data) {
            createdTasks.push(subtaskResult?.data);
            console.log(`- ${subtaskResult?.data?.id}: ${subtaskResult?.data?.title}`);
          } else {
            console?.error(`  Failed to create subtask "${subtaskTitle}": ${subtaskResult?.error?.message || 'Unknown error'}`);
          }
        }

        console.log(`\n✅ Created ${createdTasks.length} subtasks for task ${task.id}`);
        repo.close();
      } catch (error) {
        console?.error(`❌ Error generating subtasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  aiCommand
    .command('suggest-tags')
    .description('Suggest tags for a task')
    .requiredOption('--id <id>', 'Task ID')
    .option('--apply', 'Apply suggested tags to the task', false)
    .action(async (options, command) => {
      // Get parent command options
      const parentOptions = command.parent.opts();
      const provider = parentOptions.provider || 'mock';
      const model = parentOptions.model;
      const debug = parentOptions.debug || false;

      try {
        // Get the task from the repository
        const repo = new TaskRepository();
        const taskResult = await repo.getTask(options.id);

        if (!taskResult?.success || !taskResult?.data) {
          console?.error(`Task ${options.id} not found: ${taskResult?.error?.message || 'Unknown error'}`);
          repo.close();
          process.exit(1);
        }

        const task = taskResult?.data;
        console.log(`Suggesting tags for: ${task.id} - ${task.title}...`);

        // Create the AI provider and operations
        const aiProvider = createProvider(provider, model, debug);
        await aiProvider.initialize();

        const operations = new TaskOperations(aiProvider);

        // Suggest tags
        const result = await operations.suggestTags(task);

        console.log('\nSuggested tags:');
        for (const tag of result.tags) {
          console.log(`- ${tag}`);
        }

        // Apply tags if requested
        if (options.apply && result.tags?.length > 0) {
          // Combine existing and new tags, removing duplicates
          const existingTags = task.tags || [];
          const allTags = [...new Set([...existingTags, ...result.tags])];

          // Update the task
          const updateResult = await repo.updateTask({
            id: task.id,
            tags: allTags
          });

          if (updateResult?.success) {
            console.log(`\n✅ Applied ${result.tags?.length} tags to task ${task.id}`);
          } else {
            console?.error(`\n❌ Failed to apply tags: ${updateResult?.error?.message || 'Unknown error'}`);
          }
        }

        repo.close();
      } catch (error) {
        console?.error(`❌ Error suggesting tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  aiCommand
    .command('analyze')
    .description('Analyze a task')
    .requiredOption('--id <id>', 'Task ID')
    .action(async (options, command) => {
      // Get parent command options
      const parentOptions = command.parent.opts();
      const provider = parentOptions.provider || 'mock';
      const model = parentOptions.model;
      const debug = parentOptions.debug || false;

      try {
        // Get the task from the repository
        const repo = new TaskRepository();
        const taskResult = await repo.getTask(options.id);

        if (!taskResult?.success || !taskResult?.data) {
          console?.error(`Task ${options.id} not found: ${taskResult?.error?.message || 'Unknown error'}`);
          repo.close();
          process.exit(1);
        }

        const task = taskResult?.data;
        console.log(`Analyzing task: ${task.id} - ${task.title}...`);

        // Create the AI provider and operations
        const aiProvider = createProvider(provider, model, debug);
        await aiProvider.initialize();

        const operations = new TaskOperations(aiProvider);

        // Analyze task
        const result = await operations.analyzeTask(task);

        console.log('\nAnalysis:');

        // Display structured analysis if available
        if (result.analysis && Object.keys(result.analysis)?.length > 0) {
          for (const [key, value] of Object.entries(result.analysis)) {
            // Convert key from camelCase to Title Case
            const formattedKey = key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());

            console.log(`- ${formattedKey}: ${value}`);
          }
        } else {
          // Display raw analysis
          console.log(result.raw);
        }

        repo.close();
      } catch (error) {
        console?.error(`❌ Error analyzing task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  aiCommand
    .command('prioritize')
    .description('AI-powered prioritization of tasks')
    .option('--filter <filter>', 'Filter tasks to prioritize (e.g., "tag:UI")')
    .option('--apply', 'Apply priorities as tags', false)
    .action(async (options, command) => {
      // Get parent command options
      const parentOptions = command.parent.opts();
      const provider = parentOptions.provider || 'mock';
      const model = parentOptions.model;
      const debug = parentOptions.debug || false;

      try {
        // Get tasks from the repository
        const repo = new TaskRepository();
        const tasksResult = await repo.getAllTasks();

        if (!tasksResult?.success || !tasksResult?.data) {
          console?.error(`Failed to retrieve tasks: ${tasksResult?.error?.message || 'Unknown error'}`);
          repo.close();
          process.exit(1);
        }

        let tasks = tasksResult?.data;

        // Apply filter if provided
        if (options.filter) {
          console.log(`Filtering tasks with: ${options.filter}`);

          // Parse filter (simple implementation)
          const [key, value] = options.filter.split(':');

          if (key && value) {
            if (key === 'tag') {
              tasks = tasks.filter(task => (task.tags || []).includes(value));
            } else if (key === 'status') {
              tasks = tasks.filter(task => task.status === value);
            } else if (key === 'readiness') {
              tasks = tasks.filter(task => task.readiness === value);
            }
          }
        }

        if (tasks.length === 0) {
          console.log('No tasks to prioritize');
          repo.close();
          return;
        }

        console.log(`Prioritizing ${tasks.length} tasks...`);

        // Create the AI provider and operations
        const aiProvider = createProvider(provider, model, debug);
        await aiProvider.initialize();

        const operations = new TaskOperations(aiProvider);

        // Prioritize tasks
        const result = await operations.prioritizeTasks(tasks);

        console.log('\nPriorities:');

        // Display and potentially apply priorities
        for (const [id, priority] of Object.entries(result.priorities)) {
          const task = tasks.find(t => t.id === id);
          if (task) {
            console.log(`- ${task.id}: ${task.title} - ${priority}`);

            // Apply priority as a tag if requested
            if (options.apply) {
              const existingTags = task.tags || [];
              const priorityTag = `priority:${priority}`;

              // Remove any existing priority tags
              const filteredTags = existingTags.filter((tag: string) => !tag.startsWith('priority:'));

              // Add the new priority tag
              const updateResult = await repo.updateTask({
                id: task.id,
                tags: [...filteredTags, priorityTag]
              });

              if (!updateResult?.success) {
                console?.error(`  Failed to apply priority tag to task ${task.id}: ${updateResult?.error?.message || 'Unknown error'}`);
              }
            }
          }
        }

        if (options.apply) {
          console.log(`\n✅ Applied priorities as tags to ${Object.keys(result.priorities)?.length} tasks`);
        }

        repo.close();
      } catch (error) {
        console?.error(`❌ Error prioritizing tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  aiCommand
    .command('generate-tasks')
    .description('Generate tasks from text description')
    .requiredOption('--from-text <text>', 'Text to generate tasks from')
    .option('--create', 'Create the generated tasks', false)
    .option('--parent-id <id>', 'Parent task ID for created tasks')
    .action(async (options, command) => {
      // Get parent command options
      const parentOptions = command.parent.opts();
      const provider = parentOptions.provider || 'mock';
      const model = parentOptions.model;
      const debug = parentOptions.debug || false;

      try {
        const description = options.fromText;
        console.log(`Generating tasks from description: "${description}"...`);

        // Create the AI provider and operations
        const aiProvider = createProvider(provider, model, debug);
        await aiProvider.initialize();

        const operations = new TaskOperations(aiProvider);

        // Generate tasks
        const result = await operations.generateTasksFromDescription(description);

        console.log('\nGenerated tasks:');

        // Create tasks if requested
        if (options.create) {
          const repo = new TaskRepository();
          const createdTasks: Task[] = [];

          for (const taskData of result.tasks) {
            const taskResult = await repo.createTask({
              title: taskData.title,
              status: (taskData.status as 'todo' | 'in-progress' | 'done') || 'todo',
              readiness: (taskData.readiness as 'draft' | 'ready' | 'blocked') || 'draft',
              childOf: options.parentId,
              tags: taskData.tags || [],
              metadata: {
                generatedBy: 'ai',
                description: taskData.description
              }
            });

            if (taskResult?.success && taskResult?.data) {
              createdTasks.push(taskResult?.data);
              console.log(`- ${taskResult?.data?.id}: ${taskResult?.data?.title}`);
              if (taskData.description) {
                console.log(`  Description: ${taskData.description}`);
              }
            } else {
              console?.error(`  Failed to create task "${taskData.title}": ${taskResult?.error?.message || 'Unknown error'}`);
            }
          }

          console.log(`\n✅ Created ${createdTasks.length} tasks from description`);
          repo.close();
        } else {
          // Just display the generated tasks
          result.tasks?.forEach((task, index) => {
            console.log(`- ${index + 1}. ${task.title}`);
            if (task.description) {
              console.log(`  Description: ${task.description}`);
            }
            if (task.tags && task.tags.length > 0) {
              console.log(`  Tags: ${task.tags?.join(', ')}`);
            }
          });
        }
      } catch (error) {
        console?.error(`❌ Error generating tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return aiCommand;
}

/**
 * Create an AI provider based on type, model, and debug mode
 */
function createProvider(type: string, model?: string, debug: boolean = false) {
  // Set provider-specific environment variables
  switch (type) {
    case 'openai':
      if (model) process.env.OPENAI_MODEL = model;
      break;

    case 'anthropic':
      if (model) process.env.ANTHROPIC_MODEL = model;
      break;

    case 'custom-openai':
      if (model) process.env.CUSTOM_OPENAI_MODEL = model;
      break;
  }

  // Set global debug flag
  if (debug) {
    process.env.AI_DEBUG = 'true';
  }

  // Set provider type
  process.env.AI_PROVIDER_TYPE = type;

  // Create the provider from environment
  return AiProviderFactory.createFromEnvironment();
}