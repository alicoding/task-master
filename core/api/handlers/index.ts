/**
 * Command handlers index file
 * Exports all command handlers and a function to register them
 */

// Re-export all handlers
export * from './task-add.ts';
export * from './task-update.ts';
export * from './task-remove.ts';
export * from './task-search.ts';
export * from './task-show.ts';
export * from './task-graph.ts';
export * from './task-deps.ts';
export * from './batch-handler.ts';
export * from './task-merge.ts';
export * from './task-metadata.ts';

import { commandRegistry, CommandHandler } from '../command.ts';
import { AddTaskHandler } from './task-add.ts';
import { UpdateTaskHandler } from './task-update.ts';
import { RemoveTaskHandler } from './task-remove.ts';
import { SearchTaskHandler } from './task-search.ts';
import { ShowTaskHandler } from './task-show.ts';
import { GraphTaskHandler } from './task-graph.ts';
import { DepsTaskHandler } from './task-deps.ts';
import { BatchHandler } from './batch-handler.ts';
import { MergeTaskHandler } from './task-merge.ts';
import { 
  GetMetadataHandler, 
  SetMetadataHandler, 
  RemoveMetadataHandler, 
  AppendMetadataHandler 
} from './task-metadata.ts';

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