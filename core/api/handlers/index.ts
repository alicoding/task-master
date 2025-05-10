/**
 * Command handlers index file
 * Exports all command handlers and a function to register them
 */

// Re-export all handlers
export * from './task-add.js';
export * from './task-update.js';
export * from './task-remove.js';
export * from './task-search.js';
export * from './task-show.js';
export * from './task-graph.js';
export * from './task-deps.js';
export * from './batch-handler.js';
export * from './task-merge.js';
export * from './task-metadata.js';

import { commandRegistry, CommandHandler } from '../command.js';
import { AddTaskHandler } from './task-add.js';
import { UpdateTaskHandler } from './task-update.js';
import { RemoveTaskHandler } from './task-remove.js';
import { SearchTaskHandler } from './task-search.js';
import { ShowTaskHandler } from './task-show.js';
import { GraphTaskHandler } from './task-graph.js';
import { DepsTaskHandler } from './task-deps.js';
import { BatchHandler } from './batch-handler.js';
import { MergeTaskHandler } from './task-merge.js';
import { 
  GetMetadataHandler, 
  SetMetadataHandler, 
  RemoveMetadataHandler, 
  AppendMetadataHandler 
} from './task-metadata.js';

/**
 * Register all command handlers in the registry
 */
export function registerAllCommandHandlers(): void {
  // Create and register all handlers
  const handlers: CommandHandler[] = [
    new AddTaskHandler(),
    new UpdateTaskHandler(),
    new RemoveTaskHandler(),
    new SearchTaskHandler(),
    new ShowTaskHandler(),
    new GraphTaskHandler(),
    new DepsTaskHandler(),
    new BatchHandler(),
    new MergeTaskHandler(),
    
    // Metadata handlers
    new GetMetadataHandler(),
    new SetMetadataHandler(),
    new RemoveMetadataHandler(),
    new AppendMetadataHandler()
  ];
  
  // Register each handler
  for (const handler of handlers) {
    commandRegistry.register(handler);
  }
}

/**
 * Initialize the command registry
 */
export function initCommandRegistry(): void {
  registerAllCommandHandlers();
}