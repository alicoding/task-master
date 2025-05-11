import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskRepository } from '../../core/repo.ts';
import { TaskGraph } from '../../core/graph.ts';
import * as graphUtils from '../../core/graph/utils.ts';
import { Task } from '../../db/schema.ts';

describe('Graph Utility Functions', () => {
  describe('compareTaskIds', () => {
    it('should correctly compare same-level IDs', () => {
      expect(graphUtils.compareTaskIds('1', '2')).toBeLessThan(0);
      expect(graphUtils.compareTaskIds('2', '1')).toBeGreaterThan(0);
      expect(graphUtils.compareTaskIds('1', '1')).toBe(0);
    });
    
    it('should correctly compare multi-level IDs', () => {
      expect(graphUtils.compareTaskIds('1.1', '1.2')).toBeLessThan(0);
      expect(graphUtils.compareTaskIds('1.2', '1.1')).toBeGreaterThan(0);
      expect(graphUtils.compareTaskIds('1.1', '1.1')).toBe(0);
      expect(graphUtils.compareTaskIds('2.1', '1.2')).toBeGreaterThan(0);
    });
    
    it('should treat shorter IDs as coming before longer IDs with the same prefix', () => {
      expect(graphUtils.compareTaskIds('1', '1.1')).toBeLessThan(0);
      expect(graphUtils.compareTaskIds('1.1', '1')).toBeGreaterThan(0);
      expect(graphUtils.compareTaskIds('1.1', '1.1.1')).toBeLessThan(0);
    });
  });
  
  describe('generateNewId', () => {
    it('should increment the last part of an ID', () => {
      expect(graphUtils.generateNewId('1', 1)).toBe('2');
      expect(graphUtils.generateNewId('1.1', 1)).toBe('1.2');
      expect(graphUtils.generateNewId('1.1.1', 1)).toBe('1.1.2');
    });
    
    it('should add the specified offset', () => {
      expect(graphUtils.generateNewId('1', 2)).toBe('3');
      expect(graphUtils.generateNewId('1.1', 3)).toBe('1.4');
    });
    
    it('should throw an error for invalid offsets resulting in zero or negative values', () => {
      expect(() => graphUtils.generateNewId('1', -1)).toThrow();
      expect(() => graphUtils.generateNewId('1', -2)).toThrow();
      expect(() => graphUtils.generateNewId('1.1', -1)).toThrow();
    });
  });
  
  describe('isDescendant', () => {
    it('should identify direct children as descendants', () => {
      expect(graphUtils.isDescendant('1.1', '1')).toBe(true);
      expect(graphUtils.isDescendant('1.2', '1')).toBe(true);
    });
    
    it('should identify indirect descendants', () => {
      expect(graphUtils.isDescendant('1.1.1', '1')).toBe(true);
      expect(graphUtils.isDescendant('1.2.3.4', '1')).toBe(true);
    });
    
    it('should not identify non-descendants', () => {
      expect(graphUtils.isDescendant('1', '1')).toBe(false); // Same ID
      expect(graphUtils.isDescendant('2', '1')).toBe(false); // Different branch
      expect(graphUtils.isDescendant('2.1', '1')).toBe(false); // Different branch
      expect(graphUtils.isDescendant('10', '1')).toBe(false); // Not a descendant despite starting with the same digit
    });
  });
  
  describe('findDescendants', () => {
    it('should find all descendants in a collection', () => {
      const tasks: Task[] = [
        { id: '1', title: 'Root', parentId: null } as Task,
        { id: '1.1', title: 'Child 1', parentId: '1' } as Task,
        { id: '1.2', title: 'Child 2', parentId: '1' } as Task,
        { id: '1.1.1', title: 'Grandchild', parentId: '1.1' } as Task,
        { id: '2', title: 'Another Root', parentId: null } as Task
      ];
      
      const descendants = graphUtils.findDescendants(tasks, '1');
      
      expect(descendants.length).toBe(3);
      expect(descendants.map(t => t.id)).toContain('1.1');
      expect(descendants.map(t => t.id)).toContain('1.2');
      expect(descendants.map(t => t.id)).toContain('1.1.1');
      expect(descendants.map(t => t.id)).not.toContain('1');
      expect(descendants.map(t => t.id)).not.toContain('2');
    });
    
    it('should return an empty array when no descendants exist', () => {
      const tasks: Task[] = [
        { id: '1', title: 'Root', parentId: null } as Task,
        { id: '2', title: 'Another Root', parentId: null } as Task
      ];
      
      const descendants = graphUtils.findDescendants(tasks, '1');
      
      expect(descendants.length).toBe(0);
    });
    
    it('should find only descendants of the specified ancestor', () => {
      const tasks: Task[] = [
        { id: '1', title: 'Root 1', parentId: null } as Task,
        { id: '1.1', title: 'Child 1', parentId: '1' } as Task,
        { id: '2', title: 'Root 2', parentId: null } as Task,
        { id: '2.1', title: 'Child of Root 2', parentId: '2' } as Task
      ];
      
      const descendants1 = graphUtils.findDescendants(tasks, '1');
      expect(descendants1.length).toBe(1);
      expect(descendants1[0].id).toBe('1.1');
      
      const descendants2 = graphUtils.findDescendants(tasks, '2');
      expect(descendants2.length).toBe(1);
      expect(descendants2[0].id).toBe('2.1');
    });
  });
});

// Tests for getSubgraphNodes and getDescendants using mocks
describe('TaskGraph Core Methods', () => {
  describe('getSubgraphNodes method', () => {
    it('should handle errors when building the graph', async () => {
      // Create mock repository and graph
      const mockRepo = {} as TaskRepository;
      const graph = new TaskGraph(mockRepo);
      
      // Mock the buildGraph method to simulate an error
      const spy = vi.spyOn(graph, 'buildGraph');
      spy.mockResolvedValue({
        success: false,
        error: new Error('Test error')
      });
      
      const result = await graph.getSubgraphNodes('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Restore the original method
      spy.mockRestore();
    });
  });

  describe('getDescendants method', () => {
    it('should handle errors from the repository', async () => {
      // Create mock repository and graph
      const mockRepo = {
        getAllTasks: () => Promise.resolve({
          success: false,
          error: new Error('Repository error')
        })
      } as unknown as TaskRepository;
      
      const graph = new TaskGraph(mockRepo);
      const result = await graph.getDescendants('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('handleTaskDeletion method', () => {
    it('should handle errors when getting the task', async () => {
      // Create mock repository and graph
      const mockRepo = {
        getTask: () => Promise.resolve({
          success: false,
          error: new Error('Task not found')
        })
      } as unknown as TaskRepository;
      
      const graph = new TaskGraph(mockRepo);
      const result = await graph.handleTaskDeletion('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});