/**
 * Enhanced relationship discovery module for TaskMaster
 * Provides more intelligent relationship discovery without requiring AI
 */

import { Task } from '../types.ts';
import { CapabilityNode, CapabilityEdge } from './index.ts';

/**
 * Relationship types with descriptions
 */
enum RelationshipType {
  DEPENDS_ON = 'depends-on',       // One capability depends on another
  EXTENDS = 'extends',             // One capability extends or enhances another
  RELATED_TO = 'related-to',       // General relationship between capabilities
  PART_OF = 'part-of',             // One capability is a part of another
  SIMILAR_TO = 'similar-to',       // Capabilities are similar in purpose/domain
  SEQUENCED_WITH = 'sequenced-with', // Capabilities are sequentially related
}

/**
 * Discover relationships between capabilities
 * @param capabilities Array of capability nodes
 * @param tasks All tasks
 * @param options Discovery options
 * @returns Array of capability edges
 */
export function discoverEnhancedRelationships(
  capabilities: CapabilityNode[],
  tasks: Task[],
  options: any = {}
): CapabilityEdge[] {
  // Avoid processing if we have too few capabilities
  if (capabilities.length <= 1) return [];
  
  // Create edges array
  const edges: CapabilityEdge[] = [];
  
  // 1. Build necessary maps for relationship discovery
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  const capabilityTaskMap = new Map<string, Set<string>>();
  capabilities.forEach(capability => {
    capabilityTaskMap.set(capability.id, new Set(capability.tasks));
  });
  
  // Create map of tasks to capabilities
  const taskToCapabilitiesMap = new Map<string, string[]>();
  for (const capability of capabilities) {
    for (const taskId of capability.tasks) {
      if (!taskToCapabilitiesMap.has(taskId)) {
        taskToCapabilitiesMap.set(taskId, []);
      }
      taskToCapabilitiesMap.get(taskId)!.push(capability.id);
    }
  }
  
  // 2. Discover task-overlap relationships
  const taskOverlapEdges = discoverTaskOverlapRelationships(
    capabilities, 
    capabilityTaskMap,
    options
  );
  edges.push(...taskOverlapEdges);
  
  // 3. Discover semantic relationships
  const semanticEdges = discoverSemanticRelationships(
    capabilities,
    options
  );
  edges.push(...semanticEdges);
  
  // 4. Discover hierarchical relationships
  const hierarchicalEdges = discoverHierarchicalRelationships(
    capabilities,
    taskMap,
    options
  );
  edges.push(...hierarchicalEdges);
  
  // 5. Discover sequential relationships
  const sequentialEdges = discoverSequentialRelationships(
    capabilities,
    tasks,
    options
  );
  edges.push(...sequentialEdges);
  
  // 6. Apply relationship limits
  const limitedEdges = limitRelationships(edges, options);
  
  return limitedEdges;
}

/**
 * Discover relationships based on task overlap
 * @param capabilities Capability nodes
 * @param capabilityTaskMap Map of capability IDs to task sets
 * @param options Options
 * @returns Array of capability edges
 */
function discoverTaskOverlapRelationships(
  capabilities: CapabilityNode[],
  capabilityTaskMap: Map<string, Set<string>>,
  options: any
): CapabilityEdge[] {
  const edges: CapabilityEdge[] = [];
  const minOverlap = options.minOverlap || 0.25; // Minimum overlap threshold
  
  // Check each pair of capabilities
  for (let i = 0; i < capabilities.length; i++) {
    for (let j = i + 1; j < capabilities.length; j++) {
      const cap1 = capabilities[i];
      const cap2 = capabilities[j];
      
      // Skip if same capability
      if (cap1.id === cap2.id) continue;
      
      const tasks1 = capabilityTaskMap.get(cap1.id)!;
      const tasks2 = capabilityTaskMap.get(cap2.id)!;
      
      // Find overlap
      const intersection = new Set(
        [...tasks1].filter(id => tasks2.has(id))
      );
      
      // Only create relationship if meaningful overlap
      if (intersection.size > 0) {
        // Calculate overlap metrics
        const overlapRatio1 = intersection.size / tasks1.size;
        const overlapRatio2 = intersection.size / tasks2.size;
        const minRatio = Math.min(overlapRatio1, overlapRatio2);
        
        // Determine relationship type based on overlap pattern
        let relType: RelationshipType;
        let description: string;
        
        if (overlapRatio1 > 0.8 && tasks1.size < tasks2.size) {
          // Cap1 is mostly a subset of cap2
          relType = RelationshipType.PART_OF;
          description = `${cap1.name} is part of ${cap2.name}`;
        } else if (overlapRatio2 > 0.8 && tasks2.size < tasks1.size) {
          // Cap2 is mostly a subset of cap1
          relType = RelationshipType.PART_OF;
          description = `${cap2.name} is part of ${cap1.name}`;
        } else if (minRatio > minOverlap) {
          // Significant overlap
          relType = RelationshipType.RELATED_TO;
          description = `Shares ${intersection.size} tasks`;
        } else {
          // Skip if overlap is too small
          continue;
        }
        
        // Calculate confidence based on overlap size and ratio
        const confidence = 0.5 + (minRatio * 0.5);
        
        edges.push({
          source: cap1.id,
          target: cap2.id,
          type: relType,
          strength: minRatio,
          description,
          confidence,
        });
      }
    }
  }
  
  return edges;
}

/**
 * Discover relationships based on semantic similarity
 * @param capabilities Capability nodes
 * @param options Options
 * @returns Array of capability edges
 */
function discoverSemanticRelationships(
  capabilities: CapabilityNode[],
  options: any
): CapabilityEdge[] {
  const edges: CapabilityEdge[] = [];
  const minSimilarity = options.minSimilarity || 0.3;
  
  // Check each pair of capabilities
  for (let i = 0; i < capabilities.length; i++) {
    for (let j = i + 1; j < capabilities.length; j++) {
      const cap1 = capabilities[i];
      const cap2 = capabilities[j];
      
      // Skip if same capability
      if (cap1.id === cap2.id) continue;
      
      // Calculate keyword similarity
      const similarity = calculateKeywordSimilarity(
        cap1.keywords,
        cap2.keywords
      );
      
      // Only create edge if similarity is significant
      if (similarity >= minSimilarity) {
        // Determine relationship type
        let relType: RelationshipType;
        let description: string;
        
        // Find common keywords
        const commonKeywords = cap1.keywords.filter(
          kw => cap2.keywords.includes(kw)
        );
        
        if (similarity > 0.7) {
          relType = RelationshipType.SIMILAR_TO;
          description = `Very similar focus areas`;
        } else if (similarity > 0.5) {
          relType = RelationshipType.RELATED_TO;
          description = `Related concepts: ${commonKeywords.slice(0, 3).join(', ')}`;
        } else {
          relType = RelationshipType.RELATED_TO;
          description = `Some common elements`;
        }
        
        // Calculate confidence based on similarity
        const confidence = 0.4 + (similarity * 0.5);
        
        edges.push({
          source: cap1.id,
          target: cap2.id,
          type: relType,
          strength: similarity,
          description,
          confidence,
        });
      }
    }
  }
  
  return edges;
}

/**
 * Discover hierarchical relationships
 * @param capabilities Capability nodes
 * @param taskMap Map of task IDs to tasks
 * @param options Options
 * @returns Array of capability edges
 */
function discoverHierarchicalRelationships(
  capabilities: CapabilityNode[],
  taskMap: Map<string, Task>,
  options: any
): CapabilityEdge[] {
  const edges: CapabilityEdge[] = [];
  
  // Create maps for capability tasks
  const capTaskMap = new Map<string, Set<string>>();
  capabilities.forEach(cap => {
    capTaskMap.set(cap.id, new Set(cap.tasks));
  });
  
  // Create parent-child task map
  const parentChildMap = new Map<string, string[]>();
  
  // Find all parent-child relationships
  for (const [taskId, task] of taskMap.entries()) {
    if (task.parentId && taskMap.has(task.parentId)) {
      if (!parentChildMap.has(task.parentId)) {
        parentChildMap.set(task.parentId, []);
      }
      parentChildMap.get(task.parentId)!.push(taskId);
    }
  }
  
  // For each capability pair, check hierarchical relationships
  for (let i = 0; i < capabilities.length; i++) {
    for (let j = 0; j < capabilities.length; j++) {
      // Skip self comparisons
      if (i === j) continue;
      
      const cap1 = capabilities[i];
      const cap2 = capabilities[j];
      const cap1Tasks = capTaskMap.get(cap1.id)!;
      const cap2Tasks = capTaskMap.get(cap2.id)!;
      
      // Count parent-child relationships between capabilities
      let cap1ParentOfCap2Count = 0;
      let cap2ParentOfCap1Count = 0;
      
      // Check direction 1: cap1 tasks as parents of cap2 tasks
      for (const taskId of cap1Tasks) {
        if (parentChildMap.has(taskId)) {
          const childTasks = parentChildMap.get(taskId)!;
          for (const childId of childTasks) {
            if (cap2Tasks.has(childId)) {
              cap1ParentOfCap2Count++;
            }
          }
        }
      }
      
      // Check direction 2: cap2 tasks as parents of cap1 tasks
      for (const taskId of cap2Tasks) {
        if (parentChildMap.has(taskId)) {
          const childTasks = parentChildMap.get(taskId)!;
          for (const childId of childTasks) {
            if (cap1Tasks.has(childId)) {
              cap2ParentOfCap1Count++;
            }
          }
        }
      }
      
      // Create edges based on parent-child relationships
      if (cap1ParentOfCap2Count > 0 && cap1ParentOfCap2Count > cap2ParentOfCap1Count) {
        // Cap1 contains parent tasks for Cap2
        const strength = cap1ParentOfCap2Count / cap2Tasks.size;
        const confidence = 0.6 + (Math.min(1, strength) * 0.3);
        
        if (strength > 0.3 || cap1ParentOfCap2Count >= 2) {
          edges.push({
            source: cap1.id,
            target: cap2.id,
            type: RelationshipType.PART_OF,
            strength,
            description: `${cap2.name} contains sub-tasks of ${cap1.name}`,
            confidence,
          });
        }
      } else if (cap2ParentOfCap1Count > 0 && cap2ParentOfCap1Count > cap1ParentOfCap2Count) {
        // Cap2 contains parent tasks for Cap1
        const strength = cap2ParentOfCap1Count / cap1Tasks.size;
        const confidence = 0.6 + (Math.min(1, strength) * 0.3);
        
        if (strength > 0.3 || cap2ParentOfCap1Count >= 2) {
          edges.push({
            source: cap2.id,
            target: cap1.id,
            type: RelationshipType.PART_OF,
            strength,
            description: `${cap1.name} contains sub-tasks of ${cap2.name}`,
            confidence,
          });
        }
      }
    }
  }
  
  return edges;
}

/**
 * Discover sequential relationships
 * @param capabilities Capability nodes
 * @param tasks All tasks
 * @param options Options
 * @returns Array of capability edges
 */
function discoverSequentialRelationships(
  capabilities: CapabilityNode[],
  tasks: Task[],
  options: any
): CapabilityEdge[] {
  const edges: CapabilityEdge[] = [];
  
  // Skip if not enough capabilities
  if (capabilities.length <= 1) return edges;
  
  // Create maps for capability tasks
  const capTaskMap = new Map<string, Set<string>>();
  capabilities.forEach(cap => {
    capTaskMap.set(cap.id, new Set(cap.tasks));
  });
  
  // Attempt to infer sequential relationships by:
  // 1. Status patterns (todo -> in-progress -> done)
  // 2. Task numbering (1.1, 1.2, 1.3...)
  // 3. Task readiness dependencies (blocked tasks)
  
  // Group capabilities by status composition
  const statusCapMap = new Map<string, CapabilityNode[]>();
  
  for (const cap of capabilities) {
    // Count tasks by status
    const statusCounts = {
      'todo': 0,
      'in-progress': 0,
      'done': 0
    };
    
    for (const taskId of cap.tasks) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status in statusCounts) {
        statusCounts[task.status]++;
      }
    }
    
    // Determine dominant status
    let dominantStatus = 'mixed';
    const totalTasks = cap.tasks.length;
    
    if (statusCounts.todo / totalTasks > 0.7) {
      dominantStatus = 'primarily-todo';
    } else if (statusCounts['in-progress'] / totalTasks > 0.7) {
      dominantStatus = 'primarily-in-progress';
    } else if (statusCounts.done / totalTasks > 0.7) {
      dominantStatus = 'primarily-done';
    }
    
    // Add to status group
    if (!statusCapMap.has(dominantStatus)) {
      statusCapMap.set(dominantStatus, []);
    }
    statusCapMap.get(dominantStatus)!.push(cap);
  }
  
  // Create sequential edges based on status patterns
  if (statusCapMap.has('primarily-todo') && statusCapMap.has('primarily-in-progress')) {
    // Create todo -> in-progress edges
    const todoCaps = statusCapMap.get('primarily-todo')!;
    const inProgressCaps = statusCapMap.get('primarily-in-progress')!;
    
    // Find best matches based on keyword similarity
    for (const todoCap of todoCaps) {
      let bestMatch: CapabilityNode | null = null;
      let bestSimilarity = 0.3; // Minimum threshold
      
      for (const inProgressCap of inProgressCaps) {
        const similarity = calculateKeywordSimilarity(
          todoCap.keywords,
          inProgressCap.keywords
        );
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = inProgressCap;
        }
      }
      
      if (bestMatch) {
        edges.push({
          source: todoCap.id,
          target: bestMatch.id,
          type: RelationshipType.SEQUENCED_WITH,
          strength: bestSimilarity,
          description: `${todoCap.name} comes before ${bestMatch.name}`,
          confidence: 0.5 + (bestSimilarity * 0.2),
        });
      }
    }
  }
  
  if (statusCapMap.has('primarily-in-progress') && statusCapMap.has('primarily-done')) {
    // Create in-progress -> done edges
    const inProgressCaps = statusCapMap.get('primarily-in-progress')!;
    const doneCaps = statusCapMap.get('primarily-done')!;
    
    // Find best matches based on keyword similarity
    for (const inProgressCap of inProgressCaps) {
      let bestMatch: CapabilityNode | null = null;
      let bestSimilarity = 0.3; // Minimum threshold
      
      for (const doneCap of doneCaps) {
        const similarity = calculateKeywordSimilarity(
          inProgressCap.keywords,
          doneCap.keywords
        );
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = doneCap;
        }
      }
      
      if (bestMatch) {
        edges.push({
          source: inProgressCap.id,
          target: bestMatch.id,
          type: RelationshipType.SEQUENCED_WITH,
          strength: bestSimilarity,
          description: `${inProgressCap.name} comes before ${bestMatch.name}`,
          confidence: 0.5 + (bestSimilarity * 0.2),
        });
      }
    }
  }
  
  return edges;
}

/**
 * Limit relationships to prevent overcrowding
 * @param edges All discovered edges
 * @param options Options
 * @returns Limited set of edges
 */
function limitRelationships(
  edges: CapabilityEdge[],
  options: any
): CapabilityEdge[] {
  if (edges.length === 0) return edges;
  
  // Get threshold and limit options
  const confidenceThreshold = options.minEdgeConfidence || 0.5;
  const maxEdgesPerCapability = options.maxEdgesPerCapability || 5;
  const maxTotalEdges = options.maxEdges || 50;
  
  // First filter by confidence
  const confidenceFilteredEdges = edges.filter(
    edge => edge.confidence >= confidenceThreshold
  );
  
  // Sort edges by confidence
  const sortedEdges = [...confidenceFilteredEdges].sort(
    (a, b) => b.confidence - a.confidence
  );
  
  // Limit edges per capability
  const capabilityEdgeCounts = new Map<string, number>();
  const selectedEdges: CapabilityEdge[] = [];
  
  for (const edge of sortedEdges) {
    const sourceCount = capabilityEdgeCounts.get(edge.source) || 0;
    const targetCount = capabilityEdgeCounts.get(edge.target) || 0;
    
    // Skip if either capability already has too many edges
    if (sourceCount >= maxEdgesPerCapability || targetCount >= maxEdgesPerCapability) {
      continue;
    }
    
    // Add edge
    selectedEdges.push(edge);
    
    // Update counts
    capabilityEdgeCounts.set(edge.source, sourceCount + 1);
    capabilityEdgeCounts.set(edge.target, targetCount + 1);
    
    // Check if we've reached the total limit
    if (selectedEdges.length >= maxTotalEdges) {
      break;
    }
  }
  
  // Deduplicate edges (keep highest confidence for same source-target pair)
  const uniqueEdges = new Map<string, CapabilityEdge>();
  
  for (const edge of selectedEdges) {
    // Create key for both directions
    const keyForward = `${edge.source}|${edge.target}`;
    const keyReverse = `${edge.target}|${edge.source}`;
    
    // Check if we already have this edge in either direction
    if (uniqueEdges.has(keyForward)) {
      // Keep the one with higher confidence
      if (edge.confidence > uniqueEdges.get(keyForward)!.confidence) {
        uniqueEdges.set(keyForward, edge);
      }
    } else if (uniqueEdges.has(keyReverse)) {
      // Keep the one with higher confidence
      if (edge.confidence > uniqueEdges.get(keyReverse)!.confidence) {
        uniqueEdges.set(keyReverse, edge);
      }
    } else {
      // New edge
      uniqueEdges.set(keyForward, edge);
    }
  }
  
  return Array.from(uniqueEdges.values());
}

/**
 * Calculate similarity between keyword arrays
 * @param keywords1 First set of keywords
 * @param keywords2 Second set of keywords
 * @returns Similarity score between 0 and 1
 */
function calculateKeywordSimilarity(
  keywords1: string[],
  keywords2: string[]
): number {
  if (!keywords1 || !keywords2 || keywords1.length === 0 || keywords2.length === 0) {
    return 0;
  }
  
  // Convert to sets
  const set1 = new Set(keywords1.map(kw => kw.toLowerCase()));
  const set2 = new Set(keywords2.map(kw => kw.toLowerCase()));
  
  // Calculate Jaccard similarity
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}