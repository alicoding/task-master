/**
 * Add command - CLI command for adding tasks
 * Provides a CLI interface for the add task command handler
 */
import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
/**
 * Core add command functionality
 */
export declare class AddCommandHandler {
    private repo;
    private ui;
    constructor(repo: TaskRepository, useColors?: boolean);
    /**
     * Handle the add command action with NLP similarity detection
     */
    handleAddCommand(options: any): Promise<any>;
}
/**
 * Create the add command for the CLI
 */
export declare function createAddCommand(): Command;
