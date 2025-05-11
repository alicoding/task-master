/**
 * Test script for adding a task
 * This standalone script tests adding a task using the TaskRepository
 */

import { TaskRepository } from '../core/repo.ts';
import { TaskInsertOptions } from '../core/types.ts';

// Main test function
async function testAddTask(): Promise<void> {
  console.log('Testing task creation...');
  
  // Create repository with in-memory database
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Test adding a basic task
    const basicTask: TaskInsertOptions = {
      title: 'Basic Test Task'
    };
    
    console.log(`Adding basic task: ${basicTask.title}`);
    const basicResult = await repo.createTask(basicTask);
    
    if (basicResult.success && basicResult.data) {
      console.log(`✅ Basic task created with ID: ${basicResult.data.id}`);
      console.log(`  Title: ${basicResult.data.title}`);
      console.log(`  Status: ${basicResult.data.status}`);
      console.log(`  Readiness: ${basicResult.data.readiness}`);
    } else {
      console.error(`❌ Failed to create basic task: ${basicResult.error?.message || 'Unknown error'}`);
      return;
    }
    
    // Test adding a task with all fields
    const complexTask: TaskInsertOptions = {
      title: 'Complex Test Task',
      description: 'A more complex task with multiple fields',
      body: 'This task has a detailed body with more information.',
      status: 'in-progress',
      readiness: 'ready',
      tags: ['test', 'important'],
      metadata: {
        priority: 'high',
        complexity: 3,
        estimated_hours: 4.5,
        nested: {
          option1: true,
          option2: 'value'
        }
      }
    };
    
    console.log(`\nAdding complex task: ${complexTask.title}`);
    const complexResult = await repo.createTask(complexTask);
    
    if (complexResult.success && complexResult.data) {
      console.log(`✅ Complex task created with ID: ${complexResult.data.id}`);
      console.log(`  Title: ${complexResult.data.title}`);
      console.log(`  Description: ${complexResult.data.description}`);
      console.log(`  Status: ${complexResult.data.status}`);
      console.log(`  Readiness: ${complexResult.data.readiness}`);
      console.log(`  Tags: ${JSON.stringify(complexResult.data.tags)}`);
      
      // Test retrieving complex task's metadata
      const completeTask = await repo.getTask(complexResult.data.id);
      if (completeTask.success && completeTask.data) {
        console.log('  Metadata:');
        console.log(JSON.stringify(completeTask.data.metadata, null, 2));
        
        // Test nested metadata access
        const priority = await repo.getMetadataField(complexResult.data.id, 'priority');
        console.log(`  Priority from metadata: ${priority}`);
        
        const nestedValue = await repo.getMetadataField(complexResult.data.id, 'nested.option2');
        console.log(`  Nested metadata value: ${nestedValue}`);
      }
    } else {
      console.error(`❌ Failed to create complex task: ${complexResult.error?.message || 'Unknown error'}`);
    }
    
    // Test adding a child task
    const parentTask: TaskInsertOptions = {
      title: 'Parent Task'
    };
    
    console.log('\nTesting parent-child relationship...');
    const parentResult = await repo.createTask(parentTask);
    
    if (parentResult.success && parentResult.data) {
      console.log(`✅ Parent task created with ID: ${parentResult.data.id}`);
      
      const childTask: TaskInsertOptions = {
        title: 'Child Task',
        childOf: parentResult.data.id
      };
      
      const childResult = await repo.createTask(childTask);
      
      if (childResult.success && childResult.data) {
        console.log(`✅ Child task created with ID: ${childResult.data.id}`);
        console.log(`  Parent ID: ${childResult.data.parentId}`);
        
        // Verify parent-child relationship
        const children = await repo.getChildTasks(parentResult.data.id);
        console.log(`  Parent has ${children.length} children`);
        console.log(`  Child IDs: ${children.map(child => child.id).join(', ')}`);
      } else {
        console.error(`❌ Failed to create child task: ${childResult.error?.message || 'Unknown error'}`);
      }
    } else {
      console.error(`❌ Failed to create parent task: ${parentResult.error?.message || 'Unknown error'}`);
    }
    
    console.log('\n✨ Task creation tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    repo.close();
  }
}

// Run the test
testAddTask().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});