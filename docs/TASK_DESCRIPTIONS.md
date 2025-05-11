# Task Descriptions and Body Content

This document describes the new task description and body content features in Task Master.

## Overview

Tasks in Task Master now support two additional text fields:

1. **Description**: A brief summary or short description of the task
2. **Body**: Detailed information, instructions, or notes about the task

These fields enable more structured and detailed task information, similar to issue trackers like GitHub Issues or Linear.

## Database Migration

If you're upgrading from a previous version, you need to run the database fix script to add these fields:

```bash
# Run the database fix script directly
node scripts/fix-database.js

# Or use the npm script
npm run db:fix
```

This will add the necessary columns to your database without affecting existing tasks.

### Troubleshooting

If you encounter an error like:

```
SqliteError: no such column: 'description'
```

It means the database schema needs to be updated. Run the fix script as shown above to resolve this issue.

## Using the New Fields

### Adding Tasks with Descriptions and Body Content

You can provide description and body when creating a task:

```bash
# Add a task with a description
tm add --title "Implement login form" --description "Create UI login component"

# Add a task with description and body
tm add --title "Implement login form" \
       --description "Create UI login component" \
       --body "Requirements:\n- Email/password fields\n- Validation\n- Error handling\n- Remember me option"
```

The body field supports multi-line text by using `\n` for line breaks.

### Interactive Mode

You can also use interactive mode for a more user-friendly experience:

```bash
tm add --interactive
```

### Updating Descriptions and Body

To update an existing task:

```bash
# Update description
tm update --id 1 --description "New description"

# Update body
tm update --id 1 --body "New detailed information"

# Interactive update
tm update --id 1 --interactive
```

## Displaying Tasks

The improved display shows descriptions and body content when available:

```bash
# Show a single task with all details
tm show 1
```

## Working with Existing Tasks

Tasks created before this update will continue to work normally:

- Existing tasks will have `null` values for description and body
- The UI will not display these fields if they are empty
- You can add descriptions and body content to existing tasks using the update command

## Technical Details

The enhancement includes:

1. Database schema changes (new columns)
2. Updated TypeScript interfaces
3. Enhanced repository methods
4. Improved CLI commands and display formatting
5. Backward compatibility with existing tasks