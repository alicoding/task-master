/**
 * Command handlers index file
 * Exports all command handlers and a function to register them
 */

// Re-export all handlers
export * from '@/core/api/handlers/task-add';
export * from '@/core/api/handlers/task-update';
export * from '@/core/api/handlers/task-remove';
export * from '@/core/api/handlers/task-search';
export * from '@/core/api/handlers/task-show';
export * from '@/core/api/handlers/task-graph';
export * from '@/core/api/handlers/task-deps';
export * from '@/core/api/handlers/batch-handler';
export * from '@/core/api/handlers/task-merge';
export * from '@/core/api/handlers/task-metadata';

import { commandRegistry, CommandHandler } from '@/core/api/command';
import { AddTaskHandler } from '@/core/api/handlers/task-add';
import { UpdateTaskHandler } from '@/core/api/handlers/task-update';
import { RemoveTaskHandler } from '@/core/api/handlers/task-remove';
import { SearchTaskHandler } from '@/core/api/handlers/task-search';
import { ShowTaskHandler } from '@/core/api/handlers/task-show';
import { GraphTaskHandler } from '@/core/api/handlers/task-graph';
import { DepsTaskHandler } from '@/core/api/handlers/task-deps';
import { BatchHandler } from '@/core/api/handlers/batch-handler';
import { MergeTaskHandler } from '@/core/api/handlers/task-merge';
import { 
  GetMetadataHandler, 
  SetMetadataHandler, 
  RemoveMetadataHandler, 
  AppendMetadataHandler 
} from '@/core/api/handlers/task-metadata';

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