/**
 * Main API entry point
 * Re-exports all API components
 */

// Export context and command-related classes
export * from '@/core/api/context';
export * from '@/core/api/command';

// Export command handlers
export * from '@/core/api/handlers/index';

// Export the API service and router
export { ApiService } from '@/core/api/service-new';
export { ApiRouter } from '@/core/api/router-new';

// Export types
export * from '@/core/api/types';

// Import the command registry and initialize it
import { commandRegistry } from '@/core/api/command';
import { initCommandRegistry } from '@/core/api/handlers/index';
import { BatchHandler } from '@/core/api/handlers/batch-handler';

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