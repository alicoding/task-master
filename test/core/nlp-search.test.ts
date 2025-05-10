import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { NlpService } from '../../core/nlp-service.js';
import { TaskRepository } from '../../core/repo.js';

test('NLP Service - Basic Functionality', async () => {
  const nlp = new NlpService();
  
  // Train the model
  await nlp.train();
  
  // Test tokenization and stems
  const processed = await nlp.processQuery('Adding new features to the user interface');
  
  // Check tokens
  assert.ok(processed.tokens.includes('adding'), 'Should tokenize "adding"');
  assert.ok(processed.tokens.includes('new'), 'Should tokenize "new"');
  assert.ok(processed.tokens.includes('features'), 'Should tokenize "features"');
  assert.ok(processed.tokens.includes('user'), 'Should tokenize "user"');
  assert.ok(processed.tokens.includes('interface'), 'Should tokenize "interface"');
  
  // Check normalization
  assert.equal(processed.normalizedQuery, 'adding new features to the user interface');
  
  // Check intent recognition (should recognize this as an "add" action)
  const hasAddIntent = processed.intents.some(intent => 
    intent.name === 'search.action.add' && intent.score > 0.3
  );
  
  assert.ok(hasAddIntent, 'Should recognize "add" intent');
});

test('NLP Service - Similarity Calculation', async () => {
  const nlp = new NlpService();
  await nlp.train();
  
  // Test similarity between identical strings
  const exactMatch = await nlp.getSimilarity('Add login form', 'Add login form');
  assert.equal(exactMatch, 1, 'Identical strings should have similarity of 1');
  
  // Test similarity between similar strings
  const similar = await nlp.getSimilarity('Add login form', 'Adding a form for login');
  assert.ok(similar > 0.5, 'Similar strings should have similarity > 0.5');
  
  // Test similarity between unrelated strings
  const unrelated = await nlp.getSimilarity('Add login form', 'Fix database connection');
  assert.ok(unrelated < 0.3, 'Unrelated strings should have similarity < 0.3');
});

test('NLP Service - Filter Extraction', async () => {
  const nlp = new NlpService();
  await nlp.train();
  
  // Test extraction of status
  const statusQuery = await nlp.extractSearchFilters('show me all in progress tasks');
  assert.equal(statusQuery.status, 'in-progress', 'Should extract in-progress status');
  assert.ok(statusQuery.extractedTerms.includes('status:in-progress'), 'Should include status in extracted terms');
  
  // Test extraction of readiness
  const readinessQuery = await nlp.extractSearchFilters('find blocked tasks about the API');
  assert.equal(readinessQuery.readiness, 'blocked', 'Should extract blocked readiness');
  assert.ok(readinessQuery.extractedTerms.includes('readiness:blocked'), 'Should include readiness in extracted terms');
  assert.ok(readinessQuery.query.includes('API'), 'Should preserve API in the cleaned query');
  
  // Test extraction of priority
  const priorityQuery = await nlp.extractSearchFilters('high priority tasks for next week');
  assert.equal(priorityQuery.priority, 'high', 'Should extract high priority');
  assert.ok(priorityQuery.extractedTerms.includes('priority:high'), 'Should include priority in extracted terms');
  assert.ok(priorityQuery.query.includes('next week'), 'Should preserve time indicator in the cleaned query');
  
  // Test extraction of action type
  const actionQuery = await nlp.extractSearchFilters('tasks about fixing the login page');
  assert.ok(actionQuery.actionTypes?.includes('fix'), 'Should extract fix action');
  assert.ok(actionQuery.extractedTerms.includes('action:fix'), 'Should include action in extracted terms');
  assert.ok(actionQuery.query.includes('login page'), 'Should preserve login page in the cleaned query');
});

test('NLP Service - Find Similar Tasks', async () => {
  const nlp = new NlpService();
  await nlp.train();
  
  // Test data
  const tasks = [
    { id: '1', title: 'Add login form to the user interface' },
    { id: '2', title: 'Fix database connection issues' },
    { id: '3', title: 'Create user registration page' },
    { id: '4', title: 'Login system enhancements' },
    { id: '5', title: 'Update API documentation' }
  ];
  
  // Find tasks similar to "login form"
  const loginResults = await nlp.findSimilarTasks(tasks, 'login form', 0.2);
  
  // Should find at least the most relevant tasks
  assert.ok(loginResults.some(t => t.id === '1'), 'Should find "Add login form" task');
  assert.ok(loginResults.some(t => t.id === '4'), 'Should find "Login system" task');
  
  // The login tasks should have higher similarity than others
  const loginTask = loginResults.find(t => t.id === '1');
  const dbTask = loginResults.find(t => t.id === '2');
  
  if (loginTask && dbTask) {
    assert.ok(loginTask.similarity > dbTask.similarity, 'Login task should have higher similarity');
  }
  
  // Find tasks similar to "API documentation"
  const apiResults = await nlp.findSimilarTasks(tasks, 'API documentation', 0.2);
  assert.ok(apiResults.some(t => t.id === '5'), 'Should find "Update API documentation" task');
});

test('NLP Service - Integration with Repository', async () => {
  // Create an in-memory repository for testing
  const repo = new TaskRepository('./test.db', true);
  
  // Create test tasks
  await repo.createTask({
    title: 'Add login form to the user interface',
    tags: ['ui', 'feature']
  });
  
  await repo.createTask({
    title: 'Fix database connection issues',
    tags: ['backend', 'bug'],
    status: 'in-progress'
  });
  
  await repo.createTask({
    title: 'Create user registration page',
    tags: ['ui', 'feature'],
    status: 'todo'
  });
  
  await repo.createTask({
    title: 'Login system security enhancements',
    tags: ['security', 'enhancement'],
    status: 'todo',
    readiness: 'blocked'
  });
  
  // Test natural language search
  const loginTasks = await repo.searchTasks({ query: 'find todo tasks related to login' });
  
  // Should find login-related tasks that are in todo status
  assert.ok(loginTasks.some(t => 
    t.title.toLowerCase().includes('login') && 
    t.status === 'todo'
  ), 'Should find login-related todo tasks');
  
  // Test finding similar tasks
  const similarTasks = await repo.findSimilarTasks('user authentication form');
  
  // Should find login and registration tasks as they're related to user authentication
  assert.ok(similarTasks.some(t => t.title.toLowerCase().includes('login')), 
    'Should find login task as similar to authentication');
  
  assert.ok(similarTasks.some(t => t.title.toLowerCase().includes('registration')), 
    'Should find registration task as similar to authentication');
  
  // Test multi-term query with status extraction
  const blockedTasks = await repo.searchTasks({ query: 'blocked security issues' });
  
  // Should find blocked security-related tasks
  assert.ok(blockedTasks.some(t => 
    t.tags.includes('security') && 
    t.readiness === 'blocked'
  ), 'Should find blocked security tasks');
  
  // Clean up
  repo.close();
});

test.run();