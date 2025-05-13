/**
 * Database Configuration Setup
 * Interactive wizard for configuring Task Master database settings
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EnvManager } from './env-manager';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory for the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Default database path relative to the project root
const DEFAULT_DB_PATH = path.join('db', 'taskmaster.db');

// Environment Manager instance
const envManager = new EnvManager({
  backupOnSave: true,
  mergeStrategy: 'prompt'
});

/**
 * Database configuration options
 */
interface DbConfig {
  dbPath: string;
  enableMigrations: boolean;
  enableBackups: boolean;
  backupInterval: number;
  debugSql: boolean;
}

/**
 * Get the project root directory
 */
function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Check if a file or directory exists
 */
async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get default configuration values
 */
async function getDefaultConfig(): Promise<DbConfig> {
  const projectRoot = getProjectRoot();
  
  return {
    dbPath: path.join(projectRoot, DEFAULT_DB_PATH),
    enableMigrations: true,
    enableBackups: true,
    backupInterval: 24, // hours
    debugSql: false
  };
}

/**
 * Load existing configuration
 */
async function loadConfig(): Promise<DbConfig> {
  // Load environment variables
  const env = await envManager.load();
  
  // Get default config
  const defaultConfig = await getDefaultConfig();
  
  // Override with environment variables if they exist
  return {
    dbPath: env.DB_PATH || defaultConfig.dbPath,
    enableMigrations: env.DB_ENABLE_MIGRATIONS === 'true' || defaultConfig.enableMigrations,
    enableBackups: env.DB_ENABLE_BACKUPS === 'true' || defaultConfig.enableBackups,
    backupInterval: parseInt(env.DB_BACKUP_INTERVAL || '') || defaultConfig.backupInterval,
    debugSql: env.DEBUG_SQL === 'true' || defaultConfig.debugSql
  };
}

/**
 * Save configuration to environment variables
 */
async function saveConfig(config: DbConfig): Promise<void> {
  // Prepare environment variables
  const env: Record<string, string> = {
    DB_PATH: config.dbPath,
    DB_ENABLE_MIGRATIONS: config.enableMigrations.toString(),
    DB_ENABLE_BACKUPS: config.enableBackups.toString(),
    DB_BACKUP_INTERVAL: config.backupInterval.toString(),
    DEBUG_SQL: config.debugSql.toString()
  };
  
  // Save environment variables
  await envManager.merge(env);
  await envManager.save();
}

/**
 * Test database connection and initialization
 */
async function testDbConnection(dbPath: string): Promise<boolean> {
  const s = p.spinner();
  s.start('Testing database connection and initialization');
  
  try {
    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    await fs.mkdir(dbDir, { recursive: true });
    
    // Try to write a test file to ensure we have write permissions
    const testFilePath = path.join(dbDir, '.test-write');
    await fs.writeFile(testFilePath, 'test');
    await fs.unlink(testFilePath); // Clean up
    
    s.stop('Database directory is writable');
    return true;
  } catch (error) {
    s.stop('Database directory test failed');
    p.log?.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create the database backup directory
 */
async function createBackupDir(dbPath: string): Promise<string | null> {
  try {
    const dbDir = path.dirname(dbPath);
    const backupDir = path.join(dbDir, 'backups');
    
    await fs.mkdir(backupDir, { recursive: true });
    
    return backupDir;
  } catch (error) {
    p.log?.error(`Failed to create backup directory: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Main function to set up database configuration
 */
export async function setupDbConfiguration(forceReconfigure: boolean = false): Promise<void> {
  p.note('Configure database settings for Task Master', 'Database Setup');
  
  // Load existing configuration
  const currentConfig = await loadConfig();
  
  // Configure database path
  let dbPath: string = currentConfig.dbPath;
  const defaultDbPath = (await getDefaultConfig()).dbPath;
  
  // Ask about changing DB path if it's already configured
  if (currentConfig.dbPath && !forceReconfigure) {
    p.log.info(`Current database path: ${chalk.green(currentConfig.dbPath)}`);
    
    const changeDbPath = await p.confirm({
      message: 'Do you want to change the database location?',
      initialValue: false
    });
    
    // Handle cancellation
    if (p.isCancel(changeDbPath)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }
    
    if (changeDbPath) {
      // Let the user change the DB path
      const customDbPath = await p.text({
        message: 'Enter the path to your database file:',
        placeholder: defaultDbPath,
        initialValue: currentConfig.dbPath,
        validate: (input) => {
          if (!input) return 'Database path is required';
          if (!path.isAbsolute(input) && !input.startsWith('./') && !input.startsWith('../')) {
            return 'Please enter an absolute path or a relative path starting with ./ or ../';
          }
        }
      });
      
      // Handle cancellation
      if (p.isCancel(customDbPath)) {
        p.cancel('Setup cancelled');
        process.exit(0);
      }
      
      dbPath = customDbPath;
    }
  } else {
    // Ask for DB path
    const useDefaultPath = await p.confirm({
      message: `Use the default database location (${defaultDbPath})?`,
      initialValue: true
    });
    
    // Handle cancellation
    if (p.isCancel(useDefaultPath)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }
    
    if (!useDefaultPath) {
      // Let the user specify a custom DB path
      const customDbPath = await p.text({
        message: 'Enter the path to your database file:',
        placeholder: defaultDbPath,
        validate: (input) => {
          if (!input) return 'Database path is required';
          if (!path.isAbsolute(input) && !input.startsWith('./') && !input.startsWith('../')) {
            return 'Please enter an absolute path or a relative path starting with ./ or ../';
          }
        }
      });
      
      // Handle cancellation
      if (p.isCancel(customDbPath)) {
        p.cancel('Setup cancelled');
        process.exit(0);
      }
      
      dbPath = customDbPath;
    } else {
      dbPath = defaultDbPath;
    }
  }
  
  // Test database connection
  const dbConnTest = await testDbConnection(dbPath);
  if (!dbConnTest) {
    p.note(
      'Database connection test failed. You may not have write permissions to the specified directory.',
      'Warning'
    );
    
    const continueAnyway = await p.confirm({
      message: 'Do you want to continue with the configuration anyway?',
      initialValue: false
    });
    
    // Handle cancellation
    if (p.isCancel(continueAnyway)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }
    
    if (!continueAnyway) {
      p.cancel('Database configuration cancelled');
      return;
    }
  }
  
  // Configure migrations
  // Show help message before confirm prompt
  p.log.info(chalk.gray('Automatic migrations will update your database schema when Task Master is updated with new features'));

  const enableMigrations = await p.confirm({
    message: 'Enable automatic database migrations?',
    initialValue: currentConfig.enableMigrations
  });
  
  // Handle cancellation
  if (p.isCancel(enableMigrations)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }
  
  
  // Configure backups
  // Show help message before confirm prompt
  p.log.info(chalk.gray('Automatic backups will create a copy of your database at regular intervals'));

  const enableBackups = await p.confirm({
    message: 'Enable automatic database backups?',
    initialValue: currentConfig.enableBackups
  });
  
  // Handle cancellation
  if (p.isCancel(enableBackups)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }
  
  // Configure backup interval if backups are enabled
  let backupInterval = currentConfig.backupInterval;
  if (enableBackups) {
    // Create backup directory
    const backupDir = await createBackupDir(dbPath);
    if (backupDir) {
      p.log.info(`Backup directory created: ${backupDir}`);
    }
    
    const backupIntervalInput = await p.text({
      message: 'Backup interval in hours:',
      placeholder: '24',
      initialValue: currentConfig.backupInterval.toString(),
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num <= 0) {
          return 'Please enter a positive number';
        }
      }
    });
    
    // Handle cancellation
    if (p.isCancel(backupIntervalInput)) {
      p.cancel('Setup cancelled');
      process.exit(0);
    }
    
    backupInterval = parseInt(backupIntervalInput);
  }
  
  // Configure debug mode
  // Show help message before confirm prompt
  p.log.info(chalk.gray('SQL debug logging will output all database queries to the console'));

  const debugSql = await p.confirm({
    message: 'Enable SQL debug logging?',
    initialValue: currentConfig.debugSql
  });
  
  // Handle cancellation
  if (p.isCancel(debugSql)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }
  
  // Create the final configuration
  const finalConfig: DbConfig = {
    dbPath,
    enableMigrations,
    enableBackups,
    backupInterval,
    debugSql
  };
  
  // Save the configuration
  const s = p.spinner();
  s.start('Saving database configuration');
  await saveConfig(finalConfig);
  s.stop('Database configuration saved');
  
  // Summary
  p.note(
    [
      `Database Path: ${chalk.green(finalConfig.dbPath)}`,
      `Automatic Migrations: ${finalConfig.enableMigrations ? chalk.green('Enabled') : chalk.yellow('Disabled')}`,
      `Automatic Backups: ${finalConfig.enableBackups ? chalk.green('Enabled') : chalk.yellow('Disabled')}`,
      finalConfig.enableBackups ? `Backup Interval: ${chalk.green(`${finalConfig.backupInterval} hours`)}` : '',
      `SQL Debug: ${finalConfig.debugSql ? chalk.green('Enabled') : chalk.yellow('Disabled')}`
    ].filter(Boolean).join('\n'),
    'Database Configuration Summary'
  );
  
  // Offer to initialize the database
  // Show help message before confirm prompt
  p.log.info(chalk.gray('This will create the database and required tables'));

  const initDb = await p.confirm({
    message: 'Initialize the database now?',
    initialValue: true
  });
  
  // Handle cancellation
  if (p.isCancel(initDb)) {
    p.cancel('Setup cancelled');
    process.exit(0);
  }
  
  if (initDb) {
    const s = p.spinner();
    s.start('Initializing database');
    
    try {
      // We'll use the actual npm script command here
      const { execa } = await import('execa');
      await execa('npm', ['run', 'db:init']);
      s.stop('Database initialized successfully');
      
      // Run migrations if enabled
      if (enableMigrations) {
        const ms = p.spinner();
        ms.start('Running database migrations');
        
        try {
          await execa('npm', ['run', 'db:migrate']);
          ms.stop('Database migrations completed successfully');
        } catch (error) {
          ms.stop('Database migrations failed');
          p.log?.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      s.stop('Database initialization failed');
      p.log?.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      
      p.note(
        'Database initialization failed. You can initialize it later by running:\n' +
        'npm run db:init\n' +
        'npm run db:migrate',
        'Error'
      );
    }
  } else {
    p.log.info('Skipping database initialization. You can initialize it later by running:');
    p.log.info('npm run db:init');
    p.log.info('npm run db:migrate');
  }
}