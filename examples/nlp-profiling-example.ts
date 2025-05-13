/**
 * NLP Profiling Example for Task Master
 * 
 * This example demonstrates how to profile and benchmark the NLP performance
 * in Task Master, comparing the standard and optimized implementations.
 */

import { createNlpService, createOptimizedNlpService } from '../core/nlp/index';
import { TaskRepository } from '../core/repo';

// Sample queries for benchmarking
const sampleQueries = [
  'find high priority tasks about performance',
  'show me tasks related to documentation',
  'what tasks are blocked and need review',
  'search for in-progress tasks with UI improvements',
  'find tasks similar to database optimization'
];

// Number of iterations to run for each test
const iterations = 3;

async function runBenchmark() {
  console.log('Task Master NLP Profiling Example\n');
  
  // Create repository
  const repo = new TaskRepository();
  
  try {
    // Get sample tasks for similarity search
    const tasksResult = await repo.getAllTasks();
    if (!tasksResult.success || !tasksResult.data || tasksResult.data.length === 0) {
      console.log('No tasks found for benchmarking. Please add some tasks first.');
      return;
    }
    
    const tasks = tasksResult.data;
    console.log(`Found ${tasks.length} tasks for benchmarking.\n`);
    
    // Prepare search info
    const searchInfo = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: typeof task.metadata === 'string'
        ? JSON.parse(task.metadata).description
        : task.metadata?.description
    }));
    
    // Test standard implementation
    console.log('Testing standard NLP implementation:');
    await testImplementation(false, searchInfo);
    
    // Test optimized implementation
    console.log('\nTesting optimized NLP implementation:');
    await testImplementation(true, searchInfo);
    
    // Test optimized implementation with caching
    console.log('\nTesting optimized NLP implementation with caching:');
    await testImplementationWithCache(searchInfo);
    
  } finally {
    repo.close();
  }
}

async function testImplementation(useOptimized: boolean, searchInfo: any[]) {
  // Create appropriate NLP service
  const nlpService = useOptimized
    ? createOptimizedNlpService(undefined, true) // Enable profiling
    : createNlpService({ useOptimized: false });
  
  // Initialize the service
  console.log('  Initializing NLP service...');
  const initStart = performance.now();
  await nlpService.train();
  const initTime = performance.now() - initStart;
  console.log(`  Initialization time: ${initTime.toFixed(2)}ms`);
  
  // Warm-up
  console.log('  Warming up...');
  await nlpService.processQuery('warm up query');
  await nlpService.extractSearchFilters('warm up filter extraction');
  await nlpService.findSimilarTasks(searchInfo, 'warm up similarity', 0.3, true);
  
  // Run benchmark
  console.log('  Running benchmark:');
  
  const totalStart = performance.now();
  
  for (const query of sampleQueries) {
    console.log(`\n  Query: "${query}"`);
    
    // Process query
    const processStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await nlpService.processQuery(query);
    }
    const processTime = (performance.now() - processStart) / iterations;
    console.log(`    Process query: ${processTime.toFixed(2)}ms (avg of ${iterations} runs)`);
    
    // Extract filters
    const extractStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await nlpService.extractSearchFilters(query);
    }
    const extractTime = (performance.now() - extractStart) / iterations;
    console.log(`    Extract filters: ${extractTime.toFixed(2)}ms (avg of ${iterations} runs)`);
    
    // Find similar tasks
    const similarStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await nlpService.findSimilarTasks(searchInfo, query, 0.3, true);
    }
    const similarTime = (performance.now() - similarStart) / iterations;
    console.log(`    Find similar tasks: ${similarTime.toFixed(2)}ms (avg of ${iterations} runs)`);
  }
  
  const totalTime = performance.now() - totalStart;
  console.log(`\n  Total benchmark time: ${totalTime.toFixed(2)}ms`);
  
  // Show profiling results if available
  if (useOptimized) {
    // @ts-ignore - We know OptimizedNlpService has this method
    if (typeof nlpService.printProfilingResults === 'function') {
      console.log('\n  Detailed profiling results:');
      // @ts-ignore
      nlpService.printProfilingResults();
    }
  }
}

async function testImplementationWithCache(searchInfo: any[]) {
  // Create optimized NLP service with profiling
  const nlpService = createOptimizedNlpService(undefined, true);
  
  // Initialize the service
  console.log('  Initializing NLP service...');
  await nlpService.train();
  
  // Warm-up and prime the cache
  console.log('  Warming up and priming cache...');
  for (const query of sampleQueries) {
    await nlpService.processQuery(query);
    await nlpService.extractSearchFilters(query);
    await nlpService.findSimilarTasks(searchInfo, query, 0.3, true);
  }
  
  // Run benchmark with cached results
  console.log('  Running benchmark with cached results:');
  
  const totalStart = performance.now();
  
  for (const query of sampleQueries) {
    console.log(`\n  Query: "${query}"`);
    
    // Process query (cached)
    const processStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await nlpService.processQuery(query);
    }
    const processTime = (performance.now() - processStart) / iterations;
    console.log(`    Process query (cached): ${processTime.toFixed(2)}ms (avg of ${iterations} runs)`);
    
    // Extract filters (cached)
    const extractStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await nlpService.extractSearchFilters(query);
    }
    const extractTime = (performance.now() - extractStart) / iterations;
    console.log(`    Extract filters (cached): ${extractTime.toFixed(2)}ms (avg of ${iterations} runs)`);
    
    // Find similar tasks (partially cached)
    const similarStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await nlpService.findSimilarTasks(searchInfo, query, 0.3, true);
    }
    const similarTime = (performance.now() - similarStart) / iterations;
    console.log(`    Find similar tasks (cached): ${similarTime.toFixed(2)}ms (avg of ${iterations} runs)`);
  }
  
  const totalTime = performance.now() - totalStart;
  console.log(`\n  Total benchmark time with caching: ${totalTime.toFixed(2)}ms`);
  
  // Show cache statistics
  // @ts-ignore - We know OptimizedNlpService has this method
  if (typeof nlpService.getCacheStats === 'function') {
    console.log('\n  Cache statistics:');
    // @ts-ignore
    const cacheStats = nlpService.getCacheStats();
    console.log(`    Query cache entries: ${cacheStats.query}`);
    console.log(`    Similarity cache entries: ${cacheStats.similarity}`);
    console.log(`    Filters cache entries: ${cacheStats.filters}`);
  }
}

// Run the benchmark
runBenchmark().catch(err => {
  console.error('Error running benchmark:', err);
  process.exit(1);
});