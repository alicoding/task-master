/**
 * Main API entry point
 * Re-exports all API components
 */

// Export context and command-related classes
export * from './context.js';
export * from './command.js';

// Export command handlers
export * from './handlers/index.js';

// Export the API service and router
export { ApiService } from './service-new.js';
export { ApiRouter } from './router-new.js';

// Export types
export * from './types.js';

// Import the command registry and initialize it
import { commandRegistry } from './command.js';
import { initCommandRegistry } from './handlers/index.js';
import { BatchHandler } from './handlers/batch-handler.js';

// Initialize the command registry
initCommandRegistry();

// Add the batch handler to the registry
commandRegistry.register(new BatchHandler());

/**
 * Execute a command directly using the command registry
 * This is a convenience function for direct programmatic usage
 */
export async function executeCommand(
  commandName: string,
  params: any = {},
  options: any = {}
): Promise<any> {
  return await commandRegistry.executeCommand(commandName, params, options);
}