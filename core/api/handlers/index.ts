/**
 * Command handlers index file
 * Exports all command handlers and a function to register them
 */

// Re-export all handlers
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

import { commandRegistry, CommandHandler } from '../command';
import { AddTaskHandler } from './task-add';
import { UpdateTaskHandler } from './task-update';
import { RemoveTaskHandler } from './task-remove';
import { SearchTaskHandler } from './task-search';
import { ShowTaskHandler } from './task-show';
import { GraphTaskHandler } from './task-graph';
import { DepsTaskHandler } from './task-deps';
import { BatchHandler } from './batch-handler';
import { MergeTaskHandler } from './task-merge';
import { 
  GetMetadataHandler, 
  SetMetadataHandler, 
  RemoveMetadataHandler, 
  AppendMetadataHandler 
} from './task-metadata';

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