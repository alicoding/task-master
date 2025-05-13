import { BaseTaskRepository } from './base';
import { TaskCreationRepository } from './creation';
import { TaskSearchRepository } from './search';
import { TaskMetadataRepository } from './metadata';
import { TaskHierarchyRepository } from './hierarchy';
import { Task } from '../../db/schema';
import { TaskInsertOptions, TaskUpdateOptions, SearchFilters, TaskOperationResult } from '../types';
/**
 * Main TaskRepository class that combines all functionality
 * This class inherits all methods from specialized repository classes
 */
export declare class TaskRepository implements Omit<BaseTaskRepository, 'db' | 'sqlite'>, Omit<TaskCreationRepository, 'db' | 'sqlite'>, Omit<TaskSearchRepository, 'db' | 'sqlite'>, Omit<TaskMetadataRepository, 'db' | 'sqlite'>, Omit<TaskHierarchyRepository, 'db' | 'sqlite'> {
    private baseRepo;
    private creationRepo;
    private searchRepo;
    private metadataRepo;
    private hierarchyRepo;
    private legacyMode;
    constructor(dbPath?: string, inMemory?: boolean, legacyMode?: boolean);
    close(): boolean;
    getTask(id: string): Promise<TaskOperationResult<any>>;
    getAllTasks(): Promise<TaskOperationResult<Task[]>>;
    updateTask(options: TaskUpdateOptions): Promise<TaskOperationResult<any>>;
    removeTask(id: string): Promise<TaskOperationResult<boolean>>;
    createTask(options: TaskInsertOptions): Promise<TaskOperationResult<any>>;
    updateTaskId(oldId: string, newId: string): Promise<TaskOperationResult<boolean>>;
    updateDependencyReferences(oldId: string, newId: string): Promise<TaskOperationResult<void>>;
    searchTasks(filters: SearchFilters): Promise<TaskOperationResult<any[]>>;
    getNextTasks(filters?: SearchFilters, count?: number): Promise<TaskOperationResult<any[]>>;
    getNextTask(filters?: SearchFilters): Promise<TaskOperationResult<any>>;
    findSimilarTasks(title: string): Promise<TaskOperationResult<any[]>>;
    updateMetadata(taskId: string, key: string, value: any, operation?: 'set' | 'remove' | 'append'): Promise<TaskOperationResult<any>>;
    getMetadata(taskId: string): Promise<any>;
    getMetadataField(taskId: string, key: string): Promise<any>;
    buildTaskHierarchy(): Promise<TaskOperationResult<import("./hierarchy").HierarchyTask[]>>;
    reorderSiblingTasksAfterDeletion(parentId: string, deletedTaskId: string): Promise<TaskOperationResult<void>>;
    reorderRootTasksAfterDeletion(deletedTaskId: string): Promise<TaskOperationResult<void>>;
    getChildTasks(taskId: string): Promise<Task[]>;
    trackFile(_filePath: string): Promise<{
        success: boolean;
        message: string;
    }>;
    associateFileWithTask(_taskId: string, _filePath: string, _relationshipType?: 'implements' | 'tests' | 'documents' | 'related', _confidence?: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getFilesForTask(_taskId: string): Promise<{
        success: boolean;
        data: any[];
        message: string;
    }>;
    getTasksForFile(_filePath: string): Promise<{
        success: boolean;
        data: any[];
        message: string;
    }>;
    getFileChangeHistory(_filePath: string): Promise<{
        success: boolean;
        data: any[];
        message: string;
    }>;
    naturalLanguageSearch(query: string, options?: any): Promise<any[]>;
}
