# TaskMaster CLI Usage Guide

## Basic Commands

```bash
# View tasks
npm run dev -- show                  # Show all tasks
npm run dev -- show --id=<task-id>   # Show specific task
npm run dev -- next                  # Show next available task

# Create tasks
npm run dev -- add --title="Task title" --description="Details" --priority=high
npm run dev -- add --parent=<parent-id> --title="Subtask title"  # Create subtask

# Update tasks
npm run dev -- update --id=<task-id> --status=in_progress  # Update status
npm run dev -- update --id=<task-id> --status=completed    # Mark complete
npm run dev -- update --id=<task-id> --add-tag=typescript  # Add tags

# Search tasks
npm run dev -- search --query="typescript"  # Search by keyword
npm run dev -- search --tags=typescript     # Search by tag
```

## Workflow Patterns

1. **Check existing tasks before starting work**
   ```bash
   npm run dev -- show  # See all tasks
   npm run dev -- next  # Find recommended next task
   ```

2. **Create atomic, trackable tasks**
   ```bash
   # For major features, create parent task
   npm run dev -- add --title="Fix TypeScript errors" --tags=typescript
   
   # Create specific subtasks with clear scope
   npm run dev -- add --parent=119 --title="Fix db schema type errors" --tags=typescript,db
   ```

3. **Update task status as you work**
   ```bash
   # Mark task as in progress when starting
   npm run dev -- update --id=119.1 --status=in_progress
   
   # Mark task as completed when done
   npm run dev -- update --id=119.1 --status=completed
   ```

4. **Track related work with consistent tags**
   ```bash
   # Add relevant tags for easy filtering
   npm run dev -- update --id=119 --add-tag=typescript --add-tag=refactor
   
   # Search by tag to find related tasks
   npm run dev -- search --tags=typescript
   ```

## Best Practices

1. **Create clear, specific task titles** - Should describe one atomic unit of work
2. **Use hierarchical tasks** - Parent tasks for features, subtasks for implementation details
3. **Tag consistently** - Use tags to categorize by feature area, type of work, priority
4. **Update status in real-time** - Keep the task board accurate as you work
5. **Add notes to tasks** - Document key decisions, approaches, and relevant files
6. **Check dependencies** - Mark tasks as blocked by others when appropriate