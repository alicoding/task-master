/**
 * Mermaid diagram renderer for enhanced capability map visualization
 *
 * This module provides Mermaid-based rendering of capability maps
 * for compatibility with Markdown documents and web-based visualization.
 */
import { CapabilityMap } from '../../index';
import { EnhancedVisualizationOptions } from '../options';
/**
 * Render enhanced Mermaid diagram with progress indicators
 * @param capabilityMap The map to visualize
 * @param options Visualization options
 * @returns Mermaid diagram syntax
 */
export declare function renderEnhancedMermaidDiagram(capabilityMap: CapabilityMap, options: EnhancedVisualizationOptions): string;
