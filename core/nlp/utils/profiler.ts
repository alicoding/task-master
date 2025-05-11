/**
 * Performance profiling utilities for NLP operations
 *
 * This module provides tools for measuring and analyzing the performance of
 * NLP operations in the Task Master application. It allows for detailed timing
 * of critical operations, identification of bottlenecks, and logging of performance
 * metrics for optimization.
 *
 * @module NlpProfilerUtils
 */

interface ProfilerResult {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Class for profiling NLP operations
 */
export class NlpProfiler {
  private static instance: NlpProfiler;
  private results: ProfilerResult[] = [];
  private enabled: boolean = false;
  private timers: Map<string, number> = new Map();

  /**
   * Get the singleton profiler instance
   * @returns The NlpProfiler instance
   */
  public static getInstance(): NlpProfiler {
    if (!this.instance) {
      this.instance = new NlpProfiler();
    }
    return this.instance;
  }

  /**
   * Enable or disable profiling
   * @param enable Whether to enable profiling
   */
  public setEnabled(enable: boolean): void {
    this.enabled = enable;
  }

  /**
   * Start timing an operation
   * @param operation Name of the operation
   */
  public startTimer(operation: string): void {
    if (!this.enabled) return;
    this.timers.set(operation, performance.now());
  }

  /**
   * Stop timing an operation and record the result
   * @param operation Name of the operation
   * @param metadata Optional metadata about the operation
   */
  public stopTimer(operation: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;
    
    const startTime = this.timers.get(operation);
    if (startTime === undefined) {
      console.warn(`No timer started for operation: ${operation}`);
      return;
    }
    
    const duration = performance.now() - startTime;
    this.results.push({
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    });
    
    this.timers.delete(operation);
  }

  /**
   * Clear all profiling results
   */
  public clearResults(): void {
    this.results = [];
    this.timers.clear();
  }

  /**
   * Get all profiling results
   * @returns Array of profiling results
   */
  public getResults(): ProfilerResult[] {
    return [...this.results];
  }

  /**
   * Get summary statistics for profiled operations
   * @returns Object containing statistics for each operation
   */
  public getSummary(): Record<string, { count: number, totalTime: number, avgTime: number, maxTime: number }> {
    const summary: Record<string, { count: number, totalTime: number, avgTime: number, maxTime: number }> = {};
    
    for (const result of this.results) {
      if (!summary[result.operation]) {
        summary[result.operation] = {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          maxTime: 0
        };
      }
      
      const stats = summary[result.operation];
      stats.count++;
      stats.totalTime += result.duration;
      stats.maxTime = Math.max(stats.maxTime, result.duration);
    }
    
    // Calculate averages
    for (const operation in summary) {
      const stats = summary[operation];
      stats.avgTime = stats.totalTime / stats.count;
    }
    
    return summary;
  }

  /**
   * Print a formatted summary of profiling results to the console
   */
  public printSummary(): void {
    const summary = this.getSummary();
    
    console.log('\n=== NLP Performance Profiling Results ===');
    
    // Get operations sorted by total time (descending)
    const sortedOps = Object.entries(summary)
      .sort(([, a], [, b]) => b.totalTime - a.totalTime);
    
    // Print headers
    console.log(
      'Operation'.padEnd(30) +
      'Count'.padEnd(10) +
      'Total (ms)'.padEnd(15) +
      'Avg (ms)'.padEnd(15) +
      'Max (ms)'.padEnd(15)
    );
    console.log('-'.repeat(85));
    
    // Print each operation's stats
    for (const [operation, stats] of sortedOps) {
      console.log(
        operation.padEnd(30) +
        String(stats.count).padEnd(10) +
        stats.totalTime.toFixed(2).padEnd(15) +
        stats.avgTime.toFixed(2).padEnd(15) +
        stats.maxTime.toFixed(2).padEnd(15)
      );
    }
    
    console.log('\n=== End of Profiling Results ===\n');
  }

  /**
   * Profile a function call
   * @param operation Name of the operation
   * @param fn Function to profile
   * @param args Arguments to pass to the function
   * @returns The result of the function call
   */
  public profileSync<T>(operation: string, fn: (...args: any[]) => T, ...args: any[]): T {
    if (!this.enabled) {
      return fn(...args);
    }
    
    this.startTimer(operation);
    try {
      const result = fn(...args);
      this.stopTimer(operation);
      return result;
    } catch (error) {
      this.stopTimer(operation);
      throw error;
    }
  }

  /**
   * Profile an async function call
   * @param operation Name of the operation
   * @param fn Async function to profile
   * @param args Arguments to pass to the function
   * @returns Promise resolving to the result of the function call
   */
  public async profileAsync<T>(
    operation: string,
    fn: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T> {
    if (!this.enabled) {
      return fn(...args);
    }
    
    this.startTimer(operation);
    try {
      const result = await fn(...args);
      this.stopTimer(operation);
      return result;
    } catch (error) {
      this.stopTimer(operation);
      throw error;
    }
  }
}

/**
 * Decorator for profiling class methods
 * @param operationPrefix Prefix for the operation name in profiling results
 * @returns Method decorator
 */
export function profileMethod(operationPrefix: string = '') {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const profiler = NlpProfiler.getInstance();
    
    descriptor.value = function(...args: any[]) {
      const operation = operationPrefix
        ? `${operationPrefix}.${propertyKey}`
        : propertyKey;
      
      if (originalMethod.constructor.name === 'AsyncFunction') {
        return profiler.profileAsync(operation, originalMethod.bind(this), ...args);
      } else {
        return profiler.profileSync(operation, originalMethod.bind(this), ...args);
      }
    };
    
    return descriptor;
  };
}

/**
 * Get a singleton instance of the NLP profiler
 * @returns The NlpProfiler instance
 */
export function getNlpProfiler(): NlpProfiler {
  return NlpProfiler.getInstance();
}