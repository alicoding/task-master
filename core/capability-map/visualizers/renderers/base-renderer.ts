/**
 * Base renderer class for capability map visualizations
 */

import { CapabilityMap, CapabilityNode, CapabilityEdge } from '../../index.ts';
import { VisualizationOptions } from '../options.ts';

/**
 * Abstract base class for capability map renderers
 * Provides common functionality shared across all renderers
 */
export abstract class BaseRenderer {
  /**
   * Filter nodes based on confidence threshold from options
   * @param capabilityMap The capability map containing nodes
   * @param options Visualization options with optional confidence threshold
   * @returns Filtered nodes array
   */
  protected filterNodes(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions
  ): CapabilityNode[] {
    const minNodeConfidence = options.minNodeConfidence || 0;
    return capabilityMap.nodes.filter(
      node => node.confidence >= minNodeConfidence
    );
  }

  /**
   * Filter edges based on confidence threshold from options
   * @param capabilityMap The capability map containing edges
   * @param options Visualization options with optional confidence threshold
   * @returns Filtered edges array
   */
  protected filterEdges(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions
  ): CapabilityEdge[] {
    const minEdgeConfidence = options.minEdgeConfidence || 0;
    return capabilityMap.edges.filter(
      edge => edge.confidence >= minEdgeConfidence
    );
  }

  /**
   * Group nodes by type if requested in the options
   * @param nodes Array of nodes to group
   * @param options Visualization options
   * @returns Map of type to nodes array
   */
  protected groupNodesByType(
    nodes: CapabilityNode[], 
    options: VisualizationOptions
  ): Map<string, CapabilityNode[]> {
    if (options.groupByType) {
      const nodeGroups = new Map<string, CapabilityNode[]>();
      
      for (const node of nodes) {
        if (!nodeGroups.has(node.type)) {
          nodeGroups.set(node.type, []);
        }
        nodeGroups.get(node.type)!.push(node);
      }
      
      return nodeGroups;
    } else {
      // Single group with all nodes
      return new Map<string, CapabilityNode[]>([
        ['all', nodes]
      ]);
    }
  }

  /**
   * Get the visualization title, using a default if not provided
   * @param options Visualization options that may contain a title
   * @returns Title for the visualization
   */
  protected getTitle(options: VisualizationOptions): string {
    return options.title || 'TaskMaster Capability Map';
  }

  /**
   * Abstract render method to be implemented by each renderer
   * @param capabilityMap Map to visualize
   * @param options Visualization options
   */
  public abstract render(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions
  ): string;
}