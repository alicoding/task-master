#!/bin/bash

# Helper script to test specific fixes without applying them

# Check for required argument
if [ "$1" == "" ]; then
  echo "Usage: $0 <fix-type> [--apply]"
  echo "  fix-type: chalk, repo, arithmetic, import"
  echo "  --apply: Apply the fixes (without this flag, it's a dry run)"
  exit 1
fi

FIX_TYPE=$1
APPLY_MODE="--dry-run"

# Check if we should apply the fixes
if [ "$2" == "--apply" ]; then
  APPLY_MODE=""
fi

# Save current TypeScript errors
echo "Getting current TypeScript errors..."
CURRENT_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS")
echo "Current TypeScript errors: $CURRENT_ERRORS"

# Run the fixer for a specific pattern
echo "Testing fix for: $FIX_TYPE"
node scripts/fix-ts-errors.cjs --fix=$FIX_TYPE $APPLY_MODE

# If we applied the fixes, check the new error count
if [ "$APPLY_MODE" == "" ]; then
  echo "Getting new TypeScript errors count..."
  NEW_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS")
  echo "New TypeScript errors: $NEW_ERRORS"
  
  # Calculate reduction
  REDUCTION=$((CURRENT_ERRORS - NEW_ERRORS))
  PERCENT_REDUCTION=$(awk "BEGIN { printf \"%.1f\", ($REDUCTION / $CURRENT_ERRORS) * 100 }")
  
  echo "Reduced errors by: $REDUCTION ($PERCENT_REDUCTION%)"
fi