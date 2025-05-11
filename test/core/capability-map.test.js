// Test for capability map with enhanced relationships
import { CapabilityMapGenerator } from '../../core/capability-map/index.js';
import { TaskRepository } from '../../core/repo.js';
import { AiProviderFactory } from '../../core/ai/factory.js';
import { expect } from 'chai';

// Create a mock repository with sample tasks
const createMockRepository = () => {
  const tasks = [
    {
      id: 'task1',
      title: 'Implement user authentication',
      description: 'Add user login and registration',
      body: 'Need to create login form, registration form, and backend authentication',
      tags: ['auth', 'security', 'frontend'],
      status: 'todo',
      readiness: 'ready',
      parentId: null
    },
    {
      id: 'task2',
      title: 'Create database schema for users',
      description: 'Design and implement user database schema',
      body: 'Need to create tables for users, roles, and permissions',
      tags: ['database', 'schema', 'auth'],
      status: 'in-progress',
      readiness: 'ready',
      parentId: 'task1'
    },
    {
      id: 'task3',
      title: 'Implement user profile page',
      description: 'Create user profile page and edit functionality',
      body: 'Users should be able to view and edit their profile information',
      tags: ['frontend', 'user', 'profile'],
      status: 'todo',
      readiness: 'ready',
      parentId: 'task1'
    },
    {
      id: 'task4',
      title: 'Add password reset functionality',
      description: 'Allow users to reset their passwords',
      body: 'Implement forgot password flow with email verification',
      tags: ['auth', 'security', 'email'],
      status: 'todo',
      readiness: 'blocked',
      parentId: 'task1'
    },
    {
      id: 'task5',
      title: 'Implement API endpoints for tasks',
      description: 'Create REST API for task management',
      body: 'Endpoints for creating, updating, and listing tasks',
      tags: ['api', 'backend', 'tasks'],
      status: 'todo',
      readiness: 'ready',
      parentId: null
    }
  ];

  return {
    getAllTasks: async () => tasks,
    searchTasks: async (filters) => {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          return tasks.filter(t => filters.status.includes(t.status));
        } else {
          return tasks.filter(t => t.status === filters.status);
        }
      }
      return tasks;
    }
  };
};

describe('CapabilityMapGenerator with Enhanced Relationships', () => {
  let capabilityGenerator;
  let mockRepository;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    const mockAiProvider = AiProviderFactory.createProvider({ type: 'mock' });
    capabilityGenerator = new CapabilityMapGenerator(mockRepository, mockAiProvider);
  });
  
  it('should generate a capability map with enhanced relationships', async () => {
    // Generate the capability map
    const map = await capabilityGenerator.generateCapabilityMap();
    
    // Check that the map has nodes and edges
    expect(map).to.be.an('object');
    expect(map.nodes).to.be.an('array');
    expect(map.edges).to.be.an('array');
    
    // Check that capabilities were detected
    expect(map.nodes.length).to.be.greaterThan(0);
    
    // Check that relationships were detected
    expect(map.edges.length).to.be.greaterThan(0);
    
    // Check relationship types
    const relationshipTypes = new Set(map.edges.map(edge => edge.type));
    console.log('Relationship types:', Array.from(relationshipTypes));
    
    // We should have more sophisticated relationship types now
    const hasEnhancedRelationships = Array.from(relationshipTypes).some(
      type => ['depends-on', 'extends', 'related-to', 'part-of', 'similar-to', 'sequenced-with'].includes(type)
    );
    
    expect(hasEnhancedRelationships, 'Should have enhanced relationship types').to.be.true;
    
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