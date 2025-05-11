/**
 * Enhanced Capability Map Visualizer
 * 
 * This module provides improved visualization for capability maps with:
 * - Progress indicators for each capability
 * - Consistent naming patterns
 * - Hierarchical structure
 * - Visual indicators of status
 * - Enhanced relationship representation
 * - Support for detailed views
 */

import { CapabilityMap } from '../../index.ts';
import { EnhancedVisualizationOptions } from '../options.ts';
import { renderEnhancedTextVisualization } from './text-renderer.ts';
import { renderEnhancedMermaidDiagram } from './mermaid-renderer.ts';
import { renderEnhancedDotDiagram } from './dot-renderer.ts';
import { renderEnhancedJsonOutput } from './json-renderer.ts';

/**
 * Enhanced visualizer for capability maps with improved readability and insights
 */
export class EnhancedCapabilityMapVisualizer {
  /**
   * Visualize a capability map with enhanced formatting
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns Formatted string representation of the map
   */
  public visualize(
    capabilityMap: CapabilityMap,
    options: EnhancedVisualizationOptions = {}
  ): string {
    // Select the appropriate format
    const format = options.format || 'text';
    
    switch (format) {
      case 'mermaid':
        return renderEnhancedMermaidDiagram(capabilityMap, options);
      case 'dot':
        return renderEnhancedDotDiagram(capabilityMap, options);
      case 'json':
        return renderEnhancedJsonOutput(capabilityMap, options);
      case 'text':
      default:
        return renderEnhancedTextVisualization(capabilityMap, options);
    }
  }
}