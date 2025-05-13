/**
 * DOT/Graphviz renderer for capability map visualizations
 */
import { CapabilityMap } from '../../index';
import { VisualizationOptions } from '../options';
import { BaseRenderer } from './base-renderer';
/**
 * Renderer for DOT/Graphviz diagrams of capability maps
 */
export declare class DotRenderer extends BaseRenderer {
    /**
     * Render a DOT diagram for Graphviz
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns DOT diagram syntax
     */
    render(capabilityMap: CapabilityMap, options: VisualizationOptions): string;
}
