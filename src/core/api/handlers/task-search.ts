/**
 * Search Task command handler
 * Searches for tasks based on various criteria
 */

import { BaseCommandHandler, CommandParams } from '@/core/api/command';
import { CommandContext } from '@/core/api/context';
import { Task } from '@/core/types';

/**
 * Parameters for searching tasks
 */
export interface SearchTaskParams extends CommandParams {
  query?: string;
  status?: string;
  readiness?: string;
  tags?: string[];
  tag?: string;
  parentId?: string;
  metadata?: Record<string, any>;
  natural?: boolean;
  fuzzy?: boolean;
  limit?: number;
}

/**
 * Search result with additional metadata
 */
export interface SearchTasksResult {
  tasks: Task[];
  total: number;
  query: string | null;
  filters: Record<string, any>;
}

/**
 * Search Tasks command handler
 */
export class SearchTaskHandler extends BaseCommandHandler<SearchTaskParams, SearchTasksResult> {
  constructor() {
    super('search', 'Search for tasks');
  }
  
  /**
   * Validate the parameters for searching tasks
   */
  validateParams(params: SearchTaskParams): true | string {
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
    
    // Validate limit if provided
    if (params.limit !== undefined && (typeof params.limit !== 'number' || params.limit <= 0)) {
      return 'Limit must be a positive number';
    }
    
    return true;
  }
  
  /**
   * Execute the search tasks command
   */
  async executeCommand(
    context: CommandContext,
    params: SearchTaskParams
  ): Promise<SearchTasksResult> {
    // Get repository from context
    const repo = context.getRepository();
    
    // Normalize parameters
    const query = params.query || '';
    const tags = params.tags || [];
    
    // Add single tag to tags array if provided
    if (params.tag && !tags.includes(params.tag)) {
      tags.push(params.tag);
    }
    
    // Build search criteria
    const searchCriteria = {
      query,
      status: params.status,
      readiness: params.readiness,
      tags: tags.length > 0 ? tags : undefined,
      parentId: params.parentId,
      metadata: params.metadata,
      natural: params.natural !== false, // Default to true
      fuzzy: params.fuzzy === true,      // Default to false
      limit: params.limit || 100
    };
    
    // Trace search criteria
    context.trace('Searching with criteria', searchCriteria);
    
    // Perform the search
    let results: Task[];
    
    if (query && (params.natural || params.fuzzy)) {
      // Use natural language search if enabled
      results = await repo.naturalLanguageSearch(query, {
        status: params.status,
        readiness: params.readiness,
        tags: tags.length > 0 ? tags : undefined,
        parentId: params.parentId,
        metadata: params.metadata,
        limit: params.limit,
        useFuzzy: params.fuzzy === true
      });
    } else {
      // Use standard search
      results = await repo.searchTasks(searchCriteria);
    }
    
    // Return the results with metadata
    return {
      tasks: results,
      total: results.length,
      query: query || null,
      filters: {
        status: params.status,
        readiness: params.readiness,
        tags: tags.length > 0 ? tags : null,
        parentId: params.parentId,
        metadata: params.metadata,
        natural: params.natural !== false,
        fuzzy: params.fuzzy === true
      }
    };
  }
}