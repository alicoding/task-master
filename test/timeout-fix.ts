/**
 * Test Timeout and Compatibility Utilities
 * 
 * This module provides utilities to help fix timing-related test failures 
 * and improve compatibility with the tsx loader.
 */

/**
 * Standardized time constants for consistent timing in tests
 */
export const TIME = {
  VERY_SHORT: 100,   // Very fast operations
  SHORT: 300,        // Quick operations
  MEDIUM: 500,       // Standard operations
  LONG: 1000,        // Complex or network operations
  VERY_LONG: 2000,   // File system or database operations
  EXTRA_LONG: 5000   // External service or high-latency operations
};

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fix for file system tests to deal with timing issues
 * Waits for a specific duration before resolving
 * @param duration Milliseconds to wait
 * @returns Promise that resolves after the duration
 */
export async function waitForFileSystem(duration: number = TIME.LONG): Promise<void> {
  return sleep(duration);
}

/**
 * Execute a function with retries if it fails
 * Useful for flaky tests that might fail due to timing issues
 * 
 * @param fn Function to execute
 * @param retries Maximum number of retries
 * @param delay Delay between retries
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  retries: number = 3, 
  delay: number = TIME.MEDIUM
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute a function with a timeout
 * Throws an error if the function takes longer than the timeout
 * 
 * @param fn Function to execute
 * @param timeout Timeout in milliseconds
 * @returns Result of the function
 */
export async function withTimeout<T>(
  fn: () => Promise<T>, 
  timeout: number = TIME.VERY_LONG
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);
    
    fn().then(
      result => {
        clearTimeout(timer);
        resolve(result);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}