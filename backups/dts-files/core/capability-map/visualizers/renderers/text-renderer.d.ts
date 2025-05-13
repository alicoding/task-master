/**
 * Text renderer for capability map visualizations
 */
import { CapabilityMap } from '../../index';
import { VisualizationOptions } from '../options';
import { BaseRenderer } from './base-renderer';
/**
 * Renderer for text-based visualization of capability maps
 */
export declare class TextRenderer extends BaseRenderer {
    /**
     * Render a text-based visualization of the capability map for terminal display
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns Text visualization
     */
    render(capabilityMap: CapabilityMap, options: VisualizationOptions): string;
}
