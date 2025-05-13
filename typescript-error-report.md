# TypeScript Error Analysis

## Summary

- Total Errors: 1247
- Files with Errors: 223

## Errors by Severity

| Severity | Count | % of Total |
|----------|-------|------------|
| critical | 261 | 20.93% |
| high | 306 | 24.54% |
| medium | 680 | 54.53% |
| low | 0 | 0.00% |

## Errors by Category

| Category | Description | Count | Severity | % of Total |
|----------|-------------|-------|----------|------------|
| otherErrors | Other errors | 399 | medium | 32.00% |
| missingProperties | Missing property on type | 236 | high | 18.93% |
| typeAnnotation | Missing type annotations | 145 | medium | 11.63% |
| nullUndefined | Null/undefined checks needed | 136 | medium | 10.91% |
| importErrors | Import errors | 104 | critical | 8.34% |
| moduleNotFound | Module or export not found | 91 | critical | 7.30% |
| syntaxError | Syntax errors | 48 | critical | 3.85% |
| typeCompatibility | Type compatibility issues | 46 | high | 3.69% |
| schemaErrors | Schema-related errors | 18 | critical | 1.44% |
| interfaceImplementation | Interface implementation issues | 16 | high | 1.28% |
| functionSignature | Function signature mismatch | 8 | high | 0.64% |

## Errors by File Category

| Category | Count | % of Total |
|----------|-------|------------|
| other | 528 | 42.34% |
| core | 392 | 31.44% |
| cli | 314 | 25.18% |
| db | 13 | 1.04% |

## Top 20 Files with Most Errors

| File | Error Count |
|------|-------------|
| core/dod/manager.ts | 42 |
| src/core/dod/manager.ts | 42 |
| src/cli/commands/deduplicate/lib/formatter-enhanced.ts | 31 |
| src/cli/commands/dod/index.ts | 29 |
| src/cli/commands/update/interactive-form.ts | 28 |
| core/capability-map/enhanced-discovery.ts | 25 |
| src/core/capability-map/enhanced-discovery.ts | 25 |
| core/nlp/processor.ts | 18 |
| src/cli/commands/map/index-enhanced.ts | 18 |
| src/core/nlp/processor.ts | 18 |
| core/api/service.ts | 15 |
| core/capability-map/visualizers/enhanced/text-renderer.ts | 15 |
| core/repository/base.ts | 15 |
| src/core/api/service.ts | 15 |
| src/core/capability-map/visualizers/enhanced/text-renderer.ts | 15 |
| src/core/repository/base.ts | 15 |
| src/core/repository/hierarchy.ts | 15 |
| core/api/handlers/task-metadata.ts | 13 |
| src/cli/commands/metadata/metadata-command.ts | 13 |
| src/core/api/handlers/task-metadata.ts | 13 |

## Sample Critical Errors

### importErrors in cli/commands/setup/project-init.ts:429

```
Cannot find name 'BetterSQLite3Database'.
```

### moduleNotFound in cli/commands/show/index.ts:4

```
Module '"../../../core/types"' has no exported member 'HierarchyTask'.
```

### moduleNotFound in cli/commands/show/show-graph.ts:9

```
Module '"../../../core/types"' has no exported member 'HierarchyTask'.
```

### syntaxError in cli/commands/triage/index-enhanced.ts:304

```
Duplicate identifier 'ChalkColor'.
```

### syntaxError in cli/commands/triage/index-enhanced.ts:305

```
Duplicate identifier 'ChalkColor'.
```

### syntaxError in cli/commands/triage/index.ts:303

```
Duplicate identifier 'ChalkColor'.
```

### syntaxError in cli/commands/triage/index.ts:304

```
Duplicate identifier 'ChalkColor'.
```

### syntaxError in cli/commands/triage/lib/interactive-enhanced/display/action-menu.ts:5

```
Duplicate identifier 'ChalkColor'.
```

### syntaxError in cli/commands/triage/lib/interactive-enhanced/display/action-menu.ts:6

```
Duplicate identifier 'ChalkColor'.
```

### syntaxError in cli/commands/triage/lib/interactive-enhanced/display/dependencies.ts:5

```
Duplicate identifier 'ChalkColor'.
```

## Most Common Error Messages

| Error Message | Count |
|--------------|-------|
| Cannot find name 'ChalkColor'. | 98 |
| Duplicate identifier 'ChalkColor'. | 48 |
| Argument of type 'string' is not assignable to parameter of type 'ChalkColor | undefined'. | 38 |
| Property 'metadata' does not exist on type 'TaskOperationResult<any>'. | 33 |
| 'config' is possibly 'undefined'. | 32 |
| Parameter 'tag' implicitly has an 'any' type. | 29 |
| 'result.data' is possibly 'undefined'. | 28 |
| Property 'from' does not exist on type 'any[]'. | 26 |
| Argument of type 'TaskOperationResult<HierarchyTask[]>' is not assignable to parameter of type 'Hier... | 24 |
| Expected 1-2 arguments, but got 0. | 22 |
| Module '"@/core/types"' declares 'Task' locally, but it is not exported. | 21 |
| Parameter 'task' implicitly has an 'any' type. | 20 |
| 'error' is of type 'unknown'. | 18 |
| Property 'length' does not exist on type 'TaskOperationResult<any[]>'. | 18 |
| Argument of type 'string[]' is not assignable to parameter of type 'string'. | 18 |
| '"@/db/schema"' has no exported member named 'Task'. Did you mean 'tasks'? | 17 |
| 'projectDoD' is possibly 'undefined'. | 16 |
| Object is possibly 'undefined'. | 14 |
| Property 'parentId' does not exist on type 'TaskOperationResult<any>'. | 14 |
| Property 'title' does not exist on type 'TaskOperationResult<any>'. | 12 |
