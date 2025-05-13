/**
 * Mermaid format generator for task graph visualization
 */

import { TaskWithChildren } from '@/core/types';

/**
 * Format tasks in Mermaid flowchart format
 */
export function formatHierarchyMermaid(tasks: TaskWithChildren[] = []): string {
  let mermaid = 'flowchart TD\n';
  
  // Define styles for nodes based on status
  const styles = [
    'classDef todo fill:#f5f5f5,stroke:#ddd,color:#333',
    'classDef inProgress fill:#fff8dc,stroke:#ffb347,color:#333',
    'classDef done fill:#e6ffe6,stroke:#8fbc8f,color:#333',
    'classDef draft stroke-dasharray: 5 5',
    'classDef ready stroke-width:2px',
    'classDef blocked fill:#ffe6e6,color:#333'
  ];
  
  // Define nodes and edges
  function processTasks(nodes: TaskWithChildren[]): { nodes: string[], edges: string[] } {
    let nodeDefinitions: string[] = [];
    let edgeDefinitions: string[] = [];
    
    for (const task of nodes) {
      // Define the node with label
      const nodeId = `task_${task.id.replace(/\W/g, '_')}`;
      const statusClass = task.status === 'todo' ? 'todo' : 
                         task.status === 'in-progress' ? 'inProgress' : 
                         task.status === 'done' ? 'done' : 'todo';
      
      const readinessClass = task.readiness === 'draft' ? 'draft' : 
                            task.readiness === 'ready' ? 'ready' : 
                            task.readiness === 'blocked' ? 'blocked' : '';
      
      // Add readiness indicator
      const readinessIcon = task.readiness === 'draft' ? '✎' : 
                           task.readiness === 'ready' ? '▣' : 
                           task.readiness === 'blocked' ? '⚠' : '';
      
      // Create node definition
      nodeDefinitions.push(`  ${nodeId}["${task.id}: ${task.title} ${readinessIcon}"]`);
      
      // Add class to the node
      nodeDefinitions.push(`  class ${nodeId} ${statusClass}`);
      if (readinessClass) {
        nodeDefinitions.push(`  class ${nodeId} ${readinessClass}`);
      }
      
      // Process child relationships
      if (task.children && task.children.length > 0) {
        for (const child of task.children) {
          const childId = `task_${child.id.replace(/\W/g, '_')}`;
          edgeDefinitions.push(`  ${nodeId} --> ${childId}`);
        }
        
        // Recursively process children
        const childResults = processTasks(task.children);
        nodeDefinitions = [...nodeDefinitions, ...childResults.nodes];
        edgeDefinitions = [...edgeDefinitions, ...childResults.edges];
      }
    }
    
    return { nodes: nodeDefinitions, edges: edgeDefinitions };
  }
  
  // Process all tasks
  const { nodes, edges } = processTasks(tasks);
  
  // Add node and edge definitions to the diagram
  mermaid += nodes.join('\n') + '\n';
  mermaid += edges.join('\n') + '\n';
  
  // Add class definitions
  mermaid += '\n' + styles.join('\n') + '\n';
  
  return mermaid;
}