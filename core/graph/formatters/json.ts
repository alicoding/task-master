/**
 * JSON formatters for task graph visualization
 */

import { TaskWithChildren } from '../../types';

/**
 * Format tasks for machine-readable JSON
 */
export function formatHierarchyJson(
  tasks: TaskWithChildren[], 
  format: string = 'flat'
): any {
  // Different formats for different use cases
  switch (format) {
    case 'flat':
      // Convert hierarchical structure to flat array (original format)
      return formatFlatJson(tasks);
      
    case 'tree':
      // Preserve hierarchy for tree visualization
      return formatTreeJson(tasks);
      
    case 'graph':
      // Format as nodes and edges for graph visualization
      return formatGraphJson(tasks);
      
    case 'ai':
      // Rich format with all metadata for AI processing
      return formatAiJson(tasks);
      
    default:
      // Default to flat format
      return formatFlatJson(tasks);
  }
}

/**
 * Format as flat array (original format)
 */
export function formatFlatJson(tasks: TaskWithChildren[]): any[] {
  function flattenHierarchy(nodes: TaskWithChildren[]): any[] {
    let result: any[] = [];
    
    for (const node of nodes) {
      const { children, ...taskData } = node;
      result.push({
        id: taskData.id,
        title: taskData.title,
        parentId: taskData.parentId,
        status: taskData.status,
        readiness: taskData.readiness,
        tags: taskData.tags,
      });
      
      if (children && children.length > 0) {
        result = result.concat(flattenHierarchy(children));
      }
    }
    
    return result;
  }
  
  return flattenHierarchy(tasks);
}

/**
 * Format preserving tree hierarchy for visualization
 */
export function formatTreeJson(tasks: TaskWithChildren[]): any[] {
  function buildTree(nodes: TaskWithChildren[]): any[] {
    return nodes.map(node => {
      const { children, ...taskData } = node;
      
      return {
        ...taskData,
        children: children && children.length > 0 ? buildTree(children) : []
      };
    });
  }
  
  return buildTree(tasks);
}

/**
 * Format as nodes and edges for graph visualization tools
 */
export function formatGraphJson(tasks: TaskWithChildren[]): any {
  const nodes: any[] = [];
  const edges: any[] = [];
  const nodeSets: Record<string, any[]> = {};

  // Track node types for visualization
  const nodeTypes: Set<string> = new Set();
  const edgeTypes: Set<string> = new Set();

  function processNode(node: TaskWithChildren, nodeType: string = 'task') {
    // Track node type
    nodeTypes.add(nodeType);

    // Add node to the appropriate collection
    if (!nodeSets[nodeType]) {
      nodeSets[nodeType] = [];
    }

    // Create node object with enhanced data
    const nodeObj = {
      id: node.id,
      label: node.title,
      type: nodeType,
      status: node.status,
      readiness: node.readiness,
      tags: node.tags || [],
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      data: {
        metadata: node.metadata
      },
      // Add visualization properties
      style: {
        color: node.status === 'todo' ? '#f5f5f5' :
              node.status === 'in-progress' ? '#fff8dc' :
              node.status === 'done' ? '#e6ffe6' : '#f5f5f5',
        borderColor: node.readiness === 'blocked' ? '#ff6666' :
                    node.readiness === 'ready' ? '#66cc66' :
                    '#cccccc',
        borderStyle: node.readiness === 'draft' ? 'dashed' : 'solid',
        shape: 'box'
      }
    };

    // Add to nodes array
    nodes.push(nodeObj);
    nodeSets[nodeType].push(nodeObj);

    // Process children and add edges
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        // Add edge from parent to child with enhanced data
        const edgeType = 'parent-child';
        edgeTypes.add(edgeType);

        edges.push({
          id: `edge-${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: edgeType,
          label: '',
          style: {
            color: '#666666',
            width: 1,
            arrowHead: 'normal'
          }
        });

        // Process child node
        processNode(child, nodeType);
      }
    }

    // Process tags as separate nodes for advanced visualization if there are many tags
    if (node.tags && node.tags.length > 0 && node.tags.length > 5) {
      // Only create tag nodes if we have enough tags to make it interesting
      for (const tag of node.tags) {
        const tagNodeType = 'tag';
        const tagNodeId = `tag-${tag}`;

        // Only add tag node if it doesn't exist yet
        if (!nodes.some(n => n.id === tagNodeId)) {
          nodeTypes.add(tagNodeType);

          if (!nodeSets[tagNodeType]) {
            nodeSets[tagNodeType] = [];
          }

          // Create tag node
          const tagNode = {
            id: tagNodeId,
            label: tag,
            type: tagNodeType,
            style: {
              color: '#e6f7ff',
              shape: 'ellipse',
              borderColor: '#4da6ff',
              borderStyle: 'solid'
            }
          };

          nodes.push(tagNode);
          nodeSets[tagNodeType].push(tagNode);
        }

        // Create edge from task to tag
        const tagEdgeType = 'has-tag';
        edgeTypes.add(tagEdgeType);

        edges.push({
          id: `edge-${node.id}-${tagNodeId}`,
          source: node.id,
          target: tagNodeId,
          type: tagEdgeType,
          style: {
            color: '#999999',
            width: 0.5,
            style: 'dotted',
            arrowHead: 'none'
          }
        });
      }
    }
  }

  // Process all root nodes
  for (const task of tasks) {
    processNode(task);
  }

  // Prepare layout hints for different visualization libraries
  const layouts = {
    generic: {
      type: 'hierarchical',
      direction: 'TB',
      nodeSpacing: 60,
      rankSpacing: 100,
    },
    d3: {
      type: 'tree',
      width: 800,
      height: 600,
      nodeSize: 20
    },
    cytoscape: {
      name: 'dagre',
      rankDir: 'TB',
      padding: 30,
      spacingFactor: 1.5
    },
    vis: {
      hierarchical: {
        direction: 'UD',
        sortMethod: 'directed',
        nodeSpacing: 150
      }
    }
  };

  // Generate graph statistics
  const stats = generateGraphStats(nodes, edges, nodeTypes, edgeTypes);

  // Build the complete graph object with enhanced metadata
  return {
    nodes,
    edges,
    nodeTypes: Array.from(nodeTypes),
    edgeTypes: Array.from(edgeTypes),
    nodeSets,
    layouts,
    metadata: {
      type: 'graph',
      version: '2.0',
      taskCount: nodes.length,
      relationshipCount: edges.length,
      timestamp: new Date().toISOString(),
      stats
    }
  };
}

/**
 * Generate detailed graph statistics
 */
function generateGraphStats(
  nodes: any[],
  edges: any[],
  nodeTypes: Set<string>,
  edgeTypes: Set<string>
): any {
  // Count nodes by status
  const statusCounts: Record<string, number> = {};
  const readinessCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  // Track node connectivity
  const inDegree: Record<string, number> = {};
  const outDegree: Record<string, number> = {};

  // Initialize counters
  nodes.forEach(node => {
    if (node.type === 'task') {
      // Count by status
      statusCounts[node.status] = (statusCounts[node.status] || 0) + 1;

      // Count by readiness
      readinessCounts[node.readiness] = (readinessCounts[node.readiness] || 0) + 1;

      // Count tags
      if (node.tags && node.tags.length > 0) {
        for (const tag of node.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    // Initialize degree counts
    inDegree[node.id] = 0;
    outDegree[node.id] = 0;
  });

  // Count edge connections
  edges.forEach(edge => {
    outDegree[edge.source] = (outDegree[edge.source] || 0) + 1;
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  });

  // Identify isolated nodes, leaf nodes, and root nodes
  const isolated = nodes.filter(node =>
    (inDegree[node.id] || 0) === 0 && (outDegree[node.id] || 0) === 0
  ).map(node => node.id);

  const roots = nodes.filter(node =>
    (inDegree[node.id] || 0) === 0 && (outDegree[node.id] || 0) > 0
  ).map(node => node.id);

  const leaves = nodes.filter(node =>
    (inDegree[node.id] || 0) > 0 && (outDegree[node.id] || 0) === 0
  ).map(node => node.id);

  // Find node with highest connectivity
  const mostConnected = [...nodes].sort((a, b) =>
    ((inDegree[b.id] || 0) + (outDegree[b.id] || 0)) -
    ((inDegree[a.id] || 0) + (outDegree[a.id] || 0))
  )[0]?.id;

  // Generate comprehensive statistics
  return {
    nodes: {
      total: nodes.length,
      byType: Array.from(nodeTypes).reduce((acc, type) => {
        acc[type] = nodes.filter(n => n.type === type).length;
        return acc;
      }, {} as Record<string, number>),
      status: statusCounts,
      readiness: readinessCounts,
      isolated: isolated,
      roots: roots,
      leaves: leaves,
      mostConnected: mostConnected
    },
    edges: {
      total: edges.length,
      byType: Array.from(edgeTypes).reduce((acc, type) => {
        acc[type] = edges.filter(e => e.type === type).length;
        return acc;
      }, {} as Record<string, number>)
    },
    tags: Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  };
}

/**
 * Format with rich metadata for AI processing
 */
export function formatAiJson(tasks: TaskWithChildren[]): any {
  // Collect statistics about the task hierarchy
  let totalTasks = 0;
  const statusCounts: Record<string, number> = {};
  const readinessCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const depthStats = { min: Infinity, max: 0, sum: 0 };
  
  function countStats(nodes: TaskWithChildren[], depth: number = 0) {
    for (const node of nodes) {
      totalTasks++;
      
      // Count by status
      statusCounts[node.status] = (statusCounts[node.status] || 0) + 1;
      
      // Count by readiness
      readinessCounts[node.readiness] = (readinessCounts[node.readiness] || 0) + 1;
      
      // Count tags
      if (node.tags && node.tags.length > 0) {
        for (const tag of node.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
      
      // Update depth statistics
      depthStats.min = Math.min(depthStats.min, depth);
      depthStats.max = Math.max(depthStats.max, depth);
      depthStats.sum += depth;
      
      // Process children
      if (node.children && node.children.length > 0) {
        countStats(node.children, depth + 1);
      }
    }
  }
  
  // Count statistics
  countStats(tasks);
  
  // Create rich format with hierarchy and statistics
  return {
    tasks: formatTreeJson(tasks),
    statistics: {
      totalTasks,
      statusDistribution: statusCounts,
      readinessDistribution: readinessCounts,
      tags: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count })),
      hierarchyDepth: {
        min: depthStats.min !== Infinity ? depthStats.min : 0,
        max: depthStats.max,
        average: totalTasks > 0 ? depthStats.sum / totalTasks : 0
      },
      timestamp: new Date().toISOString()
    },
    schema: {
      taskProperties: ['id', 'title', 'status', 'readiness', 'tags', 'metadata', 'children'],
      statusValues: ['todo', 'in-progress', 'done'],
      readinessValues: ['draft', 'ready', 'blocked']
    }
  };
}