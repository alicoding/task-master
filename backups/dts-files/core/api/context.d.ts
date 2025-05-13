/**
 * CommandContext - Unified execution context for CLI commands and API
 * Provides a consistent interface for command execution across different interfaces
 */
import { TaskRepository } from '../repo';
import { TaskGraph } from '../graph';
/**
 * Output mode for commands
 */
export declare enum OutputMode {
    Console = "console",// Standard console output for CLI
    Json = "json",// JSON output for API
    Silent = "silent"
}
/**
 * Input source for commands
 */
export declare enum InputSource {
    Cli = "cli",// Input from command line arguments
    Api = "api",// Input from API request
    Script = "script"
}
/**
 * Execution options shared across all commands
 */
export interface ExecutionOptions {
    dryRun?: boolean;
    output?: OutputMode;
    source?: InputSource;
    outputFile?: string;
    trace?: boolean;
}
/**
 * Response format for command execution
 */
export interface CommandResponse<T = any> {
    success: boolean;
    result?: T;
    error?: string;
    timestamp: string;
    command: string;
    source: InputSource;
    dryRun: boolean;
}
/**
 * Shared context for command execution
 */
export declare class CommandContext {
    private repo;
    private graph;
    private outputMode;
    private inputSource;
    private isDryRun;
    private outputFile?;
    private startTime;
    private traceEnabled;
    /**
     * Create a new command execution context
     */
    constructor(dbPath?: string, options?: ExecutionOptions);
    /**
     * Get the repository instance
     */
    getRepository(): TaskRepository;
    /**
     * Get the graph instance
     */
    getGraph(): TaskGraph;
    /**
     * Check if running in dry run mode
     */
    isDryRunMode(): boolean;
    /**
     * Get the output mode
     */
    getOutputMode(): OutputMode;
    /**
     * Get the input source
     */
    getInputSource(): InputSource;
    /**
     * Get the output file if any
     */
    getOutputFile(): string | undefined;
    /**
     * Set the output file
     */
    setOutputFile(file: string): void;
    /**
     * Close the context (database connections, etc.)
     */
    close(): void;
    /**
     * Trace debugging information if tracing is enabled
     */
    trace(message: string, data?: any): void;
    /**
     * Format a response object based on the current output mode
     */
    formatResponse<T>(command: string, success: boolean, result?: T, error?: string): CommandResponse<T>;
    /**
     * Write output to the appropriate destination
     */
    writeOutput<T>(response: CommandResponse<T>): Promise<void>;
}
