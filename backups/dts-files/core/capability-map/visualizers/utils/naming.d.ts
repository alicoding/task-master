/**
 * Naming and description utilities for capability map visualization
 *
 * This module provides utilities for normalizing capability names,
 * generating enhanced descriptions, and selecting appropriate icons.
 */
import { CapabilityNode } from '../../index';
/**
 * Normalize capability names to ensure consistency
 * @param nodes List of capability nodes
 * @returns Nodes with normalized names
 */
export declare function normalizeCapabilityNames(nodes: CapabilityNode[]): CapabilityNode[];
/**
 * Enhance a capability description with more specifics
 * @param node Capability node
 * @returns Enhanced description
 */
export declare function enhanceDescription(node: CapabilityNode): string;
/**
 * Get an icon for a capability category
 * @param type The capability type
 * @param name The capability name
 * @returns An appropriate icon
 */
export declare function getCategoryIcon(type: string, name: string): string;
