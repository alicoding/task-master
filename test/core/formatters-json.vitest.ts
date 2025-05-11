import { describe, it, expect } from 'vitest';
import { formatHierarchyJson } from '../../core/graph/formatters/json.ts';
import { formatHierarchyDot } from '../../core/graph/formatters/dot.ts';
import { formatHierarchyMermaid } from '../../core/graph/formatters/mermaid.ts';
import { HierarchyTask } from '../../core/types.ts';

// Sample hierarchy tasks for testing
const sampleHierarchy: HierarchyTask[] = [
  {
    id: '1',
    title: 'Root Task 1',
    description: 'Root task description',
    status: 'in-progress',
    priority: 'high',
    tags: ['important'],
    parentId: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  },
  {
    id: '1.1',
    title: 'Child Task 1.1',
    description: 'Child task description',
    status: 'todo',
    priority: 'medium',
    tags: ['feature'],
    parentId: '1',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-04')
  },
  {
    id: '2',
    title: 'Root Task 2',
    description: 'Another root task',
    status: 'done',
    priority: 'low',
    tags: ['bug'],
    parentId: null,
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-01-06')
  }
] as HierarchyTask[];

describe('JSON Formatter', () => {
  describe('formatHierarchyJson', () => {
    it('should format tasks as a flat JSON array in flat mode', () => {
      const result = formatHierarchyJson(sampleHierarchy, 'flat');
      
      // Result should be an array
      expect(Array.isArray(result)).toBe(true);
      
      // Should contain all the tasks
      expect(result.length).toBe(3);
      
      // Check that all tasks are included
      const ids = result.map(task => task.id);
      expect(ids).toContain('1');
      expect(ids).toContain('1.1');
      expect(ids).toContain('2');
      
      // Check that parent-child relationships are preserved
      const childTask = result.find(task => task.id === '1.1');
      expect(childTask?.parentId).toBe('1');
    });
    
    it('should handle empty task array', () => {
      const result = formatHierarchyJson([], 'flat');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});

describe('DOT Formatter', () => {
  describe('formatHierarchyDot', () => {
    it('should format tasks as a DOT graph', () => {
      const result = formatHierarchyDot(sampleHierarchy);
      
      // Check that the result is a string
      expect(typeof result).toBe('string');
      
      // Check that it contains DOT syntax
      expect(result).toContain('digraph');
      expect(result).toContain('rankdir=');
      
      // Check that all tasks are included
      expect(result).toContain('"1"');
      expect(result).toContain('"1.1"');
      expect(result).toContain('"2"');
    });
    
    it('should handle empty task array', () => {
      const result = formatHierarchyDot([]);
      
      // Should still return a valid DOT graph
      expect(typeof result).toBe('string');
      expect(result).toContain('digraph');
      expect(result).toContain('rankdir=');
    });
  });
});

describe('Mermaid Formatter', () => {
  describe('formatHierarchyMermaid', () => {
    it('should format tasks as a Mermaid flowchart', () => {
      const result = formatHierarchyMermaid(sampleHierarchy);
      
      // Check that the result is a string
      expect(typeof result).toBe('string');
      
      // Check that it contains Mermaid syntax
      expect(result).toContain('flowchart TD');
      
      // Check that all tasks are included
      expect(result).toContain('task_1');
      expect(result).toContain('task_1_1');
      expect(result).toContain('task_2');
      
      // Check that task titles are included
      expect(result).toContain('Root Task 1');
      expect(result).toContain('Child Task 1.1');
      expect(result).toContain('Root Task 2');
      
      // The formatter should include task classes
      expect(result).toContain('classDef todo');
      expect(result).toContain('classDef inProgress');
      expect(result).toContain('classDef done');
    });
    
    it('should handle empty task array', () => {
      const result = formatHierarchyMermaid([]);
      
      // Should still return a valid Mermaid chart
      expect(typeof result).toBe('string');
      expect(result).toContain('flowchart TD');
    });
  });
});