# Task Master Configuration Validation

Task Master includes a comprehensive configuration validation system that helps you identify and fix common configuration issues and ensure that your setup works correctly.

## Overview

The configuration validation feature checks:

- Project directory structure
- Required dependencies
- Environment variable configuration
- Database setup
- Package configuration

It identifies issues with different severity levels and provides guidance on how to fix them. Many common issues can be automatically fixed.

## Usage

You can validate your configuration in several ways:

### Using the Setup Wizard

```bash
# Run the setup wizard and choose "Validate configuration"
tm setup

# Direct validation with reporting
tm setup --validate

# Validation with automatic fixing of issues
tm setup --validate --fix
```

## Validation Process

The validation process checks several aspects of your Task Master configuration:

### 1. Directory Structure Validation

Ensures that the required directories and files exist:

- Core directories: `cli`, `core`, `db`, etc.
- Essential files: `package.json`, `tsconfig.json`, etc.
- Configuration files: `.env`, etc.

### 2. Dependency Validation

Checks that required dependencies are installed:

- Core dependencies: `better-sqlite3`, `drizzle-orm`, `commander`, etc.
- Development dependencies: `typescript`, `vitest`, etc.
- Package configuration: `"type": "module"`, etc.

### 3. Environment Variable Validation

Validates environment variable configuration:

- Required variables based on provider type
- Format validation for API keys and URLs
- Value validation for boolean and enum settings
- Missing configuration with recommendations

### 4. Database Validation

Ensures database is properly configured:

- Database file exists
- Required tables are created
- Migrations are applied

## Issue Severity Levels

Issues are categorized by severity:

- **Critical**: Issues that prevent Task Master from functioning
- **Error**: Important issues that should be fixed
- **Warning**: Issues that may cause problems but aren't critical
- **Info**: Informational messages about potential improvements

## Automatic Fixing

The validation system can automatically fix many common issues:

- Install missing dependencies
- Add required configuration to package.json
- Set default environment variables
- Initialize database
- Create required directories

## Issue Categories

Issues are organized by component for easier understanding:

- **Project**: General project configuration issues
- **Database**: Database-related issues
- **AI Configuration**: AI provider configuration issues
- **CLI**: Command-line interface issues
- **Core**: Core functionality issues
- **Configuration**: Environment variable issues
- **TypeScript**: TypeScript configuration issues
- **UI**: User interface issues

## Examples

### Missing Dependencies

```
Database (1 issue)

  ✗ Missing required dependency: better-sqlite3
    SQLite database driver is required but not found in package.json.
    ✓ This issue can be automatically fixed
```

### Environment Variable Issues

```
AI Configuration (1 issue)

  ⚠ Missing AI provider type
    AI provider type is not set. Set AI_PROVIDER_TYPE to one of: openai, anthropic, custom-openai, mock
    ✓ This issue can be automatically fixed
```

### Database Issues

```
Database (1 issue)

  ⚠ Database file not found
    Database file not found at db/taskmaster.db. The database needs to be initialized.
    ✓ This issue can be automatically fixed
```

## Integration with Setup

The validation feature is integrated with the setup wizard:

1. At the end of configuration, you're prompted to validate
2. After validation, you can choose to fix issues
3. The wizard can automatically apply fixes

## Technical Implementation

The validation system:

- Uses `@clack/prompts` for interactive UI
- Checks file system for required files and directories
- Parses package.json for dependency information
- Loads environment variables using `dotenv`
- Runs commands using `execa` for fixes
- Organizes issues by component and severity