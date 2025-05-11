# File Relevance Analysis Prompt

## Metadata
Category: code-analysis
Version: 1.0.0
Description: Determines how relevant a file is to a task based on content analysis
Models: gpt-4, claude-3-opus, local-embeddings
Purpose: Scoring relevance between code files and tasks
Token Estimate: 500-1000 per analysis

## Variables
- `$FILE_PATH`: The relative path of the file being analyzed
- `$FILE_CONTENT`: The content of the file
- `$TASK_ID`: The ID of the task
- `$TASK_TITLE`: The title of the task
- `$TASK_DESCRIPTION`: The description of the task
- `$TASK_TAGS`: The tags associated with the task
- `$FILE_EXTENSION`: The extension of the file
- `$REPO_PATH`: The repository path
- `$PROJECT_TYPE`: The type of project (e.g., web, mobile, backend)

## System Message
You are an expert code analyst tasked with determining how relevant a file is to a specific task. You'll analyze the file content and the task details to provide a relevance score and explanation.

## Primary Prompt
I need to determine how relevant the file `$FILE_PATH` is to task $TASK_ID: "$TASK_TITLE".

Task description: $TASK_DESCRIPTION
Task tags: $TASK_TAGS
File extension: $FILE_EXTENSION
Project type: $PROJECT_TYPE

File content:
```$FILE_EXTENSION
$FILE_CONTENT
```

Analyze this file and determine its relevance to the task by considering:
1. Direct mentions of concepts from the task title or description
2. Functional implementation that appears to address the task requirements
3. Modifications to systems described in the task
4. New code that implements features related to the task
5. Test code that verifies functionality described in the task
6. Documentation related to the task

## Output Format

Provide your analysis as JSON with the following structure:
```json
{
  "relevanceScore": 0.85, // Score between 0 and 1, where 1 is extremely relevant
  "confidence": 0.92, // Your confidence in this assessment (0-1)
  "matchingConcepts": ["feature name", "functionality", "component"], // Key concepts that match between task and file
  "assessment": "This file implements the core authentication logic described in the task...", // Brief explanation of your assessment
  "recommendedAction": "claim" // One of: "claim", "review", "ignore"
}
```

## Token Optimization
If the file is very large (>500 lines), focus your analysis on:
1. Function/method names and signatures
2. Class/component names
3. Comments and documentation
4. Imports and dependencies

## Adaptation Rules
If using a local embeddings model:
1. Skip the detailed explanation
2. Use only keyword matching for concepts
3. Reduce output to just the score and recommended action

## Examples

### Example 1
Task ID: TASK-123
Task Title: "Implement user authentication with JWT"
Task Description: "Create a secure authentication system using JWT tokens with proper validation and error handling"
File Path: src/auth/jwtService.ts

Analysis:
```json
{
  "relevanceScore": 0.95,
  "confidence": 0.98,
  "matchingConcepts": ["JWT", "authentication", "token validation", "error handling"],
  "assessment": "This file directly implements the JWT authentication service described in the task. It contains token generation, validation, and proper error handling as specified in the task description.",
  "recommendedAction": "claim"
}
```

### Example 2
Task ID: TASK-456
Task Title: "Fix pagination bug in user list"
Task Description: "Fix the bug where pagination fails when the page size is changed while viewing a page other than the first one"
File Path: src/components/common/Button.tsx

Analysis:
```json
{
  "relevanceScore": 0.15,
  "confidence": 0.9,
  "matchingConcepts": ["component", "UI"],
  "assessment": "This file is a generic button component. While it might be used in the user list, it doesn't directly relate to the pagination bug described in the task.",
  "recommendedAction": "ignore"
}
```