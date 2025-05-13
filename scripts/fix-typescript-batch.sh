#!/bin/bash

# Script to fix TypeScript errors using grep and sed

echo "Starting TypeScript error fixes..."

# Fix ChalkColor issues
echo "Fixing ChalkColor issues"

# 1. Remove duplicate imports
find ./cli -name "*.ts" -type f -exec grep -l "import.*ChalkColor.*from.*chalk-utils" {} \; | while read file; do
    # Check if file has duplicate ChalkColor imports
    if grep -q "import.*ChalkColor.*ChalkColor" "$file"; then
        echo "Removing duplicate ChalkColor import in $file"
        # Keep only the first ChalkColor import
        sed -i '' -E 's/import \{.*ChalkColor, asChalkColor.*\} from ".*chalk-utils";//' "$file"
    fi
done

# 2. Replace asChalkColor calls
find ./cli -name "*.ts" -type f -exec grep -l "asChalkColor" {} \; | while read file; do
    echo "Replacing asChalkColor calls in $file"
    sed -i '' -E "s/\\(asChalkColor\\('([^']*)'\\)\\)/'\\1'/g" "$file"
done

# Fix parentId vs parent_id issues
echo "Fixing parent_id issues"
find ./core/repository -name "*.ts" -type f -exec grep -l "parent_id" {} \; | while read file; do
    echo "Fixing parent_id references in $file"
    # Replace task.parent_id with task.parentId
    sed -i '' -E 's/([^\.])parent_id/\\1parentId/g' "$file"
    # Replace tasks.parent_id with tasks.parentId
    sed -i '' -E 's/tasks\.parent_id/tasks.parentId/g' "$file"
done

# Fix BetterSQLite3Database typing error
echo "Fixing BetterSQLite3Database typing error"
file="./cli/commands/setup/project-init.ts"
if grep -q "BetterSQLite3Database" "$file"; then
    echo "Fixing BetterSQLite3Database in $file"
    sed -i '' -E 's/const dbInitContent: BetterSQLite3Database<Record<string, unknown>>/const dbInitContent: string/g' "$file"
fi

# Fix repository parameter count errors - this one is more complex and might need manual fixing
echo "Check repository parameter count errors in index.ts and index-clean.ts"
echo "Specific lines to check: RepositoryFactory.initialize() calls that have arguments but should have none"

# Fix arithmetic operations in enhanced.ts
echo "Check arithmetic operation errors in enhanced.ts"
echo "Specific issue: string/object being used in arithmetic operations"

# Fix missing imports in creation.ts
echo "Check missing import errors in creation.ts"
echo "Possible issues: 'tasks' vs 'Task', 'dependencies', 'NewTask' imports"

echo "Batch fixes complete. Run 'npx tsc --noEmit' to check remaining errors."