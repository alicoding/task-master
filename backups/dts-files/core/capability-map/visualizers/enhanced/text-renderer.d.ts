/**
 * Text-based renderer for enhanced capability map visualization
 *
 * This module provides text-based rendering of capability maps
 * with detailed formatting and structure.
 */
import { CapabilityMap, CapabilityNode, CapabilityEdge } from '../../index';
import { EnhancedVisualizationOptions } from '../options';
/**
 * Render enhanced text visualization with progress indicators and better formatting
 * @param capabilityMap The map to visualize
 * @param options Visualization options
 * @returns Enhanced text visualization
 */
export declare function renderEnhancedTextVisualization(capabilityMap: CapabilityMap, options: EnhancedVisualizationOptions): string;
/**
 * Render a focused view of a single capability with all its relationships
 * @param node The capability to focus on
 * @param edges All edges in the map
 * @param nodes All nodes in the map
 * @param options Visualization options
 * @returns Focused capability visualization
 */
export declare function renderFocusedCapability(node: CapabilityNode, edges: CapabilityEdge[], nodes: CapabilityNode[], options: EnhancedVisualizationOptions): string;
/**
 * Render task details for a capability
 * @param node The capability node
 * @param useColor Whether to use color
 * @param termWidth Width of the terminal
 * @returns Formatted task details
 */
export declare function renderTaskDetails(node: CapabilityNode, useColor: boolean, termWidth: number): string;
