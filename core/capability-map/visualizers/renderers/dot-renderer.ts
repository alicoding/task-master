/**
 * DOT/Graphviz renderer for capability map visualizations
 */

import { CapabilityMap } from '../../index';
import { VisualizationOptions } from '../options';
import { BaseRenderer } from './base-renderer';
import { getDotEdgeStyle } from '../utils/formatting';
import { getNodeColorByTypeAndConfidence } from '../utils/colors';

/**
 * Renderer for DOT/Graphviz diagrams of capability maps
 */
export class DotRenderer extends BaseRenderer {
  /**
   * Render a DOT diagram for Graphviz
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns DOT diagram syntax
   */
  public render(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions
  ): string {
    // Apply confidence filters
    const filteredNodes = this.filterNodes(capabilityMap, options);
    const filteredEdges = this.filterEdges(capabilityMap, options);
    
    // Start building diagram
    let dot = 'digraph CapabilityMap {\n';
    
    // Graph attributes
    dot += '  graph [\n';
    dot += '    label="' + this.getTitle(options) + '"\n';
    dot += '    labelloc="t"\n';
    dot += '    fontname="Arial"\n';
    dot += '    fontsize=16\n';
    dot += '    rankdir="LR"\n';
    dot += '    concentrate=true\n';
    dot += '    splines="true"\n';
    dot += '    overlap="false"\n';
    dot += '  ];\n\n';
    
    // Default node attributes
    dot += '  node [\n';
    dot += '    shape="box"\n';
    dot += '    style="rounded,filled"\n';
    dot += '    fontname="Arial"\n';
    dot += '    fontsize=10\n';
    dot += '    margin=0.2\n';
    dot += '  ];\n\n';
    
    // Default edge attributes
    dot += '  edge [\n';
    dot += '    fontname="Arial"\n';
    dot += '    fontsize=8\n';
    dot += '    len=2\n';
    dot += '  ];\n\n';
    
    // Group nodes by type if requested
    if (options.groupByType) {
      // Group nodes by type
      const nodeGroups = this.groupNodesByType(filteredNodes, options);
      
      // Add nodes grouped in clusters
      for (const [type, nodes] of nodeGroups.entries()) {
        if (nodes.length === 0) continue;
        
        // Skip 'all' group that's used when groupByType is false
        if (type === 'all' && !options.groupByType) continue;
        
        // Create cluster for type
        dot += `  subgraph "cluster_${type}" {\n`;
        dot += `    label="${type}"\n`;
        dot += '    style="rounded,filled"\n';
        dot += '    color="#DDDDDD"\n';
        dot += '    fillcolor="#EEEEEE"\n\n';
        
        // Add nodes in this cluster
        for (const node of nodes) {
          const nodeAttrs = [
            `label="${node.name}${options.showConfidence ? ` (${Math.round(node.confidence * 100)}%)` : ''}"`,
            `tooltip="${node.description}"`,
            `fillcolor="${getNodeColorByTypeAndConfidence(node.type, node.confidence)}"`,
            'color="#777777"',
          ];
          
          dot += `    "${node.id}" [${nodeAttrs.join(', ')}];\n`;
        }
        
        dot += '  }\n\n';
      }
    } else {
      // Add all nodes without grouping
      for (const node of filteredNodes) {
        const nodeAttrs = [
          `label="${node.name}${options.showConfidence ? ` (${Math.round(node.confidence * 100)}%)` : ''}"`,
          `tooltip="${node.description}"`,
          `fillcolor="${getNodeColorByTypeAndConfidence(node.type, node.confidence)}"`,
          'color="#777777"',
        ];
        
        dot += `  "${node.id}" [${nodeAttrs.join(', ')}];\n`;
      }
      
      dot += '\n';
    }
    
    // Add edges
    for (const edge of filteredEdges) {
      // Only include edges between filtered nodes
      if (
        filteredNodes.some(n => n.id === edge.source) &&
        filteredNodes.some(n => n.id === edge.target)
      ) {
        const edgeStyle = getDotEdgeStyle(edge.type, edge.confidence);
        const label = options.showConfidence ? `${Math.round(edge.confidence * 100)}%` : '';
        
        dot += `  "${edge.source}" -> "${edge.target}" [${edgeStyle}, label="${label}"];\n`;
      }
    }
    
    // Close diagram
    dot += '}\n';
    
    return dot;
  }
}