/**
 * Capability Map Visualizer
 *
 * Provides visualization formats for the capability map, including:
 * - Terminal text visualization with unicode characters
 * - Mermaid diagram syntax for rendering in markdown
 * - DOT syntax for rendering with Graphviz
 * - JSON output for use with other visualization tools
 */

import { CapabilityMap } from '../index.ts';
import { VisualizationFormat, VisualizationOptions, EnhancedVisualizationOptions } from './options.ts';
import {
  TextRenderer,
  MermaidRenderer,
  DotRenderer,
  JsonRenderer
} from './renderers/index.ts';

// Export enhanced visualizer components
export { EnhancedCapabilityMapVisualizer } from './enhanced/index.ts';

// Re-export types
export * from './options.ts';

// Export utility functions for external use
export * from './utils/index.ts';

/**
 * Creates visualizations of capability maps in various formats
 */
export class CapabilityMapVisualizer {
  // Renderers for different formats
  private textRenderer = new TextRenderer();
  private mermaidRenderer = new MermaidRenderer();
  private dotRenderer = new DotRenderer();
  private jsonRenderer = new JsonRenderer();

  /**
   * Visualize a capability map in the specified format
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns Formatted string representation of the map
   */
  public visualize(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions = {}
  ): string {
    // Select the appropriate format
    const format = options.format || 'text';

    switch (format) {
      case 'mermaid':
        return this.mermaidRenderer.render(capabilityMap, options);
      case 'dot':
        return this.dotRenderer.render(capabilityMap, options);
      case 'json':
        return this.jsonRenderer.render(capabilityMap, options);
      case 'text':
      default:
        return this.textRenderer.render(capabilityMap, options);
    }
  }
}