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
import { CapabilityMap } from '../../index';
import { EnhancedVisualizationOptions } from '../options';
/**
 * Enhanced visualizer for capability maps with improved readability and insights
 */
export declare class EnhancedCapabilityMapVisualizer {
    /**
     * Visualize a capability map with enhanced formatting
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns Formatted string representation of the map
     */
    visualize(capabilityMap: CapabilityMap, options?: EnhancedVisualizationOptions): string;
}
