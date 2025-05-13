# Task Master Setup Wizard

Task Master provides an interactive setup wizard that helps you configure various aspects of the application. This document describes the features of the setup wizard and how to use it.

## Overview

The setup wizard (`tm setup`) helps you configure your Task Master installation with an intuitive, interactive UI. The wizard handles:

- AI provider configuration
- Database settings configuration
- Environment variable management
- Configuration backup and restore
- Connection testing
- Project initialization

## Command Options

| Option       | Description                                          |
|--------------|------------------------------------------------------|
| `--ai`       | Configure AI providers only                          |
| `--db`       | Configure database settings only                     |
| `--init`     | Initialize a new Task Master project                 |
| `--dir`      | Specify directory for the new project (with --init)  |
| `--force`    | Force reconfiguration even if settings already exist |

## AI Provider Configuration

The wizard supports multiple AI providers:

- **OpenAI** - Configure GPT-3.5 and GPT-4 models
- **Anthropic** - Configure Claude models
- **Custom OpenAI Compatible** - Configure custom endpoints like Ollama
- **Mock Provider** - For development and testing without API keys

For each provider, the wizard guides you through configuring:

- API keys (with secure password masking)
- Model selection with recommendations
- Temperature and other parameters
- Organization settings (where applicable)

## Database Configuration

The wizard helps you configure database settings:

- **Database Location** - Specify where the SQLite database should be stored
- **Automatic Migrations** - Enable or disable automatic schema updates
- **Automatic Backups** - Configure regular database backups
- **Debug Mode** - Enable SQL query logging for debugging

After configuration, the wizard can:
- Initialize the database with required tables
- Run migrations to set up the latest schema

## Environment Management

The setup wizard includes a robust environment management system:

### Backup and Restore

- Automatic backup of your `.env` file before making changes
- Backups stored in `.env-backups/` directory with timestamps
- Option to restore from previous backups
- Database backups for additional data safety

### Conflict Resolution

When merging new configuration with existing settings, the wizard offers three conflict resolution strategies:

1. **Overwrite** - Use new values for all variables
2. **Keep Existing** - Keep your current configuration values
3. **Individual** - Decide for each conflicting variable

## Visual Enhancements

The wizard uses the @clack/prompts library for an enhanced visual experience:

- Modern, visually appealing UI components
- Color-coded sections and status indicators
- Spinners for asynchronous operations
- Informative help text for each configuration option

## Help Text

The wizard provides contextual help for each setting, explaining:

- What the setting does
- Where to find API keys
- Recommendations for temperature settings
- Guidance on model selection

## Connection Testing

After configuration, the wizard offers to test your AI provider connection:

- Live connection test with spinner indicator
- Detailed error messages if connection fails
- Success confirmation when connection works

## Project Initialization

The wizard includes a complete project initialization system:

- **Project Creation** - Create a new Task Master project with all required files
- **Directory Structure** - Sets up the recommended directory structure
- **Package Configuration** - Generates package.json with all necessary dependencies
- **TypeScript Setup** - Creates proper TypeScript configuration
- **Database Setup** - Initializes the database with basic tables
- **Git Integration** - Optionally initialize a Git repository
- **Example Components** - Create example components to get started quickly

The initialization wizard guides you through:

1. Project metadata (name, version, description, etc.)
2. Directory selection
3. Feature selection (Git, dependencies, examples)
4. Environment configuration
5. Database setup

## Workflow

### Configuration Workflow

A typical configuration workflow:

1. Run `tm setup`
2. Choose "Configure existing installation"
3. Select components to configure (AI, database, etc.)
4. Choose whether to restore from a backup (if available)
5. Configure selected components
6. Resolve any configuration conflicts
7. Test connections and setups
8. Start using Task Master with your configuration

### Project Initialization Workflow

A typical project initialization workflow:

1. Run `tm setup --init` or `tm setup` and select "Initialize new project"
2. Enter project details (name, description, etc.)
3. Choose project features (Git, examples, etc.)
4. Specify database settings
5. Configure default AI provider
6. The wizard creates all required files and directories
7. Start developing your Task Master project

## Examples

### Basic Setup

```bash
tm setup
```

### Configure AI Providers Only

```bash
tm setup --ai
```

### Configure Database Settings Only

```bash
tm setup --db
```

### Initialize New Project

```bash
tm setup --init
```

### Initialize New Project in Specific Directory

```bash
tm setup --init --dir /path/to/my-project
```

### Force Reconfiguration

```bash
tm setup --force
```

### Force Database Reconfiguration

```bash
tm setup --db --force
```

## Technical Implementation

The setup wizard is built using:

- **@clack/prompts** for modern interactive UI elements
- **Environment Manager** for robust configuration handling
- **AI Provider Factory** for provider connection testing
- **Database initialization tools** for database setup and migrations
- **Project initialization system** for creating new projects

All configuration is stored in your project's `.env` file and automatically loaded when using Task Master commands.

## Configuration Files

The setup wizard manages several configuration components:

1. **`.env` file** - Environment variables for all Task Master components
2. **`.env-backups/`** - Directory containing timestamped environment backups
3. **`db/taskmaster.db`** - SQLite database file (location configurable)
4. **`db/backups/`** - Database backup directory (if enabled)

## Project Structure

The project initialization creates the following structure:

```
my-project/
├── .env                  # Environment configuration
├── .gitignore            # Git ignore file
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Project documentation
├── cli/
│   ├── entry.ts          # CLI entry point
│   └── commands/         # CLI commands
├── core/                 # Core functionality
├── db/
│   ├── init.ts           # Database initialization
│   ├── migrate.ts        # Migration runner
│   ├── taskmaster.db     # SQLite database
│   ├── backups/          # Database backups
│   └── migrations/       # Migration files
└── docs/                 # Documentation
```