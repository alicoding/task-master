import { eq, and, like, or } from 'drizzle-orm';
import { BaseTaskRepository } from './base.js';
import { tasks, Task } from '../../db/schema.js';
import { SearchFilters } from '../types.js';
import { NlpService } from '../nlp-service.js';
import { TaskSearchInfo, SimilarTask } from '../nlp/types.js';

/**
 * Search functionality for the TaskRepository
 */
export class TaskSearchRepository extends BaseTaskRepository {
  private nlpService: NlpService;
  private nlpInitialized: boolean = false;

  constructor() {
    super();
    this.nlpService = new NlpService();
  }

  /**
   * Initialize the NLP service (if not already initialized)
   * This should be called before any NLP operations
   */
  private async initializeNlp(): Promise<void> {
    if (!this.nlpInitialized) {
      await this.nlpService.train();
      this.nlpInitialized = true;
    }
  }

  /**
   * Search for tasks based on filters
   * @param filters Search filters
   * @returns Array of matching tasks
   */
  async searchTasks(filters: SearchFilters): Promise<Task[]> {
    await this.initializeNlp();
    let query = this.db.select().from(tasks);
    
    // Apply filters
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    
    if (filters.readiness) {
      conditions.push(eq(tasks.readiness, filters.readiness));
    }
    
    if (filters.tags && filters.tags.length > 0) {
      // Enhanced tag filtering for multiple tags
      conditions.push(
        and(
          ...filters.tags.map(tag => 
            like(tasks.tags, `%${tag}%`)
          )
        )
      );
    }
    
    if (filters.metadata && Object.keys(filters.metadata).length > 0) {
      // Filter by metadata properties
      for (const [key, value] of Object.entries(filters.metadata)) {
        conditions.push(
          like(tasks.metadata, `%"${key}":"${value}"%`)
        );
      }
    }
    
    if (filters.query) {
      // Parse natural language query and extract filters
      const extractedFilters = await this.nlpService.extractSearchFilters(filters.query);
      
      // Apply additional extracted filters
      if (extractedFilters.status && !filters.status) {
        conditions.push(eq(tasks.status, extractedFilters.status));
      }
      
      if (extractedFilters.readiness && !filters.readiness) {
        conditions.push(eq(tasks.readiness, extractedFilters.readiness));
      }
      
      // For any remaining query text, use enhanced search
      if (extractedFilters.query.trim()) {
        // Process the query with NLP
        const processed = await this.nlpService.processQuery(extractedFilters.query);
        
        // Create conditions for each token and stem
        const titleConditions = [
          // Original query in title or metadata
          like(tasks.title, `%${extractedFilters.query}%`),
          like(tasks.metadata, `%${extractedFilters.query}%`),
          
          // Search for each token individually
          ...processed.tokens
            .filter(token => token.length > 2)
            .map(token => 
              or(
                like(tasks.title, `%${token}%`),
                like(tasks.metadata, `%${token}%`)
              )
            ),
            
          // Search for each stem
          ...processed.stems.map(stem => 
            or(
              like(tasks.title, `%${stem}%`),
              like(tasks.metadata, `%${stem}%`)
            )
          )
        ];
        
        // At least one of the title conditions must match
        conditions.push(or(...titleConditions));
      }
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query;
  }
  
  /**
   * Get multiple next tasks to work on
   * @param filters Search filters
   * @param count Number of tasks to return
   * @returns Array of next tasks to work on
   */
  async getNextTasks(filters: SearchFilters = {}, count: number = 1): Promise<Task[]> {
    // Default to ready tasks that are in todo status
    const searchFilters: SearchFilters = {
      readiness: 'ready',
      status: 'todo',
      ...filters
    };
    
    const results = await this.searchTasks(searchFilters);
    
    // Sort by ID (which is a proxy for priority)
    results.sort((a, b) => {
      // Split IDs into parts and compare numerically
      const aParts = a.id.split('.').map(Number);
      const bParts = b.id.split('.').map(Number);
      
      // Compare each part
      for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i];
        }
      }
      
      // If all common parts are the same, shorter IDs come first
      return aParts.length - bParts.length;
    });
    
    // Return up to 'count' tasks
    return results.slice(0, count);
  }
  
  /**
   * Get the next task to work on (for backward compatibility)
   * @param filters Search filters
   * @returns The next task or undefined if none found
   */
  async getNextTask(filters: SearchFilters = {}): Promise<Task | undefined> {
    const tasks = await this.getNextTasks(filters, 1);
    return tasks[0];
  }
  
  /**
   * Find tasks with similar titles
   * @param title Title to search for similar tasks
   * @param useFuzzy Whether to use fuzzy matching (defaults to true)
   * @param threshold Similarity threshold (0-1, defaults to 0.3)
   * @returns Array of similar tasks
   */
  async findSimilarTasks(
    title: string, 
    useFuzzy: boolean = true,
    threshold: number = 0.3
  ): Promise<Task[]> {
    await this.initializeNlp();
    
    // Get all tasks
    const allTasks = await this.getAllTasks();
    
    // Map tasks for similarity search
    const searchableTasks: TaskSearchInfo[] = allTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: typeof task.metadata === 'string' 
        ? JSON.parse(task.metadata).description
        : task.metadata?.description
    }));
    
    // Use NLP service to find similar tasks
    const similarTasks: SimilarTask[] = await this.nlpService.findSimilarTasks(
      searchableTasks,
      title,
      threshold,
      useFuzzy
    );
    
    // Map back to full task objects with similarity scores
    return similarTasks.map(similar => {
      const task = allTasks.find(t => t.id === similar.id)!;
      
      // Add similarity score to metadata
      const metadata = typeof task.metadata === 'string' 
        ? JSON.parse(task.metadata) 
        : task.metadata ? { ...task.metadata } : {};
      
      metadata.similarityScore = similar.similarity;
      
      return {
        ...task,
        metadata
      };
    });
  }
  
  /**
   * Search tasks using natural language query
   * Combines NLP-based extraction with fuzzy matching
   * @param query Natural language query
   * @param useFuzzy Whether to use fuzzy matching
   * @returns Array of matching tasks with scores
   */
  async naturalLanguageSearch(query: string, useFuzzy: boolean = true): Promise<Task[]> {
    await this.initializeNlp();
    
    // Extract filters from the query
    const extractedFilters = await this.nlpService.extractSearchFilters(query);
    
    // Apply extracted filters
    const filters: SearchFilters = {
      query: extractedFilters.query
    };
    
    if (extractedFilters.status) {
      filters.status = extractedFilters.status;
    }
    
    if (extractedFilters.readiness) {
      filters.readiness = extractedFilters.readiness;
    }
    
    const filteredTasks = await this.searchTasks(filters);
    
    // If we have a refined query, use it for further similarity ranking
    if (extractedFilters.query.trim() && filteredTasks.length > 0) {
      // Map tasks for similarity search
      const searchableTasks: TaskSearchInfo[] = filteredTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: typeof task.metadata === 'string' 
          ? JSON.parse(task.metadata).description
          : task.metadata?.description
      }));
      
      // Use NLP service to rank by similarity
      const rankedTasks = await this.nlpService.findSimilarTasks(
        searchableTasks,
        extractedFilters.query,
        0.1, // Lower threshold for better recall
        useFuzzy
      );
      
      // Map back to full task objects with similarity scores
      return rankedTasks.map(similar => {
        const task = filteredTasks.find(t => t.id === similar.id)!;
        
        // Add similarity score to metadata
        const metadata = typeof task.metadata === 'string' 
          ? JSON.parse(task.metadata) 
          : task.metadata ? { ...task.metadata } : {};
        
        metadata.similarityScore = similar.similarity;
        
        return {
          ...task,
          metadata
        };
      });
    }
    
    return filteredTasks;
  }
}