/**
 * JSON renderer for enhanced capability map visualization
 *
 * This module provides JSON rendering of capability maps
 * for machine processing and data interchange.
 */
import { CapabilityMap } from '../../index';
import { EnhancedVisualizationOptions } from '../options';
/**
 * Render enhanced JSON output with additional metadata
 * @param capabilityMap The map to visualize
 * @param options Visualization options
 * @returns JSON string representation
 */
export declare function renderEnhancedJsonOutput(capabilityMap: CapabilityMap, options: EnhancedVisualizationOptions): string;
