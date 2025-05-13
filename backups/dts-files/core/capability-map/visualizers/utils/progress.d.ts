/**
 * Progress calculation utilities for capability map visualization
 *
 * This module provides utility functions for calculating and
 * formatting progress-related information in capability maps.
 */
import { CapabilityNode } from '../../index';
/**
 * Get progress percentage for a capability
 * @param node Capability node
 * @returns Progress percentage (0-100)
 */
export declare function getCapabilityProgress(node: CapabilityNode): number;
/**
 * Get a textual status based on progress percentage
 * @param progress Progress percentage (0-100)
 * @returns Status text
 */
export declare function getProgressStatus(progress: number): string;
/**
 * Get a color name based on progress
 * @param progress Progress percentage (0-100)
 * @returns Chalk color name
 */
export declare function getColorForProgress(progress: number): string;
/**
 * Get color for progress visualization in DOT format
 * @param progress Progress percentage
 * @returns Hex color code
 */
export declare function getProgressColor(progress: number): string;
/**
 * Calculate overall progress across all capabilities
 * @param nodes List of capability nodes
 * @returns Overall progress percentage
 */
export declare function calculateOverallProgress(nodes: CapabilityNode[]): number;
