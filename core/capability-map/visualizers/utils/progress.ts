/**
 * Progress calculation utilities for capability map visualization
 * 
 * This module provides utility functions for calculating and 
 * formatting progress-related information in capability maps.
 */

import { CapabilityNode } from '../../index.ts';

/**
 * Get progress percentage for a capability
 * @param node Capability node
 * @returns Progress percentage (0-100)
 */
export function getCapabilityProgress(node: CapabilityNode): number {
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
export function getProgressStatus(progress: number): string {
  if (progress >= 80) return 'Complete';
  if (progress >= 50) return 'Good progress';
  if (progress >= 20) return 'Started';
  return 'Early stages';
}

/**
 * Get a color name based on progress
 * @param progress Progress percentage (0-100)
 * @returns Chalk color name
 */
export function getColorForProgress(progress: number): string {
  if (progress >= 80) return 'green';
  if (progress >= 50) return 'cyan';
  if (progress >= 20) return 'yellow';
  return 'red';
}

/**
 * Get color for progress visualization in DOT format
 * @param progress Progress percentage
 * @returns Hex color code
 */
export function getProgressColor(progress: number): string {
  if (progress >= 80) return "#d4edda"; // green
  if (progress >= 50) return "#d1ecf1"; // blue
  if (progress >= 20) return "#fff3cd"; // yellow
  return "#f8d7da"; // red
}

/**
 * Calculate overall progress across all capabilities
 * @param nodes List of capability nodes
 * @returns Overall progress percentage
 */
export function calculateOverallProgress(nodes: CapabilityNode[]): number {
  if (nodes.length === 0) return 0;
  
  // Sum up progress from all capabilities
  let totalProgress = 0;
  let nodeCount = 0;
  
  for (const node of nodes) {
    const progress = getCapabilityProgress(node);
    totalProgress += progress;
    nodeCount++;
  }
  
  return Math.round(totalProgress / nodeCount);
}