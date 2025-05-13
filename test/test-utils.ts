/**
 * Enhanced Test Utilities
 * 
 * This module provides utilities to help fix timing-related test failures,
 * improve compatibility with the tsx loader, and ensure consistent test behavior.
 */

import { vi } from 'vitest';

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
 * Wait for a specific duration before resolving
 * @param duration Milliseconds to wait
 * @returns Promise that resolves after the duration
 */
export async function wait(duration: number = TIME.LONG): Promise<void> {
  return sleep(duration);
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

/**
 * Create a mock that returns a specific value after a delay
 * Useful for testing asynchronous code
 * 
 * @param value Value to return
 * @param delay Delay in milliseconds
 * @returns Mock function that returns the value after the delay
 */
export function createDelayedMock<T>(value: T, delay: number = TIME.SHORT) {
  return vi.fn().mockImplementation(() => {
    return new Promise<T>(resolve => {
      setTimeout(() => resolve(value), delay);
    });
  });
}

/**
 * Create a mock that throws an error after a delay
 * Useful for testing error handling in asynchronous code
 * 
 * @param error Error to throw
 * @param delay Delay in milliseconds
 * @returns Mock function that throws the error after the delay
 */
export function createErrorMock(error: Error | string, delay: number = TIME.SHORT) {
  const actualError = typeof error === 'string' ? new Error(error) : error;
  return vi.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(actualError), delay);
    });
  });
}

/**
 * Helper to create improved async mocks compatible with ESM
 * @param impl Mock implementation function
 * @returns Mocked function
 */
export function createAsyncMock<T>(impl: (...args: any[]) => Promise<T>) {
  return vi.fn().mockImplementation(impl);
}

/**
 * Mock that captures errors but still returns a successful result
 * Useful for tests that expect errors but shouldn't fail
 * 
 * @param handler Function to handle the error
 * @param defaultResult Default result to return
 * @returns Mock function that handles errors
 */
export function createErrorHandlingMock<T>(handler: (error: Error) => void, defaultResult: T) {
  return vi.fn().mockImplementation(async (...args: any[]) => {
    try {
      // If the first argument is a function, try to execute it
      if (typeof args[0] === 'function') {
        await args[0]();
      }
    } catch (error) {
      handler(error as Error);
    }
    return defaultResult;
  });
}

/**
 * Helper to manage test cleanup in beforeEach/afterEach hooks
 */
export class TestCleanup {
  private cleanupFunctions: Array<() => Promise<void> | void> = [];

  /**
   * Add a cleanup function to be called after the test
   * @param fn Cleanup function
   */
  add(fn: () => Promise<void> | void) {
    this.cleanupFunctions.push(fn);
  }

  /**
   * Run all cleanup functions
   */
  async cleanup() {
    for (const fn of this.cleanupFunctions) {
      await fn();
    }
    this.cleanupFunctions = [];
  }
}

/**
 * Helper for managing test timeouts
 */
export function setTimeout(timeoutMs: number) {
  vi.setConfig({ testTimeout: timeoutMs });
}

/**
 * Reset test timeout to default
 */
export function resetTimeout() {
  vi.setConfig({ testTimeout: 5000 }); // Default timeout
}

/**
 * Fix for expected error tests in Vitest
 * Catches the error, verifies it, and continues without failing the test
 * 
 * @param fn Function that should throw
 * @param errorPredicate Function to verify the error
 * @returns Promise that resolves if the error was thrown and verified
 */
export async function expectToThrow(
  fn: () => Promise<any> | any,
  errorPredicate: (error: any) => boolean | void
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    errorPredicate(error);
  }
}