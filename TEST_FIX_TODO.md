# Test Fixing TODO List

This document outlines the remaining tests that need to be fixed in the Task Master project.

## Completed Tests

✅ API Command Tests (`test/commands/api-fixed.vitest.ts`)  
✅ Search Repository Tests (`test/core/search-repository-fixed.vitest.ts`)  
✅ Terminal Session Factory Basic Tests (`test/core/terminal-session-factory-basic.vitest.ts`)  
✅ File Change Analyzer Tests (`test/core/file-change-analyzer-fixed.vitest.ts`)  

## Remaining Tests to Fix

### High Priority

- [ ] Terminal Session Factory Full Tests
  - Issue: Global mocking of TerminalSessionManager fails
  - Approach: Create mock manager with correct interface

- [ ] Terminal Session Time Window Integration Tests
  - Issue: Error handling and integration issues
  - Approach: Implement proper mocking of time window manager

- [ ] Repository Advanced Tests
  - Issue: Various assertion failures
  - Approach: Update expectations and improve test isolation

### Medium Priority

- [ ] Terminal Session Lifecycle Tests
  - Issue: Event listener memory leaks
  - Approach: Implement proper event cleanup

- [ ] Terminal Session Integration Tests
  - Issue: Component integration failures
  - Approach: Use dependency injection and proper mocking

### Lower Priority

- [ ] NLP Module Tests
  - Issue: Various tokenization and parsing issues
  - Approach: Make expectations more flexible for natural language processing

- [ ] File Tracking Advanced Tests
  - Issue: Timing and synchronization issues
  - Approach: Implement proper async/await patterns and improve stability

## Approach for Remaining Tests

1. **Isolate Each Test Category**: Fix one category at a time
2. **Use Transaction Support**: Implement proper database transaction support
3. **Identify Common Patterns**: Look for patterns in failing tests
4. **Create Reusable Utils**: Build test utilities for common operations
5. **Document Fixes**: Document patterns for future maintainers