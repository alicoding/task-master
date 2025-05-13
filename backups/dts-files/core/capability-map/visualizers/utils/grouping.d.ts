/**
 * Node grouping utilities for capability map visualization
 *
 * This module provides utility functions for grouping capability nodes
 * in various organizational structures.
 */
import { CapabilityNode, CapabilityEdge } from '../../index';
/**
 * Create hierarchical groups of capabilities based on relationships and types
 * @param nodes List of capabilities
 * @param edges List of relationships
 * @returns Map of hierarchical groups
 */
export declare function createHierarchicalGroups(nodes: CapabilityNode[], edges: CapabilityEdge[]): Map<string, CapabilityNode[]>;
/**
 * Create groups based on explicit relationships between capabilities
 * @param nodes List of capabilities
 * @param edges List of relationships
 * @returns Map of relationship-based groups
 */
export declare function createRelationshipBasedGroups(nodes: CapabilityNode[], edges: CapabilityEdge[]): Map<string, CapabilityNode[]>;
/**
 * Create groups based on capability domain and type
 * @param nodes List of capabilities
 * @returns Map of domain-based groups
 */
export declare function createDomainBasedGroups(nodes: CapabilityNode[]): Map<string, CapabilityNode[]>;
