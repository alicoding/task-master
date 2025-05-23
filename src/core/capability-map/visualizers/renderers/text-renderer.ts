/**
 * Text renderer for capability map visualizations
 */

import chalk from 'chalk';
import { CapabilityMap, CapabilityNode } from '@/core/capability-map/index';
import { VisualizationOptions } from '@/core/capability-map/visualizers/options';
import { BaseRenderer } from '@/core/capability-map/visualizers/renderers/base-renderer';
import { getColorForConfidence } from '@/core/capability-map/visualizers/utils/colors';
import { wrapText } from '@/core/capability-map/visualizers/utils/wrapping';

/**
 * Renderer for text-based visualization of capability maps
 */
export class TextRenderer extends BaseRenderer {
  /**
   * Render a text-based visualization of the capability map for terminal display
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns Text visualization
   */
  public render(
    capabilityMap: CapabilityMap,
    options: VisualizationOptions
  ): string {
    const useColor = options.colorOutput !== false;
    const showConfidence = options.showConfidence !== false;
    const showNodeTypes = options.showNodeTypes !== false;
    const showTaskCount = options.showTaskCount !== false;
    const showStats = options.showStats !== false;
    const termWidth = options.width || 80;
    
    // Apply confidence filters
    const filteredNodes = this.filterNodes(capabilityMap, options);
    const filteredEdges = this.filterEdges(capabilityMap, options);
    
    // Start building output
    let output = '';
    
    // Create title
    const title = this.getTitle(options);
    const titlePadding = Math.max(0, Math.floor((termWidth - title.length - 4) / 2));
    const titleLine = 'P'.repeat(titlePadding) + '$ ' + title + ' ' + 'P'.repeat(titlePadding);
    
    if (useColor) {
      output += chalk.cyan.bold(titleLine) + '\n\n';
    } else {
      output += titleLine + '\n\n';
    }
    
    // Display stats if requested
    if (showStats) {
      const statsBlock = [
        `Generated: ${capabilityMap.created.toLocaleString()}`,
        `Task Count: ${capabilityMap.metadata.taskCount}`,
        `Capabilities: ${filteredNodes.length}`,
        `Relationships: ${filteredEdges.length}`,
        `Confidence: ${Math.round(capabilityMap.metadata.confidence * 100)}%`,
      ];
      
      if (useColor) {
        output += statsBlock.map(line => chalk.gray(line)).join('\n') + '\n\n';
      } else {
        output += statsBlock.join('\n') + '\n\n';
      }
    }
    
    // Group nodes by type if requested
    const nodeGroups = this.groupNodesByType(filteredNodes, options);
    
    // Build node map for quick lookup
    const nodeMap = new Map<string, CapabilityNode>();
    for (const node of filteredNodes) {
      nodeMap.set(node.id, node);
    }
    
    // Display each group of nodes
    for (const [type, nodes] of nodeGroups.entries()) {
      // Skip if no nodes
      if (nodes.length === 0) continue;
      
      // Group header (if grouping by type)
      if (options.groupByType) {
        const groupHeader = `   ${type.toUpperCase()}  ${' '.repeat(Math.max(0, termWidth - type.length - 10))}`;
        
        if (useColor) {
          output += chalk.yellow.bold(groupHeader) + '\n\n';
        } else {
          output += groupHeader + '\n\n';
        }
      }
      
      // Sort nodes by confidence
      const sortedNodes = [...nodes].sort((a, b) => b.confidence - a.confidence);
      
      // Display each node
      for (const node of sortedNodes) {
        let nodeText = '';
        
        // Node header
        if (useColor) {
          const color = getColorForConfidence(node.confidence);
          // Use type assertion to handle dynamic access to chalk
          nodeText += (chalk as any)[color].bold(`● ${node.name}`);
          
          if (showConfidence) {
            nodeText += chalk.gray(` (${Math.round(node.confidence * 100)}% confidence)`);
          }
          
          if (showNodeTypes) {
            nodeText += chalk.blue(` [${node.type}]`);
          }
          
          if (showTaskCount) {
            nodeText += chalk.gray(` - ${node.tasks.length} tasks`);
          }
        } else {
          nodeText += `● ${node.name}`;
          
          if (showConfidence) {
            nodeText += ` (${Math.round(node.confidence * 100)}% confidence)`;
          }
          
          if (showNodeTypes) {
            nodeText += ` [${node.type}]`;
          }
          
          if (showTaskCount) {
            nodeText += ` - ${node.tasks.length} tasks`;
          }
        }
        
        output += nodeText + '\n';
        
        // Node description
        if (node.description) {
          const wrappedDescription = wrapText(node.description, termWidth - 4, '  ');
          
          if (useColor) {
            output += chalk.gray(wrappedDescription) + '\n';
          } else {
            output += wrappedDescription + '\n';
          }
        }
        
        // Show related nodes
        const relatedNodeIds = filteredEdges
          .filter(edge => edge.source === node.id || edge.target === node.id)
          .map(edge => edge.source === node.id ? edge.target : edge.source);
        
        if (relatedNodeIds.length > 0) {
          const relatedNodes = relatedNodeIds
            .map(id => nodeMap.get(id))
            .filter(n => n !== undefined)
            .map(n => n!.name);
          
          if (relatedNodes.length > 0) {
            const relatedText = `  ↔ Related: ${relatedNodes.join(', ')}`;
            
            if (useColor) {
              output += chalk.cyan(relatedText) + '\n';
            } else {
              output += relatedText + '\n';
            }
          }
        }
        
        output += '\n';
      }
    }
    
    // Add legend
    const legend = 'Generated automatically by TaskMaster capability analysis';
    
    if (useColor) {
      output += chalk.gray(' '.repeat(termWidth) + '\n');
      output += chalk.gray(legend) + '\n';
    } else {
      output += ' '.repeat(termWidth) + '\n';
      output += legend + '\n';
    }
    
    return output;
  }
}