/**
 * Command abstraction - Base classes for unified command handling
 * Provides a standard interface for executing commands via CLI or API
 */
import { CommandContext, CommandResponse, ExecutionOptions } from './context';
/**
 * Base interface for command parameters
 */
export interface CommandParams {
    [key: string]: any;
}
/**
 * Base interface for command handlers
 */
export interface CommandHandler<TParams extends CommandParams = CommandParams, TResult = any> {
    /**
     * Name of the command
     */
    readonly name: string;
    /**
     * Description of the command
     */
    readonly description: string;
    /**
     * Execute the command
     */
    execute(context: CommandContext, params: TParams): Promise<CommandResponse<TResult>>;
    /**
     * Validate the parameters for the command
     * Returns true if valid, or a string with error message if invalid
     */
    validateParams(params: TParams): true | string;
}
/**
 * Base class for implementing command handlers
 */
export declare abstract class BaseCommandHandler<TParams extends CommandParams = CommandParams, TResult = any> implements CommandHandler<TParams, TResult> {
    readonly name: string;
    readonly description: string;
    constructor(name: string, description: string);
    /**
     * Execute the command with standard error handling and response formatting
     */
    execute(context: CommandContext, params: TParams): Promise<CommandResponse<TResult>>;
    /**
     * Default parameter validation (override for specific validation)
     */
    validateParams(params: TParams): true | string;
    /**
     * Command implementation (to be implemented by concrete classes)
     */
    abstract executeCommand(context: CommandContext, params: TParams): Promise<TResult>;
}
/**
 * Registry for command handlers
 */
export declare class CommandRegistry {
    private handlers;
    /**
     * Register a command handler
     */
    register(handler: CommandHandler): void;
    /**
     * Get a command handler by name
     */
    get(name: string): CommandHandler | undefined;
    /**
     * Check if a command exists
     */
    has(name: string): boolean;
    /**
     * Get all registered command names
     */
    getCommandNames(): string[];
    /**
     * Get all registered command handlers
     */
    getAllHandlers(): CommandHandler[];
    /**
     * Execute a command by name
     */
    executeCommand(name: string, params: CommandParams, contextOptions?: ExecutionOptions): Promise<CommandResponse>;
}
/**
 * Global command registry instance
 */
export declare const commandRegistry: CommandRegistry;
