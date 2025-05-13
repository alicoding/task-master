/**
 * Command handlers index file
 * Exports all command handlers and a function to register them
 */
export * from './task-add';
export * from './task-update';
export * from './task-remove';
export * from './task-search';
export * from './task-show';
export * from './task-graph';
export * from './task-deps';
export * from './batch-handler';
export * from './task-merge';
export * from './task-metadata';
/**
 * Register all command handlers in the registry
 */
export declare function registerAllCommandHandlers(): void;
/**
 * Initialize the command registry
 */
export declare function initCommandRegistry(): void;
