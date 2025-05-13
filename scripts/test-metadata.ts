/**
 * Test script for JSON metadata handling
 */

import { TaskRepository } from '../core/repo.ts';

// Create a test task with nested metadata
async function testMetadataHandling(): void {
  console.log('Starting metadata handling test...');
  
  // Create repository
  const repo = new TaskRepository();
  
  try {
    // Test 1: Create a task with nested metadata
    console.log('\nTest 1: Creating task with nested metadata...');
    const nestedMetadata: Record<string, any> = {
      config: {
        enabled: true,
        options: {
          color: 'blue',
          size: 'medium',
          features: ['a', 'b', 'c']
        }
      },
      items: ['item1', 'item2', 'item3']
    };
    
    const createResult = await repo.createTask({
      title: 'Test Nested Metadata',
      metadata: nestedMetadata
    });
    
    if (!createResult.success || !createResult.data) {
      console.error('Failed to create task:', createResult.error?.message);
      return;
    }
    
    const taskId = createResult.data.id;
    console.log(`Created task with ID: ${taskId}`);
    
    // Test 2: Retrieve the task and check metadata
    console.log('\nTest 2: Retrieving task and checking metadata...');
    const taskResult = await repo.getTask(taskId);
    
    if (!taskResult.success || !taskResult.data) {
      console.error('Failed to retrieve task:', taskResult.error?.message);
      return;
    }
    
    const task = taskResult.data;
    console.log('Retrieved task metadata:', JSON.stringify(task.metadata, null, 2));
    
    // Verify structure is preserved
    const metadata = task.metadata;
    
    let success: boolean = true;
    
    if (!metadata.config) {
      console.error('ERROR: Missing config object in metadata');
      success = false;
    } else if (typeof metadata.config !== 'object') {
      console.error('ERROR: config is not an object:', typeof metadata.config);
      success = false;
    } else {
      if (metadata.config.enabled !== true) {
        console.error('ERROR: config.enabled is not true:', metadata.config.enabled);
        success = false;
      }
      
      if (!metadata.config.options) {
        console.error('ERROR: Missing config.options object');
        success = false;
      } else if (typeof metadata.config.options !== 'object') {
        console.error('ERROR: config.options is not an object:', typeof metadata.config.options);
        success = false;
      } else {
        if (metadata.config.options.color !== 'blue') {
          console.error('ERROR: config.options.color is not "blue":', metadata.config.options.color);
          success = false;
        }
        
        if (metadata.config.options.size !== 'medium') {
          console.error('ERROR: config.options.size is not "medium":', metadata.config.options.size);
          success = false;
        }
        
        if (!Array.isArray(metadata.config.options.features)) {
          console.error('ERROR: config.options.features is not an array:', metadata.config.options.features);
          success = false;
        } else if (metadata.config.options.features.length !== 3) {
          console.error('ERROR: config.options.features length is not 3:', metadata.config.options.features.length);
          success = false;
        }
      }
    }
    
    if (!Array.isArray(metadata.items)) {
      console.error('ERROR: items is not an array:', metadata.items);
      success = false;
    } else if (metadata.items.length !== 3) {
      console.error('ERROR: items length is not 3:', metadata.items.length);
      success = false;
    } else {
      if (metadata.items[0] !== 'item1') {
        console.error('ERROR: items[0] is not "item1":', metadata.items[0]);
        success = false;
      }
    }
    
    // Test 3: Update metadata with new nested object
    console.log('\nTest 3: Updating task with new nested metadata...');
    const updateResult = await repo.updateTask({
      id: taskId,
      metadata: {
        newSection: {
          key1: 'value1',
          key2: 'value2',
          nested: {
            deep: 'value'
          }
        },
        // This should be merged with existing items array
        items: ['newItem1', 'newItem2']
      }
    });
    
    if (!updateResult.success || !updateResult.data) {
      console.error('Failed to update task:', updateResult.error?.message);
      return;
    }
    
    const updatedTask = updateResult.data;
    console.log('Updated task metadata:', JSON.stringify(updatedTask.metadata, null, 2));
    
    // Display the final test results
    if (success) {
      console.log('\n✅ Metadata structure tests PASSED');
    } else {
      console.log('\n❌ Metadata structure tests FAILED');
    }
    
    // Check for correct merging
    let mergeSuccess: boolean = true;
    
    if (!updatedTask.metadata.config) {
      console.error('ERROR: Original config object was lost during update');
      mergeSuccess = false;
    }
    
    if (!updatedTask.metadata.newSection) {
      console.error('ERROR: New section was not added during update');
      mergeSuccess = false;
    } else if (typeof updatedTask.metadata.newSection !== 'object') {
      console.error('ERROR: newSection is not an object:', typeof updatedTask.metadata.newSection);
      mergeSuccess = false;
    } else if (!updatedTask.metadata.newSection.nested || updatedTask.metadata.newSection.nested.deep !== 'value') {
      console.error('ERROR: Nested object in newSection was not preserved');
      mergeSuccess = false;
    }
    
    if (!Array.isArray(updatedTask.metadata.items)) {
      console.error('ERROR: items is not an array after update:', updatedTask.metadata.items);
      mergeSuccess = false;
    } else if (updatedTask.metadata.items.length !== 2) {
      console.error('ERROR: items length is not 2 after update:', updatedTask.metadata.items.length);
      mergeSuccess = false;
    }
    
    if (mergeSuccess) {
      console.log('✅ Metadata merging tests PASSED');
    } else {
      console.log('❌ Metadata merging tests FAILED');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Clean up
    repo.close();
  }
  
  console.log('\nTest completed.');
}

// Run the test
testMetadataHandling();