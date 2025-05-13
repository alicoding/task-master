# TypeScript Error Analysis Report

Total Errors: 1318

## Error Categories

### OTHER: Other TypeScript errors
- Count: 715 (54.2%)
- Fix Strategy: Review individually
- Examples:
  - `cli/commands/add/add-command.ts: '"@/cli/utils/chalk-utils"' has no exported member named 'asChalkColor'. Did you mean 'ChalkColor'?`
  - `cli/commands/add/add-command.ts: Variable 'similarTasks' implicitly has type 'any[]' in some locations where its type cannot be determined.`
  - `cli/commands/add/add-command.ts: Variable 'similarTasks' implicitly has an 'any[]' type.`
  - `cli/commands/add/interactive-form.ts: '"@/cli/utils/chalk-utils"' has no exported member named 'asChalkColor'. Did you mean 'ChalkColor'?`
  - `cli/commands/deduplicate/index.ts: '"@/cli/utils/chalk-utils"' has no exported member named 'asChalkColor'. Did you mean 'ChalkColor'?`

### TS2339: Property does not exist on type
- Count: 266 (20.2%)
- Fix Strategy: Add missing properties to interfaces, use type assertions
- Examples:
  - `cli/commands/dod/index.ts: Property 'dod' does not exist on type '{}'.`
  - `cli/commands/nlp-profile/index.ts: Property 'train' does not exist on type 'Promise<NlpServiceInterface>'.`
  - `cli/commands/nlp-profile/index.ts: Property 'description' does not exist on type '{}'.`
  - `cli/commands/nlp-profile/index.ts: Property 'processQuery' does not exist on type 'Promise<NlpServiceInterface>'.`
  - `cli/commands/nlp-profile/index.ts: Property 'extractSearchFilters' does not exist on type 'Promise<NlpServiceInterface>'.`

### TS2345: Argument type error
- Count: 116 (8.8%)
- Fix Strategy: Add type assertions to function arguments
- Examples:
  - `cli/commands/deduplicate/lib/formatter.ts: Argument of type 'string' is not assignable to parameter of type 'ChalkColor | undefined'.`
  - `cli/commands/deduplicate/lib/formatter.ts: Argument of type 'string' is not assignable to parameter of type 'ChalkColor | undefined'.`
  - `cli/commands/search/search-handler-clean.ts: Argument of type 'boolean | undefined' is not assignable to parameter of type 'boolean'.`
  - `cli/commands/search/search-handler.ts: Argument of type 'boolean | undefined' is not assignable to parameter of type 'boolean'.`
  - `cli/commands/triage/lib/interactive-enhanced/display/similar-tasks.ts: Argument of type '(text: string, color?: import("/Users/ali/tm/task-master/cli/commands/triage/lib/utils").ChalkColor | undefined, style?: import("/Users/ali/tm/task-master/cli/commands/triage/lib/utils").ChalkStyle | undefined) => string' is not assignable to parameter of type '(text: string, color?: import("@/cli/utils/chalk-utils").ChalkColor | undefined, style?: import("/Users/ali/tm/task-master/cli/commands/triage/lib/utils").ChalkStyle | undefined) => string'.`

### TS2305: Module has no exported member
- Count: 75 (5.7%)
- Fix Strategy: Add missing exports or fix import names
- Examples:
  - `cli/commands/show/index.ts: Module '"../../../core/types"' has no exported member 'HierarchyTask'.`
  - `cli/commands/show/show-graph.ts: Module '"../../../core/types"' has no exported member 'HierarchyTask'.`
  - `cli/commands/triage/lib/interactive-enhanced/utils/colors.ts: Module '"../utils"' has no exported member 'ChalkColor'.`
  - `core/api/types.ts: Module '"../types"' has no exported member 'TaskSearch'.`
  - `core/api/types.ts: Module '"../types"' has no exported member 'TaskCreateInput'.`

### TS2322: Type assignment error
- Count: 48 (3.6%)
- Fix Strategy: Add type assertions, fix interface implementations
- Examples:
  - `cli/commands/search/search-handler-clean.ts: Type 'string' is not assignable to type 'TaskStatus | TaskStatus[] | undefined'.`
  - `cli/commands/search/search-handler-clean.ts: Type 'string' is not assignable to type 'TaskReadiness | TaskReadiness[] | undefined'.`
  - `cli/commands/search/search-handler-clean.ts: Type 'string' is not assignable to type 'TaskStatus | TaskStatus[] | undefined'.`
  - `cli/commands/search/search-handler-clean.ts: Type 'string' is not assignable to type 'TaskReadiness | TaskReadiness[] | undefined'.`
  - `cli/commands/search/search-handler.ts: Type 'string' is not assignable to type 'TaskStatus | TaskStatus[] | undefined'.`

### TS2554: Expected X arguments, but got Y
- Count: 48 (3.6%)
- Fix Strategy: Fix function call argument count
- Examples:
  - `core/repository/base.ts: Expected 1-2 arguments, but got 0.`
  - `core/repository/base.ts: Expected 1-2 arguments, but got 0.`
  - `core/repository/base.ts: Expected 2-4 arguments, but got 1.`
  - `core/repository/base.ts: Expected 2-3 arguments, but got 1.`
  - `core/repository/creation.ts: Expected 2-3 arguments, but got 1.`

### TS2304: Cannot find name
- Count: 22 (1.7%)
- Fix Strategy: Import missing types or declare variables
- Examples:
  - `cli/commands/search/search-handler.ts: Cannot find name 'asChalkColor'.`
  - `cli/commands/search/search-handler.ts: Cannot find name 'asChalkColor'.`
  - `cli/commands/search/search-handler.ts: Cannot find name 'asChalkColor'.`
  - `cli/commands/search/search-handler.ts: Cannot find name 'asChalkColor'.`
  - `cli/commands/search/search-handler.ts: Cannot find name 'asChalkColor'.`

### TS2307: Cannot find module or its corresponding type declarations
- Count: 14 (1.1%)
- Fix Strategy: Fix import paths using @/ path aliases, ensure proper module resolution
- Examples:
  - `cli/commands/triage/lib/interactive-enhanced/display/task-details.ts: Cannot find module '../../../../../core/graph' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/create-subtask.ts: Cannot find module '../../../../../core/repo' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/create-subtask.ts: Cannot find module '../../../../../core/types' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/mark-done.ts: Cannot find module '../../../../../core/repo' or its corresponding type declarations.`
  - `cli/commands/triage/lib/interactive-enhanced/handlers/merge-task.ts: Cannot find module '../../../../../core/repo' or its corresponding type declarations.`

### TS2420: Class incorrectly implements interface
- Count: 8 (0.6%)
- Fix Strategy: Add missing methods and properties to class
- Examples:
  - `core/repository/index-clean.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<BaseTaskRepository, "sqlite" | "db">'.`
  - `core/repository/index-clean.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<TaskCreationRepository, "sqlite" | "db">'.`
  - `core/repository/index-clean.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<TaskMetadataRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<BaseTaskRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Class 'TaskRepository' incorrectly implements interface 'Omit<TaskCreationRepository, "sqlite" | "db">'.`

### TS2416: Property not assignable to same property in base type
- Count: 6 (0.5%)
- Fix Strategy: Fix return types in derived classes to match base class
- Examples:
  - `core/repository/index-clean.ts: Property 'getChildTasks' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskHierarchyRepository, "sqlite" | "db">'.`
  - `core/repository/index-clean.ts: Property 'naturalLanguageSearch' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskSearchRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Property 'getChildTasks' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskHierarchyRepository, "sqlite" | "db">'.`
  - `core/repository/index.ts: Property 'naturalLanguageSearch' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskSearchRepository, "sqlite" | "db">'.`
  - `src/core/repository/index-clean.ts: Property 'searchTasksLegacy' in type 'TaskRepository' is not assignable to the same property in base type 'Omit<TaskSearchRepository, "sqlite" | "db" | "_db" | "_sqlite">'.`

## Error Hotspots

- `src/core/repository`: 87 errors (6.6%)
- `core/repository`: 84 errors (6.4%)
- `core/api/handlers`: 65 errors (4.9%)
- `src/cli/commands/deduplicate/lib`: 60 errors (4.6%)
- `src/core/api/handlers`: 60 errors (4.6%)
- `core/dod`: 49 errors (3.7%)
- `src/core/dod`: 49 errors (3.7%)
- `core/capability-map/visualizers/enhanced`: 40 errors (3.0%)
- `src/core/capability-map/visualizers/enhanced`: 40 errors (3.0%)
- `src/core/capability-map`: 39 errors (3.0%)

## Fix Priority

1. Foundation types in core/types.ts and db/schema.ts
2. Repository interface implementations
3. Module resolution issues
4. String literal type assertions
5. Other property and method errors
