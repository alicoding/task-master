/**
 * CapabilityMapGenerator Test
 * Tests capability map generation with enhanced relationships
 */

import { CapabilityMapGenerator } from '../../core/capability-map/index.ts';
import { TaskRepository } from '../../core/repo.ts';
import { AiProviderFactory } from '../../core/ai/factory.ts';
import { Task, TaskStatus, TaskReadiness } from '../../core/types.ts';
import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Mock repository factory that creates a sample repository with test tasks
 */
interface MockTask extends Partial<Task> {
  parentId?: string | null;
  tags: string[];
}

const createMockRepository = () => {
  const tasks: MockTask[] = [
    {
      id: 'task1',
      title: 'Implement user authentication',
      description: 'Add user login and registration',
      body: 'Need to create login form, registration form, and backend authentication',
      tags: ['auth', 'security', 'frontend'],
      status: 'todo' as TaskStatus,
      readiness: 'ready' as TaskReadiness,
      parentId: null
    },
    {
      id: 'task2',
      title: 'Create database schema for users',
      description: 'Design and implement user database schema',
      body: 'Need to create tables for users, roles, and permissions',
      tags: ['database', 'schema', 'auth'],
      status: 'in-progress' as TaskStatus,
      readiness: 'ready' as TaskReadiness,
      parentId: 'task1'
    },
    {
      id: 'task3',
      title: 'Implement user profile page',
      description: 'Create user profile page and edit functionality',
      body: 'Users should be able to view and edit their profile information',
      tags: ['frontend', 'user', 'profile'],
      status: 'todo' as TaskStatus,
      readiness: 'ready' as TaskReadiness,
      parentId: 'task1'
    },
    {
      id: 'task4',
      title: 'Add password reset functionality',
      description: 'Allow users to reset their passwords',
      body: 'Implement forgot password flow with email verification',
      tags: ['auth', 'security', 'email'],
      status: 'todo' as TaskStatus,
      readiness: 'blocked' as TaskReadiness,
      parentId: 'task1'
    },
    {
      id: 'task5',
      title: 'Implement API endpoints for tasks',
      description: 'Create REST API for task management',
      body: 'Endpoints for creating, updating, and listing tasks',
      tags: ['api', 'backend', 'tasks'],
      status: 'todo' as TaskStatus,
      readiness: 'ready' as TaskReadiness,
      parentId: null
    }
  ];

  return {
    getAllTasks: async () => {
      // Handle both legacy and modern return patterns
      return {
        success: true,
        data: tasks as unknown as Task[]
      };
    },
    getAllTasksLegacy: async () => {
      return tasks as unknown as Task[];
    },
    searchTasks: async (filters: { status?: TaskStatus | TaskStatus[] }) => {
      let filteredTasks: MockTask[];

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filteredTasks = tasks.filter(t => t.status && filters.status.includes(t.status));
        } else {
          filteredTasks = tasks.filter(t => t.status === filters.status);
        }
      } else {
        filteredTasks = tasks;
      }

      // Handle both legacy and modern return patterns
      return {
        success: true,
        data: filteredTasks as unknown as Task[]
      };
    },
    searchTasksLegacy: async (filters: { status?: TaskStatus | TaskStatus[] }) => {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          return tasks.filter(t => t.status && filters.status.includes(t.status)) as unknown as Task[];
        } else {
          return tasks.filter(t => t.status === filters.status) as unknown as Task[];
        }
      }
      return tasks as unknown as Task[];
    }
  };
};

describe('CapabilityMapGenerator with Enhanced Relationships', () => {
  let capabilityGenerator: CapabilityMapGenerator;
  let mockRepository: ReturnType<typeof createMockRepository>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    const mockAiProvider = AiProviderFactory.createProvider({ type: 'mock' });
    capabilityGenerator = new CapabilityMapGenerator(mockRepository as unknown as TaskRepository, mockAiProvider);
  });
  
  it('should generate a capability map with enhanced relationships', async () => {
    // Generate the capability map
    const map = await capabilityGenerator.generateCapabilityMap();
    
    // Check that the map has nodes and edges
    expect(map).toBeDefined();
    expect(Array.isArray(map.nodes)).toBeTruthy();
    expect(Array.isArray(map.edges)).toBeTruthy();
    
    // Check that capabilities were detected
    expect(map.nodes.length).toBeGreaterThan(0);
    
    // Check that relationships were detected
    expect(map.edges.length).toBeGreaterThan(0);
    
    // Check relationship types
    const relationshipTypes = new Set(map.edges.map(edge => edge.type));
    console.log('Relationship types:', Array.from(relationshipTypes));
    
    // We should have more sophisticated relationship types now
    const hasEnhancedRelationships = Array.from(relationshipTypes).some(
      type => ['depends-on', 'extends', 'related-to', 'part-of', 'similar-to', 'sequenced-with'].includes(type)
    );
    
    expect(hasEnhancedRelationships).toBeTruthy();
    
    // Optional: Output the map for manual inspection
    console.log('Capability Map Nodes:', map.nodes.map(n => ({
      name: n.name,
      type: n.type,
      taskCount: n.tasks.length
    })));
    
    console.log('Capability Map Relationships:', map.edges.map(e => ({
      source: map.nodes.find(n => n.id === e.source)?.name,
      target: map.nodes.find(n => n.id === e.target)?.name,
      type: e.type,
      strength: e.strength,
      description: e.description
    })));
  });
});