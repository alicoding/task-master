/**
 * nlp-factory-esm.vitest.ts - Tests for NLP factory ESM compatibility
 * 
 * Definition of Done:
 * ✅ Tests validate that imports properly use ESM syntax
 * ✅ Tests confirm dynamic imports are working
 * ✅ Tests properly handle async nature of factory methods
 * ✅ Tests cover error handling cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createNlpService, 
  createMockNlpService,
  createOptimizedNlpService
} from '../../core/nlp/factory';
import { MockNlpService } from '../../core/nlp/services/mock-service';
import { TestSafeNlpService } from '../../core/nlp/testing/nlp-test-utils';

describe('NLP Factory ESM Compatibility', () => {
  // Mock dynamic imports
  const mockImport = vi.fn();
  
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
  
  it('should use dynamic ESM imports', async () => {
    // Spy on the dynamic import
    const importSpy = vi.spyOn(global, 'import');
    
    // Set to production mode to force real service loading
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.VITEST = '';
    
    try {
      // This will attempt to use dynamic imports
      await createNlpService({ forceTestSafe: false });
      
      // Verify that import() was called
      expect(importSpy).toHaveBeenCalled();
      
      // The function should try to import the services
      const importCalls = importSpy.mock.calls.map(call => call[0]);
      const hasServiceImport = importCalls.some(path => 
        path.includes('nlp-service.ts') || path.includes('optimized-nlp-service.ts')
      );
      
      expect(hasServiceImport).toBeTruthy();
    } finally {
      // Restore the environment
      process.env.NODE_ENV = originalEnv;
    }
  });
  
  it('should handle errors from dynamic imports gracefully', async () => {
    // Mock the import to fail
    vi.spyOn(global, 'import').mockImplementation(() => {
      throw new Error('Module not found');
    });
    
    // Set to production mode to force real service loading
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.VITEST = '';
    
    try {
      // This should fall back to MockNlpService
      const service = await createNlpService({ forceTestSafe: false });
      
      // Service should be defined despite the import error
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MockNlpService);
    } finally {
      // Restore the environment
      process.env.NODE_ENV = originalEnv;
    }
  });
  
  it('should handle optimized service imports correctly', async () => {
    // Spy on the dynamic import
    const importSpy = vi.spyOn(global, 'import');
    
    // This should attempt to import the optimized service
    await createOptimizedNlpService();
    
    // Verify import was called with the right path
    expect(importSpy).toHaveBeenCalledWith(expect.stringContaining('optimized-nlp-service.ts'));
  });
  
  it('should use the correct import path with trailing .ts extension', async () => {
    // Spy on the dynamic import
    const importSpy = vi.spyOn(global, 'import');
    
    // Set to production mode to force real service loading
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.VITEST = '';
    
    try {
      // This will attempt to import the service
      await createNlpService({ useOptimized: true, forceTestSafe: false });
      
      // Check that all import paths end with .ts
      const importCalls = importSpy.mock.calls
        .filter(call => typeof call[0] === 'string')
        .map(call => call[0] as string);
      
      const allPathsHaveTsExtension = importCalls
        .filter(path => path.includes('nlp')) // Only check NLP-related imports
        .every(path => path.endsWith('.ts'));
      
      expect(allPathsHaveTsExtension).toBeTruthy();
    } finally {
      // Restore the environment
      process.env.NODE_ENV = originalEnv;
    }
  });
});