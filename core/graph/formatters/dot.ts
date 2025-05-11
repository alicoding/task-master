/**
 * DOT format generator for task graph visualization
 */

import { TaskWithChildren } from '../../types.ts';

/**
 * Format tasks in DOT format for Graphviz
 */
export function formatHierarchyDot(tasks: TaskWithChildren[] = []): string {
  let dot = 'digraph TaskMaster {\n';
  dot += '  rankdir=TB;\n';
  dot += '  node [shape=box, style=filled, fontname="Arial"];\n\n';
  
  // Add node styling based on status
  dot += '  // Node styling based on status\n';
  dot += '  node [fillcolor="#EEEEEE"]; // Default color\n';
  
  // Define nodes and edges
  function processTasks(nodes: TaskWithChildren[]) {
    let result = '';
    
    for (const task of nodes) {
      // Define the node with label and attributes
      const statusColor = task.status === 'todo' ? '#EEEEEE' : 
                         task.status === 'in-progress' ? '#FFEEAA' : 
                         task.status === 'done' ? '#AAFFAA' : '#EEEEEE';
                         
      const readinessIcon = task.readiness === 'draft' ? '✎' : 
                           task.readiness === 'ready' ? '▣' : 
                           task.readiness === 'blocked' ? '⚠' : '';
      
      // Create node definition with HTML label for formatting
      result += `  "${task.id}" [label=<<b>${task.id}</b>: ${task.title} ${readinessIcon}>, fillcolor="${statusColor}"];\n`;
      
      // Process child relationships
      if (task.children && task.children.length > 0) {
        for (const child of task.children) {
          result += `  "${task.id}" -> "${child.id}";\n`;
        }
        
        // Recursively process children
        result += processTasks(task.children);
      }
    }
    
    return result;
  }
  
  // Add all tasks to the graph
  dot += processTasks(tasks);
  
  // Close the graph
  dot += '}\n';
  
  return dot;
}