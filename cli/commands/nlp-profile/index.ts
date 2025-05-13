/**
 * NLP Profiling Command
 * 
 * Command for profiling and benchmarking NLP performance
 * Allows comparing optimized vs. standard implementation
 */

import { Command } from 'commander';
import { createNlpService } from '../../../core/nlp/index';
import { TaskRepository } from '../../../core/repo';
import chalk from 'chalk';
import { ProfilableNlpService } from '../../../core/nlp/types';

/**
 * Create the NLP profile command
 * @returns The nlp-profile command
 */
export function createNlpProfileCommand(): Command {
  const profileCommand = new Command('nlp-profile')
    .description('Profile and benchmark NLP performance')
    .option('--optimized', 'Use optimized NLP implementation', true)
    .option('--standard', 'Use standard NLP implementation (non-optimized)')
    .option('--query <query>', 'Query to use for benchmarking')
    .option('--iterations <count>', 'Number of iterations to run', '5')
    .option('--cache [enabled]', 'Enable caching (optimized only)', true)
    .option('--detail', 'Show detailed profiling information')
    .option('--compare', 'Compare optimized vs standard implementation')
    .action(async (options) => {
      console.log(chalk.blue.bold('NLP Performance Profiling'));
      console.log(chalk.gray('Benchmarking NLP processing performance\n'));

      const useOptimized = options.standard ? false : options.optimized;
      const iterations = parseInt(options.iterations, 10) || 5;
      const query = options.query || 'find high priority tasks about performance optimization';
      const showDetail = options.detail || false;
      const runComparison = options.compare || false;
      const enableCache = options.cache !== 'false';
      
      if (runComparison) {
        await runComparisonBenchmark(query, iterations, showDetail);
      } else {
        await runProfileBenchmark(useOptimized, query, iterations, enableCache, showDetail);
      }
    });

  return profileCommand;
}

/**
 * Run a benchmark profile with the specified NLP implementation
 * @param useOptimized Whether to use the optimized implementation
 * @param query Query to benchmark
 * @param iterations Number of iterations to run
 * @param enableCache Whether to enable caching (optimized only)
 * @param showDetail Whether to show detailed profiling information
 */
async function runProfileBenchmark(
  useOptimized: boolean,
  query: string,
  iterations: number,
  enableCache: boolean,
  showDetail: boolean
): Promise<void> {
  console.log(chalk.yellow(`Using ${useOptimized ? 'optimized' : 'standard'} NLP implementation`));
  console.log(chalk.yellow(`Running ${iterations} iterations with query: "${query}"`));
  console.log(chalk.yellow(`Caching ${enableCache ? 'enabled' : 'disabled'}`));
  console.log();
  
  // Create the appropriate NLP service
  const nlpService = await createNlpService({
    useOptimized,
    enableProfiling: true
  }) as ProfilableNlpService;

  // Set up repository
  const repo = new TaskRepository();

  try {
    // Initialize the NLP service
    console.log('Initializing NLP service...');
    if (typeof nlpService.train === 'function') {
      await nlpService.train();
    }

    // Get some sample tasks
    const tasks = await repo.getAllTasks();
    
    if (!tasks?.success || !tasks?.data || tasks?.data?.length === 0) {
      console.log(chalk.red('No tasks found for benchmarking'));
      return;
    }
    
    // Ensure we have valid task data
    if (!tasks || !tasks.success || !tasks.data) {
      console.error('Failed to retrieve tasks for benchmarking');
      return;
    }

    const sampleTasks = tasks.data.slice(0, Math.min(tasks.data.length, 50));
    console.log(`Using ${sampleTasks.length} tasks for benchmarking\n`);

    // Prepare search info
    const searchInfo = sampleTasks.map(task => {
      let description = null;
      if (task.metadata) {
        if (typeof task.metadata === 'string') {
          try {
            const parsed = JSON.parse(task.metadata);
            description = parsed && typeof parsed === 'object' && 'description' in parsed ? parsed.description : null;
          } catch (e) {
            description = null;
          }
        } else {
          description = task.metadata && typeof task.metadata === 'object' && 'description' in task.metadata ?
            (task.metadata as Record<string, any>).description : null;
        }
      }

      return {
        id: task.id,
        title: task.title,
        description
      };
    });
    
    // Run the benchmark
    console.log(chalk.green('Running benchmark...'));
    
    const startTime = performance.now();
    
    // Run iterations
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      // Process query
      if (typeof nlpService.processQuery === 'function') {
        await nlpService.processQuery(query);
      }

      // Extract search filters
      if (typeof nlpService.extractSearchFilters === 'function') {
        await nlpService.extractSearchFilters(query);
      }

      // Find similar tasks
      if (typeof nlpService.findSimilarTasks === 'function') {
        await nlpService.findSimilarTasks(searchInfo, query, 0.3, true);
      }
      
      const iterationTime = performance.now() - iterationStart;
      console.log(`  Iteration ${i + 1}: ${iterationTime.toFixed(2)}ms`);
      
      // Clear cache between iterations if needed
      if (useOptimized && !enableCache && i < iterations - 1) {
        nlpService.clearCache();
      }
    }
    
    const totalTime = performance.now() - startTime;
    const avgTime = totalTime / iterations;
    
    console.log();
    console.log(chalk.green(`Results for ${useOptimized ? 'optimized' : 'standard'} implementation:`));
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Average time per iteration: ${avgTime.toFixed(2)}ms`);
    
    // Show detailed profiling information if requested
    if (showDetail && useOptimized) {
      console.log();
      nlpService.printProfilingResults();

      // Show cache stats if enabled
      if (enableCache) {
        const cacheStats = nlpService.getCacheStats();
        console.log(chalk.green('\nCache Statistics:'));
        if (cacheStats && typeof cacheStats === 'object') {
          const query = cacheStats.query ?? 0;
          const similarity = cacheStats.similarity ?? 0;
          const filters = cacheStats.filters ?? 0;

          console.log(`  Query cache entries: ${query}`);
          console.log(`  Similarity cache entries: ${similarity}`);
          console.log(`  Filters cache entries: ${filters}`);
        }
      }
    }
  } finally {
    repo.close();
  }
}

/**
 * Run a comparison benchmark between optimized and standard implementations
 * @param query Query to benchmark
 * @param iterations Number of iterations to run
 * @param showDetail Whether to show detailed profiling information
 */
async function runComparisonBenchmark(
  query: string,
  iterations: number,
  showDetail: boolean
): Promise<void> {
  console.log(chalk.yellow(`Running comparison benchmark with ${iterations} iterations`));
  console.log(chalk.yellow(`Query: "${query}"`));
  console.log();
  
  // Run standard benchmark
  console.log(chalk.blue.bold('Standard Implementation:'));
  await runProfileBenchmark(false, query, iterations, false, false);
  
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Run optimized benchmark with cache
  console.log(chalk.blue.bold('Optimized Implementation (with caching):'));
  await runProfileBenchmark(true, query, iterations, true, showDetail);
  
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Run optimized benchmark without cache
  console.log(chalk.blue.bold('Optimized Implementation (without caching):'));
  await runProfileBenchmark(true, query, iterations, false, false);
}