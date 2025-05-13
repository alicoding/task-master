import { BaseTaskRepository } from '@/core/repository/base';
import { TaskCreationRepository } from '@/core/repository/creation';
import { TaskSearchRepository } from '@/core/repository/search';
import { TaskMetadataRepository } from '@/core/repository/metadata';
import { TaskHierarchyRepository } from '@/core/repository/hierarchy';
import { RepositoryFactory, createRepository } from '@/core/repository/factory';
import { createDb } from '@/db/init';
import { Task } from '@/core/types';
import {
  TaskInsertOptions,
  TaskUpdateOptions,
  SearchFilters,
  TaskOperationResult
} from '@/core/types';
import { EnhancedTaskRepository } from '@/core/repository/enhanced';

/**
 * Main TaskRepository class that combines all functionality
 * This class inherits all methods from specialized repository classes
 */
export class TaskRepository implements
  Omit<BaseTaskRepository, 'db' | 'sqlite' | '_db' | '_sqlite'>,
  Omit<TaskCreationRepository, 'db' | 'sqlite' | '_db' | '_sqlite'>,
  Omit<TaskSearchRepository, 'db' | 'sqlite' | '_db' | '_sqlite'>,
  Omit<TaskMetadataRepository, 'db' | 'sqlite' | '_db' | '_sqlite'>,
  Omit<TaskHierarchyRepository, 'db' | 'sqlite' | '_db' | '_sqlite'> {

  private baseRepo: BaseTaskRepository;
  private creationRepo: TaskCreationRepository;
  private searchRepo: TaskSearchRepository;
  private metadataRepo: TaskMetadataRepository;
  private hierarchyRepo: TaskHierarchyRepository;
  private legacyMode: boolean;

  // The original constructor is preserved but protected properties are now initialized first
  
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

  // Legacy methods required by TaskSearchRepository
  addTask(task: any): any { return this.creationRepo.createTask(task); }
  getNextTasksLegacy(filters: any = {}, count: number = 1): any {
    return this.searchRepo.getNextTasks(filters, count);
  }
  getNextTaskLegacy(filters: any = {}): any {
    return this.searchRepo.getNextTask(filters);
  }
  findSimilarTasksLegacy(title: string): any {
    return this.searchRepo.findSimilarTasks(title);
  }
  naturalLanguageSearchLegacy(query: string, useFuzzy: boolean = false): any {
    return this.searchRepo.naturalLanguageSearch(query, useFuzzy);
  }
  
  // Metadata repository methods
  updateMetadata(taskId: string, key: string, value: any, operation: 'set' | 'remove' | 'append' = 'set') {
    return this.metadataRepo.updateMetadata(taskId, key, value, operation);
  }
  getMetadata(taskId: string) { return this.metadataRepo.getMetadata(taskId); }
  getMetadataField(taskId: string, key: string) { return this.metadataRepo.getMetadataField(taskId, key); }
  
  // Hierarchy repository methods
  buildTaskHierarchy() { return this.hierarchyRepo.buildTaskHierarchy(); }

  // Add the Legacy methods that are missing
  buildTaskHierarchyLegacy() { return this.hierarchyRepo.buildTaskHierarchyLegacy(); }

  reorderSiblingTasksAfterDeletion(parentId: string, deletedTaskId: string) {
    return this.hierarchyRepo.reorderSiblingTasksAfterDeletion(parentId, deletedTaskId);
  }

  reorderSiblingTasksAfterDeletionLegacy(parentId: string, deletedTaskId: string) {
    return this.hierarchyRepo.reorderSiblingTasksAfterDeletionLegacy(parentId, deletedTaskId);
  }

  reorderRootTasksAfterDeletion(deletedTaskId: string) {
    return this.hierarchyRepo.reorderRootTasksAfterDeletion(deletedTaskId);
  }

  reorderRootTasksAfterDeletionLegacy(deletedTaskId: string) {
    return this.hierarchyRepo.reorderRootTasksAfterDeletionLegacy(deletedTaskId);
  }

  async getChildTasks(taskId: string): Promise<TaskOperationResult<Task[]>> {
    return this.hierarchyRepo.getChildTasks(taskId);
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
  async naturalLanguageSearch(query: string, useFuzzy: boolean = false): Promise<TaskOperationResult<Task[]>> {
    const result = await this.searchRepo.naturalLanguageSearch(query, useFuzzy);
    return result;
  }

    protected _db: any;
    protected _sqlite: any;

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

        // Set the protected properties first
        this._db = db;
        this._sqlite = sqlite;

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

        // Set the protected properties first
        this._db = db;
        this._sqlite = sqlite;

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

    getTaskLegacy(id: string): any {
        return this.baseRepo.getTask(id);
    }

    getAllTasksLegacy(): any {
        return this.baseRepo.getAllTasks();
    }

    updateTaskLegacy(task: any): any {
        return this.baseRepo.updateTask(task);
    }

    removeTaskLegacy(id: string): any {
        return this.baseRepo.removeTask(id);
    }

    createTaskLegacy(task: any): any {
        return this.creationRepo.createTask(task);
    }

    updateTaskIdLegacy(oldId: string, newId: string): any {
        return this.creationRepo.updateTaskId(oldId, newId);
    }

    updateDependencyReferencesLegacy(oldId: string, newId: string): any {
        return this.creationRepo.updateDependencyReferences(oldId, newId);
    }

    searchTasksLegacy(query: string | SearchFilters): any {
        if (typeof query === 'string') {
            return this.searchRepo.searchTasks({ query });
        } else {
            return this.searchRepo.searchTasks(query);
        }
    }

    getTaskWithChildrenLegacy(id: string): any {
        return this.hierarchyRepo.buildTaskHierarchy().then(hierarchy => {
            if (!hierarchy.success || !hierarchy.data) {
                return null;
            }
            return hierarchy.data.find((task: any) => task.id === id);
        });
    }

    getTasksAsHierarchyLegacy(): any {
        return this.hierarchyRepo.buildTaskHierarchy()
            .then(result => result.success && result.data ? result.data : []);
    }

    addTaskLegacy(task: any): any {
        return this.creationRepo.createTask(task);
    }
}