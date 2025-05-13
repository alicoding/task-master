/**
 * Base renderer class for capability map visualizations
 */
import { CapabilityMap, CapabilityNode, CapabilityEdge } from '../../index';
import { VisualizationOptions } from '../options';
/**
 * Abstract base class for capability map renderers
 * Provides common functionality shared across all renderers
 */
export declare abstract class BaseRenderer {
    /**
     * Filter nodes based on confidence threshold from options
     * @param capabilityMap The capability map containing nodes
     * @param options Visualization options with optional confidence threshold
     * @returns Filtered nodes array
     */
    protected filterNodes(capabilityMap: CapabilityMap, options: VisualizationOptions): CapabilityNode[];
    /**
     * Filter edges based on confidence threshold from options
     * @param capabilityMap The capability map containing edges
     * @param options Visualization options with optional confidence threshold
     * @returns Filtered edges array
     */
    protected filterEdges(capabilityMap: CapabilityMap, options: VisualizationOptions): CapabilityEdge[];
    /**
     * Group nodes by type if requested in the options
     * @param nodes Array of nodes to group
     * @param options Visualization options
     * @returns Map of type to nodes array
     */
    protected groupNodesByType(nodes: CapabilityNode[], options: VisualizationOptions): Map<string, CapabilityNode[]>;
    /**
     * Get the visualization title, using a default if not provided
     * @param options Visualization options that may contain a title
     * @returns Title for the visualization
     */
    protected getTitle(options: VisualizationOptions): string;
    /**
     * Abstract render method to be implemented by each renderer
     * @param capabilityMap Map to visualize
     * @param options Visualization options
     */
    abstract render(capabilityMap: CapabilityMap, options: VisualizationOptions): string;
}
