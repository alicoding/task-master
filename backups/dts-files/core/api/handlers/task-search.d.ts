/**
 * Search Task command handler
 * Searches for tasks based on various criteria
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
import { Task } from '../../types';
/**
 * Parameters for searching tasks
 */
export interface SearchTaskParams extends CommandParams {
    query?: string;
    status?: string;
    readiness?: string;
    tags?: string[];
    tag?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    natural?: boolean;
    fuzzy?: boolean;
    limit?: number;
}
/**
 * Search result with additional metadata
 */
export interface SearchTasksResult {
    tasks: Task[];
    total: number;
    query: string | null;
    filters: Record<string, any>;
}
/**
 * Search Tasks command handler
 */
export declare class SearchTaskHandler extends BaseCommandHandler<SearchTaskParams, SearchTasksResult> {
    constructor();
    /**
     * Validate the parameters for searching tasks
     */
    validateParams(params: SearchTaskParams): true | string;
    /**
     * Execute the search tasks command
     */
    executeCommand(context: CommandContext, params: SearchTaskParams): Promise<SearchTasksResult>;
}
