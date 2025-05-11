/**
 * Main API entry point
 * Re-exports all API components
 */

// Export context and command-related classes
export * from './context.ts';
export * from './command.ts';

// Export command handlers
export * from './handlers/index.ts';

// Export the API service and router
export { ApiService } from './service-new.ts';
export { ApiRouter } from './router-new.ts';

// Export types
export * from './types.ts';

// Import the command registry and initialize it
import { commandRegistry } from './command.ts';
import { initCommandRegistry } from './handlers/index.ts';
import { BatchHandler } from './handlers/batch-handler.ts';

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