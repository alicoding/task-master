/**
 * Visual styling utilities for capability map visualization
 * 
 * This module provides utility functions for generating consistent
 * styled visual elements across all capability map visualizations.
 */

import chalk from 'chalk';

/**
 * Get a colored status indicator based on progress
 * @param progress Progress percentage (0-100)
 * @returns Colored indicator character
 */
export function getColoredStatusIndicator(progress: number): string {
  if (progress >= 80) return chalk.green('●');
  if (progress >= 50) return chalk.cyan('●');
  if (progress >= 20) return chalk.yellow('●');
  return chalk.red('●');
}

/**
 * Apply color to text based on progress percentage
 * @param progress Progress percentage (0-100)
 * @param text Text to color
 * @returns Colored text
 */
export function getProgressColoredText(progress: number, text: string): string {
  if (progress >= 80) return chalk.green(text);
  if (progress >= 50) return chalk.cyan(text);
  if (progress >= 20) return chalk.yellow(text);
  return chalk.red(text);
}

/**
 * Get DOT edge style based on relationship type
 * @param type Relationship type
 * @param confidence Confidence score
 * @returns DOT edge style
 */
export function getEdgeStyle(type: string, confidence: number): string {
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