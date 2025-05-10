import { BaseTaskRepository } from './base.js';
import { TaskCreationRepository } from './creation.js';
import { TaskSearchRepository } from './search.js';
import { TaskMetadataRepository } from './metadata.js';
import { TaskHierarchyRepository } from './hierarchy.js';
import { RepositoryFactory } from './factory.js';
import { createDb } from '../../db/init.js';
import { Task } from '../../db/schema.js';
import {
  TaskInsertOptions,
  TaskUpdateOptions,
  SearchFilters
} from '../types.js';

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

    // For testing, we'll enable legacy mode by default
    // This ensures backward compatibility during the transition
    // Later we can gradually switch to the modern mode
    const useModernMode = !legacyMode && process.env.USE_MODERN_REPO_MODE === 'true';

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

      // Share the connection among all repositories
      this.baseRepo = new BaseTaskRepository(db, sqlite);
      this.creationRepo = new TaskCreationRepository(db, sqlite);
      this.searchRepo = new TaskSearchRepository(db, sqlite);
      this.metadataRepo = new TaskMetadataRepository(db, sqlite);
      this.hierarchyRepo = new TaskHierarchyRepository(db, sqlite);
    } else {
      // In modern mode, initialize the factory and share connections
      const { db, sqlite } = RepositoryFactory.initialize(dbPath, inMemory);

      // Create repositories with shared connection
      this.baseRepo = new BaseTaskRepository(db, sqlite);
      this.creationRepo = new TaskCreationRepository(db, sqlite);
      this.searchRepo = new TaskSearchRepository(db, sqlite);
      this.metadataRepo = new TaskMetadataRepository(db, sqlite);
      this.hierarchyRepo = new TaskHierarchyRepository(db, sqlite);
    }
  }
  
  // Base repository methods
  close() { return this.baseRepo.close(); }
  getTask(id: string) { return this.baseRepo.getTask(id); }
  getAllTasks() { return this.baseRepo.getAllTasks(); }
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
}