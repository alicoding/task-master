/**
 * JSON renderer for capability map visualizations
 */
import { CapabilityMap } from '../../index';
import { VisualizationOptions } from '../options';
import { BaseRenderer } from './base-renderer';
/**
 * Renderer for JSON output of capability maps
 */
export declare class JsonRenderer extends BaseRenderer {
    /**
     * Render the map as JSON for use with other visualization tools
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns JSON string representation of the map
     */
    render(capabilityMap: CapabilityMap, options: VisualizationOptions): string;
}
