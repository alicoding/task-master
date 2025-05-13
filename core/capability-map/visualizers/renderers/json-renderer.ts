/**
 * JSON renderer for capability map visualizations
 */

import { CapabilityMap } from '../../index';
import { VisualizationOptions } from '../options';
import { BaseRenderer } from './base-renderer';

/**
 * Renderer for JSON output of capability maps
 */
export class JsonRenderer extends BaseRenderer {
  /**
   * Render the map as JSON for use with other visualization tools
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns JSON string representation of the map
   */
  public render(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions
  ): string {
    // Apply confidence filters
    const filteredNodes = this.filterNodes(capabilityMap, options);
    const filteredEdges = this.filterEdges(capabilityMap, options);
    
    // Create JSON representation
    const jsonOutput = {
      title: this.getTitle(options),
      generated: capabilityMap.created.toISOString(),
      stats: {
        taskCount: capabilityMap.metadata.taskCount,
        capabilityCount: filteredNodes.length,
        relationshipCount: filteredEdges.length,
        confidence: capabilityMap.metadata.confidence,
      },
      nodes: filteredNodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        description: node.description,
        confidence: node.confidence,
        taskCount: node.tasks.length,
        keywords: node.keywords,
      })),
      edges: filteredEdges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        description: edge.description,
        strength: edge.strength,
        confidence: edge.confidence,
      })),
    };
    
    return JSON.stringify(jsonOutput, null, 2);
  }
}