/**
 * Mermaid diagram renderer for enhanced capability map visualization
 * 
 * This module provides Mermaid-based rendering of capability maps
 * for compatibility with Markdown documents and web-based visualization.
 */

import { CapabilityMap } from '../../index';
import { EnhancedVisualizationOptions } from '../options';
import {
  getCapabilityProgress,
  normalizeCapabilityNames,
  formatRelationshipType,
  formatGroupName,
  createHierarchicalGroups
} from '../utils/index';

/**
 * Render enhanced Mermaid diagram with progress indicators
 * @param capabilityMap The map to visualize
 * @param options Visualization options
 * @returns Mermaid diagram syntax
 */
export function renderEnhancedMermaidDiagram(
  capabilityMap: CapabilityMap,
  options: EnhancedVisualizationOptions
): string {
  // Apply confidence filters
  const minNodeConfidence = options.minNodeConfidence || 0;
  const filteredNodes = capabilityMap.nodes.filter(
    node => node.confidence >= minNodeConfidence
  );
  
  const minEdgeConfidence = options.minEdgeConfidence || 0;
  const filteredEdges = capabilityMap.edges.filter(
    edge => edge.confidence >= minEdgeConfidence
  );
  
  // Normalize capability names
  const normalizedNodes = normalizeCapabilityNames(filteredNodes);
  
  // Build node ID map
  const nodeIdMap = new Map<string, string>();
  
  for (let i = 0; i < normalizedNodes.length; i++) {
    nodeIdMap.set(normalizedNodes[i].id, `node${i}`);
  }
  
  // Build diagram
  let diagram = 'flowchart TD\n';
  
  // Add title as comment
  const title = options.title || 'TaskMaster Capability Map';
  diagram += `%% ${title}\n`;
  
  // Add class definitions for progress-based styling
  diagram += '  classDef complete fill:#d4edda,stroke:#28a745,stroke-width:2px\n';
  diagram += '  classDef good fill:#d1ecf1,stroke:#17a2b8,stroke-width:2px\n';
  diagram += '  classDef started fill:#fff3cd,stroke:#ffc107,stroke-width:1px\n';
  diagram += '  classDef early fill:#f8d7da,stroke:#dc3545,stroke-width:1px\n';
  diagram += '  classDef default fill:#f9f9f9,stroke:#aaa,stroke-width:1px\n\n';
  
  // Add nodes, grouped by type if requested
  if (options.groupByType) {
    // Group nodes by type
    const nodeGroups = new Map<string, typeof normalizedNodes>();
    
    for (const node of normalizedNodes) {
      if (!nodeGroups.has(node.type)) {
        nodeGroups.set(node.type, []);
      }
      nodeGroups.get(node.type)!.push(node);
    }
    
    // Add nodes grouped in subgraphs
    for (const [type, nodes] of nodeGroups.entries()) {
      if (nodes.length === 0) continue;
      
      // Create subgraph for type
      diagram += `  subgraph ${formatGroupName(type)}\n`;
      
      // Add nodes in this group
      for (const node of nodes) {
        const nodeId = nodeIdMap.get(node.id)!;
        const progress = getCapabilityProgress(node);
        
        let label = node.name;
        if (options.showTaskCount) {
          label += ` (${node.tasks.length})`;
        }
        if (options.showProgress) {
          label += ` [${progress}%]`;
        }
        if (options.showConfidence) {
          label += ` (${Math.round(node.confidence * 100)}%)`;
        }
        
        diagram += `    ${nodeId}["${label}"]\n`;
      }
      
      diagram += '  end\n\n';
    }
  } else if (options.hierarchicalView) {
    // Create hierarchical grouping
    const hierarchicalGroups = createHierarchicalGroups(normalizedNodes, filteredEdges);
    
    // Add nodes grouped in subgraphs
    for (const [groupName, nodes] of hierarchicalGroups.entries()) {
      if (nodes.length <= 1) continue; // Skip single-node groups
      
      // Create subgraph for hierarchy
      diagram += `  subgraph ${groupName}\n`;
      
      // Add nodes in this group
      for (const node of nodes) {
        const nodeId = nodeIdMap.get(node.id)!;
        const progress = getCapabilityProgress(node);
        
        let label = node.name;
        if (options.showTaskCount) {
          label += ` (${node.tasks.length})`;
        }
        if (options.showProgress) {
          label += ` [${progress}%]`;
        }
        
        diagram += `    ${nodeId}["${label}"]\n`;
      }
      
      diagram += '  end\n\n';
    }
  } else {
    // Add all nodes without grouping
    for (const node of normalizedNodes) {
      const nodeId = nodeIdMap.get(node.id)!;
      const progress = getCapabilityProgress(node);
      
      let label = node.name;
      if (options.showTaskCount) {
        label += ` (${node.tasks.length})`;
      }
      if (options.showProgress) {
        label += ` [${progress}%]`;
      }
      if (options.showConfidence) {
        label += ` (${Math.round(node.confidence * 100)}%)`;
      }
      
      diagram += `  ${nodeId}["${label}"]\n`;
    }
    
    diagram += '\n';
  }
  
  // Add edges with better labeling
  for (const edge of filteredEdges) {
    const sourceId = nodeIdMap.get(edge.source);
    const targetId = nodeIdMap.get(edge.target);
    
    if (sourceId && targetId) {
      let label = '';
      
      // Add relationship type
      if (options.showRelationshipTypes) {
        label = formatRelationshipType(edge.type);
      }
      
      // Add confidence if requested
      if (options.showConfidence) {
        label += label ? ` (${Math.round(edge.confidence * 100)}%)` : 
                        `${Math.round(edge.confidence * 100)}%`;
      }
      
      const labelPart = label ? `|${label}|` : '';
      diagram += `  ${sourceId} -- ${labelPart} --> ${targetId}\n`;
    }
  }
  
  // Apply classes based on progress
  for (const node of normalizedNodes) {
    const nodeId = nodeIdMap.get(node.id)!;
    const progress = getCapabilityProgress(node);
    
    let nodeClass = 'default';
    if (progress >= 80) nodeClass = 'complete';
    else if (progress >= 50) nodeClass = 'good';
    else if (progress >= 20) nodeClass = 'started';
    else nodeClass = 'early';
    
    diagram += `  class ${nodeId} ${nodeClass}\n`;
  }
  
  return diagram;
}