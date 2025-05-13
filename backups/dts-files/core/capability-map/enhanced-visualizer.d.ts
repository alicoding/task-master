/**
 * Enhanced Capability Map Visualizer
 *
 * Provides improved visualization with:
 * - Progress indicators for each capability
 * - Consistent naming patterns
 * - Hierarchical structure
 * - Visual indicators of status
 * - Enhanced relationship representation
 * - Support for detailed views
 */
import { CapabilityMap } from './index';
export interface EnhancedVisualizationOptions {
    format?: 'text' | 'mermaid' | 'dot' | 'json';
    colorOutput?: boolean;
    showConfidence?: boolean;
    showTaskCount?: boolean;
    showNodeTypes?: boolean;
    minNodeConfidence?: number;
    minEdgeConfidence?: number;
    groupByType?: boolean;
    showStats?: boolean;
    width?: number;
    height?: number;
    title?: string;
    showProgress?: boolean;
    showRelationshipTypes?: boolean;
    showDetailedView?: boolean;
    showTasks?: boolean;
    compactView?: boolean;
    sortBy?: 'progress' | 'name' | 'tasks';
    focusCapability?: string;
    hierarchicalView?: boolean;
}
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
    /**
     * Render enhanced text visualization with progress indicators and better formatting
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns Enhanced text visualization
     */
    private renderEnhancedTextVisualization;
    /**
     * Render a focused view of a single capability with all its relationships
     * @param node The capability to focus on
     * @param edges All edges in the map
     * @param nodes All nodes in the map
     * @param options Visualization options
     * @returns Focused capability visualization
     */
    private renderFocusedCapability;
    /**
     * Render task details for a capability
     * @param node The capability node
     * @param useColor Whether to use color
     * @param termWidth Width of the terminal
     * @returns Formatted task details
     */
    private renderTaskDetails;
    /**
     * Render a progress bar with color gradients
     * @param progress Progress percentage (0-100)
     * @param width Total width of the progress bar
     * @param useColor Whether to use color
     * @returns Formatted progress bar
     */
    private renderProgressBar;
    /**
     * Apply color to text based on progress percentage
     * @param progress Progress percentage (0-100)
     * @param text Text to color
     * @returns Colored text
     */
    private getProgressColoredText;
    /**
     * Get progress percentage for a capability
     * @param node Capability node
     * @returns Progress percentage (0-100)
     */
    private getCapabilityProgress;
    /**
     * Get a textual status based on progress percentage
     * @param progress Progress percentage (0-100)
     * @returns Status text
     */
    private getProgressStatus;
    /**
     * Get a colored status indicator based on progress
     * @param progress Progress percentage (0-100)
     * @returns Colored indicator character
     */
    private getColoredStatusIndicator;
    /**
     * Get a color name based on progress
     * @param progress Progress percentage (0-100)
     * @returns Chalk color name
     */
    private getColorForProgress;
    /**
     * Format a relationship type into a readable label
     * @param type Relationship type
     * @returns Formatted relationship label
     */
    private formatRelationshipType;
    /**
     * Format a group name for display
     * @param groupName Raw group name
     * @returns Formatted group name
     */
    private formatGroupName;
    /**
     * Enhance a capability description with more specifics
     * @param node Capability node
     * @returns Enhanced description
     */
    private enhanceDescription;
    /**
     * Get a human-readable label for a capability type
     * @param type The capability type
     * @returns A descriptive label
     */
    private getTypeLabel;
    /**
     * Get an icon for a capability category
     * @param type The capability type
     * @param name The capability name
     * @returns An appropriate icon
     */
    private getCategoryIcon;
    /**
     * Normalize capability names to ensure consistency
     * @param nodes List of capability nodes
     * @returns Nodes with normalized names
     */
    private normalizeCapabilityNames;
    /**
     * Create hierarchical groups of capabilities based on relationships and types
     * @param nodes List of capabilities
     * @param edges List of relationships
     * @returns Map of hierarchical groups
     */
    private createHierarchicalGroups;
    /**
     * Create groups based on explicit relationships between capabilities
     */
    private createRelationshipBasedGroups;
    /**
     * Create groups based on capability domain and type
     */
    private createDomainBasedGroups;
    /**
     * Calculate overall progress across all capabilities
     * @param nodes List of capability nodes
     * @returns Overall progress percentage
     */
    private calculateOverallProgress;
    /**
     * Render an enhanced Mermaid diagram with progress indicators
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns Mermaid diagram syntax
     */
    private renderEnhancedMermaidDiagram;
    /**
     * Render standard Mermaid diagram (fallback)
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns Mermaid diagram syntax
     */
    private renderMermaidDiagram;
    /**
     * Render an enhanced DOT diagram for Graphviz
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns DOT diagram syntax
     */
    private renderEnhancedDotDiagram;
    /**
     * Render standard DOT diagram (fallback)
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns DOT diagram syntax
     */
    private renderDotDiagram;
    /**
     * Get color for progress visualization in DOT format
     * @param progress Progress percentage
     * @returns Hex color code
     */
    private getProgressColor;
    /**
     * Get DOT edge style based on relationship type
     * @param type Relationship type
     * @param confidence Confidence score
     * @returns DOT edge style
     */
    private getEdgeStyle;
    /**
     * Render enhanced JSON output with additional metadata
     * @param capabilityMap The map to visualize
     * @param options Visualization options
     * @returns JSON string representation
     */
    private renderEnhancedJsonOutput;
    /**
     * Utility to wrap text to a specified width
     * @param text Text to wrap
     * @param width Maximum width in characters
     * @param indent Indentation to apply to each line
     * @returns Wrapped text
     */
    private wrapText;
}
