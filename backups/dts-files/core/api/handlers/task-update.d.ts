/**
 * Update Task command handler
 * Updates an existing task in the system
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
import { Task } from '../../types';
/**
 * Parameters for updating a task
 */
export interface UpdateTaskParams extends CommandParams {
    id: string;
    title?: string;
    parentId?: string;
    status?: string;
    readiness?: string;
    tags?: string[];
    metadata?: Record<string, any> | string;
}
/**
 * Update Task command handler
 */
export declare class UpdateTaskHandler extends BaseCommandHandler<UpdateTaskParams, Task> {
    constructor();
    /**
     * Validate the parameters for updating a task
     */
    validateParams(params: UpdateTaskParams): true | string;
    /**
     * Execute the update task command
     */
    executeCommand(context: CommandContext, params: UpdateTaskParams): Promise<Task>;
}
