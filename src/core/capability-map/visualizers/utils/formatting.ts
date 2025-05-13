/**
 * Formatting utility functions for capability map visualizers
 */

/**
 * Get DOT edge style based on edge type and confidence
 * @param type Edge type
 * @param confidence Confidence score (0-1)
 * @returns DOT edge style attributes
 */
export function getDotEdgeStyle(type: string, confidence: number): string {
  // Base style attributes
  let style = 'style="solid"';
  let color = '#666666';
  let penwidth = Math.max(1, Math.min(3, confidence * 3));
  
  // Adjust style based on type
  if (type.includes('task-overlap')) {
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