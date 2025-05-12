#!/bin/bash

# Process Tasks - Shell wrapper for standalone task processor
#
# This script provides a reliable way to run the standalone task processor
# with proper error handling and cleanup.

# Go to project root directory
cd "$(dirname "$0")/.." || exit 1

# Display banner
echo ""
echo "====================================="
echo "  Task Master - Continuous Processor"
echo "====================================="
echo ""

# Run the standalone task processor
echo "Starting standalone task processor..."
echo "Note: This may take a few minutes to process all tasks..."
npx tsx scripts/standalone-task-processor.ts

# Check exit code
if [ $? -ne 0 ]; then
  echo "Error: Task processor exited with errors"
  exit 1
fi

echo "Task processing completed successfully!"
exit 0