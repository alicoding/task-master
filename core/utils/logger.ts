/**
 * Logger utility for Task Master
 * Provides standardized logging functions with consistent formatting
 */

import chalk from 'chalk';

/**
 * Log level enum
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4  // Used to disable logging
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
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  useColors: true,
  includeTimestamps: true,
  includeLevel: true,
  includeContext: true
};

/**
 * Global logger configuration
 */
let globalConfig: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Set global logger configuration
 * @param config Logger configuration
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Reset logger configuration to defaults
 */
export function resetLoggerConfig(): void {
  globalConfig = { ...DEFAULT_CONFIG };
}

/**
 * Get the current logger configuration
 * @returns Current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...globalConfig };
}

/**
 * Format a log message with standard formatting
 * @param level Log level
 * @param message Message to log
 * @param context Optional context information
 * @returns Formatted log message
 */
function formatLogMessage(level: LogLevel, message: string, context?: string): string {
  const parts: string[] = [];
  
  // Add timestamp if enabled
  if (globalConfig.includeTimestamps) {
    const timestamp = new Date().toISOString();
    parts.push(globalConfig.useColors ? chalk.gray(timestamp) : timestamp);
  }
  
  // Add log level if enabled
  if (globalConfig.includeLevel) {
    let levelText = '';
    
    switch (level) {
      case LogLevel.DEBUG:
        levelText = globalConfig.useColors ? chalk.blue('DEBUG') : 'DEBUG';
        break;
      case LogLevel.INFO:
        levelText = globalConfig.useColors ? chalk.green('INFO') : 'INFO';
        break;
      case LogLevel.WARN:
        levelText = globalConfig.useColors ? chalk.yellow('WARN') : 'WARN';
        break;
      case LogLevel.ERROR:
        levelText = globalConfig.useColors ? chalk.red('ERROR') : 'ERROR';
        break;
    }
    
    parts.push(levelText);
  }
  
  // Add context if provided and enabled
  if (context && globalConfig.includeContext) {
    const contextText = `[${context}]`;
    parts.push(globalConfig.useColors ? chalk.cyan(contextText) : contextText);
  }
  
  // Add message with color based on level
  let coloredMessage = message;
  
  if (globalConfig.useColors) {
    switch (level) {
      case LogLevel.DEBUG:
        coloredMessage = message; // No color for debug
        break;
      case LogLevel.INFO:
        coloredMessage = message; // No color for info
        break;
      case LogLevel.WARN:
        coloredMessage = chalk.yellow(message);
        break;
      case LogLevel.ERROR:
        coloredMessage = chalk.red(message);
        break;
    }
  }
  
  parts.push(coloredMessage);
  
  // Join all parts with a separator
  return parts.join(' ');
}

/**
 * Logger class for consistent logging
 */
export class Logger {
  private context: string;
  private config: LoggerConfig;
  
  /**
   * Create a new logger
   * @param context Logger context (typically module name)
   * @param config Optional logger configuration override
   */
  constructor(context: string, config?: Partial<LoggerConfig>) {
    this.context = context;
    this.config = config ? { ...globalConfig, ...config } : { ...globalConfig };
  }
  
  /**
   * Log a debug message
   * @param message Message to log
   * @param metadata Optional metadata to include
   */
  public debug(message: string, metadata?: any): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const formattedMsg = formatLogMessage(LogLevel.DEBUG, message, this.context);
      console.log(formattedMsg);
      
      if (metadata) {
        console.log(this.config.useColors ? chalk.gray(JSON.stringify(metadata, null, 2)) : JSON.stringify(metadata, null, 2));
      }
    }
  }
  
  /**
   * Log an info message
   * @param message Message to log
   * @param metadata Optional metadata to include
   */
  public info(message: string, metadata?: any): void {
    if (this.config.level <= LogLevel.INFO) {
      const formattedMsg = formatLogMessage(LogLevel.INFO, message, this.context);
      console.log(formattedMsg);
      
      if (metadata) {
        console.log(this.config.useColors ? chalk.gray(JSON.stringify(metadata, null, 2)) : JSON.stringify(metadata, null, 2));
      }
    }
  }
  
  /**
   * Log a warning message
   * @param message Message to log
   * @param metadata Optional metadata to include
   */
  public warn(message: string, metadata?: any): void {
    if (this.config.level <= LogLevel.WARN) {
      const formattedMsg = formatLogMessage(LogLevel.WARN, message, this.context);
      console.warn(formattedMsg);
      
      if (metadata) {
        console.warn(this.config.useColors ? chalk.yellow(JSON.stringify(metadata, null, 2)) : JSON.stringify(metadata, null, 2));
      }
    }
  }
  
  /**
   * Log an error message
   * @param message Message to log
   * @param error Optional error object to include
   * @param metadata Optional metadata to include
   */
  public error(message: string, error?: unknown, metadata?: any): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formattedMsg = formatLogMessage(LogLevel.ERROR, message, this.context);
      console.error(formattedMsg);
      
      if (error) {
        const errorMessage = error instanceof Error ? 
          `${error.name}: ${error.message}\n${error.stack || ''}` : 
          String(error);
        
        console.error(this.config.useColors ? chalk.red(errorMessage) : errorMessage);
      }
      
      if (metadata) {
        console.error(this.config.useColors ? chalk.gray(JSON.stringify(metadata, null, 2)) : JSON.stringify(metadata, null, 2));
      }
    }
  }
  
  /**
   * Create a child logger with a modified context
   * @param childContext Additional context to append
   * @returns A new logger with the combined context
   */
  public child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`, this.config);
  }
}

/**
 * Create a logger with the specified context
 * @param context Logger context (typically module name)
 * @param config Optional logger configuration override
 * @returns A configured logger instance
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(context, config);
}

/**
 * Default root logger
 */
export const logger = new Logger('TaskMaster');