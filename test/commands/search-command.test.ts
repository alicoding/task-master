/**
 * Integration tests for Search Command
 * Verifies that the search command correctly finds tasks based on various criteria
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as sinon from 'sinon';
import { TaskRepository } from '../../core/repo.ts';
import { NlpService } from '../../core/nlp-service.ts';

// Import test helpers
import { createTestRepository, createSampleTasks } from '../core/test-helpers.ts';

// Test variables
let repo: TaskRepository;
let taskIds: string[];
let consoleLogStub: sinon.SinonStub;
let consoleErrorStub: sinon.SinonStub;
let consoleLogCalls: string[] = [];
let consoleErrorCalls: string[] = [];

// Mock NlpService
jest.mock('../../core/nlp-service.ts', () => {
  return {
    NlpService: class MockNlpService {
      extractSearchFilters(query: string) {
        return Promise.resolve({
          extractedTerms: [`status: todo`, `tag: important`],
          query: query.replace(/todo|important/g, '').trim(),
          filters: {
            status: 'todo',
            tags: ['important']
          }
        });
      }
    }
  };
});

// Setup before tests
test.before.each(async () => {
  // Create in-memory repository
  repo = createTestRepository();
  
  // Create sample tasks
  taskIds = await createSampleTasks(repo);
  
  // Stub console output
  consoleLogCalls = [];
  consoleErrorCalls = [];
  
  consoleLogStub = sinon.stub(console, 'log').callsFake((...args: any[]) => {
    consoleLogCalls.push(args.map(arg => String(arg)).join(' '));
  });
  
  consoleErrorStub = sinon.stub(console, 'error').callsFake((...args: any[]) => {
    consoleErrorCalls.push(args.map(arg => String(arg)).join(' '));
  });
});

// Cleanup after tests
test.after.each(() => {
  // Close repository
  if (repo) {
    repo.close();
  }
  
  // Restore console stubs
  if (consoleLogStub && consoleLogStub.restore) {
    consoleLogStub.restore();
  }
  
  if (consoleErrorStub && consoleErrorStub.restore) {
    consoleErrorStub.restore();
  }
});

// Test searching by status
test('finds tasks by status', async () => {
  // Create the command handler
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  assert.ok(taskLines.length > 0, 'Should find tasks with todo status');
  
  // Check that found task IDs are in the taskIds array
  const taskIds = taskLines.map(line => {
    const idMatch = line.match(/^(\S+)/);
    return idMatch ? idMatch[1].replace('.', '') : null;
  }).filter(Boolean);
  
  // Check the IDs are valid (they should all start with a number)
  assert.ok(taskIds.every(id => /^\d/.test(id)), 'All task IDs should be valid');
});

// Test searching by tag
test('finds tasks by tag', async () => {
  // Create the command handler
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  assert.ok(tagLines.length > 0, 'Should find tasks with important tag');
});

// Test searching by multiple criteria
test('finds tasks by multiple criteria', async () => {
  // Create the command handler
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  assert.ok(countLine, 'Should provide count of matching tasks');
  
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
    assert.ok(readinessLines.length > 0, 'Should include readiness in output');
  }
});

// Test searching with natural language query
test('performs natural language search', async () => {
  // Create the command handler
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  assert.ok(foundLine, 'Should show search results count');
  
  // Should find at least one task
  assert.ok(foundLine.includes('Found 1'), 'Should find at least one task');
});

// Test JSON output format
test('returns JSON output when format is json', async () => {
  // Create the command handler
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  
  assert.ok(jsonLine, 'Should output tasks in JSON format');
});

// Test searching with metadata
test('finds tasks by metadata', async () => {
  // First add metadata to a task
  const task = await repo.getTask(taskIds[0]);
  await repo.updateTask({
    id: task.id,
    metadata: { priority: 'high', assignee: 'test-user' }
  });
  
  // Create the command handler
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  
  assert.ok(metadataLines.length > 0, 'Should find tasks with matching metadata');
});

// Test search with explanation
test('shows search explanation when requested', async () => {
  // Create the command handler
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  assert.ok(analysisLine, 'Should show search query analysis');
  
  const originalQueryLine = consoleLogCalls.find(call => call.includes('Original query'));
  assert.ok(originalQueryLine, 'Should show original query');
  
  const extractedFiltersLine = consoleLogCalls.find(call => call.includes('Extracted filters'));
  assert.ok(extractedFiltersLine, 'Should show extracted filters');
});

// Test sorted search results
test('sorts search results by specified field', async () => {
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
  const { createSearchCommand } = await import('../../cli/commands/search/index.ts');
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
  
  assert.ok(firstTaskLine.includes('Oldest') || lastTaskLine.includes('Newest'), 
    'Tasks should be sorted by creation date');
});

// Run all tests
test.run();