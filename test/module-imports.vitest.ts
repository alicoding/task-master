/**
 * Module Imports Validation Test
 * 
 * This test validates that our modules can be imported correctly with TypeScript.
 */

import { describe, it, expect } from 'vitest';

// Test imports from core modules
describe('Module Import Validation', () => {
  it('should import terminal-session-time-window-integration.ts correctly', async () => {
    const module = await import('../core/terminal/terminal-session-time-window-integration');
    expect(module).toBeDefined();
    expect(typeof module.findTimeWindows).toBe('function');
    expect(typeof module.createTimeWindow).toBe('function');
    expect(typeof module.autoDetectTimeWindows).toBe('function');
    expect(typeof module.getTimeWindowStats).toBe('function');
    expect(typeof module.createTaskActivityWindow).toBe('function');
  });

  it('should import time-window-manager.ts correctly', async () => {
    const module = await import('../core/terminal/time-window-manager');
    expect(module).toBeDefined();
    expect(module.TimeWindowManager).toBeDefined();
    expect(typeof module.TimeWindowManager).toBe('function');
  });
  
  it('should validate .ts extensions are properly resolved', async () => {
    const repo = await import('../core/repo');
    expect(repo).toBeDefined();
    expect(repo.TaskRepository).toBeDefined();
    
    const logger = await import('../core/utils/logger');
    expect(logger).toBeDefined();
    expect(typeof logger.createLogger).toBe('function');
  });
});