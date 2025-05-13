/**
 * Text-based renderer for enhanced capability map visualization
 * 
 * This module provides text-based rendering of capability maps
 * with detailed formatting and structure.
 */

import chalk from 'chalk';
import { CapabilityMap, CapabilityNode, CapabilityEdge } from '@/core/capability-map/index';
import { EnhancedVisualizationOptions } from '@/core/capability-map/visualizers/options';
import {
  calculateOverallProgress,
  getCapabilityProgress,
  getProgressStatus,
  formatGroupName,
  getColorForProgress,
  getColoredStatusIndicator,
  wrapText,
  normalizeCapabilityNames,
  enhanceDescription,
  getCategoryIcon,
  createHierarchicalGroups, 
  renderProgressBar
} from '@/core/capability-map/visualizers/utils/index';

/**
 * Render enhanced text visualization with progress indicators and better formatting
 * @param capabilityMap The map to visualize
 * @param options Visualization options
 * @returns Enhanced text visualization
 */
export function renderEnhancedTextVisualization(
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
  const normalizedNodes = normalizeCapabilityNames(filteredNodes);
  
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
    const overallProgress = calculateOverallProgress(normalizedNodes);

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
        output += renderProgressBar(overallProgress, termWidth, useColor) + '\n\n';
      }
    } else {
      output += statsBlock.join('\n') + '\n\n';
      
      // Add a progress bar for overall progress
      if (showProgress) {
        output += renderProgressBar(overallProgress, termWidth, false) + '\n\n';
      }
    }
  }
  
  // Focus on a specific capability if requested
  if (options.focusCapability) {
    const focusedNode = normalizedNodes.find(n => 
      n.name.toLowerCase() === options.focusCapability?.toLowerCase()
    );
    
    if (focusedNode) {
      output += renderFocusedCapability(
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
    nodeGroups = createHierarchicalGroups(normalizedNodes, filteredEdges);
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
      const groupHeader = `── ${formatGroupName(type)} ─${'─'.repeat(Math.max(0, termWidth - type.length - 10))}`;
      
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
      const progressA = getCapabilityProgress(a);
      const progressB = getCapabilityProgress(b);
      return progressB - progressA;
    });
    
    // Display each node
    for (const node of sortedNodes) {
      let nodeText = '';
      const progress = getCapabilityProgress(node);
      const progressStatus = getProgressStatus(progress);
      
      // Get status indicator
      const statusIndicator = useColor 
        ? getColoredStatusIndicator(progress) 
        : '●';
      
      // Get category icon
      const icon = getCategoryIcon(node.type, node.name);

      // Node header
      if (useColor) {
        const color = getColorForProgress(progress);
        nodeText += chalk[color].bold(`${icon} ${statusIndicator} ${node.name}`);

        if (showConfidence) {
          nodeText += chalk.gray(` (${Math.round(node.confidence * 100)}%)`);
        }

        if (showNodeTypes) {
          nodeText += chalk.blue(` [${node.type}]`);
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
          nodeText += ` [${node.type}]`;
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
        output += '  ' + renderProgressBar(progress, termWidth - 4, useColor) + '\n';
      }
      
      // Node description - more specific than before
      if (node.description) {
        const enhancedNodeDescription = enhanceDescription(node);
        const wrappedDescription = wrapText(enhancedNodeDescription, termWidth - 4, '  ');
        
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
        if (showRelationshipTypes && relationshipsByType.size > 0) {
          for (const [type, relationships] of relationshipsByType.entries()) {
            const relatedNames = relationships.map(r => r.node.name);
            
            if (useColor) {
              output += chalk.cyan(`  Related (${type}): ${relatedNames.join(', ')}`) + '\n';
            } else {
              output += `  Related (${type}): ${relatedNames.join(', ')}` + '\n';
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
        output += renderTaskDetails(node, useColor, termWidth);
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
    output += chalk.green(('●' as string)) + chalk.gray((' Complete (>80%)   ' as string));
    output += chalk.cyan(('●' as string)) + chalk.gray((' Good progress (50-80%)   ' as string));
    output += chalk.yellow(('●' as string)) + chalk.gray((' Started (20-50%)   ' as string));
    output += chalk.red(('●' as string)) + chalk.gray((' Early stages (<20%)' as string)) + '\n';

    // Common capability types
    output += chalk.bold('Types:     ');
    output += '💻 ' + chalk.gray(('CLI   ' as string));
    output += '🧠 ' + chalk.gray(('AI/ML   ' as string));
    output += '🧪 ' + chalk.gray(('Testing   ' as string));
    output += '✨ ' + chalk.gray(('Feature   ' as string));
    output += '🔧 ' + chalk.gray(('Enhancement   ' as string));
    output += '📦 ' + chalk.gray(('Other' as string)) + '\n';

    // Relationship types if used
    if (options.showRelationshipTypes) {
      output += chalk.bold('Relations: ');
      output += chalk.gray(('part-of: hierarchy   ' as string));
      output += chalk.gray(('depends-on: dependency   ' as string));
      output += chalk.gray(('related-to: association   ' as string));
      output += chalk.gray(('similar-to: similarity' as string)) + '\n';
    }

    output += chalk.gray(('Generated automatically by TaskMaster capability analysis' as string)) + '\n';
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
export function renderFocusedCapability(
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
  const progress = getCapabilityProgress(node);
  
  // Description block with enhanced details
  output += enhanceDescription(node) + '\n\n';
  
  // Progress and stats
  if (useColor) {
    output += chalk.cyan.bold('Progress: ') + 
              chalk[getColorForProgress(progress)](`${progress}%`) + '\n';
    output += renderProgressBar(progress, termWidth, true) + '\n\n';
    
    output += chalk.cyan.bold('Details:') + '\n';
    output += chalk.gray(`Type: ${node.type}`) + '\n';
    output += chalk.gray(`Tasks: ${node.tasks.length}`) + '\n';
    output += chalk.gray(`Confidence: ${Math.round(node.confidence * 100)}%`) + '\n';
    output += chalk.gray(`Keywords: ${node.keywords.join(', ')}`) + '\n\n';
  } else {
    output += `Progress: ${progress}%\n`;
    output += renderProgressBar(progress, termWidth, false) + '\n\n';
    
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
      if (useColor) {
        output += chalk.yellow(`${type}:`) + '\n';
      } else {
        output += `${type}:\n`;
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
      output += chalk.gray(('No relationships found for this capability.' as string)) + '\n\n';
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
  
  output += renderTaskDetails(node, useColor, termWidth);
  
  return output;
}

/**
 * Render task details for a capability
 * @param node The capability node
 * @param useColor Whether to use color
 * @param termWidth Width of the terminal
 * @returns Formatted task details
 */
export function renderTaskDetails(
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
      output += `  ${chalk.green(('✓' as string))} ${chalk.gray(`Completed (${statusCounts.done}): `)}`;
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
      output += `  ${chalk.yellow(('↻' as string))} ${chalk.gray(`In progress (${statusCounts['in-progress']}): `)}`;
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
      output += `  ${chalk.red(('○' as string))} ${chalk.gray(`Todo (${statusCounts.todo}): `)}`;
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
      output += `  ${chalk.gray(('•' as string))} ${chalk.gray(('Other: ' as string))}`;
      output += chalk.gray(tasksByStatus.other.join(', ')) + '\n';
    } else {
      output += `  • Other: ${tasksByStatus.other.join(', ')}\n`;
    }
  }
  
  return output;
}