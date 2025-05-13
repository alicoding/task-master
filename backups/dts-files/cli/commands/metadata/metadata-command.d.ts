/**
 * Metadata command - CLI interface for managing task metadata
 */
import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
import { OutputFormat } from '../../../core/types';
/**
 * Handler class for metadata operations
 */
export declare class MetadataCommandHandler {
    private commandName;
    private repo;
    constructor(commandName: string, repo: TaskRepository);
    /**
     * Handle the get metadata command
     */
    handleGetMetadata(options: any, format: OutputFormat): Promise<any>;
    /**
     * Handle the set metadata command
     */
    handleSetMetadata(options: any, format: OutputFormat): Promise<any>;
    /**
     * Handle the remove metadata command
     */
    handleRemoveMetadata(options: any, format: OutputFormat): Promise<any>;
    /**
     * Handle the append metadata command
     */
    handleAppendMetadata(options: any, format: OutputFormat): Promise<any>;
}
/**
 * Create the metadata command
 */
export declare function createMetadataCommand(): Command;
