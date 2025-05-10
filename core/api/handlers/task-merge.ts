/**
 * Task Merge command handler
 * Merges two tasks together
 */

import { BaseCommandHandler, CommandParams } from '../command.js';
import { CommandContext } from '../context.js';
import { Task } from '../../types.js';

/**
 * Parameters for merging a task
 */
export interface MergeTaskParams extends CommandParams {
  targetId: string;       // The task to keep and update
  sourceId?: string;      // The task to merge from (optional if source data is provided)
  sourceTitle?: string;   // Alternative to sourceId - use title to find similar task
  combineTags?: boolean;  // Whether to combine tags (defaults to true)
  combineMetadata?: boolean; // Whether to combine metadata (defaults to true)
  status?: string;        // New status for the merged task (optional)
  readiness?: string;     // New readiness for the merged task (optional)
  tags?: string[];        // Additional tags to add (always combined with existing)
  metadata?: Record<string, any> | string; // Additional metadata to merge
}

/**
 * Result of task merge
 */
export interface MergeTaskResult {
  task: Task;             // The resulting merged task
  mergedFrom?: Task;      // The task that was merged in (if available)
  message: string;
}

/**
 * Merge Task command handler
 */
export class MergeTaskHandler extends BaseCommandHandler<MergeTaskParams, MergeTaskResult> {
  constructor() {
    super('merge', 'Merge two tasks together');
  }
  
  /**
   * Validate the parameters for merging tasks
   */
  validateParams(params: MergeTaskParams): true | string {
    if (!params.targetId) {
      return 'Target task ID is required';
    }
    
    if (!params.sourceId && !params.sourceTitle) {
      return 'Either source task ID or source title is required';
    }
    
    // Check status if provided
    if (params.status && !['todo', 'in-progress', 'done'].includes(params.status)) {
      return 'Status must be one of: todo, in-progress, done';
    }
    
    // Check readiness if provided
    if (params.readiness && !['draft', 'ready', 'blocked'].includes(params.readiness)) {
      return 'Readiness must be one of: draft, ready, blocked';
    }
    
    // Validate tags if provided
    if (params.tags && !Array.isArray(params.tags)) {
      return 'Tags must be an array of strings';
    }
    
    return true;
  }
  
  /**
   * Execute the merge task command
   */
  async executeCommand(
    context: CommandContext,
    params: MergeTaskParams
  ): Promise<MergeTaskResult> {
    // Get repository from context
    const repo = context.getRepository();
    
    // Set defaults
    const combineTags = params.combineTags !== false;
    const combineMetadata = params.combineMetadata !== false;
    
    // Get target task
    const targetTask = await repo.getTask(params.targetId);
    if (!targetTask) {
      throw new Error(`Target task with ID ${params.targetId} not found`);
    }
    
    // Find source task either by ID or title
    let sourceTask: Task | null = null;
    if (params.sourceId) {
      sourceTask = await repo.getTask(params.sourceId);
      if (!sourceTask) {
        throw new Error(`Source task with ID ${params.sourceId} not found`);
      }
    } else if (params.sourceTitle) {
      // Find by similarity
      const similarTasks = await repo.findSimilarTasks(params.sourceTitle);
      if (similarTasks.length > 0) {
        // Get the most similar task
        sourceTask = similarTasks[0];
      }
    }
    
    // Prepare merged data
    let mergedTags = targetTask.tags || [];
    if (combineTags && sourceTask) {
      // Combine tags (unique)
      mergedTags = [...new Set([
        ...mergedTags,
        ...(sourceTask.tags || [])
      ])];
    }
    
    // Add any additional tags
    if (params.tags) {
      mergedTags = [...new Set([
        ...mergedTags,
        ...params.tags
      ])];
    }
    
    // Prepare merged metadata
    let mergedMetadata: Record<string, any> = {
      ...(targetTask.metadata || {})
    };
    
    // Add source task metadata if needed
    if (combineMetadata && sourceTask) {
      mergedMetadata = {
        ...mergedMetadata,
        ...(sourceTask.metadata || {})
      };
    }
    
    // Parse additional metadata if it's a string
    let additionalMetadata = params.metadata;
    if (typeof additionalMetadata === 'string') {
      try {
        additionalMetadata = JSON.parse(additionalMetadata);
      } catch (e) {
        context.trace('Failed to parse metadata JSON', { error: e });
      }
    }
    
    // Add merge history
    mergedMetadata = {
      ...mergedMetadata,
      ...(additionalMetadata || {}),
      mergedFrom: sourceTask ? sourceTask.id : 'manual-merge',
      mergedAt: new Date().toISOString()
    };
    
    // If this is a dry run, return the simulated result
    if (context.isDryRunMode()) {
      const dryRunTask = {
        ...targetTask,
        status: params.status || targetTask.status,
        readiness: params.readiness || targetTask.readiness,
        tags: mergedTags,
        metadata: mergedMetadata,
        updatedAt: new Date().toISOString()
      };
      
      return {
        task: dryRunTask,
        mergedFrom: sourceTask,
        message: 'Dry run - tasks would be merged'
      };
    }
    
    // Perform the merge by updating the target task
    const updatedTask = await repo.updateTask({
      id: targetTask.id,
      status: params.status || targetTask.status,
      readiness: params.readiness || targetTask.readiness,
      tags: mergedTags,
      metadata: mergedMetadata
    });
    
    return {
      task: updatedTask,
      mergedFrom: sourceTask,
      message: 'Tasks merged successfully'
    };
  }
}