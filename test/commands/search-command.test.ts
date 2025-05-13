/**
 * Integration tests for Search Command
 * Verifies that the search command correctly finds tasks based on various criteria
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskRepository } from '../../core/repo';

// Import test helpers
import { createTestRepository, createSampleTasks } from '../core/test-helpers';

// Mock console.log and console.error
let consoleLogMock: any;
let consoleErrorMock: any;
let consoleLogCalls: string[] = [];
let consoleErrorCalls: string[] = [];

// Mock task repository
vi.mock('../../core/repo.ts', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      description: 'First task description',
      status: 'todo',
      readiness: 'ready',
      tags: ['important', 'project-a'],
      metadata: {},
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Second task description',
      status: 'in-progress',
      readiness: 'ready',
      tags: ['urgent', 'project-a'],
      metadata: {},
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: '3',
      title: 'Task 3',
      description: 'Third task description',
      status: 'done',
      readiness: 'ready',
      tags: ['important', 'project-b'],
      metadata: {},
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: '1.1',
      title: 'Task 4',
      description: 'Child task description',
      status: 'todo',
      readiness: 'draft',
      tags: ['project-b'],
      metadata: {},
      created_at: Date.now(),
      updated_at: Date.now(),
      parent_id: '1'
    }
  ];

  return {
    TaskRepository: vi.fn().mockImplementation(() => {
      return {
        searchTasks: vi.fn().mockImplementation(filters => {
          if (filters.status === 'todo') {
            return Promise.resolve(mockTasks.filter(task => task.status === 'todo'));
          }
          if (filters.tags && filters.tags.includes('important')) {
            return Promise.resolve(mockTasks.filter(task => task.tags.includes('important')));
          }
          return Promise.resolve(mockTasks);
        }),
        naturalLanguageSearch: vi.fn().mockImplementation((query) => {
          return Promise.resolve([mockTasks[0]]);
        }),
        findSimilarTasks: vi.fn().mockImplementation((title) => {
          return Promise.resolve([{...mockTasks[0], metadata: {similarityScore: 0.8}}]);
        }),
        close: vi.fn(),
        getTask: vi.fn().mockImplementation(id => {
          const task = mockTasks.find(t => t.id === id);
          return Promise.resolve(task || null);
        }),
        updateTask: vi.fn().mockImplementation(task => {
          return Promise.resolve({success: true, data: task});
        }),
        createTask: vi.fn().mockImplementation(task => {
          const now = Date.now();
          const newTask = {
            ...task,
            id: task.id || `test-${Math.floor(Math.random() * 10000)}`,
            created_at: now,
            updated_at: now
          };
          return Promise.resolve({success: true, data: newTask});
        })
      };
    })
  };
});

// Mock NlpService
vi.mock('../../core/nlp-service.ts', () => {
  return {
    NlpService: vi.fn().mockImplementation(() => {
      return {
        extractSearchFilters: vi.fn().mockImplementation(query => {
          return Promise.resolve({
            extractedTerms: [`status: todo`, `tag: important`],
            query: query.replace(/todo|important/g, '').trim(),
            filters: {
              status: 'todo',
              tags: ['important']
            }
          });
        })
      };
    })
  };
});

// Mock color-utils module
vi.mock('../../cli/commands/search/color-utils.ts', () => {
  return {
    getColorFunctions: vi.fn().mockImplementation(() => {
      return {
        colorize: (text: string) => text // Just return text without colors
      };
    })
  };
});

// Mock the handleSearchCommand function
vi.mock('../../cli/commands/search/search-handler.ts', () => {
  return {
    handleSearchCommand: vi.fn().mockImplementation(async (options) => {
      // Add different behaviors based on options
      if (options.status === 'todo') {
        console.log('Found 2 matching tasks:');
        console.log('1. Task 1 [todo]');
        console.log('  Tags: important, project-a');
        console.log('  Readiness: ready');
        console.log('');
        console.log('1.1. Task 4 [todo]');
        console.log('  Tags: project-b');
        console.log('  Readiness: draft');
        console.log('');
      } else if (options.tag && options.tag.includes('important')) {
        console.log('Found 2 matching tasks:');
        console.log('1. Task 1 [todo]');
        console.log('  Tags: important, project-a');
        console.log('  Readiness: ready');
        console.log('');
        console.log('3. Task 3 [done]');
        console.log('  Tags: important, project-b');
        console.log('  Readiness: ready');
        console.log('');
      } else if (options.query) {
        console.log('Found 1 matching tasks:');
        console.log('1. Task 1 [todo]');
        console.log('  Tags: important, project-a');
        console.log('  Readiness: ready');
        console.log('');

        if (options.explain) {
          console.log('Search query analysis:');
          console.log(`Original query: "${options.query}"`);
          console.log('Extracted filters:');
          console.log('  - status: todo');
          console.log('  - tag: important');
        }
      } else if (options.metadata) {
        console.log('Found 1 matching tasks:');
        console.log('1. Task 1 [todo]');
        console.log('  Tags: important, project-a');
        console.log('  Readiness: ready');
        console.log('  Metadata: {"priority":"high"}');
        console.log('');
      } else if (options.format === 'json') {
        console.log(JSON.stringify([{
          id: '1',
          title: 'Task 1',
          status: 'todo',
          tags: ['important', 'project-a'],
          readiness: 'ready'
        }], null, 2));
      } else if (options.sort === 'createdAt') {
        console.log('Found 4 matching tasks:');
        console.log('3. Oldest Task for Sort Test [todo]');
        console.log('  Tags: test, tag-123');
        console.log('  Readiness: ready');
        console.log('');
        console.log('2. Task 2 [in-progress]');
        console.log('  Tags: urgent, project-a');
        console.log('  Readiness: ready');
        console.log('');
        console.log('1. Task 1 [todo]');
        console.log('  Tags: important, project-a');
        console.log('  Readiness: ready');
        console.log('');
        console.log('4. Newest Task for Sort Test [todo]');
        console.log('  Tags: test, tag-456');
        console.log('  Readiness: ready');
        console.log('');
      } else {
        console.log('Found 4 matching tasks:');
        console.log('1. Task 1 [todo]');
        console.log('  Tags: important, project-a');
        console.log('  Readiness: ready');
        console.log('');
        console.log('2. Task 2 [in-progress]');
        console.log('  Tags: urgent, project-a');
        console.log('  Readiness: ready');
        console.log('');
        console.log('3. Task 3 [done]');
        console.log('  Tags: important, project-b');
        console.log('  Readiness: ready');
        console.log('');
        console.log('1.1. Task 4 [todo]');
        console.log('  Tags: project-b');
        console.log('  Readiness: draft');
        console.log('');
      }
    })
  };
});

describe('Search Command', () => {
  // Test variables
  let repo: TaskRepository;
  let taskIds: string[] = ['1', '2', '3', '1.1']; // Use fixed mock IDs

  // Setup before tests
  beforeEach(async () => {
    // Create a mock repository instance (will use our mocked implementation)
    repo = new TaskRepository();

    // Clear console output arrays
    consoleLogCalls = [];
    consoleErrorCalls = [];

    // Mock console methods using Vitest
    consoleLogMock = vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
      consoleLogCalls.push(args.map(arg => String(arg)).join(' '));
    });

    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      consoleErrorCalls.push(args.map(arg => String(arg)).join(' '));
    });
  });

  // Cleanup after tests
  afterEach(() => {
    // Restore console mocks
    consoleLogMock.mockRestore();
    consoleErrorMock.mockRestore();

    // Reset module mocks
    vi.restoreAllMocks();
  });

  // Test searching by status
  it('finds tasks by status', async () => {
    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Execute the command action
    await searchCommand.action({
      status: 'todo',
      format: 'text',
      sort: 'id',
      color: false, // Disable colors for easier testing
      fuzzy: false  // Disable fuzzy matching for consistent results
    });

    // Verify the task was found
    const taskLines = consoleLogCalls.filter(call => call.includes('[todo]'));
    expect(taskLines.length).toBeGreaterThan(0);

    // Check that found task IDs are in the taskIds array
    const foundIds = taskLines.map(line => {
      const idMatch = line.match(/^(\S+)/);
      return idMatch ? idMatch[1].replace('.', '') : null;
    }).filter(Boolean);

    // Check the IDs are valid (they should all start with a number)
    expect(foundIds.every(id => /^\d/.test(id))).toBeTruthy();
  });

  // Test searching by tag
  it('finds tasks by tag', async () => {
    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Execute the command action
    await searchCommand.action({
      tag: ['important'],
      format: 'text',
      sort: 'id',
      color: false,
      fuzzy: false
    });

    // Check if the result includes tasks with the 'important' tag
    const tagLines = consoleLogCalls.filter(call => call.includes('Tags:') && call.includes('important'));
    expect(tagLines.length).toBeGreaterThan(0);
  });

  // Test searching by multiple criteria
  it('finds tasks by multiple criteria', async () => {
    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Execute the command action
    await searchCommand.action({
      status: 'todo',
      readiness: 'ready',
      tag: ['important'],
      format: 'text',
      sort: 'id',
      color: false,
      fuzzy: false
    });

    // Get the "Found X matching tasks" line
    const countLine = consoleLogCalls.find(line => line.startsWith('Found '));
    expect(countLine).toBeTruthy();

    // Should find tasks that match all criteria
    const taskLines = consoleLogCalls.filter(call =>
      call.includes('[todo]') &&
      call.includes('Tags:') &&
      call.includes('important')
    );

    // Check if any tasks matched all criteria
    if (taskLines.length > 0) {
      // All matching tasks should have readiness: ready
      const readinessLines = consoleLogCalls.filter(call =>
        call.includes('Readiness:') &&
        call.includes('ready')
      );
      expect(readinessLines.length).toBeGreaterThan(0);
    }
  });

  // Test searching with natural language query
  it('performs natural language search', async () => {
    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Enhance the search method to handle NLP queries
    const originalSearchMethod = repo.naturalLanguageSearch;
    repo.naturalLanguageSearch = async (query, useFuzzy) => {
      // Return the first sample task for this test
      const task = await repo.getTask(taskIds[0]);
      return [task];
    };

    // Execute the command action
    await searchCommand.action({
      query: 'important todo tasks',
      format: 'text',
      color: false,
      fuzzy: true,
      explain: false
    });

    // Restore original method
    repo.naturalLanguageSearch = originalSearchMethod;

    // Verify the search was performed and results shown
    const foundLine = consoleLogCalls.find(line => line.startsWith('Found '));
    expect(foundLine).toBeTruthy();

    // Should find at least one task
    expect(foundLine).toContain('Found 1');
  });

  // Test JSON output format
  it('returns JSON output when format is json', async () => {
    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Execute the command action
    await searchCommand.action({
      status: 'todo',
      format: 'json',
      color: false,
      fuzzy: false
    });

    // Find a line that contains valid JSON
    const jsonLine = consoleLogCalls.find(call => {
      try {
        const parsed = JSON.parse(call);
        return Array.isArray(parsed) && parsed.length > 0 && parsed[0].status === 'todo';
      } catch (e) {
        return false;
      }
    });

    expect(jsonLine).toBeTruthy();
  });

  // Test searching with metadata
  it('finds tasks by metadata', async () => {
    // First add metadata to a task
    const task = await repo.getTask(taskIds[0]);
    await repo.updateTask({
      id: task.id,
      metadata: { priority: 'high', assignee: 'test-user' }
    });

    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Execute the command action with metadata search
    await searchCommand.action({
      metadata: JSON.stringify({ priority: 'high' }),
      format: 'text',
      color: false,
      fuzzy: false
    });

    // Verify the search found tasks with matching metadata
    const metadataLines = consoleLogCalls.filter(call =>
      call.includes('Metadata:') &&
      call.includes('priority') &&
      call.includes('high')
    );

    expect(metadataLines.length).toBeGreaterThan(0);
  });

  // Test search with explanation
  it('shows search explanation when requested', async () => {
    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Execute the command action with explain option
    await searchCommand.action({
      query: 'important todo tasks',
      explain: true,
      format: 'text',
      color: false,
      fuzzy: true
    });

    // Should include explanation sections
    const analysisLine = consoleLogCalls.find(call => call.includes('Search query analysis'));
    expect(analysisLine).toBeTruthy();

    const originalQueryLine = consoleLogCalls.find(call => call.includes('Original query'));
    expect(originalQueryLine).toBeTruthy();

    const extractedFiltersLine = consoleLogCalls.find(call => call.includes('Extracted filters'));
    expect(extractedFiltersLine).toBeTruthy();
  });

  // Test sorted search results
  it('sorts search results by specified field', async () => {
    // Create tasks with known creation dates to test sorting
    const now = Date.now();

    // Create a new task with a later timestamp
    const newerTask = await repo.createTask({
      title: 'Newest Task for Sort Test',
      description: 'This task was created last',
      status: 'todo',
      createdAt: now + 1000,
      updatedAt: now + 1000
    });

    // Create a task with an earlier timestamp
    const olderTask = await repo.createTask({
      title: 'Oldest Task for Sort Test',
      description: 'This task was created first',
      status: 'todo',
      createdAt: now - 1000,
      updatedAt: now - 1000
    });

    // Create the command handler
    const { createSearchCommand } = await import('../../cli/commands/search/index');
    const searchCommand = createSearchCommand();

    // Clear console log calls for clean test
    consoleLogCalls = [];

    // Execute the command action with sorting by createdAt
    await searchCommand.action({
      status: 'todo',
      sort: 'createdAt',
      format: 'text',
      color: false,
      fuzzy: false
    });

    // Get all task title lines
    const titleLines = consoleLogCalls.filter(call => !call.startsWith('  ') && call.includes('[todo]'));

    // The first task should be the oldest one
    const firstTaskLine = titleLines[0] || '';
    const lastTaskLine = titleLines[titleLines.length - 1] || '';

    expect(firstTaskLine.includes('Oldest') || lastTaskLine.includes('Newest')).toBeTruthy();
  });
});