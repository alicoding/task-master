/**
 * Configuration Export/Import
 * Allows exporting and importing Task Master configuration
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import path from 'path';
import { EnvManager } from '@/cli/commands/setup/env-manager';

// Environment Manager instance
const envManager = new EnvManager({
  backupOnSave: true,
  mergeStrategy: 'prompt'
});

/**
 * Configuration schema with version information
 */
interface ConfigurationSchema {
  version: string;
  exportDate: string;
  sections: {
    ai?: {
      provider: string;
      model?: string;
      temperature?: string;
      apiKey?: string;
      [key: string]: any;
    };
    database?: {
      path?: string;
      enableMigrations?: boolean;
      enableBackups?: boolean;
      backupInterval?: number;
      [key: string]: any;
    };
    general?: {
      [key: string]: any;
    };
  };
}

/**
 * Get current configuration version
 */
function getConfigVersion(): string {
  return '1.0.0';
}

/**
 * Create an empty configuration schema
 */
function createEmptySchema(): ConfigurationSchema {
  return {
    version: getConfigVersion(),
    exportDate: new Date().toISOString(),
    sections: {}
  };
}

/**
 * Convert environment variables to structured configuration
 */
function envToConfiguration(env: Record<string, string>): ConfigurationSchema {
  const config = createEmptySchema();
  
  // AI section
  const aiProvider = env.AI_PROVIDER_TYPE;
  if (aiProvider) {
    config.sections.ai = {
      provider: aiProvider
    };
    
    // Add provider-specific values
    Object.entries(env).forEach(([key, value]) => {
      if (key.includes('OPENAI_') || key.includes('ANTHROPIC_') || 
          key.includes('CUSTOM_OPENAI_') || key.includes('AI_')) {
        
        // Don't include API keys in the export by default
        if (!key.includes('API_KEY')) {
          config.sections.ai![key] = value;
        }
      }
    });
  }
  
  // Database section
  if (env.DB_PATH) {
    config.sections.database = {
      path: env.DB_PATH,
      enableMigrations: env.DB_ENABLE_MIGRATIONS === 'true',
      enableBackups: env.DB_ENABLE_BACKUPS === 'true'
    };
    
    if (env.DB_BACKUP_INTERVAL) {
      config.sections.database.backupInterval = parseInt(env.DB_BACKUP_INTERVAL);
    }
    
    if (env.DEBUG_SQL) {
      config.sections.database.debugSql = env.DEBUG_SQL === 'true';
    }
  }
  
  // General section for any other vars
  config.sections.general = {};
  Object.entries(env).forEach(([key, value]) => {
    if (!key.includes('OPENAI_') && !key.includes('ANTHROPIC_') && 
        !key.includes('CUSTOM_OPENAI_') && !key.includes('AI_') &&
        !key.includes('DB_') && key !== 'DEBUG_SQL') {
      config.sections.general![key] = value;
    }
  });
  
  // If general section is empty, remove it
  if (Object.keys(config.sections.general).length === 0) {
    delete config.sections.general;
  }
  
  return config;
}

/**
 * Convert structured configuration back to environment variables
 */
function configurationToEnv(config: ConfigurationSchema): Record<string, string> {
  const env: Record<string, string> = {};
  
  // AI section
  if (config.sections.ai) {
    const { provider, ...rest } = config.sections.ai;
    env.AI_PROVIDER_TYPE = provider;
    
    // Add other AI-related variables
    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value === 'string') {
        env[key] = value;
      } else if (value !== undefined && value !== null) {
        env[key] = String(value);
      }
    });
  }
  
  // Database section
  if (config.sections.database) {
    const { path, enableMigrations, enableBackups, backupInterval, debugSql, ...rest } = config.sections.database;
    
    if (path) env.DB_PATH = path;
    if (enableMigrations !== undefined) env.DB_ENABLE_MIGRATIONS = enableMigrations.toString();
    if (enableBackups !== undefined) env.DB_ENABLE_BACKUPS = enableBackups.toString();
    if (backupInterval !== undefined) env.DB_BACKUP_INTERVAL = backupInterval.toString();
    if (debugSql !== undefined) env.DEBUG_SQL = debugSql.toString();
    
    // Add any other database-related variables
    Object.entries(rest).forEach(([key, value]) => {
      if (typeof value === 'string') {
        env[key] = value;
      } else if (value !== undefined && value !== null) {
        env[key] = String(value);
      }
    });
  }
  
  // General section
  if (config.sections.general) {
    Object.entries(config.sections.general).forEach(([key, value]) => {
      if (typeof value === 'string') {
        env[key] = value;
      } else if (value !== undefined && value !== null) {
        env[key] = String(value);
      }
    });
  }
  
  return env;
}

/**
 * Validate configuration schema
 */
function validateConfiguration(config: any): string[] {
  const errors: string[] = [];
  
  // Check version
  if (!config.version) {
    errors.push('Missing version information');
  }
  
  // Check for sections
  if (!config.sections) {
    errors.push('Missing sections object');
  } else {
    // Check AI section if present
    if (config.sections.ai) {
      if (!config.sections.ai.provider) {
        errors.push('AI section is missing provider');
      }
    }
    
    // Check database section if present
    if (config.sections.database) {
      // No specific validations needed for database section
    }
  }
  
  return errors;
}

/**
 * Detect possible sensitive information in configuration
 */
function detectSensitiveInfo(config: ConfigurationSchema): string[] {
  const sensitive: string[] = [];
  
  // Check for API keys
  if (config.sections.ai) {
    Object.keys(config.sections.ai).forEach(key => {
      if (key.includes('API_KEY') || key.includes('KEY') || key.includes('SECRET')) {
        sensitive.push(key);
      }
    });
  }
  
  // Check general section
  if (config.sections.general) {
    Object.keys(config.sections.general).forEach(key => {
      if (key.includes('API_KEY') || key.includes('KEY') || key.includes('SECRET') || 
          key.includes('PASSWORD') || key.includes('TOKEN')) {
        sensitive.push(key);
      }
      
      // Check if value looks like a token or key (long random string)
      const value = config.sections.general[key];
      if (typeof value === 'string' && 
          value.length > 20 && 
          /^[A-Za-z0-9+/=_\-]{20,}$/.test(value)) {
        sensitive.push(key);
      }
    });
  }
  
  return sensitive;
}

/**
 * Export configuration to a file
 */
export async function exportConfiguration(
  includeSecrets: boolean = false,
  specificSections?: string[]
): Promise<void> {
  p.note('Export Task Master configuration', 'Configuration Export');
  
  // Load current environment variables
  const env = await envManager.load();
  
  // Convert to structured configuration
  let config = envToConfiguration(env);
  
  // Filter by specific sections if requested
  if (specificSections && specificSections.length > 0) {
    const newSections: {[key: string]: any} = {};
    specificSections.forEach(section => {
      if (config.sections[section]) {
        newSections[section] = config.sections[section];
      }
    });
    config.sections = newSections;
  }
  
  // Check for sensitive information
  const sensitiveInfo = detectSensitiveInfo(config);
  
  if (sensitiveInfo.length > 0 && !includeSecrets) {
    p.log.warn('Detected potentially sensitive information:');
    sensitiveInfo.forEach(key => {
      p.log.warn(`- ${key}`);
    });
    
    const includeSecretsPrompt = await p.confirm({
      message: 'Include sensitive information in export?',
      initialValue: false
    });
    
    // Handle cancellation
    if (p.isCancel(includeSecretsPrompt)) {
      p.cancel('Export cancelled');
      process.exit(0);
    }
    
    // Remove sensitive info if user doesn't want to include it
    if (!includeSecretsPrompt) {
      sensitiveInfo.forEach(key => {
        if (config.sections.ai && config.sections.ai[key]) {
          delete config.sections.ai[key];
        }
        if (config.sections.general && config.sections.general[key]) {
          delete config.sections.general[key];
        }
      });
    }
  }
  
  // Get export filename
  const defaultFilename = `taskmaster-config-${new Date().toISOString().split('T')[0]}.json`;
  
  const exportPath = await p.text({
    message: 'Enter file path for export:',
    placeholder: defaultFilename,
    initialValue: defaultFilename,
    validate: (input) => {
      if (!input) return 'File path is required';
      if (!input.endsWith('.json')) return 'File must have .json extension';
    }
  });
  
  // Handle cancellation
  if (p.isCancel(exportPath)) {
    p.cancel('Export cancelled');
    process.exit(0);
  }
  
  // Ensure path is absolute
  const outputPath = path.isAbsolute(exportPath) 
    ? exportPath 
    : path.join(process.cwd(), exportPath);
  
  const s = p.spinner();
  s.start('Exporting configuration...');
  
  try {
    // Create export file
    await fs.writeFile(
      outputPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    
    s.stop(`Configuration exported to ${outputPath}`);
    
    p.note(
      [
        `Successfully exported configuration to: ${chalk.green(outputPath)}`,
        `Contains sections: ${chalk.blue(Object.keys(config.sections).join(', '))}`,
        sensitiveInfo.length > 0 
          ? `Sensitive information: ${includeSecrets ? chalk.yellow(('Included' as string)) : chalk.green(('Excluded' as string))}`
          : `No sensitive information detected`
      ].join('\n'),
      'Export Complete'
    );
  } catch (error) {
    s.stop('Export failed');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Import configuration from a file
 */
export async function importConfiguration(
  overwriteExisting: boolean = false,
  specificSections?: string[]
): Promise<void> {
  p.note('Import Task Master configuration', 'Configuration Import');
  
  // Get import filename
  const importPath = await p.text({
    message: 'Enter file path to import:',
    placeholder: 'taskmaster-config.json',
    validate: (input) => {
      if (!input) return 'File path is required';
      if (!input.endsWith('.json')) return 'File must have .json extension';
    }
  });
  
  // Handle cancellation
  if (p.isCancel(importPath)) {
    p.cancel('Import cancelled');
    process.exit(0);
  }
  
  // Ensure path is absolute
  const inputPath = path.isAbsolute(importPath) 
    ? importPath 
    : path.join(process.cwd(), importPath);
  
  const s = p.spinner();
  s.start('Importing configuration...');
  
  try {
    // Read import file
    const fileContent = await fs.readFile(inputPath, 'utf-8');
    const config = JSON.parse(fileContent);
    
    // Validate configuration
    const validationErrors = validateConfiguration(config);
    
    if (validationErrors.length > 0) {
      s.stop('Import validation failed');
      
      p.note(
        [
          'The configuration file has validation errors:',
          ...validationErrors.map(error => `- ${error}`)
        ].join('\n'),
        'Validation Failed'
      );
      
      const continueAnyway = await p.confirm({
        message: 'Continue with import despite validation errors?',
        initialValue: false
      });
      
      // Handle cancellation
      if (p.isCancel(continueAnyway)) {
        p.cancel('Import cancelled');
        process.exit(0);
      }
      
      if (!continueAnyway) {
        p.note('Import cancelled due to validation errors', 'Import Failed');
        return;
      }
    }
    
    // Filter by specific sections if requested
    if (specificSections && specificSections.length > 0) {
      const newSections: {[key: string]: any} = {};
      specificSections.forEach(section => {
        if (config.sections[section]) {
          newSections[section] = config.sections[section];
        }
      });
      config.sections = newSections;
    }
    
    s.stop(`Read configuration from ${inputPath}`);
    
    // Summary of what will be imported
    p.note(
      [
        `Configuration version: ${chalk.blue(config.version)}`,
        `Export date: ${chalk.blue(config.exportDate || 'Unknown')}`,
        `Sections to import: ${chalk.blue(Object.keys(config.sections).join(', '))}`
      ].join('\n'),
      'Import Summary'
    );
    
    // Detect sensitive information
    const sensitiveInfo = detectSensitiveInfo(config);
    if (sensitiveInfo.length > 0) {
      p.log.warn('Configuration contains potentially sensitive information:');
      sensitiveInfo.forEach(key => {
        p.log.warn(`- ${key}`);
      });
      
      const includeSensitivePrompt = await p.confirm({
        message: 'Include sensitive information in import?',
        initialValue: false
      });
      
      // Handle cancellation
      if (p.isCancel(includeSensitivePrompt)) {
        p.cancel('Import cancelled');
        process.exit(0);
      }
      
      // Remove sensitive info if user doesn't want to include it
      if (!includeSensitivePrompt) {
        sensitiveInfo.forEach(key => {
          if (config.sections.ai && config.sections.ai[key]) {
            delete config.sections.ai[key];
          }
          if (config.sections.general && config.sections.general[key]) {
            delete config.sections.general[key];
          }
        });
      }
    }
    
    // Confirm import
    const confirmImport = await p.confirm({
      message: 'Continue with import?',
      initialValue: true
    });
    
    // Handle cancellation
    if (p.isCancel(confirmImport)) {
      p.cancel('Import cancelled');
      process.exit(0);
    }
    
    if (!confirmImport) {
      p.note('Import cancelled by user', 'Import Cancelled');
      return;
    }
    
    // Convert configuration to environment variables
    const newEnv = configurationToEnv(config);
    
    // Load current environment
    const currentEnv = await envManager.load();
    
    // Determine conflict resolution strategy
    const mergeStrategy = overwriteExisting ? 'overwrite' : 'prompt';
    
    // Apply new configuration
    await envManager.merge(newEnv, mergeStrategy);
    await envManager.save();
    
    p.note(
      'Configuration imported and applied successfully. Changes will take effect immediately.',
      'Import Complete'
    );
    
    // Offer to validate the configuration
    const validateNow = await p.confirm({
      message: 'Would you like to validate the imported configuration?',
      initialValue: true
    });
    
    // Handle cancellation
    if (p.isCancel(validateNow)) {
      return;
    }
    
    if (validateNow) {
      // Import validation module dynamically
      const { runConfigurationValidation } = await import("@/cli/commands/setup/config-validator");
      await runConfigurationValidation(false);
    }
  } catch (error) {
    s.stop('Import failed');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    p.note(`Failed to import configuration from ${importPath}`, 'Import Failed');
  }
}