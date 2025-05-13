import { BaseTaskRepository } from './base';
import { TaskCreationRepository } from './creation';
import { TaskSearchRepository } from './search';
import { TaskMetadataRepository } from './metadata';
import { TaskHierarchyRepository } from './hierarchy';
import { RepositoryFactory, createRepository } from './factory';
import { createDb } from '../../db/init';
import { Task } from '../../db/schema';
import {
  TaskInsertOptions,
  TaskUpdateOptions,
  SearchFilters,
  TaskOperationResult
} from '../types';
import { EnhancedTaskRepository } from './enhanced';

/**
 * Main TaskRepository class that combines all functionality
 * This class inherits all methods from specialized repository classes
 */
export class TaskRepository implements
  Omit<BaseTaskRepository, 'db' | 'sqlite'>,
  Omit<TaskCreationRepository, 'db' | 'sqlite'>,
  Omit<TaskSearchRepository, 'db' | 'sqlite'>,
  Omit<TaskMetadataRepository, 'db' | 'sqlite'>,
  Omit<TaskHierarchyRepository, 'db' | 'sqlite'> {

  private baseRepo: BaseTaskRepository;
  private creationRepo: TaskCreationRepository;
  private searchRepo: TaskSearchRepository;
  private metadataRepo: TaskMetadataRepository;
  private hierarchyRepo: TaskHierarchyRepository;
  private legacyMode: boolean;

  constructor(dbPath: string = './db/taskmaster.db', inMemory: boolean = false, legacyMode: boolean = false) {
    this.legacyMode = legacyMode;

    // Determine which mode to use
    const useModernMode = !legacyMode && (process.env.USE_MODERN_REPO_MODE === 'true');
    // Determine if we should use optimizations
    const useOptimizations = process.env.USE_OPTIMIZED_REPO !== 'false';

    if (legacyMode || !useModernMode) {
      // In legacy mode or during transition, use a single connection but don't use the factory

      // Reset the factory first to prevent interference
      try {
        RepositoryFactory.reset();
      } catch (e) {
        // Ignore if not available
      }

      // Create a single connection
      const connection = createDb(dbPath, inMemory);
      const db = connection.db;
      const sqlite = connection.sqlite;

      // Use the enhanced repository if optimizations are enabled
      if (useOptimizations && !legacyMode) {
        this.baseRepo = new EnhancedTaskRepository(dbPath, inMemory);
      } else {
        this.baseRepo = new BaseTaskRepository(db, sqlite);
      }

      // Share the connection among specialized repositories
      this.creationRepo = new TaskCreationRepository(db, sqlite);
      this.searchRepo = new TaskSearchRepository(db, sqlite);
      this.metadataRepo = new TaskMetadataRepository(db, sqlite);
      this.hierarchyRepo = new TaskHierarchyRepository(db, sqlite);
    } else {
      // In modern mode, initialize the factory and share connections
      const { db, sqlite } = RepositoryFactory.initialize();

      // Use the enhanced repository if optimizations are enabled
      if (useOptimizations) {
        this.baseRepo = new EnhancedTaskRepository(dbPath, inMemory);
      } else {
        this.baseRepo = new BaseTaskRepository(db, sqlite);
      }

      // Create specialized repositories with shared connection
      this.creationRepo = new TaskCreationRepository(db, sqlite);
      this.searchRepo = new TaskSearchRepository(db, sqlite);
      this.metadataRepo = new TaskMetadataRepository(db, sqlite);
      this.hierarchyRepo = new TaskHierarchyRepository(db, sqlite);
    }
  }
  
  // Base repository methods
  close() { return this.baseRepo.close(); }
  getTask(id: string) { return this.baseRepo.getTask(id); }

  async getAllTasks(): Promise<TaskOperationResult<Task[]>> {
    return this.baseRepo.getAllTasks();
  }

  updateTask(options: TaskUpdateOptions) { return this.baseRepo.updateTask(options); }
  removeTask(id: string) { return this.baseRepo.removeTask(id); }
  
  // Creation repository methods
  createTask(options: TaskInsertOptions) { return this.creationRepo.createTask(options); }
  updateTaskId(oldId: string, newId: string) { return this.creationRepo.updateTaskId(oldId, newId); }
  updateDependencyReferences(oldId: string, newId: string) { 
    return this.creationRepo.updateDependencyReferences(oldId, newId); 
  }
  
  // Search repository methods
  searchTasks(filters: SearchFilters) { return this.searchRepo.searchTasks(filters); }
  getNextTasks(filters: SearchFilters = {}, count: number = 1) { 
    return this.searchRepo.getNextTasks(filters, count); 
  }
  getNextTask(filters: SearchFilters = {}) { return this.searchRepo.getNextTask(filters); }
  findSimilarTasks(title: string) { return this.searchRepo.findSimilarTasks(title); }
  
  // Metadata repository methods
  updateMetadata(taskId: string, key: string, value: any, operation: 'set' | 'remove' | 'append' = 'set') {
    return this.metadataRepo.updateMetadata(taskId, key, value, operation);
  }
  getMetadata(taskId: string) { return this.metadataRepo.getMetadata(taskId); }
  getMetadataField(taskId: string, key: string) { return this.metadataRepo.getMetadataField(taskId, key); }
  
  // Hierarchy repository methods
  buildTaskHierarchy() { return this.hierarchyRepo.buildTaskHierarchy(); }
  reorderSiblingTasksAfterDeletion(parentId: string, deletedTaskId: string) {
    return this.hierarchyRepo.reorderSiblingTasksAfterDeletion(parentId, deletedTaskId);
  }
  reorderRootTasksAfterDeletion(deletedTaskId: string) {
    return this.hierarchyRepo.reorderRootTasksAfterDeletion(deletedTaskId);
  }
  async getChildTasks(taskId: string): Promise<Task[]> {
    const result = await this.hierarchyRepo.getChildTasks(taskId);
    return result.success && result.data ? result.data : [];
  }
  
  // File tracking related stubs (for backward compatibility)
  // These methods will do nothing but return empty or successful results
  trackFile(_filePath: string) { 
    return Promise.resolve({ success: true, message: 'File tracking disabled' });
  }
  
  associateFileWithTask(
    _taskId: string,
    _filePath: string,
    _relationshipType: 'implements' | 'tests' | 'documents' | 'related' = 'related',
    _confidence: number = 100
  ) { 
    return Promise.resolve({ success: true, message: 'File tracking disabled' });
  }
  
  getFilesForTask(_taskId: string) { 
    return Promise.resolve({ success: true, data: [], message: 'File tracking disabled' });
  }
  
  getTasksForFile(_filePath: string) { 
    return Promise.resolve({ success: true, data: [], message: 'File tracking disabled' });
  }
  
  getFileChangeHistory(_filePath: string) {
    return Promise.resolve({ success: true, data: [], message: 'File tracking disabled' });
  }

  // Natural language search for backward compatibility
  naturalLanguageSearch(query: string, options: any = {}) {
    return this.searchRepo.searchTasks({
      query,
      ...options
    }).then(result => result.data || []);
  }
}