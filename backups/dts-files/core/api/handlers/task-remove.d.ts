/**
 * Remove Task command handler
 * Deletes a task from the system
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
/**
 * Parameters for removing a task
 */
export interface RemoveTaskParams extends CommandParams {
    id: string;
    force?: boolean;
}
/**
 * Remove task result
 */
export interface RemoveTaskResult {
    id: string;
    success: boolean;
    message: string;
    childrenRemoved?: number;
}
/**
 * Remove Task command handler
 */
export declare class RemoveTaskHandler extends BaseCommandHandler<RemoveTaskParams, RemoveTaskResult> {
    constructor();
    /**
     * Validate the parameters for removing a task
     */
    validateParams(params: RemoveTaskParams): true | string;
    /**
     * Execute the remove task command
     */
    executeCommand(context: CommandContext, params: RemoveTaskParams): Promise<RemoveTaskResult>;
}
