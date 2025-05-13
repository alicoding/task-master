/**
 * Graph Task command handler
 * Visualizes task hierarchy in various formats
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
/**
 * Parameters for graph visualization
 */
export interface GraphTaskParams extends CommandParams {
    format?: string;
    textStyle?: string;
    jsonStyle?: string;
    showMetadata?: boolean;
    useColor?: boolean;
    filter?: string[];
    status?: string;
    readiness?: string;
    rootId?: string;
}
/**
 * Graph Task command handler
 */
export declare class GraphTaskHandler extends BaseCommandHandler<GraphTaskParams, string | object> {
    constructor();
    /**
     * Validate the parameters for graph visualization
     */
    validateParams(params: GraphTaskParams): true | string;
    /**
     * Execute the graph visualization command
     */
    executeCommand(context: CommandContext, params: GraphTaskParams): Promise<string | object>;
    /**
     * Filter tasks based on specified criteria
     */
    private filterTasks;
}
