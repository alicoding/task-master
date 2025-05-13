/**
 * Test script for debugging DoD display
 */

import { DoDManager } from '../../core/dod/manager';
import { formatDoD } from '../../core/graph/formatters/sections/dod-formatter';

async function testDoDDisplay() {
  console.log('Testing DoD display functionality...');
  
  // Create a task with DoD
  const taskId = '31'; // Use an existing task ID
  
  // First, check if DoD is enabled for the task
  const manager = new DoDManager();
  const doDResult = await manager.getTaskDoD(taskId);
  
  console.log('DoD Manager Result:', JSON.stringify(doDResult, null, 2));
  
  // Try to format the DoD
  if (doDResult.success && doDResult.data) {
    console.log('DoD Content Available. Attempting to format...');
    const formatted = await formatDoD(taskId, true);
    console.log('Formatted DoD Output:');
    console.log(formatted || 'No formatted output');
  } else {
    console.log('No DoD content available for this task');
  }
}

// Run the test
testDoDDisplay()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));