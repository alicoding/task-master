// Manual test for capability map with enhanced relationships
import { CapabilityMapGenerator } from '../core/capability-map/index.ts';
import { AiProviderFactory } from '../core/ai/factory.ts';

// Create a mock repository with sample tasks
const createMockRepository = (): any => {
  const tasks: any[] = [
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

// Run the test
async function testCapabilityMap(): void {
  console.log('Testing capability map with enhanced relationships...');
  
  const mockRepository = createMockRepository();
  const mockAiProvider = AiProviderFactory.createProvider({ type: 'mock' });
  const capabilityGenerator = new CapabilityMapGenerator(mockRepository, mockAiProvider);
  
  try {
    // Generate the capability map
    const map = await capabilityGenerator.generateCapabilityMap();
    
    // Check that the map has nodes and edges
    console.log('Map generated successfully!');
    console.log(`Found ${map.nodes.length} capabilities and ${map.edges.length} relationships`);
    
    // Check relationship types
    const relationshipTypes = new Set(map.edges.map(edge => edge.type));
    console.log('Relationship types:', Array.from(relationshipTypes));
    
    // We should have more sophisticated relationship types now
    const hasEnhancedRelationships = Array.from(relationshipTypes).some(
      type => ['depends-on', 'extends', 'related-to', 'part-of', 'similar-to', 'sequenced-with'].includes(type)
    );
    
    console.log('Has enhanced relationships:', hasEnhancedRelationships);
    
    // Output the map for manual inspection
    console.log('\nCapability Map Nodes:');
    map.nodes.forEach(n => {
      console.log(`- ${n.name} (${n.type}): ${n.tasks.length} tasks`);
    });
    
    console.log('\nCapability Map Relationships:');
    map.edges.forEach(e => {
      const source = map.nodes.find(n => n.id === e.source)?.name || e.source;
      const target = map.nodes.find(n => n.id === e.target)?.name || e.target;
      console.log(`- ${source} ${e.type} ${target} (${e.strength.toFixed(2)}): ${e.description}`);
    });
  } catch (error) {
    console.error('Error testing capability map:', error);
  }
}

testCapabilityMap();