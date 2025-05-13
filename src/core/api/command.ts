/**
 * Command abstraction - Base classes for unified command handling
 * Provides a standard interface for executing commands via CLI or API
 */

import { CommandContext, CommandResponse, ExecutionOptions } from '@/core/api/context';

/**
 * Base interface for command parameters
 */
export interface CommandParams {
  [key: string]: any;
}

/**
 * Base interface for command handlers
 */
export interface CommandHandler<
  TParams extends CommandParams = CommandParams,
  TResult = any
> {
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
  execute(
    context: CommandContext,
    params: TParams
  ): Promise<CommandResponse<TResult>>;
  
  /**
   * Validate the parameters for the command
   * Returns true if valid, or a string with error message if invalid
   */
  validateParams(params: TParams): true | string;
}

/**
 * Base class for implementing command handlers
 */
export abstract class BaseCommandHandler<
  TParams extends CommandParams = CommandParams,
  TResult = any
> implements CommandHandler<TParams, TResult> {
  readonly name: string;
  readonly description: string;
  
  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }
  
  /**
   * Execute the command with standard error handling and response formatting
   */
  async execute(
    context: CommandContext,
    params: TParams
  ): Promise<CommandResponse<TResult>> {
    try {
      // Validate parameters
      const validationResult = this.validateParams(params);
      if (validationResult !== true) {
        return context.formatResponse<TResult>(
          this.name, 
          false, 
          undefined, 
          `Invalid parameters: ${validationResult}`
        );
      }
      
      // Trace command execution
      context.trace(`Executing command: ${this.name}`, { params });

      // Execute the command implementation
      const result = await this.executeCommand(context, params);
      
      // Format the response
      return context.formatResponse<TResult>(
        this.name, 
        true, 
        result
      );
    } catch (error) {
      // Handle any errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      context.trace(`Error executing command: ${this.name}`, { error });
      
      return context.formatResponse<TResult>(
        this.name, 
        false, 
        undefined, 
        errorMessage
      );
    }
  }
  
  /**
   * Default parameter validation (override for specific validation)
   */
  validateParams(params: TParams): true | string {
    return true;
  }
  
  /**
   * Command implementation (to be implemented by concrete classes)
   */
  abstract executeCommand(
    context: CommandContext,
    params: TParams
  ): Promise<TResult>;
}

/**
 * Registry for command handlers
 */
export class CommandRegistry {
  private handlers: Map<string, CommandHandler> = new Map();
  
  /**
   * Register a command handler
   */
  register(handler: CommandHandler): void {
    if (this.handlers.has(handler.name)) {
      throw new Error(`Command "${handler.name}" is already registered`);
    }
    
    this.handlers.set(handler.name, handler);
  }
  
  /**
   * Get a command handler by name
   */
  get(name: string): CommandHandler | undefined {
    return this.handlers.get(name);
  }
  
  /**
   * Check if a command exists
   */
  has(name: string): boolean {
    return this.handlers.has(name);
  }
  
  /**
   * Get all registered command names
   */
  getCommandNames(): string[] {
    return Array.from(this.handlers.keys());
  }
  
  /**
   * Get all registered command handlers
   */
  getAllHandlers(): CommandHandler[] {
    return Array.from(this.handlers.values());
  }
  
  /**
   * Execute a command by name
   */
  async executeCommand(
    name: string,
    params: CommandParams,
    contextOptions: ExecutionOptions = {}
  ): Promise<CommandResponse> {
    const handler = this.handlers.get(name);
    
    if (!handler) {
      throw new Error(`Command "${name}" not found`);
    }
    
    const context = new CommandContext('./db/taskmaster.db', contextOptions);
    
    try {
      const result = await handler.execute(context, params);
      return result;
    } finally {
      context.close();
    }
  }
}

/**
 * Global command registry instance
 */
export const commandRegistry = new CommandRegistry();