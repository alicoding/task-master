# TypeScript Error Analysis Report

Total Errors: 1582

## Error Categories

### TS2345: Argument type error
- Count: 634 (40.1%)
- Fix Strategy: Add type assertions to function arguments
- Examples:
  - `cli/commands/add/add-command.ts: Argument of type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to parameter of type 'ChalkStyle | undefined'.`
  - `cli/commands/add/add-command.ts: Argument of type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to parameter of type 'ChalkStyle | undefined'.`
  - `cli/commands/add/add-command.ts: Argument of type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to parameter of type 'ChalkStyle | undefined'.`
  - `cli/commands/add/add-command.ts: Argument of type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to parameter of type 'ChalkStyle | undefined'.`
  - `cli/commands/add/add-command.ts: Argument of type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to parameter of type 'ChalkStyle | undefined'.`

### OTHER: Other TypeScript errors
- Count: 511 (32.3%)
- Fix Strategy: Review individually
- Examples:
  - `cli/commands/interactive/index.ts: Module '../../ui/index' was resolved to '/Users/ali/tm/task-master/cli/ui/index.tsx', but '--jsx' is not set.`
  - `cli/commands/triage/index-enhanced.ts: Duplicate identifier 'ChalkColor'.`
  - `cli/commands/triage/index-enhanced.ts: Duplicate identifier 'ChalkColor'.`
  - `cli/commands/triage/index.ts: Duplicate identifier 'ChalkColor'.`
  - `cli/commands/triage/index.ts: Duplicate identifier 'ChalkColor'.`

### TS2339: Property does not exist on type
- Count: 192 (12.1%)
- Fix Strategy: Add missing properties to interfaces, use type assertions
- Examples:
  - `cli/commands/triage/lib/interactive-enhanced/index.ts: Property 'similarityScore' does not exist on type '{}'.`
  - `cli/commands/triage/lib/interactive.ts: Property 'filter' does not exist on type 'TaskOperationResult<{ id: string; title: string; description: string | null; body: string | null; status: "todo" | "in-progress" | "done"; createdAt: Date; updatedAt: Date; readiness: "draft" | "ready" | "blocked"; tags: string[] | null; parentId: string | null; metadata: unknown; }[]>'.`
  - `cli/commands/triage/lib/interactive.ts: Property 'filter' does not exist on type 'TaskOperationResult<{ id: string; title: string; description: string | null; body: string | null; status: "todo" | "in-progress" | "done"; createdAt: Date; updatedAt: Date; readiness: "draft" | "ready" | "blocked"; tags: string[] | null; parentId: string | null; metadata: unknown; }[]>'.`
  - `cli/commands/triage/lib/processor/similarity.ts: Property 'filter' does not exist on type 'TaskOperationResult<{ id: string; title: string; description: string | null; body: string | null; status: "todo" | "in-progress" | "done"; createdAt: Date; updatedAt: Date; readiness: "draft" | "ready" | "blocked"; tags: string[] | null; parentId: string | null; metadata: unknown; }[]>'.`
  - `cli/commands/triage/lib/processor/task-creation.ts: Property 'id' does not exist on type 'TaskOperationResult<{ id: string; title: string; description: string | null; body: string | null; status: "todo" | "in-progress" | "done"; createdAt: Date; updatedAt: Date; readiness: "draft" | "ready" | "blocked"; tags: string[] | null; parentId: string | null; metadata: unknown; }>'.`

### TS2322: Type assignment error
- Count: 83 (5.2%)
- Fix Strategy: Add type assertions, fix interface implementations
- Examples:
  - `cli/commands/triage/lib/interactive-enhanced/display/similar-tasks.ts: Type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to type 'ChalkColor'.`
  - `cli/commands/triage/lib/interactive-enhanced/display/similar-tasks.ts: Type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to type 'ChalkColor'.`
  - `cli/commands/triage/lib/interactive-enhanced/display/similar-tasks.ts: Type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to type 'ChalkColor'.`
  - `cli/commands/triage/lib/interactive-enhanced/display/similar-tasks.ts: Type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to type 'ChalkColor'.`
  - `cli/commands/triage/lib/interactive-enhanced/display/similar-tasks.ts: Type '"bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | ... 8 more ... | "whiteBright"' is not assignable to type 'ChalkColor'.`

### TS2305: Module has no exported member
- Count: 72 (4.6%)
- Fix Strategy: Add missing exports or fix import names
- Examples:
  - `cli/commands/triage/lib/interactive-enhanced/utils/colors.ts: Module '"../utils"' has no exported member 'ChalkColor'.`
  - `core/api/types.ts: Module '"../types"' has no exported member 'TaskSearch'.`
  - `core/api/types.ts: Module '"../types"' has no exported member 'TaskCreateInput'.`
  - `core/api/types.ts: Module '"../types"' has no exported member 'TaskUpdateInput'.`
  - `core/capability-map/visualizers/enhanced/dot-renderer.ts: Module '"../utils/index"' has no exported member 'getCapabilityProgress'.`

### TS2554: Expected X arguments, but got Y
- Count: 40 (2.5%)
- Fix Strategy: Fix function call argument count
- Examples:
  - `core/repository/base.ts: Expected 1-2 arguments, but got 0.`
  - `core/repository/base.ts: Expected 1-2 arguments, but got 0.`
  - `core/repository/base.ts: Expected 2-4 arguments, but got 1.`
  - `core/repository/base.ts: Expected 2-3 arguments, but got 1.`
  - `core/repository/creation.ts: Expected 2-3 arguments, but got 1.`

### TS2304: Cannot find name
- Count: 22 (1.4%)
- Fix Strategy: Import missing types or declare variables
- Examples:
  - `cli/commands/deduplicate/lib/merger-enhanced.ts: Cannot find name 'colorize'.`
  - `cli/commands/deduplicate/lib/merger-enhanced.ts: Cannot find name 'colorize'.`
  - `cli/commands/deduplicate/lib/merger.ts: Cannot find name 'formatTags'.`
  - `cli/commands/deduplicate/lib/merger.ts: Cannot find name 'formatTags'.`
  - `db/init.ts: Cannot find name 'BetterSQLite3Database'.`

### TS2307: Cannot find module or its corresponding type declarations
- Count: 18 (1.1%)
- Fix Strategy: Fix import paths using @/ path aliases, ensure proper module resolution
- Examples:
  - `cli/commands/triage/lib/interactive-enhanced/display/task-details.ts: Cannot find module '../../../../../core/graph' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/create-subtask.ts: Cannot find module '../../../../../core/repo' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/create-subtask.ts: Cannot find module '../../../../../core/types' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/mark-done.ts: Cannot find module '../../../../../core/repo' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/merge-task.ts: Cannot find module '../../../../../core/repo' or its corresponding type declarations.`

### TS2420: Class incorrectly implements interface
- Count: 6 (0.4%)
- Fix Strategy: Add missing methods and properties to class
- Examples:
  - `core/repository/index-clean.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<BaseTaskRepository, "sqlite" | "db">'.`
  - `core/repository/index-clean.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<TaskCreationRepository, "sqlite" | "db">'.`
  - `core/repository/index-clean.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<TaskMetadataRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<BaseTaskRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<TaskCreationRepository, "sqlite" | "db">'.`

### TS2416: Property not assignable to same property in base type
- Count: 4 (0.3%)
- Fix Strategy: Fix return types in derived classes to match base class
- Examples:
  - `core/repository/index-clean.ts: Property 'getChildTasks' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskHierarchyRepository, "sqlite" | "db">'.`
  - `core/repository/index-clean.ts: Property 'naturalLanguageSearch' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskSearchRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Property 'getChildTasks' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskHierarchyRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Property 'naturalLanguageSearch' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskSearchRepository, "sqlite" | "db">'.`

## Error Hotspots

- `cli/commands/triage/lib/interactive-enhanced/display`: 134 errors (8.5%)
- `src/cli/commands/deduplicate/lib`: 116 errors (7.3%)
- `cli/commands/deduplicate/lib`: 93 errors (5.9%)
- `core/repository`: 93 errors (5.9%)
- `core/api/handlers`: 78 errors (4.9%)
- `src/core/api/handlers`: 73 errors (4.6%)
- `cli/commands/triage`: 70 errors (4.4%)
- `src/cli/commands/triage`: 66 errors (4.2%)
- `src/core/repository`: 50 errors (3.2%)
- `core/dod`: 49 errors (3.1%)

## Fix Priority

1. Foundation types in core/types.ts and db/schema.ts
2. Repository interface implementations
3. Module resolution issues
4. String literal type assertions
5. Other property and method errors
