/**
 * DOT (GraphViz) renderer for enhanced capability map visualization
 *
 * This module provides DOT-based rendering of capability maps
 * for use with GraphViz to create rich visual representations.
 */
import { CapabilityMap } from '../../index';
import { EnhancedVisualizationOptions } from '../options';
/**
 * Render an enhanced DOT diagram for Graphviz
 * @param capabilityMap The map to visualize
 * @param options Visualization options
 * @returns DOT diagram syntax
 */
export declare function renderEnhancedDotDiagram(capabilityMap: CapabilityMap, options: EnhancedVisualizationOptions): string;
