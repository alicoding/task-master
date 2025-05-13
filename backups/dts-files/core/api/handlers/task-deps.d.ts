/**
 * Dependencies Task command handler
 * Visualizes task dependencies in various formats
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
/**
 * Parameters for dependency visualization
 */
export interface DepsTaskParams extends CommandParams {
    id?: string;
    depth?: number;
    direction?: string;
    format?: string;
    textStyle?: string;
    jsonStyle?: string;
    showMetadata?: boolean;
    useColor?: boolean;
}
/**
 * Dependencies Task command handler
 */
export declare class DepsTaskHandler extends BaseCommandHandler<DepsTaskParams, string | object> {
    constructor();
    /**
     * Validate the parameters for dependency visualization
     */
    validateParams(params: DepsTaskParams): true | string;
    /**
     * Execute the dependency visualization command
     */
    executeCommand(context: CommandContext, params: DepsTaskParams): Promise<string | object>;
    /**
     * Get a task and all its descendants (child tasks)
     */
    private getTaskWithDescendants;
    /**
     * Get the parent tree for a task
     */
    private getParentTree;
    /**
     * Limit the hierarchy to a specified depth
     */
    private limitHierarchyDepth;
}
