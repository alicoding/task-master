/**
 * JSON renderer for enhanced capability map visualization
 * 
 * This module provides JSON rendering of capability maps
 * for machine processing and data interchange.
 */

import { CapabilityMap } from '../../index.ts';
import { EnhancedVisualizationOptions } from '../options.ts';
import {
  calculateOverallProgress,
  getCapabilityProgress,
  getProgressStatus,
  normalizeCapabilityNames,
  enhanceDescription,
  formatRelationshipType,
  createHierarchicalGroups
} from '../utils/index.ts';

/**
 * Render enhanced JSON output with additional metadata
 * @param capabilityMap The map to visualize
 * @param options Visualization options
 * @returns JSON string representation
 */
export function renderEnhancedJsonOutput(
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
  
  // Calculate overall progress
  const overallProgress = calculateOverallProgress(normalizedNodes);
  
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
      const progress = getCapabilityProgress(node);
      const progressStatus = getProgressStatus(progress);
      
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        description: enhanceDescription(node),
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
        typeFormatted: formatRelationshipType(edge.type),
        description: edge.description,
        strength: edge.strength,
        confidence: edge.confidence,
      };
    })
  };

  // Add hierarchical structure if appropriate
  if (options.hierarchicalView || options.groupByType) {
    const hierarchies = createHierarchicalGroups(normalizedNodes, filteredEdges);
    
    // Convert the Map to a plain object for JSON serialization
    const hierarchyGroups: Record<string, string[]> = {};
    
    for (const [groupName, nodes] of hierarchies.entries()) {
      hierarchyGroups[groupName] = nodes.map(n => n.id);
    }
    
    // Add to output
    Object.assign(jsonOutput, { hierarchyGroups });
  }
  
  return JSON.stringify(jsonOutput, null, 2);
}