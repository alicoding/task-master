/**
 * Capability Map Visualizer
 *
 * Provides visualization formats for the capability map, including:
 * - Terminal text visualization with unicode characters
 * - Mermaid diagram syntax for rendering in markdown
 * - DOT syntax for rendering with Graphviz
 * - JSON output for use with other visualization tools
 */
import { CapabilityMap } from '../index';
import { VisualizationOptions } from './options';
export { EnhancedCapabilityMapVisualizer } from './enhanced/index';
export * from './options';
export * from './utils/index';
/**
 * Creates visualizations of capability maps in various formats
 */
export declare class CapabilityMapVisualizer {
    private textRenderer;
    private mermaidRenderer;
    private dotRenderer;
    private jsonRenderer;
    /**
     * Visualize a capability map in the specified format
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns Formatted string representation of the map
     */
    visualize(capabilityMap: CapabilityMap, options?: VisualizationOptions): string;
}
