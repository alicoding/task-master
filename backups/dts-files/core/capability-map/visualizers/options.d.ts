/**
 * Shared visualization options for capability map renderers
 *
 * This module contains the visualization options interface used across
 * all capability map visualizers and renderers.
 */
export type VisualizationFormat = 'text' | 'mermaid' | 'dot' | 'json';
export interface VisualizationOptions {
    /**
     * Output format for visualization (text, mermaid, dot, json)
     */
    format?: VisualizationFormat;
    /**
     * Whether to use color in the output (for terminal-based formats)
     */
    colorOutput?: boolean;
    /**
     * Whether to show confidence scores
     */
    showConfidence?: boolean;
    /**
     * Whether to show task count for each capability
     */
    showTaskCount?: boolean;
    /**
     * Whether to show node type labels
     */
    showNodeTypes?: boolean;
    /**
     * Minimum confidence threshold for including nodes
     */
    minNodeConfidence?: number;
    /**
     * Minimum confidence threshold for including edges
     */
    minEdgeConfidence?: number;
    /**
     * Whether to group capabilities by type
     */
    groupByType?: boolean;
    /**
     * Whether to show overall statistics
     */
    showStats?: boolean;
    /**
     * Width for text-based output
     */
    width?: number;
    /**
     * Height for graph-based output
     */
    height?: number;
    /**
     * Title for the visualization
     */
    title?: string;
}
/**
 * Enhanced visualization options with complete formatting control
 * Extends the base visualization options with additional features
 * for the enhanced visualizer
 */
export interface EnhancedVisualizationOptions extends VisualizationOptions {
    /**
     * Whether to show progress indicators
     */
    showProgress?: boolean;
    /**
     * Whether to show relationship types
     */
    showRelationshipTypes?: boolean;
    /**
     * Whether to show detailed view with more information
     */
    showDetailedView?: boolean;
    /**
     * Whether to show task names
     */
    showTasks?: boolean;
    /**
     * Whether to use compact view with less whitespace
     */
    compactView?: boolean;
    /**
     * How to sort capabilities (progress, name, tasks)
     */
    sortBy?: 'progress' | 'name' | 'tasks';
    /**
     * Name of capability to focus on (shows only this and related capabilities)
     */
    focusCapability?: string;
    /**
     * Whether to show capabilities in hierarchical view
     */
    hierarchicalView?: boolean;
}
