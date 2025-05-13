/**
 * Visual styling utilities for capability map visualization
 *
 * This module provides utility functions for generating consistent
 * styled visual elements across all capability map visualizations.
 */
/**
 * Get a colored status indicator based on progress
 * @param progress Progress percentage (0-100)
 * @returns Colored indicator character
 */
export declare function getColoredStatusIndicator(progress: number): string;
/**
 * Apply color to text based on progress percentage
 * @param progress Progress percentage (0-100)
 * @param text Text to color
 * @returns Colored text
 */
export declare function getProgressColoredText(progress: number, text: string): string;
/**
 * Get DOT edge style based on relationship type
 * @param type Relationship type
 * @param confidence Confidence score
 * @returns DOT edge style
 */
export declare function getEdgeStyle(type: string, confidence: number): string;
