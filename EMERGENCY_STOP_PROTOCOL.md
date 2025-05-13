# 🛑 EMERGENCY STOP PROTOCOL

## Triggers
- **Metrics Regression**: Any baseline metrics showing decline
  - TypeScript error count increased
  - Test failures introduced
  - Build errors appeared
  - Performance metrics degraded
- **Unfixable Issues**: Fixes causing cascading problems that cannot be easily resolved
- **Broken Functionality**: Previously working functionality no longer works

## Required Actions
1. **STOP** all implementation immediately
2. **DO NOT** commit any changes
3. **Document** exact metrics showing regression with detailed comparison
4. **Alert user** with specific metrics comparison:
   ```
   🛑 EMERGENCY STOP TRIGGERED:
   
   Baseline: [original metrics]
   Current: [regression metrics]
   Regression: [specific deterioration]
   
   Analysis: [brief explanation of likely cause]
   ```
5. **Wait** for explicit instructions before proceeding

## Recovery Protocol
1. **Assessment**
   - Identify exact changes that caused regression
   - Determine if partial changes can be salvaged
   - Evaluate alternative approaches
2. **Next Steps**
   - Revert specific problematic changes
   - Try alternative implementation approach
   - Request user guidance on new direction
   
> **CRITICAL**: DO NOT resume implementation without explicit user permission

---

# 🔒 Git Commit Guard

## Task-Specific Verification

### TypeScript Error Fix
- **Commands**:
  - `npx tsc --noEmit | grep -c "error TS"`
  - `npm run test`
  - `npm run dev -- [relevant command]`
- **Criteria**:
  - Current TypeScript error count MUST be lower than baseline
  - No new test failures must be introduced
  - CLI functionality must continue to work
- **On Failure**:
  1. STOP immediately and DO NOT commit
  2. Document metrics showing failure
  3. Analyze root cause of regression
  4. Report metrics to user with comparison table

### Test Fix
- **Commands**:
  - `npm test`
  - `npm run test:coverage`
- **Criteria**:
  - Number of passing tests MUST increase
  - Test coverage must not decrease
  - No new test failures must be introduced
- **On Failure**: STOP and request guidance with test failure output

### Feature Implementation
- **Commands**:
  - `npm run dev -- [feature command]`
  - `npm test`
  - `npx tsc --noEmit`
- **Criteria**:
  - Feature must perform as specified
  - No TypeScript errors should be introduced
  - All tests must continue to pass
- **On Failure**: STOP and request guidance with specific failure details

## Pre-commit Checklist
1. Run all verification commands
2. Compare metrics with baseline
3. Verify specific improvement criteria are met
4. Document metrics in commit message
5. DO NOT proceed with commit if any verification fails

---

# 📊 Metrics Threshold Policy

## TypeScript Errors
- **Required Improvement**: Error count MUST decrease by at least 1
- **Metrics**:
  - `npx tsc --noEmit | grep -c "error TS"` → New count < baseline count
  - Check specific error patterns show improvement
- **Exception**: If error count increases but overall quality improves
  - Requires explicit user approval
  - Document detailed explanation
  - Provide plan for addressing new errors

## Test Fixes
- **Required Improvement**: More passing tests or fewer flaky tests
- **Metrics**:
  - `npm test | grep "passing"` → New passing ≥ baseline passing
  - `npm test | grep "failing"` → New failing ≤ baseline failing

## Feature Implementation
- **Required Improvement**: Working feature without regressions
- **Metrics**:
  - TypeScript errors must not increase
  - Test coverage maintained or improved
  - Feature functionality verified working

## Usage Rules
1. **Baseline Requirement**: Establish baseline metrics before any fix
2. **Comparison Requirement**: Direct comparison with baseline after implementation
3. **Threshold Validation**: Success thresholds must be explicitly checked

---

# 🧩 Systematic Fix Protocol

## Pre-fix Analysis

1. **Define success criteria explicitly**
   ```
   Success means:
   1. [Specific measurable outcome 1]
   2. [Specific measurable outcome 2]
   3. [Specific measurable outcome 3]
   ```

2. **Establish baseline metrics**
   - Total issue count
   - Pattern distribution
   - Specific issue examples
   - Document in task: `npm run dev -- update [taskId] --add-note "BASELINE METRICS: [metrics]"`

3. **Create verification commands**
   - Command to check if issue was fixed
   - Command to verify no regressions
   - Command to measure progress vs baseline
   - Document: `npm run dev -- update [taskId] --add-note "VERIFICATION COMMANDS: [commands]"`

## Verification Protocol

1. **Mandatory Verification After Every Fix**
   - Run ALL verification commands
   - Compare results to baseline metrics
   - State whether each success criterion was met
   - Document unexpected or partial results
   - NEVER report success without verification
   - NEVER claim progress without comparing to baseline

2. **Handling Partial Fixes**
   - Quantify exactly what was fixed and what remains
   - Identify patterns in unfixed issues
   - Explain why some instances weren't fixed
   - Propose targeted approach for remaining issues

## Progress Reporting

```
## Fix Progress Report

**Pre-Fix Baseline:**
- [Baseline metric 1]
- [Baseline metric 2]

**Current Status:**
- [Current metric 1] - [Change from baseline]
- [Current metric 2] - [Change from baseline]

**Success Criteria Assessment:**
- Criterion 1: [Met/Partially Met/Not Met] - [Evidence]
- Criterion 2: [Met/Partially Met/Not Met] - [Evidence]
- Criterion 3: [Met/Partially Met/Not Met] - [Evidence]

**Remaining Issues:**
- [Specific issue 1] - [Count/Location]
- [Specific issue 2] - [Count/Location]

**Next Steps:**
- [Specific next action based on verification]
```

## Completion Requirements
- All verification commands have been run
- Metrics show clear improvement from baseline
- Target issue pattern has been fully addressed or explicitly documented
- Complete metrics documented in the subtask
- Verification evidence added to the subtask

---

# 📊 Checkpoint System

## Initial Response
```
🛠️ DEVELOPMENT FRAMEWORK ACTIVATED

Starting Task: [Task ID/Description]

📊 CHECKPOINT FLOW:
⬜ CHECKPOINT 1: INITIAL ASSESSMENT
⬜ CHECKPOINT 2: PLANNING & CONTEXT
⬜ CHECKPOINT 3: ENVIRONMENT PREPARATION
⬜ CHECKPOINT 4: ANALYSIS (if needed)
⬜ CHECKPOINT 5: IMPLEMENTATION
⬜ CHECKPOINT 6: VERIFICATION
⬜ CHECKPOINT 7: FINALIZATION

Beginning initial assessment...
```

## Critical Requirements
- STOP and verify ALL previous steps are complete
- LOG progress with `tm update`
- ANSWER verification questions
- ONLY proceed if all verification succeeds
- IMMEDIATELY alert if verification fails

## Verification Checklist (Checkpoint 6)
1. **Run verification commands** comparing to baseline
2. **Document metric changes**:
   ```
   - BEFORE: [baseline metric]
   - AFTER: [current metric]
   - IMPROVEMENT: [difference and percentage]
   ```
3. **Update task**: `npm run dev -- update [taskId] --add-note "VERIFICATION RESULTS: [metrics]"`
4. **Confirm success criteria** with evidence

## Progress Indicator
```
📊 CHECKPOINT STATUS:
✅ CHECKPOINT 1: INITIAL ASSESSMENT
✅ CHECKPOINT 2: PLANNING & CONTEXT
🔄 CHECKPOINT 3: ENVIRONMENT PREPARATION (In Progress)
⬜ CHECKPOINT 4: ANALYSIS (if needed)
⬜ CHECKPOINT 5: IMPLEMENTATION
⬜ CHECKPOINT 6: VERIFICATION
⬜ CHECKPOINT 7: FINALIZATION
```

---

# 🔄 Git Workflow Management

## Branch Creation
1. **Check branch status**: `git status`
   - If dirty branch: Stop and request guidance
   - If clean: Create feature branch with naming convention:
     - `feature/[task-id]-[short-description]`
     - `fix/[task-id]-[short-description]`

## Commit & PR Policy
1. **Verification Before Commit (BLOCKER)**
   - Run all verification commands
   - Compare metrics to baseline with explicit numbers
   - ONLY commit if metrics show measurable improvement
   - HALT if error counts increased or stayed the same
   - Document exact metric changes in commit message

2. **Subtask Commits**
   - Complete implementation of subtask
   - Verify DoD requirements through testing
   - Document verification results
   - Only commit after IMPROVED metrics
   - Mark as "DONE" after successful commit

3. **PR Creation**
   - Create ONE PR for entire parent task
   - Do NOT create PRs for individual subtasks
   - PR should summarize all subtask changes

---

# 🧠 Ultra-Think Mode

## Activation Checklist
```
┌─ TypeScript Error Assessment ───────────────┐
│                                             │
│  ❓ Do errors span multiple subsystems?      │ 
│    (DB, UI, API, etc.)                      │
│                                             │
│  ❓ Are fixes creating new errors?           │
│    ("whack-a-mole" pattern)                 │
│                                             │
│  ❓ Do error messages contain:               │
│    - "incompatible types"                   │
│    - "constraint violation"                 │
│    - "circular reference"                   │
│                                             │
│  ❓ Are core type definitions affected?      │
│    (with wide usage across codebase)        │
│                                             │
│  ❓ Are there >10 similar TypeScript errors? │
│                                             │
└─────────────────────────────────────────────┘
```
> If YES to ANY question, proceed with ULTRA-THINK analysis

## Analysis Framework
```
ULTRA-THINK ANALYSIS: [Issue Type]

1. PATTERN IDENTIFICATION
   - Catalog observable symptoms or errors
   - Group related issues by pattern
   - Identify affected components

2. SYSTEM MAPPING
   - Identify affected definitions/objects/components
   - Trace dependency chains
   - Document usage patterns across codebase

3. ROOT CAUSE DETERMINATION
   - Distinguish between symptoms and causes
   - Classify issues (type mismatch, design flaw, etc.)
   - Identify common underlying issues

4. SOLUTION MODELING
   - Propose minimal changes with maximal impact
   - Evaluate side effects of proposed changes
   - Compare alternative approaches with pros/cons

5. IMPLEMENTATION PLAN
   - Order changes to minimize cascading impacts
   - Define validation checkpoints
   - Establish rollback contingencies
```

## Automatic Triggers
- **Type System Issues**: Multiple errors of similar pattern, type compatibility issues, generic types
- **Complex Refactoring**: Modifying core interfaces, new architectural patterns, multiple dependencies
- **Root Cause Analysis**: Complex failures, errors increased after fix, interdependent modules
- **Performance Optimizations**: Critical paths, memory/CPU issues, build performance

> Activate with: "I need to analyze this systematically"