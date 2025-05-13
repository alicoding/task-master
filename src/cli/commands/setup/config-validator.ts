/**
 * Configuration Validator
 * Analyzes and validates Task Master configuration
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { EnvManager } from '@/cli/commands/setup/env-manager';
import { execa } from 'execa';

// Environment Manager instance
const envManager = new EnvManager({
  backupOnSave: true,
  mergeStrategy: 'prompt'
});

/**
 * Issue severity levels
 */
export enum IssueSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Configuration issue type
 */
export interface ConfigIssue {
  id: string;
  severity: IssueSeverity;
  component: string;
  message: string;
  description: string;
  autoFixable: boolean;
  fix?: () => Promise<boolean>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ConfigIssue[];
}

/**
 * Environment variable validation rules
 */
interface EnvVarRule {
  name: string;
  required: boolean;
  component: string;
  description: string;
  format?: RegExp;
  formatDescription?: string;
  allowedValues?: string[];
  recommender?: () => Promise<string | undefined>;
}

/**
 * List of required environment variables and their validation rules
 */
const ENV_VAR_RULES: EnvVarRule[] = [
  {
    name: 'AI_PROVIDER_TYPE',
    required: true,
    component: 'AI Configuration',
    description: 'AI provider type',
    allowedValues: ['openai', 'anthropic', 'custom-openai', 'mock']
  },
  {
    name: 'OPENAI_API_KEY',
    required: false,
    component: 'AI Configuration',
    description: 'OpenAI API key',
    format: /^sk-[a-zA-Z0-9]{32,}$/,
    formatDescription: 'Should start with "sk-" followed by a string of letters and numbers'
  },
  {
    name: 'OPENAI_MODEL',
    required: false,
    component: 'AI Configuration',
    description: 'OpenAI model'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    component: 'AI Configuration',
    description: 'Anthropic API key',
    format: /^sk-ant-[a-zA-Z0-9]{32,}$/,
    formatDescription: 'Should start with "sk-ant-" followed by a string of letters and numbers'
  },
  {
    name: 'ANTHROPIC_MODEL',
    required: false,
    component: 'AI Configuration',
    description: 'Anthropic model'
  },
  {
    name: 'CUSTOM_OPENAI_BASE_URL',
    required: false,
    component: 'AI Configuration',
    description: 'Custom OpenAI base URL',
    format: /^https?:\/\/.+/,
    formatDescription: 'Should be a valid URL starting with http:// or https://'
  },
  {
    name: 'DB_PATH',
    required: false,
    component: 'Database Configuration',
    description: 'Database path',
    recommender: async () => {
      // Try to find the database file
      try {
        const projectRoot = process.cwd();
        const dbDir = path.join(projectRoot, 'db');
        const files = await fs.readdir(dbDir);
        const dbFile = files.find(file => file.endsWith('.db'));
        if (dbFile) {
          return path.join(dbDir, dbFile);
        }
      } catch (error) {
        // Just return undefined if there's an error
      }
      return path.join('db', 'taskmaster.db');
    }
  },
  {
    name: 'DB_ENABLE_MIGRATIONS',
    required: false,
    component: 'Database Configuration',
    description: 'Enable automatic database migrations',
    allowedValues: ['true', 'false']
  },
  {
    name: 'DB_ENABLE_BACKUPS',
    required: false,
    component: 'Database Configuration',
    description: 'Enable database backups',
    allowedValues: ['true', 'false']
  },
  {
    name: 'DEBUG_SQL',
    required: false,
    component: 'Database Configuration',
    description: 'Enable SQL debug logging',
    allowedValues: ['true', 'false']
  }
];

/**
 * File path validation rules
 */
interface FileRule {
  id: string;
  path: string;
  component: string;
  description: string;
  required: boolean;
  type: 'file' | 'directory' | 'either';
}

/**
 * List of required files and directories
 */
const FILE_RULES: FileRule[] = [
  {
    id: 'db_dir',
    path: 'db',
    component: 'Database',
    description: 'Database directory',
    required: true,
    type: 'directory'
  },
  {
    id: 'db_migrations_dir',
    path: 'db/migrations',
    component: 'Database',
    description: 'Database migrations directory',
    required: true,
    type: 'directory'
  },
  {
    id: 'db_init',
    path: 'db/init.ts',
    component: 'Database',
    description: 'Database initialization script',
    required: true,
    type: 'file'
  },
  {
    id: 'cli_dir',
    path: 'cli',
    component: 'CLI',
    description: 'CLI directory',
    required: true,
    type: 'directory'
  },
  {
    id: 'cli_entry',
    path: 'cli/entry.ts',
    component: 'CLI',
    description: 'CLI entry point',
    required: true,
    type: 'file'
  },
  {
    id: 'core_dir',
    path: 'core',
    component: 'Core',
    description: 'Core functionality directory',
    required: true,
    type: 'directory'
  },
  {
    id: 'docs_dir',
    path: 'docs',
    component: 'Documentation',
    description: 'Documentation directory',
    required: false,
    type: 'directory'
  },
  {
    id: 'package_json',
    path: 'package.json',
    component: 'Project',
    description: 'Package configuration',
    required: true,
    type: 'file'
  },
  {
    id: 'tsconfig_json',
    path: 'tsconfig.json',
    component: 'Project',
    description: 'TypeScript configuration',
    required: true,
    type: 'file'
  },
  {
    id: 'env_file',
    path: '.env',
    component: 'Configuration',
    description: 'Environment configuration',
    required: false,
    type: 'file'
  }
];

/**
 * Package dependency validation rules
 */
interface DependencyRule {
  name: string;
  component: string;
  description: string;
  required: boolean;
  type: 'dependency' | 'devDependency' | 'either';
}

/**
 * List of required dependencies
 */
const DEPENDENCY_RULES: DependencyRule[] = [
  {
    name: 'better-sqlite3',
    component: 'Database',
    description: 'SQLite database driver',
    required: true,
    type: 'dependency'
  },
  {
    name: 'drizzle-orm',
    component: 'Database',
    description: 'Database ORM',
    required: true,
    type: 'dependency'
  },
  {
    name: 'commander',
    component: 'CLI',
    description: 'Command-line interface framework',
    required: true,
    type: 'dependency'
  },
  {
    name: 'dotenv',
    component: 'Configuration',
    description: 'Environment variable loader',
    required: true,
    type: 'dependency'
  },
  {
    name: 'typescript',
    component: 'TypeScript',
    description: 'TypeScript compiler',
    required: true,
    type: 'either'
  },
  {
    name: '@clack/prompts',
    component: 'UI',
    description: 'Interactive CLI UI',
    required: false,
    type: 'dependency'
  },
  {
    name: 'vitest',
    component: 'Testing',
    description: 'Test framework',
    required: false,
    type: 'devDependency'
  }
];

/**
 * Check if a path exists
 */
async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory
 */
async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
async function isFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Get the package.json contents
 */
async function getPackageJson(): Promise<any> {
  try {
    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    return JSON.parse(packageJsonContent);
  } catch {
    return null;
  }
}

/**
 * Check if the project directory structure is valid
 */
async function validateDirectoryStructure(): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = [];
  const projectRoot = process.cwd();
  
  // Check each file rule
  for (const rule of FILE_RULES) {
    const fullPath = path.join(projectRoot, rule.path);
    const exists = await pathExists(fullPath);
    
    if (rule.required && !exists) {
      // Required path doesn't exist
      issues.push({
        id: `missing_${rule.id}`,
        severity: IssueSeverity.ERROR,
        component: rule.component,
        message: `Missing ${rule.description}`,
        description: `The ${rule.type} '${rule.path}' is required but wasn't found.`,
        autoFixable: false
      });
    } else if (exists) {
      // Path exists, check if it's the right type
      const isDir = await isDirectory(fullPath);
      const isFileType = await isFile(fullPath);
      
      if (rule.type === 'directory' && !isDir) {
        issues.push({
          id: `wrong_type_${rule.id}`,
          severity: IssueSeverity.ERROR,
          component: rule.component,
          message: `${rule.description} is not a directory`,
          description: `'${rule.path}' exists but is not a directory.`,
          autoFixable: false
        });
      } else if (rule.type === 'file' && !isFileType) {
        issues.push({
          id: `wrong_type_${rule.id}`,
          severity: IssueSeverity.ERROR,
          component: rule.component,
          message: `${rule.description} is not a file`,
          description: `'${rule.path}' exists but is not a file.`,
          autoFixable: false
        });
      }
    }
  }
  
  return issues;
}

/**
 * Check package.json for required dependencies
 */
async function validateDependencies(): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = [];
  const packageJson = await getPackageJson();
  
  if (!packageJson) {
    // Already covered by directory structure validation
    return issues;
  }
  
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  // Check each dependency rule
  for (const rule of DEPENDENCY_RULES) {
    const inDeps = rule.name in dependencies;
    const inDevDeps = rule.name in devDependencies;
    const exists = inDeps || inDevDeps;
    
    if (rule.required && !exists) {
      // Required dependency is missing
      issues.push({
        id: `missing_dep_${rule.name}`,
        severity: IssueSeverity.ERROR,
        component: rule.component,
        message: `Missing required dependency: ${rule.name}`,
        description: `${rule.description} is required but not found in package.json.`,
        autoFixable: true,
        fix: async () => {
          try {
            const s = p.spinner();
            s.start(`Installing ${rule.name}...`);
            
            const installCommand = rule.type === 'devDependency' ? 'npm install --save-dev' : 'npm install';
            await execa(installCommand.split(' ')[0], [...installCommand.split(' ').slice(1), rule.name]);
            
            s.stop(`${rule.name} installed successfully`);
            return true;
          } catch (error) {
            p.log.error(`Failed to install ${rule.name}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
          }
        }
      });
    } else if (rule.type !== 'either') {
      // Check if the dependency is in the correct section
      if (rule.type === 'dependency' && !inDeps && inDevDeps) {
        issues.push({
          id: `wrong_section_${rule.name}`,
          severity: IssueSeverity.WARNING,
          component: rule.component,
          message: `${rule.name} should be a regular dependency, not a dev dependency`,
          description: `${rule.description} should be in 'dependencies', but was found in 'devDependencies'.`,
          autoFixable: false
        });
      } else if (rule.type === 'devDependency' && inDeps && !inDevDeps) {
        issues.push({
          id: `wrong_section_${rule.name}`,
          severity: IssueSeverity.WARNING,
          component: rule.component,
          message: `${rule.name} should be a dev dependency, not a regular dependency`,
          description: `${rule.description} should be in 'devDependencies', but was found in 'dependencies'.`,
          autoFixable: false
        });
      }
    }
  }
  
  // Check for ESM module type
  if (!packageJson.type || packageJson.type !== 'module') {
    issues.push({
      id: 'missing_module_type',
      severity: IssueSeverity.ERROR,
      component: 'Project',
      message: 'Missing "type": "module" in package.json',
      description: 'Task Master requires ESM modules. Add "type": "module" to package.json.',
      autoFixable: true,
      fix: async () => {
        try {
          const packageJson = await getPackageJson();
          packageJson.type = 'module';
          await fs.writeFile(
            path.join(process.cwd(), 'package.json'),
            JSON.stringify(packageJson, null, 2)
          );
          return true;
        } catch {
          return false;
        }
      }
    });
  }
  
  return issues;
}

/**
 * Validate environment variables
 */
async function validateEnvironmentVariables(): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = [];
  const env = await envManager.load();
  
  // Check AI provider configuration
  const aiProviderType = env.AI_PROVIDER_TYPE;
  
  if (!aiProviderType) {
    issues.push({
      id: 'missing_ai_provider',
      severity: IssueSeverity.WARNING,
      component: 'AI Configuration',
      message: 'Missing AI provider type',
      description: 'AI provider type is not set. Set AI_PROVIDER_TYPE to one of: openai, anthropic, custom-openai, mock',
      autoFixable: true,
      fix: async () => {
        try {
          await envManager.merge({ AI_PROVIDER_TYPE: 'mock' });
          await envManager.save();
          return true;
        } catch {
          return false;
        }
      }
    });
  } else {
    // Validate provider-specific variables
    if (aiProviderType === 'openai') {
      // OpenAI requires an API key
      if (!env.OPENAI_API_KEY) {
        issues.push({
          id: 'missing_openai_key',
          severity: IssueSeverity.ERROR,
          component: 'AI Configuration',
          message: 'Missing OpenAI API key',
          description: 'OpenAI provider requires an API key. Set OPENAI_API_KEY with your API key.',
          autoFixable: false
        });
      }
    } else if (aiProviderType === 'anthropic') {
      // Anthropic requires an API key
      if (!env.ANTHROPIC_API_KEY) {
        issues.push({
          id: 'missing_anthropic_key',
          severity: IssueSeverity.ERROR,
          component: 'AI Configuration',
          message: 'Missing Anthropic API key',
          description: 'Anthropic provider requires an API key. Set ANTHROPIC_API_KEY with your API key.',
          autoFixable: false
        });
      }
    } else if (aiProviderType === 'custom-openai') {
      // Custom OpenAI requires a base URL
      if (!env.CUSTOM_OPENAI_BASE_URL) {
        issues.push({
          id: 'missing_custom_openai_url',
          severity: IssueSeverity.ERROR,
          component: 'AI Configuration',
          message: 'Missing Custom OpenAI base URL',
          description: 'Custom OpenAI provider requires a base URL. Set CUSTOM_OPENAI_BASE_URL with your provider URL.',
          autoFixable: false
        });
      }
    }
  }
  
  // Check database configuration
  if (!env.DB_PATH) {
    // Recommend a database path
    const dbPathRule = ENV_VAR_RULES.find(rule => rule.name === 'DB_PATH');
    let recommendedPath = 'db/taskmaster.db';
    
    if (dbPathRule?.recommender) {
      const recommendation = await dbPathRule.recommender();
      if (recommendation) {
        recommendedPath = recommendation;
      }
    }
    
    issues.push({
      id: 'missing_db_path',
      severity: IssueSeverity.WARNING,
      component: 'Database Configuration',
      message: 'Missing database path',
      description: 'Database path is not set. Set DB_PATH to the location of your SQLite database.',
      autoFixable: true,
      fix: async () => {
        try {
          await envManager.merge({ DB_PATH: recommendedPath });
          await envManager.save();
          return true;
        } catch {
          return false;
        }
      }
    });
  }
  
  // Check format of environment variables
  for (const rule of ENV_VAR_RULES) {
    const value = env[rule.name];
    
    if (value && rule.format && !rule.format.test(value)) {
      issues.push({
        id: `invalid_format_${rule.name}`,
        severity: IssueSeverity.WARNING,
        component: rule.component,
        message: `Invalid format for ${rule.description}`,
        description: `${rule.name} has an invalid format. ${rule.formatDescription || ''}`,
        autoFixable: false
      });
    }
    
    if (value && rule.allowedValues && !rule.allowedValues.includes(value)) {
      issues.push({
        id: `invalid_value_${rule.name}`,
        severity: IssueSeverity.WARNING,
        component: rule.component,
        message: `Invalid value for ${rule.description}`,
        description: `${rule.name} has an invalid value. Allowed values: ${rule.allowedValues.join(', ')}`,
        autoFixable: false
      });
    }
  }
  
  return issues;
}

/**
 * Check database initialization
 */
async function validateDatabase(): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = [];
  const env = await envManager.load();
  
  // Check if database file exists
  const dbPath = env.DB_PATH || 'db/taskmaster.db';
  const projectRoot = process.cwd();
  const fullDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(projectRoot, dbPath);
  
  const dbExists = await pathExists(fullDbPath);
  
  if (!dbExists) {
    issues.push({
      id: 'missing_database',
      severity: IssueSeverity.WARNING,
      component: 'Database',
      message: 'Database file not found',
      description: `Database file not found at ${dbPath}. The database needs to be initialized.`,
      autoFixable: true,
      fix: async () => {
        try {
          const s = p.spinner();
          s.start('Initializing database...');
          
          try {
            // Make sure the directory exists
            const dbDir = path.dirname(fullDbPath);
            await fs.mkdir(dbDir, { recursive: true });
            
            // Run the initialization script
            await execa('npm', ['run', 'db:init']);
            s.stop('Database initialized successfully');
            return true;
          } catch (error) {
            s.stop('Failed to initialize database');
            p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
            return false;
          }
        } catch {
          return false;
        }
      }
    });
  }
  
  return issues;
}

/**
 * Validate project configuration
 */
export async function validateConfiguration(): Promise<ValidationResult> {
  const issues: ConfigIssue[] = [];
  
  // Run all validators
  const directoryIssues = await validateDirectoryStructure();
  const dependencyIssues = await validateDependencies();
  const envIssues = await validateEnvironmentVariables();
  const dbIssues = await validateDatabase();
  
  // Combine all issues
  issues.push(...directoryIssues, ...dependencyIssues, ...envIssues, ...dbIssues);
  
  // Determine if the configuration is valid
  const hasErrors = issues.some(issue => 
    issue.severity === IssueSeverity.ERROR || 
    issue.severity === IssueSeverity.CRITICAL
  );
  
  return {
    valid: !hasErrors,
    issues
  };
}

/**
 * Display validation results
 */
function displayValidationResults(result: ValidationResult): void {
  // Group issues by severity
  const criticalIssues = result.issues.filter(issue => issue.severity === IssueSeverity.CRITICAL);
  const errorIssues = result.issues.filter(issue => issue.severity === IssueSeverity.ERROR);
  const warningIssues = result.issues.filter(issue => issue.severity === IssueSeverity.WARNING);
  const infoIssues = result.issues.filter(issue => issue.severity === IssueSeverity.INFO);
  
  // Display overall status
  if (result.valid) {
    if (result.issues.length === 0) {
      p.note('No issues found. Your configuration is valid!', 'Validation Passed');
    } else {
      p.note(
        `Configuration is valid with ${warningIssues.length} warning(s) and ${infoIssues.length} info message(s).`,
        'Validation Passed'
      );
    }
  } else {
    p.note(
      `Configuration has ${criticalIssues.length} critical issue(s) and ${errorIssues.length} error(s) that need to be fixed.`,
      'Validation Failed'
    );
  }
  
  // Display issues by component
  const byComponent: { [key: string]: ConfigIssue[] } = {};
  
  for (const issue of result.issues) {
    if (!byComponent[issue.component]) {
      byComponent[issue.component] = [];
    }
    byComponent[issue.component].push(issue);
  }
  
  for (const [component, issues] of Object.entries(byComponent)) {
    // Skip components with no issues
    if (issues.length === 0) continue;
    
    // Display component header
    console.log(`\n${chalk.blue.bold(component)} ${chalk.gray(`(${issues.length} issue${issues.length === 1 ? '' : 's'})`)}`);
    
    // Display issues
    for (const issue of issues) {
      // Format based on severity
      let icon = '';
      let color = chalk.white;
      
      switch (issue.severity) {
        case IssueSeverity.CRITICAL:
          icon = chalk.red(('✖' as string));
          color = chalk.red;
          break;
        case IssueSeverity.ERROR:
          icon = chalk.red(('✗' as string));
          color = chalk.red;
          break;
        case IssueSeverity.WARNING:
          icon = chalk.yellow(('⚠' as string));
          color = chalk.yellow;
          break;
        case IssueSeverity.INFO:
          icon = chalk.blue(('ℹ' as string));
          color = chalk.blue;
          break;
      }
      
      // Display issue
      console.log(`  ${icon} ${color(issue.message)}`);
      console.log(`    ${chalk.gray(issue.description)}`);
      
      // Show if auto-fixable
      if (issue.autoFixable) {
        console.log(`    ${chalk.green(('✓' as string))} ${chalk.gray(('This issue can be automatically fixed' as string))}`);
      }
      
      console.log('');
    }
  }
}

/**
 * Fix issues that can be automatically fixed
 */
async function fixIssues(issues: ConfigIssue[]): Promise<{ fixed: number, failed: number }> {
  let fixed = 0;
  let failed = 0;
  
  // Filter fixable issues
  const fixableIssues = issues.filter(issue => issue.autoFixable && issue.fix);
  
  if (fixableIssues.length === 0) {
    p.log.info('No auto-fixable issues found');
    return { fixed, failed };
  }
  
  // Ask which issues to fix
  const issueOptions = fixableIssues.map(issue => ({
    value: issue.id,
    label: issue.message,
    hint: issue.component
  }));
  
  const issuesToFix = await p.multiselect({
    message: 'Select issues to fix automatically:',
    options: issueOptions,
    initialValues: fixableIssues.map(issue => issue.id)
  });
  
  // Handle cancellation
  if (p.isCancel(issuesToFix)) {
    p.cancel('Fix cancelled');
    process.exit(0);
  }
  
  // Fix selected issues
  for (const issue of fixableIssues) {
    if (issuesToFix.includes(issue.id) && issue.fix) {
      p.log.info(`Fixing: ${issue.message}`);
      
      try {
        const success = await issue.fix();
        
        if (success) {
          p.log.success(`Fixed: ${issue.message}`);
          fixed++;
        } else {
          p.log.error(`Failed to fix: ${issue.message}`);
          failed++;
        }
      } catch (error) {
        p.log.error(`Error fixing issue: ${error instanceof Error ? error.message : String(error)}`);
        failed++;
      }
    }
  }
  
  return { fixed, failed };
}

/**
 * Main function to validate configuration
 */
export async function runConfigurationValidation(fix: boolean = false): Promise<void> {
  const s = p.spinner();
  s.start('Validating configuration...');
  
  const result = await validateConfiguration();
  
  s.stop(`Found ${result.issues.length} issue${result.issues.length === 1 ? '' : 's'}`);
  
  // Display results
  displayValidationResults(result);
  
  // Fix issues if requested
  if (fix && result.issues.some(issue => issue.autoFixable)) {
    const confirmFix = await p.confirm({
      message: 'Do you want to fix auto-fixable issues?',
      initialValue: true
    });
    
    // Handle cancellation
    if (p.isCancel(confirmFix)) {
      p.cancel('Validation cancelled');
      process.exit(0);
    }
    
    if (confirmFix) {
      const { fixed, failed } = await fixIssues(result.issues);
      
      p.note(
        `Fixed ${fixed} issue${fixed === 1 ? '' : 's'}, ${failed} issue${failed === 1 ? '' : 's'} failed to fix.`,
        'Fix Summary'
      );
      
      if (fixed > 0) {
        // Re-validate to make sure issues were fixed
        const newResult = await validateConfiguration();
        
        if (newResult.valid) {
          p.note('All critical issues have been fixed. Your configuration is now valid!', 'Validation Passed');
        } else {
          p.note('Some issues remain. Please fix them manually.', 'Validation');
        }
      }
    }
  }
}