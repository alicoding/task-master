# Task Master Project Initialization

The Task Master setup wizard includes a comprehensive project initialization system that helps you create new Task Master projects with a complete directory structure, configuration files, and basic components.

## Overview

The project initialization wizard creates a new Task Master project with:

- Proper directory structure
- Package configuration (package.json)
- TypeScript configuration
- Database initialization
- Environment configuration
- Example components
- Git repository (optional)

## Usage

You can initialize a new project in two ways:

### Using the Setup Wizard

```bash
# Interactive mode with choice of existing configuration or new project
tm setup

# Direct project initialization
tm setup --init

# Initialize in a specific directory
tm setup --init --dir /path/to/my-project
```

## Configuration Options

The project initialization wizard guides you through configuring:

1. **Project Metadata**
   - Project name
   - Description
   - Version
   - Author
   - License
   - Private package setting

2. **Project Features**
   - Git repository initialization
   - Example components
   - Dependency installation

3. **Environment Configuration**
   - Database location
   - Default AI provider

## Project Structure

The wizard creates the following directory structure:

```
my-project/
├── .env                  # Environment configuration
├── .gitignore            # Git ignore file (if Git is initialized)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Project documentation
├── cli/
│   ├── entry.ts          # CLI entry point
│   └── commands/         # CLI commands
│       └── example.ts    # Example command (if examples enabled)
├── core/                 # Core functionality
├── db/
│   ├── init.ts           # Database initialization
│   ├── migrate.ts        # Migration runner
│   ├── migrations/       # Migration files
│   │   └── 0000_initial_schema.sql # Initial schema
│   └── backups/          # Database backups
├── data/                 # Data files
└── docs/                 # Documentation
```

## File Templates

### Package.json

The wizard creates a package.json with:

- Correct project metadata
- ESM module configuration (`"type": "module"`)
- CLI binary configuration
- Essential dependencies (TypeScript, better-sqlite3, drizzle-orm, etc.)
- Standard npm scripts

### Environment Configuration

The wizard creates a basic .env file with:

- Database configuration
- Default AI provider
- Debug settings

### TypeScript Configuration

The wizard creates a tsconfig.json with:

- ES2022 target
- NodeNext module resolution
- Strict type checking
- Proper output directory

### Database Files

The wizard creates basic database initialization files:

- SQLite database creation
- Initial schema with tasks table
- Migration system

## Next Steps

After initializing a project:

1. Navigate to the project directory (if created in a new directory)
2. Install dependencies (if not done automatically): `npm install`
3. Initialize the database: `npm run db:init`
4. Run the Task Master CLI: `npm run dev -- --help`

## Technical Implementation

The project initialization system:

- Uses @clack/prompts for interactive UI
- Creates files and directories with proper permissions
- Supports Git repository initialization
- Automatically installs dependencies
- Provides clear next steps

## Customization

After initialization, you can customize your project by:

1. Editing package.json to add more dependencies
2. Modifying the CLI entry point to add more commands
3. Adding your own commands in the cli/commands directory
4. Updating the database schema in db/migrations
5. Creating custom core functionality in the core directory