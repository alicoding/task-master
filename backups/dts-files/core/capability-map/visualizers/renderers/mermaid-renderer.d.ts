/**
 * Mermaid.js renderer for capability map visualizations
 */
import { CapabilityMap } from '../../index';
import { VisualizationOptions } from '../options';
import { BaseRenderer } from './base-renderer';
/**
 * Renderer for Mermaid.js diagrams of capability maps
 */
export declare class MermaidRenderer extends BaseRenderer {
    /**
     * Render a Mermaid.js flowchart diagram
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns Mermaid diagram syntax
     */
    render(capabilityMap: CapabilityMap, options: VisualizationOptions): string;
}
