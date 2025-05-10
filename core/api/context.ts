/**
 * CommandContext - Unified execution context for CLI commands and API
 * Provides a consistent interface for command execution across different interfaces
 */

import { TaskRepository } from '../repo.js';
import { TaskGraph } from '../graph.js';

/**
 * Output mode for commands
 */
export enum OutputMode {
  Console = 'console', // Standard console output for CLI
  Json = 'json',       // JSON output for API
  Silent = 'silent'    // No output (for testing or when output is handled elsewhere)
}

/**
 * Input source for commands
 */
export enum InputSource {
  Cli = 'cli',     // Input from command line arguments
  Api = 'api',     // Input from API request
  Script = 'script' // Input from programmatic usage
}

/**
 * Execution options shared across all commands
 */
export interface ExecutionOptions {
  dryRun?: boolean;        // Simulate without making changes
  output?: OutputMode;     // Output mode
  source?: InputSource;    // Source of the command
  outputFile?: string;     // File to write output to (if any)
  trace?: boolean;         // Enable tracing for debugging
}

/**
 * Response format for command execution
 */
export interface CommandResponse<T = any> {
  success: boolean;        // Whether the command succeeded
  result?: T;              // Command result data
  error?: string;          // Error message if any
  timestamp: string;       // When the command was executed
  command: string;         // Command name that was executed
  source: InputSource;     // Where the command came from
  dryRun: boolean;         // Whether this was a dry run
}

/**
 * Shared context for command execution
 */
export class CommandContext {
  private repo: TaskRepository;
  private graph: TaskGraph;
  private outputMode: OutputMode;
  private inputSource: InputSource;
  private isDryRun: boolean;
  private outputFile?: string;
  private startTime: number;
  private traceEnabled: boolean;

  /**
   * Create a new command execution context
   */
  constructor(
    dbPath: string = './db/taskmaster.db', 
    options: ExecutionOptions = {}
  ) {
    this.repo = new TaskRepository(dbPath);
    this.graph = new TaskGraph(this.repo);
    this.outputMode = options.output || OutputMode.Console;
    this.inputSource = options.source || InputSource.Cli;
    this.isDryRun = options.dryRun || false;
    this.outputFile = options.outputFile;
    this.traceEnabled = options.trace || false;
    this.startTime = Date.now();
  }

  /**
   * Get the repository instance
   */
  getRepository(): TaskRepository {
    return this.repo;
  }

  /**
   * Get the graph instance
   */
  getGraph(): TaskGraph {
    return this.graph;
  }

  /**
   * Check if running in dry run mode
   */
  isDryRunMode(): boolean {
    return this.isDryRun;
  }

  /**
   * Get the output mode
   */
  getOutputMode(): OutputMode {
    return this.outputMode;
  }

  /**
   * Get the input source
   */
  getInputSource(): InputSource {
    return this.inputSource;
  }

  /**
   * Get the output file if any
   */
  getOutputFile(): string | undefined {
    return this.outputFile;
  }

  /**
   * Set the output file
   */
  setOutputFile(file: string): void {
    this.outputFile = file;
  }

  /**
   * Close the context (database connections, etc.)
   */
  close(): void {
    this.repo.close();
  }

  /**
   * Trace debugging information if tracing is enabled
   */
  trace(message: string, data?: any): void {
    if (!this.traceEnabled) return;
    
    const traceObj = {
      time: new Date().toISOString(),
      elapsed: `${Date.now() - this.startTime}ms`,
      message,
      data
    };
    
    console.error('[TRACE]', JSON.stringify(traceObj));
  }
  
  /**
   * Format a response object based on the current output mode
   */
  formatResponse<T>(
    command: string, 
    success: boolean, 
    result?: T, 
    error?: string
  ): CommandResponse<T> {
    return {
      success,
      result,
      error,
      timestamp: new Date().toISOString(),
      command,
      source: this.inputSource,
      dryRun: this.isDryRun
    };
  }
  
  /**
   * Write output to the appropriate destination
   */
  async writeOutput<T>(response: CommandResponse<T>): Promise<void> {
    // Check if output should be written to a file
    if (this.outputFile) {
      const fs = await import('fs/promises');
      await fs.writeFile(
        this.outputFile, 
        JSON.stringify(response, null, 2), 
        'utf-8'
      );
      
      // If we're in console mode, also print a confirmation to the console
      if (this.outputMode === OutputMode.Console) {
        console.log(`Output saved to ${this.outputFile}`);
      }
      return;
    }
    
    // Otherwise, output based on the mode
    switch (this.outputMode) {
      case OutputMode.Json:
        // Output JSON for API or programmatic use
        console.log(JSON.stringify(response, null, 2));
        break;
        
      case OutputMode.Console:
        // Human-readable output for CLI use
        if (!response.success) {
          console.error(`Error: ${response.error}`);
        } else if (response.result !== undefined) {
          // If result is a string, print directly
          if (typeof response.result === 'string') {
            console.log(response.result);
          } 
          // If result is an array, make it more readable
          else if (Array.isArray(response.result)) {
            for (const item of response.result) {
              console.log(typeof item === 'string' ? item : JSON.stringify(item));
            }
          } 
          // Otherwise, pretty-print the JSON
          else {
            console.log(JSON.stringify(response.result, null, 2));
          }
        }
        break;
        
      case OutputMode.Silent:
        // No output
        break;
    }
  }
}