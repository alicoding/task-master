# Gap Analysis Prompt

## Metadata
Category: task-analysis
Version: 1.0.0
Description: Analyzes task requirements against implemented code to identify gaps
Models: gpt-4, claude-3-opus
Purpose: Finding missing implementations in task requirements
Token Estimate: 1000-2000 per analysis

## Variables
- `$TASK_ID`: The ID of the task
- `$TASK_TITLE`: The title of the task
- `$TASK_DESCRIPTION`: The description of the task
- `$TASK_BODY`: The full body text of the task
- `$RELATED_FILES`: JSON array of files related to this task with confidence scores
- `$FILE_CONTENTS`: JSON object mapping file paths to their contents
- `$TASK_STATUS`: The current status of the task
- `$TASK_READINESS`: The readiness status of the task
- `$TASK_TAGS`: The tags associated with the task
- `$MAX_NEW_TASKS`: Maximum number of new tasks to suggest (default: 3)

## System Message
You are an expert requirements analyst and code reviewer. Your task is to compare the requirements specified in a task against the implemented code to identify any gaps or missing implementations. Your analysis will help ensure that all requirements are properly addressed before a task is considered complete.

## Primary Prompt
I need to analyze Task $TASK_ID: "$TASK_TITLE" to identify any implementation gaps.

Task description: $TASK_DESCRIPTION

Task body:
```
$TASK_BODY
```

Task status: $TASK_STATUS
Task readiness: $TASK_READINESS
Task tags: $TASK_TAGS

This task has been associated with the following files:
$RELATED_FILES

Here are the contents of the related files:
$FILE_CONTENTS

Please analyze these files against the task requirements to identify:
1. Which requirements have been fully implemented
2. Which requirements have been partially implemented
3. Which requirements are missing implementation entirely
4. Any additional implementation that wasn't specified in the requirements

Then, suggest up to $MAX_NEW_TASKS subtasks to address any gaps.

## Output Format

Provide your analysis as JSON with the following structure:
```json
{
  "implementedRequirements": [
    {
      "requirement": "Implement JWT token generation",
      "implementationLocation": "src/auth/jwtService.ts:25-42",
      "completeness": 1.0
    }
  ],
  "partiallyImplementedRequirements": [
    {
      "requirement": "Add input validation for all form fields",
      "implementationLocation": "src/components/UserForm.tsx:15-30",
      "completeness": 0.6,
      "missingElements": ["Password strength validation", "Email format validation"]
    }
  ],
  "missingRequirements": [
    {
      "requirement": "Implement password reset functionality",
      "criticality": "high"
    }
  ],
  "additionalImplementation": [
    {
      "feature": "Added username validation",
      "location": "src/utils/validators.ts:45-60",
      "notes": "This wasn't in the requirements but is a good addition"
    }
  ],
  "suggestedTasks": [
    {
      "title": "Implement password reset functionality",
      "description": "Create the password reset endpoint and email sending functionality as specified in the requirements",
      "parentTask": "$TASK_ID",
      "estimatedComplexity": "medium",
      "tags": ["backend", "security"]
    }
  ],
  "overallCompleteness": 0.75, // Overall completion percentage
  "analysisConfidence": 0.9, // Confidence in this analysis
  "recommendations": "This task should not be marked as complete until the password reset functionality is implemented."
}
```

## Token Optimization
If the task and files are very large:
1. Focus on extracting clear requirements from the task description and body
2. Analyze only the most relevant sections of each file
3. Prioritize critical security and functional requirements over cosmetic ones

## Adaptation Rules
If using a model with reasoning limitations:
1. Focus only on keyword matching between requirements and implementations
2. Reduce the granularity of the analysis
3. Avoid complex reasoning about implementation completeness

## Examples

### Example 1
Task ID: TASK-234
Task Title: "Implement user registration form"
Task Description: "Create a registration form with email, password, and password confirmation fields. Include validation for all fields and proper error handling."

Analysis:
```json
{
  "implementedRequirements": [
    {
      "requirement": "Create registration form with required fields",
      "implementationLocation": "src/components/RegistrationForm.tsx:15-80",
      "completeness": 1.0
    },
    {
      "requirement": "Validate password confirmation matches",
      "implementationLocation": "src/components/RegistrationForm.tsx:120-135",
      "completeness": 1.0
    }
  ],
  "partiallyImplementedRequirements": [
    {
      "requirement": "Add validation for all fields",
      "implementationLocation": "src/components/RegistrationForm.tsx:90-150",
      "completeness": 0.7,
      "missingElements": ["Email format validation"]
    }
  ],
  "missingRequirements": [
    {
      "requirement": "Implement error handling for form submission",
      "criticality": "high"
    }
  ],
  "additionalImplementation": [],
  "suggestedTasks": [
    {
      "title": "Add email format validation to registration form",
      "description": "Implement proper email format validation using a regular expression or validation library",
      "parentTask": "TASK-234",
      "estimatedComplexity": "low",
      "tags": ["frontend", "validation"]
    },
    {
      "title": "Implement error handling for registration form submission",
      "description": "Add proper error handling for API requests during form submission, including displaying meaningful error messages to the user",
      "parentTask": "TASK-234",
      "estimatedComplexity": "medium",
      "tags": ["frontend", "error-handling"]
    }
  ],
  "overallCompleteness": 0.65,
  "analysisConfidence": 0.9,
  "recommendations": "The registration form implementation is missing proper error handling for form submission and email validation. These should be addressed before marking the task as complete."
}
```