/**
 * ESM Import Resolution Test
 * 
 * This test verifies that imports without .ts extensions work correctly
 * with our new TSX loader configuration.
 */

import { describe, it, expect } from 'vitest';

// Import without .ts extension
import { TaskRepository } from '../core/repo';
import { createLogger } from '../core/utils/logger';
import { TimeWindowManager } from '../core/terminal/time-window-manager';

// Test direct imports without .ts extension
import { formatBoxedTask } from '../core/graph/formatters/boxed-task';

describe('ESM Import Resolution', () => {
  it('should import modules without .ts extensions', () => {
    // Verify that all imports work correctly
    expect(TaskRepository).toBeDefined();
    expect(typeof TaskRepository).toBe('function');

    expect(createLogger).toBeDefined();
    expect(typeof createLogger).toBe('function');

    expect(TimeWindowManager).toBeDefined();
    expect(typeof TimeWindowManager).toBe('function');

    expect(formatBoxedTask).toBeDefined();
    expect(typeof formatBoxedTask).toBe('function');
  });
  
  it('should successfully create instances from imports', () => {
    // Verify we can instantiate imported classes
    const logger = createLogger('test');
    expect(logger).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(typeof logger.debug).toBe('function');
  });
});