/**
 * graph-extended.vitest.ts - Extended tests for TaskGraph
 * 
 * Definition of Done:
 * ✅ Tests use proper TypeScript imports with .ts extensions
 * ✅ Tests include setup and teardown for proper resource cleanup
 * ✅ All assertions use Vitest expect() syntax
 * ✅ Tests are grouped logically in describe blocks
 * ✅ Tests handle both TaskOperationResult and legacy direct return patterns
 * ✅ Tests properly clean up resources (e.g., close database connections)
 * ✅ Tests cover main functionality and error cases
 * ✅ Tests verify handling of edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskRepository } from '../../core/repo.ts';
import { TaskGraph } from '../../core/graph.ts';
import { compareTaskIds, generateNewId, isDescendant, findDescendants } from '../../core/graph/utils.ts';
import { Task } from '../../db/schema.ts';
import { TaskOperationResult, TaskError, TaskErrorCode } from '../../core/types.ts';

describe('TaskGraph Extended Tests', () => {
  let repo: TaskRepository;
  let graph: TaskGraph;
  
  // Helper function to create a task and handle both return types
  async function createTestTask(taskData: any): Promise<any> {
    const result = await repo.createTask(taskData);
    
    if (result && typeof result === 'object') {
      if ('success' in result) {
        // It's a TaskOperationResult
        expect(result.success).toBeTruthy();
        return result.data!;
      } else {
        // It's a direct task object from legacy method
        return result;
      }
    }
    
    throw new Error('Failed to create task');
  }
  
  // Setup function to create a test task hierarchy
  async function setupTestHierarchy() {
    // Create a root-level task
    const task1 = await createTestTask({
      title: 'Root Task 1'
    });
    
    // Create child tasks
    const task1_1 = await createTestTask({
      title: 'Child Task 1.1',
      childOf: task1.id
    });
    
    const task1_2 = await createTestTask({
      title: 'Child Task 1.2',
      childOf: task1.id
    });
    
    // Create a grandchild task
    const task1_1_1 = await createTestTask({
      title: 'Grandchild Task 1.1.1',
      childOf: task1_1.id
    });
    
    // Create another root task
    const task2 = await createTestTask({
      title: 'Root Task 2'
    });
    
    return { task1, task1_1, task1_2, task1_1_1, task2 };
  }
  
  beforeEach(() => {
    // Create repo with in-memory DB for testing
    repo = new TaskRepository('./test.db', true, true);
    graph = new TaskGraph(repo);
  });
  
  afterEach(() => {
    // Clean up after each test
    repo.close();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with a repository', () => {
      expect(graph).toBeDefined();
      expect(graph).toBeInstanceOf(TaskGraph);
    });
  });

  describe('Build Graph', () => {
    it('should build a graph with correct structure', async () => {
      const { task1, task1_1, task1_2, task1_1_1, task2 } = await setupTestHierarchy();
      
      const result = await graph.buildGraph();
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeInstanceOf(Map);
      
      const graphMap = result.data!;
      
      // Verify graph structure
      expect(graphMap.has(task1.id)).toBeTruthy();
      expect(graphMap.has(task1_1.id)).toBeTruthy();
      expect(graphMap.has(task1_2.id)).toBeTruthy();
      expect(graphMap.has(task1_1_1.id)).toBeTruthy();
      expect(graphMap.has(task2.id)).toBeTruthy();
      
      // Root task should have two children
      const rootChildren = graphMap.get(task1.id);
      expect(rootChildren).toBeDefined();
      expect(rootChildren!.size).toEqual(2);
      expect(rootChildren!.has(task1_1.id)).toBeTruthy();
      expect(rootChildren!.has(task1_2.id)).toBeTruthy();
      
      // Child task 1.1 should have one child
      const child1Children = graphMap.get(task1_1.id);
      expect(child1Children).toBeDefined();
      expect(child1Children!.size).toEqual(1);
      expect(child1Children!.has(task1_1_1.id)).toBeTruthy();
      
      // Child task 1.2 should have no children
      const child2Children = graphMap.get(task1_2.id);
      expect(child2Children).toBeDefined();
      expect(child2Children!.size).toEqual(0);
      
      // Root task 2 should have no children
      const root2Children = graphMap.get(task2.id);
      expect(root2Children).toBeDefined();
      expect(root2Children!.size).toEqual(0);
    });
    
    it('should handle errors when retrieving tasks', async () => {
      // Mock the repository to simulate an error
      vi.spyOn(repo, 'getAllTasks').mockResolvedValue({
        success: false,
        error: new TaskError('Mock error getting tasks', TaskErrorCode.DATABASE_ERROR)
      });
      
      const result = await graph.buildGraph();

      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Mock error getting tasks');
      expect(result.error!.code).toBe(TaskErrorCode.DATABASE_ERROR);
    });
    
    it('should handle unexpected exceptions', async () => {
      // Mock the repository to throw an error
      vi.spyOn(repo, 'getAllTasks').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await graph.buildGraph();
      
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Error building graph');
      expect(result.error!.code).toBe(TaskErrorCode.GENERAL_ERROR);
    });
  });

  describe('Format Hierarchy Text', () => {
    it('should format hierarchy as text when tasks are provided', async () => {
      await setupTestHierarchy();
      
      // Mock buildTaskHierarchy to return a predefined hierarchy
      const mockHierarchy = [
        { id: '1', title: 'Root Task 1', children: [
          { id: '1.1', title: 'Child Task 1.1', children: [
            { id: '1.1.1', title: 'Grandchild Task 1.1.1', children: [] }
          ]},
          { id: '1.2', title: 'Child Task 1.2', children: [] }
        ]},
        { id: '2', title: 'Root Task 2', children: [] }
      ];
      
      const textOutput = await graph.formatHierarchyText(mockHierarchy);
      
      // Verify output contains all tasks
      expect(textOutput).toContain('Root Task 1');
      expect(textOutput).toContain('Child Task 1.1');
      expect(textOutput).toContain('Grandchild Task 1.1.1');
      expect(textOutput).toContain('Child Task 1.2');
      expect(textOutput).toContain('Root Task 2');
    });
    
    it('should attempt to build hierarchy when no tasks are provided', async () => {
      await setupTestHierarchy();
      
      const textOutput = await graph.formatHierarchyText();
      
      // Verify output contains all tasks
      expect(textOutput).toContain('Root Task 1');
      expect(textOutput).toContain('Child Task 1.1');
      expect(textOutput).toContain('Grandchild Task 1.1.1');
      expect(textOutput).toContain('Child Task 1.2');
      expect(textOutput).toContain('Root Task 2');
    });
    
    it('should handle failure to build hierarchy', async () => {
      // Mock the repository to simulate an error
      vi.spyOn(repo, 'buildTaskHierarchy').mockResolvedValue({
        success: false,
        error: new TaskError('Failed to build hierarchy', TaskErrorCode.DATABASE_ERROR)
      });
      
      // Mock console.warn to capture warning
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const textOutput = await graph.formatHierarchyText();
      
      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to build hierarchy'));
      
      // Output should be empty or have default formatting for empty list
      expect(textOutput).toBeDefined();
    });
  });

  describe('Format Task View', () => {
    it('should format a single task view', async () => {
      const { task1 } = await setupTestHierarchy();
      
      const output = await graph.formatTaskView(task1);
      
      // Verify output contains task details
      expect(output).toContain('Root Task 1');
      expect(output).toBeDefined();
    });
  });

  describe('Format Task List', () => {
    it('should format a list of tasks', async () => {
      await setupTestHierarchy();
      
      // Get all tasks
      const tasksResult = await repo.getAllTasks();
      expect(tasksResult.success).toBeTruthy();
      
      const output = await graph.formatTaskList(tasksResult.data!);
      
      // Verify output contains task details
      expect(output).toContain('Root Task 1');
      expect(output).toContain('Root Task 2');
      expect(output).toBeDefined();
    });
  });

  describe('Format Hierarchy JSON', () => {
    it('should format hierarchy as JSON when tasks are provided', async () => {
      // Mock buildTaskHierarchy to return a predefined hierarchy
      const mockHierarchy = [
        { id: '1', title: 'Root Task 1', children: [
          { id: '1.1', title: 'Child Task 1.1', children: [
            { id: '1.1.1', title: 'Grandchild Task 1.1.1', children: [] }
          ]},
          { id: '1.2', title: 'Child Task 1.2', children: [] }
        ]},
        { id: '2', title: 'Root Task 2', children: [] }
      ];
      
      const jsonOutput = await graph.formatHierarchyJson(mockHierarchy);
      
      // Verify JSON structure
      expect(Array.isArray(jsonOutput)).toBeTruthy();
      expect(jsonOutput.length).toBeGreaterThan(0);
      
      // Find specific tasks
      const rootTask = jsonOutput.find((t: any) => t.id === '1');
      expect(rootTask).toBeDefined();
      expect(rootTask.title).toEqual('Root Task 1');
      
      const childTask = jsonOutput.find((t: any) => t.id === '1.1');
      expect(childTask).toBeDefined();
      expect(childTask.title).toEqual('Child Task 1.1');
    });
    
    it('should attempt to build hierarchy when no tasks are provided', async () => {
      await setupTestHierarchy();
      
      const jsonOutput = await graph.formatHierarchyJson();
      
      // Verify JSON structure
      expect(Array.isArray(jsonOutput)).toBeTruthy();
      expect(jsonOutput.length).toBeGreaterThan(0);
      
      // Find specific tasks
      const rootTask = jsonOutput.find((t: any) => t.title === 'Root Task 1');
      expect(rootTask).toBeDefined();
      
      const childTask = jsonOutput.find((t: any) => t.title === 'Child Task 1.1');
      expect(childTask).toBeDefined();
    });
    
    it('should handle failure to build hierarchy', async () => {
      // Mock the repository to simulate an error
      vi.spyOn(repo, 'buildTaskHierarchy').mockResolvedValue({
        success: false,
        error: new TaskError('Failed to build hierarchy', TaskErrorCode.DATABASE_ERROR)
      });
      
      // Mock console.warn to capture warning
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const jsonOutput = await graph.formatHierarchyJson();
      
      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to build hierarchy'));
      
      // Output should be empty array
      expect(Array.isArray(jsonOutput)).toBeTruthy();
      expect(jsonOutput.length).toEqual(0);
    });
  });

  describe('Format Hierarchy DOT', () => {
    it('should format hierarchy as DOT graph', async () => {
      await setupTestHierarchy();
      
      const dotOutput = await graph.formatHierarchyDot();
      
      // Verify DOT format basics
      expect(dotOutput).toContain('digraph');
      // DOT format uses HTML-like labels rather than -> arrows
      expect(dotOutput).toContain('label=<');
      expect(dotOutput).toContain('Root Task 1');
      expect(dotOutput).toContain('Child Task 1.1');
    });
    
    it('should handle empty task list', async () => {
      // Mock the repository to return empty hierarchy
      vi.spyOn(repo, 'buildTaskHierarchy').mockResolvedValue({
        success: true,
        data: []
      });
      
      const dotOutput = await graph.formatHierarchyDot();
      
      // Verify DOT format for empty graph still has structure
      expect(dotOutput).toContain('digraph');
      expect(dotOutput.length).toBeGreaterThan(0);
    });
  });

  describe('Format Hierarchy Mermaid', () => {
    it('should format hierarchy as Mermaid flowchart', async () => {
      await setupTestHierarchy();
      
      const mermaidOutput = await graph.formatHierarchyMermaid();
      
      // Verify Mermaid format basics
      expect(mermaidOutput).toContain('flowchart TD');
      // Mermaid doesn't use --> but rather displays tasks in bracketed format
      expect(mermaidOutput).toContain('["');
      expect(mermaidOutput).toContain('Root Task 1');
      expect(mermaidOutput).toContain('Child Task 1.1');
    });
    
    it('should handle empty task list', async () => {
      // Mock the repository to return empty hierarchy
      vi.spyOn(repo, 'buildTaskHierarchy').mockResolvedValue({
        success: true,
        data: []
      });
      
      const mermaidOutput = await graph.formatHierarchyMermaid();
      
      // Verify Mermaid format for empty graph still has structure
      expect(mermaidOutput).toContain('flowchart TD');
      expect(mermaidOutput.length).toBeGreaterThan(0);
    });
  });

  describe('Get Subgraph Nodes', () => {
    it('should get all nodes in a subgraph', async () => {
      const { task1, task1_1, task1_2, task1_1_1 } = await setupTestHierarchy();
      
      const result = await graph.getSubgraphNodes(task1.id);
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeInstanceOf(Set);
      
      const nodes = result.data!;
      
      // Root and all its descendants should be in the set
      expect(nodes.has(task1.id)).toBeTruthy();
      expect(nodes.has(task1_1.id)).toBeTruthy();
      expect(nodes.has(task1_2.id)).toBeTruthy();
      expect(nodes.has(task1_1_1.id)).toBeTruthy();
    });
    
    it('should handle errors building the graph', async () => {
      // Mock buildGraph to simulate an error
      vi.spyOn(graph, 'buildGraph').mockResolvedValue({
        success: false,
        error: new TaskError('Failed to build graph', TaskErrorCode.GENERAL_ERROR)
      });
      
      const result = await graph.getSubgraphNodes('1');
      
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Failed to build graph');
    });
    
    it('should handle unexpected exceptions', async () => {
      // Mock buildGraph to throw an error
      vi.spyOn(graph, 'buildGraph').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await graph.getSubgraphNodes('1');
      
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Error getting subgraph nodes');
    });
  });

  describe('Get Descendants', () => {
    it('should get all descendants of a task', async () => {
      const { task1, task1_1, task1_2, task1_1_1 } = await setupTestHierarchy();
      
      const result = await graph.getDescendants(task1.id);
      
      expect(result.success).toBeTruthy();
      expect(Array.isArray(result.data)).toBeTruthy();
      
      const descendants = result.data!;
      
      // All descendant IDs should start with the parent ID + '.'
      expect(descendants.length).toEqual(3); // 1.1, 1.2, 1.1.1
      expect(descendants.some(task => task.id === task1_1.id)).toBeTruthy();
      expect(descendants.some(task => task.id === task1_2.id)).toBeTruthy();
      expect(descendants.some(task => task.id === task1_1_1.id)).toBeTruthy();
    });
    
    it('should return empty array for tasks with no descendants', async () => {
      const { task1_1_1 } = await setupTestHierarchy();
      
      const result = await graph.getDescendants(task1_1_1.id);
      
      expect(result.success).toBeTruthy();
      expect(Array.isArray(result.data)).toBeTruthy();
      expect(result.data!.length).toEqual(0);
    });
    
    it('should handle errors retrieving tasks', async () => {
      // Mock getAllTasks to simulate an error
      vi.spyOn(repo, 'getAllTasks').mockResolvedValue({
        success: false,
        error: new TaskError('Failed to retrieve tasks', TaskErrorCode.DATABASE_ERROR)
      });
      
      const result = await graph.getDescendants('1');
      
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Failed to retrieve tasks');
    });
    
    it('should handle unexpected exceptions', async () => {
      // Mock getAllTasks to throw an error
      vi.spyOn(repo, 'getAllTasks').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await graph.getDescendants('1');
      
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Error getting task descendants');
    });
  });

  describe('Handle Task Deletion', () => {
    it('should handle deletion of a root task', async () => {
      const { task1 } = await setupTestHierarchy();
      
      // Mock reorderRootTasksAfterDeletion to simulate success
      vi.spyOn(repo, 'reorderRootTasksAfterDeletion').mockResolvedValue({
        success: true,
        data: true
      });
      
      const result = await graph.handleTaskDeletion(task1.id);
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeTruthy();
      expect(repo.reorderRootTasksAfterDeletion).toHaveBeenCalledWith(task1.id);
    });
    
    it('should handle deletion of a child task', async () => {
      const { task1_1 } = await setupTestHierarchy();
      
      // Mock reorderSiblingTasksAfterDeletion to simulate success
      vi.spyOn(repo, 'reorderSiblingTasksAfterDeletion').mockResolvedValue({
        success: true,
        data: true
      });
      
      const result = await graph.handleTaskDeletion(task1_1.id);
      
      expect(result.success).toBeTruthy();
      expect(result.data).toBeTruthy();
      expect(repo.reorderSiblingTasksAfterDeletion).toHaveBeenCalledWith('1', task1_1.id);
    });
    
    it('should handle errors getting the task', async () => {
      // Mock getTask to simulate an error
      vi.spyOn(repo, 'getTask').mockResolvedValue({
        success: false,
        error: new TaskError('Task not found', TaskErrorCode.NOT_FOUND)
      });
      
      const result = await graph.handleTaskDeletion('999');

      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Task not found');
    });
    
    it('should handle errors reordering sibling tasks', async () => {
      const { task1_1 } = await setupTestHierarchy();
      
      // Mock reorderSiblingTasksAfterDeletion to simulate an error
      vi.spyOn(repo, 'reorderSiblingTasksAfterDeletion').mockResolvedValue({
        success: false,
        error: new TaskError('Error reordering tasks', TaskErrorCode.DATABASE_ERROR)
      });
      
      const result = await graph.handleTaskDeletion(task1_1.id);
      
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Error reordering tasks');
    });
    
    it('should handle unexpected exceptions', async () => {
      // Mock getTask to throw an error
      vi.spyOn(repo, 'getTask').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await graph.handleTaskDeletion('1');
      
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Error handling task deletion');
    });
  });
});

describe('TaskGraph Utils', () => {
  describe('compareTaskIds', () => {
    it('should correctly compare simple task IDs', () => {
      expect(compareTaskIds('1', '2')).toBeLessThan(0);
      expect(compareTaskIds('2', '1')).toBeGreaterThan(0);
      expect(compareTaskIds('1', '1')).toBe(0);
    });
    
    it('should correctly compare compound task IDs', () => {
      expect(compareTaskIds('1.1', '1.2')).toBeLessThan(0);
      expect(compareTaskIds('1.2', '1.1')).toBeGreaterThan(0);
      expect(compareTaskIds('1.1', '1.1')).toBe(0);
      expect(compareTaskIds('2.1', '1.2')).toBeGreaterThan(0);
    });
    
    it('should correctly compare task IDs of different lengths', () => {
      expect(compareTaskIds('1', '1.1')).toBeLessThan(0);
      expect(compareTaskIds('1.1', '1')).toBeGreaterThan(0);
      expect(compareTaskIds('1.1.1', '1.1')).toBeGreaterThan(0);
    });
  });
  
  describe('generateNewId', () => {
    it('should generate a new ID with positive offset', () => {
      expect(generateNewId('1', 1)).toBe('2');
      expect(generateNewId('1.1', 1)).toBe('1.2');
      expect(generateNewId('1.1.1', 1)).toBe('1.1.2');
    });
    
    it('should generate a new ID with offset greater than 1', () => {
      expect(generateNewId('1', 2)).toBe('3');
      expect(generateNewId('1.1', 3)).toBe('1.4');
    });
    
    it('should throw an error for invalid offsets', () => {
      expect(() => generateNewId('1', -1)).toThrow();
      expect(() => generateNewId('1.1', -1)).toThrow();
      expect(() => generateNewId('1', -5)).toThrow();
    });
  });
  
  describe('isDescendant', () => {
    it('should correctly identify direct descendants', () => {
      expect(isDescendant('1.1', '1')).toBeTruthy();
      expect(isDescendant('1.2', '1')).toBeTruthy();
      expect(isDescendant('2.1', '2')).toBeTruthy();
    });
    
    it('should correctly identify indirect descendants', () => {
      expect(isDescendant('1.1.1', '1')).toBeTruthy();
      expect(isDescendant('1.2.3.4', '1')).toBeTruthy();
      expect(isDescendant('1.1.1', '1.1')).toBeTruthy();
    });
    
    it('should correctly identify non-descendants', () => {
      expect(isDescendant('2.1', '1')).toBeFalsy();
      expect(isDescendant('1.1', '1.2')).toBeFalsy();
      expect(isDescendant('1', '1')).toBeFalsy(); // A task is not its own descendant
    });
    
    it('should handle edge cases', () => {
      expect(isDescendant('11', '1')).toBeFalsy(); // 11 is not a descendant of 1
      expect(isDescendant('1.11', '1.1')).toBeFalsy(); // 1.11 is not a descendant of 1.1
    });
  });
  
  describe('findDescendants', () => {
    it('should find all descendants in a task array', () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '1.1', title: 'Task 1.1' },
        { id: '1.1.1', title: 'Task 1.1.1' },
        { id: '1.2', title: 'Task 1.2' },
        { id: '2', title: 'Task 2' },
        { id: '2.1', title: 'Task 2.1' }
      ] as Task[];
      
      const descendants1 = findDescendants(tasks, '1');
      expect(descendants1.length).toBe(3);
      expect(descendants1.map(t => t.id)).toEqual(expect.arrayContaining(['1.1', '1.1.1', '1.2']));
      
      const descendants2 = findDescendants(tasks, '2');
      expect(descendants2.length).toBe(1);
      expect(descendants2[0].id).toBe('2.1');
      
      const descendants1_1 = findDescendants(tasks, '1.1');
      expect(descendants1_1.length).toBe(1);
      expect(descendants1_1[0].id).toBe('1.1.1');
    });
    
    it('should return empty array for tasks with no descendants', () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ] as Task[];
      
      const descendants = findDescendants(tasks, '1');
      expect(descendants.length).toBe(0);
    });
    
    it('should handle empty task array', () => {
      const tasks: Task[] = [];
      
      const descendants = findDescendants(tasks, '1');
      expect(descendants.length).toBe(0);
    });
  });
});