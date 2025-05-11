/**
 * Mermaid.js renderer for capability map visualizations
 */

import { CapabilityMap } from '../../index.ts';
import { VisualizationOptions } from '../options.ts';
import { BaseRenderer } from './base-renderer.ts';

/**
 * Renderer for Mermaid.js diagrams of capability maps
 */
export class MermaidRenderer extends BaseRenderer {
  /**
   * Render a Mermaid.js flowchart diagram
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns Mermaid diagram syntax
   */
  public render(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions
  ): string {
    // Apply confidence filters
    const filteredNodes = this.filterNodes(capabilityMap, options);
    const filteredEdges = this.filterEdges(capabilityMap, options);
    
    // Build node ID map
    const nodeIdMap = new Map<string, string>();
    
    for (let i = 0; i < filteredNodes.length; i++) {
      nodeIdMap.set(filteredNodes[i].id, `node${i}`);
    }
    
    // Build diagram
    let diagram = 'flowchart TD\n';
    
    // Add title as comment
    const title = this.getTitle(options);
    diagram += `%% ${title}\n`;
    
    // Add class definitions
    diagram += '  classDef core fill:#f9f,stroke:#333,stroke-width:2px\n';
    diagram += '  classDef technical fill:#bbf,stroke:#333,stroke-width:1px\n';
    diagram += '  classDef crosscutting fill:#ff9,stroke:#333,stroke-width:1px\n';
    diagram += '  classDef default fill:#f9f9f9,stroke:#aaa,stroke-width:1px\n\n';
    
    // Add nodes, grouped by type if requested
    if (options.groupByType) {
      // Group nodes by type
      const nodeGroups = this.groupNodesByType(filteredNodes, options);
      
      // Add nodes grouped in subgraphs
      for (const [type, nodes] of nodeGroups.entries()) {
        if (nodes.length === 0) continue;
        
        // Skip 'all' group that's used when groupByType is false
        if (type === 'all' && !options.groupByType) continue;
        
        // Create subgraph for type
        diagram += `  subgraph ${type}\n`;
        
        // Add nodes in this group
        for (const node of nodes) {
          const nodeId = nodeIdMap.get(node.id)!;
          const label = options.showConfidence 
            ? `${node.name} (${Math.round(node.confidence * 100)}%)`
            : node.name;
          
          diagram += `    ${nodeId}["${label}"]\n`;
        }
        
        diagram += '  end\n\n';
      }
    } else {
      // Add all nodes without grouping
      for (const node of filteredNodes) {
        const nodeId = nodeIdMap.get(node.id)!;
        const label = options.showConfidence 
          ? `${node.name} (${Math.round(node.confidence * 100)}%)`
          : node.name;
        
        diagram += `  ${nodeId}["${label}"]\n`;
      }
      
      diagram += '\n';
    }
    
    // Add edges
    for (const edge of filteredEdges) {
      const sourceId = nodeIdMap.get(edge.source);
      const targetId = nodeIdMap.get(edge.target);
      
      if (sourceId && targetId) {
        const label = options.showConfidence
          ? `|${Math.round(edge.confidence * 100)}%|`
          : '';
        
        diagram += `  ${sourceId} -- ${label} --> ${targetId}\n`;
      }
    }
    
    // Apply classes based on node type
    for (const node of filteredNodes) {
      const nodeId = nodeIdMap.get(node.id)!;
      let nodeClass = 'default';
      
      // Map node type to class
      if (node.type.includes('core') || node.type.includes('feature')) {
        nodeClass = 'core';
      } else if (node.type.includes('technical') || node.type.includes('domain')) {
        nodeClass = 'technical';
      } else if (node.type.includes('cross')) {
        nodeClass = 'crosscutting';
      }
      
      diagram += `  class ${nodeId} ${nodeClass}\n`;
    }
    
    return diagram;
  }
}