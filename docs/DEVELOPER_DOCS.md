# Task Master - Developer Documentation

This document provides comprehensive technical documentation for Task Master, a structured CLI task engine with SQLite + Drizzle.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Concepts](#core-concepts)
3. [Command System](#command-system)
4. [Repository Pattern](#repository-pattern)
5. [Graph Visualization](#graph-visualization)
6. [API Layer](#api-layer)
7. [NLP Features](#nlp-features)
8. [AI Integration](#ai-integration)
9. [Testing](#testing)
10. [Building and Running](#building-and-running)

## Project Structure

The Task Master project is organized into several key directories:

- `cli/`: Command-line interface components
  - `commands/`: Individual CLI commands
  - `helpers/`: CLI helper utilities
- `core/`: Core business logic
  - `repository/`: Database access components
  - `graph/`: Task graph visualization
  - `api/`: Shared API layer
  - `ai/`: AI integration
- `db/`: Database components
  - `migrations/`: Database schema migrations
  - `schema.ts`: Drizzle schema definitions
- `docs/`: Documentation files
- `test/`: Test files
- `examples/`: Example code showing API usage

## Core Concepts

### Tasks

Tasks are the fundamental data structure in Task Master. A task has the following properties:

- `id`: Unique identifier (string)
- `title`: Task title (string)
- `status`: Current status (`todo`, `in-progress`, `done`)
- `readiness`: Readiness state (`draft`, `ready`, `blocked`)
- `tags`: Array of tag strings
- `parentId`: Parent task ID for hierarchical relationships
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `metadata`: Additional structured data (JSON)

### Task Relationships

Tasks can be organized in a hierarchical structure through parent-child relationships. This enables:

- Breaking down complex tasks into subtasks
- Visualizing task hierarchies as trees or graphs
- Tracking progress at different levels of detail

### Task Status

Task status represents the current progress state:

- `todo`: Not yet started
- `in-progress`: Currently being worked on
- `done`: Completed

### Task Readiness

Task readiness indicates whether a task is ready to be worked on:

- `draft`: Still being defined or planned
- `ready`: Ready to be started
- `blocked`: Cannot be started due to dependencies

## Command System

Task Master uses Commander.js for its CLI structure. Each command is defined in a separate module under `cli/commands/`.

### Command Structure

Commands follow a consistent pattern:

```typescript
export function createCommandName() {
  const command = new Command('name')
    .description('Command description')
    .option('--option <value>', 'Option description')
    .action(async (options) => {
      // Command implementation
    });
    
  return command;
}
```

### Command Registration

Commands are registered in `cli/entry.ts` using the `program.addCommand()` method.

### Help System

Task Master uses a custom help formatter to provide rich help information:

- Command descriptions
- Usage examples with explanations
- Additional notes and tips
- Related commands ("see also")

## Repository Pattern

Task Master uses the Repository pattern to abstract database access, allowing for consistent data manipulation and easier testing.

### Repository Structure

The repository is divided into functional areas:

- `base.ts`: Common database operations
- `creation.ts`: Task creation operations
- `hierarchy.ts`: Hierarchical task relationships
- `search.ts`: Task search operations
- `metadata.ts`: Metadata operations

### Database Schema

The database schema is defined using Drizzle ORM in `db/schema.ts`:

```typescript
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull().default('todo'),
  readiness: text('readiness').notNull().default('draft'),
  tags: text('tags').notNull().default('[]'),
  parentId: text('parent_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  metadata: text('metadata').notNull().default('{}')
});
```

### Migrations

Database migrations are managed using Drizzle Kit in the `db/migrations/` directory.

## Graph Visualization

Task Master provides powerful graph visualization capabilities for tasks through the `TaskGraph` class.

### Visualization Formats

- **Text**: ASCII/Unicode tree visualizations
  - Simple format: Basic indented view
  - Tree format: Unicode tree with symbols
  - Detailed format: Verbose with all task details
  - Compact format: Condensed view for many tasks

- **JSON**: Structured JSON formats
  - Tree format: Nested parent-child structure
  - Flat format: All tasks with references
  - AI format: Enhanced with metadata for AI consumption

- **DOT**: GraphViz DOT format for external visualization tools

### Colorization

Text output can be colorized using chalk to enhance readability:

- Status colors: todo (blue), in-progress (yellow), done (green)
- Readiness colors: draft (gray), ready (green), blocked (red)
- Structure colors: IDs, relationships, metadata

## API Layer

Task Master provides a comprehensive API layer for integration with UIs and AI systems.

### Core Components

- `ApiService`: Core service for accessing Task Master functionality
- `ApiClient`: JavaScript client for external applications
- `ApiRouter`: Integration point for HTTP frameworks

### Operation Types

- `add`: Create new tasks
- `update`: Modify existing tasks
- `delete`: Remove tasks
- `get`: Retrieve specific tasks
- `search`: Find tasks matching criteria
- `export`: Export tasks in various formats
- `import`: Import tasks from external sources

### Batch Operations

The API supports batch operations to execute multiple operations in a single request:

```json
{
  "operations": [
    { "type": "add", "data": { "title": "New task" } },
    { "type": "update", "data": { "id": "123", "status": "done" } }
  ]
}
```

## NLP Features

Task Master includes natural language processing capabilities to enhance search and similarity detection.

### Key NLP Components

- `NlpService`: Central service for NLP functionality
- Tokenization and stemming for improved text matching
- Synonym expansion for better search results
- Fuzzy matching with Levenshtein distance
- Semantic similarity scoring

### NLP-Enhanced Search

The search functionality uses NLP to provide more intelligent results:

- Matching variations of words (stemming)
- Finding related terms (synonyms)
- Handling typos and spelling variations (fuzzy matching)
- Extracting concepts from natural language queries

## AI Integration

Task Master integrates with AI services to provide intelligent task management features.

### AI Providers

- `OpenAiProvider`: Integration with OpenAI models (GPT-4, etc.)
- `AnthropicProvider`: Integration with Anthropic models (Claude)
- `MockAiProvider`: Mock implementation for testing

### AI Operations

- Summarizing tasks
- Prioritizing tasks
- Generating subtasks
- Suggesting tags
- Analyzing task complexity and dependencies
- Converting text descriptions to structured tasks

### Configuration

AI providers can be configured through environment variables:

```bash
export AI_PROVIDER_TYPE=openai
export OPENAI_API_KEY=your_api_key
export OPENAI_MODEL=gpt-4
```

## Testing

Task Master uses uvu for testing, with tests located in the `test/` directory.

### Test Structure

Tests are organized to mirror the project structure:

- `test/commands/`: CLI command tests
- `test/core/`: Core logic tests
- `test/db/`: Database tests

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test test/core/repo.test.ts
```

### Test Helpers

The `test/commands/test-helpers.ts` file provides utilities for testing CLI commands:

- Capturing console output
- Creating temporary test files
- Setting up and cleaning up test environments

## Building and Running

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd task-master

# Install dependencies
npm install

# Initialize the database
npm run db:init
```

### Development

```bash
# Run in development mode with live TS compilation
npm run dev -- [command]

# Examples:
npm run dev -- add --title "New task"
npm run dev -- show
```

### Building

```bash
# Build the project
npm run build

# The build process compiles TypeScript to JavaScript in the same directory structure
```

### Running the Built Version

```bash
# After building, the CLI can be run with:
node cli/entry.js [command]

# Or, if installed globally:
tm [command]
```

---

## Auto-Generated Documentation

This section is automatically generated from the codebase.

<!-- AUTO-GENERATED-CONTENT:START -->
### Auto-Generated API Documentation

This section is automatically generated from JSDoc comments and exports in the codebase.

## Cli

### Cli - Commands - Add

#### index (cli/commands/add/index.ts)

Exports:
- function `createAddCommand`

### Cli - Commands - Api - Commands

#### batch (cli/commands/api/commands/batch.ts)

Exports:
- function `createBatchCommand`

Documentation:
```
Create the batch command
 Executes multiple task operations in a single batch
```

#### export (cli/commands/api/commands/export.ts)

Exports:
- function `createExportCommand`

Documentation:
```
Create the export command
 Exports tasks in various formats
```

#### import (cli/commands/api/commands/import.ts)

Exports:
- function `createImportCommand`

Documentation:
```
Create the import command
 Imports tasks from JSON files
```

### Cli - Commands - Api

#### index (cli/commands/api/index.ts)

Exports:
- function `createApiCommand`

Documentation:
```
Create the API command
 Parent command for API-related functionality for machine consumption and Roo integration
```

### Cli - Commands - Deduplicate

#### index (cli/commands/deduplicate/index.ts)

Exports:
- function `createDeduplicateCommand`

Documentation:
```
Define the deduplicate command options
```

```
Create the deduplicate command for finding and managing duplicate tasks
```

```
Handle the deduplicate command execution
 @param options Command options
```

### Cli - Commands - Deduplicate - Lib

#### finder (cli/commands/deduplicate/lib/finder.ts)

Documentation:
```
Find groups of duplicate tasks
 @param tasks List of tasks to check
 @param nlpService NLP service instance
 @param minSimilarity Minimum similarity threshold (0-1)
 @returns Array of duplicate groups
```

#### formatter (cli/commands/deduplicate/lib/formatter.ts)

Exports:
- function `displayDuplicateGroups`
- function `displayDetailedGroupView`
- function `displayInteractiveHelp`

Documentation:
```
Display duplicate groups
```

```
Display detailed view of a group
```

```
Display interactive mode help
```

#### interactive (cli/commands/deduplicate/lib/interactive.ts)

Documentation:
```
Run interactive mode
```

#### merger (cli/commands/deduplicate/lib/merger.ts)

Documentation:
```
Handle merging tasks in a group
 @param group Group of tasks to merge
 @param repo Task repository
 @param colorize Color function
```

```
Show auto-merge suggestion for a group
 @param group Group of tasks
 @param repo Task repository
 @param colorize Color function
```

#### processor (cli/commands/deduplicate/lib/processor.ts)

Documentation:
```
Process tasks and find duplicates
```

```
Process duplicates in auto-merge mode
```

#### utils (cli/commands/deduplicate/lib/utils.ts)

Exports:
- type `ChalkColor`
- type `ChalkStyle`
- type `ColorizeFunction`
- interface `DeduplicateOptions`
- interface `DuplicateGroup`
- function `createColorize`
- function `formatJsonOutput`
- function `getEmptyResultsMessage`
- function `getNoTasksMessage`

Documentation:
```
Types for chalk colors and styles
```

```
Type for colorize function
```

```
Options for processing duplicates
```

```
Structure for duplicate group
```

```
Create a colorize function for consistent output styling
```

```
Format output for JSON
```

```
Format empty results message
```

```
Format no tasks message
```

### Cli - Commands - Metadata

#### index (cli/commands/metadata/index.ts)

Exports:
- function `createMetadataCommand`

### Cli - Commands - Next

#### index (cli/commands/next/index.ts)

Exports:
- function `createNextCommand`

### Cli - Commands - Remove

#### index (cli/commands/remove/index.ts)

Exports:
- function `createRemoveCommand`

### Cli - Commands - Search

#### index (cli/commands/search/index.ts)

Exports:
- function `createSearchCommand`

Documentation:
```
Perform a similarity search for tasks
 @param repo Task repository
 @param nlpService NLP service
 @param options Command options
```

```
Get color functions based on whether colors are enabled
 @param colorEnabled Whether colors are enabled
 @returns Color utility functions
```

### Cli - Commands - Show

#### index (cli/commands/show/index.ts)

#### show-graph (cli/commands/show/show-graph.ts)

Documentation:
```
Show graph command implementation
 Displays the task hierarchy with improved visualization
```

```
Filter tasks based on specified criteria
```

### Cli - Commands - Triage

#### index (cli/commands/triage/index.ts)

Exports:
- function `createTriageCommand`

Documentation:
```
Define the triage command options type
```

```
Create the triage command for processing batches of tasks from a plan file
```

```
Handle the triage command execution
 @param options Command options
```

```
Process tasks from a plan file
 @param planFile Path to plan file
 @param repo Task repository
 @param nlpService NLP service
 @param results Results to track
 @param options Processing options
```

```
Handle missing mode error (no --plan or --interactive)
 @param jsonOutput Whether JSON output is enabled
 @param colorize Color function
 @param repo Task repository to close
```

```
Output results of triage operation
 @param results Results to output
 @param dryRun Whether this was a dry run
 @param similarityThreshold Similarity threshold used
 @param jsonOutput Whether JSON output is enabled
 @param colorize Color function
```

### Cli - Commands - Triage - Lib

#### interactive (cli/commands/triage/lib/interactive.ts)

Documentation:
```
Run interactive triage mode
 @param repo Task repository
 @param nlpService NLP service
 @param results Results to track
 @param options Processing options
```

```
Display task details in interactive mode
 @param task Task to display
 @param index Current task index
 @param total Total number of tasks
 @param allTasks All tasks for reference
 @param colorize Color function
```

```
Display similar tasks
 @param filteredTasks Similar tasks to display
 @param colorize Color function
```

```
Prompt user for action
 @param filteredTasks Similar tasks (for merge option)
 @param colorize Color function
 @returns Selected action
```

```
Handle update action
 @param task Task to update
 @param repo Task repository
 @param results Results to track
 @param options Processing options
```

```
Handle done action
 @param task Task to mark as done
 @param repo Task repository
 @param results Results to track
 @param options Processing options
```

```
Handle tags action
 @param task Task to update tags
 @param repo Task repository
 @param results Results to track
 @param options Processing options
```

```
Handle merge action
 @param task Source task
 @param filteredTasks Similar tasks to potentially merge with
 @param repo Task repository
 @param results Results to track
 @param options Processing options
```

#### processor (cli/commands/triage/lib/processor.ts)

Documentation:
```
Process a task from a plan file
 @param taskData Task data from plan
 @param repo Task repository
 @param nlpService NLP service
 @param results Results to track
 @param options Processing options
```

```
Handle updating an existing task
 @param taskData Task data
 @param repo Task repository
 @param results Results to track
 @param options Processing options
```

```
Handle creating a new task with duplicate detection
 @param taskData Task data
 @param repo Task repository
 @param nlpService NLP service
 @param results Results to track
 @param options Processing options
```

```
Handle automatic merging of similar tasks
 @param taskData Task data
 @param filteredTasks Similar tasks
 @param repo Task repository
 @param results Results to track
 @param options Processing options
```

```
Create a new task
 @param taskData Task data
 @param repo Task repository
 @param results Results to track
 @param options Processing options
```

#### utils (cli/commands/triage/lib/utils.ts)

Exports:
- type `ChalkColor`
- type `ChalkStyle`
- function `colorizeStatus`
- function `colorizeReadiness`
- function `createColorize`
- interface `ProcessingOptions`
- interface `TriageTask`
- interface `TriageResults`
- function `createEmptyResults`

Documentation:
```
Colorize status text
 @param status Status value
 @param colorize Color function
 @returns Colorized status text
```

```
Colorize readiness text
 @param readiness Readiness value
 @param colorize Color function
 @returns Colorized readiness text
```

```
Create a colorize function that applies colors only if enabled
 @param useColors Whether to use colors
 @param jsonOutput Whether JSON output is enabled
 @returns Colorize function
```

```
Define the processing options type
```

```
Define the triage task type
```

```
Define the results tracking type
```

```
Initialize empty results object
 @returns Empty results object
```

### Cli - Commands - Update

#### batch (cli/commands/update/batch.ts)

Documentation:
```
Batch update command implementation
 Handles updating multiple tasks in a single operation via JSON file
```

#### index (cli/commands/update/index.ts)

### Cli

#### entry (cli/entry.ts)

### Cli - Helpers

#### help-formatter (cli/helpers/help-formatter.ts)

Exports:
- interface `CommandExample`
- interface `FlagDoc`
- interface `EnhancedHelpOptions`
- const `helpFormatter`

## Core

### Core - Ai

#### anthropic-provider (core/ai/anthropic-provider.ts)

Exports:
- class `AnthropicProvider`

Documentation:
```
Anthropic provider implementation
 Uses the Anthropic Claude API for AI features
```

```
Create a new Anthropic provider
 @param config Anthropic configuration
```

```
Get the provider name
```

```
Initialize the Anthropic provider
```

```
Create a completion using the Anthropic API
 
 @param options Completion options
 @returns Completion result
```

#### base-provider (core/ai/base-provider.ts)

#### factory (core/ai/factory.ts)

Exports:
- class `AiProviderFactory`

Documentation:
```
Factory for creating AI providers
```

```
Create an AI provider based on configuration
 
 @param config AI provider configuration
 @returns AI provider instance
```

```
Create an AI provider from environment variables
 
 @returns AI provider instance
```

#### index (core/ai/index.ts)

#### mock-provider (core/ai/mock-provider.ts)

Exports:
- class `MockAiProvider`

Documentation:
```
Mock AI provider for testing
 Returns predefined responses or generates simple responses locally
```

```
Create a new mock AI provider
 @param config Mock provider configuration
```

```
Get the provider name
```

```
Initialize the mock provider
```

```
Create a completion with mock responses
 
 @param options Completion options
 @returns Mock completion result
```

```
Simple token counter for mock usage statistics
 @param input Messages or text to count tokens for
 @returns Estimated token count
```

```
Override the task operation method to provide mock-specific processing
```

#### openai-provider (core/ai/openai-provider.ts)

Exports:
- class `OpenAiProvider`

Documentation:
```
OpenAI provider implementation
 Uses the OpenAI API for AI features
```

```
Create a new OpenAI provider
 @param config OpenAI configuration
```

```
Get the provider name
```

```
Initialize the OpenAI provider
```

```
Create a completion using the OpenAI API
 
 @param options Completion options
 @returns Completion result
```

```
Calculate an estimate of tokens for the given string
 This is a simple approximation, not an exact count
 
 @param text Input text
 @returns Estimated token count
```

#### operations (core/ai/operations.ts)

Exports:
- class `TaskOperations`

Documentation:
```
AI Task Operations
 Utility functions for performing AI operations on tasks
```

```
Create a new TaskOperations instance
 @param provider AI provider to use for operations
```

```
Summarize a task
 
 @param task Task to summarize
 @param options Additional options
 @returns Task summary
```

```
Prioritize tasks
 
 @param tasks Array of tasks to prioritize
 @param options Additional options
 @returns Prioritized tasks with explanations
```

```
Generate subtasks for a task
 
 @param task Parent task
 @param options Additional options
 @returns Generated subtasks
```

```
Suggest tags for a task
 
 @param task Task to tag
 @param options Additional options
 @returns Suggested tags
```

```
Analyze a task
 
 @param task Task to analyze
 @param options Additional options
 @returns Task analysis
```

```
Generate a task or tasks from a text description
 
 @param description Text description
 @param options Additional options
 @returns Generated tasks
```

```
Parse tasks from AI completion
 
 @param completionText Completion text
 @returns Parsed tasks
```

#### types (core/ai/types.ts)

Exports:
- type `AiProviderType`
- interface `AiProviderConfig`
- interface `OpenAiConfig`
- interface `AnthropicConfig`
- interface `LocalAiConfig`
- interface `MockAiConfig`
- type `AiConfig`
- interface `AiMessage`
- interface `CompletionOptions`
- interface `CompletionResult`
- type `TaskOperationType`
- interface `AiProvider`

### Core - Api

#### client (core/api/client.ts)

Exports:
- class `ApiClient`

#### index (core/api/index.ts)

#### router (core/api/router.ts)

Exports:
- default `class`

#### service (core/api/service.ts)

Exports:
- class `ApiService`

#### types (core/api/types.ts)

Exports:
- type `ApiOperationType`
- interface `ApiOperation`
- interface `AddOperation`
- interface `UpdateOperation`
- interface `DeleteOperation`
- interface `GetOperation`
- interface `SearchOperation`
- interface `ExportOperation`
- interface `ImportOperation`
- type `Operation`
- interface `BatchOperations`
- interface `OperationResult`
- interface `OperationStats`
- interface `BatchResult`
- interface `ExportResult`
- interface `ImportResult`
- interface `ApiClientConfig`

### Core - Graph - Formatters

#### detailed (core/graph/formatters/detailed.ts)

Exports:
- function `formatDetailedText`
- function `formatCompactText`

Documentation:
```
Detailed text formatter for task graph visualization
```

```
Detailed text format with full information
```

```
Compact text format showing just essentials
```

#### dot (core/graph/formatters/dot.ts)

Exports:
- function `formatHierarchyDot`

Documentation:
```
DOT format generator for task graph visualization
```

```
Format tasks in DOT format for Graphviz
```

#### index (core/graph/formatters/index.ts)

Documentation:
```
Task graph formatters index
 Re-exports all formatters for easy access
```

#### json (core/graph/formatters/json.ts)

Exports:
- function `formatHierarchyJson`
- function `formatFlatJson`
- function `formatTreeJson`
- function `formatGraphJson`
- function `formatAiJson`

Documentation:
```
JSON formatters for task graph visualization
```

```
Format tasks for machine-readable JSON
```

```
Format as flat array (original format)
```

```
Format preserving tree hierarchy for visualization
```

```
Format as nodes and edges for graph visualization tools
```

```
Format with rich metadata for AI processing
```

#### simple (core/graph/formatters/simple.ts)

Exports:
- function `formatSimpleText`

Documentation:
```
Simple text formatter for task graph visualization
```

```
Original simple format with indentation
```

#### text (core/graph/formatters/text.ts)

Documentation:
```
Text formatters for task graph visualization
```

```
Format tasks for human-readable display
```

#### tree (core/graph/formatters/tree.ts)

Exports:
- function `getStatusSymbol`
- function `getReadinessSymbol`
- function `formatTreeText`
- function `formatHierarchyWithSymbols`

Documentation:
```
Tree text formatter for task graph visualization
```

```
Get status symbol for visual display
```

```
Get readiness symbol for visual display
```

```
ASCII tree format with lines and symbols
```

```
Original formatHierarchyWithSymbols function from CLI for backward compatibility
```

### Core - Graph

#### index (core/graph/index.ts)

Exports:
- class `TaskGraph`

Documentation:
```
Task Graph - Core functionality for task hierarchy and visualization
```

```
TaskGraph class for managing task hierarchy and visualization
```

```
Build a graph representation of tasks
```

```
Format tasks for human-readable text display
```

```
Format tasks for machine-readable JSON
```

```
Format tasks in DOT format for Graphviz
```

```
Get nodes in a subgraph starting from a root node
```

```
Get all descendants of a task
```

```
Handle task deletion and ID reassignment
```

#### utils (core/graph/utils.ts)

Exports:
- function `compareTaskIds`
- function `generateNewId`
- function `isDescendant`
- function `findDescendants`

Documentation:
```
Utility functions for task graph operations
```

```
Parse and compare task IDs
```

```
Generate a new ID based on the old ID and an offset
```

```
Check if a task is a descendant of another
```

```
Find descendants in a collection of tasks
```

### Core

#### graph (core/graph.ts)

Documentation:
```
Task Graph - Main export file
 Re-exports the TaskGraph class from the modular structure
```

#### nlp-helpers (core/nlp-helpers.ts)

Exports:
- function `stemWord`
- function `tokenizeAndNormalize`
- function `levenshteinDistance`
- function `fuzzyScore`
- const `synonymMap`
- function `expandWithSynonyms`

Documentation:
```
NLP helper functions for advanced text processing
 These functions provide improved natural language processing capabilities
 for task search and similarity detection
```

```
Simple stemmer that handles common English word endings
 @param word Word to stem
 @returns Stemmed version of the word
```

```
Helper function to check if a character is a consonant
 @param char Single character
 @returns true if consonant, false otherwise
```

```
Tokenize and normalize a string for search operations
 @param text Input text
 @returns Array of normalized tokens
```

```
Calculate Levenshtein edit distance between two strings
 @param s1 First string
 @param s2 Second string
 @returns Edit distance (lower is more similar)
```

```
Calculate fuzzy similarity score between two strings
 using normalized Levenshtein distance
 @param s1 First string
 @param s2 Second string
 @returns Similarity score (0-1, with 1 being identical)
```

```
Expand a search query with synonyms to improve search results
 @param query Original search query
 @returns Expanded query with synonyms
```

#### nlp-service (core/nlp-service.ts)

Exports:
- class `NlpService`

Documentation:
```
NLP Service for Task Master
 This service provides enhanced natural language processing capabilities
 using the node-nlp-typescript library for improved search and matching
```

```
NLP Service for Task Master
 Provides advanced NLP capabilities for search, similarity matching, and more
```

```
Create a new NLP Service
 @param modelPath Path to NLP model (defaults to ./nlp-model.json)
```

```
Train the NLP manager with example task descriptions
 This should be called before using the service for search and analysis
```

```
Process a search query to extract intents and entities
 @param query User's search query
 @returns Processed query with extracted information
```

```
Calculate similarity score between two texts
 @param text1 First text
 @param text2 Second text
 @returns Similarity score between 0 and 1
```

```
Find tasks similar to a given title or description
 @param tasks Array of tasks to search
 @param title Title to find similar tasks for
 @param threshold Similarity threshold (0-1)
 @param useFuzzy Whether to also use fuzzy matching
 @returns Array of tasks with similarity scores
```

```
Extract search filters from a natural language query
 @param query Search query in natural language
 @returns Extracted search filters
```

#### repo (core/repo.ts)

Documentation:
```
Task Repository
 This file re-exports the TaskRepository class from the modular implementation
```

#### types (core/types.ts)

Exports:
- type `TaskStatus`
- type `TaskReadiness`
- type `DependencyType`
- interface `TaskWithChildren`
- interface `SearchFilters`
- interface `TaskInsertOptions`
- interface `TaskUpdateOptions`
- type `OutputFormat`
- interface `TaskMasterConfig`

### Core - Nlp

#### entities (core/nlp/entities.ts)

Exports:
- const `TASK_ENTITIES`
- function `addTaskEntities`
- const `ENTITY_TERMS_TO_REMOVE`

Documentation:
```
Entity definitions for the NLP service
 Defines common task-related terms and provides methods to add them to NLP manager
```

```
Common task-related terms for entity extraction
```

```
Add task-specific entities to NLP manager
 @param nlpManager NLP manager instance
```

```
Terms to remove from query based on extracted entity
```

#### fuzzy-matcher (core/nlp/fuzzy-matcher.ts)

Exports:
- function `fuzzySearch`
- function `combineSearchResults`

Documentation:
```
Fuzzy matching module for NLP service
 Provides enhanced fuzzy searching capabilities using Fuse.js
```

```
Default options for fuzzy search
```

```
Perform fuzzy search on tasks
 @param tasks Array of tasks to search
 @param query Search query
 @param options Fuzzy search options
 @returns Array of matching tasks with scores
```

```
Combine NLP similarity with fuzzy search results
 @param nlpResults Array of tasks with NLP similarity scores
 @param fuzzyResults Array of tasks with fuzzy search scores
 @param nlpWeight Weight to give NLP results (0-1)
 @returns Combined results
```

#### processor (core/nlp/processor.ts)

Exports:
- function `removeExtractedTerms`

Documentation:
```
Processor module for NLP service
 Handles processing queries and calculating similarity
```

```
Process a search query to extract intents and entities
 @param query User's search query
 @param nlpManager NLP manager instance
 @param tokenizer Tokenizer instance
 @param stemmer Stemmer instance
 @returns Processed query with extracted information
```

```
Calculate similarity score between two texts
 @param text1 First text
 @param text2 Second text
 @param tokenizer Tokenizer instance
 @param stemmer Stemmer instance
 @param nlpManager NLP manager instance
 @returns Similarity score between 0 and 1
```

```
Extract search filters from a natural language query
 @param query Search query in natural language
 @param nlpManager NLP manager instance
 @param tokenizer Tokenizer instance
 @param stemmer Stemmer instance
 @returns Extracted search filters
```

```
Remove extracted terms from the query string
 @param query Original query
 @param terms Terms to remove
 @returns Cleaned query
```

#### trainer (core/nlp/trainer.ts)

Exports:
- const `DEFAULT_MODEL_PATH`
- function `addTrainingExamples`

Documentation:
```
Trainer module for NLP service
 Handles training the NLP model with task-specific examples
```

```
Default model file path
```

```
Try to load a pre-existing model
 @param nlpManager NLP manager instance
 @param modelPath Path to model file
 @returns Whether the model was successfully loaded
```

```
Add example documents to train the NLP model
 @param nlpManager NLP manager instance
```

```
Train the NLP model and save it
 @param nlpManager NLP manager instance
 @param modelPath Path to save the model
```

#### types (core/nlp/types.ts)

Exports:
- interface `ProcessedQuery`
- interface `ExtractedSearchFilters`
- interface `TaskSearchInfo`
- interface `SimilarTask`
- interface `FuzzySearchOptions`

Documentation:
```
Type definitions for the NLP service
```

```
Processed query result with extracted information
```

```
Search filters extracted from natural language query
```

```
Task information for similarity search
```

```
Task with similarity score
```

```
Configuration for fuzzy search
```

### Core - Repository

#### base (core/repository/base.ts)

Exports:
- class `BaseTaskRepository`

Documentation:
```
Base TaskRepository class with core functionality
 Handles database connection and basic CRUD operations
```

```
Close database connection when done
```

```
Get a task by ID
 @param id Task ID
 @returns Task or undefined if not found
```

```
Get all tasks
 @returns Array of all tasks
```

```
Update a task
 @param options Task update options
 @returns Updated task or undefined if not found
```

```
Remove a task
 @param id Task ID to remove
 @returns true if successful, false if task not found
```

#### creation (core/repository/creation.ts)

Exports:
- class `TaskCreationRepository`

Documentation:
```
Task creation functionality for the TaskRepository
```

```
Generate hierarchical task ID
 @param options Task creation options
 @returns Generated task ID
```

```
Create a new task
 @param options Task creation options
 @returns The created task
```

```
Update a task's ID
 @param oldId Current task ID
 @param newId New task ID
 @returns true if successful, false otherwise
```

```
Update dependency references
 @param oldId Old task ID
 @param newId New task ID
```

#### factory (core/repository/factory.ts)

Exports:
- class `RepositoryFactory`

Documentation:
```
Repository Factory
 Manages database connections for shared repositories
```

```
RepositoryFactory class for creating repositories with shared connections
 Ensures all repositories use the same database connection
```

```
Initialize the factory with a database connection
 @param dbPath Path to the database file
 @param inMemory Whether to use an in-memory database
 @returns Database connection objects
```

```
Reset the factory (mainly for testing)
```

```
Check if factory is initialized
```

```
Get the shared database connection
 @returns The database connection objects
```

#### hierarchy (core/repository/hierarchy.ts)

Exports:
- class `TaskHierarchyRepository`

Documentation:
```
Hierarchy functionality for the TaskRepository
```

```
Build a task hierarchy for display
 @returns Array of root tasks with their children
```

```
Reorder sibling tasks after a deletion
 @param parentId Parent task ID
 @param deletedTaskId Deleted task ID
```

```
Reorder root tasks after a deletion
 @param deletedTaskId Deleted task ID
```

#### index (core/repository/index.ts)

Exports:
- class `TaskRepository`

Documentation:
```
Main TaskRepository class that combines all functionality
 This class inherits all methods from specialized repository classes
```

#### metadata (core/repository/metadata.ts)

Exports:
- class `TaskMetadataRepository`

Documentation:
```
Metadata functionality for the TaskRepository
```

```
Update a specific metadata field
 @param taskId Task ID
 @param key Metadata field key
 @param value Metadata field value
 @param operation Operation to perform (set, remove, append)
 @returns Updated task or undefined if not found
```

```
Get all metadata for a task
 @param taskId Task ID
 @returns Metadata object or undefined if task not found
```

```
Get a specific metadata field
 @param taskId Task ID
 @param key Metadata field key
 @returns Field value or undefined if not found
```

#### search (core/repository/search.ts)

Exports:
- class `TaskSearchRepository`

Documentation:
```
Search functionality for the TaskRepository
```

```
Initialize the NLP service (if not already initialized)
 This should be called before any NLP operations
```

```
Search for tasks based on filters
 @param filters Search filters
 @returns Array of matching tasks
```

```
Get multiple next tasks to work on
 @param filters Search filters
 @param count Number of tasks to return
 @returns Array of next tasks to work on
```

```
Get the next task to work on (for backward compatibility)
 @param filters Search filters
 @returns The next task or undefined if none found
```

```
Find tasks with similar titles
 @param title Title to search for similar tasks
 @param useFuzzy Whether to use fuzzy matching (defaults to true)
 @param threshold Similarity threshold (0-1, defaults to 0.3)
 @returns Array of similar tasks
```

```
Search tasks using natural language query
 Combines NLP-based extraction with fuzzy matching
 @param query Natural language query
 @param useFuzzy Whether to use fuzzy matching
 @returns Array of matching tasks with scores
```

## Db

### Db

#### init (db/init.ts)

Exports:
- function `createDb`

#### migrate (db/migrate.ts)

#### schema (db/schema.ts)

Exports:
- const `tasks`
- const `dependencies`
- type `Task`
- type `NewTask`
- type `Dependency`
- type `NewDependency`

## .

### .

#### drizzle.config (drizzle.config.ts)

## Examples

### Examples

#### ai-integration-example (examples/ai-integration-example.ts)

Documentation:
```
Task Master AI Integration Example
 
 This example demonstrates how to use the AI integration features
 with different providers for task management operations.
```

```
Example tasks for demonstration
```

```
Example text description for task generation
```

```
Run demonstrations with different providers
```

#### api-client-example (examples/api-client-example.ts)

Documentation:
```
Example of using the Task Master API client
 This demonstrates how to use the API client for external integrations
```

#### api-server-example (examples/api-server-example.ts)

Documentation:
```
Example of creating a REST API server using the Task Master API
 This demonstrates how to expose Task Master functionality as a web service
 
 Note: This is a standalone example and requires express to be installed:
 npm install express cors body-parser
```

```
Example implementation of a REST API server for Task Master
 In a real application, this would use actual express and middleware
```

## Scripts

### Scripts

#### generate-command-docs (scripts/generate-command-docs.js)

Documentation:
```
Command Documentation Generator for Task Master
 
 Automatically generates markdown documentation for all CLI commands
 using the helpFormatter's generateMarkdownDocs functionality.
```

```
Main function
```

```
Get list of command names
```

```
Generate documentation for main command
```

```
Generate documentation for a specific command
```

```
Generate command index
```

## Test

### Test - Commands

#### api-simple.test (test/commands/api-simple.test.ts)

#### api.test (test/commands/api.test.ts)

#### metadata-simple.test (test/commands/metadata-simple.test.ts)

#### metadata.test (test/commands/metadata.test.ts)

#### next-simple.test (test/commands/next-simple.test.ts)

#### next.test (test/commands/next.test.ts)

#### test-helpers (test/commands/test-helpers.ts)

Exports:
- const `execPromise`
- function `captureConsoleOutput`
- function `restoreConsole`
- function `getConsoleOutput`
- function `createCommandParent`
- const `tempDir`

### Test - Core

#### graph.test (test/core/graph.test.ts)

#### nlp-search.test (test/core/nlp-search.test.ts)

#### repo-advanced-simple.test (test/core/repo-advanced-simple.test.ts)

#### repo-advanced.test (test/core/repo-advanced.test.ts)

#### repo.test (test/core/repo.test.ts)

### Test

#### debug-test (test/debug-test.js)


<!-- AUTO-GENERATED-CONTENT:END -->

---

*This documentation is maintained as part of the Task Master project. Last updated: 2023-06-01*