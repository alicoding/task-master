import { Task } from '../../../../db/schema.js';
import { NlpService } from '../../../../core/nlp-service.js';
import { DuplicateGroup } from './utils.js';

/**
 * Find groups of duplicate tasks
 * @param tasks List of tasks to check
 * @param nlpService NLP service instance
 * @param minSimilarity Minimum similarity threshold (0-1)
 * @returns Array of duplicate groups
 */
export async function findDuplicateGroups(
  tasks: Task[], 
  nlpService: NlpService,
  minSimilarity: number
): Promise<DuplicateGroup[]> {
  const groups: DuplicateGroup[] = [];
  
  // Skip if no tasks
  if (tasks.length <= 1) {
    return groups;
  }
  
  // Calculate similarity matrix
  const similarityMatrix: number[][] = [];
  
  for (let i = 0; i < tasks.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < tasks.length; j++) {
      if (i === j) {
        // Same task, similarity is 1
        similarityMatrix[i][j] = 1;
      } else if (j < i) {
        // Already calculated this pair
        similarityMatrix[i][j] = similarityMatrix[j][i];
      } else {
        // Calculate similarity between tasks
        const similarity = await nlpService.getSimilarity(
          tasks[i].title,
          tasks[j].title
        );
        similarityMatrix[i][j] = similarity;
      }
    }
  }
  
  // Track tasks that have been grouped
  const grouped = new Set<number>();
  
  // Find clusters of similar tasks
  for (let i = 0; i < tasks.length; i++) {
    if (grouped.has(i)) continue;
    
    const groupTasks: Task[] = [tasks[i]];
    const groupIndices: number[] = [i];
    let maxGroupSimilarity = 0;
    
    for (let j = 0; j < tasks.length; j++) {
      if (i === j || grouped.has(j)) continue;
      
      // Check if this task is similar to any task in the group
      let isInGroup = false;
      for (const idx of groupIndices) {
        const similarity = similarityMatrix[idx][j];
        if (similarity >= minSimilarity) {
          isInGroup = true;
          maxGroupSimilarity = Math.max(maxGroupSimilarity, similarity);
          break;
        }
      }
      
      if (isInGroup) {
        groupTasks.push(tasks[j]);
        groupIndices.push(j);
        grouped.add(j);
      }
    }
    
    // Only keep groups with multiple tasks
    if (groupTasks.length > 1) {
      // Extract the submatrix for this group
      const groupMatrix: number[][] = [];
      for (let x = 0; x < groupIndices.length; x++) {
        groupMatrix[x] = [];
        for (let y = 0; y < groupIndices.length; y++) {
          groupMatrix[x][y] = similarityMatrix[groupIndices[x]][groupIndices[y]];
        }
      }
      
      groups.push({
        tasks: groupTasks,
        maxSimilarity: maxGroupSimilarity,
        similarityMatrix: groupMatrix
      });
    }
  }
  
  return groups;
}