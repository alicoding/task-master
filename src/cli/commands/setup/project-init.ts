/**
 * Project Initialization Wizard
 * Guides users through setting up a new Task Master project
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EnvManager } from '@/cli/commands/setup/env-manager';
import { execa } from 'execa';

// Environment Manager instance
const envManager = new EnvManager({
  backupOnSave: true,
  mergeStrategy: 'prompt'
});

/**
 * Project configuration options
 */
interface ProjectConfig {
  name: string;
  description: string;
  version: string;
  author: string;
  license: string;
  private: boolean;
  initGit: boolean;
  installDeps: boolean;
  createExamples: boolean;
  dbLocation: string;
  aiProvider: string;
}

/**
 * Default project configuration
 */
function getDefaultConfig(): ProjectConfig {
  return {
    name: path.basename(process.cwd()),
    description: 'Task Master project for task and code management',
    version: '0.1.0',
    author: '',
    license: 'MIT',
    private: true,
    initGit: true,
    installDeps: true,
    createExamples: true,
    dbLocation: 'db/taskmaster.db',
    aiProvider: 'mock'
  };
}

/**
 * Check if the directory is empty enough to initialize a new project
 */
async function isDirectoryEmpty(dir: string): Promise<boolean> {
  try {
    const files = await fs.readdir(dir);
    // Filter out common files that can be in a directory without making it "non-empty"
    const significantFiles = files.filter(file => {
      return !['.git', '.gitignore', '.DS_Store', 'README.md', 'LICENSE'].includes(file);
    });
    
    return significantFiles.length === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists and is accessible
 */
async function directoryExists(dir: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dir);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Initialize a Git repository in the project directory
 */
async function initializeGitRepo(dir: string): Promise<boolean> {
  const s = p.spinner();
  s.start('Initializing Git repository');
  
  try {
    // Check if git is already initialized
    const gitDir = path.join(dir, '.git');
    const hasGit = await directoryExists(gitDir);
    
    if (hasGit) {
      s.stop('Git repository already initialized');
      return true;
    }
    
    // Initialize git repository
    await execa('git', ['init'], { cwd: dir });
    
    // Create basic .gitignore
    const gitignoreContent = `# Task Master Project
node_modules/
.env
.env.*
!.env.example
*.log
dist/
db/*.db
db/backups/
`;
    
    await fs.writeFile(path.join(dir, '.gitignore'), gitignoreContent);
    
    s.stop('Git repository initialized');
    return true;
  } catch (error) {
    s.stop('Failed to initialize Git repository');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create the project directory structure
 */
async function createProjectStructure(dir: string): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating project structure');
  
  try {
    // Create directories
    const dirs = [
      'db',
      'db/migrations',
      'db/backups',
      'data',
      'core',
      'cli',
      'cli/commands',
      'docs'
    ];
    
    for (const directory of dirs) {
      await fs.mkdir(path.join(dir, directory), { recursive: true });
    }
    
    s.stop('Project structure created');
    return true;
  } catch (error) {
    s.stop('Failed to create project structure');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create a package.json file for the project
 */
async function createPackageJson(dir: string, config: ProjectConfig): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating package.json');
  
  try {
    const packageJson = {
      name: config.name,
      version: config.version,
      description: config.description,
      type: 'module',
      private: config.private,
      bin: {
        "tm": "./cli/entry.js"
      },
      scripts: {
        "build": "tsc",
        "dev": "tsx cli/entry.ts",
        "test": "vitest",
        "db:init": "tsx db/init.ts",
        "db:migrate": "tsx db/migrate.ts",
        "lint": "eslint . --ext .ts",
        "check": "tsc --noEmit"
      },
      keywords: [
        "task-management",
        "cli",
        "productivity",
        "sqlite",
        "drizzle"
      ],
      author: config.author,
      license: config.license,
      dependencies: {
        "@clack/prompts": "^0.10.1",
        "@types/better-sqlite3": "^7.6.13",
        "@types/node": "^22.15.17",
        "better-sqlite3": "^11.10.0",
        "chalk": "^5.4.1",
        "commander": "^13.1.0",
        "dotenv": "^16.5.0",
        "drizzle-orm": "^0.43.1",
        "ts-node": "^10.9.2",
        "typescript": "^5.8.3"
      },
      devDependencies: {
        "drizzle-kit": "^0.31.1",
        "tsx": "^4.19.4",
        "vitest": "^3.1.3"
      },
      engines: {
        "node": ">=16.0.0"
      }
    };
    
    await fs.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    s.stop('package.json created');
    return true;
  } catch (error) {
    s.stop('Failed to create package.json');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create a basic TypeScript configuration
 */
async function createTsConfig(dir: string): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating TypeScript configuration');
  
  try {
    const tsconfig = {
      "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "outDir": "dist",
        "declaration": true
      },
      "include": ["**/*.ts"],
      "exclude": ["node_modules", "dist"]
    };
    
    await fs.writeFile(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
    
    s.stop('TypeScript configuration created');
    return true;
  } catch (error) {
    s.stop('Failed to create TypeScript configuration');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create a basic README.md file
 */
async function createReadme(dir: string, config: ProjectConfig): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating README.md');
  
  try {
    const readme = `# ${config.name}

${config.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Getting Started

Initialize the database:

\`\`\`bash
npm run db:init
npm run db:migrate
\`\`\`

Run the Task Master CLI:

\`\`\`bash
npm run dev -- --help
\`\`\`

## Commands

- \`tm add\` - Add a new task
- \`tm show\` - Show tasks
- \`tm update\` - Update a task
- \`tm setup\` - Configure Task Master

## Configuration

Run the setup wizard to configure Task Master:

\`\`\`bash
npm run dev -- setup
\`\`\`
`;
    
    await fs.writeFile(path.join(dir, 'README.md'), readme);
    
    s.stop('README.md created');
    return true;
  } catch (error) {
    s.stop('Failed to create README.md');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create basic environment configuration
 */
async function createEnvConfig(dir: string, config: ProjectConfig): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating environment configuration');
  
  try {
    // Create .env with basic configuration
    const envContent = `# Task Master Configuration
# Created: ${new Date().toISOString()}

# Database Configuration
DB_PATH=${config.dbLocation}
DB_ENABLE_MIGRATIONS=true
DB_ENABLE_BACKUPS=true
DB_BACKUP_INTERVAL=24

# AI Provider Configuration
AI_PROVIDER_TYPE=${config.aiProvider}
AI_DEBUG=false
`;
    
    await fs.writeFile(path.join(dir, '.env'), envContent);
    
    // Create .env.example as a template
    await fs.writeFile(path.join(dir, '.env.example'), envContent);
    
    s.stop('Environment configuration created');
    return true;
  } catch (error) {
    s.stop('Failed to create environment configuration');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create basic CLI entry point
 */
async function createCliEntry(dir: string): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating CLI entry point');
  
  try {
    const cliEntryContent = `#!/usr/bin/env node
import { Command } from 'commander';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function main() {
  const program = new Command();

  program
    .name('tm')
    .description('Task Master - Structured CLI Task Engine')
    .version('${getDefaultConfig().version}');

  // TODO: Add commands here

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
`;
    
    // Create cli directory if it doesn't exist
    await fs.mkdir(path.join(dir, 'cli'), { recursive: true });
    
    // Write the entry file
    await fs.writeFile(path.join(dir, 'cli', 'entry.ts'), cliEntryContent);
    
    s.stop('CLI entry point created');
    return true;
  } catch (error) {
    s.stop('Failed to create CLI entry point');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create basic database initialization file
 */
async function createDbInit(dir: string, config: ProjectConfig): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating database initialization files');
  
  try {
    const dbInitContent = `import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDb(dbPath: string = path.resolve(process.env.DB_PATH || path.join(__dirname, 'taskmaster.db')), inMemory: boolean = false) {
  type BetterSQLite3Database = ReturnType<typeof Database>;
  try {
    // Create the SQLite database with safer error handling
    const sqlite = inMemory
      ? new Database(':memory:', { verbose: process.env.DEBUG_SQL === 'true' ? console.log : undefined })
      : new Database(dbPath, { verbose: process.env.DEBUG_SQL === 'true' ? console.log : undefined });

    // Create the Drizzle ORM instance
    const db = drizzle(sqlite);

    // For in-memory DB or initial setup, create tables directly with error handling
    const createTasksTable = \`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        tags TEXT DEFAULT '[]'
      )
    \`;

    // Execute each statement with individual error handling
    try {
      sqlite.exec(createTasksTable);
    } catch (error) {
      // Ignore "table already exists" errors
      if (!(error instanceof Error) || !error.message.includes('already exists')) {
        console.error(\`Error creating tasks table: \${error instanceof Error ? error.message : String(error)}\`);
      }
    }

    console.log(\`Database initialized at: \${dbPath}\`);

    return { db, sqlite };
  } catch (error) {
    // Handle critical errors during database initialization
    console.error(\`Critical error initializing database: \${error instanceof Error ? error.message : String(error)}\`);

    // Try to create an in-memory database as fallback if file-based DB failed
    if (!inMemory) {
      console.log('Falling back to in-memory database');
      return createDb(':memory:', true);
    }

    // If we're already trying to create an in-memory DB and it failed, rethrow
    throw error;
  }
}

// For direct invocation during setup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Initializing database...');
  createDb();
  console.log('Database initialized successfully!');
}`;
    
    // Create db directory if it doesn't exist
    await fs.mkdir(path.join(dir, 'db'), { recursive: true });
    
    // Write the database initialization file
    await fs.writeFile(path.join(dir, 'db', 'init.ts'), dbInitContent);
    
    // Create basic migration file
    const migrationContent = `CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  tags TEXT DEFAULT '[]'
);
`;
    
    // Create migrations directory if it doesn't exist
    await fs.mkdir(path.join(dir, 'db', 'migrations'), { recursive: true });
    
    // Write basic migration file
    await fs.writeFile(
      path.join(dir, 'db', 'migrations', '0000_initial_schema.sql'),
      migrationContent
    );
    
    // Create migration runner
    const migrateContent = `import { createDb } from './init.ts';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'taskmaster.db');
  
  // Create database if it doesn't exist
  const { sqlite } = createDb(dbPath);
  
  console.log('Running migrations...');
  
  try {
    // Get all migration files
    const migrationFiles = await fs.readdir(path.join(__dirname, 'migrations'));
    
    // Sort migrations by name to ensure they run in order
    const sortedMigrations = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Execute each migration in order
    for (const migrationFile of sortedMigrations) {
      try {
        console.log(\`Applying migration: \${migrationFile}\`);
        const migrationSql = await fs.readFile(
          path.join(__dirname, 'migrations', migrationFile),
          'utf-8'
        );
        
        sqlite.exec(migrationSql);
        console.log(\`Migration \${migrationFile} applied successfully\`);
      } catch (err) {
        console.warn(\`Warning: Could not apply migration \${migrationFile}:\`, err);
      }
    }
    
    console.log('All migrations processed');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
  
  console.log('Migrations completed successfully!');
}

// For direct invocation during setup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration().catch(console.error);
}`;
    
    // Write migration runner
    await fs.writeFile(path.join(dir, 'db', 'migrate.ts'), migrateContent);
    
    s.stop('Database initialization files created');
    return true;
  } catch (error) {
    s.stop('Failed to create database initialization files');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Install dependencies using npm
 */
async function installDependencies(dir: string): Promise<boolean> {
  const s = p.spinner();
  s.start('Installing dependencies');
  
  try {
    await execa('npm', ['install'], { cwd: dir });
    s.stop('Dependencies installed');
    return true;
  } catch (error) {
    s.stop('Failed to install dependencies');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create example components
 */
async function createExampleComponents(dir: string): Promise<boolean> {
  const s = p.spinner();
  s.start('Creating example components');
  
  try {
    // Create example command
    const exampleCommandContent = `import { Command } from 'commander';

/**
 * Create an example command
 */
export function createExampleCommand(): Command {
  const command = new Command('example')
    .description('Example command for Task Master')
    .action(() => {
      console.log('Hello from the example command!');
      console.log('To see more commands, run: tm --help');
    });
    
  return command;
}
`;
    
    // Create commands directory if it doesn't exist
    await fs.mkdir(path.join(dir, 'cli', 'commands'), { recursive: true });
    
    // Write example command
    await fs.writeFile(
      path.join(dir, 'cli', 'commands', 'example.ts'),
      exampleCommandContent
    );
    
    // Update CLI entry to include the example command
    const cliEntryPath = path.join(dir, 'cli', 'entry.ts');
    let cliEntryContent = await fs.readFile(cliEntryPath, 'utf-8');
    
    // Add the import
    cliEntryContent = cliEntryContent.replace(
      'import * as dotenv from \'dotenv\';',
      'import * as dotenv from \'dotenv\';\nimport { createExampleCommand } from \'./commands/example.ts\';'
    );
    
    // Add the command
    cliEntryContent = cliEntryContent.replace(
      '// TODO: Add commands here',
      '// Add commands\n  program.addCommand(createExampleCommand());'
    );
    
    // Write updated CLI entry
    await fs.writeFile(cliEntryPath, cliEntryContent);
    
    s.stop('Example components created');
    return true;
  } catch (error) {
    s.stop('Failed to create example components');
    p.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Main function to set up a new project
 */
export async function setupNewProject(targetDir?: string): Promise<void> {
  p.note('Create a new Task Master project', 'Project Initialization');
  
  // Get project directory
  let projectDir = targetDir || process.cwd();
  
  if (!targetDir) {
    const useCurrentDir = await p.confirm({
      message: `Initialize project in current directory (${chalk.blue(projectDir)})?`,
      initialValue: true
    });
    
    // Handle cancellation
    if (p.isCancel(useCurrentDir)) {
      p.cancel('Project initialization cancelled');
      process.exit(0);
    }
    
    if (!useCurrentDir) {
      const customDir = await p.text({
        message: 'Enter the directory where you want to create the project:',
        placeholder: 'e.g., /path/to/my-project',
        validate: (input) => {
          if (!input) return 'Directory is required';
        }
      });
      
      // Handle cancellation
      if (p.isCancel(customDir)) {
        p.cancel('Project initialization cancelled');
        process.exit(0);
      }
      
      projectDir = customDir;
    }
  }
  
  // Create directory if it doesn't exist
  if (!await directoryExists(projectDir)) {
    const createDir = await p.confirm({
      message: `Directory ${chalk.blue(projectDir)} doesn't exist. Create it?`,
      initialValue: true
    });
    
    // Handle cancellation
    if (p.isCancel(createDir)) {
      p.cancel('Project initialization cancelled');
      process.exit(0);
    }
    
    if (!createDir) {
      p.cancel('Project initialization cancelled');
      return;
    }
    
    try {
      await fs.mkdir(projectDir, { recursive: true });
      p.log.success(`Created directory: ${projectDir}`);
    } catch (error) {
      p.log.error(`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`);
      p.cancel('Project initialization cancelled');
      return;
    }
  }
  
  // Check if directory is empty
  const isDirEmpty = await isDirectoryEmpty(projectDir);
  
  if (!isDirEmpty) {
    p.log.warning(`Directory ${chalk.blue(projectDir)} is not empty.`);
    
    const continueAnyway = await p.confirm({
      message: 'Continue anyway? (existing files may be overwritten)',
      initialValue: false
    });
    
    // Handle cancellation
    if (p.isCancel(continueAnyway)) {
      p.cancel('Project initialization cancelled');
      process.exit(0);
    }
    
    if (!continueAnyway) {
      p.cancel('Project initialization cancelled');
      return;
    }
  }
  
  // Get project configuration options
  const defaultConfig = getDefaultConfig();
  
  // Configure project name
  const name = await p.text({
    message: 'Project name:',
    placeholder: defaultConfig.name,
    initialValue: defaultConfig.name,
    validate: (input) => {
      if (!input) return 'Project name is required';
      if (!/^[a-z0-9-_.]+$/.test(input)) {
        return 'Project name can only contain lowercase letters, numbers, hyphens, underscores, and periods';
      }
    }
  });
  
  // Handle cancellation
  if (p.isCancel(name)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure project description
  const description = await p.text({
    message: 'Project description:',
    placeholder: defaultConfig.description,
    initialValue: defaultConfig.description
  });
  
  // Handle cancellation
  if (p.isCancel(description)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure project version
  const version = await p.text({
    message: 'Project version:',
    placeholder: defaultConfig.version,
    initialValue: defaultConfig.version,
    validate: (input) => {
      if (!input) return 'Version is required';
      if (!/^\d+\.\d+\.\d+(-.*)?$/.test(input)) {
        return 'Version must be in semver format (e.g., 1.0.0)';
      }
    }
  });
  
  // Handle cancellation
  if (p.isCancel(version)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure author
  const author = await p.text({
    message: 'Author:',
    placeholder: 'Your Name <email@example.com>',
    initialValue: defaultConfig.author
  });
  
  // Handle cancellation
  if (p.isCancel(author)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure license
  const license = await p.text({
    message: 'License:',
    placeholder: defaultConfig.license,
    initialValue: defaultConfig.license
  });
  
  // Handle cancellation
  if (p.isCancel(license)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure private package
  const isPrivate = await p.confirm({
    message: 'Is this a private package?',
    initialValue: defaultConfig.private
  });
  
  // Handle cancellation
  if (p.isCancel(isPrivate)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure Git initialization
  const initGit = await p.confirm({
    message: 'Initialize a Git repository?',
    initialValue: defaultConfig.initGit
  });
  
  // Handle cancellation
  if (p.isCancel(initGit)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure dependency installation
  const installDeps = await p.confirm({
    message: 'Install dependencies?',
    initialValue: defaultConfig.installDeps
  });
  
  // Handle cancellation
  if (p.isCancel(installDeps)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure examples
  const createExamples = await p.confirm({
    message: 'Create example components?',
    initialValue: defaultConfig.createExamples
  });
  
  // Handle cancellation
  if (p.isCancel(createExamples)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure database location
  const dbLocation = await p.text({
    message: 'Database location:',
    placeholder: defaultConfig.dbLocation,
    initialValue: defaultConfig.dbLocation
  });
  
  // Handle cancellation
  if (p.isCancel(dbLocation)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Configure AI provider
  const aiProvider = await p.select({
    message: 'Default AI provider:',
    options: [
      { value: 'mock', label: 'Mock Provider', hint: 'For development and testing' },
      { value: 'openai', label: 'OpenAI', hint: 'GPT-3.5/4 models' },
      { value: 'anthropic', label: 'Anthropic', hint: 'Claude models' },
      { value: 'custom-openai', label: 'Custom OpenAI Compatible', hint: 'Ollama, etc.' }
    ],
    initialValue: defaultConfig.aiProvider
  });
  
  // Handle cancellation
  if (p.isCancel(aiProvider)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  // Collect the configuration
  const config: ProjectConfig = {
    name: name.toString(),
    description: description.toString(),
    version: version.toString(),
    author: author.toString(),
    license: license.toString(),
    private: isPrivate,
    initGit,
    installDeps,
    createExamples,
    dbLocation: dbLocation.toString(),
    aiProvider: aiProvider.toString()
  };
  
  // Confirm configuration
  p.note(
    [
      `Project Name: ${chalk.green(config.name)}`,
      `Description: ${chalk.green(config.description)}`,
      `Version: ${chalk.green(config.version)}`,
      `Author: ${chalk.green(config.author || 'Not specified')}`,
      `License: ${chalk.green(config.license)}`,
      `Private Package: ${config.private ? chalk.green(('Yes' as string)) : chalk.yellow(('No' as string))}`,
      `Initialize Git: ${config.initGit ? chalk.green(('Yes' as string)) : chalk.yellow(('No' as string))}`,
      `Install Dependencies: ${config.installDeps ? chalk.green(('Yes' as string)) : chalk.yellow(('No' as string))}`,
      `Create Examples: ${config.createExamples ? chalk.green(('Yes' as string)) : chalk.yellow(('No' as string))}`,
      `Database Location: ${chalk.green(config.dbLocation)}`,
      `AI Provider: ${chalk.green(config.aiProvider)}`
    ].join('\n'),
    'Project Configuration'
  );
  
  const confirmConfig = await p.confirm({
    message: 'Continue with this configuration?',
    initialValue: true
  });
  
  // Handle cancellation
  if (p.isCancel(confirmConfig)) {
    p.cancel('Project initialization cancelled');
    process.exit(0);
  }
  
  if (!confirmConfig) {
    p.cancel('Project initialization cancelled');
    return;
  }
  
  // Create project structure
  const structureCreated = await createProjectStructure(projectDir);
  if (!structureCreated) {
    p.note('Failed to create project structure. Initialization aborted.', 'Error');
    return;
  }
  
  // Create package.json
  const packageJsonCreated = await createPackageJson(projectDir, config);
  if (!packageJsonCreated) {
    p.note('Failed to create package.json. Initialization aborted.', 'Error');
    return;
  }
  
  // Create tsconfig.json
  const tsconfigCreated = await createTsConfig(projectDir);
  if (!tsconfigCreated) {
    p.note('Failed to create TypeScript configuration. Initialization aborted.', 'Error');
    return;
  }
  
  // Create README.md
  const readmeCreated = await createReadme(projectDir, config);
  if (!readmeCreated) {
    p.note('Failed to create README.md. Initialization continuing...', 'Warning');
  }
  
  // Create environment configuration
  const envCreated = await createEnvConfig(projectDir, config);
  if (!envCreated) {
    p.note('Failed to create environment configuration. Initialization aborted.', 'Error');
    return;
  }
  
  // Create CLI entry point
  const cliEntryCreated = await createCliEntry(projectDir);
  if (!cliEntryCreated) {
    p.note('Failed to create CLI entry point. Initialization aborted.', 'Error');
    return;
  }
  
  // Create database initialization files
  const dbInitCreated = await createDbInit(projectDir, config);
  if (!dbInitCreated) {
    p.note('Failed to create database initialization files. Initialization aborted.', 'Error');
    return;
  }
  
  // Initialize Git repository
  if (config.initGit) {
    const gitInitialized = await initializeGitRepo(projectDir);
    if (!gitInitialized) {
      p.note('Failed to initialize Git repository. Initialization continuing...', 'Warning');
    }
  }
  
  // Create example components
  if (config.createExamples) {
    const examplesCreated = await createExampleComponents(projectDir);
    if (!examplesCreated) {
      p.note('Failed to create example components. Initialization continuing...', 'Warning');
    }
  }
  
  // Install dependencies
  if (config.installDeps) {
    const depsInstalled = await installDependencies(projectDir);
    if (!depsInstalled) {
      p.note('Failed to install dependencies. You can install them later with: npm install', 'Warning');
    }
  }
  
  // Success message
  p.note([
    `Project ${chalk.green(config.name)} created successfully!`,
    '',
    'Next steps:',
    config.installDeps ? '' : '1. Run npm install to install dependencies',
    '2. Initialize the database: npm run db:init',
    '3. Run the CLI: npm run dev -- --help',
    '',
    'To customize the project, edit the following files:',
    '- package.json - Package information',
    '- .env - Environment configuration',
    '- cli/entry.ts - CLI entry point'
  ].filter(Boolean).join('\n'), 'Success');
}