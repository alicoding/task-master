/**
 * Batch command handler
 * Executes multiple commands in a single batch
 */

import { BaseCommandHandler, CommandParams, commandRegistry } from '../command.js';
import { CommandContext, CommandResponse } from '../context.js';

/**
 * Single operation in a batch
 */
interface BatchOperation {
  command: string;
  params: CommandParams;
}

/**
 * Parameters for batch execution
 */
export interface BatchParams extends CommandParams {
  operations: BatchOperation[];
}

/**
 * Results of a batch operation
 */
interface BatchStats {
  success: number;
  failed: number;
  skipped: number;
}

/**
 * Results of batch execution
 */
interface BatchResult extends BatchStats {
  details: CommandResponse[];
}

/**
 * Batch command handler
 */
export class BatchHandler extends BaseCommandHandler<BatchParams, BatchResult> {
  constructor() {
    super('batch', 'Execute multiple commands in a batch');
  }
  
  /**
   * Validate the parameters for batch execution
   */
  validateParams(params: BatchParams): true | string {
    if (!params.operations || !Array.isArray(params.operations)) {
      return 'Operations must be an array';
    }
    
    if (params.operations.length === 0) {
      return 'Operations array cannot be empty';
    }
    
    // Validate each operation
    for (let i = 0; i < params.operations.length; i++) {
      const op = params.operations[i];
      
      if (!op.command || typeof op.command !== 'string') {
        return `Operation at index ${i} must have a command name`;
      }
      
      if (!commandRegistry.has(op.command)) {
        return `Command "${op.command}" in operation at index ${i} not found`;
      }
      
      if (!op.params || typeof op.params !== 'object') {
        return `Operation at index ${i} must have params object`;
      }
    }
    
    return true;
  }
  
  /**
   * Execute the batch command
   */
  async executeCommand(
    context: CommandContext,
    params: BatchParams
  ): Promise<BatchResult> {
    // Initialize result
    const result: BatchResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    
    // Process each operation
    for (const operation of params.operations) {
      // Get the command handler
      const handler = commandRegistry.get(operation.command);
      
      if (!handler) {
        // This shouldn't happen due to validation, but handle it anyway
        result.skipped++;
        result.details.push({
          success: false,
          error: `Command "${operation.command}" not found`,
          timestamp: new Date().toISOString(),
          command: operation.command,
          source: context.getInputSource(),
          dryRun: context.isDryRunMode()
        });
        continue;
      }
      
      try {
        // Execute the command
        const commandResult = await handler.execute(context, operation.params);
        
        // Update statistics
        if (commandResult.success) {
          result.success++;
        } else {
          result.failed++;
        }
        
        // Add to details
        result.details.push(commandResult);
      } catch (error) {
        // Handle unexpected errors
        result.failed++;
        result.details.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          command: operation.command,
          source: context.getInputSource(),
          dryRun: context.isDryRunMode()
        });
      }
    }
    
    return result;
  }
}