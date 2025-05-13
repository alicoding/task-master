/**
 * Batch command handler
 * Executes multiple commands in a single batch
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext, CommandResponse } from '../context';
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
export declare class BatchHandler extends BaseCommandHandler<BatchParams, BatchResult> {
    constructor();
    /**
     * Validate the parameters for batch execution
     */
    validateParams(params: BatchParams): true | string;
    /**
     * Execute the batch command
     */
    executeCommand(context: CommandContext, params: BatchParams): Promise<BatchResult>;
}
export {};
