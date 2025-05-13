/**
 * Task Metadata command handlers
 * Manage metadata fields on tasks
 */
import { BaseCommandHandler, CommandParams } from '../command';
import { CommandContext } from '../context';
import { Task } from '../../types';
/**
 * Base parameters for metadata operations
 */
export interface MetadataBaseParams extends CommandParams {
    id: string;
    field?: string;
}
/**
 * Parameters for getting metadata
 */
export interface GetMetadataParams extends MetadataBaseParams {
}
/**
 * Parameters for setting/appending metadata
 */
export interface SetMetadataParams extends MetadataBaseParams {
    field: string;
    value: any;
}
/**
 * Parameters for removing metadata
 */
export interface RemoveMetadataParams extends MetadataBaseParams {
    field: string;
}
/**
 * Metadata operation types
 */
export type MetadataOperation = 'get' | 'set' | 'remove' | 'append';
/**
 * Result of metadata operations
 */
export interface MetadataResult {
    task: Task;
    field?: string;
    value?: any;
    metadata: any;
    operation: MetadataOperation;
}
/**
 * Get Metadata command handler
 */
export declare class GetMetadataHandler extends BaseCommandHandler<GetMetadataParams, MetadataResult> {
    constructor();
    /**
     * Validate the parameters
     */
    validateParams(params: GetMetadataParams): true | string;
    /**
     * Execute the get metadata command
     */
    executeCommand(context: CommandContext, params: GetMetadataParams): Promise<MetadataResult>;
}
/**
 * Set Metadata command handler
 */
export declare class SetMetadataHandler extends BaseCommandHandler<SetMetadataParams, MetadataResult> {
    constructor();
    /**
     * Validate the parameters
     */
    validateParams(params: SetMetadataParams): true | string;
    /**
     * Execute the set metadata command
     */
    executeCommand(context: CommandContext, params: SetMetadataParams): Promise<MetadataResult>;
}
/**
 * Remove Metadata command handler
 */
export declare class RemoveMetadataHandler extends BaseCommandHandler<RemoveMetadataParams, MetadataResult> {
    constructor();
    /**
     * Validate the parameters
     */
    validateParams(params: RemoveMetadataParams): true | string;
    /**
     * Execute the remove metadata command
     */
    executeCommand(context: CommandContext, params: RemoveMetadataParams): Promise<MetadataResult>;
}
/**
 * Append to Metadata command handler
 */
export declare class AppendMetadataHandler extends BaseCommandHandler<SetMetadataParams, MetadataResult> {
    constructor();
    /**
     * Validate the parameters
     */
    validateParams(params: SetMetadataParams): true | string;
    /**
     * Execute the append metadata command
     */
    executeCommand(context: CommandContext, params: SetMetadataParams): Promise<MetadataResult>;
}
