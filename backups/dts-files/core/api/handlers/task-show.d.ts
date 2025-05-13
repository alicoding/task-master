/**
 * Show Task command handler
 * Retrieves a task or list of tasks with flexible formatting
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
import { Task, TaskWithChildren } from '../../types';
/**
 * Parameters for showing tasks
 */
export interface ShowTaskParams extends CommandParams {
    id?: string;
    format?: string;
    includeChildren?: boolean;
    includeParents?: boolean;
    includeMetadata?: boolean;
}
/**
 * Show task result - can be a single task, list, or hierarchical structure
 */
export type ShowTaskResult = Task | TaskWithChildren | Task[] | TaskWithChildren[] | {
    task: Task;
    children: Task[];
    parents: Task[];
};
/**
 * Show Task command handler
 */
export declare class ShowTaskHandler extends BaseCommandHandler<ShowTaskParams, ShowTaskResult> {
    constructor();
    /**
     * Execute the show task command
     */
    executeCommand(context: CommandContext, params: ShowTaskParams): Promise<ShowTaskResult>;
}
