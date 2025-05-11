# Fixing the "no such column: description" Error

This guide provides step-by-step instructions for resolving the SQLite error you're experiencing with the Task Master CLI.

## The Problem

The application is trying to access database columns (`description` and `body`) that haven't been properly added to your SQLite database, resulting in the error:

```
SqliteError: no such column: 'description' - should this be a string literal in single-quotes?
```

## Solution Overview

We've fixed this issue by:

1. Creating a direct database fix script that properly adds the missing columns
2. Making the repository code more resilient to handle databases with or without these columns
3. Updating the documentation to include troubleshooting steps

## Steps to Fix

### 1. Run the Database Fix Script

This script will directly modify your SQLite database to add the missing columns:

```bash
# Run the database fix script
node scripts/fix-database.js

# Or use the npm script shortcut
npm run db:fix
```

The script will:
- Back up your existing database (just in case)
- Check the current schema
- Add the missing `description` and `body` columns if they don't exist
- Verify the changes were successful

### 2. Verify the Fix

After running the fix script, try using the CLI again:

```bash
npm run dev -- show
```

The error should be resolved, and you should be able to view your tasks without any issues.

### 3. Use the New Fields

Once the database has been fixed, you can start using the description and body fields:

```bash
# Create a task with description and body
npm run dev -- add --title "Test task" --description "Short description" --body "Detailed information here"

# View the task details
npm run dev -- show <task-id>

# Update an existing task
npm run dev -- update --id <task-id> --description "Updated description"
```

### 4. For Interactive Use

You can also use the interactive mode for a more user-friendly experience:

```bash
# Create a task interactively
npm run dev -- add --interactive

# Update a task interactively
npm run dev -- update --id <task-id> --interactive
```

## Technical Details

The issue was occurring because the database schema in the code (`db/schema.ts`) included the `description` and `body` fields, but these columns weren't actually present in your SQLite database.

The error happens during query execution when the ORM tries to select these non-existent columns.

Our fix works by:
1. Directly using SQLite ALTER TABLE statements to add the missing columns
2. Adding fallback mechanisms in the repository code to handle cases where the columns don't exist yet
3. Providing clear error messages directing users to run the fix script

## If You Continue to Have Issues

If you're still experiencing problems after running the fix script:

1. Check for error messages in the console which may provide additional insight
2. Try restoring from the backup that the script created (see the script's output for backup location)
3. As a last resort, delete your database file and run `npm run db:init` to create a fresh database (note that this will delete all your tasks)

## Additional Documentation

For more information about the new description and body fields, see:
- [Task Descriptions Documentation](docs/TASK_DESCRIPTIONS.md)