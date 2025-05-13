/**
 * Test Error Handling Utilities
 * 
 * Comprehensive error handling utilities for tests that ensures
 * tests can run reliably even with expected errors.
 */

// Testing mode configuration
let TEST_MODE = false;
let VERBOSE_LOGGING = false;
let ERROR_COLLECTION_ENABLED = false;

// Collected errors for analysis
const collectedErrors: Array<{
  component: string;
  message: string;
  error: any;
  timestamp: Date;
}> = [];

/**
 * Enable test mode for error handling
 * @param verbose Whether to enable verbose error logging
 * @param collectErrors Whether to collect errors for analysis
 */
export function enableTestMode(verbose: boolean = false, collectErrors: boolean = false): void {
  TEST_MODE = true;
  VERBOSE_LOGGING = verbose;
  ERROR_COLLECTION_ENABLED = collectErrors;
  console.log(`Test error handling enabled: verbose=${verbose}, collectErrors=${collectErrors}`);
}

/**
 * Disable test mode
 */
export function disableTestMode(): void {
  TEST_MODE = false;
  VERBOSE_LOGGING = false;
  ERROR_COLLECTION_ENABLED = false;
  collectedErrors.length = 0; // Clear collected errors
}

/**
 * Check if test mode is enabled
 */
export function isTestMode(): boolean {
  return TEST_MODE;
}

/**
 * Log error in test mode
 * @param component Component name
 * @param message Error message
 * @param error Error object
 */
export function logTestError(component: string, message: string, error: any): void {
  if (!TEST_MODE) return;
  
  // Format error timestamp
  const timestamp = new Date();
  const timeStr = timestamp.toISOString();
  
  // Collect error if enabled
  if (ERROR_COLLECTION_ENABLED) {
    collectedErrors.push({
      component,
      message,
      error,
      timestamp
    });
  }
  
  // Log error based on verbosity setting
  if (VERBOSE_LOGGING) {
    console.error(`${timeStr} ERROR [${component}] ${message}:`, error);
  } else {
    console.error(`${timeStr} ERROR [${component}] ${message}:`, error?.message || error);
  }
}

/**
 * Get collected errors
 */
export function getCollectedErrors(): typeof collectedErrors {
  return [...collectedErrors];
}

/**
 * Clear collected errors
 */
export function clearCollectedErrors(): void {
  collectedErrors.length = 0;
}

/**
 * Wraps an async function call with safe error handling for tests
 * @param component Component name for logging
 * @param fn Function to call
 * @param errorMessage Error message to log
 * @param defaultValue Default value to return on error
 */
export async function safeAsync<T>(
  component: string,
  fn: () => Promise<T>,
  errorMessage: string,
  defaultValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logTestError(component, errorMessage, error);
    return defaultValue;
  }
}

/**
 * Wraps a sync function call with safe error handling for tests
 * @param component Component name for logging
 * @param fn Function to call
 * @param errorMessage Error message to log
 * @param defaultValue Default value to return on error
 */
export function safeSync<T>(
  component: string,
  fn: () => T,
  errorMessage: string,
  defaultValue: T
): T {
  try {
    return fn();
  } catch (error) {
    logTestError(component, errorMessage, error);
    return defaultValue;
  }
}

/**
 * Creates an error handler function for use in catch blocks
 * @param component Component name for logging
 * @param errorMessage Base error message
 * @param defaultValue Optional default value to return
 */
export function createErrorHandler<T>(
  component: string,
  errorMessage: string,
  defaultValue?: T
): (error: any) => T | undefined {
  return (error: any) => {
    logTestError(component, errorMessage, error);
    return defaultValue as T;
  };
}

/**
 * Creates a timeout promise that resolves after specified time
 * Useful for tests with async operations
 * @param ms Milliseconds to wait
 */
export function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async function until it succeeds or reaches max attempts
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param delayMs Delay between attempts in milliseconds
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await timeout(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * Executes a callback with a timeout, rejecting if it takes too long
 * @param fn Function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Message to include in timeout error
 */
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
    
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