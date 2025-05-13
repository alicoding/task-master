/**
 * Main API entry point
 * Re-exports all API components
 */
export * from './context';
export * from './command';
export * from './handlers/index';
export { ApiService } from './service-new';
export { ApiRouter } from './router-new';
export * from './types';
/**
 * Execute a command directly using the command registry
 * This is a convenience function for direct programmatic usage
 */
export declare function executeCommand(commandName: string, params?: any, options?: any): Promise<any>;
