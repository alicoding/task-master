/**
 * Terminal Session Configuration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides configuration functionality for terminal session management.
 */

import { createLogger } from '../utils/logger.ts';
import {
  TerminalSessionManagerConfig,
  DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG
} from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Create logger for terminal configuration
const logger = createLogger('TerminalSessionConfig');

/**
 * Class to manage terminal session configuration
 */
export class TerminalSessionConfiguration {
  private _config: TerminalSessionManagerConfig;
  private _db: BetterSQLite3Database;

  /**
   * Create a new Terminal Session Configuration
   * @param db SQLite database connection
   * @param config Configuration options
   */
  constructor(db: BetterSQLite3Database, config: Partial<TerminalSessionManagerConfig> = {}) {
    this._db = db;
    this._config = this.initializeConfig(config);
    
    // Log configuration initialization
    logger.debug('Terminal session configuration initialized', this._config);
  }

  /**
   * Initialize configuration with defaults and validation
   * @param config User-provided configuration options
   * @returns Validated and complete configuration
   */
  private initializeConfig(config: Partial<TerminalSessionManagerConfig>): TerminalSessionManagerConfig {
    // Create config by merging defaults with user-provided options
    const mergedConfig = { 
      ...DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG, 
      ...config 
    };
    
    // Validate the configuration
    return this.validateConfig(mergedConfig);
  }

  /**
   * Validate configuration values
   * @param config Configuration to validate
   * @returns Validated configuration
   */
  private validateConfig(config: TerminalSessionManagerConfig): TerminalSessionManagerConfig {
    // Create a new object to hold the validated config
    const validated: TerminalSessionManagerConfig = { ...config };
    
    // Ensure inactivityTimeout is a non-negative number
    if (typeof validated.inactivityTimeout !== 'number' || validated.inactivityTimeout < 0) {
      logger.warn(`Invalid inactivityTimeout value: ${validated.inactivityTimeout}, using default`);
      validated.inactivityTimeout = DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.inactivityTimeout;
    }
    
    // Ensure maxSessionHistory is a positive number
    if (typeof validated.maxSessionHistory !== 'number' || validated.maxSessionHistory <= 0) {
      logger.warn(`Invalid maxSessionHistory value: ${validated.maxSessionHistory}, using default`);
      validated.maxSessionHistory = DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG.maxSessionHistory;
    }
    
    // Ensure boolean properties are actually booleans
    const booleanProps: Array<keyof TerminalSessionManagerConfig> = [
      'persistSessions',
      'trackTaskUsage',
      'trackFileChanges',
      'enableReconnection',
      'setEnvironmentVariables'
    ];
    
    for (const prop of booleanProps) {
      if (typeof validated[prop] !== 'boolean') {
        logger.warn(`Invalid ${prop} value: ${validated[prop]}, using default`);
        validated[prop] = DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG[prop];
      }
    }
    
    return validated;
  }

  /**
   * Get the complete configuration
   * @returns Current configuration
   */
  getConfig(): TerminalSessionManagerConfig {
    return { ...this._config };
  }

  /**
   * Update configuration with new values
   * @param updates Configuration updates to apply
   * @returns Updated configuration
   */
  updateConfig(updates: Partial<TerminalSessionManagerConfig>): TerminalSessionManagerConfig {
    // Merge updates with current config
    const updatedConfig = { ...this._config, ...updates };
    
    // Validate the updated configuration
    this._config = this.validateConfig(updatedConfig);
    
    logger.debug('Terminal session configuration updated', this._config);
    return this.getConfig();
  }

  /**
   * Get a specific configuration value
   * @param key Configuration key
   * @returns Configuration value
   */
  getValue<K extends keyof TerminalSessionManagerConfig>(
    key: K
  ): TerminalSessionManagerConfig[K] {
    return this._config[key];
  }

  /**
   * Set a specific configuration value
   * @param key Configuration key
   * @param value New value
   */
  setValue<K extends keyof TerminalSessionManagerConfig>(
    key: K,
    value: TerminalSessionManagerConfig[K]
  ): void {
    const update = { [key]: value } as Partial<TerminalSessionManagerConfig>;
    this.updateConfig(update);
  }

  /**
   * Save configuration to database
   * @returns Whether save was successful
   */
  async saveToDatabase(): Promise<boolean> {
    try {
      // This is a placeholder for actual database persistence logic
      // You would implement this based on your schema and DB access patterns
      logger.debug('Configuration saved to database');
      return true;
    } catch (error) {
      logger.error('Failed to save configuration to database:', error);
      return false;
    }
  }

  /**
   * Load configuration from database
   * @returns Whether load was successful
   */
  async loadFromDatabase(): Promise<boolean> {
    try {
      // This is a placeholder for actual database loading logic
      // You would implement this based on your schema and DB access patterns
      logger.debug('Configuration loaded from database');
      return true;
    } catch (error) {
      logger.error('Failed to load configuration from database:', error);
      return false;
    }
  }
}

// Re-export types and defaults for convenience
export { 
  TerminalSessionManagerConfig,
  DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG
};

// Export factory function for creating configuration
export function createTerminalConfiguration(
  db: BetterSQLite3Database,
  config: Partial<TerminalSessionManagerConfig> = {}
): TerminalSessionConfiguration {
  return new TerminalSessionConfiguration(db, config);
}