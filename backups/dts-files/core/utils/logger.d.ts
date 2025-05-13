/**
 * Logger utility for Task Master
 * Provides standardized logging functions with consistent formatting
 */
/**
 * Log level enum
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
/**
 * Logger configuration
 */
export interface LoggerConfig {
    /**
     * Minimum log level to display
     */
    level: LogLevel;
    /**
     * Whether to use colors in logs
     */
    useColors: boolean;
    /**
     * Whether to include timestamps in logs
     */
    includeTimestamps: boolean;
    /**
     * Whether to include log level in message
     */
    includeLevel: boolean;
    /**
     * Whether to include context information in logs
     */
    includeContext: boolean;
}
/**
 * Set global logger configuration
 * @param config Logger configuration
 */
export declare function configureLogger(config: Partial<LoggerConfig>): void;
/**
 * Reset logger configuration to defaults
 */
export declare function resetLoggerConfig(): void;
/**
 * Get the current logger configuration
 * @returns Current logger configuration
 */
export declare function getLoggerConfig(): LoggerConfig;
/**
 * Logger class for consistent logging
 */
export declare class Logger {
    private context;
    private config;
    /**
     * Create a new logger
     * @param context Logger context (typically module name)
     * @param config Optional logger configuration override
     */
    constructor(context: string, config?: Partial<LoggerConfig>);
    /**
     * Log a debug message
     * @param message Message to log
     * @param metadata Optional metadata to include
     */
    debug(message: string, metadata?: any): void;
    /**
     * Log an info message
     * @param message Message to log
     * @param metadata Optional metadata to include
     */
    info(message: string, metadata?: any): void;
    /**
     * Log a warning message
     * @param message Message to log
     * @param metadata Optional metadata to include
     */
    warn(message: string, metadata?: any): void;
    /**
     * Log an error message
     * @param message Message to log
     * @param error Optional error object to include
     * @param metadata Optional metadata to include
     */
    error(message: string, error?: unknown, metadata?: any): void;
    /**
     * Create a child logger with a modified context
     * @param childContext Additional context to append
     * @returns A new logger with the combined context
     */
    child(childContext: string): Logger;
}
/**
 * Create a logger with the specified context
 * @param context Logger context (typically module name)
 * @param config Optional logger configuration override
 * @returns A configured logger instance
 */
export declare function createLogger(context: string, config?: Partial<LoggerConfig>): Logger;
/**
 * Default root logger
 */
export declare const logger: Logger;
