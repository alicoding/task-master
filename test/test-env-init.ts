/**
 * Test Environment Initialization
 *
 * This module initializes the test environment for the task-master project.
 * It sets up proper test environment mode for modules that need it.
 */

/**
 * Initialize the test environment
 * Enables test mode for all modules that support it
 */
export function initTestEnvironment() {
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';

  console.log('Test environment initialized with enhanced error handling');
}

/**
 * Reset the test environment
 * Disables test mode for all modules
 */
export function resetTestEnvironment() {
  // Reset NODE_ENV
  process.env.NODE_ENV = 'development';
}

// Auto-initialize when imported
initTestEnvironment();