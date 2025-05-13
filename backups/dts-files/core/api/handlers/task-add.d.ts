/**
 * Add Task command handler
 * Creates a new task in the system with similarity checking
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
import { Task } from '../../types';
/**
 * Parameters for adding a task
 */
export interface AddTaskParams extends CommandParams {
    title: string;
    parentId?: string;
    childOf?: string;
    status?: string;
    readiness?: string;
    tags?: string[];
    metadata?: Record<string, any> | string;
    after?: string;
    force?: boolean;
    similarityThreshold?: string | number;
}
/**
 * Result of task addition
 */
export interface AddTaskResult {
    task?: Task;
    similarTasks?: Task[];
    message?: string;
    operation?: 'create' | 'update' | 'merge' | 'cancelled' | 'dry-run';
}
/**
 * Add Task command handler with similarity checking
 */
export declare class AddTaskHandler extends BaseCommandHandler<AddTaskParams, AddTaskResult> {
    constructor();
    /**
     * Validate the parameters for adding a task
     */
    validateParams(params: AddTaskParams): true | string;
    /**
     * Execute the add task command with similarity checking
     */
    executeCommand(context: CommandContext, params: AddTaskParams): Promise<AddTaskResult>;
}
