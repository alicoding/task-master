/**
 * DOT (GraphViz) renderer for enhanced capability map visualization
 * 
 * This module provides DOT-based rendering of capability maps
 * for use with GraphViz to create rich visual representations.
 */

import { CapabilityMap } from '../../index.ts';
import { EnhancedVisualizationOptions } from '../options.ts';
import {
  getCapabilityProgress,
  normalizeCapabilityNames,
  formatRelationshipType,
  formatGroupName,
  createHierarchicalGroups,
  getProgressColor,
  getEdgeStyle
} from '../utils/index.ts';

/**
 * Render an enhanced DOT diagram for Graphviz
 * @param capabilityMap The map to visualize 
 * @param options Visualization options
 * @returns DOT diagram syntax
 */
export function renderEnhancedDotDiagram(
  capabilityMap: CapabilityMap,
  options: EnhancedVisualizationOptions
): string {
  // Apply confidence filters
  const minNodeConfidence = options.minNodeConfidence || 0;
  const filteredNodes = capabilityMap.nodes.filter(
    node => node.confidence >= minNodeConfidence
  );
  
  const minEdgeConfidence = options.minEdgeConfidence || 0;
  const filteredEdges = capabilityMap.edges.filter(
    edge => edge.confidence >= minEdgeConfidence
  );
  
  // Normalize capability names
  const normalizedNodes = normalizeCapabilityNames(filteredNodes);
  
  // Start building diagram
  let dot = 'digraph CapabilityMap {\n';
  
  // Graph attributes
  dot += '  graph [\n';
  dot += '    label="' + (options.title || 'TaskMaster Capability Map') + '"\n';
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
  
  // Group nodes hierarchically or by type
  if (options.hierarchicalView) {
    // Create hierarchical grouping
    const hierarchicalGroups = createHierarchicalGroups(normalizedNodes, filteredEdges);
    
    // Add nodes grouped in clusters
    let clusterCount = 0;
    for (const [groupName, nodes] of hierarchicalGroups.entries()) {
      if (nodes.length <= 1) continue; // Skip single-node groups
      
      // Create cluster for hierarchy
      dot += `  subgraph "cluster_${clusterCount++}" {\n`;
      dot += `    label="${groupName}"\n`;
      dot += '    style="rounded,filled"\n';
      dot += '    color="#DDDDDD"\n';
      dot += '    fillcolor="#EEEEEE"\n\n';
      
      // Add nodes in this cluster
      for (const node of nodes) {
        const progress = getCapabilityProgress(node);
        
        const nodeAttrs = [
          `label="${node.name}${options.showProgress ? ` (${progress}%)` : ''}${options.showTaskCount ? ` [${node.tasks.length}]` : ''}"`,
          `tooltip="${node.description}"`,
          `fillcolor="${getProgressColor(progress)}"`,
          'color="#777777"',
        ];
        
        dot += `    "${node.id}" [${nodeAttrs.join(', ')}];\n`;
      }
      
      dot += '  }\n\n';
    }
  } else if (options.groupByType) {
    // Group nodes by type
    const nodeGroups = new Map<string, typeof normalizedNodes>();
    
    for (const node of normalizedNodes) {
      if (!nodeGroups.has(node.type)) {
        nodeGroups.set(node.type, []);
      }
      nodeGroups.get(node.type)!.push(node);
    }
    
    // Add nodes grouped in clusters
    let clusterCount = 0;
    for (const [type, nodes] of nodeGroups.entries()) {
      if (nodes.length === 0) continue;
      
      // Create cluster for type
      dot += `  subgraph "cluster_${clusterCount++}" {\n`;
      dot += `    label="${formatGroupName(type)}"\n`;
      dot += '    style="rounded,filled"\n';
      dot += '    color="#DDDDDD"\n';
      dot += '    fillcolor="#EEEEEE"\n\n';
      
      // Add nodes in this cluster
      for (const node of nodes) {
        const progress = getCapabilityProgress(node);
        
        const nodeAttrs = [
          `label="${node.name}${options.showProgress ? ` (${progress}%)` : ''}${options.showTaskCount ? ` [${node.tasks.length}]` : ''}"`,
          `tooltip="${node.description}"`,
          `fillcolor="${getProgressColor(progress)}"`,
          'color="#777777"',
        ];
        
        dot += `    "${node.id}" [${nodeAttrs.join(', ')}];\n`;
      }
      
      dot += '  }\n\n';
    }
  } else {
    // Add all nodes without grouping
    for (const node of normalizedNodes) {
      const progress = getCapabilityProgress(node);
      
      const nodeAttrs = [
        `label="${node.name}${options.showProgress ? ` (${progress}%)` : ''}${options.showTaskCount ? ` [${node.tasks.length}]` : ''}"`,
        `tooltip="${node.description}"`,
        `fillcolor="${getProgressColor(progress)}"`,
        'color="#777777"',
      ];
      
      dot += `  "${node.id}" [${nodeAttrs.join(', ')}];\n`;
    }
    
    dot += '\n';
  }
  
  // Add edges with better labeling
  for (const edge of filteredEdges) {
    // Only include edges between filtered nodes
    if (
      normalizedNodes.some(n => n.id === edge.source) &&
      normalizedNodes.some(n => n.id === edge.target)
    ) {
      // Get edge style based on type and confidence
      const edgeStyle = getEdgeStyle(edge.type, edge.confidence);
      
      // Create label with type and confidence
      let label = '';
      if (options.showRelationshipTypes) {
        label = formatRelationshipType(edge.type);
        if (options.showConfidence) {
          label += ` (${Math.round(edge.confidence * 100)}%)`;
        }
      } else if (options.showConfidence) {
        label = `${Math.round(edge.confidence * 100)}%`;
      }
      
      dot += `  "${edge.source}" -> "${edge.target}" [${edgeStyle}, label="${label}"];\n`;
    }
  }
  
  // Close diagram
  dot += '}\n';
  
  return dot;
}