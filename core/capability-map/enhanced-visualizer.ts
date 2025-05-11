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

import chalk from 'chalk';
import { CapabilityMap, CapabilityNode, CapabilityEdge } from './index.ts';

// Extend visualization options with new features
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
export class EnhancedCapabilityMapVisualizer {
  /**
   * Visualize a capability map with enhanced formatting
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns Formatted string representation of the map
   */
  public visualize(
    capabilityMap: CapabilityMap,
    options: EnhancedVisualizationOptions = {}
  ): string {
    // Select the appropriate format
    const format = options.format || 'text';
    
    switch (format) {
      case 'mermaid':
        return this.renderEnhancedMermaidDiagram(capabilityMap, options);
      case 'dot':
        return this.renderEnhancedDotDiagram(capabilityMap, options);
      case 'json':
        return this.renderEnhancedJsonOutput(capabilityMap, options);
      case 'text':
      default:
        return this.renderEnhancedTextVisualization(capabilityMap, options);
    }
  }

  /**
   * Render enhanced text visualization with progress indicators and better formatting
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns Enhanced text visualization
   */
  private renderEnhancedTextVisualization(
    capabilityMap: CapabilityMap,
    options: EnhancedVisualizationOptions
  ): string {
    const useColor = options.colorOutput !== false;
    const showConfidence = options.showConfidence === true;
    const showNodeTypes = options.showNodeTypes === true;
    const showTaskCount = options.showTaskCount !== false; // Default to true
    const showStats = options.showStats !== false; // Default to true
    const showProgress = options.showProgress !== false; // Default to true
    const showRelationshipTypes = options.showRelationshipTypes === true;
    const showDetailedView = options.showDetailedView === true;
    const termWidth = options.width || 80;
    
    // Apply confidence filters
    const minNodeConfidence = options.minNodeConfidence || 0;
    const filteredNodes = capabilityMap.nodes.filter(
      node => node.confidence >= minNodeConfidence
    );
    
    const minEdgeConfidence = options.minEdgeConfidence || 0;
    const filteredEdges = capabilityMap.edges.filter(
      edge => edge.confidence >= minEdgeConfidence
    );
    
    // Normalize capability names to ensure consistency
    const normalizedNodes = this.normalizeCapabilityNames(filteredNodes);
    
    // Start building output
    let output = '';
    
    // Create title
    const title = options.title || 'TaskMaster Capability Map';
    const titlePadding = Math.max(0, Math.floor((termWidth - title.length - 4) / 2));
    const titleLine = '═'.repeat(titlePadding) + '┤ ' + title + ' ├' + '═'.repeat(titlePadding);
    
    if (useColor) {
      output += chalk.cyan.bold(titleLine) + '\n\n';
    } else {
      output += titleLine + '\n\n';
    }
    
    // Display stats if requested
    if (showStats) {
      // Calculate overall progress
      const totalTasks = capabilityMap.metadata.taskCount || 0;
      const overallProgress = this.calculateOverallProgress(normalizedNodes);

      const statsBlock = [
        `Generated: ${capabilityMap.created.toLocaleString()}`,
        `Task Count: ${totalTasks}`,
        `Capabilities: ${normalizedNodes.length}`,
        `Relationships: ${filteredEdges.length}`,
        `Overall Progress: ${overallProgress}%`,
        `Confidence: ${Math.round(capabilityMap.metadata.confidence * 100)}%`,
      ];
      
      if (useColor) {
        output += statsBlock.map(line => chalk.gray(line)).join('\n') + '\n\n';
        
        // Add a progress bar for overall progress
        if (showProgress) {
          output += this.renderProgressBar(overallProgress, termWidth, useColor) + '\n\n';
        }
      } else {
        output += statsBlock.join('\n') + '\n\n';
        
        // Add a progress bar for overall progress
        if (showProgress) {
          output += this.renderProgressBar(overallProgress, termWidth, false) + '\n\n';
        }
      }
    }
    
    // Focus on a specific capability if requested
    if (options.focusCapability) {
      const focusedNode = normalizedNodes.find(n => 
        n.name.toLowerCase() === options.focusCapability?.toLowerCase()
      );
      
      if (focusedNode) {
        output += this.renderFocusedCapability(
          focusedNode, 
          filteredEdges, 
          normalizedNodes, 
          options
        );
        return output;
      }
    }
    
    // Group nodes by type if requested
    let nodeGroups: Map<string, CapabilityNode[]>;
    
    if (options.groupByType) {
      nodeGroups = new Map<string, CapabilityNode[]>();
      
      for (const node of normalizedNodes) {
        if (!nodeGroups.has(node.type)) {
          nodeGroups.set(node.type, []);
        }
        nodeGroups.get(node.type)!.push(node);
      }
      
      // Sort groups by name
      nodeGroups = new Map(
        [...nodeGroups.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
      );
    } else if (options.hierarchicalView) {
      // Create hierarchical grouping
      nodeGroups = this.createHierarchicalGroups(normalizedNodes, filteredEdges);
    } else {
      // Single group with all nodes
      nodeGroups = new Map<string, CapabilityNode[]>([
        ['all', normalizedNodes]
      ]);
    }
    
    // Build node map for quick lookup
    const nodeMap = new Map<string, CapabilityNode>();
    for (const node of normalizedNodes) {
      nodeMap.set(node.id, node);
    }
    
    // Build edge map for quick relationship lookup
    const edgeMap = new Map<string, CapabilityEdge[]>();
    for (const edge of filteredEdges) {
      // Add to source node's outgoing edges
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge);
      
      // Add to target node's incoming edges
      if (!edgeMap.has(edge.target)) {
        edgeMap.set(edge.target, []);
      }
      edgeMap.get(edge.target)!.push(edge);
    }
    
    // Display each group of nodes
    for (const [type, nodes] of nodeGroups.entries()) {
      // Skip if no nodes
      if (nodes.length === 0) continue;
      
      // Group header (if grouping)
      if (type !== 'all') {
        const groupHeader = `── ${this.formatGroupName(type)} ─${'─'.repeat(Math.max(0, termWidth - type.length - 10))}`;
        
        if (useColor) {
          output += chalk.yellow.bold(groupHeader) + '\n\n';
        } else {
          output += groupHeader + '\n\n';
        }
      }
      
      // Sort nodes by confidence and progress
      const sortedNodes = [...nodes].sort((a, b) => {
        // First by confidence
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
        
        // Then by progress
        const progressA = this.getCapabilityProgress(a);
        const progressB = this.getCapabilityProgress(b);
        return progressB - progressA;
      });
      
      // Display each node
      for (const node of sortedNodes) {
        let nodeText = '';
        const progress = this.getCapabilityProgress(node);
        const progressStatus = this.getProgressStatus(progress);
        
        // Get status indicator
        const statusIndicator = useColor 
          ? this.getColoredStatusIndicator(progress) 
          : '●';
        
        // Get category icon
      const icon = this.getCategoryIcon(node.type, node.name);

      // Node header
      if (useColor) {
        const color = this.getColorForProgress(progress);
        nodeText += chalk[color].bold(`${icon} ${statusIndicator} ${node.name}`);

        if (showConfidence) {
          nodeText += chalk.gray(` (${Math.round(node.confidence * 100)}%)`);
        }

        if (showNodeTypes) {
          nodeText += chalk.blue(` [${this.getTypeLabel(node.type)}]`);
        }

        if (showTaskCount) {
          nodeText += chalk.gray(` · ${node.tasks.length} task${node.tasks.length !== 1 ? 's' : ''}`);
        }

        if (showProgress) {
          nodeText += chalk.gray(` · ${progressStatus}`);
        }
      } else {
        nodeText += `${icon} ${statusIndicator} ${node.name}`;

        if (showConfidence) {
          nodeText += ` (${Math.round(node.confidence * 100)}% confidence)`;
        }

        if (showNodeTypes) {
          nodeText += ` [${this.getTypeLabel(node.type)}]`;
        }

        if (showTaskCount) {
          nodeText += ` · ${node.tasks.length} task${node.tasks.length !== 1 ? 's' : ''}`;
        }

        if (showProgress) {
          nodeText += ` · ${progressStatus}`;
        }
      }
        
        output += nodeText + '\n';
        
        // Show progress bar
        if (showProgress) {
          output += '  ' + this.renderProgressBar(progress, termWidth - 4, useColor) + '\n';
        }
        
        // Node description - more specific than before
        if (node.description) {
          const enhancedDescription = this.enhanceDescription(node);
          const wrappedDescription = this.wrapText(enhancedDescription, termWidth - 4, '  ');
          
          if (useColor) {
            output += chalk.gray(wrappedDescription) + '\n';
          } else {
            output += wrappedDescription + '\n';
          }
        }
        
        // Show related nodes with relationship types
        const nodeEdges = edgeMap.get(node.id) || [];
        
        if (nodeEdges.length > 0) {
          // Group relationships by type
          const relationshipsByType = new Map<string, {node: CapabilityNode, edge: CapabilityEdge}[]>();
          
          for (const edge of nodeEdges) {
            const relatedNodeId = edge.source === node.id ? edge.target : edge.source;
            const relatedNode = nodeMap.get(relatedNodeId);
            
            if (relatedNode) {
              if (!relationshipsByType.has(edge.type)) {
                relationshipsByType.set(edge.type, []);
              }
              relationshipsByType.get(edge.type)!.push({node: relatedNode, edge});
            }
          }
          
          // Display relationships by type
          if (showRelationshipTypes) {
            for (const [type, relationships] of relationshipsByType.entries()) {
              const formattedType = this.formatRelationshipType(type);
              const relatedNames = relationships.map(r => r.node.name);
              
              if (useColor) {
                output += chalk.cyan(`  ${formattedType}: ${relatedNames.join(', ')}`) + '\n';
              } else {
                output += `  ${formattedType}: ${relatedNames.join(', ')}` + '\n';
              }
            }
          } else {
            // Simple "Related" listing
            const allRelatedNodes = [...new Set(nodeEdges.map(edge => {
              const relatedNodeId = edge.source === node.id ? edge.target : edge.source;
              return nodeMap.get(relatedNodeId)?.name;
            }))].filter(Boolean);
            
            if (allRelatedNodes.length > 0) {
              if (useColor) {
                output += chalk.cyan(`  Related: ${allRelatedNodes.join(', ')}`) + '\n';
              } else {
                output += `  Related: ${allRelatedNodes.join(', ')}` + '\n';
              }
            }
          }
        }
        
        // Display task details in detailed view
        if (showDetailedView) {
          output += this.renderTaskDetails(node, useColor, termWidth);
        }
        
        output += '\n';
      }
    }
    
    // Add legend
    if (useColor) {
      output += chalk.gray('─'.repeat(termWidth) + '\n');

      // Legend header
      output += chalk.cyan.bold('LEGEND:') + '\n';

      // Progress indicators
      output += chalk.bold('Progress:  ');
      output += chalk.green('●') + chalk.gray(' Complete (>80%)   ');
      output += chalk.cyan('●') + chalk.gray(' Good progress (50-80%)   ');
      output += chalk.yellow('●') + chalk.gray(' Started (20-50%)   ');
      output += chalk.red('●') + chalk.gray(' Early stages (<20%)') + '\n';

      // Common capability types
      output += chalk.bold('Types:     ');
      output += '💻 ' + chalk.gray('CLI   ');
      output += '🧠 ' + chalk.gray('AI/ML   ');
      output += '🧪 ' + chalk.gray('Testing   ');
      output += '✨ ' + chalk.gray('Feature   ');
      output += '🔧 ' + chalk.gray('Enhancement   ');
      output += '📦 ' + chalk.gray('Other') + '\n';

      // Relationship types if used
      if (options.showRelationshipTypes) {
        output += chalk.bold('Relations: ');
        output += chalk.gray('part-of: hierarchy   ');
        output += chalk.gray('depends-on: dependency   ');
        output += chalk.gray('related-to: association   ');
        output += chalk.gray('similar-to: similarity') + '\n';
      }

      output += chalk.gray('Generated automatically by TaskMaster capability analysis') + '\n';
    } else {
      output += '─'.repeat(termWidth) + '\n';

      // Legend header
      output += 'LEGEND:\n';

      // Progress indicators
      output += 'Progress:  ';
      output += '● Complete (>80%)   ';
      output += '● Good progress (50-80%)   ';
      output += '● Started (20-50%)   ';
      output += '● Early stages (<20%)\n';

      // Common capability types
      output += 'Types:     ';
      output += '💻 CLI   ';
      output += '🧠 AI/ML   ';
      output += '🧪 Testing   ';
      output += '✨ Feature   ';
      output += '🔧 Enhancement   ';
      output += '📦 Other\n';

      // Relationship types if used
      if (options.showRelationshipTypes) {
        output += 'Relations: ';
        output += 'part-of: hierarchy   ';
        output += 'depends-on: dependency   ';
        output += 'related-to: association   ';
        output += 'similar-to: similarity\n';
      }

      output += 'Generated automatically by TaskMaster capability analysis\n';
    }
    
    return output;
  }

  /**
   * Render a focused view of a single capability with all its relationships
   * @param node The capability to focus on
   * @param edges All edges in the map
   * @param nodes All nodes in the map
   * @param options Visualization options
   * @returns Focused capability visualization
   */
  private renderFocusedCapability(
    node: CapabilityNode,
    edges: CapabilityEdge[],
    nodes: CapabilityNode[],
    options: EnhancedVisualizationOptions
  ): string {
    const useColor = options.colorOutput !== false;
    const termWidth = options.width || 80;
    
    // Build node map for quick lookup
    const nodeMap = new Map<string, CapabilityNode>();
    for (const n of nodes) {
      nodeMap.set(n.id, n);
    }
    
    let output = '';
    
    // Title for focused capability
    const focusTitle = `Capability Detail: ${node.name}`;
    if (useColor) {
      output += chalk.green.bold(focusTitle) + '\n';
      output += chalk.green.bold('═'.repeat(focusTitle.length)) + '\n\n';
    } else {
      output += focusTitle + '\n';
      output += '═'.repeat(focusTitle.length) + '\n\n';
    }
    
    // Capability details
    const progress = this.getCapabilityProgress(node);
    
    // Description block with enhanced details
    output += this.enhanceDescription(node) + '\n\n';
    
    // Progress and stats
    if (useColor) {
      output += chalk.cyan.bold('Progress: ') + 
                chalk[this.getColorForProgress(progress)](`${progress}%`) + '\n';
      output += this.renderProgressBar(progress, termWidth, true) + '\n\n';
      
      output += chalk.cyan.bold('Details:') + '\n';
      output += chalk.gray(`Type: ${node.type}`) + '\n';
      output += chalk.gray(`Tasks: ${node.tasks.length}`) + '\n';
      output += chalk.gray(`Confidence: ${Math.round(node.confidence * 100)}%`) + '\n';
      output += chalk.gray(`Keywords: ${node.keywords.join(', ')}`) + '\n\n';
    } else {
      output += `Progress: ${progress}%\n`;
      output += this.renderProgressBar(progress, termWidth, false) + '\n\n';
      
      output += 'Details:\n';
      output += `Type: ${node.type}\n`;
      output += `Tasks: ${node.tasks.length}\n`;
      output += `Confidence: ${Math.round(node.confidence * 100)}%\n`;
      output += `Keywords: ${node.keywords.join(', ')}\n\n`;
    }
    
    // Find all relationships
    const directRelationships = edges.filter(
      edge => edge.source === node.id || edge.target === node.id
    );
    
    if (directRelationships.length > 0) {
      // Group by relationship type
      const relationshipsByType = new Map<string, {node: CapabilityNode, edge: CapabilityEdge, isOutgoing: boolean}[]>();
      
      for (const edge of directRelationships) {
        const isOutgoing = edge.source === node.id;
        const relatedNodeId = isOutgoing ? edge.target : edge.source;
        const relatedNode = nodeMap.get(relatedNodeId);
        
        if (relatedNode) {
          if (!relationshipsByType.has(edge.type)) {
            relationshipsByType.set(edge.type, []);
          }
          relationshipsByType.get(edge.type)!.push({
            node: relatedNode, 
            edge,
            isOutgoing
          });
        }
      }
      
      // Display relationships by type
      if (useColor) {
        output += chalk.cyan.bold('Relationships:') + '\n';
      } else {
        output += 'Relationships:\n';
      }
      
      for (const [type, relationships] of relationshipsByType.entries()) {
        const formattedType = this.formatRelationshipType(type);
        
        if (useColor) {
          output += chalk.yellow(`${formattedType}:`) + '\n';
        } else {
          output += `${formattedType}:\n`;
        }
        
        for (const rel of relationships) {
          const direction = rel.isOutgoing ? '→' : '←';
          const confidence = Math.round(rel.edge.confidence * 100);
          
          if (useColor) {
            output += `  ${direction} ${chalk.green(rel.node.name)} `;
            output += chalk.gray(`(${confidence}% confidence: ${rel.edge.description})`) + '\n';
          } else {
            output += `  ${direction} ${rel.node.name} `;
            output += `(${confidence}% confidence: ${rel.edge.description})\n`;
          }
        }
        
        output += '\n';
      }
    } else {
      if (useColor) {
        output += chalk.gray('No relationships found for this capability.') + '\n\n';
      } else {
        output += 'No relationships found for this capability.\n\n';
      }
    }
    
    // Task details
    if (useColor) {
      output += chalk.cyan.bold('Tasks:') + '\n';
    } else {
      output += 'Tasks:\n';
    }
    
    output += this.renderTaskDetails(node, useColor, termWidth);
    
    return output;
  }

  /**
   * Render task details for a capability
   * @param node The capability node
   * @param useColor Whether to use color
   * @param termWidth Width of the terminal
   * @returns Formatted task details
   */
  private renderTaskDetails(
    node: CapabilityNode,
    useColor: boolean,
    termWidth: number
  ): string {
    let output = '';
    
    // Group tasks by status
    const tasksByStatus = {
      done: [] as string[],
      'in-progress': [] as string[],
      todo: [] as string[],
      other: [] as string[],
    };
    
    // Count statuses from metadata if available
    const metadata = node.metadata || {};
    const statusCounts = metadata.statusCounts || { done: 0, 'in-progress': 0, todo: 0 };
    
    // Create task lists (limited to first 5 of each status to avoid clutter)
    if (metadata.taskTitles) {
      for (const [status, titles] of Object.entries(metadata.taskTitles)) {
        if (status in tasksByStatus) {
          tasksByStatus[status] = (titles as string[]).slice(0, 5);
        } else {
          tasksByStatus.other.push(...(titles as string[]).slice(0, 5));
        }
      }
    }
    
    // Display tasks grouped by status
    if (statusCounts.done > 0) {
      if (useColor) {
        output += `  ${chalk.green('✓')} ${chalk.gray(`Completed (${statusCounts.done}): `)}`;
        output += tasksByStatus.done.length > 0 
          ? chalk.gray(tasksByStatus.done.join(', ')) 
          : chalk.gray(`${statusCounts.done} tasks`);
        output += '\n';
      } else {
        output += `  ✓ Completed (${statusCounts.done}): `;
        output += tasksByStatus.done.length > 0 
          ? tasksByStatus.done.join(', ') 
          : `${statusCounts.done} tasks`;
        output += '\n';
      }
    }
    
    if (statusCounts['in-progress'] > 0) {
      if (useColor) {
        output += `  ${chalk.yellow('↻')} ${chalk.gray(`In progress (${statusCounts['in-progress']}): `)}`;
        output += tasksByStatus['in-progress'].length > 0 
          ? chalk.gray(tasksByStatus['in-progress'].join(', ')) 
          : chalk.gray(`${statusCounts['in-progress']} tasks`);
        output += '\n';
      } else {
        output += `  ↻ In progress (${statusCounts['in-progress']}): `;
        output += tasksByStatus['in-progress'].length > 0 
          ? tasksByStatus['in-progress'].join(', ') 
          : `${statusCounts['in-progress']} tasks`;
        output += '\n';
      }
    }
    
    if (statusCounts.todo > 0) {
      if (useColor) {
        output += `  ${chalk.red('○')} ${chalk.gray(`Todo (${statusCounts.todo}): `)}`;
        output += tasksByStatus.todo.length > 0 
          ? chalk.gray(tasksByStatus.todo.join(', ')) 
          : chalk.gray(`${statusCounts.todo} tasks`);
        output += '\n';
      } else {
        output += `  ○ Todo (${statusCounts.todo}): `;
        output += tasksByStatus.todo.length > 0 
          ? tasksByStatus.todo.join(', ') 
          : `${statusCounts.todo} tasks`;
        output += '\n';
      }
    }
    
    if (tasksByStatus.other.length > 0) {
      if (useColor) {
        output += `  ${chalk.gray('•')} ${chalk.gray('Other: ')}`;
        output += chalk.gray(tasksByStatus.other.join(', ')) + '\n';
      } else {
        output += `  • Other: ${tasksByStatus.other.join(', ')}\n`;
      }
    }
    
    return output;
  }

  /**
   * Render a progress bar with color gradients
   * @param progress Progress percentage (0-100)
   * @param width Total width of the progress bar
   * @param useColor Whether to use color
   * @returns Formatted progress bar
   */
  private renderProgressBar(
    progress: number,
    width: number,
    useColor: boolean
  ): string {
    const barWidth = Math.max(10, width - 10);
    const filledWidth = Math.floor(barWidth * progress / 100);
    const emptyWidth = barWidth - filledWidth;

    if (useColor) {
      // Instead of using a single color for the whole bar, use a gradient based on progress
      let filled = '';

      // For very low progress, use only red
      if (progress < 20) {
        filled = chalk.red('█'.repeat(filledWidth));
      }
      // For low progress, use red to yellow gradient
      else if (progress < 50) {
        const redPortion = Math.floor(filledWidth * 0.7);
        const yellowPortion = filledWidth - redPortion;
        filled = chalk.red('█'.repeat(redPortion)) + chalk.yellow('█'.repeat(yellowPortion));
      }
      // For medium progress, use yellow to cyan gradient
      else if (progress < 80) {
        const yellowPortion = Math.floor(filledWidth * 0.4);
        const cyanPortion = filledWidth - yellowPortion;
        filled = chalk.yellow('█'.repeat(yellowPortion)) + chalk.cyan('█'.repeat(cyanPortion));
      }
      // For high progress, use cyan to green gradient
      else {
        const cyanPortion = Math.floor(filledWidth * 0.3);
        const greenPortion = filledWidth - cyanPortion;
        filled = chalk.cyan('█'.repeat(cyanPortion)) + chalk.green('█'.repeat(greenPortion));
      }

      const empty = chalk.gray('░'.repeat(emptyWidth));

      // Also color the percentage based on progress level
      const coloredPercent = this.getProgressColoredText(progress, `${progress}%`);

      return `${filled}${empty} ${coloredPercent}`;
    } else {
      const filled = '█'.repeat(filledWidth);
      const empty = '░'.repeat(emptyWidth);
      return `${filled}${empty} ${progress}%`;
    }
  }

  /**
   * Apply color to text based on progress percentage
   * @param progress Progress percentage (0-100)
   * @param text Text to color
   * @returns Colored text
   */
  private getProgressColoredText(progress: number, text: string): string {
    if (progress >= 80) return chalk.green(text);
    if (progress >= 50) return chalk.cyan(text);
    if (progress >= 20) return chalk.yellow(text);
    return chalk.red(text);
  }

  /**
   * Get progress percentage for a capability
   * @param node Capability node
   * @returns Progress percentage (0-100)
   */
  private getCapabilityProgress(node: CapabilityNode): number {
    // Use pre-calculated progress if available
    if (node.metadata && typeof node.metadata.progress === 'number') {
      return node.metadata.progress;
    }
    
    // Default to 0% if no progress information
    return 0;
  }

  /**
   * Get a textual status based on progress percentage
   * @param progress Progress percentage (0-100)
   * @returns Status text
   */
  private getProgressStatus(progress: number): string {
    if (progress >= 80) return 'Complete';
    if (progress >= 50) return 'Good progress';
    if (progress >= 20) return 'Started';
    return 'Early stages';
  }

  /**
   * Get a colored status indicator based on progress
   * @param progress Progress percentage (0-100)
   * @returns Colored indicator character
   */
  private getColoredStatusIndicator(progress: number): string {
    if (progress >= 80) return chalk.green('●');
    if (progress >= 50) return chalk.cyan('●');
    if (progress >= 20) return chalk.yellow('●');
    return chalk.red('●');
  }

  /**
   * Get a color name based on progress
   * @param progress Progress percentage (0-100)
   * @returns Chalk color name
   */
  private getColorForProgress(progress: number): string {
    if (progress >= 80) return 'green';
    if (progress >= 50) return 'cyan';
    if (progress >= 20) return 'yellow';
    return 'red';
  }

  /**
   * Format a relationship type into a readable label
   * @param type Relationship type
   * @returns Formatted relationship label
   */
  private formatRelationshipType(type: string): string {
    // Handle special types
    if (type === 'depends-on') return 'Depends on';
    if (type === 'part-of') return 'Part of';
    if (type === 'similar-to') return 'Similar to';
    if (type === 'related-to') return 'Related to';
    if (type === 'extends') return 'Extends';
    if (type === 'sequenced-with') return 'Sequenced with';
    
    // Handle other types
    return type
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format a group name for display
   * @param groupName Raw group name
   * @returns Formatted group name
   */
  private formatGroupName(groupName: string): string {
    // Handle special cases
    if (groupName === 'all') return 'All Capabilities';
    if (groupName === 'domain') return 'Domains';
    if (groupName === 'feature-area') return 'Feature Areas';
    if (groupName === 'concept') return 'Concepts';
    if (groupName === 'workflow') return 'Workflows';
    
    // Handle general case
    return groupName
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Enhance a capability description with more specifics
   * @param node Capability node
   * @returns Enhanced description
   */
  private enhanceDescription(node: CapabilityNode): string {
    // Start with a standardized description format
    let description = '';

    // Get type-specific prefix
    const typeLabel = this.getTypeLabel(node.type);

    // Get task stats
    const taskCount = node.tasks.length;

    // Get status counts if available
    const metadata = node.metadata || {};
    const statusCounts = metadata.statusCounts || {};
    const doneCount = statusCounts.done || 0;
    const inProgressCount = statusCounts['in-progress'] || 0;
    const todoCount = statusCounts.todo || 0;

    // Generate a clean set of keywords without duplicates
    const uniqueKeywords = new Set(node.keywords.map(k => k.toLowerCase()));
    const cleanKeywords = Array.from(uniqueKeywords)
      .filter(k => k.length > 2) // Remove very short keywords
      .slice(0, 5);

    // Build first part of description with type and task count
    description = `${typeLabel} with ${taskCount} task${taskCount !== 1 ? 's' : ''}`;

    // Add status breakdown if we have it
    if (doneCount > 0 || inProgressCount > 0 || todoCount > 0) {
      description += ` (${doneCount} done, ${inProgressCount} in progress, ${todoCount} todo)`;
    }

    // Add focus areas with clean keywords
    if (cleanKeywords.length > 0) {
      description += `. Focus areas: ${cleanKeywords.join(', ')}`;
    }

    // Add specific details from original description if it had unique content
    const originalDescription = node.description || '';
    if (originalDescription.length > 0 &&
        !originalDescription.includes('tasks') &&
        !originalDescription.includes('focusing on') &&
        !originalDescription.toLowerCase().includes(node.name.toLowerCase())) {
      description += `. ${originalDescription}`;
    }

    return description;
  }

  /**
   * Get a human-readable label for a capability type
   * @param type The capability type
   * @returns A descriptive label
   */
  private getTypeLabel(type: string): string {
    if (type === 'domain') return 'Technical domain';
    if (type === 'feature-area') return 'Feature area';
    if (type === 'concept') return 'Project concept';
    if (type === 'workflow') return 'Work stream';
    if (type.includes('phase')) return 'Project phase';

    // Default to capitalized type
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  }

  /**
   * Get an icon for a capability category
   * @param type The capability type
   * @param name The capability name
   * @returns An appropriate icon
   */
  private getCategoryIcon(type: string, name: string): string {
    const nameLower = name.toLowerCase();

    // Technical domains
    if (nameLower.includes('api')) return '🔌';
    if (nameLower.includes('ui') || nameLower.includes('ux') || nameLower.includes('interface')) return '🖼️';
    if (nameLower.includes('frontend')) return '🖥️';
    if (nameLower.includes('backend')) return '⚙️';
    if (nameLower.includes('database') || nameLower.includes('data')) return '💾';
    if (nameLower.includes('infra') || nameLower.includes('server')) return '🏗️';
    if (nameLower.includes('security') || nameLower.includes('auth')) return '🔒';
    if (nameLower.includes('test') || nameLower.includes('qa')) return '🧪';
    if (nameLower.includes('doc') || nameLower.includes('guide')) return '📚';
    if (nameLower.includes('devops') || nameLower.includes('deploy')) return '🚀';
    if (nameLower.includes('ai') || nameLower.includes('ml')) return '🧠';
    if (nameLower.includes('analytics') || nameLower.includes('report')) return '📊';
    if (nameLower.includes('mobile') || nameLower.includes('app')) return '📱';
    if (nameLower.includes('cli') || nameLower.includes('command')) return '💻';

    // Feature types
    if (nameLower.includes('feature')) return '✨';
    if (nameLower.includes('enhancement') || nameLower.includes('improve')) return '🔧';
    if (nameLower.includes('refactor')) return '♻️';
    if (nameLower.includes('optimiz') || nameLower.includes('performance')) return '⚡';
    if (nameLower.includes('fix') || nameLower.includes('bug')) return '🐛';

    // Project aspects
    if (nameLower.includes('planning') || nameLower.includes('schedule')) return '📅';
    if (nameLower.includes('integration')) return '🔄';
    if (nameLower.includes('management')) return '📋';
    if (nameLower.includes('monitor')) return '📈';

    // Default icons based on type
    if (type === 'domain') return '🔧';
    if (type === 'feature-area') return '✨';
    if (type === 'concept') return '💡';
    if (type === 'workflow') return '🔄';
    if (type.includes('phase')) return '📅';

    // Generic fallback
    return '📦';
  }

  /**
   * Normalize capability names to ensure consistency
   * @param nodes List of capability nodes
   * @returns Nodes with normalized names
   */
  private normalizeCapabilityNames(nodes: CapabilityNode[]): CapabilityNode[] {
    return nodes.map(node => {
      let name = node.name;

      // Fix duplication like "Enhancement enhancement"
      const words = name.split(/\s+/);
      if (words.length >= 2 && words[0].toLowerCase() === words[1].toLowerCase()) {
        name = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      }

      // Ensure proper capitalization
      name = name.charAt(0).toUpperCase() + name.slice(1);

      // Handle special cases for natural sounding names
      if (name === "AI/MLs") name = "AI/ML";
      if (name === "UIs") name = "UI";
      if (name === "UXs") name = "UX";
      if (name === "UI/UXs") name = "UI/UX";
      if (name === "DevOpss") name = "DevOps";
      if (name === "APIs") name = "API";

      // For regular terms, keep singular for technical concepts, plural for activity areas
      const technicalTerms = ["Core", "API", "UI", "UX", "CLI", "Database", "Backend", "Frontend", "Infrastructure"];
      const activityAreas = ["Feature", "Enhancement", "Test", "Documentation", "Integration"];

      // Only apply pluralization to activity areas, not technical concepts
      if (words.length === 1 && !name.endsWith('s') &&
          !name.endsWith('ing') && !name.endsWith('ion')) {
        // Check if it's an activity area that should be plural
        if (activityAreas.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
          name += 's';
        }
        // Don't pluralize technical terms
        else if (!technicalTerms.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
          // For other names, use natural language plural forms
          if (name.endsWith('y')) {
            name = name.slice(0, -1) + 'ies';
          } else {
            name += 's';
          }
        }
      }

      // Remove redundant words
      name = name.replace(/\s+management$/i, '');
      name = name.replace(/\s+functionality$/i, '');

      return {...node, name};
    });
  }

  /**
   * Create hierarchical groups of capabilities based on relationships and types
   * @param nodes List of capabilities
   * @param edges List of relationships
   * @returns Map of hierarchical groups
   */
  private createHierarchicalGroups(
    nodes: CapabilityNode[],
    edges: CapabilityEdge[]
  ): Map<string, CapabilityNode[]> {
    // First attempt to group by explicit relationships
    const relationshipGroups = this.createRelationshipBasedGroups(nodes, edges);

    // If relationship-based grouping found meaningful groups, use that
    if (relationshipGroups.size > 1) {
      return relationshipGroups;
    }

    // Otherwise, fall back to domain-based grouping
    return this.createDomainBasedGroups(nodes);
  }

  /**
   * Create groups based on explicit relationships between capabilities
   */
  private createRelationshipBasedGroups(
    nodes: CapabilityNode[],
    edges: CapabilityEdge[]
  ): Map<string, CapabilityNode[]> {
    // Find parent-child relationships
    const hierarchyEdges = edges.filter(e =>
      e.type === 'part-of' || e.type === 'hierarchical' || e.type === 'depends-on'
    );

    // Create initial structure
    const hierarchy = new Map<string, {
      node: CapabilityNode,
      children: Set<string>
    }>();

    // First pass - identify parent nodes and create hierarchy
    for (const node of nodes) {
      hierarchy.set(node.id, {node, children: new Set()});
    }

    // Second pass - build parent-child relationships
    for (const edge of hierarchyEdges) {
      // For 'part-of', target is child of source
      if (edge.type === 'part-of' && hierarchy.has(edge.source) && hierarchy.has(edge.target)) {
        hierarchy.get(edge.source)!.children.add(edge.target);
      }
      // For 'depends-on', source depends on target (target is "parent" of source)
      else if (edge.type === 'depends-on' && hierarchy.has(edge.source) && hierarchy.has(edge.target)) {
        hierarchy.get(edge.target)!.children.add(edge.source);
      }
      // For others, use source as parent
      else if (hierarchy.has(edge.source) && hierarchy.has(edge.target)) {
        hierarchy.get(edge.source)!.children.add(edge.target);
      }
    }

    // Find root nodes (those with no parents)
    const childNodes = new Set<string>();
    for (const {children} of hierarchy.values()) {
      for (const childId of children) {
        childNodes.add(childId);
      }
    }

    const rootNodes = nodes.filter(n => !childNodes.has(n.id));

    // Create groups based on hierarchy
    const groups = new Map<string, CapabilityNode[]>();

    // Add each root node and its children as a group
    for (const rootNode of rootNodes) {
      const group = [rootNode];
      const children = hierarchy.get(rootNode.id)?.children || new Set();

      for (const childId of children) {
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) {
          group.push(childNode);
        }
      }

      if (group.length > 1) {
        groups.set(rootNode.name, group);
      }
    }

    // Classify remaining nodes by type
    const processedNodes = new Set<string>();

    // Mark all nodes in existing groups as processed
    for (const groupNodes of groups.values()) {
      for (const node of groupNodes) {
        processedNodes.add(node.id);
      }
    }

    // Add ungrouped nodes to a proper category
    const ungroupedNodes = nodes.filter(n => !processedNodes.has(n.id));

    if (ungroupedNodes.length > 0) {
      groups.set('Other Capabilities', ungroupedNodes);
    }

    return groups;
  }

  /**
   * Create groups based on capability domain and type
   */
  private createDomainBasedGroups(nodes: CapabilityNode[]): Map<string, CapabilityNode[]> {
    const groups = new Map<string, CapabilityNode[]>();

    // Define category mappings
    const categoryMappings: Record<string, string> = {
      // Technical domains
      'domain': 'Technical Domains',
      'api': 'Technical Domains',
      'ui': 'User Experience',
      'ux': 'User Experience',
      'frontend': 'User Experience',
      'backend': 'System Architecture',
      'data': 'System Architecture',
      'database': 'System Architecture',
      'infrastructure': 'System Architecture',
      'security': 'System Architecture',
      'devops': 'DevOps & Deployment',
      'integration': 'Integration & Testing',
      'testing': 'Integration & Testing',
      'test': 'Integration & Testing',

      // Feature areas
      'feature': 'Feature Development',
      'feature-area': 'Feature Development',
      'enhancement': 'Feature Development',
      'workflow': 'Feature Development',

      // Project aspects
      'documentation': 'Documentation & Support',
      'support': 'Documentation & Support',
      'training': 'Documentation & Support',
      'performance': 'Quality & Performance',
      'optimization': 'Quality & Performance',
      'planning': 'Project Management',
      'management': 'Project Management',
    };

    // Predefined categories in preferred order
    const orderedCategories = [
      'Feature Development',
      'User Experience',
      'System Architecture',
      'Integration & Testing',
      'Quality & Performance',
      'DevOps & Deployment',
      'Documentation & Support',
      'Technical Domains',
      'Project Management'
    ];

    // Initialize groups
    for (const category of orderedCategories) {
      groups.set(category, []);
    }

    // Categorize each node
    for (const node of nodes) {
      let category = 'Other';

      // Try to match by node type
      if (node.type in categoryMappings) {
        category = categoryMappings[node.type];
      }
      // Try to match by name
      else {
        for (const [key, mappedCategory] of Object.entries(categoryMappings)) {
          if (node.name.toLowerCase().includes(key.toLowerCase())) {
            category = mappedCategory;
            break;
          }
        }
      }

      // Add node to appropriate category
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(node);
    }

    // Remove empty categories
    for (const [category, nodes] of groups.entries()) {
      if (nodes.length === 0) {
        groups.delete(category);
      }
    }

    // If there are nodes that don't fit in any category, add them to "Other Capabilities"
    const otherNodes = nodes.filter(n => {
      for (const groupNodes of groups.values()) {
        if (groupNodes.includes(n)) {
          return false;
        }
      }
      return true;
    });

    if (otherNodes.length > 0) {
      groups.set('Other Capabilities', otherNodes);
    }

    return groups;
  }

  /**
   * Calculate overall progress across all capabilities
   * @param nodes List of capability nodes
   * @returns Overall progress percentage
   */
  private calculateOverallProgress(nodes: CapabilityNode[]): number {
    if (nodes.length === 0) return 0;
    
    // Sum up progress from all capabilities
    let totalProgress = 0;
    let nodeCount = 0;
    
    for (const node of nodes) {
      const progress = this.getCapabilityProgress(node);
      totalProgress += progress;
      nodeCount++;
    }
    
    return Math.round(totalProgress / nodeCount);
  }

  /**
   * Render an enhanced Mermaid diagram with progress indicators
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns Mermaid diagram syntax
   */
  private renderEnhancedMermaidDiagram(
    capabilityMap: CapabilityMap,
    options: EnhancedVisualizationOptions
  ): string {
    // TODO: Implement enhanced Mermaid visualization
    // For now, forward to the standard Mermaid visualization
    return this.renderMermaidDiagram(capabilityMap, options);
  }

  /**
   * Render standard Mermaid diagram (fallback)
   * @param capabilityMap The map to visualize
   * @param options Visualization options 
   * @returns Mermaid diagram syntax
   */
  private renderMermaidDiagram(
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
    const normalizedNodes = this.normalizeCapabilityNames(filteredNodes);
    
    // Build node ID map
    const nodeIdMap = new Map<string, string>();
    
    for (let i = 0; i < normalizedNodes.length; i++) {
      nodeIdMap.set(normalizedNodes[i].id, `node${i}`);
    }
    
    // Build diagram
    let diagram = 'flowchart TD\n';
    
    // Add title as comment
    const title = options.title || 'TaskMaster Capability Map';
    diagram += `%% ${title}\n`;
    
    // Add class definitions for progress-based styling
    diagram += '  classDef complete fill:#d4edda,stroke:#28a745,stroke-width:2px\n';
    diagram += '  classDef good fill:#d1ecf1,stroke:#17a2b8,stroke-width:2px\n';
    diagram += '  classDef started fill:#fff3cd,stroke:#ffc107,stroke-width:1px\n';
    diagram += '  classDef early fill:#f8d7da,stroke:#dc3545,stroke-width:1px\n';
    diagram += '  classDef default fill:#f9f9f9,stroke:#aaa,stroke-width:1px\n\n';
    
    // Add nodes, grouped by type if requested
    if (options.groupByType) {
      // Group nodes by type
      const nodeGroups = new Map<string, CapabilityNode[]>();
      
      for (const node of normalizedNodes) {
        if (!nodeGroups.has(node.type)) {
          nodeGroups.set(node.type, []);
        }
        nodeGroups.get(node.type)!.push(node);
      }
      
      // Add nodes grouped in subgraphs
      for (const [type, nodes] of nodeGroups.entries()) {
        if (nodes.length === 0) continue;
        
        // Create subgraph for type
        diagram += `  subgraph ${this.formatGroupName(type)}\n`;
        
        // Add nodes in this group
        for (const node of nodes) {
          const nodeId = nodeIdMap.get(node.id)!;
          const progress = this.getCapabilityProgress(node);
          
          let label = node.name;
          if (options.showTaskCount) {
            label += ` (${node.tasks.length})`;
          }
          if (options.showProgress) {
            label += ` [${progress}%]`;
          }
          if (options.showConfidence) {
            label += ` (${Math.round(node.confidence * 100)}%)`;
          }
          
          diagram += `    ${nodeId}["${label}"]\n`;
        }
        
        diagram += '  end\n\n';
      }
    } else if (options.hierarchicalView) {
      // Create hierarchical grouping
      const hierarchicalGroups = this.createHierarchicalGroups(normalizedNodes, filteredEdges);
      
      // Add nodes grouped in subgraphs
      for (const [groupName, nodes] of hierarchicalGroups.entries()) {
        if (nodes.length <= 1) continue; // Skip single-node groups
        
        // Create subgraph for hierarchy
        diagram += `  subgraph ${groupName}\n`;
        
        // Add nodes in this group
        for (const node of nodes) {
          const nodeId = nodeIdMap.get(node.id)!;
          const progress = this.getCapabilityProgress(node);
          
          let label = node.name;
          if (options.showTaskCount) {
            label += ` (${node.tasks.length})`;
          }
          if (options.showProgress) {
            label += ` [${progress}%]`;
          }
          
          diagram += `    ${nodeId}["${label}"]\n`;
        }
        
        diagram += '  end\n\n';
      }
    } else {
      // Add all nodes without grouping
      for (const node of normalizedNodes) {
        const nodeId = nodeIdMap.get(node.id)!;
        const progress = this.getCapabilityProgress(node);
        
        let label = node.name;
        if (options.showTaskCount) {
          label += ` (${node.tasks.length})`;
        }
        if (options.showProgress) {
          label += ` [${progress}%]`;
        }
        if (options.showConfidence) {
          label += ` (${Math.round(node.confidence * 100)}%)`;
        }
        
        diagram += `  ${nodeId}["${label}"]\n`;
      }
      
      diagram += '\n';
    }
    
    // Add edges with better labeling
    for (const edge of filteredEdges) {
      const sourceId = nodeIdMap.get(edge.source);
      const targetId = nodeIdMap.get(edge.target);
      
      if (sourceId && targetId) {
        let label = '';
        
        // Add relationship type
        if (options.showRelationshipTypes) {
          label = this.formatRelationshipType(edge.type);
        }
        
        // Add confidence if requested
        if (options.showConfidence) {
          label += label ? ` (${Math.round(edge.confidence * 100)}%)` : 
                          `${Math.round(edge.confidence * 100)}%`;
        }
        
        const labelPart = label ? `|${label}|` : '';
        diagram += `  ${sourceId} -- ${labelPart} --> ${targetId}\n`;
      }
    }
    
    // Apply classes based on progress
    for (const node of normalizedNodes) {
      const nodeId = nodeIdMap.get(node.id)!;
      const progress = this.getCapabilityProgress(node);
      
      let nodeClass = 'default';
      if (progress >= 80) nodeClass = 'complete';
      else if (progress >= 50) nodeClass = 'good';
      else if (progress >= 20) nodeClass = 'started';
      else nodeClass = 'early';
      
      diagram += `  class ${nodeId} ${nodeClass}\n`;
    }
    
    return diagram;
  }

  /**
   * Render an enhanced DOT diagram for Graphviz
   * @param capabilityMap The map to visualize 
   * @param options Visualization options
   * @returns DOT diagram syntax
   */
  private renderEnhancedDotDiagram(
    capabilityMap: CapabilityMap,
    options: EnhancedVisualizationOptions
  ): string {
    // TODO: Implement enhanced DOT visualization
    // For now, forward to standard DOT rendering
    return this.renderDotDiagram(capabilityMap, options);
  }

  /**
   * Render standard DOT diagram (fallback)
   * @param capabilityMap The map to visualize 
   * @param options Visualization options
   * @returns DOT diagram syntax
   */
  private renderDotDiagram(
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
    const normalizedNodes = this.normalizeCapabilityNames(filteredNodes);
    
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
      const hierarchicalGroups = this.createHierarchicalGroups(normalizedNodes, filteredEdges);
      
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
          const progress = this.getCapabilityProgress(node);
          
          const nodeAttrs = [
            `label="${node.name}${options.showProgress ? ` (${progress}%)` : ''}${options.showTaskCount ? ` [${node.tasks.length}]` : ''}"`,
            `tooltip="${node.description}"`,
            `fillcolor="${this.getProgressColor(progress)}"`,
            'color="#777777"',
          ];
          
          dot += `    "${node.id}" [${nodeAttrs.join(', ')}];\n`;
        }
        
        dot += '  }\n\n';
      }
    } else if (options.groupByType) {
      // Group nodes by type
      const nodeGroups = new Map<string, CapabilityNode[]>();
      
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
        dot += `    label="${this.formatGroupName(type)}"\n`;
        dot += '    style="rounded,filled"\n';
        dot += '    color="#DDDDDD"\n';
        dot += '    fillcolor="#EEEEEE"\n\n';
        
        // Add nodes in this cluster
        for (const node of nodes) {
          const progress = this.getCapabilityProgress(node);
          
          const nodeAttrs = [
            `label="${node.name}${options.showProgress ? ` (${progress}%)` : ''}${options.showTaskCount ? ` [${node.tasks.length}]` : ''}"`,
            `tooltip="${node.description}"`,
            `fillcolor="${this.getProgressColor(progress)}"`,
            'color="#777777"',
          ];
          
          dot += `    "${node.id}" [${nodeAttrs.join(', ')}];\n`;
        }
        
        dot += '  }\n\n';
      }
    } else {
      // Add all nodes without grouping
      for (const node of normalizedNodes) {
        const progress = this.getCapabilityProgress(node);
        
        const nodeAttrs = [
          `label="${node.name}${options.showProgress ? ` (${progress}%)` : ''}${options.showTaskCount ? ` [${node.tasks.length}]` : ''}"`,
          `tooltip="${node.description}"`,
          `fillcolor="${this.getProgressColor(progress)}"`,
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
        const edgeStyle = this.getEdgeStyle(edge.type, edge.confidence);
        
        // Create label with type and confidence
        let label = '';
        if (options.showRelationshipTypes) {
          label = this.formatRelationshipType(edge.type);
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

  /**
   * Get color for progress visualization in DOT format
   * @param progress Progress percentage
   * @returns Hex color code
   */
  private getProgressColor(progress: number): string {
    if (progress >= 80) return "#d4edda"; // green
    if (progress >= 50) return "#d1ecf1"; // blue
    if (progress >= 20) return "#fff3cd"; // yellow
    return "#f8d7da"; // red
  }

  /**
   * Get DOT edge style based on relationship type
   * @param type Relationship type
   * @param confidence Confidence score
   * @returns DOT edge style
   */
  private getEdgeStyle(type: string, confidence: number): string {
    // Base style attributes
    let style = 'style="solid"';
    let color = '#666666';
    let penwidth = Math.max(1, Math.min(3, confidence * 3));
    
    // Adjust style based on relationship type
    if (type === 'depends-on') {
      style = 'style="solid"';
      color = '#dc3545'; // red
    } else if (type === 'part-of') {
      style = 'style="solid"';
      color = '#28a745'; // green
    } else if (type === 'extends') {
      style = 'style="dotted"';
      color = '#6f42c1'; // purple
    } else if (type === 'related-to') {
      style = 'style="dashed"';
      color = '#007bff'; // blue
    } else if (type === 'similar-to') {
      style = 'style="dashed"';
      color = '#17a2b8'; // cyan
    } else if (type === 'sequenced-with') {
      style = 'style="solid"';
      color = '#fd7e14'; // orange
    } else if (type.includes('task-overlap')) {
      style = 'style="dashed"';
      color = '#3366CC';
    } else if (type.includes('semantic')) {
      style = 'style="dotted"';
      color = '#CC3366';
    } else if (type.includes('hierarchical')) {
      style = 'style="solid"';
      color = '#33CC66';
    } else if (type.includes('ai-inferred')) {
      style = 'style="solid"';
      color = '#9966CC';
    }
    
    return `${style}, color="${color}", penwidth=${penwidth}`;
  }

  /**
   * Render enhanced JSON output with additional metadata
   * @param capabilityMap The map to visualize
   * @param options Visualization options
   * @returns JSON string representation
   */
  private renderEnhancedJsonOutput(
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
    const normalizedNodes = this.normalizeCapabilityNames(filteredNodes);
    
    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress(normalizedNodes);
    
    // Create enhanced JSON representation
    const jsonOutput = {
      title: options.title || 'TaskMaster Capability Map',
      generated: capabilityMap.created.toISOString(),
      stats: {
        taskCount: capabilityMap.metadata.taskCount,
        capabilityCount: normalizedNodes.length,
        relationshipCount: filteredEdges.length,
        overallProgress,
        confidence: capabilityMap.metadata.confidence,
      },
      nodes: normalizedNodes.map(node => {
        const progress = this.getCapabilityProgress(node);
        const progressStatus = this.getProgressStatus(progress);
        
        return {
          id: node.id,
          name: node.name,
          type: node.type,
          description: this.enhanceDescription(node),
          confidence: node.confidence,
          taskCount: node.tasks.length,
          keywords: node.keywords,
          progress,
          progressStatus,
          metadata: node.metadata || {},
        };
      }),
      edges: filteredEdges.map(edge => {
        const sourceNode = normalizedNodes.find(n => n.id === edge.source);
        const targetNode = normalizedNodes.find(n => n.id === edge.target);
        
        return {
          source: edge.source,
          sourceName: sourceNode?.name || '',
          target: edge.target,
          targetName: targetNode?.name || '',
          type: edge.type,
          typeFormatted: this.formatRelationshipType(edge.type),
          description: edge.description,
          strength: edge.strength,
          confidence: edge.confidence,
        };
      }),
      // Add hierarchical structure
      hierarchies: this.createHierarchicalGroups(normalizedNodes, filteredEdges)
    };
    
    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Utility to wrap text to a specified width
   * @param text Text to wrap
   * @param width Maximum width in characters
   * @param indent Indentation to apply to each line
   * @returns Wrapped text
   */
  private wrapText(text: string, width: number, indent: string = ''): string {
    // Split text into words
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Process each word
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        // Word fits on current line
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        // Word doesn't fit, create new line
        if (currentLine) {
          lines.push(indent + currentLine);
        }
        currentLine = word;
      }
    }
    
    // Add final line
    if (currentLine) {
      lines.push(indent + currentLine);
    }
    
    return lines.join('\n');
  }
}