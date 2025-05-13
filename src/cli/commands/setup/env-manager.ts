/**
 * Environment Variable Manager
 * Handles loading, saving, backing up, and merging .env files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as p from '@clack/prompts';
import chalk from 'chalk';

/**
 * Interface for environment handling options
 */
export interface EnvManagerOptions {
  backupOnSave?: boolean;
  mergeStrategy?: 'overwrite' | 'keep-existing' | 'prompt';
}

/**
 * Environment Variable Manager class
 */
export class EnvManager {
  private envPath: string;
  private backupDir: string;
  private options: EnvManagerOptions;
  private envVars: Record<string, string> = {};
  
  /**
   * Create a new Environment Manager
   * 
   * @param options Configuration options
   */
  constructor(options: EnvManagerOptions = {}) {
    const projectRoot = process.cwd();
    this.envPath = path.join(projectRoot, '.env');
    this.backupDir = path.join(projectRoot, '.env-backups');
    
    // Default options
    this.options = {
      backupOnSave: true,
      mergeStrategy: 'prompt',
      ...options
    };
  }
  
  /**
   * Load environment variables from .env file
   */
  async load(): Promise<Record<string, string>> {
    try {
      // Check if .env file exists
      try {
        await fs.access(this.envPath);
        // If exists, parse it
        const envFile = await fs.readFile(this.envPath, 'utf8');
        this.envVars = dotenv.parse(envFile);
        return { ...this.envVars };
      } catch (err) {
        // File doesn't exist or isn't readable
        this.envVars = {};
        return {};
      }
    } catch (err) {
      p.log.warning('Could not load existing .env file');
      this.envVars = {};
      return {};
    }
  }
  
  /**
   * Create a backup of the .env file
   */
  async backup(): Promise<string | null> {
    try {
      // Check if .env file exists before backing up
      try {
        await fs.access(this.envPath);
        
        // Ensure backup directory exists
        try {
          await fs.access(this.backupDir);
        } catch (err) {
          await fs.mkdir(this.backupDir, { recursive: true });
        }
        
        // Create backup with timestamp
        const timestamp = Date.now();
        const backupName = `.env.backup-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        await fs.copyFile(this.envPath, backupPath);
        return backupPath;
      } catch (err) {
        // No file to backup
        return null;
      }
    } catch (err) {
      p.log.warning('Could not create backup of .env file');
      return null;
    }
  }
  
  /**
   * Save environment variables to .env file with backup
   * 
   * @param envVars Environment variables to save
   */
  async save(envVars: Record<string, string> = this.envVars): Promise<void> {
    const s = p.spinner();
    s.start('Saving configuration');
    
    try {
      // Create backup if enabled
      let backupPath: string | null = null;
      if (this.options.backupOnSave) {
        backupPath = await this.backup();
      }
      
      // Format environment variables
      const envContent = Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      // Write to .env file
      await fs.writeFile(this.envPath, envContent);
      this.envVars = { ...envVars };
      
      s.stop('Configuration saved successfully!');
      
      // If we created a backup, show the path
      if (backupPath) {
        p.log.info(`Backup created at: ${backupPath}`);
      }
    } catch (err) {
      s.stop('Failed to save configuration');
      throw new Error(`Failed to save configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  /**
   * Merge new environment variables with existing ones
   * 
   * @param newEnvVars New environment variables to merge
   * @param strategy Override merge strategy
   */
  async merge(
    newEnvVars: Record<string, string>, 
    strategy?: 'overwrite' | 'keep-existing' | 'prompt'
  ): Promise<Record<string, string>> {
    // Use provided strategy or fall back to default
    const mergeStrategy = strategy || this.options.mergeStrategy || 'prompt';
    
    // Load current environment variables if not already loaded
    if (Object.keys(this.envVars).length === 0) {
      await this.load();
    }
    
    // Create result with current values
    const result: Record<string, string> = { ...this.envVars };
    
    // Track conflicts
    const conflicts: string[] = [];
    
    // Find conflicts
    for (const [key, value] of Object.entries(newEnvVars)) {
      if (key in this.envVars && this.envVars[key] !== value) {
        conflicts.push(key);
      }
    }
    
    // Handle conflicts based on strategy
    if (conflicts.length > 0 && mergeStrategy === 'prompt') {
      p.note(
        `Found ${conflicts.length} environment variable(s) with different values:\n` +
        conflicts.map(key => ` • ${key}`).join('\n'),
        'Configuration Conflicts'
      );
      
      const resolution = await p.select({
        message: 'How would you like to resolve these conflicts?',
        options: [
          { value: 'overwrite', label: 'Use new values', hint: 'Overwrites existing values' },
          { value: 'keep-existing', label: 'Keep existing values', hint: 'Preserves your current configuration' },
          { value: 'individual', label: 'Decide for each variable', hint: 'Choose value by value' },
        ]
      });
      
      if (p.isCancel(resolution)) {
        p.cancel('Merge cancelled');
        process.exit(0);
      }
      
      if (resolution === 'individual') {
        // Handle each conflict individually
        for (const key of conflicts) {
          const existingValue = this.envVars[key];
          const newValue = newEnvVars[key];
          
          // Format display value for secrets
          const isSecret = key.includes('API_KEY') || key.includes('SECRET') || key.includes('PASSWORD');
          const displayExisting = isSecret ? '********' : existingValue;
          const displayNew = isSecret ? '********' : newValue;
          
          p.log.info(`Variable: ${chalk.blue(key)}`);
          p.log.info(`Existing: ${chalk.yellow(displayExisting)}`);
          p.log.info(`New: ${chalk.green(displayNew)}`);
          
          const choice = await p.select({
            message: `Which value would you like to use for ${key}?`,
            options: [
              { value: 'existing', label: 'Keep existing value' },
              { value: 'new', label: 'Use new value' },
            ]
          });
          
          if (p.isCancel(choice)) {
            p.cancel('Merge cancelled');
            process.exit(0);
          }
          
          if (choice === 'new') {
            result[key] = newValue;
          }
        }
      } else if (resolution === 'overwrite') {
        // Use all new values
        for (const [key, value] of Object.entries(newEnvVars)) {
          result[key] = value;
        }
      }
      // For keep-existing, we don't need to do anything as we already started with existing values
    } else if (mergeStrategy === 'overwrite') {
      // Use all new values
      for (const [key, value] of Object.entries(newEnvVars)) {
        result[key] = value;
      }
    }
    // For keep-existing strategy, we don't need to do anything
    
    // Add any new keys that weren't in conflicts
    for (const [key, value] of Object.entries(newEnvVars)) {
      if (!(key in this.envVars)) {
        result[key] = value;
      }
    }
    
    // Update internal state
    this.envVars = result;
    
    return result;
  }
  
  /**
   * List all available backups
   */
  async listBackups(): Promise<string[]> {
    try {
      try {
        await fs.access(this.backupDir);
      } catch (err) {
        // Backup directory doesn't exist yet
        return [];
      }
      
      const files = await fs.readdir(this.backupDir);
      return files
        .filter(file => file.startsWith('.env.backup-'))
        .sort()
        .reverse(); // Newest first
    } catch (err) {
      p.log.warning('Could not list backups');
      return [];
    }
  }
  
  /**
   * Restore from a backup file
   * 
   * @param backupName Name of the backup file
   */
  async restoreFromBackup(backupName: string): Promise<boolean> {
    const s = p.spinner();
    s.start(`Restoring from backup: ${backupName}`);
    
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      // Check if backup exists
      try {
        await fs.access(backupPath);
      } catch (err) {
        s.stop('Backup file not found');
        return false;
      }
      
      // Read the backup
      const backupContent = await fs.readFile(backupPath, 'utf8');
      
      // Optionally backup the current .env before restoring
      if (this.options.backupOnSave) {
        await this.backup();
      }
      
      // Write the backup to .env
      await fs.writeFile(this.envPath, backupContent);
      
      // Update our in-memory state
      this.envVars = dotenv.parse(backupContent);
      
      s.stop('Backup restored successfully!');
      return true;
    } catch (err) {
      s.stop('Failed to restore from backup');
      p.log.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }
  
  /**
   * Get a specific environment variable
   * 
   * @param key Environment variable name
   */
  get(key: string): string | undefined {
    return this.envVars[key];
  }
  
  /**
   * Set a specific environment variable
   * 
   * @param key Environment variable name
   * @param value Environment variable value
   */
  set(key: string, value: string): void {
    this.envVars[key] = value;
  }
  
  /**
   * Get all environment variables
   */
  getAll(): Record<string, string> {
    return { ...this.envVars };
  }
}