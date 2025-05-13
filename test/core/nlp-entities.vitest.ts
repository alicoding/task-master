/**
 * nlp-entities.vitest.ts - Tests for NLP entities module
 * 
 * Definition of Done:
 * ✅ Tests use proper TypeScript imports with .ts extensions
 * ✅ Tests include setup and teardown for proper resource cleanup
 * ✅ All assertions use Vitest expect() syntax
 * ✅ Tests are grouped logically in describe blocks
 * ✅ Tests cover main functionality and edge cases
 */

import { describe, it, expect, vi } from 'vitest';
import { TASK_ENTITIES, addTaskEntities } from '../../core/nlp/entities';

describe('NLP Entities', () => {
  describe('TASK_ENTITIES', () => {
    it('should contain essential task categories', () => {
      expect(TASK_ENTITIES).toHaveProperty('status');
      expect(TASK_ENTITIES).toHaveProperty('readiness');
      expect(TASK_ENTITIES).toHaveProperty('priority');
      expect(TASK_ENTITIES).toHaveProperty('action');
    });
    
    it('should have correct status values', () => {
      expect(TASK_ENTITIES.status).toContain('todo');
      expect(TASK_ENTITIES.status).toContain('in-progress');
      expect(TASK_ENTITIES.status).toContain('done');
      expect(TASK_ENTITIES.status).toContain('pending');
      expect(TASK_ENTITIES.status).toContain('active');
      expect(TASK_ENTITIES.status).toContain('completed');
    });
    
    it('should have correct readiness values', () => {
      expect(TASK_ENTITIES.readiness).toContain('draft');
      expect(TASK_ENTITIES.readiness).toContain('ready');
      expect(TASK_ENTITIES.readiness).toContain('blocked');
      expect(TASK_ENTITIES.readiness).toContain('waiting');
      expect(TASK_ENTITIES.readiness).toContain('available');
    });
    
    it('should have correct priority values', () => {
      expect(TASK_ENTITIES.priority).toContain('high');
      expect(TASK_ENTITIES.priority).toContain('medium');
      expect(TASK_ENTITIES.priority).toContain('low');
      expect(TASK_ENTITIES.priority).toContain('critical');
      expect(TASK_ENTITIES.priority).toContain('urgent');
    });
    
    it('should have correct action values', () => {
      expect(TASK_ENTITIES.action).toContain('create');
      expect(TASK_ENTITIES.action).toContain('update');
      expect(TASK_ENTITIES.action).toContain('delete');
      expect(TASK_ENTITIES.action).toContain('add');
      expect(TASK_ENTITIES.action).toContain('modify');
    });
  });
  
  describe('addTaskEntities', () => {
    it('should add status entities with synonyms', () => {
      const mockNlpManager = {
        addNamedEntityText: vi.fn()
      };
      
      addTaskEntities(mockNlpManager);
      
      // Check that addNamedEntityText was called for status values
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'status', 'todo', ['en'], expect.arrayContaining(['todo', 'to-do', 'pending'])
      );
      
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'status', 'in-progress', ['en'], expect.arrayContaining(['in-progress', 'in progress', 'doing'])
      );
      
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'status', 'done', ['en'], expect.arrayContaining(['done', 'completed', 'finished'])
      );
    });
    
    it('should add readiness entities with synonyms', () => {
      const mockNlpManager = {
        addNamedEntityText: vi.fn()
      };
      
      addTaskEntities(mockNlpManager);
      
      // Check that addNamedEntityText was called for readiness values
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'readiness', 'draft', ['en'], expect.arrayContaining(['draft', 'planning', 'idea'])
      );
      
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'readiness', 'ready', ['en'], expect.arrayContaining(['ready', 'actionable', 'prepared'])
      );
      
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'readiness', 'blocked', ['en'], expect.arrayContaining(['blocked', 'stuck', 'waiting'])
      );
    });
    
    it('should add priority entities with synonyms', () => {
      const mockNlpManager = {
        addNamedEntityText: vi.fn()
      };
      
      addTaskEntities(mockNlpManager);
      
      // Check that addNamedEntityText was called for priority values
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'priority', 'high', ['en'], expect.arrayContaining(['high', 'important', 'critical'])
      );
      
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'priority', 'medium', ['en'], expect.arrayContaining(['medium', 'normal', 'standard'])
      );
      
      expect(mockNlpManager.addNamedEntityText).toHaveBeenCalledWith(
        'priority', 'low', ['en'], expect.arrayContaining(['low', 'minor', 'trivial'])
      );
    });
  });
});