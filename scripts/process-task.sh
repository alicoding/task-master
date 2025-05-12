#!/bin/bash

# Process a single task - For testing the task processor
#
# This script provides a way to process a single task for testing purposes.

# Usage information
if [ $# -ne 1 ]; then
  echo "Usage: $0 <task-id>"
  echo "Example: $0 1.2"
  exit 1
fi

TASK_ID=$1

# Go to project root directory
cd "$(dirname "$0")/.." || exit 1

# Display banner
echo ""
echo "====================================="
echo "  Task Master - Task Processor Test"
echo "====================================="
echo ""

# Path to SQLite database
DB_PATH="./db/taskmaster.db"

# Check if sqlite3 is installed
if ! command -v sqlite3 &> /dev/null; then
    echo "Error: sqlite3 command not found. Please install it to run this script."
    exit 1
fi

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

# Get task information
echo "Fetching task with ID: $TASK_ID"
TASK_INFO=$(sqlite3 "$DB_PATH" "SELECT id, title, status, readiness, tags, description, parent_id, created_at, updated_at FROM tasks WHERE id = '$TASK_ID';")

if [ -z "$TASK_INFO" ]; then
    echo "Error: Task with ID $TASK_ID not found"
    exit 1
fi

# Parse task information
IFS="|" read -r ID TITLE STATUS READINESS TAGS DESCRIPTION PARENT_ID CREATED_AT UPDATED_AT <<< "$TASK_INFO"

# Display task information
echo ""
echo "Task $ID: $TITLE"
echo ""
echo "Status: $STATUS"
echo "Readiness: $READINESS"

# Parse tags (simple approach for display)
if [ ! -z "$TAGS" ]; then
    # Remove brackets and quotes
    TAGS_CLEANED=$(echo "$TAGS" | sed 's/\[//g' | sed 's/\]//g' | sed 's/"//g' | sed 's/,/ /g')
    echo "Tags: $(echo "$TAGS_CLEANED" | sed 's/\([^ ]*\)/#\1/g')"
fi

if [ ! -z "$PARENT_ID" ]; then
    echo "Parent: $PARENT_ID"
fi

if [ ! -z "$DESCRIPTION" ]; then
    echo ""
    echo "$DESCRIPTION"
fi

# Process the task
echo ""
echo "Processing task..."

# Determine the next status
if [ "$STATUS" = "todo" ]; then
    NEW_STATUS="in-progress"
    echo "Updating status from 'todo' to 'in-progress'"
elif [ "$STATUS" = "in-progress" ]; then
    NEW_STATUS="done"
    echo "Updating status from 'in-progress' to 'done'"
else
    NEW_STATUS="todo"
    echo "Resetting status from 'done' to 'todo'"
fi

# Update the task status
CURRENT_TIME=$(date +%s)
sqlite3 "$DB_PATH" "UPDATE tasks SET status = '$NEW_STATUS', updated_at = $CURRENT_TIME WHERE id = '$TASK_ID';"

if [ $? -ne 0 ]; then
    echo "Error: Failed to update task status"
    exit 1
fi

echo "Task $TASK_ID updated successfully!"
echo ""
echo "New task status: $NEW_STATUS"
echo "Task processing completed successfully!"
exit 0