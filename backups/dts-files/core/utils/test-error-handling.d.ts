/**
 * Test Error Handling Utilities
 *
 * Comprehensive error handling utilities for tests that ensures
 * tests can run reliably even with expected errors.
 */
declare const collectedErrors: Array<{
    component: string;
    message: string;
    error: any;
    timestamp: Date;
}>;
/**
 * Enable test mode for error handling
 * @param verbose Whether to enable verbose error logging
 * @param collectErrors Whether to collect errors for analysis
 */
export declare function enableTestMode(verbose?: boolean, collectErrors?: boolean): void;
/**
 * Disable test mode
 */
export declare function disableTestMode(): void;
/**
 * Check if test mode is enabled
 */
export declare function isTestMode(): boolean;
/**
 * Log error in test mode
 * @param component Component name
 * @param message Error message
 * @param error Error object
 */
export declare function logTestError(component: string, message: string, error: any): void;
/**
 * Get collected errors
 */
export declare function getCollectedErrors(): typeof collectedErrors;
/**
 * Clear collected errors
 */
export declare function clearCollectedErrors(): void;
/**
 * Wraps an async function call with safe error handling for tests
 * @param component Component name for logging
 * @param fn Function to call
 * @param errorMessage Error message to log
 * @param defaultValue Default value to return on error
 */
export declare function safeAsync<T>(component: string, fn: () => Promise<T>, errorMessage: string, defaultValue: T): Promise<T>;
/**
 * Wraps a sync function call with safe error handling for tests
 * @param component Component name for logging
 * @param fn Function to call
 * @param errorMessage Error message to log
 * @param defaultValue Default value to return on error
 */
export declare function safeSync<T>(component: string, fn: () => T, errorMessage: string, defaultValue: T): T;
/**
 * Creates an error handler function for use in catch blocks
 * @param component Component name for logging
 * @param errorMessage Base error message
 * @param defaultValue Optional default value to return
 */
export declare function createErrorHandler<T>(component: string, errorMessage: string, defaultValue?: T): (error: any) => T | undefined;
/**
 * Creates a timeout promise that resolves after specified time
 * Useful for tests with async operations
 * @param ms Milliseconds to wait
 */
export declare function timeout(ms: number): Promise<void>;
/**
 * Retries an async function until it succeeds or reaches max attempts
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param delayMs Delay between attempts in milliseconds
 */
export declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, delayMs?: number): Promise<T>;
/**
 * Executes a callback with a timeout, rejecting if it takes too long
 * @param fn Function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Message to include in timeout error
 */
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
export {};
