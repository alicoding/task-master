/**
 * Node grouping utilities for capability map visualization
 * 
 * This module provides utility functions for grouping capability nodes
 * in various organizational structures.
 */

import { CapabilityNode, CapabilityEdge } from '../../index.ts';

/**
 * Create hierarchical groups of capabilities based on relationships and types
 * @param nodes List of capabilities
 * @param edges List of relationships
 * @returns Map of hierarchical groups
 */
export function createHierarchicalGroups(
  nodes: CapabilityNode[],
  edges: CapabilityEdge[]
): Map<string, CapabilityNode[]> {
  // First attempt to group by explicit relationships
  const relationshipGroups = createRelationshipBasedGroups(nodes, edges);

  // If relationship-based grouping found meaningful groups, use that
  if (relationshipGroups.size > 1) {
    return relationshipGroups;
  }

  // Otherwise, fall back to domain-based grouping
  return createDomainBasedGroups(nodes);
}

/**
 * Create groups based on explicit relationships between capabilities
 * @param nodes List of capabilities 
 * @param edges List of relationships
 * @returns Map of relationship-based groups
 */
export function createRelationshipBasedGroups(
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
 * @param nodes List of capabilities
 * @returns Map of domain-based groups
 */
export function createDomainBasedGroups(nodes: CapabilityNode[]): Map<string, CapabilityNode[]> {
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