# Task Master CLI Command Reference

This reference provides documentation for all available commands in the Task Master CLI.

## Available Commands

### add

Add a new task

#### Options

- `--child-of <id>`: Make this task a child of the specified task ID
- `--after <id>`: Add this task after the specified task ID
- `--status <status>`: Task status (todo, in-progress, done)
- `--readiness <readiness>`: Task readiness (draft, ready, blocked)
- `--tags <tags...>`: Task tags
- `--metadata <json>`: JSON string with task metadata
- `--force`: Skip similarity check and confirmation
- `--dry-run`: Check for similarities without creating the task
- `--no-color`: Disable colored output

---

### api

API commands for machine consumption and Roo integration

#### Options

- `--input <file>`: JSON file with commands and options
- `--output <file>`: Output file for results (default stdout)

#### Subcommands

- **batch**: Execute batch operations for external tool integration
- **export**: Export all tasks in JSON format for external tools
- **import**: Import tasks from JSON file

---

### deduplicate

Find and manage duplicate tasks

#### Options

- `--status <status>`: Filter by status (todo, in-progress, done)
- `--tag <tags...>`: Filter by tag
- `--auto-merge`: Automatically suggest merges for highly similar tasks
- `--no-color`: Disable colored output
- `--json`: Output results in JSON format
- `--dry-run`: Show duplicates without taking action

---

### metadata

Manage task metadata

#### Options

- `--field <field>`: Get a specific metadata field

---

### next

Show the next task to work on

#### Options

- `--filter <tag>`: Filter by tag
- `--status <status>`: Filter by status
- `--readiness <readiness>`: Filter by readiness

---

### remove

Remove a task

#### Options

- `--force`: Skip confirmation
- `--with-children`: Remove all child tasks as well
- `--dry-run`: Show what would be removed without making changes

---

### search

Search for tasks

#### Options

- `--query <query>`: Search in task titles and metadata (NLP-enhanced)
- `--status <status>`: Filter by status (todo, in-progress, done)
- `--readiness <readiness>`: Filter by readiness (draft, ready, blocked)
- `--tag <tags...>`: Filter by tags (can specify multiple)
- `--metadata <json>`: Filter by metadata as JSON string
- `--explain`: Show explanation of how search was processed
- `--similar <title>`: Find tasks similar to specified title
- `--no-fuzzy`: Disable fuzzy matching
- `--no-color`: Disable colored output

---

### show

Show tasks

#### Options

- `--graph`: Show tasks in a graph format (deprecated, use `show graph` instead)
- `--filter <filter>`: Filter tasks by tag

---

### triage

Process batches of tasks from a JSON plan file or interactively

#### Options

- `--plan <file>`: JSON file containing a task plan to process
- `--interactive`: Run in interactive mode to triage tasks one by one
- `--dry-run`: Show what would happen without making changes
- `--auto-merge`: Automatically suggest merges for similar tasks
- `--no-color`: Disable colored output

---

### update

Update tasks

#### Options

- `--id <id>`: Task ID to update
- `--title <title>`: New task title
- `--status <status>`: New task status (todo, in-progress, done)
- `--readiness <readiness>`: New task readiness (draft, ready, blocked)
- `--tags <tags...>`: New task tags
- `--metadata <json>`: JSON string with metadata to add/update (PATCH-style)
- `--dry-run`: Show what would be updated without making changes

---

## Usage Examples

Here are some common usage examples for Task Master CLI:

```bash
# Create a new task
tm add --title "Implement login form"

# List all tasks
tm show

# Show task hierarchy as a tree
tm show graph

# Show the next task to work on
tm next

# Search for tasks matching specific text
tm search --query "user interface"

# Mark a task as completed
tm update --id 5 --status done

# Find and merge duplicate tasks
tm deduplicate
```

> Note: All commands support detailed help with `--help` flag, e.g., `tm add --help`
