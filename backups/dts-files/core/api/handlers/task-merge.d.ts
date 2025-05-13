/**
 * Task Merge command handler
 * Merges two tasks together
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
import { Task } from '../../types';
/**
 * Parameters for merging a task
 */
export interface MergeTaskParams extends CommandParams {
    targetId: string;
    sourceId?: string;
    sourceTitle?: string;
    combineTags?: boolean;
    combineMetadata?: boolean;
    status?: string;
    readiness?: string;
    tags?: string[];
    metadata?: Record<string, any> | string;
}
/**
 * Result of task merge
 */
export interface MergeTaskResult {
    task: Task;
    mergedFrom?: Task;
    message: string;
}
/**
 * Merge Task command handler
 */
export declare class MergeTaskHandler extends BaseCommandHandler<MergeTaskParams, MergeTaskResult> {
    constructor();
    /**
     * Validate the parameters for merging tasks
     */
    validateParams(params: MergeTaskParams): true | string;
    /**
     * Execute the merge task command
     */
    executeCommand(context: CommandContext, params: MergeTaskParams): Promise<MergeTaskResult>;
}
